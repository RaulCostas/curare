const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5433,
    user: 'postgres',
    password: 'postgrespg',
    database: 'curare',
});

async function applyFix() {
    try {
        await client.connect();

        console.log('Updating historia_clinica ID 1 to price 225.00...');
        const res = await client.query(`UPDATE historia_clinica SET precio = 225.00 WHERE id = 1`);
        console.log('Update result:', res.rowCount);

        const check = await client.query(`SELECT id, tratamiento, precio FROM historia_clinica WHERE id = 1`);
        console.log('New Record State:', check.rows[0]);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

applyFix();
