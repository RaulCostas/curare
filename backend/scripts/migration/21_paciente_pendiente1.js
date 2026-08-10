const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const mdbReaderModule = require('mdb-reader');
const MDBReader = mdbReaderModule.default || mdbReaderModule;

const MDB_PATH = 'D:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb';

async function migratePacientePendiente1() {
    console.log('=== INICIANDO MIGRACIÓN DE TRASPASADOS Y DEUDAS OBSERVADAS ===\n');

    if (!fs.existsSync(MDB_PATH)) {
        throw new Error(`No se encontró el archivo MDB en: ${MDB_PATH}`);
    }

    // 1. Connect to PostgreSQL DB
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5433', 10),
        database: process.env.DB_NAME || 'curare',
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgrespg',
    });

    await client.connect();
    console.log('Conectado a PostgreSQL.\n');

    // 2. Ensure columns exist on proformas table
    await client.query(`
        ALTER TABLE proformas 
        ADD COLUMN IF NOT EXISTS traspasado BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS traspaso_observacion TEXT,
        ADD COLUMN IF NOT EXISTS deuda_observada BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS deuda_observada_observacion TEXT;
    `);
    console.log('Columnas verificadas/creadas en tabla proformas.\n');

    // 3. Read Access MDB
    const buffer = fs.readFileSync(MDB_PATH);
    const reader = new MDBReader(buffer);

    let updatedProformasCount = 0;
    let traspasadosCount = 0;
    let observadosCount = 0;

    // A. Read Paciente_Pendiente1
    if (reader.getTableNames().includes('Paciente_Pendiente1')) {
        const table1 = reader.getTable('Paciente_Pendiente1');
        const data1 = table1.getData();
        console.log(`Leídos ${data1.length} registros de la tabla Paciente_Pendiente1 de Access.`);

        for (const row of data1) {
            const isTraspasado = (row.Traspasado || '').trim().toUpperCase() === 'SI';
            const isDeudaObs = (row.Deuda_Observada || '').trim().toUpperCase() === 'SI';
            const obsTraspaso = (row.Observaciones || '').trim();
            const obsDeuda = (row.Observaciones1 || '').trim();

            if (!isTraspasado && !isDeudaObs && !obsTraspaso && !obsDeuda) {
                continue;
            }

            const rawId = (row.Id || '').trim();
            const pacIdNum = parseInt(rawId.replace(/[^0-9]/g, ''), 10);
            const presNum = parseInt((row.Presupuesto || '').trim(), 10);

            if (!pacIdNum || isNaN(presNum)) {
                continue;
            }

            // Find matching proforma
            const findRes = await client.query(`
                SELECT id, traspasado, deuda_observada 
                FROM proformas 
                WHERE "pacienteId" = $1 AND numero = $2;
            `, [pacIdNum, presNum]);

            if (findRes.rows.length > 0) {
                const pId = findRes.rows[0].id;
                await client.query(`
                    UPDATE proformas
                    SET traspasado = COALESCE($1, traspasado),
                        traspaso_observacion = CASE WHEN $2 != '' THEN $2 ELSE traspaso_observacion END,
                        deuda_observada = COALESCE($3, deuda_observada),
                        deuda_observada_observacion = CASE WHEN $4 != '' THEN $4 ELSE deuda_observada_observacion END
                    WHERE id = $5;
                `, [isTraspasado, obsTraspaso, isDeudaObs, obsDeuda, pId]);

                updatedProformasCount++;
                if (isTraspasado) traspasadosCount++;
                if (isDeudaObs) observadosCount++;
            }
        }
    }

    // B. Read Paciente_Pendiente (Access table) for extra records
    if (reader.getTableNames().includes('Paciente_Pendiente')) {
        const table = reader.getTable('Paciente_Pendiente');
        const data = table.getData();
        console.log(`Leídos ${data.length} registros de la tabla Paciente_Pendiente de Access.`);

        for (const row of data) {
            const isTraspasado = (row.Traspasado || '').trim().toUpperCase() === 'SI';
            const obsTraspaso = (row.Observaciones || '').trim();

            if (!isTraspasado && !obsTraspaso) {
                continue;
            }

            const rawId = (row.Id || '').trim();
            const pacIdNum = parseInt(rawId.replace(/[^0-9]/g, ''), 10);

            if (!pacIdNum) continue;

            const findRes = await client.query(`
                SELECT id 
                FROM proformas 
                WHERE "pacienteId" = $1 
                ORDER BY fecha DESC, id DESC LIMIT 1;
            `, [pacIdNum]);

            if (findRes.rows.length > 0) {
                const pId = findRes.rows[0].id;
                await client.query(`
                    UPDATE proformas
                    SET traspasado = true,
                        traspaso_observacion = CASE WHEN $1 != '' THEN $1 ELSE traspaso_observacion END
                    WHERE id = $2;
                `, [obsTraspaso, pId]);
            }
        }
    }

    console.log('\n=== MIGRACIÓN FINALIZADA CON ÉXITO ===');
    console.log(`Proformas actualizadas con observaciones de deuda/traspaso: ${updatedProformasCount}`);
    console.log(`Total proformas marcadas como Traspasadas: ${traspasadosCount}`);
    console.log(`Total proformas marcadas como Deuda Observada: ${observadosCount}`);

    await client.end();
}

migratePacientePendiente1().catch(err => {
    console.error('Error durante la migración standalone:', err);
    process.exit(1);
});
