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

    const c1 = await client.query(`SELECT COUNT(*) FROM proformas_imagenes`);
    console.log("proformas_imagenes count:", c1.rows[0].count);

    const c2 = await client.query(`SELECT COUNT(*) FROM informes`);
    console.log("informes count:", c2.rows[0].count);

    const c3 = await client.query(`SELECT COUNT(*) FROM casos_clinicos_fotos`);
    console.log("casos_clinicos_fotos count:", c3.rows[0].count);

    await client.end();
}

main().catch(console.error);
