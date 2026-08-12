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

    console.log("=== PROFORMAS 1003 ===");
    const profs = await client.query(`SELECT * FROM proformas WHERE "pacienteId" = 1003 ORDER BY numero, id`);
    console.log(JSON.stringify(profs.rows, null, 2));

    const p11 = profs.rows.find(p => p.numero === 11);
    const p11Id = p11 ? p11.id : null;
    console.log(`Proforma #11 ID: ${p11Id}`);

    if (p11Id) {
        console.log("\n=== PROFORMA DETALLE 1003 (PROFORMA 11) ===");
        const details = await client.query(`
            SELECT pd.*, a.detalle as arancel_nombre
            FROM proforma_detalle pd
            LEFT JOIN arancel a ON pd."arancelId" = a.id
            WHERE pd."proformaId" = $1
            ORDER BY pd.id
        `, [p11Id]);
        console.log(JSON.stringify(details.rows, null, 2));

        console.log("\n=== HISTORIA CLINICA 1003 (PROFORMA 11) ===");
        const hc = await client.query(`
            SELECT id, "pacienteId", "proformaId", "proformaDetalleId", fecha, pieza, tratamiento, precio, "estadoTratamiento", "estadoPresupuesto", access_id
            FROM historia_clinica
            WHERE "pacienteId" = 1003 AND "proformaId" = $1
            ORDER BY id
        `, [p11Id]);
        console.log(JSON.stringify(hc.rows, null, 2));
    }

    console.log("\n=== ALL HISTORIA CLINICA 1003 ===");
    const allHc = await client.query(`
        SELECT id, "pacienteId", "proformaId", "proformaDetalleId", fecha, pieza, tratamiento, precio, "estadoTratamiento", "estadoPresupuesto", access_id
        FROM historia_clinica
        WHERE "pacienteId" = 1003
        ORDER BY "proformaId", id
    `);
    console.log(JSON.stringify(allHc.rows, null, 2));

    await client.end();
}

main().catch(console.error);
