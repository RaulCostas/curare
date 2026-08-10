const mdbReaderModule = require('mdb-reader');
const MDBReader = mdbReaderModule.default || mdbReaderModule;
const fs = require('fs');
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

function cleanString(val) {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

async function main() {
  await ds.initialize();
  const buffer = fs.readFileSync('D:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb');
  const reader = new MDBReader(buffer);

  const pdTable = reader.getTable('Pago_Doctores');
  const pdRows = pdTable.getData();

  const pddTable = reader.getTable('Pago_Doctores_Detalle');
  const pddRows = pddTable.getData();

  console.log('--- Searching Access Pago_Doctores for Numero_Pago 1432 or IdPagos 1432 ---');
  const matchPD = pdRows.filter(r => cleanString(r.Numero_Pago) === '1432' || cleanString(r.IdPagos).includes('1432') || cleanString(r.IdPagos).includes('470'));
  console.log('Access Pago_Doctores matches:', matchPD);

  if (matchPD.length > 0) {
    const rawId = matchPD[0].IdPagos;
    console.log(`\nAccess details for IdPagos "${rawId}":`);
    const matchPDD = pddRows.filter(r => cleanString(r.IdPagos).toUpperCase().trim() === cleanString(rawId).toUpperCase().trim());
    console.log('Match details count in Access:', matchPDD.length);
    console.log('Match details sample in Access:', matchPDD);
  }

  // Check in PostgreSQL how Pago_Doctores was populated with ID vs Numero_Pago
  console.log('\n--- Checking PG pagos_doctores for total = 186.50 and doctor = Antequera ---');
  const pgPagos186 = await ds.query(`
    SELECT pd.*, doc.paterno, doc.nombre
    FROM pagos_doctores pd
    JOIN doctor doc ON doc.id = pd."idDoctor"
    WHERE pd.total = '186.50' OR pd.id = 1432 OR pd.id = 470
  `);
  console.log('PG Pagos matching:', pgPagos186);

  // Check detalles in PG for all these payments
  for (const p of pgPagos186) {
    const details = await ds.query(`
      SELECT d.*, h.tratamiento, h.pieza, p.nombre, p.paterno
      FROM pagos_detalle_doctores d
      JOIN historia_clinica h ON h.id = d.idhistoria_clinica
      JOIN pacientes p ON p.id = h."pacienteId"
      WHERE d."idPagos" = ${p.id}
    `);
    console.log(`PG Pago ID ${p.id} details count: ${details.length}`);
    if (details.length > 0) {
      console.log(`PG Pago ID ${p.id} details sample:`, details);
    }
  }

  await ds.destroy();
}

main().catch(console.error);
