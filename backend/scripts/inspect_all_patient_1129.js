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

    console.log('=== ALL PROFORMAS FOR PATIENT 1129 ===');
    const profs = await client.query(`SELECT id, numero, fecha, total FROM proformas WHERE "pacienteId" = 1129 ORDER BY numero, fecha;`);
    console.table(profs.rows);

    console.log('\n=== ALL HISTORIA CLINICA FOR PATIENT 1129 ===');
    const hc = await client.query(`
        SELECT id, fecha, tratamiento, pieza, cantidad, precio, "estadoTratamiento", "estadoPresupuesto", "proformaId", "proformaDetalleId"
        FROM historia_clinica
        WHERE "pacienteId" = 1129
        ORDER BY "proformaId", tratamiento, pieza, fecha;
    `);
    console.table(hc.rows);

    await client.end();
}

main().catch(console.error);
