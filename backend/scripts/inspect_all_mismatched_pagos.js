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
    SELECT pp.id as pago_id, pp.fecha as pago_fecha, pp."idPedido", pp.monto, pp.factura,
           p.id as pedido_id, p.fecha as pedido_fecha, p.idproveedor, p."Total", p."Pagado", p."Observaciones"
    FROM pagos_pedidos pp
    JOIN pedidos p ON p.id = pp."idPedido"
    WHERE EXTRACT(YEAR FROM p.fecha) >= 2025 AND EXTRACT(YEAR FROM pp.fecha) <= 2024
    ORDER BY pp.id ASC
  `);

  console.log(`Total mismatched historical payments: ${res.rows.length}`);
  res.rows.forEach(r => {
    console.log(`Pago #${r.pago_id} (${r.pago_fecha?.toISOString().split('T')[0]}, Monto: ${r.monto}, Fact: ${r.factura}) => Pedido #${r.pedido_id} (${r.pedido_fecha?.toISOString().split('T')[0]}, Prov: ${r.idproveedor}, Total: ${r.Total}, Pagado: ${r.Pagado}, Obs: ${r.Observaciones})`);
  });

  await client.end();
}

check().catch(console.error);
