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

    // Check proformas WITH items in proforma_detalle
    const res = await client.query(`
        WITH pd_sum AS (
            SELECT "proformaId", 
                   COUNT(*) AS item_count,
                   SUM(CAST(total AS NUMERIC)) AS sum_pd_total
            FROM proforma_detalle
            GROUP BY "proformaId"
        )
        SELECT p.id, p."pacienteId", p.numero, p.total AS proforma_total,
               pds.item_count,
               pds.sum_pd_total,
               (CAST(p.total AS NUMERIC) - pds.sum_pd_total) AS diff
        FROM proformas p
        JOIN pd_sum pds ON pds."proformaId" = p.id
        WHERE ABS(CAST(p.total AS NUMERIC) - pds.sum_pd_total) > 0.01
        ORDER BY ABS(CAST(p.total AS NUMERIC) - pds.sum_pd_total) DESC;
    `);

    console.log(`Proformas WITH proforma_detalle items that have discrepancy > 0.01: ${res.rows.length}`);
    console.log('\nSample discrepancies (first 20):');
    console.table(res.rows.slice(0, 20));

    await client.end();
}

main().catch(console.error);
