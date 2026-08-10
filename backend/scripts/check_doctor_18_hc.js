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

  const doc18 = await ds.query(`SELECT * FROM doctor WHERE id = 18`);
  console.log('Doctor 18:', doc18);

  const hc18 = await ds.query(`
    SELECT h.id, h.fecha, h.tratamiento, h.pieza, h.precio, h.pagado, h."pacienteId", p.nombre, p.paterno
    FROM historia_clinica h
    LEFT JOIN pacientes p ON p.id = h."pacienteId"
    WHERE h."doctorId" = 18
    ORDER BY h.id DESC
    LIMIT 20
  `);
  console.log('Historia clinica for doctor 18 count:', hc18.length);
  console.log('Historia clinica sample for doctor 18:', hc18);

  await ds.destroy();
}

main().catch(console.error);
