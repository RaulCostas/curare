const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function fastRestore() {
  console.log('🚀 Iniciando restauración ultra-rápida (1 solo bloque masivo)...');

  const client = new Client({
    host: '72.61.76.125',
    port: 5432,
    user: 'postgres',
    password: 'boquenze654',
    database: 'postgres',
    statement_timeout: 0,
    query_timeout: 0,
    connectionTimeoutMillis: 10000
  });

  await client.connect();
  console.log('✅ Conectado a PostgreSQL!');

  const sqlPath = path.resolve(__dirname, 'curare_production_full.sql');
  console.log('📖 Leyendo archivo SQL desglosado (150 MB)...');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('⚡ Envitando 150 MB de comandos SQL en un solo stream a la base de datos...');
  const startTime = Date.now();
  
  try {
    await client.query(sql);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n🎉 🎉 🎉 ¡RESTAURACIÓN TOTAL FINALIZADA EN ${duration} SEGUNGOS! 🎉 🎉 🎉`);
  } catch (err) {
    console.error('❌ Error durante la ejecución:', err.message);
  } finally {
    await client.end();
  }
}

fastRestore().catch(console.error);
