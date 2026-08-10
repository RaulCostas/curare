const { Client } = require('pg');

const isExecute = process.argv.includes('--execute');

async function main() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5433'),
        database: process.env.DB_NAME || 'curare',
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgrespg',
    });

    await client.connect();

    console.log(`=== CORRECCIÓN DE REGISTROS DE HISTORIA CLÍNICA REPETIDOS COMO 'TERMINADO' ===`);
    console.log(`Modo: ${isExecute ? 'EJECUCIÓN REAL (EXECUTE)' : 'SIMULACIÓN (DRY RUN)'}\n`);

    // Get all duplicate terminado row IDs using window functions
    const dupsQuery = await client.query(`
        WITH duplicate_pd AS (
            SELECT id,
                   "proformaDetalleId",
                   "estadoTratamiento",
                   ROW_NUMBER() OVER (
                       PARTITION BY "proformaDetalleId"
                       ORDER BY fecha DESC, id DESC
                   ) AS rn
            FROM historia_clinica
            WHERE "proformaDetalleId" IS NOT NULL
              AND LOWER("estadoTratamiento") = 'terminado'
        ),
        duplicate_no_pd AS (
            SELECT id,
                   "proformaId",
                   LOWER(TRIM(tratamiento)) AS trat,
                   LOWER(TRIM(COALESCE(pieza, ''))) AS pz,
                   "estadoTratamiento",
                   ROW_NUMBER() OVER (
                       PARTITION BY "proformaId", LOWER(TRIM(tratamiento)), LOWER(TRIM(COALESCE(pieza, '')))
                       ORDER BY fecha DESC, id DESC
                   ) AS rn
            FROM historia_clinica
            WHERE "proformaId" IS NOT NULL
              AND "proformaDetalleId" IS NULL
              AND LOWER("estadoTratamiento") = 'terminado'
              AND TRIM(COALESCE(tratamiento, '')) != ''
        )
        SELECT id FROM duplicate_pd WHERE rn > 1
        UNION
        SELECT id FROM duplicate_no_pd WHERE rn > 1;
    `);

    const idsToDemote = dupsQuery.rows.map(r => r.id);

    console.log(`Total de registros intermedios en historia_clinica que cambiarán de 'terminado' a 'no terminado': ${idsToDemote.length}`);

    // Inspect impact on patient 1129 proforma 5422
    const p1129HCBefore = await client.query(`
        SELECT hc.id, hc."proformaId", hc."proformaDetalleId", hc.fecha, hc.tratamiento, hc.pieza, hc."estadoTratamiento"
        FROM historia_clinica hc
        WHERE hc."proformaId" = 5422 AND hc.id = ANY($1::int[]);
    `, [idsToDemote]);

    console.log(`\n=== IMPACTO EN PACIENTE 1129 (PROFORMA ID 5422) ===`);
    console.log(`Filas de sesiones intermedias de Paciente 1129 que cambiarán a 'no terminado': ${p1129HCBefore.rows.length}`);
    console.table(p1129HCBefore.rows.map(r => ({
        id: r.id,
        fecha: r.fecha.toISOString().split('T')[0],
        tratamiento: r.tratamiento,
        pieza: r.pieza,
        proformaDetalleId: r.proformaDetalleId
    })));

    if (isExecute && idsToDemote.length > 0) {
        console.log('\nEjecutando actualización en PostgreSQL...');
        await client.query('BEGIN');
        try {
            const updateRes = await client.query(`
                UPDATE historia_clinica
                SET "estadoTratamiento" = 'no terminado'
                WHERE id = ANY($1::int[]);
            `, [idsToDemote]);

            console.log(`\nÉXITO: Se actualizaron ${updateRes.rowCount} registros en historia_clinica de 'terminado' a 'no terminado'.`);
            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Error al actualizar, se realizó ROLLBACK:', err);
        }
    } else if (!isExecute) {
        console.log('\nPara ejecutar la actualización real en la BD, corre el script con --execute');
    }

    await client.end();
}

main().catch(console.error);
