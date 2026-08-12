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

    await client.query('BEGIN');

    try {
        // Para HL 16892 y otros que usan el precio registrado en HC de 11,156.25:
        await client.query(`
            UPDATE historia_clinica
            SET "proformaDetalleId" = NULL
            WHERE id = 16892 AND "pacienteId" = 94;
        `);

        await client.query('COMMIT');
        console.log("=== DESVINCULADO DETALLE EN HL 16892 ===");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error(e);
    } finally {
        await client.end();
    }
}

main().catch(console.error);
