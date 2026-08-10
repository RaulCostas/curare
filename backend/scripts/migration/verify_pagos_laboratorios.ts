import { getAppDataSource } from './config';
import { PagoLaboratorio } from '../../src/pagos_laboratorios/entities/pago-laboratorio.entity';

async function verifyPagosLaboratorios() {
  const dataSource = await getAppDataSource();

  const count = await dataSource.getRepository(PagoLaboratorio).count();
  console.log('--- VERIFICACIÓN DE PAGOS LABORATORIOS EN POSTGRESQL ---');
  console.log(`Total Registros en PG: ${count}`);

  const sample = await dataSource.getRepository(PagoLaboratorio).find({
    take: 5,
    relations: ['trabajoLaboratorio', 'formaPago']
  });

  console.log('\n--- MUESTRA DE PAGOS MIGRADOS ---');
  sample.forEach(p => {
    console.log(`ID: ${p.id} | AccessID: ${p.access_id} | Fecha: ${p.fecha} | Monto: ${p.monto} ${p.moneda} | FormaPago: ${p.formaPago?.forma_pago} | Recibo: "${p.recibo}" | Banco: "${p.banco}" | TrabajoLabId: ${p.idTrabajos_Laboratorios}`);
  });

  process.exit(0);
}

verifyPagosLaboratorios();
