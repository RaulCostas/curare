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
  const pagosWithoutDetalles = await ds.query(`
    SELECT pd.id, pd.fecha, pd.total, count(d.id) as detalle_count
    FROM pagos_doctores pd
    LEFT JOIN pagos_detalle_doctores d ON d."idPagos" = pd.id
    GROUP BY pd.id, pd.fecha, pd.total
    HAVING count(d.id) = 0
  `);

  console.log(`Total pagos_doctores: ${totalPagos[0].count}`);
  console.log(`Total pagos_detalle_doctores: ${totalDetalles[0].count}`);
  console.log(`Pagos WITHOUT detalles count: ${pagosWithoutDetalles.length}`);
  if (pagosWithoutDetalles.length > 0) {
    console.log('Sample pagos without detalles:', pagosWithoutDetalles.slice(0, 5));
  }

  // Also check details where historiaClinica is null
  const detailsWithNullHC = await ds.query(`
    SELECT d.* 
    FROM pagos_detalle_doctores d
    LEFT JOIN historia_clinica h ON h.id = d.idhistoria_clinica
    WHERE h.id IS NULL
  `);
  console.log(`Detalles with NULL historia_clinica count: ${detailsWithNullHC.length}`);

  await ds.destroy();
}

main().catch(console.error);
