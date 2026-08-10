const { Client } = require('pg');

const isExecute = process.argv.includes('--execute');

function normalizePieces(str) {
    if (!str) return '';
    // Extract numbers, sort them so order/formatting doesn't matter (e.g. "31/32" vs "32-31")
    const nums = str.match(/\d+/g);
    if (!nums || nums.length === 0) return '';
    return nums.map(n => parseInt(n, 10)).sort((a, b) => a - b).join('-');
}

function normalizeTratamiento(str) {
    if (!str) return '';
    return str.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

async function main() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5433'),
        database: process.env.DB_NAME || 'curare',
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgrespg',
    });

    await client.connect();

    console.log('=== DEPURACIÓN DE SESIONES REPETIDAS DE UNA MISMA PIEZA/TRATAMIENTO ===');
    console.log(`Modo: ${isExecute ? 'EJECUCIÓN REAL (EXECUTE)' : 'SIMULACIÓN (DRY RUN)'}\n`);

    // Fetch all terminado rows from historia_clinica
    const hcRes = await client.query(`
        SELECT id, "pacienteId", "proformaId", "proformaDetalleId", fecha, tratamiento, pieza, cantidad, "estadoTratamiento"
        FROM historia_clinica
        WHERE LOWER("estadoTratamiento") = 'terminado'
          AND "proformaId" IS NOT NULL
        ORDER BY fecha DESC, id DESC;
    `);

    console.log(`Total de registros 'terminado' con proformaId en historia_clinica: ${hcRes.rows.length}`);

    // Group by proformaId + normalized tratamiento + normalized pieza
    const groups = new Map();

    for (const row of hcRes.rows) {
        const pId = row.proformaId;
        const pdId = row.proformaDetalleId || 0;
        const normTrat = normalizeTratamiento(row.tratamiento);
        const normPz = normalizePieces(row.pieza);

        // Key combines proformaId, pdId (or 0), normalized treatment name, and normalized piece numbers
        const key = `${pId}_${pdId}_${normTrat}_${normPz}`;

        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key).push(row);
    }

    let idsToDemote = [];

    for (const [key, rows] of groups.entries()) {
        if (rows.length > 1) {
            // Rows are already sorted by fecha DESC, id DESC
            // Keep 1st row (latest completion), demote older duplicate session rows
            const toDemote = rows.slice(1);
            toDemote.forEach(r => idsToDemote.push(r.id));
        }
    }

    console.log(`\nGrupos identificados con múltiples citas 'terminado' para la misma pieza/tratamiento: ${[...groups.values()].filter(arr => arr.length > 1).length}`);
    console.log(`Total de registros intermedios que cambiarán de 'terminado' a 'no terminado': ${idsToDemote.length}`);

    // Check impact on Patient 1129 Proforma #2 (ID 5422) and #4 (ID 6446)
    const p1129HC = await client.query(`
        SELECT hc.id, hc."proformaId", hc.fecha, hc.tratamiento, hc.pieza, hc.cantidad, hc."estadoTratamiento"
        FROM historia_clinica hc
        WHERE hc."pacienteId" = 1129 AND hc.id = ANY($1::int[])
        ORDER BY hc."proformaId", hc.fecha, hc.id;
    `, [idsToDemote]);

    console.log(`\n=== IMPACTO EN PACIENTE 1129 ===`);
    console.log(`Registros de sesiones intermedias de Paciente 1129 que cambiarán a 'no terminado': ${p1129HC.rows.length}`);
    console.table(p1129HC.rows.map(r => ({
        id: r.id,
        proformaId: r.proformaId,
        fecha: r.fecha.toISOString().split('T')[0],
        tratamiento: r.tratamiento,
        pieza: r.pieza,
        normPz: normalizePieces(r.pieza)
    })));

    // Simulation of financial stats for Patient 1129 Proforma #2 (ID 5422)
    const sim5422 = await client.query(`
        WITH pagos_sum AS (
            SELECT "proformaId", COALESCE(SUM(CAST(monto AS NUMERIC)), 0) AS total_pagado
            FROM pagos WHERE "proformaId" = 5422 GROUP BY "proformaId"
        ),
        realized_sum AS (
            SELECT hc."proformaId",
                COALESCE(SUM(
                    CASE 
                        WHEN pd.id IS NOT NULL AND CAST(pd.total AS NUMERIC) > 0 AND CAST(pd.cantidad AS NUMERIC) > 0 
                        THEN (CAST(pd.total AS NUMERIC) / CAST(pd.cantidad AS NUMERIC)) * CAST(COALESCE(hc.cantidad, 1) AS NUMERIC)
                        ELSE CAST(COALESCE(hc.precio, 0) AS NUMERIC)
                    END
                ), 0) AS realized_cost
            FROM historia_clinica hc
            LEFT JOIN proforma_detalle pd ON pd.id = hc."proformaDetalleId"
            WHERE hc."estadoTratamiento" = 'terminado' 
              AND hc."proformaId" = 5422
              AND NOT (hc.id = ANY($1::int[]))
            GROUP BY hc."proformaId"
        )
        SELECT p.id, p.numero, p.total AS proforma_total,
               COALESCE(ps.total_pagado, 0) AS total_pagado,
               COALESCE(rs.realized_cost, 0) AS total_ejecutado,
               (COALESCE(rs.realized_cost, 0) - COALESCE(ps.total_pagado, 0)) AS saldo
        FROM proformas p
        LEFT JOIN pagos_sum ps ON ps."proformaId" = p.id
        LEFT JOIN realized_sum rs ON rs."proformaId" = p.id
        WHERE p.id = 5422;
    `, [idsToDemote]);

    console.log('\n=== SIMULACIÓN FINANCIERA PRESUPUESTO #2 (5422) PACIENTE 1129 ===');
    console.table(sim5422.rows);

    if (isExecute && idsToDemote.length > 0) {
        console.log('\nEjecutando actualización en PostgreSQL...');
        await client.query('BEGIN');
        try {
            const updateRes = await client.query(`
                UPDATE historia_clinica
                SET "estadoTratamiento" = 'no terminado'
                WHERE id = ANY($1::int[]);
            `, [idsToDemote]);

            console.log(`\nÉXITO: Se actualizaron ${updateRes.rowCount} registros en historia_clinica de 'terminado' a 'no terminado'.`);
            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Error al actualizar, se hizo ROLLBACK:', err);
        }
    } else if (!isExecute) {
        console.log('\nPara ejecutar la actualización real en la BD, corre el script con --execute');
    }

    await client.end();
}

main().catch(console.error);
