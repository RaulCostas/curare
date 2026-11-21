const { Client } = require('pg');

async function verify() {
    const client = new Client({ host: 'localhost', port: 5433, user: 'postgres', password: 'postgrespg', database: 'curare' });
    await client.connect();

    const res = await client.query(`
        SELECT p.id, p."pacienteId", p.numero, p.fecha, p.total, p.nota, COUNT(d.id) as detalles_count
        FROM propuestas p
        LEFT JOIN propuesta_detalle d ON d."propuestaId" = p.id
        WHERE p."pacienteId" IN (1994, 141)
        GROUP BY p.id, p."pacienteId", p.numero, p.fecha, p.total, p.nota
        ORDER BY p."pacienteId", p.numero
    `);

    console.log('Result for patients 1994 and 141:');
    for (const row of res.rows) {
        console.log(`Paciente ${row.pacienteId} | Propuesta #${row.numero} | Fecha: ${row.fecha.toISOString().split('T')[0]} | Total: ${row.total} | Detalles: ${row.detalles_count} | Nota: ${row.nota}`);
    }

    // Also check sample details
    const detSample = await client.query(`
        SELECT d.id, d."propuestaId", d.letra, a.codigo, a.detalle, d."precioUnitario", d.cantidad, d.total, d.piezas
        FROM propuesta_detalle d
        JOIN arancel a ON a.id = d."arancelId"
        WHERE d."propuestaId" = $1
        ORDER BY d.letra, d.id
    `, [res.rows[0].id]);
    console.log('\nSample details for first proposal:');
    console.table(detSample.rows);

    await client.end();
}

verify().catch(console.error);
