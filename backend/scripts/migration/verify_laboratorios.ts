import { getAppDataSource } from './config';
import { Laboratorio } from '../../src/laboratorios/entities/laboratorio.entity';
import { PrecioLaboratorio } from '../../src/precios_laboratorios/entities/precio-laboratorio.entity';

async function verifyLaboratorios() {
  const dataSource = await getAppDataSource();

  const labCount = await dataSource.getRepository(Laboratorio).count();
  const preciosCount = await dataSource.getRepository(PrecioLaboratorio).count();

  console.log('--- VERIFICACIÓN DE LABORATORIOS EN POSTGRESQL ---');
  console.log(`Total Laboratorios en PG: ${labCount}`);
  console.log(`Total Precios de Laboratorio en PG: ${preciosCount}`);

  const sampleLabs = await dataSource.getRepository(Laboratorio).find({ take: 5 });
  console.log('\n--- MUESTRA DE LABORATORIOS ---');
  sampleLabs.forEach(l => {
    console.log(`ID: ${l.id} | AccessID: ${l.access_id} | Nombre: ${l.laboratorio} | Banco: "${l.banco}" | NroCuenta: "${l.numero_cuenta}" | Estado: ${l.estado}`);
  });

  const samplePrecios = await dataSource.getRepository(PrecioLaboratorio).find({
    take: 5,
    relations: ['laboratorio']
  });
  console.log('\n--- MUESTRA DE PRECIOS LABORATORIOS ---');
  samplePrecios.forEach(p => {
    console.log(`ID: ${p.id} | AccessID: ${p.access_id} | LabId: ${p.idLaboratorio} (${p.laboratorio?.laboratorio}) | Detalle: "${p.detalle}" | Precio: ${p.precio}`);
  });

  process.exit(0);
}

verifyLaboratorios();
