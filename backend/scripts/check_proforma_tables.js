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

    // Find all columns in any table containing 'proforma'
    const cols = await client.query(`
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND column_name ILIKE '%proforma%';
    `);

    console.log('=== COLUMNS referencing or containing proforma ===');
    console.table(cols.rows);

    // Let's also check detail tables like proforma_detalles or proformas_detalles or similar
    const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name ILIKE '%proforma%';
    `);
    console.log('\n=== TABLES containing proforma ===');
    console.table(tables.rows);

    await client.end();
}

main().catch(console.error);
