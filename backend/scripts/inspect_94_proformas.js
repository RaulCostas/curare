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

    console.log("=== ALL PROFORMAS PACIENTE 94 ===");
    const profs = await client.query(`SELECT id, numero, fecha, total, aprobado FROM proformas WHERE "pacienteId" = 94 ORDER BY numero, id`);
    console.table(profs.rows);

    for (const p of profs.rows) {
        const hc = await client.query(`
            SELECT id, fecha, pieza, tratamiento, precio, cantidad, "estadoTratamiento", "proformaDetalleId"
            FROM historia_clinica
            WHERE "pacienteId" = 94 AND "proformaId" = $1
            ORDER BY id
        `, [p.id]);
        const pd = await client.query(`
            SELECT pd.id, pd."arancelId", pd."precioUnitario", pd.descuento, pd.total, a.detalle as arancel_nombre
            FROM proforma_detalle pd
            LEFT JOIN arancel a ON pd."arancelId" = a.id
            WHERE pd."proformaId" = $1
            ORDER BY pd.id
        `, [p.id]);

        console.log(`\n--- PROFORMA ID ${p.id} (Numero ${p.numero}, Total ${p.total}) ---`);
        console.log("Detalles:");
        console.table(pd.rows);
        console.log("Historia Clinica:");
        console.table(hc.rows);
    }

    await client.end();
}

main().catch(console.error);
