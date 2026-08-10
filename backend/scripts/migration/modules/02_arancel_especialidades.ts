import { getAppDataSource, getMdbReader } from '../config';
import { cleanAccessId, cleanString } from '../utils/formatters';
import { Especialidad } from '../../../src/especialidad/entities/especialidad.entity';
import { Arancel } from '../../../src/arancel/entities/arancel.entity';

export async function migrateArancelEspecialidadesModule() {
  console.log('\n======================================================');
  console.log('  INICIANDO MIGRACIÓN: ESPECIALIDADES Y ARANCEL');
  console.log('======================================================\n');

  const dataSource = await getAppDataSource();
  const reader = getMdbReader();

  const espRepo = dataSource.getRepository(Especialidad);
  const arancelRepo = dataSource.getRepository(Arancel);

  // 1. Limpiar tablas previo a la migración
  console.log('Limpiando tablas especialidad y arancel en PostgreSQL...');
  await dataSource.query('TRUNCATE TABLE "arancel", "especialidad" RESTART IDENTITY CASCADE;');

  // 2. Migrar Especialidad_Material
  const espTable = reader.getTable('Especialidad_Material');
  const espRows: any[] = espTable.getData();
  console.log(`Se encontraron ${espRows.length} registros en Especialidad_Material de Access.`);

  const especialidadesMap = new Map<number, Especialidad>();

  for (const row of espRows) {
    const rawId = cleanString(row.IdEspecialidad_Material);
    const numId = parseInt(rawId.replace(/^EM-/i, ''), 10);
    const nombre = cleanString(row.Especialidad);

    if (isNaN(numId) || !nombre) continue;

    const espData = {
      id: numId,
      especialidad: nombre,
      estado: 'activo',
    };

    // Insertar con ID explícito numérico
    await dataSource.query(
      `INSERT INTO especialidad (id, especialidad, estado) VALUES ($1, $2, $3)`,
      [espData.id, espData.especialidad, espData.estado]
    );

    const createdEsp = await espRepo.findOneBy({ id: numId });
    if (createdEsp) {
      especialidadesMap.set(numId, createdEsp);
    }
  }

  // Ajustar secuencia de IDs de especialidad
  await dataSource.query(`SELECT setval('especialidad_id_seq', (SELECT MAX(id) FROM especialidad));`);
  console.log(`Especialidades migradas exitosamente: ${especialidadesMap.size}\n`);

  // 3. Migrar Arancel
  const arancelTable = reader.getTable('Arancel');
  const arancelRows: any[] = arancelTable.getData();
  console.log(`Se encontraron ${arancelRows.length} registros en Arancel de Access.`);

  let arancelesMigrados = 0;
  const now = new Date().toISOString();

  for (const row of arancelRows) {
    const codigoAccess = cleanString(row.Id); // ej. "01.00", "01.01"
    const detalle = cleanString(row.Detalle);
    if (!codigoAccess || !detalle) continue;

    const rawEspId = cleanString(row.IdEspecialidad_Material);
    const espIdNum = parseInt(rawEspId.replace(/^EM-/i, ''), 10);
    const especialidadObj = !isNaN(espIdNum) ? especialidadesMap.get(espIdNum) : null;

    const monto1 = parseFloat(cleanString(row.Monto1).replace(',', '.')) || 0;
    const monto2 = parseFloat(cleanString(row.Monto2).replace(',', '.')) || 0;
    const tc = parseFloat(cleanString(row.TC).replace(',', '.')) || 0;
    const estadoStr = cleanString(row.Estado).toUpperCase();
    const estado = (estadoStr === 'ELIMINADO' || estadoStr === 'INACTIVO') ? 'inactivo' : 'activo';

    await dataSource.query(
      `INSERT INTO arancel (codigo, detalle, precio1, precio2, tc, estado, "idEspecialidad", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        codigoAccess,
        detalle,
        monto1,
        monto2,
        tc,
        estado,
        especialidadObj ? especialidadObj.id : null,
        now,
        now,
      ]
    );

    arancelesMigrados++;
  }

  // Ajustar secuencia de IDs de arancel
  await dataSource.query(`SELECT setval('arancel_id_seq', (SELECT MAX(id) FROM arancel));`);

  console.log('\n======================================================');
  console.log('  MIGRACIÓN COMPLETADA CON ÉXITO: ESPECIALIDADES Y ARANCEL');
  console.log(`  - Total Especialidades: ${especialidadesMap.size}`);
  console.log(`  - Total Aranceles: ${arancelesMigrados}`);
  console.log('======================================================\n');
}

// Permitir ejecución directa del script
if (require.main === module) {
  migrateArancelEspecialidadesModule()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error fatal en migración de arancel y especialidades:', err);
      process.exit(1);
    });
}
