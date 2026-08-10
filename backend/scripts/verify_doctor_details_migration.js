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

  const totalPagos = await ds.query(`SELECT count(*) FROM pagos_doctores`);
  const totalDetalles = await ds.query(`SELECT count(*) FROM pagos_detalle_doctores`);

  const pagosWithDetailsCount = await ds.query(`
    SELECT count(DISTINCT "idPagos") FROM pagos_detalle_doctores
  `);

  console.log('=== VERIFICACIÓN FINAL MIGRACIÓN DE DETALLES PAGOS DOCTORES ===');
  console.log(`Total Pagos a Doctores: ${totalPagos[0].count}`);
  console.log(`Total Registros de Tratamientos en Detalle (pagos_detalle_doctores): ${totalDetalles[0].count}`);
  console.log(`Pagos con tratamientos desglosados: ${pagosWithDetailsCount[0].count} de ${totalPagos[0].count}`);

  await ds.destroy();
}

main().catch(console.error);
