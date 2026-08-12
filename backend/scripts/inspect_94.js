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

    console.log("=== PROFORMAS PACIENTE 94 ===");
    const profs = await client.query(`SELECT * FROM proformas WHERE "pacienteId" = 94 ORDER BY numero, id`);
    console.table(profs.rows);

    for (const p of profs.rows) {
        console.log(`\n=== PROFORMA_DETALLE (Proforma ID ${p.id}, Numero ${p.numero}, Total ${p.total}) ===`);
        const pd = await client.query(`
            SELECT pd.*, a.detalle as arancel_nombre
            FROM proforma_detalle pd
            LEFT JOIN arancel a ON pd."arancelId" = a.id
            WHERE pd."proformaId" = $1 ORDER BY pd.id
        `, [p.id]);
        console.table(pd.rows);

        console.log(`\n=== HISTORIA CLINICA (Proforma ID ${p.id}) ===`);
        const hc = await client.query(`
            SELECT id, fecha, pieza, tratamiento, precio, cantidad, "estadoTratamiento", "estadoPresupuesto", "proformaDetalleId"
            FROM historia_clinica
            WHERE "pacienteId" = 94 AND "proformaId" = $1
            ORDER BY id
        `, [p.id]);
        console.table(hc.rows);
    }

    console.log("\n=== HISTORIA CLINICA (SIN PROFORMA O CON OTRO PROFORMAID) ===");
    const hcOther = await client.query(`
        SELECT id, "proformaId", fecha, pieza, tratamiento, precio, cantidad, "estadoTratamiento", "estadoPresupuesto", "proformaDetalleId"
        FROM historia_clinica
        WHERE "pacienteId" = 94 AND "proformaId" NOT IN (SELECT id FROM proformas WHERE "pacienteId" = 94)
        ORDER BY id
    `);
    console.table(hcOther.rows);

    await client.end();
}

main().catch(console.error);
