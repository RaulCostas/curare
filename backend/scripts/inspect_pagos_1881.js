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

    console.log('=== ALL PAGOS FOR PATIENT 1881 (GARAFULIC LEHM WALTER RAUL) ===\n');

    const pagos = await client.query(`
        SELECT id, "pacienteId", "proformaId", fecha, monto, moneda, tc
        FROM pagos
        WHERE "pacienteId" = 1881
        ORDER BY fecha DESC, id DESC;
    `);

    console.table(pagos.rows);

    await client.end();
}

main().catch(console.error);
