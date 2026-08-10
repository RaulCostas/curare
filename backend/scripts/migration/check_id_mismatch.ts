import { getAppDataSource } from './config';

async function checkIds() {
  const dataSource = await getAppDataSource();
  const rows = await dataSource.query(`SELECT id, access_id, nombre, paterno FROM pacientes ORDER BY id ASC LIMIT 10;`);
  console.log('Muestra de los primeros 10 pacientes en PostgreSQL:');
  console.table(rows);
  process.exit(0);
}

checkIds();
