const { Client } = require('pg');

const client = new Client({
  host: '127.0.0.1',
  port: 5433,
  user: 'postgres',
  password: 'postgrespg',
  database: 'curare'
});

async function run() {
  await client.connect();
  console.log('Connected to PostgreSQL on port 5433');

  await client.query("ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'Pendiente'");
  console.log('Column estado verified/added');

  const updateRes = await client.query("UPDATE pedidos SET estado = 'Recibido'");
  console.log('Updated all existing pedidos to Recibido:', updateRes.rowCount);

  const res = await client.query('SELECT id, fecha, "Total", "Pagado", estado FROM pedidos ORDER BY id DESC LIMIT 5');
  console.log('Sample rows:', res.rows);

  await client.end();
}

run().catch(console.error);
