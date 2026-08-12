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

    console.log("=== PROXIMA CITA 7782 ===");
    const pc = await client.query(`SELECT * FROM proxima_cita WHERE proforma_id = 7782`);
    console.log(pc.rows);

    console.log("=== SECUENCIA TRATAMIENTO 7782 ===");
    const st = await client.query(`SELECT * FROM secuencia_tratamiento WHERE "proformaId" = 7782`);
    console.log(st.rows);

    await client.end();
}

main().catch(console.error);
