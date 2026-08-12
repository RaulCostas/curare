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

    console.log("=== PROFORMA #3 (ID 4602) PACIENTE 94 ===");
    const prof = await client.query(`SELECT * FROM proformas WHERE id = 4602`);
    console.log(prof.rows);

    console.log("\n=== PROFORMA_DETALLE (ID 4602) ===");
    const pd = await client.query(`
        SELECT pd.id, pd."arancelId", pd."precioUnitario", pd.tc, pd.piezas, pd.cantidad, pd."subTotal", pd.descuento, pd.total, pd.posible, a.detalle as arancel_nombre
        FROM proforma_detalle pd
        LEFT JOIN arancel a ON pd."arancelId" = a.id
        WHERE pd."proformaId" = 4602
        ORDER BY pd.id
    `);
    console.table(pd.rows);

    console.log("\n=== HISTORIA CLINICA (PROFORMA ID 4602) ===");
    const hc = await client.query(`
        SELECT id, fecha, pieza, tratamiento, precio, cantidad, "estadoTratamiento", "estadoPresupuesto", "proformaDetalleId", access_id
        FROM historia_clinica
        WHERE "proformaId" = 4602
        ORDER BY id
    `);
    console.table(hc.rows);

    await client.end();
}

main().catch(console.error);
