const { Client } = require('pg');

async function main() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5433'),
        database: process.env.DB_NAME || 'curare',
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgrespg',
    });

    await client.connect();

    console.log('=== PRUEBA DE REGLA PROFUNDA EN PACIENTE 1129 ===\n');

    // Rule: Duplicate terminated rows sharing (proformaDetalleId, LOWER(TRIM(COALESCE(pieza, ''))))
    const dupsQuery = await client.query(`
        WITH duplicate_pd_exact_pieza AS (
            SELECT id,
                   "proformaDetalleId",
                   LOWER(TRIM(COALESCE(pieza, ''))) AS pz,
                   "estadoTratamiento",
                   ROW_NUMBER() OVER (
                       PARTITION BY "proformaDetalleId", LOWER(TRIM(COALESCE(pieza, '')))
                       ORDER BY fecha DESC, id DESC
                   ) AS rn
            FROM historia_clinica
            WHERE "proformaDetalleId" IS NOT NULL
              AND LOWER("estadoTratamiento") = 'terminado'
        ),
        duplicate_no_pd_exact_pieza AS (
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
        SELECT id FROM duplicate_pd_exact_pieza WHERE rn > 1
        UNION
        SELECT id FROM duplicate_no_pd_exact_pieza WHERE rn > 1;
    `);

    const idsToDemote = dupsQuery.rows.map(r => r.id);

    console.log(`Total DB-wide rows to demote under deep exact-pieza rule: ${idsToDemote.length}`);

    // Check patient 1129 impact
    const p1129HC = await client.query(`
        SELECT hc.id, hc.fecha, hc.tratamiento, hc.pieza, hc."estadoTratamiento", hc."proformaDetalleId"
        FROM historia_clinica hc
        WHERE hc."pacienteId" = 1129 AND hc.id = ANY($1::int[]);
    `, [idsToDemote]);

    console.log(`\nFilas de Paciente 1129 que cambiarán de 'terminado' a 'no terminado': ${p1129HC.rows.length}`);
    console.table(p1129HC.rows.map(r => ({ id: r.id, fecha: r.fecha.toISOString().split('T')[0], tratamiento: r.tratamiento, pieza: r.pieza, pdId: r.proformaDetalleId })));

    await client.end();
}

main().catch(console.error);
