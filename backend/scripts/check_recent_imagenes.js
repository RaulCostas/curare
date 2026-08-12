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

    console.log("=== RECENT PROFORMAS_IMAGENES IN POSTGRES ===");
    const res = await client.query(`
        SELECT id, "proformaId", nombre_archivo, descripcion, fecha_creacion
        FROM proformas_imagenes
        ORDER BY id DESC
        LIMIT 10
    `);

    console.table(res.rows);

    await client.end();
}

main().catch(console.error);
