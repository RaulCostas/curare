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

  const detailsCount = await ds.query(`SELECT count(*) FROM pagos_detalle_doctores`);
  console.log(`Total details in pagos_detalle_doctores: ${detailsCount[0].count}`);

  const check470 = await ds.query(`
    SELECT d.*, h.tratamiento, h.pieza, p.nombre, p.paterno
    FROM pagos_detalle_doctores d
    JOIN historia_clinica h ON h.id = d.idhistoria_clinica
    JOIN pacientes p ON p.id = h."pacienteId"
    WHERE d."idPagos" = 470
  `);
  console.log(`Pago 470 details in PG: ${check470.length} rows!`);
  console.log('Sample details for Pago 470:', check470);

  await ds.destroy();
}

main().catch(console.error);
