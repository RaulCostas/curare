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
  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);

  console.log(`📊 Encontradas ${tablesRes.rows.length} tablas en la base de datos:`);
  for (const row of tablesRes.rows) {
    const tableName = row.table_name;
    try {
      const countRes = await client.query(`SELECT count(*) FROM "${tableName}"`);
      console.log(`- ${tableName}: ${countRes.rows[0].count} registros`);
    } catch (err) {
      console.log(`- ${tableName}: ERROR (${err.message})`);
    }
  }
  await client.end();
}

main().catch(console.error);
