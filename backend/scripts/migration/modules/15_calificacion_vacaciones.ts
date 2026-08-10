import { getAppDataSource, getMdbReader } from '../config';
import { cleanString, cleanDate } from '../utils/formatters';
import { Calificacion } from '../../../src/calificacion/entities/calificacion.entity';
import { Vacacion } from '../../../src/vacaciones/entities/vacacion.entity';
import { Personal } from '../../../src/personal/entities/personal.entity';
import { Paciente } from '../../../src/pacientes/entities/paciente.entity';
import { User } from '../../../src/users/entities/user.entity';

export async function migrateCalificacionVacacionesModule() {
  console.log('\n======================================================');
  console.log('  INICIANDO MIGRACIÓN: CALIFICACIÓN Y VACACIONES');
  console.log('======================================================\n');

  const dataSource = await getAppDataSource();
  const reader = getMdbReader();

  // 1. Limpiar tablas en PostgreSQL
  console.log('Limpiando tablas calificacion y vacaciones en PostgreSQL...');
  await dataSource.query('TRUNCATE TABLE "calificacion", "vacaciones" RESTART IDENTITY CASCADE;');

  // 2. Cargar datos auxiliares para emparejamiento
  const pgPersonal = await dataSource.getRepository(Personal).find();
  const pgPacientes = await dataSource.getRepository(Paciente).find({ select: ['id'] });
  const pacienteSet = new Set(pgPacientes.map(p => p.id));

  console.log(`Cargados ${pgPersonal.length} miembros de Personal y ${pacienteSet.size} Pacientes.`);

  // Función de coincidencia de Personal por Nombre para Calificación
  function findPersonalIdByNombre(name: string): number | null {
    if (!name) return null;
    const norm = name.toUpperCase().trim();

    // Casos específicos conocidos
    if (norm.includes('JUAN') && norm.includes('HERRERA')) {
      const match = pgPersonal.find(p => p.nombre.toUpperCase().includes('JUAN'));
      if (match) return match.id;
    }
    if (norm.includes('ROSMARY') && norm.includes('HERRERA')) {
      const match = pgPersonal.find(p => p.nombre.toUpperCase().includes('ROSMARY'));
      if (match) return match.id;
    }

    // Coincidencia general
    for (const p of pgPersonal) {
      const pat = (p.paterno || '').toUpperCase().trim();
      const mat = (p.materno || '').toUpperCase().trim();

      if (pat && norm.includes(pat)) {
        if (mat && norm.includes(mat)) return p.id;
        const nomTokens = (p.nombre || '').toUpperCase().trim().split(/\s+/);
        for (const t of nomTokens) {
          if (t.length > 2 && norm.includes(t)) return p.id;
        }
      }
    }

    return null;
  }

  // ----------------------------------------------------
  // 3. MIGRAR TABLA CALIFICACION
  // ----------------------------------------------------
  const califTable = reader.getTable('Calificacion');
  const califRows: any[] = califTable.getData();
  console.log(`\nSe encontraron ${califRows.length} registros en Calificacion de Access.`);

  const calificacionesToInsert: any[] = [];
  const now = new Date().toISOString().split('T')[0];

  for (const r of califRows) {
    const rawId = cleanString(r.IdCalificacion);
    const numId = parseInt(rawId.replace(/^CLF-/i, ''), 10);

    const rawPacId = cleanString(r.IdPaciente);
    const numPacId = parseInt(rawPacId.replace(/^P-/i, ''), 10);
    const pacienteId = (!isNaN(numPacId) && pacienteSet.has(numPacId)) ? numPacId : null;

    if (!pacienteId) continue; // Omitir si no hay paciente válido

    const personalName = cleanString(r.Personal);
    const personalId = findPersonalIdByNombre(personalName);

    if (!personalId) continue; // Omitir si no se reconoce el personal

    // Determinar la calificación (R -> Malo, A -> Regular, V -> Bueno)
    const valR = cleanString(r.R);
    const valA = cleanString(r.A);
    const valV = cleanString(r.V);

    let calificacionStr = 'Regular';
    if (valR === '1' || valR === 'R') {
      calificacionStr = 'Malo';
    } else if (valA === '1' || valA === 'A') {
      calificacionStr = 'Regular';
    } else if (valV === '1' || valV === 'V') {
      calificacionStr = 'Bueno';
    }

    const consultorioNum = parseInt(cleanString(r.Consultorio), 10) || 1;
    const fecha = cleanDate(r.Fecha || r.fnum1) || now;
    const observaciones = cleanString(r.Observaciones) || null;

    calificacionesToInsert.push({
      id: !isNaN(numId) ? numId : undefined,
      personalId,
      pacienteId,
      consultorio: consultorioNum,
      calificacion: calificacionStr,
      fecha,
      observaciones,
      evaluadorId: 3 // Requisito 6: evaluadorId = 3
    });
  }

  console.log(`Insertando ${calificacionesToInsert.length} calificaciones en PostgreSQL...`);
  if (calificacionesToInsert.length > 0) {
    await dataSource.getRepository(Calificacion).save(calificacionesToInsert);
    await dataSource.query(`SELECT setval('calificacion_id_seq', (SELECT MAX(id) FROM calificacion));`);
  }

  // ----------------------------------------------------
  // 4. MIGRAR TABLA VACACIONES
  // ----------------------------------------------------
  const vacTable = reader.getTable('Vacaciones');
  const vacRows: any[] = vacTable.getData();
  console.log(`\nSe encontraron ${vacRows.length} registros en Vacaciones de Access.`);

  const vacacionesToInsert: any[] = [];
  const personalSet = new Set(pgPersonal.map(p => p.id));

  for (const r of vacRows) {
    const rawId = cleanString(r.IdVacaciones);
    const numId = parseInt(rawId.replace(/^V-/i, ''), 10);

    const rawPersId = cleanString(r.IdPersonal);
    let idpersonal: number | null = null;

    if (rawPersId.toUpperCase() === 'RMM') {
      idpersonal = 11; // Rosa Margarita Mendoza Mamani
    } else {
      const numPersId = parseInt(rawPersId.replace(/^PE-/i, ''), 10);
      if (!isNaN(numPersId) && personalSet.has(numPersId)) {
        idpersonal = numPersId;
      }
    }

    if (!idpersonal) continue;

    const fecha = cleanDate(r.Fecha_Registro || r.fnum1) || now;
    const tipoSolicitud = cleanString(r.Tipo_Solicitud) || 'VACACIÓN V';

    const rawDias = cleanString(r.Cantidad_Dias).replace(',', '.');
    const parsedDias = parseFloat(rawDias);
    const cantidadDias = !isNaN(parsedDias) ? Math.round(parsedDias) : 0;

    const fechaDesde = cleanDate(r.Desde || r.fnum2) || fecha;
    const fechaHasta = cleanDate(r.Hasta || r.fnum3) || fecha;
    const autorizado = cleanString(r.Autorizado) || 'NO';
    const observaciones = cleanString(r.Observaciones) || null;

    vacacionesToInsert.push({
      id: !isNaN(numId) ? numId : undefined,
      idpersonal,
      fecha,
      tipo_solicitud: tipoSolicitud,
      cantidad_dias: cantidadDias,
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta,
      autorizado,
      observaciones,
      estado: 'activo'
    });
  }

  console.log(`Insertando ${vacacionesToInsert.length} registros de vacaciones en PostgreSQL...`);
  if (vacacionesToInsert.length > 0) {
    await dataSource.getRepository(Vacacion).save(vacacionesToInsert);
    await dataSource.query(`SELECT setval('vacaciones_id_seq', (SELECT MAX(id) FROM vacaciones));`);
  }

  console.log('\n======================================================');
  console.log('  MIGRACIÓN COMPLETADA CON ÉXITO: CALIFICACIÓN Y VACACIONES');
  console.log(`  - Calificaciones migradas: ${calificacionesToInsert.length}`);
  console.log(`  - Vacaciones migradas: ${vacacionesToInsert.length}`);
  console.log('======================================================\n');
}

// Permitir ejecución directa del script
if (require.main === module) {
  migrateCalificacionVacacionesModule()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error fatal en migración de calificación y vacaciones:', err);
      process.exit(1);
    });
}
