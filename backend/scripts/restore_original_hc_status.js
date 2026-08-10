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

    console.log('=== RESTORING ORIGINAL HISTORIA_CLINICA ESTADOTRATAMIENTO FROM ACCESS MDB ===\n');

    const hoTable = reader.getTable('Historial_Odonto');
    const hoData = hoTable.getData();

    console.log(`Access Historial_Odonto has ${hoData.length} records.`);

    // Restore estadoTratamiento for matching IDs
    let restoredCount = 0;

    await client.query('BEGIN');
    try {
        for (const row of hoData) {
            const rawId = (row.Id || '').trim();
            const pacIdNum = parseInt(rawId.replace(/[^0-9]/g, ''), 10);
            const fechaStr = row.Fecha ? new Date(row.Fecha).toISOString().split('T')[0] : null;
            const trat = (row.Tratamiento || '').trim();
            const pz = (row.Pieza || '').trim();
            const estadoTrat = (row.Estado || 'no terminado').trim().toLowerCase();

            if (!pacIdNum || !fechaStr || !trat) continue;

            // Match in PG historia_clinica
            const matchRes = await client.query(`
                SELECT id 
                FROM historia_clinica
                WHERE "pacienteId" = $1 
                  AND fecha = $2 
                  AND LOWER(TRIM(tratamiento)) = LOWER($3)
                  AND LOWER(TRIM(COALESCE(pieza, ''))) = LOWER($4);
            `, [pacIdNum, fechaStr, trat, pz]);

            if (matchRes.rows.length > 0) {
                const ids = matchRes.rows.map(r => r.id);
                await client.query(`
                    UPDATE historia_clinica
                    SET "estadoTratamiento" = $1
                    WHERE id = ANY($2::int[]);
                `, [estadoTrat, ids]);
                restoredCount += ids.length;
            }
        }
        await client.query('COMMIT');
        console.log(`Restaurados ${restoredCount} registros en historia_clinica al estado original de Access!`);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error durante restauración:', err);
    }

    await client.end();
}

main().catch(console.error);
