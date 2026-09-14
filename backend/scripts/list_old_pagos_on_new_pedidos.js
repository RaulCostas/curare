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
    WHERE pp."idPedido" >= 2400 AND EXTRACT(YEAR FROM pp.fecha) < 2026
    ORDER BY pp.id ASC
  `);

  console.log(`Found ${res.rows.length} old pagos linked to 2026 pedidos:`);
  res.rows.forEach(r => {
    console.log(`Pago #${r.pago_id} (Fecha: ${r.pago_fecha?.toISOString().split('T')[0]}, Monto: ${r.monto}, Fact: ${r.factura}) -> Pedido #${r.pedido_id} (Fecha: ${r.pedido_fecha?.toISOString().split('T')[0]}, Prov: ${r.idproveedor}, Total: ${r.Total}, Obs: ${r.Observaciones})`);
  });

  await client.end();
}

check().catch(console.error);
