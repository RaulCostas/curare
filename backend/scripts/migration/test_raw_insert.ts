import { getAppDataSource } from './config';

async function testRawInsert() {
  const dataSource = await getAppDataSource();

  await dataSource.query('TRUNCATE TABLE "pacientes" CASCADE;');

  // Insertar un registro con id=1001 manualmente con SQL
  await dataSource.query(
    `INSERT INTO pacientes (id, access_id, nombre, paterno, materno, fecha, sexo, tipo_paciente, estado, "createdAt", "updatedAt") 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
    [1001, 'P-1001', 'SUSANA', 'ALCAZAR', '', '2020-01-01', 'FEMENINO', 'NORMAL', 'activo']
  );

  const res = await dataSource.query(`SELECT id, access_id, nombre FROM pacientes WHERE access_id = 'P-1001';`);
  console.log('Resultado de inserción SQL directa para P-1001:');
  console.log(res);

  process.exit(0);
}

testRawInsert();
