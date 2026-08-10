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

  const pdRepo = ds.getRepository('PagosDoctores');
  // Or raw query to check entity relation metadata
  const pago = await ds.query(`
    SELECT pd.id, pd."idDoctor", d.id as detail_id, d.idhistoria_clinica, d.costo_laboratorio, d.descuento, d.total,
           h.tratamiento, h.pieza, h.precio, p.nombre, p.paterno
    FROM pagos_doctores pd
    LEFT JOIN pagos_detalle_doctores d ON d."idPagos" = pd.id
    LEFT JOIN historia_clinica h ON h.id = d.idhistoria_clinica
    LEFT JOIN pacientes p ON p.id = h."pacienteId"
    WHERE pd.id = 470
  `);

  console.log('Pago 470 join result:', pago);

  await ds.destroy();
}

main().catch(console.error);
