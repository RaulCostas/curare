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

    console.log('=== DETALLE PROFUNDIZADO: PACIENTE 1129 PROFORMA ID 5422 (#2) ===\n');

    const items = await client.query(`
        SELECT pd.id AS pd_id, a.detalle AS tratamiento, pd.piezas AS pd_piezas, pd.cantidad AS pd_cant, pd.total AS pd_total
        FROM proforma_detalle pd
        LEFT JOIN arancel a ON a.id = pd."arancelId"
        WHERE pd."proformaId" = 5422
        ORDER BY pd.id;
    `);

    for (const item of items.rows) {
        console.log(`\n--------------------------------------------------`);
        console.log(`[Item pd_id: ${item.pd_id}] "${item.tratamiento}" | Piezas: "${item.pd_piezas}" | Cant: ${item.pd_cant} | Total: ${item.pd_total}`);
        console.log(`--------------------------------------------------`);

        const hc = await client.query(`
            SELECT id, fecha, pieza, cantidad, precio, "estadoTratamiento"
            FROM historia_clinica
            WHERE "proformaDetalleId" = $1
            ORDER BY pieza, fecha, id;
        `, [item.pd_id]);

        console.table(hc.rows);
    }

    await client.end();
}

main().catch(console.error);
