const path = require('path');
const fs = require('fs');
const MDBReader = require('mdb-reader').default || require('mdb-reader');
const { Client } = require('pg');

async function main() {
    const mdbPath = 'D:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb';
    const buffer = fs.readFileSync(mdbPath);
    const reader = new MDBReader(buffer);

    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5433'),
        database: process.env.DB_NAME || 'curare',
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgrespg',
    });

    await client.connect();

    // Find patient 1129 in Access (Id = 'P-1129')
    const hcTable = reader.getTable('Historia_Clinica');
    const hcData = hcTable.getData().filter(r => r.Id === 'P-1129' || r.Id === '1129');

    console.log(`Access Historia_Clinica for P-1129 (${hcData.length} rows):`);
    console.table(hcData.slice(0, 30));

    // Also check Proforma / Presupuesto table for P-1129 in Access
    if (reader.getTableNames().includes('Proforma')) {
        const profTable = reader.getTable('Proforma');
        const profData = profTable.getData().filter(r => r.Id === 'P-1129' || r.Id === '1129');
        console.log(`\nAccess Proforma for P-1129 (${profData.length} rows):`);
        console.table(profData);
    }

    await client.end();
}

main().catch(console.error);
