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

    console.log('=== TEST DE REGLA REFUNDADA PER-PIEZA Y CUMULATIVA PARA PACIENTE 1129 ===\n');

    // Rule:
    // 1. Group by (proformaDetalleId, LOWER(TRIM(COALESCE(pieza, '')))) or (proformaId, trat, pz)
    // 2. Order by fecha DESC, id DESC. Keep ONLY the 1st row as 'terminado' when multiple session rows exist for the EXACT SAME piece string!
    // 3. For multi-piece items where separate rows represent individual pieces (e.g. 31, 32, 33, 34), each piece string is unique, so ALL distinct piece rows remain 'terminado'.

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

    console.log(`Total de registros a cambiar a 'no terminado' en la BD: ${idsToDemote.length}`);

    // Update DB
    await client.query('BEGIN');
    try {
        const updateRes = await client.query(`
            UPDATE historia_clinica
            SET "estadoTratamiento" = 'no terminado'
            WHERE id = ANY($1::int[]);
        `, [idsToDemote]);

        console.log(`ÉXITO: Actualizados ${updateRes.rowCount} registros en historia_clinica.`);
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al actualizar:', err);
    }

    // Check financial stats for Patient 1129 Proforma 5422 (#2)
    const finRes = await client.query(`
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
            WHERE hc."estadoTratamiento" = 'terminado' AND hc."proformaId" = 5422
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
    `);

    console.log('\n=== RESULTADO FINAL: PACIENTE 1129 PROFORMA #2 (5422) ===');
    console.table(finRes.rows);

    await client.end();
}

main().catch(console.error);
