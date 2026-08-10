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

    const query = `
        WITH pagos_sum AS (
            SELECT "proformaId", 
                   COALESCE(SUM(
                       CASE 
                           WHEN LOWER(moneda::text) LIKE '%dólar%' 
                             OR LOWER(moneda::text) LIKE '%dolar%' 
                             OR LOWER(moneda::text) LIKE '%usd%' 
                           THEN CAST(monto AS NUMERIC) * COALESCE(tc, 6.96)
                           ELSE CAST(monto AS NUMERIC)
                       END
                   ), 0) AS total_pagado
            FROM pagos
            WHERE "proformaId" IS NOT NULL
            GROUP BY "proformaId"
        ),
        realized_sum AS (
            SELECT 
                hc."proformaId",
                COALESCE(SUM(
                    CASE 
                        WHEN pd.id IS NOT NULL AND CAST(pd.total AS NUMERIC) > 0 AND CAST(pd.cantidad AS NUMERIC) > 0 
                        THEN (CAST(pd.total AS NUMERIC) / CAST(pd.cantidad AS NUMERIC)) * CAST(COALESCE(hc.cantidad, 1) AS NUMERIC)
                        ELSE CAST(COALESCE(hc.precio, 0) AS NUMERIC)
                    END
                ), 0) AS realized_cost
            FROM historia_clinica hc
            LEFT JOIN proforma_detalle pd ON pd.id = hc."proformaDetalleId"
            WHERE hc."estadoTratamiento" = 'terminado' AND hc."proformaId" IS NOT NULL
            GROUP BY hc."proformaId"
        )
        SELECT p.id AS "proformaId", p.numero AS "numeroPresupuesto",
               CAST(p.total AS NUMERIC) AS "totalPresupuesto",
               CAST(COALESCE(ps.total_pagado, 0) AS NUMERIC) AS "totalPagado",
               CAST(COALESCE(rs.realized_cost, 0) AS NUMERIC) AS "totalEjecutado",
               CAST((COALESCE(rs.realized_cost, 0) - COALESCE(ps.total_pagado, 0)) AS NUMERIC) AS "saldo"
        FROM proformas p
        LEFT JOIN pagos_sum ps ON ps."proformaId" = p.id
        LEFT JOIN realized_sum rs ON rs."proformaId" = p.id
        WHERE p.id = 7502;
    `;

    const res = await client.query(query);

    console.log('=== UPDATED PACIENTES DEUDORES OUTPUT FOR GARAFULIC PROFORMA #1 (ID 7502) ===');
    console.table(res.rows);

    await client.end();
}

main().catch(console.error);
