const { Client } = require('pg');

async function verify() {
  const client = new Client({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5433', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgrespg',
    database: process.env.DB_NAME || 'curare',
  });

  await client.connect();
  const res = await client.query(`
    SELECT g.grupo, e.especialidad, count(i.id) as total_items, sum(i.cantidad_existente) as total_stock
    FROM inventario i
    LEFT JOIN grupo_inventario g ON g.id = i.idgrupo_inventario
    LEFT JOIN especialidad e ON e.id = i.idespecialidad
    WHERE i.idgrupo_inventario = 3
    GROUP BY g.grupo, e.especialidad
    ORDER BY total_items DESC
  `);
  console.log('Resumen de Fresas por Especialidad:');
  console.table(res.rows);

  const total = await client.query('SELECT count(*) FROM inventario');
  console.log('Total registros en inventario:', total.rows[0].count);

  await client.end();
}

verify().catch(console.error);
