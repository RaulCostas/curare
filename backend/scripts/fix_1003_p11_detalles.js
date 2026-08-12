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

    console.log("=== CORRIGIENDO PROFORMADETALLEID PARA PACIENTE 1003 PROFORMA 11 ===");

    await client.query('BEGIN');

    try {
        // HC 61509: 'MUÑON SOBRE IMPLANTE' -> proformaDetalleId 33040
        const r1 = await client.query(`
            UPDATE historia_clinica
            SET "proformaDetalleId" = 33040
            WHERE id = 61509 AND "pacienteId" = 1003;
        `);
        console.log(`HC 61509 actualizada a proformaDetalleId = 33040 (${r1.rowCount} fila).`);

        // HC 62010: 'CORONA PORCELANA PURA' -> proformaDetalleId 33041
        const r2 = await client.query(`
            UPDATE historia_clinica
            SET "proformaDetalleId" = 33041
            WHERE id = 62010 AND "pacienteId" = 1003;
        `);
        console.log(`HC 62010 actualizada a proformaDetalleId = 33041 (${r2.rowCount} fila).`);

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
