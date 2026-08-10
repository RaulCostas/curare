import { getAppDataSource } from './config';

async function updateHistoriaPrecio() {
  console.log('\n======================================================');
  console.log('  ACTUALIZANDO PRECIOS EN POSTGRESQL (HISTORIA CLÍNICA)');
  console.log('======================================================\n');

  const dataSource = await getAppDataSource();

  // 1. Actualización directa por proformaDetalleId vinculada
  console.log('1. Actualizando por proformaDetalleId directo...');
  const res1 = await dataSource.query(`
    UPDATE historia_clinica hc
    SET precio = ROUND(
      (pd.total / GREATEST(pd.cantidad, 1)) * COALESCE(hc.cantidad, 1),
      2
    )
    FROM proforma_detalle pd
    WHERE hc."proformaDetalleId" = pd.id;
  `);
  console.log(`   - Filas actualizadas directamente: ${res1[1] || res1.rowCount || 0}`);

  // 2. Coincidencia secundaria por proformaId + arancel (detalle) para los que no tienen proformaDetalleId
  console.log('2. Buscando coincidencias por proformaId + tratamiento...');
  const res2 = await dataSource.query(`
    UPDATE historia_clinica hc
    SET 
      "proformaDetalleId" = pd.id,
      precio = ROUND(
        (pd.total / GREATEST(pd.cantidad, 1)) * COALESCE(hc.cantidad, 1),
        2
      )
    FROM proforma_detalle pd
    JOIN arancel a ON pd."arancelId" = a.id
    WHERE hc."proformaDetalleId" IS NULL
      AND hc."proformaId" = pd."proformaId"
      AND LOWER(TRIM(hc.tratamiento)) = LOWER(TRIM(a.detalle));
  `);
  console.log(`   - Filas vinculadas por tratamiento: ${res2[1] || res2.rowCount || 0}`);

  // 3. Coincidencia terciaria por proformaId + pieza para los que aún no tienen proformaDetalleId
  console.log('3. Buscando coincidencias por proformaId + pieza...');
  const res3 = await dataSource.query(`
    UPDATE historia_clinica hc
    SET 
      "proformaDetalleId" = pd.id,
      precio = ROUND(
        (pd.total / GREATEST(pd.cantidad, 1)) * COALESCE(hc.cantidad, 1),
        2
      )
    FROM proforma_detalle pd
    WHERE hc."proformaDetalleId" IS NULL
      AND hc."proformaId" = pd."proformaId"
      AND hc.pieza IS NOT NULL 
      AND hc.pieza != ''
      AND pd.piezas IS NOT NULL
      AND pd.piezas LIKE '%' || hc.pieza || '%';
  `);
  console.log(`   - Filas vinculadas por pieza: ${res3[1] || res3.rowCount || 0}`);

  // 4. Estadísticas finales
  const stats = await dataSource.query(`
    SELECT 
      COUNT(*) as total_registros,
      SUM(CASE WHEN precio > 0 THEN 1 ELSE 0 END) as registros_con_precio,
      ROUND(SUM(precio), 2) as suma_total_precio
    FROM historia_clinica;
  `);

  console.log('\n======================================================');
  console.log('  ACTUALIZACIÓN EN POSTGRESQL FINALIZADA');
  console.log(`  - Total Registros: ${stats[0].total_registros}`);
  console.log(`  - Registros con Precio > 0: ${stats[0].registros_con_precio}`);
  console.log(`  - Suma Total Precios en Historia Clínica: Bs. ${stats[0].suma_total_precio}`);
  console.log('======================================================\n');

  process.exit(0);
}

updateHistoriaPrecio().catch(err => {
  console.error('Error al actualizar precios:', err);
  process.exit(1);
});
