import { getAppDataSource } from './config';
import { Agenda } from '../../src/agenda/entities/agenda.entity';

async function checkFechaAgendadoSample() {
  const dataSource = await getAppDataSource();

  const sample = await dataSource.getRepository(Agenda).createQueryBuilder('a')
    .where('a.fechaAgendado IS NOT NULL')
    .limit(5)
    .getMany();

  console.log('--- MUESTRA DE FECHA_AGENDADO COMBINADO EN POSTGRESQL ---');
  sample.forEach(a => {
    console.log(`ID: ${a.id} | AccessID: ${a.access_id} | fechaAgendado: ${a.fechaAgendado?.toISOString()}`);
  });

  process.exit(0);
}

checkFechaAgendadoSample();
