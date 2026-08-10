const { Client } = require('pg');

const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433'),
    database: process.env.DB_NAME || 'curare',
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgrespg',
});

const isExecute = process.argv.includes('--execute');

async function main() {
    await client.connect();
    console.log(`Connected to DB (${isExecute ? 'EXECUTE MODE' : 'DRY RUN MODE'})\n`);

    // 1. Find all duplicate (pacienteId, numero) groups
    const dupsQuery = await client.query(`
        SELECT "pacienteId", numero, COUNT(*) as qty
        FROM proformas
        WHERE numero IS NOT NULL
        GROUP BY "pacienteId", numero
        HAVING COUNT(*) > 1
        ORDER BY "pacienteId", numero;
    `);

    console.log(`Total duplicate (pacienteId, numero) groups: ${dupsQuery.rows.length}\n`);

    let totalToDelete = [];
    let multipleUsedGroups = [];

    for (const group of dupsQuery.rows) {
        const pacienteId = group.pacienteId;
        const numero = group.numero;

        // Get all proformas for this group
        const proformasRes = await client.query(`
            SELECT id, "pacienteId", numero, fecha, total, aprobado
            FROM proformas
            WHERE "pacienteId" = $1 AND numero = $2
            ORDER BY fecha DESC, id DESC;
        `, [pacienteId, numero]);

        const proformas = proformasRes.rows;

        // For each proforma, count all references
        for (const p of proformas) {
            const hcCount = (await client.query(`SELECT COUNT(*) FROM historia_clinica WHERE "proformaId" = $1`, [p.id])).rows[0].count;
            const pagosCount = (await client.query(`SELECT COUNT(*) FROM pagos WHERE "proformaId" = $1`, [p.id])).rows[0].count;
            const proxCitaCount = (await client.query(`SELECT COUNT(*) FROM proxima_cita WHERE "proforma_id" = $1`, [p.id])).rows[0].count;
            const secTratCount = (await client.query(`SELECT COUNT(*) FROM secuencia_tratamiento WHERE "proformaId" = $1`, [p.id])).rows[0].count;
            const agendaCount = (await client.query(`SELECT COUNT(*) FROM agenda WHERE "proformaId" = $1`, [p.id])).rows[0].count;
            const imgCount = (await client.query(`SELECT COUNT(*) FROM proformas_imagenes WHERE "proformaId" = $1`, [p.id])).rows[0].count;
            const recPlanCount = (await client.query(`SELECT COUNT(*) FROM recordatorio_plan WHERE "proformaId" = $1`, [p.id])).rows[0].count;

            // Also check if any proforma_detalle belonging to this proforma is referenced in historia_clinica or proxima_cita
            const hcDetalleCount = (await client.query(`
                SELECT COUNT(*) FROM historia_clinica hc 
                JOIN proforma_detalle pd ON pd.id = hc."proformaDetalleId" 
                WHERE pd."proformaId" = $1
            `, [p.id])).rows[0].count;

            const proxDetalleCount = (await client.query(`
                SELECT COUNT(*) FROM proxima_cita pc 
                JOIN proforma_detalle pd ON pd.id = pc."proforma_detalle_id" 
                WHERE pd."proformaId" = $1
            `, [p.id])).rows[0].count;

            p.totalRefs = parseInt(hcCount) + parseInt(pagosCount) + parseInt(proxCitaCount) +
                          parseInt(secTratCount) + parseInt(agendaCount) + parseInt(imgCount) +
                          parseInt(recPlanCount) + parseInt(hcDetalleCount) + parseInt(proxDetalleCount);

            p.refSummary = {
                hc: parseInt(hcCount),
                pagos: parseInt(pagosCount),
                proxCita: parseInt(proxCitaCount),
                secTrat: parseInt(secTratCount),
                agenda: parseInt(agendaCount),
                img: parseInt(imgCount),
                recPlan: parseInt(recPlanCount),
                hcDetalle: parseInt(hcDetalleCount),
                proxDetalle: parseInt(proxDetalleCount)
            };
        }

        const used = proformas.filter(p => p.totalRefs > 0);
        const unused = proformas.filter(p => p.totalRefs === 0);

        if (pacienteId === 1836) {
            console.log(`=== PACIENTE 1836 (NUMERO ${numero}) ===`);
            console.log('Proformas status:');
            proformas.forEach(p => console.log(`  Proforma ID ${p.id}: Fecha=${p.fecha.toISOString().split('T')[0]}, Total=${p.total}, TotalRefs=${p.totalRefs}`, p.refSummary));
        }

        if (used.length > 0 && unused.length > 0) {
            // Safe to delete all unused duplicates
            unused.forEach(u => totalToDelete.push(u));
        } else if (used.length === 0 && unused.length > 1) {
            // All unused, keep 1st (most recent), delete the rest
            const toDelete = unused.slice(1);
            toDelete.forEach(u => totalToDelete.push(u));
        } else if (used.length > 1) {
            // Both are used in DB
            multipleUsedGroups.push({ pacienteId, numero, used });
        }
    }

    console.log(`\n================ SUMMARY ================`);
    console.log(`Total duplicate proformas to delete safely: ${totalToDelete.length}`);
    console.log(`Groups where multiple duplicates have references (will NOT delete): ${multipleUsedGroups.length}`);

    if (totalToDelete.length > 0) {
        console.log(`\nSample proformas to be deleted:`, totalToDelete.slice(0, 5).map(p => ({ id: p.id, pacienteId: p.pacienteId, numero: p.numero })));
    }

    if (isExecute && totalToDelete.length > 0) {
        console.log('\nExecuting deletion...');
        await client.query('BEGIN');
        try {
            const deleteIds = totalToDelete.map(p => p.id);

            // 1. Delete child proforma_detalle
            const delDetails = await client.query(`
                DELETE FROM proforma_detalle WHERE "proformaId" = ANY($1::int[])
            `, [deleteIds]);
            console.log(`Deleted ${delDetails.rowCount} rows from proforma_detalle.`);

            // 2. Delete child proformas_imagenes if any
            const delImgs = await client.query(`
                DELETE FROM proformas_imagenes WHERE "proformaId" = ANY($1::int[])
            `, [deleteIds]);
            console.log(`Deleted ${delImgs.rowCount} rows from proformas_imagenes.`);

            // 3. Delete proformas
            const delProformas = await client.query(`
                DELETE FROM proformas WHERE id = ANY($1::int[])
            `, [deleteIds]);
            console.log(`Deleted ${delProformas.rowCount} rows from proformas.`);

            await client.query('COMMIT');
            console.log('SUCCESSFULLY DELETED UNUSED DUPLICATE PROFORMAS!');
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Error during deletion, rolled back:', err);
        }
    } else if (!isExecute) {
        console.log('\nRun with --execute to perform deletion.');
    }

    await client.end();
}

main().catch(console.error);
