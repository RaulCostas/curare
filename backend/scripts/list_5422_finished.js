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

    console.log('=== TERMINADO ITEMS FOR PROFORMA 5422 UNDER DEEP RULE ===');
    const items = await client.query(`
        SELECT hc.id, hc.fecha, hc.tratamiento, hc.pieza, hc.cantidad, hc.precio,
               pd.id AS pd_id, pd.piezas AS pd_piezas, pd.cantidad AS pd_cant, pd.total AS pd_total,
               CASE 
                   WHEN pd.id IS NOT NULL AND CAST(pd.total AS NUMERIC) > 0 AND CAST(pd.cantidad AS NUMERIC) > 0 
                   THEN (CAST(pd.total AS NUMERIC) / CAST(pd.cantidad AS NUMERIC)) * CAST(COALESCE(hc.cantidad, 1) AS NUMERIC)
                   ELSE CAST(COALESCE(hc.precio, 0) AS NUMERIC)
               END AS calculated_cost
        FROM historia_clinica hc
        LEFT JOIN proforma_detalle pd ON pd.id = hc."proformaDetalleId"
        WHERE hc."proformaId" = 5422 
          AND LOWER(hc."estadoTratamiento") = 'terminado'
          AND NOT (hc.id = ANY($1::int[]))
        ORDER BY hc.tratamiento, hc.pieza, hc.fecha;
    `, [idsToDemote]);

    console.table(items.rows.map(r => ({
        hcId: r.id,
        fecha: r.fecha.toISOString().split('T')[0],
        tratamiento: r.tratamiento,
        pieza: r.pieza,
        pdId: r.pd_id,
        pdPiezas: r.pd_piezas,
        pdCant: r.pd_cant,
        pdTotal: r.pd_total,
        cost: r.calculated_cost
    })));

    const sum = items.rows.reduce((acc, r) => acc + parseFloat(r.calculated_cost), 0);
    console.log(`SUM calculated_cost: ${sum}`);

    await client.end();
}

main().catch(console.error);
