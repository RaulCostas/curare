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

    const table1 = reader.getTable('Paciente_Pendiente1');
    const data1 = table1.getData();

    const flagged = data1.filter(r => 
        (r.Traspasado && r.Traspasado.trim().toUpperCase() === 'SI') || 
        (r.Deuda_Observada && r.Deuda_Observada.trim().toUpperCase() === 'SI')
    );

    console.log(`Total flagged rows in Paciente_Pendiente1: ${flagged.length}`);

    let matchedCount = 0;
    let notFoundCount = 0;
    let sampleMatches = [];

    for (const row of flagged) {
        // Extract patient numeric ID from Id ('P-1877' -> 1877)
        const rawId = (row.Id || '').trim();
        const pacIdNum = parseInt(rawId.replace(/[^0-9]/g, ''), 10);
        const presNum = parseInt((row.Presupuesto || '').trim(), 10);

        if (!pacIdNum || isNaN(presNum)) {
            notFoundCount++;
            continue;
        }

        // Search for matching proforma in PG
        const res = await client.query(`
            SELECT id, "pacienteId", numero, total, fecha
            FROM proformas
            WHERE "pacienteId" = $1 AND numero = $2;
        `, [pacIdNum, presNum]);

        if (res.rows.length > 0) {
            matchedCount++;
            if (sampleMatches.length < 10) {
                sampleMatches.push({
                    pgProformaId: res.rows[0].id,
                    pacienteId: pacIdNum,
                    numero: presNum,
                    traspasado: row.Traspasado,
                    obs: row.Observaciones,
                    deudaObs: row.Deuda_Observada,
                    obs1: row.Observaciones1
                });
            }
        } else {
            notFoundCount++;
        }
    }

    console.log(`Matched with PG proformas: ${matchedCount}`);
    console.log(`Not matched / missing in PG: ${notFoundCount}`);
    console.log('\nSample Matches:');
    console.table(sampleMatches);

    await client.end();
}

main().catch(console.error);
