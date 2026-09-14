const { Client } = require('pg');

async function testLocal(password, database = 'curare') {
  const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    password,
    database
  });
  try {
    await client.connect();
    console.log(`Connected to local with password "${password}" and db "${database}"!`);
    const res = await client.query('SELECT current_database(), count(*) FROM pedidos');
    console.log(res.rows);
    await client.end();
    return true;
  } catch (e) {
    console.log(`Failed with password "${password}" and db "${database}":`, e.message);
    return false;
  }
}

async function main() {
  const passwords = ['postgrespg', 'postgres', 'boquenze654', 'admin', 'root', '123456'];
  const dbs = ['curare', 'postgres'];
  for (const db of dbs) {
    for (const pwd of passwords) {
      if (await testLocal(pwd, db)) return;
    }
  }
}

main();
