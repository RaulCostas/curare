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

    console.log('=== FINANCIAL SIMULATION FOR PATIENT 1129 PROFORMA #2 UNDER DEEP EXACT-PIEZA RULE ===\n');

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

    // Query financial stats for Proforma 5422 excluding idsToDemote
    const simRes = await client.query(`
        WITH pagos_sum AS (
            SELECT "proformaId", COALESCE(SUM(CAST(monto AS NUMERIC)), 0) AS total_pagado
            FROM pagos WHERE "proformaId" = 5422 GROUP BY "proformaId"
        ),
        realized_sum AS (
            SELECT hc."proformaId",
                COALESCE(SUM(
                    CASE 
                        WHEN pd.id IS NOT NULL AND CAST(pd.total AS NUMERIC) > 0 AND CAST(pd.cantidad AS NUMERIC) > 0 
                        THEN (CAST(pd.total AS NUMERIC) / CAST(pd.cantidad AS NUMERIC)) * CAST(COALESCE(hc.cantidad, 1) AS NUMERIC)
                        ELSE CAST(COALESCE(hc.precio, 0) AS NUMERIC)
                    END
                ), 0) AS realized_cost
            FROM historia_clinica hc
            LEFT JOIN proforma_detalle pd ON pd.id = hc."proformaDetalleId"
            WHERE hc."estadoTratamiento" = 'terminado' 
              AND hc."proformaId" = 5422
              AND NOT (hc.id = ANY($1::int[]))
            GROUP BY hc."proformaId"
        )
        SELECT p.id, p.numero, p.total AS proforma_total,
               COALESCE(ps.total_pagado, 0) AS total_pagado,
               COALESCE(rs.realized_cost, 0) AS total_ejecutado,
               (COALESCE(rs.realized_cost, 0) - COALESCE(ps.total_pagado, 0)) AS saldo
        FROM proformas p
        LEFT JOIN pagos_sum ps ON ps."proformaId" = p.id
        LEFT JOIN realized_sum rs ON rs."proformaId" = p.id
        WHERE p.id = 5422;
    `, [idsToDemote]);

    console.table(simRes.rows);

    await client.end();
}

main().catch(console.error);
