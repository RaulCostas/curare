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

    console.log('=== PROFORMA 5422 DETALLE (Planteado) ===');
    const pd = await client.query(`
        SELECT pd.id, a.detalle AS tratamiento, pd.piezas, pd.cantidad, pd."precioUnitario", pd.total
        FROM proforma_detalle pd
        LEFT JOIN arancel a ON a.id = pd."arancelId"
        WHERE pd."proformaId" = 5422
        ORDER BY pd.id;
    `);
    console.table(pd.rows);

    await client.end();
}

main().catch(console.error);
