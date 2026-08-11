const { Client } = require('pg');

async function checkDatabases() {
  const client = new Client({
    host: '72.61.76.125',
    port: 5432,
    user: 'postgres',
    password: 'boquenze654',
    database: 'postgres'
  });

  await client.connect();

  console.log('🔍 LISTANDO BASES DE DATOS EN EL SERVIDOR 72.61.76.125:');
  const dbs = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false;');
  console.log(dbs.rows.map(r => r.datname));

  for (const dbRow of dbs.rows) {
    const dbName = dbRow.datname;
    const dbClient = new Client({
      host: '72.61.76.125',
      port: 5432,
      user: 'postgres',
      password: 'boquenze654',
      database: dbName
    });

    try {
      await dbClient.connect();
      const countRes = await dbClient.query('SELECT count(*) FROM "agenda"');
      console.log(`📊 Base de datos [${dbName}] -> Tabla "agenda": ${countRes.rows[0].count} registros`);
      await dbClient.end();
    } catch (e) {
      console.log(`📊 Base de datos [${dbName}] -> Tabla "agenda": No existe o error (${e.message})`);
    }
  }

  await client.end();
}

checkDatabases().catch(console.error);
