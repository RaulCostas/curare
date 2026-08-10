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

    console.log('=== HISTORIA CLINICA FOR PATIENT 1129 (RIVERA DURAN ERIKA BEATRIZ) ===');
    const hc = await client.query(`
        SELECT hc.id, hc.fecha, hc.tratamiento, hc.pieza, hc.cantidad, hc.precio, hc."estadoTratamiento", hc."estadoPresupuesto", hc."proformaId"
        FROM historia_clinica hc
        WHERE hc."pacienteId" = 1129
        ORDER BY hc.tratamiento, hc.pieza, hc.fecha;
    `);

    console.table(hc.rows);

    await client.end();
}

main().catch(console.error);
