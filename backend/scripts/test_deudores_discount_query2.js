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

    console.log('=== ADVANCED TREATMENT MATCHING WITH DISCOUNTS FOR DEUDORES ===\n');

    const testQuery = `
        WITH pagos_sum AS (
            SELECT "proformaId", 
                   COALESCE(SUM(
                       CASE 
                           WHEN LOWER(COALESCE(moneda::text, '')) LIKE '%dólar%' 
                             OR LOWER(COALESCE(moneda::text, '')) LIKE '%dolar%' 
                             OR LOWER(COALESCE(moneda::text, '')) LIKE '%usd%' 
                           THEN CAST(monto AS NUMERIC) * COALESCE(tc, 6.96)
                           ELSE CAST(monto AS NUMERIC)
                       END
                   ), 0) AS total_pagado
            FROM pagos
            WHERE "proformaId" IS NOT NULL
            GROUP BY "proformaId"
        ),
        pd_match_by_name AS (
            SELECT DISTINCT ON (pd."proformaId", LOWER(SPLIT_PART(TRIM(COALESCE(a.detalle, '')), ' ', 1)))
                   pd."proformaId",
                   LOWER(SPLIT_PART(TRIM(COALESCE(a.detalle, '')), ' ', 1)) AS first_word,
                   pd.id,
                   pd.total,
                   pd.cantidad
            FROM proforma_detalle pd
            LEFT JOIN arancel a ON a.id = pd."arancelId"
            WHERE pd."proformaId" IS NOT NULL
            ORDER BY pd."proformaId", LOWER(SPLIT_PART(TRIM(COALESCE(a.detalle, '')), ' ', 1)), pd.id
        ),
        realized_sum AS (
            SELECT 
                hc."proformaId",
                COALESCE(SUM(
                    CASE 
                        -- Direct pd match (including pd.total = 0 for 100% discount)
                        WHEN pd.id IS NOT NULL AND CAST(pd.cantidad AS NUMERIC) > 0 
                        THEN (CAST(pd.total AS NUMERIC) / CAST(pd.cantidad AS NUMERIC)) * CAST(COALESCE(hc.cantidad, 1) AS NUMERIC)
                        
                        -- Match by proformaId + treatment first word (e.g. 'limpieza') if proformaDetalleId is null
                        WHEN pdm.id IS NOT NULL AND CAST(pdm.cantidad AS NUMERIC) > 0
                        THEN (CAST(pdm.total AS NUMERIC) / CAST(pdm.cantidad AS NUMERIC)) * CAST(COALESCE(hc.cantidad, 1) AS NUMERIC)

                        -- Fallback to hc.precio
                        ELSE CAST(COALESCE(hc.precio, 0) AS NUMERIC)
                    END
                ), 0) AS realized_cost
            FROM historia_clinica hc
            LEFT JOIN proforma_detalle pd ON pd.id = hc."proformaDetalleId"
            LEFT JOIN pd_match_by_name pdm ON (
                hc."proformaDetalleId" IS NULL 
                AND pdm."proformaId" = hc."proformaId" 
                AND pdm.first_word = LOWER(SPLIT_PART(TRIM(COALESCE(hc.tratamiento, '')), ' ', 1))
            )
            WHERE hc."estadoTratamiento" = 'terminado' AND hc."proformaId" IS NOT NULL
            GROUP BY hc."proformaId"
        )
        SELECT p.id AS "proformaId", p.numero AS "numeroPresupuesto", p."pacienteId",
               CAST(p.total AS NUMERIC) AS "totalPresupuesto",
               CAST(COALESCE(ps.total_pagado, 0) AS NUMERIC) AS "totalPagado",
               CAST(COALESCE(rs.realized_cost, 0) AS NUMERIC) AS "totalEjecutado",
               CAST((COALESCE(rs.realized_cost, 0) - COALESCE(ps.total_pagado, 0)) AS NUMERIC) AS "saldo"
        FROM proformas p
        LEFT JOIN pagos_sum ps ON ps."proformaId" = p.id
        LEFT JOIN realized_sum rs ON rs."proformaId" = p.id
        WHERE p.id IN (4338, 5422, 7502);
    `;

    const res = await client.query(testQuery);

    console.table(res.rows);

    await client.end();
}

main().catch(console.error);
