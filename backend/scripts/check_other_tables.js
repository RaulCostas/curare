const { Client } = require('pg');

async function test() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5433', 10),
        database: process.env.DB_NAME || 'curare',
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgrespg',
    });

    await client.connect();

    // Check all tables and their columns
    const tables = [
        'recordatorio_tratamiento',
        'recordatorio_plan',
        'pacientes',
        'proformas',
        'proforma_detalle',
        'doctor',
        'personal',
        'arancel',
        'especialidad'
    ];

    for (const t of tables) {
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = $1;
        `, [t]);
        console.log(`Table ${t}:`, res.rows.map(r => r.column_name));
    }

    await client.end();
}

test().catch(console.error);
