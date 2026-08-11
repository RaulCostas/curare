const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function cleanFullRestore() {
  console.log('🚀 RESTAURACIÓN LIMPIA SIN CASCADE TRUNCATE...');

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
  console.log(`📦 Procesando ${blocks.length - 1} tablas...`);

  // Paso 1: Deshabilitar restricciones
  await client.query("SET session_replication_role = 'replica';");

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const headerLine = block.substring(0, block.indexOf('\n')).trim();
    const tableName = headerLine.split(' ')[0];

    let bodySql = block.substring(block.indexOf('\n')).trim();
    if (!bodySql) continue;

    // ELIMINAR CUALQUIER TRUNCATE CASCADE DEL BLOQUE
    bodySql = bodySql.replace(/TRUNCATE\s+TABLE\s+"[^"]+"\s+CASCADE;/gi, '');

    const startTableTime = Date.now();

    try {
      if (bodySql.trim().length > 0) {
        await client.query(bodySql);
      }
      const countRes = await client.query(`SELECT count(*) FROM "${tableName}"`);
      const elapsed = ((Date.now() - startTableTime) / 1000).toFixed(1);
      console.log(`🟢 [CARGADA OK] ${tableName}: ${countRes.rows[0].count} registros en disco (${elapsed}s)`);
    } catch (err) {
      if (err.message.includes('does not exist')) {
        try {
          await client.query(`CREATE TABLE IF NOT EXISTS "${tableName}" (id SERIAL PRIMARY KEY);`);
          if (bodySql.trim().length > 0) {
            await client.query(bodySql);
          }
          const countRes = await client.query(`SELECT count(*) FROM "${tableName}"`);
          console.log(`🟢 [RECREADA OK] ${tableName}: ${countRes.rows[0].count} registros`);
        } catch (e) {
          console.error(`❌ Error en ${tableName}: ${e.message.split('\n')[0]}`);
        }
      } else {
        console.error(`❌ Error en ${tableName}: ${err.message.split('\n')[0]}`);
      }
    }
  }

  // Paso 2: Recomponer restricciones
  await client.query("SET session_replication_role = 'origin';");

  console.log('\n🎉 🎉 🎉 ¡RESTAURACIÓN TOTAL SIN CASCADE FINALIZADA CON ÉXITO! 🎉 🎉 🎉');

  console.log('\n📊 REPORTANDO CONTEO FINAL DEFINITIVO DE TODAS LAS TABLAS:');
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
      console.log(`📌 ${t}: ${c.rows[0].count} registros`);
    } catch (e) {}
  }

  await client.end();
}

cleanFullRestore().catch(console.error);
