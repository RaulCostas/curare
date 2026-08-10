const path = require('path');
const fs = require('fs');
const MDBReader = require('mdb-reader').default || require('mdb-reader');

const mdbPath = 'D:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb';
const buffer = fs.readFileSync(mdbPath);
const reader = new MDBReader(buffer);

const table1 = reader.getTable('Paciente_Pendiente1');
const data1 = table1.getData();

const traspasados = data1.filter(r => (r.Traspasado && r.Traspasado.trim().toUpperCase() === 'SI') || (r.Observaciones && r.Observaciones.trim().length > 0));
const observados = data1.filter(r => (r.Deuda_Observada && r.Deuda_Observada.trim().toUpperCase() === 'SI') || (r.Observaciones1 && r.Observaciones1.trim().length > 0));

console.log(`Paciente_Pendiente1: Total rows = ${data1.length}`);
console.log(`Traspasados = 'SI' or with Observaciones: ${traspasados.length}`);
console.log(`Deuda_Observada = 'SI' or with Observaciones1: ${observados.length}`);

console.log('\n=== SAMPLE TRASPASADOS ===');
console.table(traspasados.slice(0, 10).map(r => ({
    Id: r.Id,
    Paciente: r.NombreApellido,
    Presupuesto: r.Presupuesto,
    Fecha: r.Fecha,
    Traspasado: r.Traspasado,
    Observaciones: r.Observaciones
})));

console.log('\n=== SAMPLE DEUDA OBSERVADA ===');
console.table(observados.slice(0, 10).map(r => ({
    Id: r.Id,
    Paciente: r.NombreApellido,
    Presupuesto: r.Presupuesto,
    Fecha: r.Fecha,
    Deuda_Observada: r.Deuda_Observada,
    Observaciones1: r.Observaciones1
})));
