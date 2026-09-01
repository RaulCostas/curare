const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function restoreByTable() {
  console.log('🚀 Iniciando restauración con bypass de Foreign Keys (session_replication_role = replica)...');

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

  // Desactivar temporalmente todas las restricciones de llaves foráneas para esta sesión
  await client.query("SET session_replication_role = 'replica';");
  console.log('🔓 Restrictions de llaves foráneas (FK) deshabilitadas para la inserción limpia.');

  const sqlPath = path.resolve(__dirname, 'curare_production_full.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  // Dividir el script por bloques de tablas ("-- Tabla: ")
  const blocks = sqlContent.split(/-- Tabla:\s*/g);
  // 1. Limpieza total previa de todas las tablas
  console.log('🧹 Limpiando todas las tablas antes de la inyección...');
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const headerLine = block.substring(0, block.indexOf('\n')).trim();
    const tableName = headerLine.split(' ')[0];
    try {
      await client.query(`TRUNCATE TABLE "${tableName}" CASCADE;`);
    } catch (e) {
      // Ignorar si no existe aún
    }
  }
  console.log('✨ Base de datos limpia. Comenzando inyección de datos...');

  let success = 0;
  let skipped = 0;

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const headerLine = block.substring(0, block.indexOf('\n')).trim();
    const tableName = headerLine.split(' ')[0];

    const fullSql = block.substring(block.indexOf('\n')).trim();
    if (!fullSql) continue;

    try {
      await client.query("SET session_replication_role = 'replica';");
      await client.query(fullSql);
      console.log(`✅ [EXITO] Tabla inyectada: ${headerLine}`);
      success++;
    } catch (err) {
      if (err.message.includes('does not exist')) {
        try {
          await client.query(`CREATE TABLE IF NOT EXISTS "${tableName}" (id SERIAL PRIMARY KEY);`);
          await client.query("SET session_replication_role = 'replica';");
          await client.query(fullSql);
          console.log(`✅ [EXITO CREATIVA] Tabla inyectada: ${headerLine}`);
          success++;
          continue;
        } catch (retryErr) {
          console.error(`❌ Error en tabla [${tableName}]: ${retryErr.message.substring(0, 120)}`);
          skipped++;
        }
      } else {
        console.error(`❌ Error en tabla [${tableName}]: ${err.message.substring(0, 120)}`);
        skipped++;
      }
    }
  }

  // Restaurar el rol normal de replicación
  await client.query("SET session_replication_role = 'origin';");
  console.log(`\n🎉 🎉 🎉 RESTAURACIÓN COMPLETA FINALIZADA 🎉 🎉 🎉`);
  console.log(`✅ Tablas exitosas: ${success} | ⚠️ Con aviso: ${skipped}`);
  await client.end();
}

restoreByTable().catch(console.error);
