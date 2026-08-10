import { getAppDataSource } from './config';
import { GastosFijos } from '../../src/gastos_fijos/entities/gastos_fijos.entity';
import { PagosGastosFijos } from '../../src/pagos_gastos_fijos/entities/pagos_gastos_fijos.entity';

async function verifyGastosFijosYPagos() {
  const dataSource = await getAppDataSource();

  const gfCount = await dataSource.getRepository(GastosFijos).count();
  const pgfCount = await dataSource.getRepository(PagosGastosFijos).count();

  console.log('--- VERIFICACIÓN DE GASTOS FIJOS Y PAGOS EN POSTGRESQL ---');
  console.log(`Total Gastos Fijos en PG: ${gfCount}`);
  console.log(`Total Pagos de Gastos Fijos en PG: ${pgfCount}`);

  const sampleGF = await dataSource.getRepository(GastosFijos).find({ take: 5 });
  console.log('\n--- MUESTRA DE GASTOS FIJOS ---');
  sampleGF.forEach(g => {
    console.log(`ID: ${g.id} | AccessID: ${g.access_id} | Destino: ${g.destino} | GastoFijo: "${g.gasto_fijo}" | Monto: ${g.monto} ${g.moneda} | Estado: ${g.estado}`);
  });

  const samplePGF = await dataSource.getRepository(PagosGastosFijos).find({
    take: 5,
    relations: ['gastoFijo', 'formaPago']
  });
  console.log('\n--- MUESTRA DE PAGOS DE GASTOS FIJOS ---');
  samplePGF.forEach(p => {
    console.log(`ID: ${p.id} | AccessID: ${p.access_id} | Fecha: ${p.fecha} | Monto: ${p.monto} ${p.moneda} | GastoFijo: "${p.gastoFijo?.gasto_fijo}" | FormaPago: ${p.formaPago?.forma_pago}`);
  });

  process.exit(0);
}

verifyGastosFijosYPagos();
