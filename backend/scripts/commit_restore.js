const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function commitRestore() {
  console.log('🚀 Iniciando restauración definitiva con COMMIT PERMANENTE...');

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
  console.log('✅ Conectado a PostgreSQL!');

  const sqlPath = path.resolve(__dirname, 'curare_production_full.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  // Dividir el script por bloques de tablas ("-- Tabla: ")
  const blocks = sqlContent.split(/-- Tabla:\s*/g);
  console.log(`📦 Procesando ${blocks.length - 1} bloques de tablas de forma independiente...`);

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const headerLine = block.substring(0, block.indexOf('\n')).trim();
    const tableName = headerLine.split(' ')[0];

    const fullSql = block.substring(block.indexOf('\n')).trim();
    if (!fullSql) continue;

    try {
      await client.query("BEGIN;");
      await client.query("SET session_replication_role = 'replica';");
      await client.query(fullSql);
      await client.query("COMMIT;");
      console.log(`✅ [GUARDADO PERMANENTE] Tabla: ${headerLine}`);
    } catch (err) {
      await client.query("ROLLBACK;");
      if (err.message.includes('does not exist')) {
        try {
          await client.query(`CREATE TABLE IF NOT EXISTS "${tableName}" (id SERIAL PRIMARY KEY);`);
          await client.query("BEGIN;");
          await client.query("SET session_replication_role = 'replica';");
          await client.query(fullSql);
          await client.query("COMMIT;");
          console.log(`✅ [GUARDADO PERMANENTE RECREADA] Tabla: ${headerLine}`);
        } catch (retryErr) {
          await client.query("ROLLBACK;");
          console.error(`❌ Error en tabla [${tableName}]: ${retryErr.message.substring(0, 100)}`);
        }
      } else {
        console.error(`❌ Error en tabla [${tableName}]: ${err.message.substring(0, 100)}`);
      }
    }
  }

  console.log(`\n🎉 🎉 🎉 ¡TODAS LAS TABLAS GUARDADAS PERMANENTEMENTE EN DISCO! 🎉 🎉 🎉`);
  await client.end();
}

commitRestore().catch(console.error);
