const { Client } = require('pg');
const { prepareMigration } = require('./migration_propuestas_runner');

async function main() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5433', 10),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgrespg',
        database: process.env.DB_NAME || 'curare',
    });

    await client.connect();
    console.log('Conectado a PostgreSQL...');

    try {
        const { accessProposalsByPatient } = await prepareMigration(client);

        await client.query('BEGIN');
        console.log('\n--- INICIANDO TRANSACCIÓN DE MIGRACIÓN ---');

        // Let's get all patients that have proposals in either Access or Postgres
        const pgExistingProps = (await client.query('SELECT id, "pacienteId", numero, fecha FROM propuestas ORDER BY "pacienteId", fecha ASC, numero ASC')).rows;
        const pgPropsByPatient = new Map();
        for (const p of pgExistingProps) {
            const fechaStr = p.fecha instanceof Date ? p.fecha.toISOString().split('T')[0] : String(p.fecha).split('T')[0];
            if (!pgPropsByPatient.has(p.pacienteId)) pgPropsByPatient.set(p.pacienteId, []);
            pgPropsByPatient.get(p.pacienteId).push({
                isAccess: false,
                id: p.id,
                pacienteId: p.pacienteId,
                currentNumero: p.numero,
                fecha: fechaStr
            });
        }

        const allPatientIds = new Set([...accessProposalsByPatient.keys(), ...pgPropsByPatient.keys()]);
        console.log(`Total pacientes a procesar: ${allPatientIds.size}`);

        let totalAccessHeadersInserted = 0;
        let totalAccessDetailsInserted = 0;
        let totalExistingPropsShifted = 0;

        for (const pid of allPatientIds) {
            const accessList = accessProposalsByPatient.get(pid) || [];
            const pgList = pgPropsByPatient.get(pid) || [];

            // Combine all proposals for this patient
            const combined = [...accessList, ...pgList];

            // Sort chronologically: fecha ASC
            // If same fecha: access comes first (older system), then pg existing
            combined.sort((a, b) => {
                if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
                if (a.isAccess && !b.isAccess) return -1;
                if (!a.isAccess && b.isAccess) return 1;
                if (a.isAccess && b.isAccess) {
                    const numA = parseInt(a.originalNum, 10) || 0;
                    const numB = parseInt(b.originalNum, 10) || 0;
                    return numA - numB;
                }
                return a.id - b.id;
            });

            // Assign correlative numbers 1, 2, 3...
            let currentCorrelative = 1;
            for (const prop of combined) {
                const assignedNum = currentCorrelative++;

                if (prop.isAccess) {
                    // Insert header
                    const resHeader = await client.query(`
                        INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
                        VALUES ($1, $2, $3, $4, $5, $6)
                        RETURNING id
                    `, [prop.pacienteId, assignedNum, prop.fecha, prop.total, prop.nota, prop.usuarioId]);

                    const newPropuestaId = resHeader.rows[0].id;
                    totalAccessHeadersInserted++;

                    // Insert details
                    for (const d of prop.detalles) {
                        await client.query(`
                            INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                        `, [
                            newPropuestaId,
                            d.letra,
                            d.arancelId,
                            d.precioUnitario,
                            d.tc,
                            d.piezas,
                            d.cantidad,
                            d.subTotal,
                            d.descuento,
                            d.total,
                            d.posible
                        ]);
                        totalAccessDetailsInserted++;
                    }
                } else {
                    // Existing PG proposal
                    if (prop.currentNumero !== assignedNum) {
                        await client.query(`
                            UPDATE propuestas
                            SET numero = $1
                            WHERE id = $2
                        `, [assignedNum, prop.id]);
                        totalExistingPropsShifted++;
                        console.log(`   [Paciente ${pid}] Propuesta existente #${prop.id} actualizada: numero ${prop.currentNumero} -> ${assignedNum}`);
                    }
                }
            }
        }

        // Update sequences
        await client.query(`
            SELECT setval('propuestas_id_seq', (SELECT COALESCE(MAX(id), 1) FROM propuestas));
            SELECT setval('propuesta_detalle_id_seq', (SELECT COALESCE(MAX(id), 1) FROM propuesta_detalle));
        `);

        await client.query('COMMIT');
        console.log('\n=============================================================');
        console.log('  MIGRACIÓN EXITOSA');
        console.log('=============================================================');
        console.log(`Cabeceras de propuestas migradas desde Access: ${totalAccessHeadersInserted}`);
        console.log(`Detalles de propuestas migrados desde Access: ${totalAccessDetailsInserted}`);
        console.log(`Propuestas pre-existentes recorridas / actualizadas: ${totalExistingPropsShifted}`);

        // Verification query
        const totalP = (await client.query('SELECT count(*) FROM propuestas')).rows[0].count;
        const totalD = (await client.query('SELECT count(*) FROM propuesta_detalle')).rows[0].count;
        console.log(`Total propuestas en base de datos: ${totalP}`);
        console.log(`Total detalles en base de datos: ${totalD}`);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error durante la migración, se hizo ROLLBACK:', err);
    } finally {
        await client.end();
    }
}

main().catch(console.error);
