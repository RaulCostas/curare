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
  
  console.log('--- Inspecting Pago 470 and related historia_clinica or access_id ---');

  // Check access_id in pagos_doctores
  const pago470 = (await ds.query(`SELECT * FROM pagos_doctores WHERE id = 470`))[0];
  console.log('Pago 470:', pago470);

  // Check historia_clinica for doctorId = 18 or fecha 2026-07-10 or 2021-07-10
  const hcList = await ds.query(`
    SELECT h.id, h.fecha, h.tratamiento, h.pieza, h.precio, h.pagado, h."pacienteId", p.nombre, p.paterno
    FROM historia_clinica h
    LEFT JOIN pacientes p ON p.id = h."pacienteId"
    WHERE h."doctorId" = 18
    LIMIT 10
  `);
  console.log('Sample historia_clinica for doctor 18:', hcList);

  // Check if there are any details in pagos_detalle_doctores referencing historia_clinica of doctor 18
  const detailsDoc18 = await ds.query(`
    SELECT d.*, h.tratamiento, h."doctorId"
    FROM pagos_detalle_doctores d
    JOIN historia_clinica h ON h.id = d.idhistoria_clinica
    WHERE h."doctorId" = 18
    LIMIT 10
  `);
  console.log('Details for doctor 18 count:', detailsDoc18.length);

  await ds.destroy();
}

main().catch(console.error);
