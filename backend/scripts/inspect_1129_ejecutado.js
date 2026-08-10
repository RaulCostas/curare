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

    console.log('=== INSPECTING TOTAL EJECUTADO FOR PATIENT 1129 PROFORMA #2 (ID 5422) ===\n');

    const res = await client.query(`
        SELECT hc.id AS hc_id,
               hc.fecha,
               hc.tratamiento,
               hc.pieza,
               hc.cantidad AS hc_cant,
               hc.precio AS hc_precio,
               hc."estadoTratamiento",
               hc."proformaDetalleId",
               pd.piezas AS pd_piezas,
               pd.cantidad AS pd_cant,
               pd.total AS pd_total,
               CASE 
                   WHEN pd.id IS NOT NULL AND CAST(pd.total AS NUMERIC) > 0 AND CAST(pd.cantidad AS NUMERIC) > 0 
                   THEN (CAST(pd.total AS NUMERIC) / CAST(pd.cantidad AS NUMERIC)) * CAST(COALESCE(hc.cantidad, 1) AS NUMERIC)
                   ELSE CAST(COALESCE(hc.precio, 0) AS NUMERIC)
               END AS calculated_cost
        FROM historia_clinica hc
        LEFT JOIN proforma_detalle pd ON pd.id = hc."proformaDetalleId"
        WHERE hc."proformaId" = 5422
          AND LOWER(hc."estadoTratamiento") = 'terminado'
        ORDER BY hc.tratamiento, hc.pieza, hc.fecha, hc.id;
    `);

    console.table(res.rows.map(r => ({
        hcId: r.hc_id,
        fecha: r.fecha.toISOString().split('T')[0],
        tratamiento: r.tratamiento,
        pieza: r.pieza,
        hcCant: r.hc_cant,
        hcPrecio: r.hc_precio,
        pdId: r.proformaDetalleId,
        pdPiezas: r.pd_piezas,
        pdCant: r.pd_cant,
        pdTotal: r.pd_total,
        calculatedCost: parseFloat(r.calculated_cost)
    })));

    const totalCalculated = res.rows.reduce((sum, r) => sum + parseFloat(r.calculated_cost), 0);
    console.log(`\nSUM TOTAL EJECUTADO: ${totalCalculated}`);

    await client.end();
}

main().catch(console.error);
