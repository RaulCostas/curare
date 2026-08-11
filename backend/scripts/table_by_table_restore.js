const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function restoreByTable() {
  console.log('🚀 Iniciando restauración resiliente tabla por tabla...');

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
  console.log(`📦 Encontrados ${blocks.length - 1} bloques de tablas.`);

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const headerLine = block.substring(0, block.indexOf('\n')).trim();
    const tableName = headerLine.split(' ')[0];

    // Extraer todas las consultas válidas del bloque
    const fullSql = block.substring(block.indexOf('\n')).trim();
    if (!fullSql) continue;

    try {
      await client.query(fullSql);
      console.log(`✅ [OK] Tabla: ${headerLine}`);
    } catch (err) {
      // Si la tabla no existe en TypeORM, la creamos al vuelo de forma básica
      if (err.message.includes('does not exist')) {
        console.log(`⚠️ Creando tabla faltante [${tableName}]...`);
        try {
          await client.query(`CREATE TABLE IF NOT EXISTS "${tableName}" (id SERIAL PRIMARY KEY);`);
          await client.query(fullSql);
          console.log(`✅ [OK] Tabla recién creada: ${headerLine}`);
          continue;
        } catch (retryErr) {
          console.error(`❌ Error en tabla [${tableName}]: ${retryErr.message.substring(0, 100)}`);
        }
      } else {
        console.error(`❌ Error en tabla [${tableName}]: ${err.message.substring(0, 100)}`);
      }
    }
  }

  console.log('\n🎉 ¡RESTAURACIÓN FINALIZADA DE TODAS LAS TABLAS DEL SISTEMA!');
  await client.end();
}

restoreByTable().catch(console.error);
