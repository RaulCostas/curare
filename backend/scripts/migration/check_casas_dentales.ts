import { getMdbReader, getAppDataSource } from './config';
import { Proveedor } from '../../src/proveedores/entities/proveedor.entity';
import { Inventario } from '../../src/inventario/entities/inventario.entity';

async function checkPagoCasas() {
  const reader = getMdbReader();
  const dataSource = await getAppDataSource();

  const pagoCasasTable = reader.getTable('Pago_Casas').getData();
  console.log(`Found "Pago_Casas" with ${pagoCasasTable.length} rows.`);
  console.log('\nSample 5 rows of Pago_Casas:');
  console.log(pagoCasasTable.slice(0, 5));

  const pgProveedores = await dataSource.getRepository(Proveedor).find({ take: 10 });
  console.log('\nSample 10 Proveedores in PostgreSQL:');
  console.log(pgProveedores.map(p => ({ id: p.id, proveedor: p.proveedor })));

  const pgInventarioCount = await dataSource.getRepository(Inventario).count();
  console.log(`\nTotal items in Inventario in PostgreSQL: ${pgInventarioCount}`);

  process.exit(0);
}

checkPagoCasas().catch(err => {
  console.error(err);
  process.exit(1);
});
