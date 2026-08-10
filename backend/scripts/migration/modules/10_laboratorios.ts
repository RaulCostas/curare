import { getAppDataSource } from '../config';
import { Laboratorio } from '../../../src/laboratorios/entities/laboratorio.entity';
import { PrecioLaboratorio } from '../../../src/precios_laboratorios/entities/precio-laboratorio.entity';
import { cleanString, parseCurrency } from '../utils/formatters';
import * as fs from 'fs';
const mdb = require('mdb-reader');

// Función auxiliar para separar Banco y Número de Cuenta
function parseBancoCuenta(bancoStr: string): { banco: string | null; numeroCuenta: string | null } {
  if (!bancoStr || bancoStr.trim() === '.' || bancoStr.trim() === '') {
    return { banco: null, numeroCuenta: null };
  }

  const str = bancoStr.trim();
  const bankNames = ['BNB', 'BISA', 'MERCANTIL', 'BCP', 'UNION', 'FIE', 'SOL', 'GANADERO'];

  let foundBank: string | null = null;
  let accountNum: string | null = null;

  for (const b of bankNames) {
    if (str.toUpperCase().includes(b)) {
      foundBank = b;
      break;
    }
  }

  const accMatch = str.match(/[\d\-]{5,}/);
  if (accMatch) {
    accountNum = accMatch[0];
  }

  if (!foundBank && !accountNum) {
    return { banco: str, numeroCuenta: null };
  }

  return { banco: foundBank, numeroCuenta: accountNum };
}

export async function migrateLaboratoriosYPrecios() {
  console.log('\n======================================================');
  console.log('  INICIANDO MIGRACIÓN: LABORATORIOS Y PRECIOS LABORATORIOS');
  console.log('======================================================\n');

  const dataSource = await getAppDataSource();

  // 1. Limpiar tablas
  console.log('Conexión a PostgreSQL establecida correctamente.');
  console.log('Limpiando tablas precios_laboratorios y laboratorios en PostgreSQL...');
  await dataSource.query('TRUNCATE TABLE "precios_laboratorios" RESTART IDENTITY CASCADE;');
  await dataSource.query('TRUNCATE TABLE "laboratorios" RESTART IDENTITY CASCADE;');

  // 2. Abrir MDB Access
  const mdbPath = 'd:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb';
  if (!fs.existsSync(mdbPath)) {
    throw new Error(`No se encontró la base de datos Access en: ${mdbPath}`);
  }

  const MDBReader = mdb.default || mdb;
  const buffer = fs.readFileSync(mdbPath);
  const reader = new MDBReader(buffer);

  // ----------------------------------------------------
  // 3. MIGRAR LABORATORIO
  // ----------------------------------------------------
  const labTable = reader.getTable('Laboratorio');
  const labRows = labTable.getData();
  console.log(`Se encontraron ${labRows.length} registros en Laboratorio de Access.`);

  const labToInsert: any[] = [];
  const labNameToIdMap = new Map<string, number>();

  for (const r of labRows) {
    const rawId = cleanString(r.Id);
    const numId = parseInt(rawId.replace(/^Lab-/i, ''), 10);
    const nombre = cleanString(r.Nombre);

    const { banco, numeroCuenta } = parseBancoCuenta(cleanString(r.Banco));
    const bajaAlta = cleanString(r.BajaAlta).toUpperCase();
    const estado = bajaAlta === 'BAJA' ? 'inactivo' : 'activo';

    const labRecord = {
      id: !isNaN(numId) ? numId : undefined,
      access_id: rawId,
      laboratorio: nombre,
      direccion: cleanString(r.Direccion),
      telefono: cleanString(r.Telefono),
      celular: cleanString(r.Celular),
      email: cleanString(r.Email),
      banco: banco,
      numero_cuenta: numeroCuenta,
      estado
    };

    labToInsert.push(labRecord);
  }

  console.log(`Insertando ${labToInsert.length} laboratorios en PostgreSQL...`);
  const insertedLabs = await dataSource.getRepository(Laboratorio).save(labToInsert);

  for (const l of insertedLabs) {
    if (l.laboratorio) {
      labNameToIdMap.set(l.laboratorio.toUpperCase().trim(), l.id);
    }
  }

  // ----------------------------------------------------
  // 4. MIGRAR PRECIOS_LABORATORIOS
  // ----------------------------------------------------
  const preciosTable = reader.getTable('Precios_Laboratorios');
  const preciosRows = preciosTable.getData();
  console.log(`\nSe encontraron ${preciosRows.length} registros en Precios_Laboratorios de Access.`);

  const preciosToInsert: any[] = [];

  for (const r of preciosRows) {
    const rawId = cleanString(r.Id);
    const numId = parseInt(rawId.replace(/^Pre-Lab-/i, ''), 10);
    const labName = cleanString(r.Laboratorio).toUpperCase().trim();

    let idLaboratorio = labNameToIdMap.get(labName) || null;
    if (!idLaboratorio) {
      for (const [k, id] of labNameToIdMap.entries()) {
        if (k.includes(labName) || labName.includes(k)) {
          idLaboratorio = id;
          break;
        }
      }
    }

    if (!idLaboratorio) {
      console.warn(`No se pudo encontrar idLaboratorio para '${labName}' (Id: ${rawId})`);
      continue;
    }

    const detalle = cleanString(r.Detalle);
    const precio = parseCurrency(r.Precio);

    preciosToInsert.push({
      id: !isNaN(numId) ? numId : undefined,
      access_id: rawId,
      idLaboratorio,
      detalle,
      precio,
      estado: 'activo'
    });
  }

  console.log(`Insertando ${preciosToInsert.length} precios de laboratorio en PostgreSQL...`);
  await dataSource.getRepository(PrecioLaboratorio).save(preciosToInsert);

  console.log('\n======================================================');
  console.log('  MIGRACIÓN COMPLETADA CON ÉXITO: LABORATORIOS Y PRECIOS LABORATORIOS');
  console.log(`  - Laboratorios migrados: ${insertedLabs.length}`);
  console.log(`  - Precios de Laboratorio migrados: ${preciosToInsert.length}`);
  console.log('======================================================\n');
}

if (require.main === module) {
  migrateLaboratoriosYPrecios()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error durante la migración:', err);
      process.exit(1);
    });
}
