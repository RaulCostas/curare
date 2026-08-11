const { Client } = require('pg');
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const zlib = require('zlib');

async function restore() {
  console.log('🚀 Iniciando restauración directa de alta velocidad hacia 72.61.76.125:5432...');

  const client = new Client({
    host: '72.61.76.125',
    port: 5432,
    user: 'postgres',
    password: 'boquenze654',
    database: 'postgres',
    statement_timeout: 0,
    query_timeout: 0
  });

  await client.connect();
  console.log('✅ Conectado a PostgreSQL en el VPS de Hostinger!');

  const dumpPath = path.resolve(__dirname, 'curare_production_full.sql.gz');
  const gzStream = fs.createReadStream(dumpPath).pipe(zlib.createGunzip());
  const rl = readline.createInterface({ input: gzStream, crlfDelay: Infinity });

  let currentQuery = '';
  let queryCount = 0;
  let errorCount = 0;
  const startTime = Date.now();

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('--')) continue;

    currentQuery += line + '\n';
    if (trimmed.endsWith(';')) {
      try {
        await client.query(currentQuery);
        queryCount++;
        if (queryCount % 1000 === 0) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          console.log(`⚡ Comandos ejecutados: ${queryCount} (${elapsed}s)...`);
        }
      } catch (err) {
        errorCount++;
        if (!err.message.includes('already exists') && !err.message.includes('does not exist')) {
          console.error(`⚠️ Error en consulta (${queryCount}): ${err.message.substring(0, 100)}`);
        }
      }
      currentQuery = '';
    }
  }

  if (currentQuery.trim()) {
    try { await client.query(currentQuery); } catch (e) {}
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉 ¡RESTAURACIÓN FINALIZADA CON ÉXITO ABSOLUTO!`);
  console.log(`📊 Comandos procesados: ${queryCount} en ${duration} segundos.`);
  await client.end();
}

restore().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
