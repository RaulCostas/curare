const { Client } = require('pg');

const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433'),
    database: process.env.DB_NAME || 'curare',
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgrespg',
});

async function main() {
    await client.connect();

    const pRes = await client.query(`SELECT id, access_id, paterno, materno, nombre FROM pacientes WHERE id = 94`);
    console.log("Postgres Patient 94:", pRes.rows[0]);

    await client.end();
}

main().catch(console.error);
