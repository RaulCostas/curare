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

  const pgPagos = await ds.query('SELECT * FROM pagos_doctores ORDER BY id ASC');

  console.log(`Access Pago_Doctores row count: ${pdRows.length}`);
  console.log(`PG pagos_doctores row count: ${pgPagos.length}`);

  // Let's check row index 469 (which is ID 470 if 1-indexed) or find P-D-1432 in Access
  const p1432Index = pdRows.findIndex(r => cleanString(r.IdPagos).toUpperCase() === 'P-D-1432');
  console.log(`Index of P-D-1432 in Access pdRows: ${p1432Index}`);

  if (p1432Index !== -1) {
    console.log('Access row at index:', pdRows[p1432Index]);
    console.log('PG row at same index (id):', pgPagos[p1432Index]);
  }

  await ds.destroy();
}

main().catch(console.error);
