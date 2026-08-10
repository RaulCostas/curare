import { getAppDataSource } from './config';
import { ProximaCita } from '../../src/proxima_cita/entities/proxima_cita.entity';
import { SecuenciaTratamiento } from '../../src/secuencia_tratamiento/entities/secuencia_tratamiento.entity';

async function verifyProxSec() {
  const dataSource = await getAppDataSource();

  const proxCount = await dataSource.getRepository(ProximaCita).count();
  const secCount = await dataSource.getRepository(SecuenciaTratamiento).count();

  console.log('--- VERIFICACIÓN EN POSTGRESQL ---');
  console.log(`Total Próximas Citas en PG: ${proxCount}`);
  console.log(`Total Secuencias de Tratamiento en PG: ${secCount}`);

  const sampleProx = await dataSource.getRepository(ProximaCita).find({
    take: 3,
    relations: ['paciente', 'proforma', 'proformaDetalle', 'doctor']
  });

  console.log('\n--- MUESTRA PRÓXIMA CITA ---');
  sampleProx.forEach(p => {
    console.log(`ID: ${p.id} | AccessID: ${p.access_id} | Paciente: ${p.paciente?.paterno} ${p.paciente?.nombre} | ProformaId: ${p.proformaId} | Pieza: "${p.pieza}" | DetalleId: ${p.proformaDetalleId} | Doctor: ${p.doctor?.paterno || 'N/A'}`);
  });

  const sampleSec = await dataSource.getRepository(SecuenciaTratamiento).find({
    take: 3,
    relations: ['paciente', 'proforma']
  });

  console.log('\n--- MUESTRA SECUENCIA TRATAMIENTO ---');
  sampleSec.forEach(s => {
    console.log(`ID: ${s.id} | AccessID: ${s.access_id} | Paciente: ${s.paciente?.paterno} ${s.paciente?.nombre} | ProformaId: ${s.proformaId} | Perio: "${s.periodoncia}" | Cirugia: "${s.cirugia}" | Endodoncia: "${s.endodoncia}"`);
  });

  process.exit(0);
}

verifyProxSec();
