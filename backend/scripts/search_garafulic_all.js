const { Client } = require('pg');

async function main() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5433'),
        database: process.env.DB_NAME || 'curare',
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgrespg',
    });

    await client.connect();

    console.log('=== SEARCHING ALL PATIENTS AND PROFORMAS FOR GARAFULIC ===\n');

    const pacs = await client.query(`
        SELECT id, paterno, materno, nombre, estado 
        FROM pacientes 
        WHERE LOWER(paterno) LIKE '%garafulic%' 
           OR LOWER(materno) LIKE '%garafulic%' 
           OR LOWER(nombre) LIKE '%garafulic%';
    `);

    console.log('Patients matching Garafulic:');
    console.table(pacs.rows);

    for (const p of pacs.rows) {
        const profs = await client.query(`
            SELECT id, numero, fecha, total, traspasado, deuda_observada
            FROM proformas
            WHERE "pacienteId" = $1;
        `, [p.id]);

        console.log(`\nProformas for Patient ID ${p.id} (${p.paterno} ${p.materno} ${p.nombre}):`);
        console.table(profs.rows);
    }

    await client.end();
}

main().catch(console.error);
