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

    console.log('=== CHECKING ALL SALDO FORMULAS FOR GARAFULIC PROFORMA 7502 (#1) ===\n');

    // 1. Proforma header total
    const profRes = await client.query(`SELECT total FROM proformas WHERE id = 7502;`);
    const proformaTotal = parseFloat(profRes.rows[0].total);

    // 2. Sum of proforma_detalle
    const pdRes = await client.query(`SELECT SUM(CAST(total AS NUMERIC)) as sum_pd FROM proforma_detalle WHERE "proformaId" = 7502;`);
    const sumPd = parseFloat(pdRes.rows[0].sum_pd);

    // 3. Payments sum without TC:
    const pagosRawRes = await client.query(`SELECT SUM(CAST(monto AS NUMERIC)) as sum_pagos FROM pagos WHERE "proformaId" = 7502;`);
    const sumPagosRaw = parseFloat(pagosRawRes.rows[0].sum_pagos);

    // 4. Payments sum WITH TC conversion (if USD):
    const pagosRes = await client.query(`SELECT monto, moneda, tc FROM pagos WHERE "proformaId" = 7502;`);
    let sumPagosWithTC = 0;
    pagosRes.rows.forEach(p => {
        const val = p.moneda === 'Dólares' ? parseFloat(p.monto || '0') * parseFloat(p.tc || '6.96') : parseFloat(p.monto || '0');
        sumPagosWithTC += val;
    });

    // 5. Total Ejecutado (Historia Clinica)
    const hcRes = await client.query(`SELECT * FROM historia_clinica WHERE "proformaId" = 7502;`);
    const hcSumAll = hcRes.rows.reduce((sum, r) => sum + parseFloat(r.precio || '0'), 0);
    const hcSumTerminado = hcRes.rows.filter(r => r.estadoTratamiento === 'terminado').reduce((sum, r) => sum + parseFloat(r.precio || '0'), 0);

    console.log(`proformas.total: ${proformaTotal}`);
    console.log(`sum(proforma_detalle.total): ${sumPd}`);
    console.log(`sum(pagos.monto raw): ${sumPagosRaw}`);
    console.log(`sum(pagos converted with TC): ${sumPagosWithTC}`);
    console.log(`sum(historia_clinica ALL): ${hcSumAll}`);
    console.log(`sum(historia_clinica TERMINADO): ${hcSumTerminado}`);

    console.log('\nPossible Saldo Combinations:');
    console.log(`A) proformaTotal - sumPagosRaw: ${proformaTotal - sumPagosRaw}`);
    console.log(`B) proformaTotal - sumPagosWithTC: ${proformaTotal - sumPagosWithTC}`);
    console.log(`C) sumPd - sumPagosRaw: ${sumPd - sumPagosRaw}`);
    console.log(`D) sumPd - sumPagosWithTC: ${sumPd - sumPagosWithTC}`);
    console.log(`E) hcSumTerminado - sumPagosRaw: ${hcSumTerminado - sumPagosRaw} (THIS IS 64064.72 IN /pacientes-deudores!)`);
    console.log(`F) hcSumTerminado - sumPagosWithTC: ${hcSumTerminado - sumPagosWithTC}`);
    console.log(`G) hcSumAll - sumPagosRaw: ${hcSumAll - sumPagosRaw}`);
    console.log(`H) hcSumAll - sumPagosWithTC: ${hcSumAll - sumPagosWithTC}`);

    await client.end();
}

main().catch(console.error);
