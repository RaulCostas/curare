const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { prepareMigration, MISSING_ARANCELES } = require('./migration_propuestas_runner');

async function generateSql() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5433', 10),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgrespg',
        database: process.env.DB_NAME || 'curare',
    });

    await client.connect();
    console.log('Generando SQL de migración para producción...');

    const { accessProposalsByPatient } = await prepareMigration(client);

    const outPath = path.resolve(__dirname, 'migration_propuestas_produccion.sql');
    const stream = fs.createWriteStream(outPath, { encoding: 'utf8' });

    stream.write(`-- ==========================================================================\n`);
    stream.write(`-- MIGRACIÓN DE PROPUESTAS DESDE ACCESS A POSTGRESQL (PRODUCCIÓN)\n`);
    stream.write(`-- Tabla origen: Propu_Detalle (curare.mdb)\n`);
    stream.write(`-- Tablas destino: propuestas, propuesta_detalle\n`);
    stream.write(`-- Fecha de generación: ${new Date().toISOString()}\n`);
    stream.write(`-- ==========================================================================\n\n`);
    stream.write(`BEGIN;\n\n`);

    // 1. Missing aranceles
    stream.write(`-- 1. Insertar aranceles faltantes si no existen en arancel\n`);
    for (const a of MISSING_ARANCELES) {
        stream.write(`INSERT INTO arancel (codigo, detalle, precio1, precio2, tc, estado, "idEspecialidad", "createdAt", "updatedAt")\n`);
        stream.write(`SELECT '${a.codigo}', '${a.detalle.replace(/'/g, "''")}', ${a.precio1}, ${a.precio2}, 1.0, 'activo', ${a.idEspecialidad}, NOW(), NOW()\n`);
        stream.write(`WHERE NOT EXISTS (SELECT 1 FROM arancel WHERE codigo = '${a.codigo}');\n`);
    }
    stream.write(`\n`);

    // Sincronizar secuencias para evitar cualquier colisión de IDs existentes
    stream.write(`-- Sincronizar secuencias antes de insertar para que inicien por encima del MAX(id) actual\n`);
    stream.write(`SELECT setval('propuestas_id_seq', (SELECT COALESCE(MAX(id), 1) FROM propuestas));\n`);
    stream.write(`SELECT setval('propuesta_detalle_id_seq', (SELECT COALESCE(MAX(id), 1) FROM propuesta_detalle));\n\n`);

    // 2. Insert headers & details using PL/pgSQL DO block
    stream.write(`-- 2. Insertar cabeceras y detalles de propuestas desde Access\n`);
    stream.write(`DO $$\nDECLARE\n    v_id INT;\nBEGIN\n`);

    let totalHeaders = 0;
    let totalDetails = 0;

    for (const [pid, propsList] of accessProposalsByPatient.entries()) {
        // Sort proposals for this patient by fecha ASC, originalNum ASC
        propsList.sort((a, b) => {
            if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
            const numA = parseInt(a.originalNum, 10) || 0;
            const numB = parseInt(b.originalNum, 10) || 0;
            return numA - numB;
        });

        for (const prop of propsList) {
            totalHeaders++;
            const notaEscaped = prop.nota ? `'${prop.nota.replace(/'/g, "''")}'` : 'NULL';
            
            stream.write(`\n    -- Paciente ${prop.pacienteId} | Fecha: ${prop.fecha} | Total: ${prop.total.toFixed(2)}\n`);
            stream.write(`    INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")\n`);
            stream.write(`    VALUES (${prop.pacienteId}, 1, '${prop.fecha}', ${prop.total.toFixed(2)}, ${notaEscaped}, ${prop.usuarioId})\n`);
            stream.write(`    RETURNING id INTO v_id;\n\n`);

            for (const d of prop.detalles) {
                totalDetails++;
                const letraEscaped = d.letra ? `'${d.letra.replace(/'/g, "''")}'` : 'NULL';
                const piezasEscaped = d.piezas ? `'${d.piezas.replace(/'/g, "''")}'` : 'NULL';
                const posibleStr = d.posible ? 'true' : 'false';

                stream.write(`    INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)\n`);
                stream.write(`    VALUES (v_id, ${letraEscaped}, ${d.arancelId}, ${d.precioUnitario.toFixed(2)}, ${d.tc.toFixed(2)}, ${piezasEscaped}, ${d.cantidad}, ${d.subTotal.toFixed(2)}, ${d.descuento.toFixed(2)}, ${d.total.toFixed(2)}, ${posibleStr});\n`);
            }
        }
    }

    stream.write(`\nEND $$;\n\n`);

    // 3. Reordenar correlativamente todas las propuestas (incluyendo las de producción)
    stream.write(`-- 3. Reordenar correlativamente todas las propuestas por paciente según su fecha\n`);
    stream.write(`--    (si el paciente tenía propuestas en Access y ya tiene en producción, las de producción se recorren al final)\n`);
    stream.write(`WITH numbered AS (\n`);
    stream.write(`    SELECT id, ROW_NUMBER() OVER (PARTITION BY "pacienteId" ORDER BY fecha ASC, id ASC) as new_numero\n`);
    stream.write(`    FROM propuestas\n`);
    stream.write(`)\n`);
    stream.write(`UPDATE propuestas p\n`);
    stream.write(`SET numero = n.new_numero\n`);
    stream.write(`FROM numbered n\n`);
    stream.write(`WHERE p.id = n.id AND p.numero != n.new_numero;\n\n`);

    // 4. Update sequences
    stream.write(`-- 4. Sincronizar secuencias de IDs\n`);
    stream.write(`SELECT setval('propuestas_id_seq', (SELECT COALESCE(MAX(id), 1) FROM propuestas));\n`);
    stream.write(`SELECT setval('propuesta_detalle_id_seq', (SELECT COALESCE(MAX(id), 1) FROM propuesta_detalle));\n\n`);

    stream.write(`COMMIT;\n`);
    stream.end();

    console.log(`Archivo SQL generado exitosamente: ${outPath}`);
    console.log(`Total propuestas escritas: ${totalHeaders}`);
    console.log(`Total detalles escritos: ${totalDetails}`);

    await client.end();
}

generateSql().catch(console.error);
