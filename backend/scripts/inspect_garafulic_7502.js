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

    console.log('=== INSPECTING GARAFULIC LEHM WALTER RAUL (ID 1881) PROFORMA #1 (ID 7502) ===\n');

    // Proforma 7502
    const pRes = await client.query(`SELECT * FROM proformas WHERE id = 7502;`);
    console.log('Proforma 7502 Header:');
    console.table(pRes.rows);

    // Proforma Detalle
    const pdRes = await client.query(`
        SELECT pd.id, a.detalle AS tratamiento, pd.piezas, pd.cantidad, pd."precioUnitario", pd."subTotal", pd.descuento, pd.total
        FROM proforma_detalle pd
        LEFT JOIN arancel a ON a.id = pd."arancelId"
        WHERE pd."proformaId" = 7502;
    `);

    console.log('\nProforma Detalle Items for 7502:');
    console.table(pdRes.rows);

    const sumPd = pdRes.rows.reduce((acc, r) => acc + parseFloat(r.total || '0'), 0);
    console.log(`Sum of proforma_detalle.total: ${sumPd}`);

    // Pagos
    const pagosRes = await client.query(`SELECT * FROM pagos WHERE "proformaId" = 7502;`);
    console.log('\nPagos for Proforma 7502:');
    console.table(pagosRes.rows);

    const totalPagado = pagosRes.rows.reduce((acc, r) => acc + parseFloat(r.monto || '0'), 0);
    console.log(`Total Pagado: ${totalPagado}`);

    // Historia Clinica
    const hcRes = await client.query(`
        SELECT id, fecha, tratamiento, pieza, cantidad, precio, "estadoTratamiento", "proformaDetalleId"
        FROM historia_clinica
        WHERE "proformaId" = 7502;
    `);

    console.log('\nHistoria Clinica entries for Proforma 7502:');
    console.table(hcRes.rows);

    const sumHcTerminado = hcRes.rows
        .filter(r => r.estadoTratamiento === 'terminado')
        .reduce((acc, r) => acc + parseFloat(r.precio || '0'), 0);
    console.log(`Sum of HC (estadoTratamiento = terminado) precio: ${sumHcTerminado}`);

    // Calculate realized_cost via PacientesDeudores formula
    const deudoresRes = await client.query(`
        WITH pagos_sum AS (
            SELECT "proformaId", COALESCE(SUM(CAST(monto AS NUMERIC)), 0) AS total_pagado
            FROM pagos WHERE "proformaId" = 7502 GROUP BY "proformaId"
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
            WHERE hc."estadoTratamiento" = 'terminado' AND hc."proformaId" = 7502
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
        WHERE p.id = 7502;
    `);

    console.log('\nPacientes Deudores calculation for Proforma 7502:');
    console.table(deudoresRes.rows);

    await client.end();
}

main().catch(console.error);
