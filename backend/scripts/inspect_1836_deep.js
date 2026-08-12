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

    console.log("=== PROFORMAS 1836 ===");
    const profs = await client.query(`
        SELECT id, "pacienteId", numero, fecha, total, aprobado
        FROM proformas WHERE "pacienteId" = 1836 ORDER BY numero, id;
    `);
    console.table(profs.rows);

    console.log("\n=== PROFORMA DETALLE 1836 ===");
    const details = await client.query(`
        SELECT pd.*
        FROM proforma_detalle pd
        JOIN proformas p ON pd."proformaId" = p.id
        WHERE p."pacienteId" = 1836
        ORDER BY pd."proformaId", pd.id;
    `);
    console.table(details.rows);

    console.log("\n=== HISTORIA CLINICA 1836 ===");
    const hc = await client.query(`
        SELECT *
        FROM historia_clinica
        WHERE "pacienteId" = 1836
        ORDER BY "proformaId", id;
    `);
    console.table(hc.rows);

    console.log("\n=== PAGOS 1836 ===");
    const pagos = await client.query(`
        SELECT *
        FROM pagos WHERE "pacienteId" = 1836 ORDER BY fecha;
    `);
    console.table(pagos.rows);

    console.log("\n=== PAGOS DETALLES 1836 ===");
    const pagosDetalles = await client.query(`
        SELECT pd.*
        FROM pagos_detalles pd
        JOIN pagos p ON pd."pagoId" = p.id
        WHERE p."pacienteId" = 1836
        ORDER BY pd."pagoId", pd.id;
    `);
    console.table(pagosDetalles.rows);

    await client.end();
}

main().catch(console.error);
