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

    console.log('=== SEARCHING FOR DUPLICATE "TERMINADO" EXECUTIONS DB-WIDE ===\n');

    // 1. Group by proformaDetalleId where count of 'terminado' > 1
    const byDetalle = await client.query(`
        SELECT "proformaDetalleId", "proformaId", "pacienteId", tratamiento, pieza, COUNT(*) as finished_count
        FROM historia_clinica
        WHERE "proformaDetalleId" IS NOT NULL 
          AND LOWER("estadoTratamiento") = 'terminado'
        GROUP BY "proformaDetalleId", "proformaId", "pacienteId", tratamiento, pieza
        HAVING COUNT(*) > 1
        ORDER BY finished_count DESC;
    `);

    console.log(`Grouped by proformaDetalleId: Found ${byDetalle.rows.length} items with multiple 'terminado' records.`);
    console.table(byDetalle.rows.slice(0, 15));

    // 2. Group by (proformaId, tratamiento, pieza) where proformaDetalleId IS NULL and count of 'terminado' > 1
    const byProformaAndTrat = await client.query(`
        SELECT "proformaId", "pacienteId", tratamiento, pieza, COUNT(*) as finished_count
        FROM historia_clinica
        WHERE "proformaId" IS NOT NULL 
          AND "proformaDetalleId" IS NULL
          AND LOWER("estadoTratamiento") = 'terminado'
          AND TRIM(COALESCE(tratamiento, '')) != ''
        GROUP BY "proformaId", "pacienteId", tratamiento, pieza
        HAVING COUNT(*) > 1
        ORDER BY finished_count DESC;
    `);

    console.log(`\nGrouped by (proformaId, tratamiento, pieza) [without proformaDetalleId]: Found ${byProformaAndTrat.rows.length} items with multiple 'terminado' records.`);
    console.table(byProformaAndTrat.rows.slice(0, 15));

    await client.end();
}

main().catch(console.error);
