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

    console.log('=== RESTORING ORIGINAL ESTADOTRATAMIENTO FROM ACCESS MDB ===\n');

    const hoTable = reader.getTable('Historial_Odonto');
    const hoData = hoTable.getData();

    console.log(`Access Historial_Odonto records: ${hoData.length}`);

    let updatedCount = 0;

    await client.query('BEGIN');
    try {
        for (const row of hoData) {
            const hlIdStr = (row.IdHistorial_Odonto || '').trim();
            const idNum = parseInt(hlIdStr.replace(/[^0-9]/g, ''), 10);
            const estadoTrat = (row.Estado_Tratamiento || 'no terminado').trim().toLowerCase();

            if (!idNum) continue;

            const res = await client.query(`
                UPDATE historia_clinica
                SET "estadoTratamiento" = $1
                WHERE id = $2;
            `, [estadoTrat, idNum]);

            if (res.rowCount > 0) {
                updatedCount++;
            }
        }
        await client.query('COMMIT');
        console.log(`Restaurados exitosamente ${updatedCount} registros en historia_clinica a su estado original de Access!`);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error durante la restauración:', err);
    }

    await client.end();
}

main().catch(console.error);
