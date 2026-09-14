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

  console.log('--- All pagos_pedidos with date in 2018 ---');
  const res2018 = await client.query(`
    SELECT pp.*, p.fecha as pedido_fecha, p.idproveedor, p."Total" as pedido_total, p."Pagado" as pedido_pagado
    FROM pagos_pedidos pp
    LEFT JOIN pedidos p ON p.id = pp."idPedido"
    WHERE pp.fecha BETWEEN '2018-01-01' AND '2018-12-31'
    ORDER BY pp.id ASC
  `);
  console.log(res2018.rows);

  await client.end();
}

check().catch(console.error);
