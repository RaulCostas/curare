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

    console.log("=== PAGOS PACIENTE 94 (PROFORMA ID 4602 - PROFORMA #3) ===");
    const pagos = await client.query(`
        SELECT * FROM pagos WHERE "pacienteId" = 94 AND "proformaId" = 4602 ORDER BY fecha
    `);
    console.table(pagos.rows);

    const totalPagado = pagos.rows.reduce((acc, p) => acc + parseFloat(p.monto), 0);
    console.log(`\nTOTAL PAGADO PARA PROFORMA #3: Bs. ${totalPagado}`);

    console.log("\n=== HISTORIA CLINICA PARA PROFORMA #3 CON ESTADO REALIZADO Y PRECIOS ===");
    const hc = await client.query(`
        SELECT id, fecha, pieza, tratamiento, precio, cantidad, "estadoTratamiento", "estadoPresupuesto", access_id
        FROM historia_clinica
        WHERE "pacienteId" = 94 AND "proformaId" = 4602
        ORDER BY id
    `);
    console.table(hc.rows);

    await client.end();
}

main().catch(console.error);
