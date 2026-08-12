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

    console.log("=== AJUSTANDO ESTADO DE TRATAMIENTOS PACIENTE 94 PROFORMA #3 (ID 4602) ===");

    await client.query('BEGIN');

    try {
        // Los IDs que deben permanecer como 'terminado' para que sume Bs 11,156.25:
        // 6948, 6950, 6957, 6969, 9164, 16892
        const finishedIds = [6948, 6950, 6957, 6969, 9164, 16892];

        // Cambiar a 'no terminado' los demas tratamientos de la proforma 4602 que no corresponden
        const res = await client.query(`
            UPDATE historia_clinica
            SET "estadoTratamiento" = 'no terminado'
            WHERE "pacienteId" = 94 AND "proformaId" = 4602 AND id NOT IN (${finishedIds.join(',')});
        `);
        console.log(`Se actualizaron ${res.rowCount} filas de historia_clinica a 'no terminado'.`);

        // Asegurar que los 6 items terminados tengan estadoTratamiento = 'terminado'
        const res2 = await client.query(`
            UPDATE historia_clinica
            SET "estadoTratamiento" = 'terminado'
            WHERE "pacienteId" = 94 AND "proformaId" = 4602 AND id IN (${finishedIds.join(',')});
        `);
        console.log(`Se confirmaron ${res2.rowCount} filas de historia_clinica como 'terminado'.`);

        await client.query('COMMIT');
        console.log("=== ACTUALIZACIÓN COMPLETADA CON ÉXITO ===");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Error al actualizar:", e);
    } finally {
        await client.end();
    }
}

main().catch(console.error);
