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

    const profRes = await client.query(`
        SELECT id, "pacienteId", numero, fecha, total
        FROM proformas
        WHERE "pacienteId" = 1129 AND numero = 4;
    `);

    console.log('Updated Proforma Record for Patient 1129 #4:');
    console.table(profRes.rows);

    await client.end();
}

main();
