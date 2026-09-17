const { Client } = require('pg');

async function migrate() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USER || process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgrespg',
        database: process.env.DB_NAME || 'curare',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    });

    try {
        await client.connect();
        console.log('Conectado a la base de datos PostgreSQL');

        console.log('1. Agregando columna arancelId...');
        await client.query(`
            ALTER TABLE "historia_clinica" 
            ADD COLUMN IF NOT EXISTS "arancelId" INTEGER REFERENCES "arancel"("id") ON DELETE SET NULL;
        `);

        console.log('2. Creando índice en arancelId...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS "IDX_historia_clinica_arancelId" 
            ON "historia_clinica"("arancelId");
        `);

        console.log('3. Sincronizando arancelId desde proforma_detalle...');
        const res = await client.query(`
            UPDATE "historia_clinica" hc
            SET "arancelId" = pd."arancelId"
            FROM "proforma_detalle" pd
            WHERE hc."proformaDetalleId" = pd."id"
              AND hc."arancelId" IS NULL
              AND pd."arancelId" IS NOT NULL;
        `);
        console.log(`Registros actualizados: ${res.rowCount}`);

        console.log('Migración completada exitosamente.');
    } catch (err) {
        console.error('Error durante la migración:', err);
    } finally {
        await client.end();
    }
}

migrate();
