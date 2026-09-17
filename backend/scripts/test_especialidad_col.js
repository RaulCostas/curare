const { Client } = require('pg');

async function test() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5433', 10),
        database: process.env.DB_NAME || 'curare',
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgrespg',
    });

    await client.connect();
    
    // Check if especialidadId column exists
    const res = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'historia_clinica' AND column_name = 'especialidadId';
    `);
    console.log('especialidadId column exists:', res.rows);

    await client.end();
}

test().catch(console.error);
