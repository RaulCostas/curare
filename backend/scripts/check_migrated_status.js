const { Client } = require('pg');

async function main() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5433', 10),
        database: process.env.DB_NAME || 'curare',
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgrespg',
    });

    await client.connect();

    // Check count of active deudores in 'pasivos' and 'activos'
    const totalDeudoresAll = await client.query(`
        SELECT COUNT(*) FROM proformas WHERE traspasado = true OR deuda_observada = true;
    `);

    console.log(`Total proformas marcadas como Traspasadas o Deuda Observada en PG: ${totalDeudoresAll.rows[0].count}`);

    await client.end();
}

main();
