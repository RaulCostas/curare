const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'postgrespg',
  database: 'curare'
});

async function main() {
  await client.connect();

  console.log('--- BEFORE UPDATE ---');
  const beforeRes = await client.query(`
    SELECT id, fecha, pieza, cantidad, tratamiento, precio, "estadoTratamiento", "proformaDetalleId"
    FROM historia_clinica
    WHERE id IN (76263, 76344, 76542, 76593)
    ORDER BY id ASC
  `);
  console.table(beforeRes.rows);

  console.log('--- UPDATING proformaDetalleId to 46865 for CORONA DE CEROMERO entries in proforma 20 ---');
  const updateRes = await client.query(`
    UPDATE historia_clinica
    SET "proformaDetalleId" = 46865
    WHERE id IN (76263, 76344, 76542, 76593)
  `);
  console.log('Rows updated:', updateRes.rowCount);

  console.log('--- AFTER UPDATE ---');
  const afterRes = await client.query(`
    SELECT id, fecha, pieza, cantidad, tratamiento, precio, "estadoTratamiento", "proformaDetalleId"
    FROM historia_clinica
    WHERE id IN (76263, 76344, 76542, 76593)
    ORDER BY id ASC
  `);
  console.table(afterRes.rows);

  await client.end();
}

main().catch(console.error);
