const { DataSource } = require('typeorm');

const ds = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5433,
  username: 'postgres',
  password: 'postgrespg',
  database: 'curare'
});

async function main() {
  await ds.initialize();
  
  console.log('--- Pago 470 Inspection ---');
  const pago = (await ds.query(`SELECT * FROM pagos_doctores WHERE id = 470`))[0];
  console.log('Pago 470:', pago);
  
  const detalles = await ds.query(`
    SELECT pd.id, pd.idhistoria_clinica, pd.costo_laboratorio, pd.descuento, pd.total as detalle_subtotal,
           hc.tratamiento, hc.pieza, hc.cantidad, hc.precio as hc_precio
    FROM pagos_detalle_doctores pd
    JOIN historia_clinica hc ON hc.id = pd.idhistoria_clinica
    WHERE pd."idPagos" = 470
  `);
  console.log('Detalles Pago 470:', detalles);

  await ds.destroy();
}

main().catch(console.error);
