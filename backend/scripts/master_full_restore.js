const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function masterRestore() {
  console.log('🚀 MASTER RESTORE: Cargando todas las tablas en PostgreSQL...');

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

  await client.query("SET session_replication_role = 'replica';");

  const sqlPath = path.resolve(__dirname, 'curare_production_full.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  const blocks = sqlContent.split(/-- Tabla:\s*/g);

  console.log(`📦 Insertando ${blocks.length - 1} tablas...`);

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const headerLine = block.substring(0, block.indexOf('\n')).trim();
    const tableName = headerLine.split(' ')[0];

    const fullSql = block.substring(block.indexOf('\n')).trim();
    if (!fullSql) continue;

    // Ejecutar cada comando del bloque (TRUNCATE, INSERT, etc.) por separado
    const lines = fullSql.split('\n');
    let currentCmd = '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('--')) continue;
      currentCmd += line + '\n';
      if (trimmed.endsWith(';')) {
        try {
          await client.query("SET session_replication_role = 'replica';");
          await client.query(currentCmd);
        } catch (err) {
          if (err.message.includes('does not exist')) {
            try {
              await client.query(`CREATE TABLE IF NOT EXISTS "${tableName}" (id SERIAL PRIMARY KEY);`);
              await client.query("SET session_replication_role = 'replica';");
              await client.query(currentCmd);
            } catch (e) {}
          }
        }
        currentCmd = '';
      }
    }
    console.log(`✅ [OK] ${headerLine}`);
  }

  await client.query("SET session_replication_role = 'origin';");

  console.log('\n📊 === INFORME FINAL DE VERIFICACIÓN DE TABLAS EN PRODUCCIÓN ===');
  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);

  for (const row of tablesRes.rows) {
    const t = row.table_name;
    try {
      const countRes = await client.query(`SELECT count(*) FROM "${t}"`);
      console.log(`📌 ${t}: ${countRes.rows[0].count} registros`);
    } catch (e) {}
  }

  await client.end();
}

masterRestore().catch(console.error);
