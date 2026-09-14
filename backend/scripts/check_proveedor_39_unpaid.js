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

  const res = await client.query(`
    SELECT p.id, p.fecha, p.idproveedor, p."Sub_Total", p."Descuento", p."Total", p."Pagado", p."Observaciones",
           pp.id as pago_id, pp.monto as pago_monto, pp.fecha as pago_fecha
    FROM pedidos p
    LEFT JOIN pagos_pedidos pp ON pp."idPedido" = p.id
    WHERE p.idproveedor = 39
    ORDER BY p.id DESC
  `);

  console.log('Todos los pedidos de proveedor 39:');
  res.rows.forEach(r => {
    console.log(`Pedido #${r.id} | Fecha: ${r.fecha} | Total: ${r.Total} | Pagado: ${r.Pagado} | PagoID: ${r.pago_id}`);
  });

  const unpaid = res.rows.filter(r => !r.Pagado || !r.pago_id);
  console.log('\nPedidos que no tienen Pagado=true o no tienen pago_id (count:', unpaid.length, '):');
  console.log(unpaid);

  await client.end();
}

check().catch(console.error);
