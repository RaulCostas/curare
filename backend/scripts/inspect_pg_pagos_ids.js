const { DataSource } = require('typeorm');

const ds = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5433,
  username: 'postgres',
  password: 'postgrespg',
  database: 'curare',
  synchronize: false
});

async function main() {
  await ds.initialize();

  const maxId = await ds.query('SELECT max(id), count(*) FROM pagos_doctores');
  console.log('Max ID and count in pagos_doctores:', maxId);

  const antequeraPagos = await ds.query(`
    SELECT pd.*
    FROM pagos_doctores pd
    WHERE pd."idDoctor" = 18 AND pd.total = 186.50
  `);
  console.log('Antequera Pagos with total = 186.50 in PG:', antequeraPagos);

  await ds.destroy();
}

main().catch(console.error);
