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

    const profs = await client.query(`SELECT * FROM proformas WHERE "pacienteId" = 1003 AND numero = 11`);
    const p = profs.rows[0];

    const detRes = await client.query(`
        SELECT pd.*, a.detalle as arancel_nombre
        FROM proforma_detalle pd
        LEFT JOIN arancel a ON pd."arancelId" = a.id
        WHERE pd."proformaId" = $1
        ORDER BY pd.id
    `, [p.id]);
    const detalles = detRes.rows;

    const hcRes = await client.query(`
        SELECT id, fecha, pieza, tratamiento, precio, "estadoTratamiento", "estadoPresupuesto", "proformaDetalleId", cantidad
        FROM historia_clinica
        WHERE "pacienteId" = 1003 AND "proformaId" = $1
        ORDER BY id
    `, [p.id]);
    const historia = hcRes.rows;

    console.log("=== PROFORMA 11 DETALLES ===");
    console.table(detalles.map(d => ({
        id: d.id,
        arancel: d.arancel_nombre,
        piezas: d.piezas,
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario,
        total: d.total
    })));

    console.log("\n=== HISTORIA CLINICA (TERMINADO) ===");
    const hcTerminado = historia.filter(h => h.estadoTratamiento === 'terminado');
    console.table(hcTerminado.map(h => ({
        id: h.id,
        fecha: h.fecha.toISOString().split('T')[0],
        pieza: h.pieza,
        tratamiento: h.tratamiento,
        precio: h.precio,
        proformaDetalleId: h.proformaDetalleId
    })));

    // 1. HistoriaClinica.tsx totalEjecutado calculation:
    const totalEjecutadoHC = hcTerminado.reduce((acc, curr) => {
        const pdMatch = detalles.find(d => Number(d.id) === Number(curr.proformaDetalleId));
        if (pdMatch && Number(pdMatch.total) > 0 && Number(pdMatch.cantidad) > 0) {
            const netUnitPrice = Number(pdMatch.total) / Number(pdMatch.cantidad);
            const val = netUnitPrice * Number(curr.cantidad || 1);
            console.log(`HC ${curr.id} (${curr.tratamiento}) matched PD ${pdMatch.id}: netUnitPrice=${netUnitPrice}, val=${val}`);
            return acc + val;
        }
        console.log(`HC ${curr.id} (${curr.tratamiento}) un-matched or fallback: precio=${curr.precio}`);
        return acc + Number(curr.precio || 0);
    }, 0);

    console.log(`\n>>> Total Ejecutado en HistoriaClinica.tsx = Bs. ${totalEjecutadoHC}`);

    // 2. PlanTratamientoModal.tsx calculation:
    let planModalSum = 0;
    detalles.forEach(d => {
        const parsePieces = (str) => !str ? [] : str.split(/[/,\-\s]+/).map(p => p.trim()).filter(Boolean);
        const normalizeTreatment = (str) => !str ? '' : str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\bperno\b/g, 'poste').replace(/\bpernos\b/g, 'postes').replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();

        const arancelDetalleNorm = normalizeTreatment(d.arancel_nombre);
        const detallePieces = parsePieces(d.piezas);

        const matchingHistoria = historia.filter(h => {
            if (h.estadoTratamiento !== 'terminado') return false;
            if (h.proformaDetalleId && Number(h.proformaDetalleId) === Number(d.id)) return true;
            const hNorm = normalizeTreatment(h.tratamiento);
            if (hNorm && arancelDetalleNorm && (hNorm === arancelDetalleNorm || hNorm.includes(arancelDetalleNorm) || arancelDetalleNorm.includes(hNorm))) return true;
            return false;
        });

        let completedPieces = [];
        matchingHistoria.forEach(h => {
            if (h.pieza) {
                completedPieces.push(...parsePieces(h.pieza));
            } else {
                completedPieces.push(...detallePieces);
            }
        });
        const completedSet = new Set(completedPieces);
        const isCompleted = detallePieces.length > 0 ? (detallePieces.length > 0 && detallePieces.every(p => completedSet.has(p))) : matchingHistoria.length > 0;

        const dTot = Number(d.total);
        console.log(`PD ${d.id} (${d.arancel_nombre}) piezas='${d.piezas}': matchingHC=${matchingHistoria.length}, completedPieces=[${completedPieces.join(',')}], isCompleted=${isCompleted}, total=${dTot}`);
        if (isCompleted) {
            planModalSum += dTot;
        }
    });

    console.log(`\n>>> Suma en PlanTratamientoModal.tsx (Ver Plan) = Bs. ${planModalSum}`);

    await client.end();
}

main().catch(console.error);
