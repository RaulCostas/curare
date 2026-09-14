const { Client } = require('pg');

async function check() {
  const client = new Client({
    host: '72.61.76.125',
    port: 5432,
    user: 'postgres',
    password: 'boquenze654',
    database: 'postgres'
  });
  await client.connect();

  console.log('--- Pedidos around 2018-04 ---');
  const res2018_04 = await client.query(`
    SELECT * FROM pedidos WHERE fecha BETWEEN '2018-04-01' AND '2018-05-15' ORDER BY id ASC
  `);
  console.log(res2018_04.rows);

  console.log('--- Pedidos around 2018-07 ---');
  const res2018_07 = await client.query(`
    SELECT * FROM pedidos WHERE fecha BETWEEN '2018-07-01' AND '2018-08-15' ORDER BY id ASC
  `);
  console.log(res2018_07.rows);

  console.log('--- Check if there are pedidos with Total = 7005 or 740 ---');
  const resTotal7005 = await client.query(`
    SELECT * FROM pedidos WHERE "Total" IN (7005, 740) OR "Sub_Total" IN (7005, 740)
  `);
  console.log(resTotal7005.rows);

  await client.end();
}

check().catch(console.error);
