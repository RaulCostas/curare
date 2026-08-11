const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: '72.61.76.125',
    port: 5432,
    user: 'postgres',
    password: 'boquenze654',
    database: 'postgres'
  });
  await client.connect();
  const res = await client.query('SELECT id, name, email, estado FROM "user" LIMIT 10');
  console.log('Usuarios en Produccion:', res.rows);
  await client.end();
}

main().catch(console.error);
