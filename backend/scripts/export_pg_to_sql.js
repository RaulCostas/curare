const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const localConfig = {
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'postgrespg',
  database: 'curare'
};

async function exportFullDatabase() {
  console.log('🔌 Conectando a PostgreSQL local...');
  const client = new Client(localConfig);
  await client.connect();

  // Obtener todas las tablas
  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  const tables = tablesRes.rows.map(r => r.table_name);
  console.log(`📋 Tablas encontradas (${tables.length}):`, tables);

  let sqlOutput = `-- CURARE PRODUCTION DATABASE FULL DUMP\n`;
  sqlOutput += `-- Exported on ${new Date().toISOString()}\n\n`;
  sqlOutput += `SET statement_timeout = 0;\n`;
  sqlOutput += `SET lock_timeout = 0;\n`;
  sqlOutput += `SET client_encoding = 'UTF8';\n`;
  sqlOutput += `SET standard_conforming_strings = on;\n`;
  sqlOutput += `SET check_function_bodies = false;\n`;
  sqlOutput += `SET xmloption = content;\n`;
  sqlOutput += `SET client_min_messages = warning;\n`;
  sqlOutput += `SET row_security = off;\n\n`;

  // Desactivar restricciones de llaves foráneas temporalmente
  sqlOutput += `SET session_replication_role = 'replica';\n\n`;

  for (const table of tables) {
    console.log(`📦 Exportando tabla: ${table}...`);
    const countRes = await client.query(`SELECT COUNT(*) FROM "${table}"`);
    const count = parseInt(countRes.rows[0].count, 10);

    sqlOutput += `-- Tabla: ${table} (${count} registros)\n`;
    sqlOutput += `TRUNCATE TABLE "${table}" CASCADE;\n`;

    if (count > 0) {
      // Obtener columnas de la tabla
      const colsRes = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [table]);
      const columns = colsRes.rows.map(c => c.column_name);
      const colNamesStr = columns.map(c => `"${c}"`).join(', ');

      const rowsRes = await client.query(`SELECT * FROM "${table}"`);
      
      for (const row of rowsRes.rows) {
        const valuesStr = columns.map(col => {
          const val = row[col];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
          if (typeof val === 'number') return val.toString();
          if (val instanceof Date) return `'${val.toISOString()}'`;
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
          // Escapar comillas simples
          return `'${String(val).replace(/'/g, "''")}'`;
        }).join(', ');

        sqlOutput += `INSERT INTO "${table}" (${colNamesStr}) VALUES (${valuesStr});\n`;
      }
    }

    // Resetear secuencias si existen
    const seqRes = await client.query(`
      SELECT pg_get_expr(d.adbin, d.adrelid) as default_val, a.attname
      FROM pg_attrdef d
      JOIN pg_attribute a ON a.attrelid = d.adrelid AND a.attnum = d.adnum
      WHERE d.adrelid = '${table}'::regclass AND pg_get_expr(d.adbin, d.adrelid) LIKE 'nextval%'
    `);

    for (const seq of seqRes.rows) {
      const match = seq.default_val.match(/'([^']+)'/);
      if (match) {
        const seqName = match[1];
        const maxRes = await client.query(`SELECT COALESCE(MAX("${seq.attname}"), 1) as max_val FROM "${table}"`);
        const maxVal = parseInt(maxRes.rows[0].max_val, 10);
        sqlOutput += `SELECT setval('${seqName}', ${maxVal}, true);\n`;
      }
    }

    sqlOutput += `\n`;
  }

  // Reactivar restricciones de llaves foráneas
  sqlOutput += `SET session_replication_role = 'origin';\n`;

  const outputPath = path.resolve(__dirname, 'curare_production_full.sql');
  fs.writeFileSync(outputPath, sqlOutput, 'utf8');

  const stats = fs.statSync(outputPath);
  console.log(`✅ Exportación completada con éxito!`);
  console.log(`📁 Archivo generado: ${outputPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

  await client.end();
}

exportFullDatabase().catch(err => {
  console.error('❌ Error durante la exportación:', err);
  process.exit(1);
});
