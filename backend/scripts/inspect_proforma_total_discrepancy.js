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

    console.log('=== INSPECTING PATIENT 1129 PROFORMA #4 DISCREPANCY ===\n');

    // Find proforma #4 for patient 1129
    const profRes = await client.query(`
        SELECT id, "pacienteId", numero, fecha, total
        FROM proformas
        WHERE "pacienteId" = 1129 AND numero = 4;
    `);

    console.log('Proforma Record in proformas table:');
    console.table(profRes.rows);

    if (profRes.rows.length === 0) {
        await client.end();
        return;
    }

    const proformaId = profRes.rows[0].id;

    // Fetch proforma_detalle items
    const pdRes = await client.query(`
        SELECT pd.id, a.detalle AS tratamiento, pd.piezas, pd.cantidad, pd."precioUnitario", pd."subTotal", pd.descuento, pd.total
        FROM proforma_detalle pd
        LEFT JOIN arancel a ON a.id = pd."arancelId"
        WHERE pd."proformaId" = $1
        ORDER BY pd.id;
    `, [proformaId]);

    console.log(`\nProforma Detalle Items for proformaId = ${proformaId}:`);
    console.table(pdRes.rows);

    const sumPdTotal = pdRes.rows.reduce((acc, r) => acc + parseFloat(r.total || '0'), 0);
    console.log(`\nProforma Total in proformas table: ${profRes.rows[0].total}`);
    console.log(`Sum of proforma_detalle.total: ${sumPdTotal}`);
    console.log(`Difference: ${parseFloat(profRes.rows[0].total) - sumPdTotal}`);

    // DB-wide inspection of discrepancies
    console.log('\n=== DB-WIDE DISCREPANCY INSPECTION ===');
    const discRes = await client.query(`
        WITH pd_sum AS (
            SELECT "proformaId", SUM(CAST(total AS NUMERIC)) AS sum_pd_total
            FROM proforma_detalle
            GROUP BY "proformaId"
        )
        SELECT p.id, p."pacienteId", p.numero, p.total AS proforma_total,
               COALESCE(pds.sum_pd_total, 0) AS sum_pd_total,
               (CAST(p.total AS NUMERIC) - COALESCE(pds.sum_pd_total, 0)) AS diff
        FROM proformas p
        LEFT JOIN pd_sum pds ON pds."proformaId" = p.id
        WHERE ABS(CAST(p.total AS NUMERIC) - COALESCE(pds.sum_pd_total, 0)) > 0.01
        ORDER BY ABS(CAST(p.total AS NUMERIC) - COALESCE(pds.sum_pd_total, 0)) DESC;
    `);

    console.log(`Total proformas with discrepancy > 0.01: ${discRes.rows.length}`);
    console.log('\nTop 15 sample discrepancies:');
    console.table(discRes.rows.slice(0, 15));

    await client.end();
}

main().catch(console.error);
