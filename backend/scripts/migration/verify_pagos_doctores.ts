import { getAppDataSource } from './config';
import { PagosDoctores } from '../../src/pagos_doctores/entities/pagos_doctores.entity';
import { PagosDetalleDoctores } from '../../src/pagos_doctores/entities/pagos-detalle-doctores.entity';
import { HistoriaClinica } from '../../src/historia_clinica/entities/historia_clinica.entity';

async function verifyPagosDoctores() {
  const dataSource = await getAppDataSource();

  const pdCount = await dataSource.getRepository(PagosDoctores).count();
  const pddCount = await dataSource.getRepository(PagosDetalleDoctores).count();
  const pagadoSiCount = await dataSource.getRepository(HistoriaClinica).count({ where: { pagado: 'SI' } });

  console.log('\n--- VERIFICACIÓN DE PAGOS A DOCTORES EN POSTGRESQL ---');
  console.log(`Total Pagos a Doctores en PG: ${pdCount}`);
  console.log(`Total Detalles de Pagos en PG: ${pddCount}`);
  console.log(`Total Historia Clínica con pagado = 'SI': ${pagadoSiCount}`);

  const samplePD = await dataSource.getRepository(PagosDoctores).find({
    take: 5,
    relations: ['doctor', 'formaPago']
  });

  console.log('\n--- MUESTRA DE PAGOS A DOCTORES ---');
  samplePD.forEach(p => {
    console.log(`ID: ${p.id} | Fecha: ${p.fecha} | Doctor: "${p.doctor?.nombre} ${p.doctor?.paterno}" | Total: ${p.total} ${p.moneda} | TC: ${p.tc} | Banco: "${p.banco || ''}" | FormaPago: "${p.formaPago?.forma_pago}"`);
  });

  const samplePDD = await dataSource.getRepository(PagosDetalleDoctores).find({
    take: 5,
    relations: ['pago', 'historiaClinica']
  });

  console.log('\n--- MUESTRA DE DETALLES DE PAGOS ---');
  samplePDD.forEach(d => {
    console.log(`ID: ${d.id} | PagoID: ${d.pago?.id} | IdHistoriaClinica: ${d.idhistoria_clinica} | CostoLab: ${d.costo_laboratorio} | FechaPagoPac: ${d.fecha_pago_paciente} | FormaPagoPac: "${d.forma_pago_paciente}" | Descuento: ${d.descuento} | Total: ${d.total}`);
  });

  process.exit(0);
}

verifyPagosDoctores().catch((err) => {
  console.error('Error en verificación:', err);
  process.exit(1);
});
