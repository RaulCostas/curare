import { getAppDataSource, getMdbReader } from '../config';
import { cleanString, cleanDate, parseCurrency } from '../utils/formatters';
import { PagosDoctores } from '../../../src/pagos_doctores/entities/pagos_doctores.entity';
import { Doctor } from '../../../src/doctors/entities/doctor.entity';
import { FormaPago } from '../../../src/forma_pago/entities/forma_pago.entity';

export async function migratePagosDoctoresModule() {
  console.log('\n======================================================');
  console.log('  INICIANDO MIGRACIÓN: PAGOS A DOCTORES Y DETALLES');
  console.log('======================================================\n');

  const dataSource = await getAppDataSource();
  const reader = getMdbReader();

  // 1. Limpiar tablas en PostgreSQL
  console.log('Limpiando tablas pagos_detalle_doctores y pagos_doctores en PostgreSQL...');
  await dataSource.query('TRUNCATE TABLE "pagos_detalle_doctores", "pagos_doctores" RESTART IDENTITY CASCADE;');

  // 2. Cargar mapas auxiliares
  console.log('Cargando mapas auxiliares (Doctores, Formas de Pago, Historia Clínica)...');
  
  const pgDoctores = await dataSource.getRepository(Doctor).find();
  const pgFormas = await dataSource.getRepository(FormaPago).find();
  
  const hcRows = await dataSource.query('SELECT id, access_trabajos_doctores_id, "pacienteId", fecha, pieza, tratamiento FROM historia_clinica;');
  
  const hcMapByAccessId = new Map<string, number>();
  for (const h of hcRows) {
    if (h.access_trabajos_doctores_id) {
      hcMapByAccessId.set(h.access_trabajos_doctores_id.toUpperCase().trim(), h.id);
    }
  }

  function normalizeStr(s: string): string {
    return (s || '').toUpperCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function findDoctorId(docStr: string): number | null {
    if (!docStr) return null;
    const str = normalizeStr(docStr);
    if (!str) return null;

    for (const d of pgDoctores) {
      const full1 = normalizeStr(`${d.nombre} ${d.paterno} ${d.materno || ''}`);
      const full2 = normalizeStr(`${d.paterno} ${d.materno || ''} ${d.nombre}`);
      const full3 = normalizeStr(`${d.paterno} ${d.nombre}`);
      const pat = normalizeStr(d.paterno);

      if (full1.includes(str) || full2.includes(str) || full3.includes(str) || str.includes(pat)) {
        return d.id;
      }
    }
    return pgDoctores.length > 0 ? pgDoctores[0].id : null;
  }

  function findFormaPagoId(fpStr: string): number {
    if (!fpStr) return 1;
    const str = normalizeStr(fpStr);
    for (const f of pgFormas) {
      const fn = normalizeStr(f.forma_pago);
      if (fn.includes(str) || str.includes(fn)) return f.id;
    }
    return 1;
  }

  // ----------------------------------------------------
  // 3. MIGRAR PAGO_DOCTORES
  // ----------------------------------------------------
  const pdTable = reader.getTable('Pago_Doctores');
  const pdRows: any[] = pdTable.getData();
  console.log(`\nSe encontraron ${pdRows.length} registros en Pago_Doctores de Access.`);

  const pdToInsert: any[] = [];
  const accessIdToPgIdMap = new Map<string, number>();
  const now = new Date().toISOString().split('T')[0];

  for (const r of pdRows) {
    const rawId = cleanString(r.IdPagos);
    const numId = parseInt(rawId.replace(/^P-D-/i, ''), 10);

    const doctorId = findDoctorId(cleanString(r.Doctor));
    if (!doctorId) continue;

    const fecha = cleanDate(r.Fecha || r.fnum1) || now;
    const comision = parseCurrency(r.Comision);
    const total = parseCurrency(r.Total);

    const monedaRaw = cleanString(r.Moneda).toUpperCase();
    const isDolares = monedaRaw.includes('DOLAR') || monedaRaw.includes('SUS');
    const moneda = isDolares ? 'DOLARES' : 'BOLIVIANOS';
    const tc = isDolares ? 6.96 : 0;

    const idForma_pago = findFormaPagoId(cleanString(r.Forma_Pago));
    const banco = cleanString(r.Banco) || null;

    const rec = {
      id: !isNaN(numId) ? numId : undefined,
      idDoctor: doctorId,
      fecha,
      comision,
      total,
      moneda,
      tc,
      banco,
      idForma_pago
    };

    pdToInsert.push(rec);
  }

  console.log(`Insertando ${pdToInsert.length} pagos de doctores en PostgreSQL...`);
  const insertedPD = await dataSource.getRepository(PagosDoctores).save(pdToInsert);
  
  for (let i = 0; i < pdRows.length; i++) {
    const rawId = cleanString(pdRows[i].IdPagos);
    const savedObj = insertedPD[i];
    if (rawId && savedObj) {
      accessIdToPgIdMap.set(rawId.toUpperCase().trim(), savedObj.id);
    }
  }

  await dataSource.query(`SELECT setval('pagos_doctores_id_seq', (SELECT MAX(id) FROM pagos_doctores));`);

  // ----------------------------------------------------
  // 4. MIGRAR PAGO_DOCTORES_DETALLE
  // ----------------------------------------------------
  const pddTable = reader.getTable('Pago_Doctores_Detalle');
  const pddRows: any[] = pddTable.getData();
  console.log(`\nSe encontraron ${pddRows.length} registros en Pago_Doctores_Detalle de Access.`);

  const pddToInsert: any[] = [];
  const hcIdsToUpdatePagado = new Set<number>();
  let skippedCount = 0;

  for (const r of pddRows) {
    const rawPagoId = cleanString(r.IdPagos).toUpperCase().trim();
    const idPagos = accessIdToPgIdMap.get(rawPagoId) || null;

    if (!idPagos) {
      skippedCount++;
      continue;
    }

    const rawTrDr = cleanString(r.IdTrabajos_Doctores).toUpperCase().trim();
    let idhistoria_clinica: number | null = (rawTrDr && hcMapByAccessId.has(rawTrDr)) ? hcMapByAccessId.get(rawTrDr)! : null;

    if (!idhistoria_clinica) {
      // Coincidencia secundaria
      const r1Fecha = cleanDate(r.R1);
      const r3Trat = cleanString(r.R3).toUpperCase();
      const r4Pieza = cleanString(r.R4);

      const candidate = hcRows.find((h: any) => {
        const matchFecha = r1Fecha && h.fecha && h.fecha.toString().split('T')[0] === r1Fecha;
        const matchTrat = r3Trat && h.tratamiento && h.tratamiento.toUpperCase().includes(r3Trat);
        const matchPieza = !r4Pieza || !h.pieza || h.pieza === r4Pieza;
        return matchFecha && (matchTrat || matchPieza);
      });

      if (candidate) {
        idhistoria_clinica = candidate.id;
      }
    }

    if (!idhistoria_clinica) {
      skippedCount++;
      continue;
    }

    hcIdsToUpdatePagado.add(idhistoria_clinica);

    const costo_laboratorio = parseCurrency(r.Costo_Lab);
    const fecha_pago_paciente = cleanDate(r.Fecha_Pago);
    const forma_pago_paciente = cleanString(r.Forma_Pago) || null;
    const descuento = parseCurrency(r.Descuento);
    const total = parseCurrency(r.Sub_Total);

    pddToInsert.push({
      idPagos,
      idhistoria_clinica,
      costo_laboratorio,
      fecha_pago_paciente,
      forma_pago_paciente,
      descuento,
      total
    });
  }

  console.log(`Insertando ${pddToInsert.length} detalles de pagos a doctores en PostgreSQL (Omitidos: ${skippedCount})...`);
  const chunkSize = 1000;
  for (let i = 0; i < pddToInsert.length; i += chunkSize) {
    const chunk = pddToInsert.slice(i, i + chunkSize);
    const values = chunk.map(d => `(${d.idPagos}, ${d.idhistoria_clinica}, ${d.costo_laboratorio}, ${d.fecha_pago_paciente ? `'${d.fecha_pago_paciente}'` : 'NULL'}, ${d.forma_pago_paciente ? `'${d.forma_pago_paciente.replace(/'/g, "''")}'` : 'NULL'}, ${d.descuento}, ${d.total})`).join(',\n');
    
    await dataSource.query(`
      INSERT INTO pagos_detalle_doctores ("idPagos", "idhistoria_clinica", costo_laboratorio, fecha_pago_paciente, forma_pago_paciente, descuento, total)
      VALUES ${values}
    `);
  }

  await dataSource.query(`SELECT setval('pagos_detalle_doctores_id_seq', (SELECT MAX(id) FROM pagos_detalle_doctores));`);

  // ----------------------------------------------------
  // 5. ACTUALIZAR HISTORIA_CLINICA: pagado = 'SI'
  // ----------------------------------------------------
  console.log(`\nActualizando ${hcIdsToUpdatePagado.size} registros en historia_clinica a pagado = 'SI'...`);
  const hcIdArray = Array.from(hcIdsToUpdatePagado);
  const updateBatchSize = 1000;
  for (let i = 0; i < hcIdArray.length; i += updateBatchSize) {
    const batch = hcIdArray.slice(i, i + updateBatchSize);
    await dataSource.query(
      `UPDATE historia_clinica SET pagado = 'SI' WHERE id IN (${batch.join(',')});`
    );
  }

  console.log('\n======================================================');
  console.log('  MIGRACIÓN COMPLETADA CON ÉXITO: PAGOS A DOCTORES');
  console.log(`  - Pagos a Doctores migrados: ${pdToInsert.length}`);
  console.log(`  - Detalles de Pagos migrados: ${pddToInsert.length}`);
  console.log(`  - Historias Clínicas marcadas como pagado='SI': ${hcIdsToUpdatePagado.size}`);
  console.log('======================================================\n');
}

// Permitir ejecución directa del script
if (require.main === module) {
  migratePagosDoctoresModule()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error fatal en migración de pagos a doctores:', err);
      process.exit(1);
    });
}
