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

    console.log('=== INVESTIGATING PATIENT GARAFULIC LEHM WALTER RAUL ===\n');

    const pac = await client.query(`
        SELECT id, paterno, materno, nombre 
        FROM pacientes 
        WHERE LOWER(paterno) LIKE '%garafulic%';
    `);

    console.log('Patient record:');
    console.table(pac.rows);

    if (pac.rows.length === 0) {
        await client.end();
        return;
    }

    const pacienteId = pac.rows[0].id;

    // Find proforma #1
    const profs = await client.query(`
        SELECT id, numero, fecha, total, "traspasado", "deuda_observada"
        FROM proformas
        WHERE "pacienteId" = $1 AND numero = 1;
    `, [pacienteId]);

    console.log('\nProforma #1 record:');
    console.table(profs.rows);

    const proformaId = profs.rows[0].id;

    // Payments for proforma #1
    const pagos = await client.query(`
        SELECT id, fecha, monto, moneda
        FROM pagos
        WHERE "proformaId" = $1;
    `, [proformaId]);

    console.log('\nPagos for proforma #1:');
    console.table(pagos.rows);

    const totalPagado = pagos.rows.reduce((sum, r) => sum + parseFloat(r.monto || '0'), 0);
    console.log(`Total Pagado: ${totalPagado}`);

    // Proforma Detalle items
    const pd = await client.query(`
        SELECT pd.id, a.detalle AS tratamiento, pd.piezas, pd.cantidad, pd."precioUnitario", pd.total
        FROM proforma_detalle pd
        LEFT JOIN arancel a ON a.id = pd."arancelId"
        WHERE pd."proformaId" = $1;
    `, [proformaId]);

    console.log('\nProforma Detalle items:');
    console.table(pd.rows);

    // Historia Clinica items
    const hc = await client.query(`
        SELECT id, fecha, tratamiento, pieza, cantidad, precio, "estadoTratamiento", "proformaDetalleId"
        FROM historia_clinica
        WHERE "proformaId" = $1
        ORDER BY id;
    `, [proformaId]);

    console.log('\nHistoria Clinica items:');
    console.table(hc.rows);

    // Check como se calcula en PacientesDeudoresService
    const deudoresQuery = await client.query(`
        WITH pagos_sum AS (
            SELECT "proformaId", COALESCE(SUM(CAST(monto AS NUMERIC)), 0) AS total_pagado
            FROM pagos
            WHERE "proformaId" = $1
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
            WHERE hc."estadoTratamiento" = 'terminado' AND hc."proformaId" = $1
            GROUP BY hc."proformaId"
        )
        SELECT p.id, p.total AS proforma_total,
               COALESCE(ps.total_pagado, 0) AS total_pagado,
               COALESCE(rs.realized_cost, 0) AS total_ejecutado,
               (COALESCE(rs.realized_cost, 0) - COALESCE(ps.total_pagado, 0)) AS saldo_deudores,
               (CAST(p.total AS NUMERIC) - COALESCE(ps.total_pagado, 0)) AS saldo_presupuesto_total
        FROM proformas p
        LEFT JOIN pagos_sum ps ON ps."proformaId" = p.id
        LEFT JOIN realized_sum rs ON rs."proformaId" = p.id
        WHERE p.id = $1;
    `, [proformaId]);

    console.log('\nCalculos para proforma #1:');
    console.table(deudoresQuery.rows);

    await client.end();
}

main().catch(console.error);
