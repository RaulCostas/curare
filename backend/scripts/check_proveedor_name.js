const { Client } = require('pg');

async function check() {
  const client = new Client({
    host: '127.0.0.1',
    port: 5433,
    user: 'postgres',
    password: 'postgrespg',
    database: 'curare'
  });
  await client.connect();

  const res = await client.query('SELECT * FROM proveedores WHERE id = 39 OR LOWER(proveedor) LIKE \'%proclinic%\'');
  console.log('Proveedores:', res.rows);

  await client.end();
}

check().catch(console.error);
