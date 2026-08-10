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

    console.log('=== INSPECTING PATIENT 1129 PROFORMA #4 ===\n');

    // Find proforma for patient 1129 with number 4
    const profRes = await client.query(`
        SELECT id, "pacienteId", numero, total
        FROM proformas
        WHERE "pacienteId" = 1129 AND numero = 4;
    `);

    console.log('Proforma:', profRes.rows);

    if (profRes.rows.length === 0) {
        console.log('Proforma not found');
        await client.end();
        return;
    }

    const proformaId = profRes.rows[0].id;

    // Fetch all HC records for this proforma
    const hcRes = await client.query(`
        SELECT id, fecha, tratamiento, pieza, cantidad, precio, "estadoTratamiento", "estadoPresupuesto", "proformaDetalleId"
        FROM historia_clinica
        WHERE "proformaId" = $1
        ORDER BY tratamiento, pieza, fecha;
    `, [proformaId]);

    console.log(`\nHistoria clinica entries for proformaId = ${proformaId}: (${hcRes.rows.length} rows)`);
    console.table(hcRes.rows);

    await client.end();
}

main().catch(console.error);
