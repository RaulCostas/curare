const mdbReaderModule = require('mdb-reader');
const MDBReader = mdbReaderModule.default || mdbReaderModule;
const fs = require('fs');

function cleanString(val) {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

try {
  const buffer = fs.readFileSync('D:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb');
  const reader = new MDBReader(buffer);

  const pdTable = reader.getTable('Pago_Doctores');
  const pdRows = pdTable.getData();

  const pddTable = reader.getTable('Pago_Doctores_Detalle');
  const pddRows = pddTable.getData();

  console.log('--- Access Pago_Doctores for P-D-1432 or Numero_Pago 1432 ---');
  const matchPD = pdRows.filter(r => cleanString(r.IdPagos).includes('1432') || cleanString(r.Numero_Pago) === '1432');
  console.log('Access Pago_Doctores 1432:', matchPD);

  if (matchPD.length > 0) {
    const accessId = matchPD[0].IdPagos;
    console.log(`\nAccess Pago_Doctores_Detalle for IdPagos = "${accessId}":`);
    const matchPDD = pddRows.filter(r => cleanString(r.IdPagos).toUpperCase().trim() === cleanString(accessId).toUpperCase().trim());
    console.log(`Details count for ${accessId}: ${matchPDD.length}`);
    console.log('Details:', matchPDD);
  }

} catch (err) {
  console.error('Error:', err);
}
