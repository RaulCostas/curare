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

    const pd = await client.query(`
        SELECT pd.id, a.detalle AS tratamiento, pd.cantidad, pd."precioUnitario", pd."subTotal", pd.descuento, pd.total
        FROM proforma_detalle pd
        LEFT JOIN arancel a ON a.id = pd."arancelId"
        WHERE pd."proformaId" = 5422
        ORDER BY pd.id;
    `);

    console.log('=== DETALLES PROFORMA 5422 ===');
    console.table(pd.rows);

    // Old bug logic:
    const oldTotalGen = pd.rows.reduce((acc, item) => {
        const val = Number(item.total) || (Number(item.cantidad) * Number(item.precioUnitario));
        return acc + val;
    }, 0);

    // Correct logic:
    const correctTotalGen = pd.rows.reduce((acc, item) => {
        const val = item.total !== undefined && item.total !== null ? Number(item.total) : (Number(item.cantidad) * Number(item.precioUnitario));
        return acc + val;
    }, 0);

    console.log(`Old bug Total General (with '0 || price' bug): ${oldTotalGen}`);
    console.log(`Correct Total General: ${correctTotalGen}`);

    await client.end();
}

main().catch(console.error);
