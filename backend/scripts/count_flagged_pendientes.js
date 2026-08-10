const path = require('path');
const fs = require('fs');
const MDBReader = require('mdb-reader').default || require('mdb-reader');

const mdbPath = 'D:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb';
const buffer = fs.readFileSync(mdbPath);
const reader = new MDBReader(buffer);

const table1 = reader.getTable('Paciente_Pendiente1');
const data1 = table1.getData();

const countTraspasados = data1.filter(r => r.Traspasado && r.Traspasado.trim().toUpperCase() === 'SI');
const countObservados = data1.filter(r => r.Deuda_Observada && r.Deuda_Observada.trim().toUpperCase() === 'SI');

console.log(`Total rows in Paciente_Pendiente1: ${data1.length}`);
console.log(`Rows with Traspasado = 'SI': ${countTraspasados.length}`);
console.log(`Rows with Deuda_Observada = 'SI': ${countObservados.length}`);

// Check distinct proformas in Paciente_Pendiente1 with Traspasado='SI' or Deuda_Observada='SI'
const flagged = data1.filter(r => 
    (r.Traspasado && r.Traspasado.trim().toUpperCase() === 'SI') || 
    (r.Deuda_Observada && r.Deuda_Observada.trim().toUpperCase() === 'SI')
);
console.log(`Total rows with either Traspasado='SI' or Deuda_Observada='SI': ${flagged.length}`);

// Inspect unique patients in flagged
const uniquePatientIds = new Set(flagged.map(r => r.Id));
console.log(`Unique Patient Access IDs in flagged rows: ${uniquePatientIds.size}`);
