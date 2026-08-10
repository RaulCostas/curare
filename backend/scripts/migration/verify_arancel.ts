import { getAppDataSource } from './config';
import { Especialidad } from '../../src/especialidad/entities/especialidad.entity';
import { Arancel } from '../../src/arancel/entities/arancel.entity';

async function verifyArancel() {
  const dataSource = await getAppDataSource();

  const countEsp = await dataSource.getRepository(Especialidad).count();
  const countArancel = await dataSource.getRepository(Arancel).count();

  console.log('=== VERIFICACIÓN EN POSTGRESQL ===');
  console.log(`- Total Especialidades: ${countEsp}`);
  console.log(`- Total Aranceles: ${countArancel}`);

  const sampleArancel = await dataSource.getRepository(Arancel).find({
    relations: ['especialidad'],
    take: 5,
  });

  console.log('\n--- MUESTRA DE 5 ARANCELES EN POSTGRESQL ---');
  for (const a of sampleArancel) {
    console.log({
      id: a.id,
      codigo: a.codigo,
      detalle: a.detalle,
      precio1: a.precio1,
      precio2: a.precio2,
      tc: a.tc,
      estado: a.estado,
      especialidad: a.especialidad ? `${a.especialidad.id} - ${a.especialidad.especialidad}` : null,
    });
  }

  process.exit(0);
}

verifyArancel();
