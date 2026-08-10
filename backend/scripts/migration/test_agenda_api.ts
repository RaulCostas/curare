import { getAppDataSource } from './config';
import { AgendaService } from '../../src/agenda/agenda.service';
import { Agenda } from '../../src/agenda/entities/agenda.entity';

async function testAgendaQuery() {
  const dataSource = await getAppDataSource();
  const repo = dataSource.getRepository(Agenda);
  const service = new AgendaService(repo);

  console.log('--- PROBANDO REPOSITORY QUERY EN AGENDA ---');
  const resultToday = await service.findAll('2026-07-29');
  console.log(`Citas para 2026-07-29: ${resultToday.length}`);

  const sampleDate = '2024-05-17';
  const resultSample = await service.findAll(sampleDate);
  console.log(`Citas para ${sampleDate}: ${resultSample.length}`);
  if (resultSample.length > 0) {
    console.log('Muestra cita:', {
      id: resultSample[0].id,
      fecha: resultSample[0].fecha,
      hora: resultSample[0].hora,
      paciente: resultSample[0].paciente ? `${resultSample[0].paciente.paterno} ${resultSample[0].paciente.nombre}` : null,
      doctor: resultSample[0].doctor ? resultSample[0].doctor.paterno : null,
      usuario: resultSample[0].usuario ? resultSample[0].usuario.name : null
    });
  }

  process.exit(0);
}

testAgendaQuery();
