import { getAppDataSource } from './config';
import { Calificacion } from '../../src/calificacion/entities/calificacion.entity';
import { Vacacion } from '../../src/vacaciones/entities/vacacion.entity';

async function verifyCalificacionVacaciones() {
  const dataSource = await getAppDataSource();

  const califCount = await dataSource.getRepository(Calificacion).count();
  const vacCount = await dataSource.getRepository(Vacacion).count();

  console.log('\n--- VERIFICACIÓN DE CALIFICACIÓN Y VACACIONES EN POSTGRESQL ---');
  console.log(`Total Calificaciones en PG: ${califCount}`);
  console.log(`Total Vacaciones en PG: ${vacCount}`);

  const sampleCalif = await dataSource.getRepository(Calificacion).find({
    take: 5,
    relations: ['personal', 'paciente', 'evaluador']
  });

  console.log('\n--- MUESTRA DE CALIFICACIONES ---');
  sampleCalif.forEach(c => {
    console.log(`ID: ${c.id} | Fecha: ${c.fecha} | Consultorio: ${c.consultorio} | Calificación: ${c.calificacion} | Personal: "${c.personal?.nombre} ${c.personal?.paterno}" | Paciente ID: ${c.pacienteId} | EvaluadorId: ${c.evaluadorId}`);
  });

  const sampleVac = await dataSource.getRepository(Vacacion).find({
    take: 5,
    relations: ['personal']
  });

  console.log('\n--- MUESTRA DE VACACIONES ---');
  sampleVac.forEach(v => {
    console.log(`ID: ${v.id} | Fecha: ${v.fecha} | Tipo: "${v.tipo_solicitud}" | Días: ${v.cantidad_dias} | Desde: ${v.fecha_desde} | Hasta: ${v.fecha_hasta} | Personal: "${v.personal?.nombre} ${v.personal?.paterno}" | Autorizado: "${v.autorizado}"`);
  });

  process.exit(0);
}

verifyCalificacionVacaciones().catch((err) => {
  console.error('Error en verificación:', err);
  process.exit(1);
});
