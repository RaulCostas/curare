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
    const res = await client.query(`
        SELECT p.id, p."pacienteId", p.numero, p.fecha, p.total, p.aprobado
        FROM proformas p
        WHERE p."pacienteId" = 1836
        ORDER BY p.numero, p.fecha DESC;
    `);
    console.table(res.rows);
    await client.end();
}

main();
