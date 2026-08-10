import { getAppDataSource } from './config';
import { Doctor } from '../../src/doctors/entities/doctor.entity';
import { Personal } from '../../src/personal/entities/personal.entity';

async function verifyDoctoresPersonal() {
  const dataSource = await getAppDataSource();

  const countDoctores = await dataSource.getRepository(Doctor).count();
  const countPersonal = await dataSource.getRepository(Personal).count();

  console.log('=== VERIFICACIÓN EN POSTGRESQL ===');
  console.log(`- Total Doctores: ${countDoctores}`);
  console.log(`- Total Personal: ${countPersonal}`);

  const sampleDoctores = await dataSource.getRepository(Doctor).find({
    relations: ['especialidad'],
    take: 5,
  });

  console.log('\n--- MUESTRA DE 5 DOCTORES EN POSTGRESQL ---');
  for (const d of sampleDoctores) {
    console.log({
      id: d.id,
      access_id: d.access_id,
      nombre_completo: `${d.nombre} ${d.paterno}`.trim(),
      celular: d.celular,
      estado: d.estado,
      especialidad: d.especialidad ? `${d.especialidad.id} - ${d.especialidad.especialidad}` : 'Ninguna',
    });
  }

  const samplePersonal = await dataSource.getRepository(Personal).find({
    take: 5,
  });

  console.log('\n--- MUESTRA DE 5 REGISTROS DE PERSONAL EN POSTGRESQL ---');
  for (const p of samplePersonal) {
    console.log({
      id: p.id,
      nombre_completo: `${p.nombre} ${p.paterno} ${p.materno}`.trim(),
      ci: p.ci,
      celular: p.celular,
      estado: p.estado,
      personal_tipo_id: p.personal_tipo_id,
    });
  }

  process.exit(0);
}

verifyDoctoresPersonal();
