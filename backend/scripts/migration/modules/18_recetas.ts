import { getAppDataSource } from '../config';
import { Receta } from '../../../src/receta/entities/receta.entity';
import { RecetaDetalle } from '../../../src/receta/entities/receta-detalle.entity';
import { Paciente } from '../../../src/pacientes/entities/paciente.entity';
import { cleanString, cleanDate } from '../utils/formatters';
import * as fs from 'fs';
const mdb = require('mdb-reader');

export async function migrateRecetasModule() {
  console.log('\n======================================================');
  console.log('  INICIANDO MIGRACIÓN: RECETAS Y RECETA_DETALLE');
  console.log('======================================================\n');

  const dataSource = await getAppDataSource();

  // 1. Limpiar tablas en PostgreSQL
  console.log('Limpiando tablas receta_detalle y receta en PostgreSQL...');
  await dataSource.query('TRUNCATE TABLE "receta_detalle" RESTART IDENTITY CASCADE;');
  await dataSource.query('TRUNCATE TABLE "receta" RESTART IDENTITY CASCADE;');

  // 2. Cargar Pacientes existentes
  const pacientesRepo = dataSource.getRepository(Paciente);
  const pacientesList = await pacientesRepo.find({ select: ['id', 'access_id'] });
  const pacienteMap = new Map<string, number>();

  pacientesList.forEach(p => {
    if (p.access_id) {
      pacienteMap.set(p.access_id.toUpperCase().trim(), p.id);
    }
  });
  console.log(`Se cargaron ${pacienteMap.size} pacientes con access_id para vincular recetas.`);

  // 3. Abrir MDB Access
  const mdbPath = 'd:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb';
  if (!fs.existsSync(mdbPath)) {
    throw new Error(`No se encontró la base de datos Access en: ${mdbPath}`);
  }

  const MDBReader = mdb.default || mdb;
  const buffer = fs.readFileSync(mdbPath);
  const reader = new MDBReader(buffer);

  const recetaTable = reader.getTable('Receta');
  const recetaRows: any[] = recetaTable.getData();
  console.log(`Se encontraron ${recetaRows.length} registros en la tabla Receta de Access.`);

  let recetasCreadas = 0;
  let detallesCreados = 0;
  const now = new Date().toISOString().split('T')[0];

  for (const r of recetaRows) {
    const rawId = cleanString(r.IdReceta);
    const numId = parseInt(rawId.replace(/^Re-/i, ''), 10);

    const rawIdPac = cleanString(r.IdPaciente).toUpperCase().trim();
    const pacienteId = pacienteMap.get(rawIdPac);

    if (!pacienteId) {
      console.warn(`[OMITIDO] Receta ${rawId}: No se encontró paciente en PG con access_id = "${rawIdPac}"`);
      continue;
    }

    const fecha = cleanDate(r.Fecha || r.fnum1) || now;

    // Insertar Cabecera Receta
    let createdRecetaId: number;
    if (!isNaN(numId)) {
      const res = await dataSource.query(`
        INSERT INTO receta (id, paciente_id, fecha, diagnostico, indicaciones, doctor_id, user_id)
        VALUES ($1, $2, $3, NULL, NULL, NULL, NULL)
        ON CONFLICT (id) DO UPDATE SET
          paciente_id = EXCLUDED.paciente_id,
          fecha = EXCLUDED.fecha
        RETURNING id;
      `, [numId, pacienteId, fecha]);
      createdRecetaId = res[0].id;
    } else {
      const res = await dataSource.query(`
        INSERT INTO receta (paciente_id, fecha, diagnostico, indicaciones, doctor_id, user_id)
        VALUES ($1, $2, NULL, NULL, NULL, NULL)
        RETURNING id;
      `, [pacienteId, fecha]);
      createdRecetaId = res[0].id;
    }
    recetasCreadas++;

    // Insertar Detalles (medicamentos 1 a 5)
    for (let k = 1; k <= 5; k++) {
      const med = cleanString(r[`medicamento${k}`]);
      const cant = cleanString(r[`cantidad${k}`]);
      const ind = cleanString(r[`indicaciones${k}`]);

      if (med || cant || ind) {
        await dataSource.query(`
          INSERT INTO receta_detalle (receta_id, medicamento, cantidad, indicacion)
          VALUES ($1, $2, $3, $4);
        `, [
          createdRecetaId,
          med || 'MEDICAMENTO HISTÓRICO',
          cant || null,
          ind || null
        ]);
        detallesCreados++;
      }
    }
  }

  // Ajustar secuencias en PostgreSQL
  await dataSource.query(`SELECT setval('receta_id_seq', (SELECT GREATEST(MAX(id), 1) FROM receta));`);
  await dataSource.query(`SELECT setval('receta_detalle_id_seq', (SELECT GREATEST(MAX(id), 1) FROM receta_detalle));`);

  console.log('\n======================================================');
  console.log('  MIGRACIÓN COMPLETADA CON ÉXITO: RECETAS');
  console.log(`  - Total Cabeceras de Recetas Migradas: ${recetasCreadas}`);
  console.log(`  - Total Detalles de Medicamentos Migrados: ${detallesCreados}`);
  console.log('======================================================\n');
}

if (require.main === module) {
  migrateRecetasModule()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error durante la migración:', err);
      process.exit(1);
    });
}
