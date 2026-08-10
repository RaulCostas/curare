const path = require('path');
const fs = require('fs');
const MDBReader = require('mdb-reader').default || require('mdb-reader');

const mdbPath = 'D:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb';
const buffer = fs.readFileSync(mdbPath);
const reader = new MDBReader(buffer);

const table = reader.getTable('Historial_Odonto');
console.log('Columns:', table.getColumnNames());
const sample = table.getData().slice(0, 5);
console.log('Sample rows:');
console.table(sample);
