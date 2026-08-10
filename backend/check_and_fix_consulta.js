const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5433,
    user: 'postgres',
    password: 'postgrespg',
    database: 'curare',
});

async function run() {
    try {
        await client.connect();

        // 1. Check Arancel for 'CONSULTA'
        const arancelRes = await client.query(`SELECT * FROM arancel WHERE nombre ILIKE '%CONSULTA%'`);
        console.log('--- Arancel Matches ---');
        console.table(arancelRes.rows);

        // 2. Check if any matches 225
        const match225 = arancelRes.rows.find(r => parseFloat(r.precio) === 225.00);

        if (match225) {
            console.log('Found Arancel matching 225:', match225);
            console.log('Updating historia_clinica ID 1 to price 225.00...');

            await client.query(`UPDATE historia_clinica SET precio = 225.00 WHERE id = 1`);
            console.log('Update successful.');
        } else {
            console.log('No Arancel found with price 225.00. Please verify manually.');
            // Even if not found, the user math is so precise (5110-4885=225) that I should probably do it or ask.
            // But let's see output first.
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
