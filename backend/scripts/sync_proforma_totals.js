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

    console.log('=== ACTUALIZACIÓN DE TOTALES EN TABLA PROFORMAS ===');
    console.log(`Modo: ${isExecute ? 'EJECUCIÓN REAL (EXECUTE)' : 'SIMULACIÓN (DRY RUN)'}\n`);

    // Find all proformas where proformas.total != SUM(proforma_detalle.total)
    const discQuery = await client.query(`
        WITH pd_sum AS (
            SELECT "proformaId", 
                   COUNT(*) AS item_count,
                   SUM(CAST(total AS NUMERIC)) AS sum_pd_total
            FROM proforma_detalle
            GROUP BY "proformaId"
        )
        SELECT p.id, p."pacienteId", p.numero, p.total AS proforma_total_actual,
               pds.item_count,
               pds.sum_pd_total AS nuevo_total_calculado,
               (CAST(p.total AS NUMERIC) - pds.sum_pd_total) AS diferencia
        FROM proformas p
        JOIN pd_sum pds ON pds."proformaId" = p.id
        WHERE ABS(CAST(p.total AS NUMERIC) - pds.sum_pd_total) > 0.01
        ORDER BY p.id;
    `);

    console.log(`Total de proformas con discrepancia a actualizar: ${discQuery.rows.length}\n`);

    // Check specific impact on Patient 1129 Proforma #4 (ID 6446)
    const p1129Prof4 = discQuery.rows.find(r => r.pacienteId === 1129 && r.numero === 4);
    if (p1129Prof4) {
        console.log('=== CASO PACIENTE 1129 PRESUPUESTO #4 ===');
        console.log(`Total guardado actualmente en proformas: Bs ${p1129Prof4.proforma_total_actual}`);
        console.log(`Sumatoria real de ítems en proforma_detalle: Bs ${p1129Prof4.nuevo_total_calculado}`);
        console.log(`Diferencia a corregir: Bs ${p1129Prof4.diferencia}\n`);
    }

    console.log('Muestra de las primeras 10 proformas a actualizar:');
    console.table(discQuery.rows.slice(0, 10).map(r => ({
        proformaId: r.id,
        pacienteId: r.pacienteId,
        numero: r.numero,
        totalActual: r.proforma_total_actual,
        nuevoTotalSumatoria: r.nuevo_total_calculado,
        diferencia: r.diferencia
    })));

    if (isExecute && discQuery.rows.length > 0) {
        console.log('\nEjecutando actualización masiva en la tabla proformas...');
        await client.query('BEGIN');
        try {
            const updateRes = await client.query(`
                WITH pd_sum AS (
                    SELECT "proformaId", SUM(CAST(total AS NUMERIC)) AS sum_pd_total
                    FROM proforma_detalle
                    GROUP BY "proformaId"
                )
                UPDATE proformas p
                SET total = pds.sum_pd_total
                FROM pd_sum pds
                WHERE pds."proformaId" = p.id
                  AND ABS(CAST(p.total AS NUMERIC) - pds.sum_pd_total) > 0.01;
            `);

            console.log(`\nÉXITO: Se actualizaron ${updateRes.rowCount} registros en la tabla proformas!`);
            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Error al actualizar proformas:', err);
        }
    } else if (!isExecute) {
        console.log('\nPara aplicar la actualización real en la base de datos, ejecuta el script con --execute');
    }

    await client.end();
}

main().catch(console.error);
