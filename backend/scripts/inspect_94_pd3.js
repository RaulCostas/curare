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

    console.log("=== PROFORMA_DETALLE ID 4602 ===");
    const pd = await client.query(`
        SELECT pd.id, pd."arancelId", pd."precioUnitario", pd.piezas, pd.cantidad, pd."subTotal", pd.descuento, pd.total, a.detalle as arancel_nombre
        FROM proforma_detalle pd
        LEFT JOIN arancel a ON pd."arancelId" = a.id
        WHERE pd."proformaId" = 4602
        ORDER BY pd.id
    `);
    console.table(pd.rows);

    await client.end();
}

main().catch(console.error);
