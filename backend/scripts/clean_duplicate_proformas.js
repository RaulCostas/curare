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
    console.log(`=======================================================`);
    console.log(` RECONCILIACIÓN Y LIMPIEZA GLOBAL DE PROFORMAS DUPLICADAS `);
    console.log(` MODO: ${isExecute ? '*** EJECUCIÓN DIRECTA (EXECUTE) ***' : '--- SIMULACIÓN (DRY RUN) ---'}`);
    console.log(`=======================================================\n`);

    // 1. Obtener todos los grupos con proformas duplicadas (mismo pacienteId y numero)
    const dupsQuery = await client.query(`
        SELECT "pacienteId", numero, COUNT(*) as qty
        FROM proformas
        WHERE numero IS NOT NULL
        GROUP BY "pacienteId", numero
        HAVING COUNT(*) > 1
        ORDER BY "pacienteId", numero;
    `);

    console.log(`Grupos de proformas duplicadas encontrados: ${dupsQuery.rows.length}\n`);

    let totalRelinkedHC = 0;
    let totalRelinkedPagos = 0;
    let totalRelinkedProx = 0;
    let totalRelinkedSec = 0;
    let totalProformasToDelete = [];

    if (isExecute) {
        await client.query('BEGIN');
    }

    try {
        for (const group of dupsQuery.rows) {
            const { pacienteId, numero } = group;

            // Obtener todas las proformas de este grupo
            const proformasRes = await client.query(`
                SELECT id, "pacienteId", numero, fecha, total, aprobado
                FROM proformas
                WHERE "pacienteId" = $1 AND numero = $2
                ORDER BY id ASC;
            `, [pacienteId, numero]);

            const proformas = proformasRes.rows;

            // Analizar cada proforma del grupo
            for (const p of proformas) {
                // Detalle count
                const detRes = await client.query(`
                    SELECT pd.id, pd."arancelId", pd.total, a.detalle as arancel_nombre
                    FROM proforma_detalle pd
                    LEFT JOIN arancel a ON pd."arancelId" = a.id
                    WHERE pd."proformaId" = $1;
                `, [p.id]);
                p.detalles = detRes.rows;
                p.detalleCount = detRes.rows.length;

                // Referencias directas
                p.hcCount = parseInt((await client.query(`SELECT COUNT(*) FROM historia_clinica WHERE "proformaId" = $1`, [p.id])).rows[0].count);
                p.pagosCount = parseInt((await client.query(`SELECT COUNT(*) FROM pagos WHERE "proformaId" = $1`, [p.id])).rows[0].count);
                p.proxCount = parseInt((await client.query(`SELECT COUNT(*) FROM proxima_cita WHERE "proforma_id" = $1`, [p.id])).rows[0].count);
                p.secCount = parseInt((await client.query(`SELECT COUNT(*) FROM secuencia_tratamiento WHERE "proformaId" = $1`, [p.id])).rows[0].count);
                p.agendaCount = parseInt((await client.query(`SELECT COUNT(*) FROM agenda WHERE "proformaId" = $1`, [p.id])).rows[0].count);
                p.imgCount = parseInt((await client.query(`SELECT COUNT(*) FROM proformas_imagenes WHERE "proformaId" = $1`, [p.id])).rows[0].count);
                p.recPlanCount = parseInt((await client.query(`SELECT COUNT(*) FROM recordatorio_plan WHERE "proformaId" = $1`, [p.id])).rows[0].count);

                p.totalRefs = p.hcCount + p.pagosCount + p.proxCount + p.secCount + p.agendaCount + p.imgCount + p.recPlanCount;
            }

            // Identificar la proforma "principal" (la que tiene detalles o mas referencias)
            const withDetails = proformas.filter(p => p.detalleCount > 0);
            const emptyProformas = proformas.filter(p => p.detalleCount === 0);

            // CASO A: Hay al menos 1 proforma con detalles y algunas proformas vacias que tienen referencias vinculadas erróneamente
            if (withDetails.length > 0 && emptyProformas.length > 0) {
                const targetProforma = withDetails[0];

                for (const emptyP of emptyProformas) {
                    if (emptyP.totalRefs > 0) {
                        console.log(`[RECONCILIANTE] Paciente ${pacienteId}, Prof #${numero}: Reasignando referencias de Prof Fantasma ${emptyP.id} -> Prof Real ${targetProforma.id}`);

                        if (isExecute) {
                            // Re-link historia_clinica
                            if (emptyP.hcCount > 0) {
                                const hcRows = (await client.query(`SELECT id, tratamiento FROM historia_clinica WHERE "proformaId" = $1`, [emptyP.id])).rows;
                                for (const hcItem of hcRows) {
                                    let matchedDetalleId = null;
                                    if (targetProforma.detalles.length > 0) {
                                        const match = targetProforma.detalles.find(d => 
                                            d.arancel_nombre && hcItem.tratamiento && 
                                            (d.arancel_nombre.toLowerCase().includes(hcItem.tratamiento.toLowerCase()) || 
                                             hcItem.tratamiento.toLowerCase().includes(d.arancel_nombre.toLowerCase()))
                                        );
                                        if (match) matchedDetalleId = match.id;
                                    }

                                    await client.query(`
                                        UPDATE historia_clinica
                                        SET "proformaId" = $1, "proformaDetalleId" = COALESCE($2, "proformaDetalleId")
                                        WHERE id = $3;
                                    `, [targetProforma.id, matchedDetalleId, hcItem.id]);
                                    totalRelinkedHC++;
                                }
                            }

                            // Re-link pagos
                            if (emptyP.pagosCount > 0) {
                                const pUpd = await client.query(`UPDATE pagos SET "proformaId" = $1 WHERE "proformaId" = $2`, [targetProforma.id, emptyP.id]);
                                totalRelinkedPagos += pUpd.rowCount;
                            }

                            // Re-link proxima_cita
                            if (emptyP.proxCount > 0) {
                                const pcUpd = await client.query(`UPDATE proxima_cita SET proforma_id = $1 WHERE proforma_id = $2`, [targetProforma.id, emptyP.id]);
                                totalRelinkedProx += pcUpd.rowCount;
                            }

                            // Re-link secuencia_tratamiento
                            if (emptyP.secCount > 0) {
                                const stUpd = await client.query(`UPDATE secuencia_tratamiento SET "proformaId" = $1 WHERE "proformaId" = $2`, [targetProforma.id, emptyP.id]);
                                totalRelinkedSec += stUpd.rowCount;
                            }
                        } else {
                            totalRelinkedHC += emptyP.hcCount;
                            totalRelinkedPagos += emptyP.pagosCount;
                            totalRelinkedProx += emptyP.proxCount;
                            totalRelinkedSec += emptyP.secCount;
                        }

                        emptyP.totalRefs = 0;
                    }
                    totalProformasToDelete.push(emptyP);
                }
            } else if (emptyProformas.length === proformas.length) {
                const target = proformas[0];
                const duplicates = proformas.slice(1);
                for (const d of duplicates) {
                    if (d.totalRefs === 0) {
                        totalProformasToDelete.push(d);
                    }
                }
            } else if (withDetails.length > 1) {
                const target = withDetails.find(p => p.aprobado) || withDetails[0];
                const duplicates = proformas.filter(p => p.id !== target.id);
                for (const d of duplicates) {
                    if (d.totalRefs === 0) {
                        totalProformasToDelete.push(d);
                    }
                }
            }
        }

        console.log(`\n================ RESUMEN DE PROCESAMIENTO ================`);
        console.log(`Total registros historia_clinica relinkeados: ${totalRelinkedHC}`);
        console.log(`Total registros pagos relinkeados          : ${totalRelinkedPagos}`);
        console.log(`Total registros proxima_cita relinkeados    : ${totalRelinkedProx}`);
        console.log(`Total registros secuencia relinkeados       : ${totalRelinkedSec}`);
        console.log(`Total proformas fantasma/duplicadas a borrar: ${totalProformasToDelete.length}`);

        if (isExecute && totalProformasToDelete.length > 0) {
            console.log(`\nEliminando ${totalProformasToDelete.length} proformas duplicadas sin referencias...`);
            const deleteIds = totalProformasToDelete.map(p => p.id);

            await client.query(`DELETE FROM proforma_detalle WHERE "proformaId" = ANY($1::int[])`, [deleteIds]);
            await client.query(`DELETE FROM proformas_imagenes WHERE "proformaId" = ANY($1::int[])`, [deleteIds]);
            const delRes = await client.query(`DELETE FROM proformas WHERE id = ANY($1::int[])`, [deleteIds]);
            console.log(`Se eliminaron exitosamente ${delRes.rowCount} proformas duplicadas.`);

            // Ajustar automáticamente proformaDetalleId en historia_clinica basándose en la coincidencia exacta de tratamiento
            console.log('Optimizando emparejamiento de proformaDetalleId en historia_clinica...');
            await client.query(`
                UPDATE historia_clinica hc
                SET "proformaDetalleId" = pd.id
                FROM proforma_detalle pd
                JOIN arancel a ON pd."arancelId" = a.id
                WHERE hc."proformaId" = pd."proformaId"
                  AND a.detalle IS NOT NULL AND hc.tratamiento IS NOT NULL
                  AND LOWER(TRIM(a.detalle)) = LOWER(TRIM(hc.tratamiento))
                  AND (hc."proformaDetalleId" IS NULL OR hc."proformaDetalleId" != pd.id);
            `);

            await client.query('COMMIT');
            console.log(`\n*** PROCESO COMPLETADO Y GUARDADO EN BASE DE DATOS ***`);
        } else if (!isExecute) {
            console.log(`\nPara ejecutar los cambios en la base de datos, ejecuta: node backend/scripts/clean_duplicate_proformas.js --execute`);
        }

    } catch (error) {
        if (isExecute) {
            await client.query('ROLLBACK');
        }
        console.error('Error durante la ejecución:', error);
    } finally {
        await client.end();
    }
}

main().catch(console.error);
