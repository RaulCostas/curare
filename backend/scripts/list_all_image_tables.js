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

    const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema='public' AND (table_name LIKE '%img%' OR table_name LIKE '%imagen%' OR table_name LIKE '%estudio%' OR table_name LIKE '%foto%')
    `);
    console.log("Matching tables:", tables.rows);

    const allTables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema='public'
    `);
    console.log("All tables:", allTables.rows.map(r => r.table_name));

    await client.end();
}

main().catch(console.error);
