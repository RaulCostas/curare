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

  console.log('--- Pagos with mismatching year with Pedidos ---');
  const resMismatch = await client.query(`
    SELECT pp.id as pago_id, pp.fecha as pago_fecha, pp."idPedido", pp.monto as pago_monto, pp.factura,
           p.fecha as pedido_fecha, p.idproveedor, p."Total" as pedido_total, p."Pagado" as pedido_pagado, p."Observaciones"
    FROM pagos_pedidos pp
    JOIN pedidos p ON p.id = pp."idPedido"
    WHERE EXTRACT(YEAR FROM pp.fecha) != EXTRACT(YEAR FROM p.fecha)
    ORDER BY pp.id ASC
  `);
  console.log(`Found ${resMismatch.rows.length} mismatched pagos:`);
  console.log(resMismatch.rows);

  console.log('--- All pedidos in 2026 ---');
  const res2026 = await client.query(`
    SELECT p.id, p.fecha, p.idproveedor, p."Total", p."Pagado", p."Observaciones",
           pp.id as pago_id, pp.fecha as pago_fecha, pp.monto as pago_monto
    FROM pedidos p
    LEFT JOIN pagos_pedidos pp ON pp."idPedido" = p.id
    WHERE EXTRACT(YEAR FROM p.fecha) = 2026
    ORDER BY p.id ASC
  `);
  console.log(`Found ${res2026.rows.length} pedidos in 2026:`);
  console.log(res2026.rows);

  await client.end();
}

check().catch(console.error);
