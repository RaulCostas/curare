const path = require('path');
const fs = require('fs');
const MDBReader = require('mdb-reader').default || require('mdb-reader');

const mdbPath = 'D:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb';
const buffer = fs.readFileSync(mdbPath);
const reader = new MDBReader(buffer);

console.log('Tables in MDB:');
const tables = reader.getTableNames();
console.log(tables.filter(t => t.toLowerCase().includes('pendiente') || t.toLowerCase().includes('paciente') || t.toLowerCase().includes('deud')));

const targetTableNames = tables.filter(t => t.toLowerCase().includes('pendiente') || t.toLowerCase().includes('paciente_pendiente'));

for (const tableName of targetTableNames) {
    console.log(`\n=== TABLE: ${tableName} ===`);
    const table = reader.getTable(tableName);
    console.log('Columns:', table.getColumnNames());
    const data = table.getData();
    console.log(`Total rows: ${data.length}`);
    if (data.length > 0) {
        console.log('Sample rows (first 10):');
        console.log(data.slice(0, 10));
    }
}
