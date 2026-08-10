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

    console.log('=== PACIENTE 1129 PROFORMA #2 (ID 5422) TRATAMIENTOS ===\n');

    const pd = await client.query(`
        SELECT pd.id, a.detalle AS arancel_tratamiento, pd.piezas, pd.cantidad
        FROM proforma_detalle pd
        LEFT JOIN arancel a ON a.id = pd."arancelId"
        WHERE pd."proformaId" = 5422
        ORDER BY pd.id;
    `);

    console.log('Proforma Detalle:');
    console.table(pd.rows);

    const hc = await client.query(`
        SELECT hc.id, hc.tratamiento AS hc_tratamiento, hc.pieza, hc."estadoTratamiento", hc."proformaDetalleId"
        FROM historia_clinica hc
        WHERE hc."proformaId" = 5422
        ORDER BY hc.id;
    `);

    console.log('\nHistoria Clinica:');
    console.table(hc.rows);

    await client.end();
}

main().catch(console.error);
