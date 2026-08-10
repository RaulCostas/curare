const { DataSource } = require('typeorm');

const ds = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5433,
  username: 'postgres',
  password: 'postgrespg',
  database: 'curare',
  synchronize: false
});

async function main() {
  await ds.initialize();

  console.log('--- Inspecting columns of pagos_detalle_doctores ---');
  const cols = await ds.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'pagos_detalle_doctores'
  `);
  console.log('Columns in pagos_detalle_doctores:', cols);

  console.log('\n--- Inspecting sample 10 rows of pagos_detalle_doctores ---');
  const rows = await ds.query(`SELECT * FROM pagos_detalle_doctores LIMIT 10`);
  console.log('Sample rows:', rows);

  console.log('\n--- Inspecting distinct idPagos values in pagos_detalle_doctores ---');
  const distinctPagos = await ds.query(`SELECT DISTINCT "idPagos" FROM pagos_detalle_doctores ORDER BY "idPagos" DESC LIMIT 20`);
  console.log('Distinct idPagos sample:', distinctPagos);

  console.log('\n--- Checking if Pago 470 has ANY row in pagos_detalle_doctores or historia_clinica ---');
  const check470Detail = await ds.query(`SELECT * FROM pagos_detalle_doctores WHERE "idPagos" = 470`);
  console.log('Check 470 detail:', check470Detail);

  // Check if there is any row in historia_clinica or proforma_detalle that refers to pago 470 or access ID 470
  const checkHC470 = await ds.query(`
    SELECT * FROM historia_clinica 
    WHERE "access_plan_pagos_id" = '470' OR "access_trabajos_doctores_id" = '470' OR "access_id" = '470'
  `);
  console.log('HistoriaClinica with access_id 470:', checkHC470);

  await ds.destroy();
}

main().catch(console.error);
