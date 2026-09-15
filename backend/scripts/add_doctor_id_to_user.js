const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const sql = `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "doctorId" integer REFERENCES "doctor"(id) ON DELETE SET NULL;`;
  
  // Guardar archivo de migración para producción
  const sqlPath = path.join(__dirname, '..', 'migrations', 'add_doctor_id_to_users.sql');
  fs.writeFileSync(sqlPath, sql + '\n', 'utf8');
  console.log(`Archivo de migración SQL guardado en: ${sqlPath}`);

  // Ejecutar en Postgres local
  const client = new Client({ host: 'localhost', port: 5433, user: 'postgres', password: 'postgrespg', database: 'curare' });
  await client.connect();
  await client.query(sql);
  console.log('Columna doctorId agregada exitosamente a la tabla "user" en PostgreSQL local.');
  await client.end();
}

main().catch(console.error);
