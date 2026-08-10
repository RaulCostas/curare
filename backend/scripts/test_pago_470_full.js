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

  const details = await ds.query(`
    SELECT d.*, h.tratamiento, h.pieza, h.precio as hc_precio, p.nombre as pac_nombre, p.paterno as pac_paterno
    FROM pagos_detalle_doctores d
    JOIN historia_clinica h ON h.id = d.idhistoria_clinica
    JOIN pacientes p ON p.id = h."pacienteId"
    WHERE d."idPagos" = 470
  `);

  console.log(`Pago 470 SQL Query returned ${details.length} details!`);
  console.log('Sample details for Pago 470:');
  details.slice(0, 5).forEach((d, i) => {
    console.log(` ${i + 1}. Paciente: ${d.pac_paterno} ${d.pac_nombre} | Tratamiento: ${d.tratamiento} | Pieza: ${d.pieza} | Subtotal: ${d.total}`);
  });

  await ds.destroy();
}

main().catch(console.error);
