const fs = require('fs');
const path = require('path');
const mdbReaderModule = require('mdb-reader');
const MDBReader = mdbReaderModule.default || mdbReaderModule;

const MDB_PATH = path.resolve(__dirname, '../../backups/curare.mdb');

function main() {
    const buffer = fs.readFileSync(MDB_PATH);
    const reader = new MDBReader(buffer);
    console.log("Table names in MDB:", reader.getTableNames());
}

main();
