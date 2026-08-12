const fs = require('fs');
const path = require('path');
const mdbReaderModule = require('mdb-reader');
const MDBReader = mdbReaderModule.default || mdbReaderModule;

const MDB_PATH = path.resolve(__dirname, '../../backups/curare.mdb');

function main() {
    const buffer = fs.readFileSync(MDB_PATH);
    const reader = new MDBReader(buffer);

    const tdTable = reader.getTable('Trabajos_Doctores');
    const tdRows = tdTable.getData();

    console.log("=== ACCESS TRABAJOS_DOCTORES FOR PATIENT 94 ===");
    const p94Rows = tdRows.filter(r => Number(r.Cod_Pac) === 94);
    console.log(`Found ${p94Rows.length} rows in Access Trabajos_Doctores for patient 94`);
    console.table(p94Rows.map(r => ({
        Id: r.Id,
        Cod_Pac: r.Cod_Pac,
        Cod_Prof: r.Cod_Prof,
        Fecha: r.Fecha ? new Date(r.Fecha).toISOString().split('T')[0] : null,
        Pieza: r.Pieza,
        Tratamiento: r.Tratamiento,
        Precio: r.Precio,
        Realizado: r.Realizado,
        Factura: r.Factura,
        Proforma: r.Proforma
    })));
}

main();
