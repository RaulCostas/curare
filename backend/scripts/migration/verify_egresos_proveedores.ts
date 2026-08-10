import { getAppDataSource } from './config';
import { Proveedor } from '../../src/proveedores/entities/proveedor.entity';
import { Egreso } from '../../src/egresos/entities/egreso.entity';

async function verifyEgresosYProveedores() {
  const dataSource = await getAppDataSource();

  const provCount = await dataSource.getRepository(Proveedor).count();
  const egresosCount = await dataSource.getRepository(Egreso).count();

  console.log('--- VERIFICACIÓN DE PROVEEDORES Y EGRESOS EN POSTGRESQL ---');
  console.log(`Total Proveedores en PG: ${provCount}`);
  console.log(`Total Egresos en PG: ${egresosCount}`);

  const sampleProv = await dataSource.getRepository(Proveedor).find({ take: 5 });
  console.log('\n--- MUESTRA DE PROVEEDORES ---');
  sampleProv.forEach(p => {
    console.log(`ID: ${p.id} | AccessID: ${p.access_id} | Proveedor: "${p.proveedor}" | Teléfono: "${p.telefono}" | Celular: "${p.celular}" | Contacto: "${p.nombre_contacto}"`);
  });

  const sampleEgresos = await dataSource.getRepository(Egreso).find({
    take: 5,
    relations: ['formaPago']
  });
  console.log('\n--- MUESTRA DE EGRESOS ---');
  sampleEgresos.forEach(e => {
    console.log(`ID: ${e.id} | AccessID: ${e.access_id} | Fecha: ${e.fecha} | Destino: ${e.destino} | Detalle: "${e.detalle}" | Monto: ${e.monto} ${e.moneda} | FormaPago: ${e.formaPago?.forma_pago}`);
  });

  process.exit(0);
}

verifyEgresosYProveedores();
