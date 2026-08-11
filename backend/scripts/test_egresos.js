const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function testEgresos() {
  const client = new Client({
    host: '72.61.76.125',
    port: 5432,
    user: 'postgres',
    password: 'boquenze654',
    database: 'postgres'
  });
  await client.connect();

  const content = fs.readFileSync(path.join(__dirname, 'curare_production_full.sql'), 'utf8');
  const idx = content.indexOf('-- Tabla: egresos');
  const endIdx = content.indexOf('-- Tabla: egresos_inventario');
  const egresosSql = content.substring(idx, endIdx);

  try {
    await client.query("SET session_replication_role = 'replica';");
    await client.query(egresosSql);
    console.log('✅ egresos query succeeded!');
    const res = await client.query('SELECT count(*) FROM "egresos"');
    console.log('Egresos count now:', res.rows[0].count);
  } catch (err) {
    console.error('❌ Error executing egresos SQL:', err);
  }
  await client.end();
}

testEgresos();
