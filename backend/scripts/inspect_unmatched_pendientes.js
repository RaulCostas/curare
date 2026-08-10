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

    for (const row of flagged) {
        const rawId = (row.Id || '').trim();
        const pacIdNum = parseInt(rawId.replace(/[^0-9]/g, ''), 10);
        const presNum = parseInt((row.Presupuesto || '').trim(), 10);

        const res = await client.query(`
            SELECT id, "pacienteId", numero, total, fecha
            FROM proformas
            WHERE "pacienteId" = $1 AND numero = $2;
        `, [pacIdNum, presNum]);

        if (res.rows.length === 0) {
            // Check if patient exists
            const pacRes = await client.query(`SELECT id, paterno, materno, nombre FROM pacientes WHERE id = $1`, [pacIdNum]);
            console.log(`Unmatched row in Access: Paciente ${rawId} (${pacIdNum}), Presupuesto=${presNum}, Name=${row.NombreApellido}`);
            console.log(`  Patient in PG:`, pacRes.rows);
            // Check all proformas for this patient in PG
            const allProf = await client.query(`SELECT id, numero, fecha, total FROM proformas WHERE "pacienteId" = $1`, [pacIdNum]);
            console.log(`  Proformas in PG for patient:`, allProf.rows);
        }
    }

    await client.end();
}

main().catch(console.error);
