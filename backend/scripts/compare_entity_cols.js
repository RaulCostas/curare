const { Client } = require('pg');

async function test() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5433', 10),
        database: process.env.DB_NAME || 'curare',
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgrespg',
    });

    await client.connect();
    
    const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'historia_clinica';
    `);
    
    const actualCols = new Set(res.rows.map(r => r.column_name));
    
    const entityCols = [
        'id',
        'access_id',
        'access_plan_pagos_id',
        'access_trabajos_doctores_id',
        'pacienteId',
        'fecha',
        'pieza',
        'cantidad',
        'arancelId',
        'proformaDetalleId',
        'observaciones',
        'especialidadId',
        'doctorId',
        'personalId',
        'hoja',
        'estadoTratamiento',
        'estadoPresupuesto',
        'proformaId',
        'tratamiento',
        'Resaltar',
        'Caso_Clinico',
        'control',
        'pagado',
        'precio',
        'firmaPaciente',
        'createdAt',
        'updatedAt'
    ];

    console.log('--- MISSING IN DB ---');
    for (const col of entityCols) {
        if (!actualCols.has(col)) {
            console.log('Missing column:', col);
        }
    }

    console.log('\n--- EXTRA IN DB ---');
    for (const col of actualCols) {
        if (!entityCols.includes(col)) {
            console.log('Extra column in DB:', col);
        }
    }

    await client.end();
}

test().catch(console.error);
