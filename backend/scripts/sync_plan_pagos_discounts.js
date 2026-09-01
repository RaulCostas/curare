const fs = require('fs');
const mdbReaderModule = require('mdb-reader');
const MDBReader = mdbReaderModule.default || mdbReaderModule;
const { Client } = require('pg');

async function main() {
    const buffer = fs.readFileSync('D:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb');
    const reader = new MDBReader(buffer);

    const planPagosTable = reader.getTable('Plan_Pagos');
    const planPagosRows = planPagosTable.getData();

    const ppMap = new Map();
    for (const r of planPagosRows) {
        const id = String(r.IdPlan_Pagos || '').trim();
        if (!id) continue;
        const descNum = parseFloat(String(r.Descuento || '0').replace(/\./g, '').replace(',', '.'));
        const debeNum = parseFloat(String(r.Debe || '0').replace(/\./g, '').replace(',', '.'));
        const debeDNum = parseFloat(String(r.DebeD || '0').replace(/\./g, '').replace(',', '.'));
        ppMap.set(id, {
            id,
            desc: isNaN(descNum) ? 0 : descNum,
            debe: isNaN(debeNum) ? 0 : debeNum,
            debeD: isNaN(debeDNum) ? 0 : debeDNum,
            pieza: r.Pieza,
            tratamiento: r.Tratamiento,
            paciente: r.Paciente,
            plan: r.Plan_Tratamiento
        });
    }

    const client = new Client({
        host: 'localhost',
        port: 5433,
        user: 'postgres',
        password: 'postgrespg',
        database: 'curare',
    });
    await client.connect();

    // 1. Check patient 61 deudores before
    console.log("=== BEFORE SYNC: PACIENTES DEUDORES (PACIENTE 61) ===");
    const deudoresBefore = (await client.query(`
        SELECT p.id as "proformaId", p.numero, p.total,
               (SELECT COALESCE(SUM(CASE WHEN LOWER(moneda::text) LIKE '%dólar%' OR LOWER(moneda::text) LIKE '%usd%' THEN monto * tc ELSE monto END), 0) FROM pagos WHERE "proformaId" = p.id) as total_pagado
        FROM proformas p
        WHERE p."pacienteId" = 61
        ORDER BY p.numero
    `)).rows;
    console.table(deudoresBefore);

    // Start transaction
    await client.query('BEGIN');

    try {
        const hcRows = (await client.query(`
            SELECT hc.id as hc_id, hc."pacienteId", hc."proformaId", hc."proformaDetalleId", hc.precio, hc."access_plan_pagos_id",
                   pd."precioUnitario" as pd_pu, pd."subTotal" as pd_subtotal, pd.descuento as pd_descuento, pd.total as pd_total
            FROM historia_clinica hc
            LEFT JOIN proforma_detalle pd ON pd.id = hc."proformaDetalleId"
            WHERE hc."access_plan_pagos_id" IS NOT NULL
        `)).rows;

        const pdUpdates = new Map();
        const affectedProformas = new Set();

        for (const r of hcRows) {
            const pp = ppMap.get(r.access_plan_pagos_id);
            if (!pp) continue;

            const ppDiscount = pp.desc;
            const pdDiscount = r.pd_descuento !== null ? parseFloat(r.pd_descuento) : 0;

            if (ppDiscount > pdDiscount && r.proformaDetalleId) {
                const currentSubTotal = parseFloat(r.pd_subtotal || '0');
                const newTotal = parseFloat((currentSubTotal * (1 - ppDiscount / 100)).toFixed(2));

                if (!pdUpdates.has(r.proformaDetalleId) || pdUpdates.get(r.proformaDetalleId).discount < ppDiscount) {
                    pdUpdates.set(r.proformaDetalleId, {
                        pdId: r.proformaDetalleId,
                        proformaId: r.proformaId,
                        discount: ppDiscount,
                        newTotal: newTotal
                    });
                    if (r.proformaId) affectedProformas.add(r.proformaId);
                }
            }

            // Update historia_clinica.precio if DebeD is different
            if (pp.debeD > 0) {
                const currentHcPrecio = parseFloat(r.precio || '0');
                if (Math.abs(currentHcPrecio - pp.debeD) > 0.01) {
                    await client.query(`
                        UPDATE historia_clinica
                        SET precio = $1
                        WHERE id = $2
                    `, [pp.debeD, r.hc_id]);
                }
            }
        }

        console.log(`\nApplying updates to ${pdUpdates.size} proforma_detalle records...`);
        for (const [pdId, info] of pdUpdates.entries()) {
            await client.query(`
                UPDATE proforma_detalle
                SET descuento = $1,
                    total = $2
                WHERE id = $3
            `, [info.discount, info.newTotal, pdId]);
        }

        console.log(`Recalculating totals for ${affectedProformas.size} affected proformas...`);
        await client.query(`
            UPDATE proformas p
            SET total = sub.sum_total
            FROM (
                SELECT "proformaId", ROUND(SUM(total), 2) as sum_total
                FROM proforma_detalle
                GROUP BY "proformaId"
            ) sub
            WHERE p.id = sub."proformaId" AND p.id = ANY($1::int[])
        `, [Array.from(affectedProformas)]);

        // Check patient 61 deudores after
        console.log("\n=== AFTER SYNC: PACIENTES DEUDORES (PACIENTE 61) ===");
        const deudoresAfter = (await client.query(`
            SELECT p.id as "proformaId", p.numero, p.total,
                   (SELECT COALESCE(SUM(CASE WHEN LOWER(moneda::text) LIKE '%dólar%' OR LOWER(moneda::text) LIKE '%usd%' THEN monto * tc ELSE monto END), 0) FROM pagos WHERE "proformaId" = p.id) as total_pagado
            FROM proformas p
            WHERE p."pacienteId" = 61
            ORDER BY p.numero
        `)).rows;
        console.table(deudoresAfter);

        // Commit transaction
        await client.query('COMMIT');
        console.log("\n>>> SYNCHRONIZATION COMMITTED SUCCESSFULLY! <<<");

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error during sync, rolled back:", err);
    } finally {
        await client.end();
    }
}

main().catch(console.error);
