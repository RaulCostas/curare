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

  console.log('--- Pagos 70 y 140 ---');
  const resPagos = await client.query('SELECT * FROM pagos_pedidos WHERE id IN (70, 140)');
  console.log(resPagos.rows);

  console.log('--- Pagos con idPedido 2510 o 2484 ---');
  const resByPedido = await client.query('SELECT * FROM pagos_pedidos WHERE "idPedido" IN (2510, 2484)');
  console.log(resByPedido.rows);

  await client.end();
}

check().catch(console.error);
