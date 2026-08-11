const { Client } = require('pg');
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const zlib = require('zlib');

async function runFullRestore() {
  console.log('🚀 Iniciando restauración completa directa...');

  const client = new Client({
    host: '72.61.76.125',
    port: 5432,
    user: 'postgres',
    password: 'boquenze654',
    database: 'postgres'
  });

  await client.connect();
  console.log('✅ Conectado a PostgreSQL!');

  const dumpPath = path.resolve(__dirname, 'curare_production_full.sql');
  const fileStream = fs.createReadStream(dumpPath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let currentQuery = '';
  let successCount = 0;
  let errorCount = 0;

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('--')) continue;

    currentQuery += line + '\n';
    if (trimmed.endsWith(';')) {
      try {
        await client.query(currentQuery);
        successCount++;
      } catch (err) {
        errorCount++;
        const tableMatch = currentQuery.match(/(?:INSERT INTO|TRUNCATE TABLE)\s+\"([^\"]+)\"/i);
        const tableName = tableMatch ? tableMatch[1] : 'unknown';
        console.error(`❌ Error en tabla [${tableName}]: ${err.message.split('\n')[0]}`);
      }
      currentQuery = '';
    }
  }

  console.log(`\n🎉 Restauración finalizada! Consultas exitosas: ${successCount}, Con error: ${errorCount}`);
  await client.end();
}

runFullRestore().catch(console.error);
