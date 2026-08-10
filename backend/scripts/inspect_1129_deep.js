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

    console.log('=== PACIENTE 1129 PROFORMAS ===');
    const profs = await client.query(`
        SELECT id, numero, fecha, total 
        FROM proformas 
        WHERE "pacienteId" = 1129 
        ORDER BY numero;
    `);
    console.table(profs.rows);

    for (const p of profs.rows) {
        console.log(`\n========================================`);
        console.log(`PROFORMA ID ${p.id} (#${p.numero}), Fecha: ${p.fecha.toISOString().split('T')[0]}, Total: ${p.total}`);
        console.log(`----------------------------------------`);

        // Proforma Detalle
        const pd = await client.query(`
            SELECT pd.id, a.detalle AS tratamiento, pd.piezas, pd.cantidad, pd."precioUnitario", pd.total
            FROM proforma_detalle pd
            LEFT JOIN arancel a ON a.id = pd."arancelId"
            WHERE pd."proformaId" = $1
            ORDER BY pd.id;
        `, [p.id]);
        console.log('Proforma Detalle (Planteado):');
        console.table(pd.rows);

        // Historia Clinica
        const hc = await client.query(`
            SELECT id, fecha, tratamiento, pieza, cantidad, precio, "estadoTratamiento", "proformaDetalleId"
            FROM historia_clinica
            WHERE "proformaId" = $1
            ORDER BY "proformaDetalleId", tratamiento, pieza, fecha, id;
        `, [p.id]);
        console.log('\nHistoria Clinica (Ejecutado):');
        console.table(hc.rows);
    }

    await client.end();
}

main().catch(console.error);
