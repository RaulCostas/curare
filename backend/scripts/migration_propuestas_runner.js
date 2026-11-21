const fs = require('fs');
const path = require('path');
const MDBReader = require('mdb-reader').default || require('mdb-reader');
const { Client } = require('pg');

// Missing aranceles from Access that may not exist in postgres
const MISSING_ARANCELES = [
    { codigo: '06.62', detalle: 'CORONA PORCELANA PURA (CAD - CAM)', precio1: 5690, precio2: 5690, idEspecialidad: 6 },
    { codigo: '04.14', detalle: 'RESELLADO DE RESTAURACIONES', precio1: 170, precio2: 170, idEspecialidad: 4 },
    { codigo: '08.05', detalle: 'PROTESIS SOBRE IMPLANTES', precio1: 7360, precio2: 7360, idEspecialidad: 8 },
    { codigo: '06.20', detalle: 'PROTESIS PARCIAL PROVISIONAL', precio1: 1680, precio2: 1680, idEspecialidad: 6 },
    { codigo: '06.12', detalle: 'CORONA PORCELANA PURA (INCERAM)', precio1: 3530, precio2: 3530, idEspecialidad: 6 },
    { codigo: '06.59', detalle: 'PROTESIS TOTAL PROVISIONAL', precio1: 0, precio2: 0, idEspecialidad: 6 },
    { codigo: '06.73', detalle: 'PROTESIS PROVISIONAL BILATERAL ACRILICO', precio1: 0, precio2: 0, idEspecialidad: 6 },
    { codigo: '06.22', detalle: 'PROTESIS TOTAL ACRILICO ADHESIVO SUP. O INF.', precio1: 0, precio2: 0, idEspecialidad: 6 },
    { codigo: '08.35', detalle: 'PROTESIS PROVISIONAL UNILATERAL FLEXIBLE', precio1: 0, precio2: 0, idEspecialidad: 8 },
];

function cleanString(val, defaultVal = '') {
    if (val === null || val === undefined) return defaultVal;
    const str = val.toString().trim();
    return str.length > 0 ? str : defaultVal;
}

