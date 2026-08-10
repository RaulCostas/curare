const path = require('path');
const fs = require('fs');
const MDBReader = require('mdb-reader').default || require('mdb-reader');

const mdbPath = 'D:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb';
const buffer = fs.readFileSync(mdbPath);
const reader = new MDBReader(buffer);

const pacTable = reader.getTable('Paciente');
const pacs = pacTable.getData().filter(r => {
    const name = `${r.Nombre || ''} ${r.Paterno || ''} ${r.Materno || ''}`.toUpperCase();
    return name.includes('1129') || (r.Id && String(r.Id).includes('1129')) || (r.Paterno && r.Paterno.toUpperCase().includes('SANCHEZ')) || (r.Nombre && r.Nombre.toUpperCase().includes('SANCHEZ'));
});

console.log('Access Patients found:');
console.table(pacs.map(p => ({ Id: p.Id, Nombre: p.Nombre, Paterno: p.Paterno, Materno: p.Materno })));
