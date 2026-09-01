import { getAppDataSource, getMdbReader } from '../config';

export async function syncPlanPagosDiscountsModule() {
  console.log('\n======================================================');
  console.log('  SINCRONIZANDO DESCUENTOS DE PLAN_PAGOS A PROFORMAS');
  console.log('======================================================\n');

  const dataSource = await getAppDataSource();
  const reader = getMdbReader();

  const planPagosTable = reader.getTable('Plan_Pagos');
  const planPagosRows = planPagosTable.getData();

  const ppMap = new Map<string, { desc: number; debe: number; debeD: number }>();
  for (const r of planPagosRows) {
    const id = String(r.IdPlan_Pagos || '').trim();
    if (!id) continue;
    const descNum = parseFloat(String(r.Descuento || '0').replace(/\./g, '').replace(',', '.'));
    const debeNum = parseFloat(String(r.Debe || '0').replace(/\./g, '').replace(',', '.'));
    const debeDNum = parseFloat(String(r.DebeD || '0').replace(/\./g, '').replace(',', '.'));
    ppMap.set(id, {
      desc: isNaN(descNum) ? 0 : descNum,
      debe: isNaN(debeNum) ? 0 : debeNum,
      debeD: isNaN(debeDNum) ? 0 : debeDNum,
    });
  }

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const hcRows = await queryRunner.query(`
      SELECT hc.id as hc_id, hc."pacienteId", hc."proformaId", hc."proformaDetalleId", hc.precio, hc."access_plan_pagos_id",
             pd."precioUnitario" as pd_pu, pd."subTotal" as pd_subtotal, pd.descuento as pd_descuento, pd.total as pd_total
      FROM historia_clinica hc
      LEFT JOIN proforma_detalle pd ON pd.id = hc."proformaDetalleId"
      WHERE hc."access_plan_pagos_id" IS NOT NULL
    `);

    const pdUpdates = new Map<number, { discount: number; newTotal: number }>();
    const affectedProformas = new Set<number>();

    for (const r of hcRows) {
      const pp = ppMap.get(r.access_plan_pagos_id);
      if (!pp) continue;

      const ppDiscount = pp.desc;
      const pdDiscount = r.pd_descuento !== null ? parseFloat(r.pd_descuento) : 0;

      if (ppDiscount > pdDiscount && r.proformaDetalleId) {
        const currentSubTotal = parseFloat(r.pd_subtotal || '0');
        const newTotal = parseFloat((currentSubTotal * (1 - ppDiscount / 100)).toFixed(2));

        if (!pdUpdates.has(r.proformaDetalleId) || pdUpdates.get(r.proformaDetalleId)!.discount < ppDiscount) {
          pdUpdates.set(r.proformaDetalleId, {
            discount: ppDiscount,
            newTotal: newTotal,
          });
          if (r.proformaId) affectedProformas.add(r.proformaId);
        }
      }

      if (pp.debeD > 0) {
        const currentHcPrecio = parseFloat(r.precio || '0');
        if (Math.abs(currentHcPrecio - pp.debeD) > 0.01) {
          await queryRunner.query(
            `UPDATE historia_clinica SET precio = $1 WHERE id = $2`,
            [pp.debeD, r.hc_id]
          );
        }
      }
    }

    console.log(`Aplicando descuentos actualizados a ${pdUpdates.size} detalles de proformas...`);
    for (const [pdId, info] of pdUpdates.entries()) {
      await queryRunner.query(
        `UPDATE proforma_detalle SET descuento = $1, total = $2 WHERE id = $3`,
        [info.discount, info.newTotal, pdId]
      );
    }

    if (affectedProformas.size > 0) {
      console.log(`Recalculando totales para ${affectedProformas.size} proformas afectadas...`);
      await queryRunner.query(`
        UPDATE proformas p
        SET total = sub.sum_total
        FROM (
          SELECT "proformaId", ROUND(SUM(total), 2) as sum_total
          FROM proforma_detalle
          GROUP BY "proformaId"
        ) sub
        WHERE p.id = sub."proformaId" AND p.id = ANY($1::int[])
      `, [Array.from(affectedProformas)]);
    }

    await queryRunner.commitTransaction();
    console.log('✅ Descuentos de Plan_Pagos sincronizados con éxito.');
  } catch (err) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Error al sincronizar descuentos de Plan_Pagos:', err);
    throw err;
  } finally {
    await queryRunner.release();
  }
}

if (require.main === module) {
  syncPlanPagosDiscountsModule()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
