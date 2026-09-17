const { Client } = require('pg');

async function migrate() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5433', 10),
        database: process.env.DB_NAME || 'curare',
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgrespg',
    });

    try {
        await client.connect();
        console.log('Conectado a PostgreSQL');

        console.log('1. Agregando columna especialidadId...');
        await client.query(`
            ALTER TABLE "historia_clinica" 
            ADD COLUMN IF NOT EXISTS "especialidadId" INTEGER REFERENCES "especialidad"("id") ON DELETE SET NULL;
        `);

        console.log('2. Creando índice...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS "IDX_historia_clinica_especialidadId" 
            ON "historia_clinica"("especialidadId");
        `);

        console.log('3. Sincronizando especialidadId desde arancel...');
        const res = await client.query(`
            UPDATE "historia_clinica" hc
            SET "especialidadId" = a."idEspecialidad"
            FROM "arancel" a
            WHERE hc."arancelId" = a."id"
              AND hc."especialidadId" IS NULL
              AND a."idEspecialidad" IS NOT NULL;
        `);
        console.log(`Registros actualizados con especialidadId: ${res.rowCount}`);

        console.log('Migración completada con éxito.');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
}

migrate();
