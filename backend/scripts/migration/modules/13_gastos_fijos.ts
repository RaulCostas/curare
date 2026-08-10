import { getAppDataSource } from '../config';
import { GastosFijos } from '../../../src/gastos_fijos/entities/gastos_fijos.entity';
import { PagosGastosFijos } from '../../../src/pagos_gastos_fijos/entities/pagos_gastos_fijos.entity';
import { FormaPago } from '../../../src/forma_pago/entities/forma_pago.entity';
import { cleanString, cleanDate, parseCurrency } from '../utils/formatters';
import * as fs from 'fs';
const mdb = require('mdb-reader');

export async function migrateGastosFijosYPagos() {
  console.log('\n======================================================');
  console.log('  INICIANDO MIGRACIÓN: GASTOS FIJOS Y PAGOS GASTOS FIJOS');
  console.log('======================================================\n');

  const dataSource = await getAppDataSource();

  // 1. Limpiar tablas
  console.log('Conexión a PostgreSQL establecida correctamente.');
  console.log('Limpiando tablas pagos_gastos_fijos y gastos_fijos en PostgreSQL...');
  await dataSource.query('TRUNCATE TABLE "pagos_gastos_fijos" RESTART IDENTITY CASCADE;');
  await dataSource.query('TRUNCATE TABLE "gastos_fijos" RESTART IDENTITY CASCADE;');

  // 2. Abrir MDB Access
  const mdbPath = 'd:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb';
  if (!fs.existsSync(mdbPath)) {
    throw new Error(`No se encontró la base de datos Access en: ${mdbPath}`);
  }

  const MDBReader = mdb.default || mdb;
  const buffer = fs.readFileSync(mdbPath);
  const reader = new MDBReader(buffer);

  // ----------------------------------------------------
  // 3. MIGRAR GASTOS_FIJOS
  // ----------------------------------------------------
  const gfTable = reader.getTable('Gastos_Fijos');
  const gfRows = gfTable.getData();
  console.log(`Se encontraron ${gfRows.length} registros en Gastos_Fijos de Access.`);

  const gfToInsert: any[] = [];
  const gfMapByMessage = new Map<string, number>();

  for (const r of gfRows) {
    const rawId = cleanString(r.Id);
    const numId = parseInt(rawId.replace(/^G-/i, ''), 10);
    const gastoFijo = cleanString(r.Mensaje); // Mensaje es gasto_fijo
    const anualStr = cleanString(r.Anual).toUpperCase();

    const record = {
      id: !isNaN(numId) ? numId : undefined,
      access_id: rawId,
      destino: cleanString(r.Destino),
      dia: parseInt(cleanString(r.Dia), 10) || 1,
      anual: anualStr === 'SI',
      mes: cleanString(r.Mes),
      gasto_fijo: gastoFijo,
      monto: parseCurrency(r.Monto),
      moneda: cleanString(r.Moneda).toUpperCase() || 'BOLIVIANOS',
      estado: 'activo' // Todos activo
    };

    gfToInsert.push(record);
  }

  console.log(`Insertando ${gfToInsert.length} gastos fijos en PostgreSQL...`);
  const insertedGF = await dataSource.getRepository(GastosFijos).save(gfToInsert);

  insertedGF.forEach(g => {
    if (g.gasto_fijo) {
      gfMapByMessage.set(g.gasto_fijo.toUpperCase().trim(), g.id);
    }
  });

  // ----------------------------------------------------
  // 4. MIGRAR PAGO_GASTO_FIJO
  // ----------------------------------------------------
  const pgfTable = reader.getTable('Pago_Gasto_Fijo');
  const pgfRows = pgfTable.getData();
  console.log(`\nSe encontraron ${pgfRows.length} registros en Pago_Gasto_Fijo de Access.`);

  function normalizeStr(s: string): string {
    return (s || '').toUpperCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  const formaRepo = dataSource.getRepository(FormaPago);
  let formas = await formaRepo.find();
  const existingNorms = new Set(formas.map(f => normalizeStr(f.forma_pago)));

  const defaultsNeeded = ['Efectivo', 'Cheque', 'Transferencia', 'QR', 'Tarjeta', 'Débito', 'Depósito'];
  let addedAny = false;
  for (const defName of defaultsNeeded) {
    if (!existingNorms.has(normalizeStr(defName))) {
      await formaRepo.save({ forma_pago: defName, estado: 'activo' });
      addedAny = true;
    }
  }
  if (addedAny) {
    formas = await formaRepo.find();
  }

  function findFormaPagoId(str: string): number {
    if (!str) return 1;
    const s = normalizeStr(str);
    for (const f of formas) {
      const fn = normalizeStr(f.forma_pago);
      if (fn.includes(s) || s.includes(fn)) return f.id;
    }
    return 1;
  }

  const pgfToInsert: any[] = [];
  const now = new Date().toISOString().split('T')[0];

  for (const r of pgfRows) {
    const rawId = cleanString(r.Id);
    const numId = parseInt(rawId.replace(/^PG-/i, ''), 10);

    const det = cleanString(r.Detalle).toUpperCase().trim();
    let gastoFijoId = gfMapByMessage.get(det) || null;

    if (!gastoFijoId && det) {
      for (const [k, id] of gfMapByMessage.entries()) {
        if (k.includes(det) || det.includes(k)) {
          gastoFijoId = id;
          break;
        }
      }
    }

    const fecha = cleanDate(r.Fecha || r.fnum1) || now;
    const monto = parseCurrency(r.Monto);
    const moneda = cleanString(r.Moneda).toUpperCase() || 'BOLIVIANOS';
    const formaPagoId = findFormaPagoId(cleanString(r.Forma_Pago));

    pgfToInsert.push({
      id: !isNaN(numId) ? numId : undefined,
      access_id: rawId,
      gastoFijoId,
      fecha,
      monto,
      moneda,
      formaPagoId,
      observaciones: null
    });
  }

  console.log(`Insertando ${pgfToInsert.length} pagos de gastos fijos en PostgreSQL...`);
  const chunkSize = 2000;
  for (let i = 0; i < pgfToInsert.length; i += chunkSize) {
    const chunk = pgfToInsert.slice(i, i + chunkSize);
    await dataSource.getRepository(PagosGastosFijos).insert(chunk);
    console.log(`  -> Insertados ${Math.min(i + chunkSize, pgfToInsert.length)} / ${pgfToInsert.length} pagos de gastos fijos...`);
  }

  console.log('\n======================================================');
  console.log('  MIGRACIÓN COMPLETADA CON ÉXITO: GASTOS FIJOS Y PAGOS GASTOS FIJOS');
  console.log(`  - Gastos Fijos migrados: ${insertedGF.length}`);
  console.log(`  - Pagos de Gastos Fijos migrados: ${pgfToInsert.length}`);
  console.log('======================================================\n');
}

if (require.main === module) {
  migrateGastosFijosYPagos()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error durante la migración:', err);
      process.exit(1);
    });
}
