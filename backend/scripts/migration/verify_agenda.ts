import { getAppDataSource } from './config';
import { Agenda } from '../../src/agenda/entities/agenda.entity';

async function verifyAgenda() {
  const dataSource = await getAppDataSource();

  const count = await dataSource.getRepository(Agenda).count();
  console.log('--- VERIFICACIÓN DE AGENDA EN POSTGRESQL ---');
  console.log(`Total registros en PostgreSQL: ${count}`);

  const sample = await dataSource.getRepository(Agenda).find({
    take: 5,
    relations: ['paciente', 'doctor', 'usuario']
  });

  console.log('\n--- MUESTRA DE REGISTROS MIGRADOS ---');
  sample.forEach(a => {
    console.log(`ID: ${a.id} | AccessID: ${a.access_id} | Fecha: ${a.fecha} ${a.hora} | Duración: ${a.duracion}m | Cons: ${a.consultorio} | Paciente: ${a.paciente ? `${a.paciente.paterno} ${a.paciente.nombre}` : 'N/A'} | Doctor: ${a.doctor ? a.doctor.paterno : 'N/A'} | Trat: "${a.tratamiento}" | AgendadoPor: ${a.usuario?.name || 'N/A'} | ProformaId: ${a.proformaId} | PersonalId: ${a.personalId}`);
  });

  process.exit(0);
}

verifyAgenda();
