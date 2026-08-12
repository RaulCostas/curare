const { Client } = require('pg');

const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433'),
    database: process.env.DB_NAME || 'curare',
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgrespg',
});

async function main() {
    await client.connect();

    console.log("=== PROFORMA #11 PACIENTE 1003 ===");
    const profs = await client.query(`SELECT * FROM proformas WHERE "pacienteId" = 1003 AND numero = 11`);
    console.log("Proforma row:", profs.rows);

    if (profs.rows.length > 0) {
        const pId = profs.rows[0].id;

        console.log("\n=== PROFORMA_DETALLE ===");
        const pd = await client.query(`SELECT * FROM proforma_detalle WHERE "proformaId" = $1 ORDER BY id`, [pId]);
        console.table(pd.rows);

        console.log("\n=== HISTORIA CLINICA FOR PROFORMA 11 ===");
        const hc = await client.query(`
            SELECT id, fecha, pieza, tratamiento, precio, "estadoTratamiento", "estadoPresupuesto", "proformaDetalleId"
            FROM historia_clinica
            WHERE "pacienteId" = 1003 AND "proformaId" = $1
            ORDER BY id
        `, [pId]);
        console.table(hc.rows);

        // Sum of terminado in HC for proforma 11
        const termHc = hc.rows.filter(r => r.estadoTratamiento === 'terminado');
        const sumTermHc = termHc.reduce((acc, r) => acc + parseFloat(r.precio || 0), 0);
        console.log(`\nSUM of HC where estadoTratamiento = 'terminado': ${sumTermHc}`);

        // Sum of all HC for proforma 11
        const sumAllHc = hc.rows.reduce((acc, r) => acc + parseFloat(r.precio || 0), 0);
        console.log(`SUM of ALL HC for proforma 11: ${sumAllHc}`);
    }

    await client.end();
}

main().catch(console.error);
