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
  const repo = ds.getRepository('PagosDoctores');
  const pago = await repo.findOne({
    where: { id: 1368 },
    relations: ['doctor', 'formaPago', 'detalles', 'detalles.historiaClinica', 'detalles.historiaClinica.paciente']
  });

  console.log('Result from repo.findOne for 1368:');
  console.log(JSON.stringify(pago, null, 2));

  await ds.destroy();
}

main().catch(console.error);
