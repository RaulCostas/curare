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

    console.log('=== INSPECTING PATIENT 1881 PROFORMA #2 (ID 4338) ===\n');

    const prof = await client.query(`SELECT id, numero, fecha, total FROM proformas WHERE id = 4338;`);
    console.log('Proforma Header:');
    console.table(prof.rows);

    const pd = await client.query(`
        SELECT pd.id, a.detalle AS tratamiento, pd.piezas, pd.cantidad, pd."precioUnitario", pd."subTotal", pd.descuento, pd.total
        FROM proforma_detalle pd
        LEFT JOIN arancel a ON a.id = pd."arancelId"
        WHERE pd."proformaId" = 4338;
    `);

    console.log('\nProforma Detalle Items:');
    console.table(pd.rows);

    const hc = await client.query(`
        SELECT id, fecha, tratamiento, pieza, cantidad, precio, "estadoTratamiento", "proformaDetalleId"
        FROM historia_clinica
        WHERE "proformaId" = 4338;
    `);

    console.log('\nHistoria Clinica Items:');
    console.table(hc.rows);

    const pagos = await client.query(`SELECT id, fecha, monto, moneda, tc FROM pagos WHERE "proformaId" = 4338;`);
    console.log('\nPagos:');
    console.table(pagos.rows);

    await client.end();
}

main().catch(console.error);
