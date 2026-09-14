const { Client } = require('pg');

async function check(host, user, password, database) {
  console.log(`Checking ${host}/${database}...`);
  const client = new Client({
    host,
    port: 5432,
    user,
    password,
    database
  });
  try {
    await client.connect();
    const resProveedores = await client.query('SELECT * FROM proveedores WHERE id = 39');
    console.log('Proveedor 39:', resProveedores.rows);

    const resPedidos = await client.query('SELECT * FROM pedidos WHERE idproveedor = 39 ORDER BY id ASC');
    console.log('Pedidos de proveedor 39 (count:', resPedidos.rows.length, '):');
    console.log(JSON.stringify(resPedidos.rows, null, 2));

    const resPagos = await client.query('SELECT * FROM pagos_pedidos WHERE "idPedido" IN (SELECT id FROM pedidos WHERE idproveedor = 39)');
    console.log('Pagos de pedidos del proveedor 39:', resPagos.rows);

    await client.end();
  } catch (e) {
    console.error(`Error on ${host}:`, e.message);
  }
}

async function main() {
  // Check local first
  await check('localhost', 'postgres', 'postgrespg', 'curare');
  // Check remote
  await check('72.61.76.125', 'postgres', 'boquenze654', 'postgres');
}

main();
