const { DataSource } = require('typeorm');

async function getDataSource() {
  const ports = [5432, 5433];
  for (const port of ports) {
    try {
      const ds = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || String(port), 10),
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgrespg',
        database: process.env.DB_NAME || 'curare',
        synchronize: false
      });
      await ds.initialize();
      console.log(`Conectado a la base de datos en el puerto ${port}`);
      return ds;
    } catch (err) {
      // Intentar el siguiente puerto
    }
  }
  throw new Error('No se pudo conectar a PostgreSQL en los puertos 5432 o 5433');
}

const doctorConfigs = [
  {
    id: 29,
    nombre: 'Doctor Avila Monica',
    fechaInicio: '2010-05-18',
    fechaFin: '2024-12-02'
  },
  {
    id: 28,
    nombre: 'Doctor Navia Viviana',
    fechaInicio: '2024-10-29',
    fechaFin: '2025-06-27'
  },
  {
    id: 13,
    nombre: 'Doctor Villegas Quiroga Andrea',
    fechaInicio: '2013-12-23',
    fechaFin: '2025-06-30'
  }
];

async function main() {
  const ds = await getDataSource();
  const queryRunner = ds.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    console.log('\n======================================================');
    console.log(' INICIANDO ACTUALIZACIÓN DE ESTADO PAGADO EN HISTORIA CLÍNICA');
    console.log('======================================================\n');

    let totalActualizados = 0;

    for (const cfg of doctorConfigs) {
      // 1. Obtener registros pendientes antes de la actualización
      const prevCountResult = await queryRunner.query(
        `SELECT COUNT(*) as count 
         FROM historia_clinica 
         WHERE "doctorId" = $1 
           AND fecha >= $2 
           AND fecha <= $3 
           AND pagado = 'NO'`,
        [cfg.id, cfg.fechaInicio, cfg.fechaFin]
      );
      const pendientes = parseInt(prevCountResult[0]?.count || '0', 10);

      // 2. Ejecutar actualización
      const updateResult = await queryRunner.query(
        `UPDATE historia_clinica 
         SET pagado = 'SI', 
             "updatedAt" = NOW() 
         WHERE "doctorId" = $1 
           AND fecha >= $2 
           AND fecha <= $3 
           AND pagado = 'NO'`,
        [cfg.id, cfg.fechaInicio, cfg.fechaFin]
      );

      // En postgres pg driver / queryRunner, updateResult suele ser [, count] o rows
      const countUpdated = pendientes;
      totalActualizados += countUpdated;

      console.log(`[✔] ${cfg.nombre} (ID: ${cfg.id})`);
      console.log(`    Rango: ${cfg.fechaInicio} al ${cfg.fechaFin}`);
      console.log(`    Registros actualizados a pagado='SI': ${countUpdated}`);
      console.log('------------------------------------------------------');
    }

    await queryRunner.commitTransaction();
    console.log(`\nÉXITO: Se completó la transacción. Total de tratamientos actualizados: ${totalActualizados}\n`);

  } catch (error) {
    console.error('\nERROR durante la actualización. Revirtiendo transacción (ROLLBACK)...', error);
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
    await ds.destroy();
  }
}

main().catch(err => {
  console.error('Fallo general:', err);
  process.exit(1);
});
