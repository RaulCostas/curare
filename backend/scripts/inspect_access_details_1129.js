const path = require('path');
const fs = require('fs');
const MDBReader = require('mdb-reader').default || require('mdb-reader');

const mdbPath = 'D:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb';
const buffer = fs.readFileSync(mdbPath);
const reader = new MDBReader(buffer);

// Proforma
const profTable = reader.getTable('Proforma');
const profsData = profTable.getData().filter(r => (r.Id || '').includes('1129'));
console.log('Access Proforma for 1129:');
console.table(profsData);

// Pro_Detalle
const proDetTable = reader.getTable('Pro_Detalle');
const proDetData = proDetTable.getData().filter(r => (r.Id || '').includes('1129'));
console.log('\nAccess Pro_Detalle for 1129:');
console.table(proDetData);

// Historial_Odonto
const hoTable = reader.getTable('Historial_Odonto');
const hoData = hoTable.getData().filter(r => (r.Id || '').includes('1129'));
console.log('\nAccess Historial_Odonto for 1129:');
console.table(hoData.slice(0, 30));
