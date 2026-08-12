import { getAppDataSource } from '../config';

export async function reconcileDuplicateProformasModule() {
  console.log('\n======================================================');
  console.log('  INICIANDO RECONCILIACIÓN Y LIMPIEZA DE PROFORMAS DUPLICADAS');
  console.log('======================================================\n');

  const dataSource = await getAppDataSource();

  // 1. Obtener todos los grupos con proformas duplicadas (mismo pacienteId y numero)
  const dupsQuery = await dataSource.query(`
    SELECT "pacienteId", numero, COUNT(*) as qty
    FROM proformas
    WHERE numero IS NOT NULL
    GROUP BY "pacienteId", numero
    HAVING COUNT(*) > 1
    ORDER BY "pacienteId", numero;
  `);

  console.log(`Grupos de proformas duplicadas encontrados en Postgres: ${dupsQuery.length}\n`);

  let totalRelinkedHC = 0;
  let totalRelinkedPagos = 0;
  let totalRelinkedProx = 0;
  let totalRelinkedSec = 0;
  let totalProformasToDelete: any[] = [];

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    for (const group of dupsQuery) {
      const pacienteId = Number(group.pacienteId);
      const numero = Number(group.numero);

      // Obtener todas las proformas de este grupo
      const proformas = await queryRunner.query(`
        SELECT id, "pacienteId", numero, fecha, total, aprobado
        FROM proformas
        WHERE "pacienteId" = $1 AND numero = $2
        ORDER BY id ASC;
      `, [pacienteId, numero]);

      // Analizar cada proforma del grupo
      for (const p of proformas) {
        // Detalle count
        const detalles = await queryRunner.query(`
          SELECT pd.id, pd."arancelId", pd.total, a.detalle as arancel_nombre
          FROM proforma_detalle pd
          LEFT JOIN arancel a ON pd."arancelId" = a.id
          WHERE pd."proformaId" = $1;
        `, [p.id]);
        p.detalles = detalles;
        p.detalleCount = detalles.length;

        // Referencias directas
        p.hcCount = parseInt((await queryRunner.query(`SELECT COUNT(*) FROM historia_clinica WHERE "proformaId" = $1`, [p.id]))[0].count);
        p.pagosCount = parseInt((await queryRunner.query(`SELECT COUNT(*) FROM pagos WHERE "proformaId" = $1`, [p.id]))[0].count);
        p.proxCount = parseInt((await queryRunner.query(`SELECT COUNT(*) FROM proxima_cita WHERE "proforma_id" = $1`, [p.id]))[0].count);
        p.secCount = parseInt((await queryRunner.query(`SELECT COUNT(*) FROM secuencia_tratamiento WHERE "proformaId" = $1`, [p.id]))[0].count);
        p.agendaCount = parseInt((await queryRunner.query(`SELECT COUNT(*) FROM agenda WHERE "proformaId" = $1`, [p.id]))[0].count);
        p.imgCount = parseInt((await queryRunner.query(`SELECT COUNT(*) FROM proformas_imagenes WHERE "proformaId" = $1`, [p.id]))[0].count);
        p.recPlanCount = parseInt((await queryRunner.query(`SELECT COUNT(*) FROM recordatorio_plan WHERE "proformaId" = $1`, [p.id]))[0].count);

        p.totalRefs = p.hcCount + p.pagosCount + p.proxCount + p.secCount + p.agendaCount + p.imgCount + p.recPlanCount;
      }

      // Identificar la proforma "principal" (la que tiene detalles o mas referencias)
      const withDetails = proformas.filter((p: any) => p.detalleCount > 0);
      const emptyProformas = proformas.filter((p: any) => p.detalleCount === 0);

      // CASO A: Hay al menos 1 proforma con detalles y algunas proformas vacias que tienen referencias vinculadas erróneamente
      if (withDetails.length > 0 && emptyProformas.length > 0) {
        const targetProforma = withDetails[0];

        for (const emptyP of emptyProformas) {
          if (emptyP.totalRefs > 0) {
            console.log(`[RECONCILIANTE] Paciente ${pacienteId}, Prof #${numero}: Reasignando referencias de Prof Fantasma ${emptyP.id} -> Prof Real ${targetProforma.id}`);

            // Re-link historia_clinica
            if (emptyP.hcCount > 0) {
              const hcRows = await queryRunner.query(`SELECT id, tratamiento FROM historia_clinica WHERE "proformaId" = $1`, [emptyP.id]);
              for (const hcItem of hcRows) {
                let matchedDetalleId = null;
                if (targetProforma.detalles.length > 0) {
                  const match = targetProforma.detalles.find((d: any) => 
                    d.arancel_nombre && hcItem.tratamiento && 
                    (d.arancel_nombre.toLowerCase().includes(hcItem.tratamiento.toLowerCase()) || 
                     hcItem.tratamiento.toLowerCase().includes(d.arancel_nombre.toLowerCase()))
                  );
                  if (match) matchedDetalleId = match.id;
                }

                await queryRunner.query(`
                  UPDATE historia_clinica
                  SET "proformaId" = $1, "proformaDetalleId" = COALESCE($2, "proformaDetalleId")
                  WHERE id = $3;
                `, [targetProforma.id, matchedDetalleId, hcItem.id]);
                totalRelinkedHC++;
              }
            }

            // Re-link pagos
            if (emptyP.pagosCount > 0) {
              const pUpd = await queryRunner.query(`UPDATE pagos SET "proformaId" = $1 WHERE "proformaId" = $2`, [targetProforma.id, emptyP.id]);
              totalRelinkedPagos += (pUpd[1] || pUpd.affected || 0);
            }

            // Re-link proxima_cita
            if (emptyP.proxCount > 0) {
              const pcUpd = await queryRunner.query(`UPDATE proxima_cita SET proforma_id = $1 WHERE proforma_id = $2`, [targetProforma.id, emptyP.id]);
              totalRelinkedProx += (pcUpd[1] || pcUpd.affected || 0);
            }

            // Re-link secuencia_tratamiento
            if (emptyP.secCount > 0) {
              const stUpd = await queryRunner.query(`UPDATE secuencia_tratamiento SET "proformaId" = $1 WHERE "proformaId" = $2`, [targetProforma.id, emptyP.id]);
              totalRelinkedSec += (stUpd[1] || stUpd.affected || 0);
            }

            emptyP.totalRefs = 0;
          }
          totalProformasToDelete.push(emptyP);
        }
      } else if (emptyProformas.length === proformas.length) {
        const duplicates = proformas.slice(1);
        for (const d of duplicates) {
          if (d.totalRefs === 0) {
            totalProformasToDelete.push(d);
          }
        }
      } else if (withDetails.length > 1) {
        const target = withDetails.find((p: any) => p.aprobado) || withDetails[0];
        const duplicates = proformas.filter((p: any) => p.id !== target.id);
        for (const d of duplicates) {
          if (d.totalRefs === 0) {
            totalProformasToDelete.push(d);
          }
        }
      }
    }

    console.log(`\n================ RESUMEN DE RECONCILIACIÓN ================`);
    console.log(`Total registros historia_clinica relinkeados: ${totalRelinkedHC}`);
    console.log(`Total registros pagos relinkeados          : ${totalRelinkedPagos}`);
    console.log(`Total registros proxima_cita relinkeados    : ${totalRelinkedProx}`);
    console.log(`Total registros secuencia relinkeados       : ${totalRelinkedSec}`);
    console.log(`Total proformas fantasma/duplicadas a borrar: ${totalProformasToDelete.length}`);

    if (totalProformasToDelete.length > 0) {
      console.log(`\nEliminando ${totalProformasToDelete.length} proformas duplicadas sin referencias...`);
      const deleteIds = totalProformasToDelete.map((p: any) => p.id);

      await queryRunner.query(`DELETE FROM proforma_detalle WHERE "proformaId" = ANY($1::int[])`, [deleteIds]);
      await queryRunner.query(`DELETE FROM proformas_imagenes WHERE "proformaId" = ANY($1::int[])`, [deleteIds]);
      await queryRunner.query(`DELETE FROM proformas WHERE id = ANY($1::int[])`, [deleteIds]);
      console.log(`Se eliminaron exitosamente las proformas duplicadas.`);
    }

    // Emparejar automáticamente proformaDetalleId en historia_clinica
    await queryRunner.query(`
      UPDATE historia_clinica hc
      SET "proformaDetalleId" = pd.id
      FROM proforma_detalle pd
      JOIN arancel a ON pd."arancelId" = a.id
      WHERE hc."proformaId" = pd."proformaId"
        AND a.detalle IS NOT NULL AND hc.tratamiento IS NOT NULL
        AND LOWER(TRIM(a.detalle)) = LOWER(TRIM(hc.tratamiento))
        AND (hc."proformaDetalleId" IS NULL OR hc."proformaDetalleId" != pd.id);
    `);

    await queryRunner.commitTransaction();
    console.log(`\n======================================================`);
    console.log(`  ¡RECONCILIACIÓN Y LIMPIEZA COMPLETADA CON ÉXITO!`);
    console.log(`======================================================\n`);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error durante la reconciliación de proformas duplicadas:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}

if (require.main === module) {
  reconcileDuplicateProformasModule()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
