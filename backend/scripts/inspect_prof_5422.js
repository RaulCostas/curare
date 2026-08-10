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

    console.log('=== ALL ROWS FOR PROFORMA 5422 (Paciente 1129, Presupuesto #4) ===');
    const hc = await client.query(`
        SELECT hc.id, hc.fecha, hc.tratamiento, hc.pieza, hc.cantidad, hc.precio, hc."estadoTratamiento", hc."estadoPresupuesto", hc."proformaDetalleId"
        FROM historia_clinica hc
        WHERE hc."proformaId" = 5422
        ORDER BY hc.tratamiento, hc.pieza, hc.fecha;
    `);

    console.table(hc.rows);

    await client.end();
}

main().catch(console.error);
