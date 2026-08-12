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

    const mariaElena = pacRows.filter(r => 
        (r.Nombre && String(r.Nombre).includes('MARIA ELENA')) || 
        (r.Paterno && String(r.Paterno).includes('TOLEDO'))
    );
    console.log("Maria Elena matches in Paciente table:", mariaElena);

    const tdTable = reader.getTable('Trabajos_Doctores');
    const tdRows = tdTable.getData();

    if (mariaElena.length > 0) {
        for (const p of mariaElena) {
            const codPac = p.Cod_Pac || p.Id || p.ID;
            console.log(`Checking Cod_Pac ${codPac} (${p.Paterno} ${p.Nombre})`);
            const tdMatches = tdRows.filter(r => String(r.Cod_Pac) === String(codPac));
            console.log(`Trabajos_Doctores count for Cod_Pac ${codPac}: ${tdMatches.length}`);
            if (tdMatches.length > 0) {
                console.log(tdMatches.map(r => ({
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
    }
}

main();
