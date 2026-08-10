
import { Client } from 'pg';

async function updateColors() {
    const client = new Client({
        host: 'localhost',
        port: 5433,
        user: 'postgres',
        password: 'postgrespg',
        database: 'curare',
    });

    try {
        await client.connect();
        console.log('Connected to database');

        const query = `
      UPDATE categoria_paciente 
      SET color = '#87CEEB' 
      WHERE color = '#000000';
    `;

        const res = await client.query(query);
        console.log(`Updated ${res.rowCount} categories from Black to Celeste.`);

    } catch (err) {
        console.error('Error executing query', err);
    } finally {
        await client.end();
        console.log('Disconnected from database');
    }
}

updateColors();
