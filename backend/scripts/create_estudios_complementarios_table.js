const { Client } = require('pg');

async function createTable() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5433', 10),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgrespg',
        database: process.env.DB_NAME || 'curare'
    });

    await client.connect();
    console.log('Connected to PostgreSQL');

    const sql = `
        CREATE TABLE IF NOT EXISTS "estudios_complementarios" (
            "id" SERIAL PRIMARY KEY,
            "pacienteId" INTEGER NOT NULL REFERENCES "pacientes"("id") ON DELETE CASCADE,
            "fecha" DATE NOT NULL,
            "tipo_estudio" VARCHAR(255) NOT NULL,
            "observaciones" TEXT,
            "orden_estudio_url" VARCHAR(500),
            "archivo_url" VARCHAR(500),
            "usuarioId" INTEGER REFERENCES "user"("id") ON DELETE SET NULL,
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `;

    await client.query(sql);
    console.log('Table "estudios_complementarios" created or already exists.');

    const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'estudios_complementarios'
        ORDER BY ordinal_position;
    `);
    console.log('Columns in estudios_complementarios:', res.rows);

    await client.end();
}

createTable().catch(err => {
    console.error('Error creating table:', err);
    process.exit(1);
});
