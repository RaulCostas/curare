const fs = require('fs');
const path = require('path');
const mdbReaderModule = require('mdb-reader');
const MDBReader = mdbReaderModule.default || mdbReaderModule;

const MDB_PATH = path.resolve(__dirname, '../../backups/curare.mdb');

function main() {
    const buffer = fs.readFileSync(MDB_PATH);
    const reader = new MDBReader(buffer);

    const pacTable = reader.getTable('Paciente');
    const pacRows = pacTable.getData();

    const p94 = pacRows.find(r => String(r.Id) === '94' || String(r.Cod_Pac) === '94');
    console.log("Access Paciente 94:", p94);

    const tdTable = reader.getTable('Trabajos_Doctores');
    const tdRows = tdTable.getData();

    if (p94) {
        const tdMatches = tdRows.filter(r => r.Cod_Pac === p94.Cod_Pac || r.Cod_Pac === p94.Id);
        console.log(`Access Trabajos_Doctores matches: ${tdMatches.length}`);
        console.table(tdMatches.map(r => ({
            Id: r.Id,
            Cod_Pac: r.Cod_Pac,
            Cod_Prof: r.Cod_Prof,
            Fecha: r.Fecha ? new Date(r.Fecha).toISOString().split('T')[0] : null,
            Pieza: r.Pieza,
            Tratamiento: r.Tratamiento,
            Precio: r.Precio,
            Realizado: r.Realizado
        })));
    }
}

main();
