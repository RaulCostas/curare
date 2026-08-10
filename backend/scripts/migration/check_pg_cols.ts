import { getAppDataSource } from './config';

async function checkPgColumns() {
  const dataSource = await getAppDataSource();
  const cols = await dataSource.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'pacientes';
  `);
  console.log('Columnas de la tabla pacientes en PostgreSQL:');
  console.log(cols.map((c: any) => c.column_name));
  
  const sampleRow = await dataSource.query(`SELECT * FROM pacientes ORDER BY id ASC LIMIT 1;`);
  console.log('\nPrimer registro en PostgreSQL:');
  console.log(sampleRow[0]);

  const sampleFicha = await dataSource.query(`SELECT * FROM ficha_medica ORDER BY id ASC LIMIT 1;`);
  console.log('\nPrimera ficha médica en PostgreSQL:');
  console.log(sampleFicha[0]);

  process.exit(0);
}

checkPgColumns();
