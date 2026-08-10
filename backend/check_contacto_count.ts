import { getAppDataSource } from './scripts/migration/config';

async function checkCount() {
  const dataSource = await getAppDataSource();
  const count = await dataSource.query('SELECT COUNT(*) FROM contacto');
  const sample = await dataSource.query('SELECT * FROM contacto LIMIT 5');
  console.log('Total registros en PostgreSQL (contacto):', count[0].count);
  console.log('Muestra:', sample);
  process.exit(0);
}

checkCount();
