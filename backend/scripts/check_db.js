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
  const resUsers = await client.query('SELECT count(*) FROM "user"');
  const resPacientes = await client.query('SELECT count(*) FROM "pacientes"');
  console.log('Users count:', resUsers.rows[0].count);
  console.log('Pacientes count:', resPacientes.rows[0].count);
  await client.end();
}

main().catch(console.error);
