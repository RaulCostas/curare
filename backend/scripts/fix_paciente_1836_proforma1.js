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

    try {
        await client.query('BEGIN');

        console.log("=== INICIANDO RECONCILIACIÓN PACIENTE 1836 ===");

        // 1. Reasignar historia_clinica de proforma 7782 a 3276 y vincular proformaDetalleId
        console.log("Actualizando historia_clinica...");
        const hc1 = await client.query(`
            UPDATE historia_clinica
            SET "proformaId" = 3276, "proformaDetalleId" = 15189
            WHERE id = 30827 AND "pacienteId" = 1836;
        `);
        console.log(`HC 30827 actualizada: ${hc1.rowCount} fila(s).`);

        const hc2 = await client.query(`
            UPDATE historia_clinica
            SET "proformaId" = 3276, "proformaDetalleId" = 15190
            WHERE id IN (30828, 30960, 31057) AND "pacienteId" = 1836;
        `);
        console.log(`HC (30828, 30960, 31057) actualizadas: ${hc2.rowCount} fila(s).`);

        // 2. Reasignar pagos de proforma 7782 a 3276
        console.log("Actualizando pagos...");
        const pRes = await client.query(`
            UPDATE pagos
            SET "proformaId" = 3276
            WHERE "proformaId" = 7782 AND "pacienteId" = 1836;
        `);
        console.log(`Pagos actualizados: ${pRes.rowCount} fila(s).`);

        // 3. Reasignar proxima_cita de proforma 7782 a 3276
        console.log("Actualizando proxima_cita...");
        const pcRes = await client.query(`
            UPDATE proxima_cita
            SET proforma_id = 3276
            WHERE proforma_id = 7782 AND paciente_id = 1836;
        `);
        console.log(`Proxima cita actualizadas: ${pcRes.rowCount} fila(s).`);

        // Vincular proforma_detalle_id en proxima_cita donde observaciones sea LIMPIEZA
        await client.query(`
            UPDATE proxima_cita
            SET proforma_detalle_id = 15190
            WHERE id = 9402 AND paciente_id = 1836;
        `);

        // 4. Reasignar secuencia_tratamiento de proforma 7782 a 3276
        console.log("Actualizando secuencia_tratamiento...");
        const stRes = await client.query(`
            UPDATE secuencia_tratamiento
            SET "proformaId" = 3276
            WHERE "proformaId" = 7782 AND "pacienteId" = 1836;
        `);
        console.log(`Secuencia tratamiento actualizada: ${stRes.rowCount} fila(s).`);

        // 5. Eliminar proforma duplicada fantasma 7782
        console.log("Eliminando proforma fantasma 7782...");
        const delRes = await client.query(`
            DELETE FROM proformas
            WHERE id = 7782 AND "pacienteId" = 1836;
        `);
        console.log(`Proforma 7782 eliminada: ${delRes.rowCount} fila(s).`);

        await client.query('COMMIT');
        console.log("=== RECONCILIACIÓN COMPLETADA EXITOSAMENTE ===");

    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Error durante la reconciliación, transacción revertida:", e);
    } finally {
        await client.end();
    }
}

main();
