const { Client } = require('pg');

async function check() {
  const client = new Client({
    host: '127.0.0.1',
    port: 5433,
    user: 'postgres',
    password: 'postgrespg',
    database: 'curare'
  });
  await client.connect();

  const res = await client.query(`
    SELECT p.id, p.fecha, p.idproveedor, p."Total", p."Pagado", p."Observaciones",
           pp.id as pago_id, pp.fecha as pago_fecha, pp.monto as pago_monto
    FROM pedidos p
    LEFT JOIN pagos_pedidos pp ON pp."idPedido" = p.id
    WHERE p.idproveedor = 39 AND p.id >= 2000
    ORDER BY p.id DESC
  `);
  console.log('Pedidos >= 2000 del proveedor 39 en LOCAL:');
  console.log(res.rows);

  await client.end();
}

check().catch(console.error);