function parseCurrency(val) {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    let str = val.toString().trim();
    // E.g. "3.950,00" -> 3950.00
    str = str.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

function parseCleanDate(val) {
    if (!val) return null;
    if (val instanceof Date) {
        return val.toISOString().split('T')[0];
    }
    const str = val.toString().trim();
    if (str.includes('/')) {
        const parts = str.split('/');
        if (parts.length === 3) {
            let y = parts[2].length === 2 ? '20' + parts[2] : parts[2];
            return `${y}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
    }
    try {
        const d = new Date(str);
        if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    } catch (e) { }
    return null;
}

async function prepareMigration(client) {
    console.log('1. Verificando / insertando aranceles faltantes...');
    for (const a of MISSING_ARANCELES) {
        const existing = await client.query('SELECT id FROM arancel WHERE codigo = $1', [a.codigo]);
        if (existing.rows.length === 0) {
            console.log(`   Insertando arancel ${a.codigo}: ${a.detalle}`);
            await client.query(`
                INSERT INTO arancel (codigo, detalle, precio1, precio2, tc, estado, "idEspecialidad", "createdAt", "updatedAt")
                VALUES ($1, $2, $3, $4, 1.0, 'activo', $5, NOW(), NOW())
            `, [a.codigo, a.detalle, a.precio1, a.precio2, a.idEspecialidad]);
        }
    }

    // Load Aranceles
    const aranceles = (await client.query('SELECT id, codigo, detalle FROM arancel')).rows;
    const arancelMap = new Map();
    for (const a of aranceles) {
        if (a.codigo) arancelMap.set(a.codigo.trim(), a.id);
    }
    // Also fallback for 'CONTROL' with empty code
    const controlArancel = aranceles.find(a => a.codigo === '01.10') || aranceles[0];

    // Load Users
    const users = (await client.query('SELECT id, name, email FROM "user"')).rows;
    const userMap = new Map();
    const defaultUserId = users.find(u => u.name && u.name.includes('COSTAS'))?.id || users[0]?.id || 1;
    for (const u of users) {
        if (u.name) userMap.set(u.name.toUpperCase().trim(), u.id);
        if (u.email) userMap.set(u.email.toLowerCase().trim(), u.id);
    }

    // Load Patients
    const pgPatients = (await client.query(`
        SELECT id, access_id, 
               UPPER(TRIM(CONCAT(COALESCE(paterno, ''), ' ', COALESCE(materno, ''), ' ', COALESCE(nombre, '')))) as fullname,
               UPPER(TRIM(CONCAT(COALESCE(paterno, ''), ' ', COALESCE(nombre, '')))) as shortname
        FROM pacientes
    `)).rows;

    const accessIdMap = new Map();
    const nameMap = new Map();
    const pIdSet = new Set(pgPatients.map(p => p.id));
    for (const p of pgPatients) {
        if (p.access_id) accessIdMap.set(p.access_id.toUpperCase().trim(), p.id);
        if (p.fullname) nameMap.set(p.fullname.replace(/\s+/g, ' ').trim(), p.id);
        if (p.shortname) nameMap.set(p.shortname.replace(/\s+/g, ' ').trim(), p.id);
    }

    // Load Access MDB
    const mdbPath = path.resolve(__dirname, '../../backups/curare.mdb');
    const buffer = fs.readFileSync(mdbPath);
    const reader = new MDBReader(buffer);
    const propuTable = reader.getTable('Propu_Detalle');
    const rows = propuTable.getData();
    console.log(`2. Leídos ${rows.length} registros de Propu_Detalle en Access.`);

    // Group items by Patient
    const patientItems = new Map();

    for (const r of rows) {
        const rawPid = cleanString(r.IdPaciente).toUpperCase();
        let pid = accessIdMap.get(rawPid);
        if (!pid) {
            const num = parseInt(rawPid.replace(/^P-/i, ''), 10);
            if (!isNaN(num) && pIdSet.has(num)) pid = num;
        }
        if (!pid && r.Paciente) {
            const cleanName = cleanString(r.Paciente).replace(/\s+/g, ' ').toUpperCase();
            pid = nameMap.get(cleanName);
        }
        if (!pid) continue;

        let numStr = cleanString(r.Numero_Propuesta);
        let fecha = parseCleanDate(r.Fecha) || parseCleanDate(r.fnum1) || '2015-01-01';

        const code = cleanString(r.Codigo);
        let arancelId = arancelMap.get(code);
        if (!arancelId) {
            if (cleanString(r.Descripcion).toUpperCase().includes('CONTROL')) {
                arancelId = controlArancel.id;
            } else {
                console.warn(`Arancel no encontrado para código: '${code}' desc: '${r.Descripcion}'`);
                continue;
            }
        }

        const pu = parseCurrency(r.PU);
        const piezas = cleanString(r.Pieza);
        const cant = parseInt(cleanString(r.Cant), 10) || 1;
        const subTotal = parseCurrency(r.Total);
        const descuento = parseCurrency(r.Descuento);
        let total = parseCurrency(r.Total_T);
        if (total === 0 && subTotal > 0) {
            total = subTotal - (subTotal * (descuento / 100));
        }
        const posible = cleanString(r.Posible).toUpperCase() === 'SI';
        const letra = cleanString(r.Letra, 'A').toUpperCase();
        const nota = cleanString(r.Nota);

        const userName = cleanString(r.Usuario).toUpperCase();
        const usuarioId = userMap.get(userName) || defaultUserId;

        const detailObj = {
            idDetalle: cleanString(r.IdPro_Detalle),
            arancelId,
            precioUnitario: pu,
            tc: 1.0,
            piezas,
            cantidad: cant,
            subTotal,
            descuento,
            total,
            posible,
            letra,
            nota,
            usuarioId,
            fecha,
            numStr,
            itemNumero: parseInt(cleanString(r.Numero), 10) || 1
        };

        if (!patientItems.has(pid)) patientItems.set(pid, []);
        patientItems.get(pid).push(detailObj);
    }

    console.log(`3. Pacientes válidos con propuestas en Access: ${patientItems.size}`);

    // Group items into proposals per patient
    const accessProposalsByPatient = new Map();

    for (const [pid, items] of patientItems.entries()) {
        // Sort items by date ASC, then IdPro_Detalle ASC
        items.sort((a, b) => {
            if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
            const numA = parseInt(a.idDetalle.replace(/\D/g, ''), 10) || 0;
            const numB = parseInt(b.idDetalle.replace(/\D/g, ''), 10) || 0;
            return numA - numB;
        });

        // Group into proposals
        const groups = new Map();
        for (const item of items) {
            let gKey = item.numStr ? `NUM_${item.numStr}` : `DATE_${item.fecha}`;
            if (!item.numStr) {
                // If numStr is empty, check if there's already a group on same date
                const sameDateKey = Array.from(groups.keys()).find(k => {
                    return groups.get(k).some(gi => gi.fecha === item.fecha);
                });
                if (sameDateKey) gKey = sameDateKey;
            }

            if (!groups.has(gKey)) groups.set(gKey, []);
            groups.get(gKey).push(item);
        }

        const patientProposalsList = [];
        for (const [gKey, gItems] of groups.entries()) {
            // Proposal header date: use earliest date in group
            const pDates = gItems.map(i => i.fecha).sort();
            const headerDate = pDates[0];

            // Notas per letra
            const notasByLetra = {};
            for (const item of gItems) {
                if (item.nota && item.nota.trim()) {
                    if (!notasByLetra[item.letra]) {
                        notasByLetra[item.letra] = item.nota.trim();
                    }
                }
            }
            const notaHeader = Object.keys(notasByLetra).length > 0 ? JSON.stringify(notasByLetra) : '';

            // Total
            const totalHeader = gItems.reduce((sum, item) => sum + item.total, 0);

            // User
            const usuarioId = gItems[0].usuarioId || defaultUserId;

            // Original number string
            const originalNum = gItems[0].numStr || '';

            patientProposalsList.push({
                isAccess: true,
                pacienteId: pid,
                fecha: headerDate,
                total: totalHeader,
                nota: notaHeader,
                usuarioId,
                originalNum,
                detalles: gItems
            });
        }

        accessProposalsByPatient.set(pid, patientProposalsList);
    }

    return { accessProposalsByPatient, client };
}

module.exports = { prepareMigration, MISSING_ARANCELES };
