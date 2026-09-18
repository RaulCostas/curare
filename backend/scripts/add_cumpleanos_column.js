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
    ALTER TABLE pacientes 
    ADD COLUMN IF NOT EXISTS fecha_felicitacion_cumpleanos TIMESTAMP NULL;
  `);
  console.log('Column fecha_felicitacion_cumpleanos added successfully');

  const res = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'pacientes' AND column_name = 'fecha_felicitacion_cumpleanos';
  `);
  console.log('Verified column:', res.rows);
  await client.end();
}

main().catch(console.error);
