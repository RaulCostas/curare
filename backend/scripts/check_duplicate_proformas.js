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
    console.log('Connected to DB\n');

    // 1. Inspect Proformas for Paciente 1836
    const prof1836 = await client.query(`
        SELECT p.id, p."pacienteId", p.numero, p.fecha, p.total, p.aprobado, p.nota,
               (SELECT COUNT(*) FROM historia_clinica hc WHERE hc."proformaId" = p.id) AS hc_count,
               (SELECT COUNT(*) FROM pagos pg WHERE pg."proformaId" = p.id) AS pagos_count
        FROM proformas p
        WHERE p."pacienteId" = 1836
        ORDER BY p.numero, p.fecha DESC;
    `);

    console.log('=== PROFORMAS PACIENTE 1836 ===');
    console.table(prof1836.rows);

    // 2. Search DB wide for duplicate (pacienteId, numero) in proformas
    const dupsQuery = await client.query(`
        SELECT "pacienteId", numero, COUNT(*) as qty
        FROM proformas
        WHERE numero IS NOT NULL
        GROUP BY "pacienteId", numero
        HAVING COUNT(*) > 1
        ORDER BY "pacienteId", numero;
    `);

    console.log(`\nFound ${dupsQuery.rows.length} duplicate (pacienteId, numero) groups DB-wide.`);

    // 3. For each duplicate group, inspect usage
    let safeToDeleteCount = 0;
    let keepCount = 0;
    let candidateIdsToDelete = [];

    for (const group of dupsQuery.rows) {
        const details = await client.query(`
            SELECT p.id, p."pacienteId", p.numero, p.fecha, p.total, p.aprobado,
                   (SELECT COUNT(*) FROM historia_clinica hc WHERE hc."proformaId" = p.id) AS hc_count,
                   (SELECT COUNT(*) FROM pagos pg WHERE pg."proformaId" = p.id) AS pagos_count
            FROM proformas p
            WHERE p."pacienteId" = $1 AND p.numero = $2
            ORDER BY p.fecha DESC, p.id DESC;
        `, [group.pacienteId, group.numero]);

        // Analyze which ones are used vs unused
        const rows = details.rows;
        // Check if any has hc_count > 0 or pagos_count > 0
        const used = rows.filter(r => parseInt(r.hc_count) > 0 || parseInt(r.pagos_count) > 0);
        const unused = rows.filter(r => parseInt(r.hc_count) === 0 && parseInt(r.pagos_count) === 0);

        if (group.pacienteId === 1836) {
            console.log(`\n--- Details for Paciente 1836, numero ${group.numero} ---`);
            console.table(rows);
        }

        if (used.length > 0 && unused.length > 0) {
            // We have some used and some unused! The unused ones are clean candidates for deletion.
            unused.forEach(u => candidateIdsToDelete.push(u.id));
        } else if (used.length === 0 && unused.length > 1) {
            // None of them are used in HC or Pagos! Keep the most recent or highest ID, delete the others.
            const toKeep = unused[0]; // most recent by order
            const toDelete = unused.slice(1);
            toDelete.forEach(u => candidateIdsToDelete.push(u.id));
        }
    }

    console.log(`\n=== SUMMARY DB-WIDE ===`);
    console.log(`Total duplicate proformas identified for safe deletion: ${candidateIdsToDelete.length}`);

    await client.end();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
