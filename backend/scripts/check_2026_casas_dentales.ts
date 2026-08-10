import { Client } from 'pg';
import { getMdbReader } from './scripts/migration/config';
import { cleanString, cleanDate, parseCurrency } from './scripts/migration/utils/formatters';

async function findExact769Difference() {
    const reader = getMdbReader();
    const casasTable = reader.getTable('Casas_Dentales');
    const casasRows = casasTable.getData();

    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'curare',
        password: 'postgrespg',
        port: 5433,
    });
    await client.connect();

    // Fetch all pagos_pedidos in PostgreSQL
    const pgRes = await client.query(`
        SELECT pp.id, pp.monto, pp.fecha, p.access_id, prov.proveedor
        FROM pagos_pedidos pp
        LEFT JOIN pedidos p ON pp."idPedido" = p.id
        LEFT JOIN proveedores prov ON p.idproveedor = prov.id
    `);

    const pgMapByAccessId = new Map<string, any>();
    pgRes.rows.forEach(r => {
        if (r.access_id) {
            pgMapByAccessId.set(r.access_id.toString().trim(), r);
        }
    });

    console.log(`Loaded ${pgRes.rows.length} total pagos_pedidos in PostgreSQL.`);

    // Match each Access Casas_Dentales row
    let sumMatchedInPg2026 = 0;
    let sumAccess2026InPg2026 = 0;

    const access2026Rows: any[] = [];

    casasRows.forEach(r => {
        const accessId = cleanString(r.Id);
        const fechaPago = cleanDate(r.Pago || r.fnum2 || r.Fecha || r.fnum1);
        const monto = parseCurrency(r.Monto);
        const casa = cleanString(r.Casa);

        if (fechaPago && fechaPago >= '2026-01-01' && fechaPago <= '2026-12-31') {
            access2026Rows.push({ accessId, fechaPago, monto, casa, rawRow: r });
        }
    });

    console.log(`Found ${access2026Rows.length} Access rows with Pago in 2026.`);

    let diffList: any[] = [];

    access2026Rows.forEach(a => {
        const pgItem = pgMapByAccessId.get(a.accessId);
        if (!pgItem) {
            console.log(`[MISSING IN PG] Access ID: ${a.accessId}, Fecha: ${a.fechaPago}, Monto: ${a.monto}, Casa: "${a.casa}"`);
            diffList.push(a);
        } else {
            const pgDateStr = pgItem.fecha ? new Date(pgItem.fecha).toISOString().split('T')[0] : '';
            const pgMonto = parseFloat(pgItem.monto) || 0;
            if (pgDateStr >= '2026-01-01' && pgDateStr <= '2026-12-31') {
                sumMatchedInPg2026 += pgMonto;
            } else {
                console.log(`[DATE SHIFT] Access ID: ${a.accessId} is in 2026 (${a.fechaPago}) in Access, but in PG it is in ${pgDateStr}! Monto: ${a.monto}`);
            }

            if (Math.abs(pgMonto - a.monto) > 0.01) {
                console.log(`[MONTO DIFF] Access ID: ${a.accessId}: Access=${a.monto}, PG=${pgMonto}`);
            }
        }
    });

    console.log(`\nPG 2026 Total Monto sum of payments matched: ${sumMatchedInPg2026.toFixed(2)}`);

    await client.end();
}

findExact769Difference().catch(console.error);
