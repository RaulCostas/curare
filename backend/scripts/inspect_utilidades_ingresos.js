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

    console.log('=== INSPECTING PAGOS IN POSTGRES BY YEAR AND CURRENCY ===\n');

    const yearsRes = await client.query(`
        SELECT EXTRACT(YEAR FROM fecha::date) AS yr, count(*) 
        FROM pagos 
        GROUP BY yr 
        ORDER BY yr DESC;
    `);

    console.log('Pagos count by Year:');
    console.table(yearsRes.rows);

    // Inspect year 2023 or 2024 sample
    const sampleYear = yearsRes.rows[0]?.yr || 2024;
    console.log(`\nSample Pagos for Year ${sampleYear}:`);

    const sample = await client.query(`
        SELECT id, "pacienteId", fecha, monto, moneda, tc, monto_comision
        FROM pagos
        WHERE EXTRACT(YEAR FROM fecha::date) = $1
        LIMIT 15;
    `, [sampleYear]);

    console.table(sample.rows);

    await client.end();
}

main().catch(console.error);
