require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    user: process.env.DB_USERNAME,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

client.connect()
    .then(() => {
        return client.query('SELECT p.id, p."firmaFC", p."categoriaId" FROM pacientes p LIMIT 1;');
    })
    .then(res => {
        console.log('Pacientes query successful:', res.rowCount);
        return client.query('SELECT id FROM firmas_digitales LIMIT 1;');
    })
    .then(res => {
        console.log('Firmas query successful:', res.rowCount);
        client.end();
    })
    .catch(err => {
        console.error('Query failed:', err.message);
        client.end();
    });
