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
    const profs = await client.query(`SELECT * FROM proformas WHERE "pacienteId" = 1836 ORDER BY numero, id`);
    console.log(JSON.stringify(profs.rows, null, 2));

    console.log("\n=== PROFORMA DETALLE 1836 ===");
    const details = await client.query(`
        SELECT pd.*
        FROM proforma_detalle pd
        JOIN proformas p ON pd."proformaId" = p.id
        WHERE p."pacienteId" = 1836
        ORDER BY pd."proformaId", pd.id
    `);
    console.log(JSON.stringify(details.rows, null, 2));

    console.log("\n=== HISTORIA CLINICA 1836 ===");
    const hc = await client.query(`
        SELECT id, "pacienteId", "proformaId", "proformaDetalleId", fecha, pieza, tratamiento, precio, "estadoTratamiento", "estadoPresupuesto", access_id
        FROM historia_clinica
        WHERE "pacienteId" = 1836
        ORDER BY "proformaId", id
    `);
    console.log(JSON.stringify(hc.rows, null, 2));

    console.log("\n=== PAGOS 1836 ===");
    const pagos = await client.query(`SELECT * FROM pagos WHERE "pacienteId" = 1836 ORDER BY fecha`);
    console.log(JSON.stringify(pagos.rows, null, 2));

    try {
        console.log("\n=== PAGO DETALLE DOCTORES 1836 ===");
        const pdd = await client.query(`
            SELECT pdd.* FROM pagos_detalle_doctores pdd
            JOIN historia_clinica hc ON pdd."historiaClinicaId" = hc.id
            WHERE hc."pacienteId" = 1836
        `);
        console.log(JSON.stringify(pdd.rows, null, 2));
    } catch(e) {
        console.log("No pagos_detalle_doctores error:", e.message);
    }

    await client.end();
}

main().catch(console.error);
