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

    const profs = await client.query(`SELECT id, numero, fecha, total, aprobado FROM proformas WHERE "pacienteId" = 94 ORDER BY numero, id`);

    console.log("=== RESUMEN PROFORMAS Y HISTORIA CLINICA PACIENTE 94 ===");
    for (const p of profs.rows) {
        const pd = await client.query(`
            SELECT pd.id, pd."arancelId", pd."precioUnitario", pd.cantidad, pd.descuento, pd.total, a.detalle as arancel_nombre
            FROM proforma_detalle pd
            LEFT JOIN arancel a ON pd."arancelId" = a.id
            WHERE pd."proformaId" = $1 ORDER BY pd.id
        `, [p.id]);

        const hc = await client.query(`
            SELECT id, fecha, pieza, tratamiento, precio, cantidad, "estadoTratamiento", "proformaDetalleId"
            FROM historia_clinica
            WHERE "pacienteId" = 94 AND "proformaId" = $1
            ORDER BY id
        `, [p.id]);

        // Calculate totalEjecutado according to HistoriaClinica.tsx logic
        const hcTerminado = hc.rows.filter(r => r.estadoTratamiento === 'terminado');
        const sumRawPrecio = hcTerminado.reduce((acc, r) => acc + Number(r.precio || 0), 0);

        const totalEjecutadoCalc = hcTerminado.reduce((acc, curr) => {
            const pdMatch = pd.rows.find(d => Number(d.id) === Number(curr.proformaDetalleId));
            if (pdMatch && Number(pdMatch.total) > 0 && Number(pdMatch.cantidad) > 0) {
                const netUnitPrice = Number(pdMatch.total) / Number(pdMatch.cantidad);
                return acc + (netUnitPrice * Number(curr.cantidad || 1));
            }
            if (pd.rows.length > 0) {
                const currTratNorm = (curr.tratamiento || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, ' ').trim();
                const matchByName = pd.rows.find((d) => {
                    const dTratNorm = (d.arancel_nombre || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, ' ').trim();
                    return dTratNorm && currTratNorm && (dTratNorm.includes(currTratNorm) || currTratNorm.includes(dTratNorm) || dTratNorm.split(' ')[0] === currTratNorm.split(' ')[0]);
                });
                if (matchByName && Number(matchByName.total) > 0 && Number(matchByName.cantidad) > 0) {
                    const netUnitPrice = Number(matchByName.total) / Number(matchByName.cantidad);
                    return acc + (netUnitPrice * Number(curr.cantidad || 1));
                }
            }
            return acc + Number(curr.precio || 0);
        }, 0);

        console.log(`Proforma #${p.numero} (ID ${p.id}): TotalPresupuesto=${p.total} | TotalEjecutadoCalc=${totalEjecutadoCalc.toFixed(2)} | SumRawPrecio=${sumRawPrecio.toFixed(2)} | HCTerminadoCount=${hcTerminado.length}/${hc.rows.length}`);
    }

    await client.end();
}

main().catch(console.error);
