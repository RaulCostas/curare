const { Client } = require('pg');

async function fix() {
  const client = new Client({
    host: '72.61.76.125',
    port: 5432,
    user: 'postgres',
    password: 'boquenze654',
    database: 'postgres'
  });
  await client.connect();

  console.log('--- Buscando pagos históricos vinculados erróneamente a pedidos de 2026 ---');
  const resMismatch = await client.query(`
    SELECT pp.id as pago_id, pp.fecha as pago_fecha, pp."idPedido" as old_pedido_id, pp.monto as pago_monto, pp.factura,
           p.id as pedido_id, p.fecha as pedido_fecha, p.idproveedor, p."Total" as pedido_total, p."Pagado" as pedido_pagado, p."Observaciones"
    FROM pagos_pedidos pp
    JOIN pedidos p ON p.id = pp."idPedido"
    WHERE EXTRACT(YEAR FROM p.fecha) >= 2026 AND EXTRACT(YEAR FROM pp.fecha) < 2026
    ORDER BY pp.id ASC
  `);

  console.log(`Se encontraron ${resMismatch.rows.length} pagos históricos desfasados con pedidos de 2026.`);

  for (const r of resMismatch.rows) {
    console.log(`Corrigiendo Pago #${r.pago_id} (Fecha Pago: ${r.pago_fecha?.toISOString().split('T')[0]}, Monto: ${r.pago_monto}) actualmente en Pedido #${r.pedido_id} (Fecha Pedido: ${r.pedido_fecha?.toISOString().split('T')[0]}, Prov: ${r.idproveedor})`);

    // 1. Crear pedido histórico correspondiente para el pago
    const insertRes = await client.query(`
      INSERT INTO pedidos (
        fecha, idproveedor, "Sub_Total", "Descuento", "Total",
        "Observaciones", "Pagado", created_at
      ) VALUES ($1, $2, $3, 0, $3, 'Pedido automático para pago histórico', true, NOW())
      RETURNING id
    `, [r.pago_fecha, r.idproveedor, r.pago_monto]);

    const newPedidoId = insertRes.rows[0].id;

    // 2. Reasignar el pago al nuevo pedido histórico
    await client.query(`
      UPDATE pagos_pedidos
      SET "idPedido" = $1
      WHERE id = $2
    `, [newPedidoId, r.pago_id]);

    // 3. Revisar el pedido de 2026 original
    // Si ya no tiene ningún pago en pagos_pedidos, verificar si debe quedar como Pagado=false
    const checkPagos = await client.query(`
      SELECT * FROM pagos_pedidos WHERE "idPedido" = $1
    `, [r.pedido_id]);

    if (checkPagos.rows.length === 0) {
      // Si el pedido no tiene pago real, lo dejamos como Pagado = false
      await client.query(`
        UPDATE pedidos
        SET "Pagado" = false
        WHERE id = $1
      `, [r.pedido_id]);
      console.log(`  -> Pedido #${r.pedido_id} liberado y marcado como Pagado = false.`);
    }
  }

  // Ajustar la secuencia de IDs de pedidos
  await client.query(`SELECT setval('pedidos_id_seq', (SELECT MAX(id) FROM pedidos));`);

  console.log('\n--- Verificando pedidos del proveedor 39 ---');
  const resProv39 = await client.query(`
    SELECT p.id, p.fecha, p.idproveedor, p."Total", p."Pagado", p."Observaciones",
           pp.id as pago_id, pp.fecha as pago_fecha, pp.monto as pago_monto
    FROM pedidos p
    LEFT JOIN pagos_pedidos pp ON pp."idPedido" = p.id
    WHERE p.idproveedor = 39 AND EXTRACT(YEAR FROM p.fecha) = 2026
    ORDER BY p.id ASC
  `);
  console.log(resProv39.rows);

  await client.end();
}

fix().catch(console.error);
