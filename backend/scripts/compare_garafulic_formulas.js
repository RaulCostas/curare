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

    console.log('=== COMPARISON: PATIENT PROFILE VS PACIENTES DEUDORES FOR GARAFULIC (ID 1881) PROFORMA 7502 ===\n');

    // 1. Fetch Proforma 7502
    const prof = await client.query(`SELECT * FROM proformas WHERE id = 7502;`);
    const proformaTotal = parseFloat(prof.rows[0].total);

    // 2. Fetch Pagos for 7502
    const pagos = await client.query(`SELECT * FROM pagos WHERE "proformaId" = 7502;`);
    let totalPagado = 0;
    pagos.rows.forEach(p => {
        const val = p.moneda === 'Dólares' ? parseFloat(p.monto || '0') * parseFloat(p.tc || '6.96') : parseFloat(p.monto || '0');
        totalPagado += val;
    });

    // 3. Fetch Historia Clinica for 7502
    const hc = await client.query(`SELECT * FROM historia_clinica WHERE "proformaId" = 7502;`);

    // In HistoriaClinica.tsx:
    // totalEjecutado = sum of ALL hc.precio (regardless of estadoTratamiento)
    const totalEjecutadoHC = hc.rows.reduce((acc, curr) => acc + parseFloat(curr.precio || '0'), 0);
    const saldoHC = totalPagado - totalEjecutadoHC;
    const saldoContraHC = saldoHC < 0 ? Math.abs(saldoHC) : 0;
    const saldoFavorHC = saldoHC > 0 ? saldoHC : 0;

    // Total Presupuesto - Total Pagado (traditional budget balance):
    const saldoPresupuestoTotal = proformaTotal - totalPagado;

    // In PacientesDeudoresService:
    // realized_cost = sum of (pd.total / pd.cantidad * hc.cantidad) ONLY for estadoTratamiento = 'terminado'
    let realizedCostDeudores = 0;
    for (const r of hc.rows) {
        if (r.estadoTratamiento === 'terminado') {
            if (r.proformaDetalleId) {
                const pdRes = await client.query(`SELECT * FROM proforma_detalle WHERE id = $1`, [r.proformaDetalleId]);
                if (pdRes.rows.length > 0) {
                    const pd = pdRes.rows[0];
                    const pdTot = parseFloat(pd.total || '0');
                    const pdCant = parseFloat(pd.cantidad || '1');
                    const hcCant = parseFloat(r.cantidad || '1');
                    if (pdTot > 0 && pdCant > 0) {
                        realizedCostDeudores += (pdTot / pdCant) * hcCant;
                    } else {
                        realizedCostDeudores += parseFloat(r.precio || '0');
                    }
                } else {
                    realizedCostDeudores += parseFloat(r.precio || '0');
                }
            } else {
                realizedCostDeudores += parseFloat(r.precio || '0');
            }
        }
    }

    const saldoDeudores = realizedCostDeudores - totalPagado;

    console.log('--- PATIENT PROFILE HISTORIA CLINICA BOTTOM CARD FORMULA ---');
    console.log(`Total Presupuesto: ${proformaTotal}`);
    console.log(`Total Pagado: ${totalPagado}`);
    console.log(`Total Ejecutado (ALL HC entries sum): ${totalEjecutadoHC}`);
    console.log(`Saldo en Contra (Pagado - Ejecutado): ${saldoContraHC}`);
    console.log(`Saldo en Contra (Total Presupuesto - Pagado): ${saldoPresupuestoTotal}`);

    console.log('\n--- PACIENTES DEUDORES FORMULA ---');
    console.log(`Total Presupuesto: ${proformaTotal}`);
    console.log(`Total Pagado: ${totalPagado}`);
    console.log(`Realized Cost (ONLY 'terminado' HC entries proportionally calculated): ${realizedCostDeudores}`);
    console.log(`Saldo Deudores (Realized Cost - Total Pagado): ${saldoDeudores}`);

    await client.end();
}

main().catch(console.error);
