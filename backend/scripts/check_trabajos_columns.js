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
  const res = await client.query(`
    SELECT column_name, data_type, column_default, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'trabajos_laboratorios'
    ORDER BY ordinal_position;
  `);
  console.log('Columns in trabajos_laboratorios:', res.rows.map(r => `${r.column_name} (${r.data_type})`));
  await client.end();
}

main().catch(console.error);
