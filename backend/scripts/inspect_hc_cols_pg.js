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

    const cols = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'historia_clinica';
    `);

    console.log('Columns in PostgreSQL historia_clinica:');
    console.table(cols.rows);

    const sample = await client.query(`SELECT id, "pacienteId", fecha, tratamiento FROM historia_clinica LIMIT 5;`);
    console.log('Sample:');
    console.table(sample.rows);

    await client.end();
}

main().catch(console.error);
