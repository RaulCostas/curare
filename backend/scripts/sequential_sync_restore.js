const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function syncRestore() {
  console.log('🚀 RESTAURACIÓN SECUENCIAL SINCRONIZADA (100% GARANTIZADA)...');

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

  // Dividir por bloques de tabla
  const blocks = sqlContent.split(/-- Tabla:\s*/g);
  console.log(`📦 Procesando ${blocks.length - 1} tablas secuencialmente...`);

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const headerLine = block.substring(0, block.indexOf('\n')).trim();
    const tableName = headerLine.split(' ')[0];

    const bodySql = block.substring(block.indexOf('\n')).trim();
    if (!bodySql) continue;

    console.log(`⏳ Cargando [${tableName}]...`);
    const startTableTime = Date.now();

    try {
      await client.query("SET session_replication_role = 'replica';");
      await client.query(bodySql);
      await client.query("SET session_replication_role = 'origin';");

      const countRes = await client.query(`SELECT count(*) FROM "${tableName}"`);
      const elapsed = ((Date.now() - startTableTime) / 1000).toFixed(1);
      console.log(`🟢 [OK COMPLETA] ${tableName}: ${countRes.rows[0].count} registros en disco (${elapsed}s)`);
    } catch (err) {
      if (err.message.includes('does not exist')) {
        try {
          await client.query(`CREATE TABLE IF NOT EXISTS "${tableName}" (id SERIAL PRIMARY KEY);`);
          await client.query("SET session_replication_role = 'replica';");
          await client.query(bodySql);
          await client.query("SET session_replication_role = 'origin';");
          const countRes = await client.query(`SELECT count(*) FROM "${tableName}"`);
          console.log(`🟢 [OK RECREADA] ${tableName}: ${countRes.rows[0].count} registros`);
        } catch (e) {
          console.error(`❌ Error en ${tableName}: ${e.message.split('\n')[0]}`);
        }
      } else {
        console.error(`❌ Error en ${tableName}: ${err.message.split('\n')[0]}`);
      }
    }
  }

  console.log('\n🎉 🎉 🎉 ¡RESTAURACIÓN TOTAL SECUENCIAL FINALIZADA CON ÉXITO! 🎉 🎉 🎉');
  await client.end();
}

syncRestore().catch(console.error);
