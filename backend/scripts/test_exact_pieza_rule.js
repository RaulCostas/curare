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

    console.log('=== EXACT PIEZA DEEP RULE TEST & FINANCIAL SIMULATION ===\n');

    const dupsQuery = await client.query(`
        WITH exact_pieza_ranked AS (
            SELECT hc.id,
                   hc."proformaId",
                   hc."proformaDetalleId",
                   LOWER(TRIM(hc.tratamiento)) AS trat,
                   LOWER(TRIM(COALESCE(hc.pieza, ''))) AS pz,
                   ROW_NUMBER() OVER (
                       PARTITION BY hc."proformaId", COALESCE(hc."proformaDetalleId", 0), LOWER(TRIM(hc.tratamiento)), LOWER(TRIM(COALESCE(hc.pieza, '')))
                       ORDER BY hc.fecha DESC, hc.id DESC
                   ) AS rn
            FROM historia_clinica hc
            WHERE hc."proformaId" IS NOT NULL
              AND LOWER(hc."estadoTratamiento") = 'terminado'
              AND TRIM(COALESCE(hc.tratamiento, '')) != ''
        )
        SELECT id FROM exact_pieza_ranked WHERE rn > 1;
    `);

    const idsToDemote = dupsQuery.rows.map(r => r.id);

    console.log(`Total DB-wide rows to demote under exact-pieza rule: ${idsToDemote.length}`);

    // Patient 1129 demoted rows
    const p1129HC = await client.query(`
        SELECT hc.id, hc.fecha, hc.tratamiento, hc.pieza, hc.cantidad, hc."estadoTratamiento", hc."proformaDetalleId"
        FROM historia_clinica hc
        WHERE hc."pacienteId" = 1129 AND hc.id = ANY($1::int[]);
    `, [idsToDemote]);

    console.log(`\nFilas de Paciente 1129 que cambiarán a 'no terminado': ${p1129HC.rows.length}`);
    console.table(p1129HC.rows.map(r => ({
        id: r.id,
        fecha: r.fecha.toISOString().split('T')[0],
        tratamiento: r.tratamiento,
        pieza: r.pieza,
        cant: r.cantidad,
        pdId: r.proformaDetalleId
    })));

    // Financial Stats for Patient 1129 Proforma 5422
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

    console.log('\n=== FINANZAS PACIENTE 1129 PROFORMA #2 (5422) TRAS REGLA EXACTA DE PIEZA ===');
    console.table(simRes.rows);

    await client.end();
}

main().catch(console.error);
