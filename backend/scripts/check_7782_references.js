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

    console.log("=== CHECKING ALL REFERENCES TO PROFORMA 7782 ===");

    // List of tables that might have proformaId
    const tablesRes = await client.query(`
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE column_name IN ('proformaId', 'proforma_id') 
          AND table_schema = 'public';
    `);

    for (const row of tablesRes.rows) {
        const query = `SELECT COUNT(*) FROM "${row.table_name}" WHERE "${row.column_name}" = 7782`;
        try {
            const countRes = await client.query(query);
            console.log(`Table "${row.table_name}" ("${row.column_name}" = 7782): ${countRes.rows[0].count}`);
        } catch (e) {
            console.log(`Error checking "${row.table_name}": ${e.message}`);
        }
    }

    await client.end();
}

main().catch(console.error);
