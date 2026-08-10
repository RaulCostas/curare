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
  
  const pagos = await ds.query(`SELECT * FROM pagos_doctores ORDER BY id DESC LIMIT 5`);
  console.log('Pagos Doctores Recent Count:', pagos.length);
  
  if (pagos.length > 0) {
    const pagoId = pagos[0].id;
    console.log(`\nInspecting PagoDoctor ID ${pagoId}:`);
    const header = (await ds.query(`SELECT * FROM pagos_doctores WHERE id = ${pagoId}`))[0];
    const detalles = await ds.query(`
      SELECT d.*, h.tratamiento, h.pieza, h.precio as hc_precio, p.nombre as pac_nombre, p.paterno as pac_paterno
      FROM pagos_detalle_doctores d
      LEFT JOIN historia_clinica h ON h.id = d.idhistoria_clinica
      LEFT JOIN pacientes p ON p.id = h."pacienteId"
      WHERE d."idPagos" = ${pagoId}
    `);
    console.log('Header:', header);
    console.log('Detalles count:', detalles.length);
    console.log('Detalles sample:', detalles);
  }

  await ds.destroy();
}

main().catch(console.error);
