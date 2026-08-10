import { getAppDataSource } from '../config';
import { Proveedor } from '../../../src/proveedores/entities/proveedor.entity';
import { Egreso } from '../../../src/egresos/entities/egreso.entity';
import { FormaPago } from '../../../src/forma_pago/entities/forma_pago.entity';
import { cleanString, cleanDate, parseCurrency } from '../utils/formatters';
import * as fs from 'fs';
const mdb = require('mdb-reader');

export async function migrateEgresosYProveedores() {
  console.log('\n======================================================');
  console.log('  INICIANDO MIGRACIÓN: PROVEEDORES Y EGRESOS');
  console.log('======================================================\n');

  const dataSource = await getAppDataSource();

  // 1. Limpiar tablas
  console.log('Conexión a PostgreSQL establecida correctamente.');
  console.log('Limpiando tablas egresos y proveedores en PostgreSQL...');
  await dataSource.query('TRUNCATE TABLE "egresos" RESTART IDENTITY CASCADE;');
  await dataSource.query('TRUNCATE TABLE "proveedores" RESTART IDENTITY CASCADE;');

  // 2. Abrir MDB Access
  const mdbPath = 'd:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb';
  if (!fs.existsSync(mdbPath)) {
    throw new Error(`No se encontró la base de datos Access en: ${mdbPath}`);
  }

  const MDBReader = mdb.default || mdb;
  const buffer = fs.readFileSync(mdbPath);
  const reader = new MDBReader(buffer);

  // ----------------------------------------------------
  // 3. MIGRAR PROVEEDOR
  // ----------------------------------------------------
  const provTable = reader.getTable('Proveedor');
  const provRows = provTable.getData();
  console.log(`Se encontraron ${provRows.length} registros en Proveedor de Access.`);

  const provToInsert: any[] = [];

  for (const r of provRows) {
    const rawId = cleanString(r.Id);
    const numId = parseInt(rawId.replace(/^Pv-/i, ''), 10);

    provToInsert.push({
      id: !isNaN(numId) ? numId : undefined,
      access_id: rawId,
      proveedor: cleanString(r.Nombre), // Nombre es proveedor en postgres
      direccion: cleanString(r.Direccion),
      telefono: cleanString(r.Telefono), // Campo telefono agregado en postgres
      celular: cleanString(r.Celular),
      email: cleanString(r.Email),
      nombre_contacto: null, // Dejar vacio
      celular_contacto: null, // Dejar vacio
      estado: 'activo'
    });
  }

  console.log(`Insertando ${provToInsert.length} proveedores en PostgreSQL...`);
  const insertedProvs = await dataSource.getRepository(Proveedor).save(provToInsert);

  // ----------------------------------------------------
  // 4. MIGRAR EGRESOS
  // ----------------------------------------------------
  const egresosTable = reader.getTable('Egresos');
  const egresosRows = egresosTable.getData();
  console.log(`\nSe encontraron ${egresosRows.length} registros en Egresos de Access.`);

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
    if (!str) return 1; // Default Efectivo
    const s = normalizeStr(str);
    for (const f of formas) {
      const fn = normalizeStr(f.forma_pago);
      if (fn.includes(s) || s.includes(fn)) return f.id;
    }
    return 1;
  }

  const egresosToInsert: any[] = [];
  const now = new Date().toISOString().split('T')[0];

  for (const r of egresosRows) {
    const rawId = cleanString(r.IdEgresos);
    const numId = parseInt(rawId.replace(/^E-/i, ''), 10);

    const fecha = cleanDate(r.Fecha || r.fnum1) || now;
    const monto = parseCurrency(r.Monto);
    const moneda = cleanString(r.Moneda).toUpperCase() || 'BOLIVIANOS';
    const formaPagoId = findFormaPagoId(cleanString(r.Forma_Pago));

    egresosToInsert.push({
      id: !isNaN(numId) ? numId : undefined,
      access_id: rawId,
      fecha,
      destino: cleanString(r.Destino),
      detalle: cleanString(r.Detalle),
      monto,
      moneda,
      formaPagoId
    });
  }

  console.log(`Insertando ${egresosToInsert.length} egresos en PostgreSQL...`);
  const chunkSize = 2000;
  for (let i = 0; i < egresosToInsert.length; i += chunkSize) {
    const chunk = egresosToInsert.slice(i, i + chunkSize);
    await dataSource.getRepository(Egreso).insert(chunk);
    console.log(`  -> Insertados ${Math.min(i + chunkSize, egresosToInsert.length)} / ${egresosToInsert.length} egresos...`);
  }

  console.log('\n======================================================');
  console.log('  MIGRACIÓN COMPLETADA CON ÉXITO: PROVEEDORES Y EGRESOS');
  console.log(`  - Proveedores migrados: ${insertedProvs.length}`);
  console.log(`  - Egresos migrados: ${egresosToInsert.length}`);
  console.log('======================================================\n');
}

if (require.main === module) {
  migrateEgresosYProveedores()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error durante la migración:', err);
      process.exit(1);
    });
}
