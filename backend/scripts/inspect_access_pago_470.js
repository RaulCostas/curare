const mdbReaderModule = require('mdb-reader');
const MDBReader = mdbReaderModule.default || mdbReaderModule;
const fs = require('fs');

try {
  const mdbPath = 'D:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb';
  console.log('Reading MDB from:', mdbPath);
  const buffer = fs.readFileSync(mdbPath);
  const reader = new MDBReader(buffer);
  const pdTable = reader.getTable('Pago_Doctores');
  const pdRows = pdTable.getData();
  const pddTable = reader.getTable('Pago_Doctores_Detalle');
  const pddRows = pddTable.getData();

  console.log(`Total Pago_Doctores in Access: ${pdRows.length}`);
  console.log(`Total Pago_Doctores_Detalle in Access: ${pddRows.length}`);

  const pd470 = pdRows.filter((r) => String(r.IdPagos).includes('470'));
  console.log('\nAccess Pago_Doctores matching 470:', pd470);

  const pdd470 = pddRows.filter((r) => String(r.IdPagos).includes('470'));
  console.log('\nAccess Pago_Doctores_Detalle matching 470:', pdd470);

  const accessDetailPagosIds = new Set(pddRows.map((r) => String(r.IdPagos).toUpperCase().trim()));

  const pagosWithoutDetailsInAccess = pdRows.filter((r) => !accessDetailPagosIds.has(String(r.IdPagos).toUpperCase().trim()));
  console.log(`\nPagos in Access WITH 0 DETAILS IN ORIGINAL ACCESS MDB: ${pagosWithoutDetailsInAccess.length}`);
  console.log('Sample Access pagos with 0 details in original MDB:', pagosWithoutDetailsInAccess.slice(0, 10));

} catch (err) {
  console.error('Error reading MDB:', err);
}
