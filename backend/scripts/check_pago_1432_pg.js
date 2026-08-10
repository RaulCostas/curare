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

  console.log('--- Inspecting Pago 1432 in PostgreSQL ---');
  const pago1432 = await ds.query(`SELECT * FROM pagos_doctores WHERE id = 1432`);
  console.log('Pago 1432 header in PG:', pago1432);

  const details1432 = await ds.query(`
    SELECT d.*, h.tratamiento, h.pieza, p.nombre, p.paterno
    FROM pagos_detalle_doctores d
    JOIN historia_clinica h ON h.id = d.idhistoria_clinica
    JOIN pacientes p ON p.id = h."pacienteId"
    WHERE d."idPagos" = 1432
  `);

  console.log(`Pago 1432 details count in PG: ${details1432.length}`);
  console.log('Pago 1432 details sample:', details1432);

  await ds.destroy();
}

main().catch(console.error);
