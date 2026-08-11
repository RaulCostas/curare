const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function testDoctor() {
  const client = new Client({
    host: '72.61.76.125',
    port: 5432,
    user: 'postgres',
    password: 'boquenze654',
    database: 'postgres'
  });
  await client.connect();

  const content = fs.readFileSync(path.join(__dirname, 'curare_production_full.sql'), 'utf8');
  const idx = content.indexOf('-- Tabla: doctor');
  const endIdx = content.indexOf('-- Tabla: egresos');
  const doctorSql = content.substring(idx, endIdx);

  try {
    await client.query("SET session_replication_role = 'replica';");
    await client.query(doctorSql);
    console.log('✅ doctor query succeeded!');
    const res = await client.query('SELECT count(*) FROM "doctor"');
    console.log('Doctor count now:', res.rows[0].count);
  } catch (err) {
    console.error('❌ Error executing doctor SQL:', err);
  }
  await client.end();
}

testDoctor();
