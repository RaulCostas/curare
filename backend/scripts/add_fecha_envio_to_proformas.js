const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'curare',
  password: 'postgrespg',
  port: parseInt(process.env.DB_PORT || '5433', 10),
});

async function main() {
  await client.connect();
  await client.query(`
    ALTER TABLE proformas 
    ADD COLUMN IF NOT EXISTS fecha_envio TIMESTAMP NULL;
  `);
  console.log('Column fecha_envio added to proformas table successfully');

  const res = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'proformas' AND column_name = 'fecha_envio';
  `);
  console.log('Verified column:', res.rows);
  await client.end();
}

main().catch(console.error);
