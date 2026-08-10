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

  console.log('--- Payments for Doctor 18 (Antequera Alfredo) ---');
  const doc18Pagos = await ds.query(`
    SELECT pd.id, pd.fecha, pd.total, pd.comision, count(d.id) as detail_count
    FROM pagos_doctores pd
    LEFT JOIN pagos_detalle_doctores d ON d."idPagos" = pd.id
    WHERE pd."idDoctor" = 18
    GROUP BY pd.id, pd.fecha, pd.total, pd.comision
    ORDER BY pd.id DESC
  `);
  console.log('Pagos count for Doctor 18:', doc18Pagos.length);
  console.log('Doctor 18 Pagos list:', doc18Pagos);

  await ds.destroy();
}

main().catch(console.error);
