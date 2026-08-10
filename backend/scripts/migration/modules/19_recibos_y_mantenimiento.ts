import { getAppDataSource } from '../config';
import { cleanString, cleanDate } from '../utils/formatters';
import * as fs from 'fs';
const mdb = require('mdb-reader');

const cleanNum = (val: any): number => {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const parsed = parseFloat(String(val).replace(',', '.'));
  return isNaN(parsed) ? 0 : parsed;
};

export async function migrateRecibosYMantenimientoModule() {
  console.log('\n======================================================');
  console.log('  INICIANDO MIGRACIÓN: RECIBOS Y MANTENIMIENTO CONSULTORIOS');
  console.log('======================================================\n');

  const dataSource = await getAppDataSource();

  // 1. Limpiar tablas en PostgreSQL
  console.log('Limpiando tablas recibos y repuestos en PostgreSQL...');
  await dataSource.query('TRUNCATE TABLE "recibos" RESTART IDENTITY CASCADE;');
  await dataSource.query('TRUNCATE TABLE "repuestos" RESTART IDENTITY CASCADE;');

  // 2. Abrir MDB Access
  const mdbPath = 'd:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb';
  if (!fs.existsSync(mdbPath)) {
    throw new Error(`No se encontró la base de datos Access en: ${mdbPath}`);
  }

  const MDBReader = mdb.default || mdb;
  const buffer = fs.readFileSync(mdbPath);
  const reader = new MDBReader(buffer);

  const now = new Date().toISOString().split('T')[0];

  // ----------------------------------------------------
  // A. MIGRAR TABLA "Recibo" -> "recibos"
  // ----------------------------------------------------
  let recibosCreados = 0;
  if (reader.getTableNames().includes('Recibo')) {
    const reciboTable = reader.getTable('Recibo');
    const reciboRows: any[] = reciboTable.getData();
    console.log(`Migrando ${reciboRows.length} registros de la tabla Recibo...`);

    for (const r of reciboRows) {
      const accessId = cleanString(r.Id);
      const fecha = cleanDate(r.Fecha || r.fnum1) || now;
      const nombre = cleanString(r.Nombre);
      const concepto = cleanString(r.Concepto);
      const moneda = cleanString(r.Moneda) || 'BOLIVIANOS';
      const monto = cleanNum(r.Monto);

      await dataSource.query(`
        INSERT INTO recibos (access_id, fecha, nombre, concepto, moneda, monto, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW());
      `, [accessId, fecha, nombre, concepto, moneda, monto]);

      recibosCreados++;
    }
    await dataSource.query(`SELECT setval('recibos_id_seq', (SELECT GREATEST(MAX(id), 1) FROM recibos));`);
  }

  // ----------------------------------------------------
  // B. MIGRAR TABLA "Repuestos" -> "repuestos"
  // ----------------------------------------------------
  let repuestosCreados = 0;
  if (reader.getTableNames().includes('Repuestos')) {
    const repuestoTable = reader.getTable('Repuestos');
    const repuestoRows: any[] = repuestoTable.getData();
    console.log(`Migrando ${repuestoRows.length} registros de la tabla Repuestos (Mantenimiento)...`);

    for (const r of repuestoRows) {
      const fecha = cleanDate(r.Fecha || r.fnum1) || now;
      const consultorio = cleanString(r.Consultorio);
      const descripcion = cleanString(r.Descripcion);
      const motivo = cleanString(r.Motivo);
      const observaciones = cleanString(r.Observaciones);
      const costo = cleanNum(r.Costo);
      const manoObra = cleanNum(r.Mano_Obra);

      await dataSource.query(`
        INSERT INTO repuestos (fecha, consultorio, descripcion, motivo, observaciones, costo, mano_obra, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW());
      `, [fecha, consultorio, descripcion, motivo, observaciones, costo, manoObra]);

      repuestosCreados++;
    }
    await dataSource.query(`SELECT setval('repuestos_id_seq', (SELECT GREATEST(MAX(id), 1) FROM repuestos));`);
  }

  console.log('\n======================================================');
  console.log('  MIGRACIÓN COMPLETADA CON ÉXITO: OTROS');
  console.log(`  - Total Recibos Migrados: ${recibosCreados}`);
  console.log(`  - Total Mantenimientos / Repuestos Migrados: ${repuestosCreados}`);
  console.log('======================================================\n');
}

if (require.main === module) {
  migrateRecibosYMantenimientoModule()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error durante la migración:', err);
      process.exit(1);
    });
}
