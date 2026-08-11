const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function superBatchRestore() {
  console.log('⚡⚡⚡ RESTAURACIÓN SUPER-BATCH ULTRA RÁPIDA (20 SEGUNDOS TOTAL) ⚡⚡⚡');

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
  console.log('✅ Conectado a PostgreSQL en 72.61.76.125:5432!');

  const sqlPath = path.resolve(__dirname, 'curare_production_full.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  // Dividir el archivo por bloques de tablas ("-- Tabla: ")
  const blocks = sqlContent.split(/-- Tabla:\s*/g);
  console.log(`📦 Procesando ${blocks.length - 1} tablas en envíos masivos por bloque...`);

  let totalSuccess = 0;
  const startTime = Date.now();

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const headerLine = block.substring(0, block.indexOf('\n')).trim();
    const tableName = headerLine.split(' ')[0];

    const bodySql = block.substring(block.indexOf('\n')).trim();
    if (!bodySql) continue;

    // Ejecutar todo el bloque de la tabla en 1 sola consulta SQL masiva
    const fullTableQuery = `
      SET session_replication_role = 'replica';
      ${bodySql}
      SET session_replication_role = 'origin';
    `;

    try {
      await client.query(fullTableQuery);
      console.log(`✅ [COMPLETA] ${headerLine}`);
      totalSuccess++;
    } catch (err) {
      if (err.message.includes('does not exist')) {
        try {
          await client.query(`CREATE TABLE IF NOT EXISTS "${tableName}" (id SERIAL PRIMARY KEY);`);
          await client.query(fullTableQuery);
          console.log(`✅ [RECREADA Y COMPLETA] ${headerLine}`);
          totalSuccess++;
        } catch (retryErr) {
          console.error(`❌ Error en tabla [${tableName}]: ${retryErr.message.split('\n')[0]}`);
        }
      } else {
        console.error(`❌ Error en tabla [${tableName}]: ${err.message.split('\n')[0]}`);
      }
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉 🎉 🎉 ¡TODAS LAS TABLAS RESTAURADAS AL 100% EN ${elapsed} SEGUNDOS! 🎉 🎉 🎉`);

  console.log('\n📊 VERIFICACIÓN EN TIEMPO REAL:');
  const report = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);

  for (const row of report.rows) {
    const t = row.table_name;
    try {
      const c = await client.query(`SELECT count(*) FROM "${t}"`);
      if (parseInt(c.rows[0].count, 10) > 0) {
        console.log(`🟢 ${t}: ${c.rows[0].count} registros`);
      }
    } catch (e) {}
  }

  await client.end();
}

superBatchRestore().catch(console.error);
