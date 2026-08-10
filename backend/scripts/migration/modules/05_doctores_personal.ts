import { getAppDataSource, getMdbReader } from '../config';
import { cleanString, cleanDate } from '../utils/formatters';
import { Doctor } from '../../../src/doctors/entities/doctor.entity';
import { Personal } from '../../../src/personal/entities/personal.entity';
import { Especialidad } from '../../../src/especialidad/entities/especialidad.entity';

export async function migrateDoctoresPersonalModule() {
  console.log('\n======================================================');
  console.log('  INICIANDO MIGRACIÓN: DOCTORES Y PERSONAL');
  console.log('======================================================\n');

  const dataSource = await getAppDataSource();
  const reader = getMdbReader();

  const doctorRepo = dataSource.getRepository(Doctor);
  const personalRepo = dataSource.getRepository(Personal);
  const espRepo = dataSource.getRepository(Especialidad);

  // 1. Limpiar tablas en PostgreSQL
  console.log('Limpiando tablas doctor y personal en PostgreSQL...');
  await dataSource.query('TRUNCATE TABLE "doctor", "personal" RESTART IDENTITY CASCADE;');

  // 2. Cargar Especialidades existentes para emparejamiento
  const especialidades = await espRepo.find();
  console.log(`Cargadas ${especialidades.length} especialidades para vinculación.`);

  function findEspecialidadId(espStr: string): number | null {
    if (!espStr) return null;
    const clean = espStr.trim().toUpperCase();
    if (!clean) return null;

    // Coincidencia exacta
    for (const e of especialidades) {
      if (e.especialidad.toUpperCase() === clean) return e.id;
    }

    // Coincidencias comunes
    if (clean.includes('ODONTO') || clean.includes('PEDIATRA')) {
      const match = especialidades.find(e => e.especialidad.toUpperCase().includes('ODONTOPEDIATRIA'));
      if (match) return match.id;
    }
    if (clean.includes('IMPLANT')) {
      const match = especialidades.find(e => e.especialidad.toUpperCase().includes('REHABILITACION'));
      if (match) return match.id;
    }
    if (clean.includes('ESTETICA')) {
      const match = especialidades.find(e => e.especialidad.toUpperCase().includes('ESTETICA'));
      if (match) return match.id;
    }
    if (clean.includes('ORTODONCIA')) {
      const match = especialidades.find(e => e.especialidad.toUpperCase().includes('ORTODONCIA'));
      if (match) return match.id;
    }
    if (clean.includes('CONSULTA')) {
      const match = especialidades.find(e => e.especialidad.toUpperCase().includes('CONSULTAS'));
      if (match) return match.id;
    }

    return null;
  }

  // 3. Migrar Tabla Doctor
  const doctorTable = reader.getTable('Doctor');
  const doctorRows: any[] = doctorTable.getData();
  console.log(`\nSe encontraron ${doctorRows.length} registros en la tabla Doctor de Access.`);

  let doctoresMigrados = 0;
  const now = new Date().toISOString();

  for (const row of doctorRows) {
    const rawId = cleanString(row.IdCod_Doc);
    if (!rawId) continue;

    const numId = parseInt(rawId.replace(/^D-/i, ''), 10);
    const apellidos = cleanString(row.Apellidos);
    const nombres = cleanString(row.Nombres);
    const direccion = cleanString(row.Direccion);
    const celular = cleanString(row.Celular || row.Telefono);

    // Estado: ALTA -> activo, BAJA -> inactivo
    const bajaAlta = cleanString(row.BajaAlta).toUpperCase();
    const estado = (bajaAlta === 'BAJA' || bajaAlta === 'INACTIVO') ? 'inactivo' : 'activo';

    // Especialidad
    const espStr = cleanString(row.Especialidad);
    const idEspecialidad = findEspecialidadId(espStr);

    await dataSource.query(
      `INSERT INTO doctor (id, access_id, paterno, materno, nombre, celular, direccion, estado, "idEspecialidad", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        !isNaN(numId) ? numId : null,
        rawId,
        apellidos,
        '', // materno opcional
        nombres,
        celular,
        direccion,
        estado,
        idEspecialidad,
        now,
        now,
      ]
    );
    doctoresMigrados++;
  }

  await dataSource.query(`SELECT setval('doctor_id_seq', (SELECT MAX(id) FROM doctor));`);
  console.log(`Doctores migrados con éxito: ${doctoresMigrados}`);

  // 4. Migrar Tabla Personal
  const personalTable = reader.getTable('Personal');
  const personalRows: any[] = personalTable.getData();
  console.log(`\nSe encontraron ${personalRows.length} registros en la tabla Personal de Access.`);

  let personalMigrado = 0;

  for (const row of personalRows) {
    const rawId = cleanString(row.IdPersonal);
    if (!rawId) continue;

    const numId = parseInt(rawId.replace(/^PE-/i, ''), 10);
    const nombre = cleanString(row.Nombre);
    const paterno = cleanString(row.Paterno);
    const materno = cleanString(row.Materno);
    const ci = cleanString(row.CI);
    const direccion = cleanString(row.Direccion);
    const telefono = cleanString(row.Telefono);
    const celular = cleanString(row.Celular);

    const fechaNac = cleanDate(row.Nacimiento);
    const fechaIngreso = cleanDate(row.Fecha_Ingreso);
    const fechaBaja = cleanDate(row.Fecha_Baja);

    const estadoStr = cleanString(row.Estado).toUpperCase();
    const estado = (estadoStr === 'BAJA' || estadoStr === 'INACTIVO') ? 'inactivo' : 'activo';

    await dataSource.query(
      `INSERT INTO personal (id, paterno, materno, nombre, ci, direccion, telefono, celular, fecha_nacimiento, fecha_ingreso, personal_tipo_id, estado, fecha_baja)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        !isNaN(numId) ? numId : null,
        paterno,
        materno,
        nombre,
        ci,
        direccion,
        telefono,
        celular,
        fechaNac,
        fechaIngreso,
        null, // personal_tipo_id dejar vacío por indicación del usuario
        estado,
        fechaBaja,
      ]
    );
    personalMigrado++;
  }

  await dataSource.query(`SELECT setval('personal_id_seq', (SELECT MAX(id) FROM personal));`);
  console.log(`Personal migrado con éxito: ${personalMigrado}`);

  console.log('\n======================================================');
  console.log('  MIGRACIÓN COMPLETADA CON ÉXITO: DOCTORES Y PERSONAL');
  console.log(`  - Total Doctores: ${doctoresMigrados}`);
  console.log(`  - Total Personal: ${personalMigrado}`);
  console.log('======================================================\n');
}

// Permitir ejecución directa del script
if (require.main === module) {
  migrateDoctoresPersonalModule()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error fatal en migración de doctores y personal:', err);
      process.exit(1);
    });
}
