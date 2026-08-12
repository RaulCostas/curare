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

    const hcRes = await client.query(`
        SELECT id, fecha, pieza, tratamiento, precio, cantidad, "estadoTratamiento", "proformaId", "proformaDetalleId"
        FROM historia_clinica
        WHERE "pacienteId" = 94 AND "proformaId" = 4602
        ORDER BY id
    `);
    const rows = hcRes.rows;

    console.log("=== ALL HC ROWS FOR PROFORMA 4602 ===");
    console.table(rows.map(r => ({
        id: r.id,
        fecha: r.fecha.toISOString().split('T')[0],
        pieza: r.pieza,
        tratamiento: r.tratamiento,
        precio: parseFloat(r.precio),
        estado: r.estadoTratamiento
    })));

    // Let's check subsets of finished items
    const finished = rows.filter(r => r.estadoTratamiento === 'terminado');

    console.log("\nFinished items total raw price sum:", finished.reduce((a, b) => a + parseFloat(b.precio), 0));

    // Find any subset of finished items that equals 11156.50 or close
    const findSubsets = (arr, target) => {
        let results = [];
        const f = (start, currentSum, currentItems) => {
            if (Math.abs(currentSum - target) < 1.0) {
                results.push({ sum: currentSum, items: currentItems });
            }
            if (currentSum > target + 5000) return;
            for (let i = start; i < arr.length; i++) {
                f(i + 1, currentSum + parseFloat(arr[i].precio), [...currentItems, arr[i]]);
            }
        };
        f(0, 0, []);
        return results;
    };

    const matches = findSubsets(finished, 11156.50);
    console.log(`\nMatches for 11156.50 (found ${matches.length}):`);
    matches.forEach(m => {
        console.log(`\nMatch sum: ${m.sum}`);
        console.table(m.items.map(i => ({ id: i.id, fecha: i.fecha.toISOString().split('T')[0], pieza: i.pieza, tratamiento: i.tratamiento, precio: i.precio })));
    });

    await client.end();
}

main().catch(console.error);
