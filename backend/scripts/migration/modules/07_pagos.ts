import { getAppDataSource, getMdbReader } from '../config';
import { cleanString, cleanDate, parseCurrency } from '../utils/formatters';
import { FormaPago } from '../../../src/forma_pago/entities/forma_pago.entity';
import { ComisionTarjeta } from '../../../src/comision_tarjeta/entities/comision_tarjeta.entity';
import { Pago } from '../../../src/pagos/entities/pago.entity';
import { Paciente } from '../../../src/pacientes/entities/paciente.entity';
import { Proforma } from '../../../src/proformas/entities/proforma.entity';

export async function migratePagosModule() {
  console.log('\n======================================================');
  console.log('  INICIANDO MIGRACIÓN: FORMA PAGO, COMISIÓN Y PAGOS');
  console.log('======================================================\n');

  const dataSource = await getAppDataSource();
  const reader = getMdbReader();

  // 1. Limpiar tablas en PostgreSQL
  console.log('Limpiando tablas pagos, comision_tarjeta y forma_pago en PostgreSQL...');
  await dataSource.query('TRUNCATE TABLE "pagos", "comision_tarjeta", "forma_pago" RESTART IDENTITY CASCADE;');

  // 2. Grabar Formas de Pago en forma_pago
  console.log('Insertando formas de pago en PostgreSQL (Efectivo, Cheque, Transferencia, QR, Tarjeta, Débito, Depósito)...');
  const formasPagoList = [
    { forma_pago: 'Efectivo', estado: 'activo' },
    { forma_pago: 'Cheque', estado: 'activo' },
    { forma_pago: 'Transferencia', estado: 'activo' },
    { forma_pago: 'QR', estado: 'activo' },
    { forma_pago: 'Tarjeta', estado: 'activo' },
    { forma_pago: 'Débito', estado: 'activo' },
    { forma_pago: 'Depósito', estado: 'activo' },
  ];

  const formaPagoRepo = dataSource.getRepository(FormaPago);
  const savedFormasPago = await formaPagoRepo.save(formasPagoList);

  function normalizeStr(s: string): string {
    return (s || '').toUpperCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  const formaPagoMap = new Map<string, number>();
  for (const fp of savedFormasPago) {
    formaPagoMap.set(normalizeStr(fp.forma_pago), fp.id);
  }

  // 3. Grabar Comisiones de Tarjeta en comision_tarjeta
  console.log('Insertando comisiones de tarjeta en PostgreSQL (American, Enlace, Master, Visa)...');
  const comisionesTarjetaList = [
    { redBanco: 'American', monto: 5.00, estado: 'activo' },
    { redBanco: 'Enlace', monto: 2.00, estado: 'activo' },
    { redBanco: 'Master', monto: 2.00, estado: 'activo' },
    { redBanco: 'Visa', monto: 1.80, estado: 'activo' },
  ];

  const comisionRepo = dataSource.getRepository(ComisionTarjeta);
  const savedComisiones = await comisionRepo.save(comisionesTarjetaList);

  const comisionMap = new Map<string, number>();
  for (const ct of savedComisiones) {
    comisionMap.set(ct.redBanco.toUpperCase(), ct.id);
  }

  // 4. Cargar Pacientes y Proformas para emparejamiento
  console.log('Cargando mapas auxiliares de Pacientes y Proformas...');
  const pgPacientes = await dataSource.getRepository(Paciente).find();

  const patientMapByName = new Map<string, number>();
  for (const p of pgPacientes) {
    const fn1 = `${p.paterno} ${p.materno || ''} ${p.nombre}`.replace(/\s+/g, ' ').trim().toUpperCase();
    const fn2 = `${p.paterno} ${p.nombre}`.replace(/\s+/g, ' ').trim().toUpperCase();
    patientMapByName.set(fn1, p.id);
    if (!patientMapByName.has(fn2)) patientMapByName.set(fn2, p.id);
  }

  const pacienteRowsMdb = reader.getTable('Paciente').getData();
  const accessNameToIdMap = new Map<string, number>();
  for (const p of pacienteRowsMdb) {
    const rawId = cleanString(p.IdPaciente).replace(/^P-/i, '');
    const numId = parseInt(rawId, 10);
    const fullName = `${p.Paterno || ''} ${p.Materno || ''} ${p.Nombre || ''}`.replace(/\s+/g, ' ').trim().toUpperCase();
    if (!isNaN(numId) && fullName) {
      accessNameToIdMap.set(fullName, numId);
    }
  }

  const pgProformas = await dataSource.getRepository(Proforma).find({ select: ['id', 'pacienteId', 'numero'] });
  const proformaMap = new Map<string, number>();
  for (const pr of pgProformas) {
    proformaMap.set(`${pr.pacienteId}_${pr.numero}`, pr.id);
  }

  // 5. Leer Plan_Pagos filtrando por Muestra = 'SI' y (HaberBs > 0 O HaberSus > 0)
  const planPagosTable = reader.getTable('Plan_Pagos');
  const planPagosRows: any[] = planPagosTable.getData();

  const fechaPagoRows = planPagosRows.filter(r => {
    const muestra = cleanString(r.Muestra).toUpperCase();
    const isMuestraSi = muestra === 'SI' || muestra === 'TRUE' || muestra === '1';
    const haberBs = parseCurrency(r.HaberBs);
    const haberSus = parseCurrency(r.HaberSus);
    const hasPayment = (haberBs !== 0 || haberSus !== 0);

    return isMuestraSi && hasPayment;
  });
  console.log(`Se encontraron ${fechaPagoRows.length} registros de pago válidos (Muestra = 'SI' y HaberBs/HaberSus <> 0) en Access.`);

  const pagosToInsert: any[] = [];
  const now = new Date().toISOString();

  for (const r of fechaPagoRows) {
    const accessId = cleanString(r.IdPlan_Pagos);
    const pacName = cleanString(r.Paciente).toUpperCase();

    let pacienteId = accessNameToIdMap.get(pacName) || patientMapByName.get(pacName) || null;

    if (!pacienteId && pacName) {
      const match = pgPacientes.find(p => {
        return pacName.includes(p.paterno.toUpperCase()) && pacName.includes(p.nombre.toUpperCase());
      });
      if (match) pacienteId = match.id;
    }

    if (!pacienteId) continue; // omitir registros sin paciente válido

    const fecha = cleanDate(r.Fecha || r.fnum1) || now.split('T')[0];

    const numProStr = cleanString(r.Plan_Tratamiento);
    const numPro = parseInt(numProStr, 10);
    const proformaId = (!isNaN(numPro) && proformaMap.has(`${pacienteId}_${numPro}`))
      ? proformaMap.get(`${pacienteId}_${numPro}`)!
      : null;

    // Determinar Monto y Moneda
    const haberSus = parseCurrency(r.HaberSus);
    const haberBs = parseCurrency(r.HaberBs);
    const tc = parseCurrency(r.TC) || 6.96;

    let moneda = 'Bolivianos';
    let monto = haberBs;

    if (haberSus !== 0) {
      moneda = 'Dólares';
      monto = haberSus;
    }

    const montoComision = parseCurrency(r.Monto_Comision);
    const recibo = cleanString(r.Recibo);
    const factura = cleanString(r.Factura);
    const obsAccess = cleanString(r.Observaciones);
    const tratamientoStr = cleanString(r.Tratamiento);

    let observaciones = obsAccess;
    if (tratamientoStr.toUpperCase().startsWith('TRAS') || tratamientoStr.toUpperCase().includes('TRASPASO')) {
      observaciones = obsAccess ? `${tratamientoStr} - ${obsAccess}` : tratamientoStr;
    } else if (!observaciones && tratamientoStr && !tratamientoStr.toUpperCase().includes('FECHA PAGO')) {
      observaciones = tratamientoStr;
    }

    // Determinar Forma de Pago y Comisión de Tarjeta
    const fpStrNorm = normalizeStr(cleanString(r.Forma_Pago));
    let formaPagoId: number | null = null;
    let comisionTarjetaId: number | null = null;

    if (fpStrNorm.includes('EFECTIVO')) {
      formaPagoId = formaPagoMap.get('EFECTIVO') || null;
    } else if (fpStrNorm.includes('CHEQUE')) {
      formaPagoId = formaPagoMap.get('CHEQUE') || null;
    } else if (fpStrNorm.includes('TRANSFERENCIA')) {
      formaPagoId = formaPagoMap.get('TRANSFERENCIA') || null;
    } else if (fpStrNorm.includes('QR')) {
      formaPagoId = formaPagoMap.get('QR') || null;
    } else if (fpStrNorm.includes('DEBITO')) {
      formaPagoId = formaPagoMap.get('DEBITO') || null;
    } else if (fpStrNorm.includes('DEPOSITO')) {
      formaPagoId = formaPagoMap.get('DEPOSITO') || null;
    } else if (fpStrNorm.includes('TARJETA')) {
      formaPagoId = formaPagoMap.get('TARJETA') || null;

      if (fpStrNorm.includes('VISA')) {
        comisionTarjetaId = comisionMap.get('VISA') || null;
      } else if (fpStrNorm.includes('MASTER')) {
        comisionTarjetaId = comisionMap.get('MASTER') || null;
      } else if (fpStrNorm.includes('ENLACE')) {
        comisionTarjetaId = comisionMap.get('ENLACE') || null;
      } else if (fpStrNorm.includes('AMERICAN')) {
        comisionTarjetaId = comisionMap.get('AMERICAN') || null;
      }
    } else {
      // Fallback a Efectivo si está vacío
      formaPagoId = formaPagoMap.get('EFECTIVO') || null;
    }

    let calculatedComisionBs = 0;
    if (montoComision > 0) {
      calculatedComisionBs = Number((monto * (montoComision / 100)).toFixed(2));
    } else if (comisionTarjetaId) {
      const comisionEntity = savedComisiones.find(c => c.id === comisionTarjetaId);
      if (comisionEntity) {
        calculatedComisionBs = Number((monto * (Number(comisionEntity.monto) / 100)).toFixed(2));
      }
    }

    pagosToInsert.push({
      access_id: accessId,
      pacienteId,
      fecha,
      proformaId,
      monto,
      monto_comision: calculatedComisionBs,
      tc,
      recibo,
      factura,
      comisionTarjetaId,
      formaPagoId,
      observaciones,
      moneda,
    });
  }

  // 6. Insertar pagos en lotes en PostgreSQL
  console.log(`Insertando ${pagosToInsert.length} pagos en PostgreSQL...`);
  const BATCH_SIZE = 500;
  let pagosInsertados = 0;

  for (let i = 0; i < pagosToInsert.length; i += BATCH_SIZE) {
    const chunk = pagosToInsert.slice(i, i + BATCH_SIZE);
    const sqlInsert = `
      INSERT INTO pagos (
        access_id, "pacienteId", fecha, "proformaId", monto, monto_comision, tc,
        recibo, factura, "comisionTarjetaId", "formaPagoId", observaciones, moneda,
        "createdAt", "updatedAt"
      ) VALUES 
    `;

    const valuePlaceholders: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    for (const item of chunk) {
      const rowParams = [
        item.access_id,
        item.pacienteId,
        item.fecha,
        item.proformaId,
        item.monto,
        item.monto_comision,
        item.tc,
        item.recibo,
        item.factura,
        item.comisionTarjetaId,
        item.formaPagoId,
        item.observaciones,
        item.moneda,
        now,
        now,
      ];

      const placeholders = rowParams.map(() => `$${paramIndex++}`).join(', ');
      valuePlaceholders.push(`(${placeholders})`);
      queryParams.push(...rowParams);
    }

    const fullQuery = sqlInsert + valuePlaceholders.join(', ') + ';';
    await dataSource.query(fullQuery, queryParams);
    pagosInsertados += chunk.length;
  }

  await dataSource.query(`SELECT setval('pagos_id_seq', (SELECT MAX(id) FROM pagos));`);

  console.log('\n======================================================');
  console.log('  MIGRACIÓN COMPLETADA CON ÉXITO: PAGOS');
  console.log(`  - Formas de Pago creadas: ${savedFormasPago.length}`);
  console.log(`  - Comisiones Tarjeta creadas: ${savedComisiones.length}`);
  console.log(`  - Total Pagos Migrados: ${pagosInsertados}`);
  console.log('======================================================\n');
}

// Permitir ejecución directa del script
if (require.main === module) {
  migratePagosModule()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error fatal en migración de pagos:', err);
      process.exit(1);
    });
}
