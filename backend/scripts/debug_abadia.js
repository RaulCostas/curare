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
    console.log('Connected to DB\n');

    // 1. Find the patient
    const pacRes = await client.query(`
        SELECT id, paterno, materno, nombre, estado
        FROM pacientes
        WHERE LOWER(paterno) LIKE '%abadia%'
           OR LOWER(materno) LIKE '%anadon%'
           OR LOWER(nombre) LIKE '%fernando%'
        ORDER BY paterno, materno, nombre
    `);
    console.log('=== PACIENTE(S) ENCONTRADO(S) ===');
    console.table(pacRes.rows);

    if (pacRes.rows.length === 0) {
        console.log('No se encontró el paciente.');
        await client.end();
        return;
    }

    const pacienteId = pacRes.rows[0].id;
    console.log(`\nUsando pacienteId = ${pacienteId}\n`);

    // 2. All HC records for this patient
    const hcRes = await client.query(`
        SELECT 
            hc.id,
            hc.fecha,
            hc.tratamiento,
            hc."estadoPresupuesto",
            hc."estadoTratamiento",
            hc."proformaId",
            hc."doctorId"
        FROM historia_clinica hc
        WHERE hc."pacienteId" = $1
        ORDER BY hc.fecha DESC
        LIMIT 30
    `, [pacienteId]);
    console.log('=== HISTORIA CLÍNICA (últimos 30 registros) ===');
    console.table(hcRes.rows);

    // 3. HC records with estadoPresupuesto='no terminado'
    const pendRes = await client.query(`
        SELECT 
            hc.id,
            hc.fecha,
            hc.tratamiento,
            hc."estadoPresupuesto",
            hc."estadoTratamiento"
        FROM historia_clinica hc
        WHERE hc."pacienteId" = $1
          AND hc."estadoPresupuesto" = 'no terminado'
        ORDER BY hc.fecha DESC
    `, [pacienteId]);
    console.log('\n=== HC con estadoPresupuesto = "no terminado" ===');
    console.table(pendRes.rows);

    // 4. HC records with BOTH conditions (new filter)
    const filtRes = await client.query(`
        SELECT 
            hc.id,
            hc.fecha,
            hc.tratamiento,
            hc."estadoPresupuesto",
            hc."estadoTratamiento"
        FROM historia_clinica hc
        WHERE hc."pacienteId" = $1
          AND hc."estadoPresupuesto" = 'no terminado'
          AND (hc."estadoTratamiento" IS NULL OR LOWER(hc."estadoTratamiento") != 'terminado')
        ORDER BY hc.fecha DESC
    `, [pacienteId]);
    console.log('\n=== HC con filtro NUEVO (presupuesto no terminado AND tratamiento no terminado) ===');
    console.table(filtRes.rows);
    console.log(`Total registros que hacen que aparezca: ${filtRes.rows.length}`);

    // 5. Distinct values of estadoTratamiento for this patient
    const distinctRes = await client.query(`
        SELECT 
            hc."estadoPresupuesto",
            hc."estadoTratamiento",
            COUNT(*) as total
        FROM historia_clinica hc
        WHERE hc."pacienteId" = $1
        GROUP BY hc."estadoPresupuesto", hc."estadoTratamiento"
        ORDER BY hc."estadoPresupuesto", hc."estadoTratamiento"
    `, [pacienteId]);
    console.log('\n=== RESUMEN: combinaciones de estados ===');
    console.table(distinctRes.rows);

    await client.end();
    console.log('\nDone.');
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
