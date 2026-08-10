import { getAppDataSource } from './config';
import { Paciente } from '../../src/pacientes/entities/paciente.entity';

async function checkCount() {
  const dataSource = await getAppDataSource();
  const count = await dataSource.getRepository(Paciente).count();
  console.log(`Conteo actual de Pacientes en PostgreSQL: ${count}`);
  process.exit(0);
}

checkCount();
