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

    const pac = await client.query(`SELECT * FROM pacientes WHERE id = 1129;`);
    console.log('PG Patient 1129:', pac.rows);

    await client.end();
}

main();
