const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function debugAgenda() {
  const client = new Client({
    host: '72.61.76.125',
    port: 5432,
    user: 'postgres',
    password: 'boquenze654',
    database: 'postgres'
  });

  await client.connect();

  const content = fs.readFileSync(path.join(__dirname, 'curare_production_full.sql'), 'utf8');
  const start = content.indexOf('-- Tabla: agenda');
  const end = content.indexOf('-- Tabla: arancel');
  const block = content.substring(start, end);

  console.log('Block length:', block.length);

  try {
    await client.query("SET session_replication_role = 'replica';");
    const res = await client.query(block);
    console.log('Query result:', res);
    const count = await client.query('SELECT count(*) FROM "agenda"');
    console.log('Count AFTER query:', count.rows[0].count);
  } catch (err) {
    console.error('❌ Error executing agenda block:', err);
  }

  await client.end();
}

debugAgenda().catch(console.error);
