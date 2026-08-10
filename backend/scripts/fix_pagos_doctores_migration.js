const mdbReaderModule = require('mdb-reader');
const MDBReader = mdbReaderModule.default || mdbReaderModule;
const fs = require('fs');
const { DataSource } = require('typeorm');

const ds = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5433,
  username: 'postgres',
  password: 'postgrespg',
  database: 'curare',
  synchronize: false
});

function cleanString(val) {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

function cleanDate(val) {
  if (!val) return null;
  const str = String(val).trim();
  if (!str) return null;

  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      let y = parseInt(parts[2], 10);
      if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
      if (y < 100) y += 2000;
      if (y < 1990 || y > 2099 || m < 1 || m > 12 || d < 1 || d > 31) return null;
      const testDate = new Date(y, m - 1, d);
      if (testDate.getFullYear() !== y || testDate.getMonth() !== m - 1 || testDate.getDate() !== d) return null;
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }
  const isoMatch = str.match(/^(\d{4,5})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3], 10);
    if (y >= 1990 && y <= 2099 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      const testDate = new Date(y, m - 1, d);
      if (testDate.getFullYear() !== y || testDate.getMonth() !== m - 1 || testDate.getDate() !== d) return null;
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }
  return null;
}

function parseCurrency(val) {
  if (val === null || val === undefined) return 0;
  let str = String(val).trim().replace(/\s/g, '');
  if (!str) return 0;
  if (str.includes(',') && str.includes('.')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

async function main() {
  await ds.initialize();
  console.log('Conectado a PostgreSQL.');

  const buffer = fs.readFileSync('D:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb');
  const reader = new MDBReader(buffer);

  // 1. Existing pagos_doctores IDs in PG
  const pgPagos = await ds.query('SELECT id FROM pagos_doctores');
  const validPgPagoIds = new Set(pgPagos.map(p => p.id));
  console.log(`Valid PagosDoctores in PG: ${validPgPagoIds.size}`);

  // 2. Map historia_clinica by access_trabajos_doctores_id
  const hcRows = await ds.query('SELECT id, access_trabajos_doctores_id, fecha, tratamiento, pieza FROM historia_clinica');
  const hcMapByAccessId = new Map();
  for (const h of hcRows) {
    if (h.access_trabajos_doctores_id) {
      hcMapByAccessId.set(h.access_trabajos_doctores_id.toUpperCase().trim(), h.id);
    }
  }

  // 3. Read Pago_Doctores to map raw Access IdPagos to PG ID
  const pdTable = reader.getTable('Pago_Doctores');
  const pdRows = pdTable.getData();
  const accessPagoIdToPgId = new Map();

  for (const r of pdRows) {
    const rawId = cleanString(r.IdPagos).toUpperCase().trim(); // e.g. "P-D-470"
    const numId = parseInt(rawId.replace(/^P-D-/i, ''), 10);
    if (!isNaN(numId) && validPgPagoIds.has(numId)) {
      accessPagoIdToPgId.set(rawId, numId);
    }
  }

  console.log(`Mapped valid Access Pagos IDs: ${accessPagoIdToPgId.size}`);
  console.log('P-D-470 maps to PG ID:', accessPagoIdToPgId.get('P-D-470'));

  // 4. Read Pago_Doctores_Detalle
  const pddTable = reader.getTable('Pago_Doctores_Detalle');
  const pddRows = pddTable.getData();
  console.log(`Total Pago_Doctores_Detalle rows in Access MDB: ${pddRows.length}`);

  const pdd470 = pddRows.filter(r => cleanString(r.IdPagos).toUpperCase().trim() === 'P-D-470');
  console.log(`Pago P-D-470 detail rows in Access: ${pdd470.length}`);

  let skippedCount = 0;

  // Clear existing pagos_detalle_doctores to re-populate correctly
  console.log('Truncating pagos_detalle_doctores...');
  await ds.query('TRUNCATE TABLE pagos_detalle_doctores RESTART IDENTITY CASCADE;');

  const pddToInsert = [];
  const hcIdsToUpdatePagado = new Set();

  for (const r of pddRows) {
    const rawPagoId = cleanString(r.IdPagos).toUpperCase().trim();
    const pgPagoId = accessPagoIdToPgId.get(rawPagoId);

    if (!pgPagoId) {
      skippedCount++;
      continue;
    }

    const rawTrDr = cleanString(r.IdTrabajos_Doctores).toUpperCase().trim();
    let idhistoria_clinica = (rawTrDr && hcMapByAccessId.has(rawTrDr)) ? hcMapByAccessId.get(rawTrDr) : null;

    if (!idhistoria_clinica) {
      // Secondary match by fecha & tratamiento
      const r1Fecha = cleanDate(r.R1);
      const r3Trat = cleanString(r.R3).toUpperCase();
      const r4Pieza = cleanString(r.R4);

      const candidate = hcRows.find((h) => {
        const matchFecha = r1Fecha && h.fecha && h.fecha.toString().split('T')[0] === r1Fecha;
        const matchTrat = r3Trat && h.tratamiento && h.tratamiento.toUpperCase().includes(r3Trat);
        const matchPieza = !r4Pieza || !h.pieza || h.pieza === r4Pieza;
        return matchFecha && (matchTrat || matchPieza);
      });

      if (candidate) {
        idhistoria_clinica = candidate.id;
      }
    }

    if (!idhistoria_clinica) {
      skippedCount++;
      continue;
    }

    hcIdsToUpdatePagado.add(idhistoria_clinica);

    const costo_laboratorio = parseCurrency(r.Costo_Lab);
    const fecha_pago_paciente = cleanDate(r.Fecha_Pago);
    const forma_pago_paciente = cleanString(r.Forma_Pago) || null;
    const descuento = parseCurrency(r.Descuento);
    const total = parseCurrency(r.Sub_Total);

    pddToInsert.push({
      "idPagos": pgPagoId,
      "idhistoria_clinica": idhistoria_clinica,
      costo_laboratorio,
      fecha_pago_paciente,
      forma_pago_paciente,
      descuento,
      total
    });
  }

  console.log(`Inserting ${pddToInsert.length} details into pagos_detalle_doctores (Skipped: ${skippedCount})...`);

  const chunkSize = 1000;
  for (let i = 0; i < pddToInsert.length; i += chunkSize) {
    const chunk = pddToInsert.slice(i, i + chunkSize);
    const values = chunk.map(d => `(${d.idPagos}, ${d.idhistoria_clinica}, ${d.costo_laboratorio}, ${d.fecha_pago_paciente ? `'${d.fecha_pago_paciente}'` : 'NULL'}, ${d.forma_pago_paciente ? `'${d.forma_pago_paciente.replace(/'/g, "''")}'` : 'NULL'}, ${d.descuento}, ${d.total})`).join(',\n');
    
    await ds.query(`
      INSERT INTO pagos_detalle_doctores ("idPagos", "idhistoria_clinica", costo_laboratorio, fecha_pago_paciente, forma_pago_paciente, descuento, total)
      VALUES ${values}
    `);
  }

  await ds.query(`SELECT setval('pagos_detalle_doctores_id_seq', (SELECT MAX(id) FROM pagos_detalle_doctores));`);

  // Update historia_clinica pagado = 'SI'
  console.log(`Updating ${hcIdsToUpdatePagado.size} historia_clinica rows to pagado = 'SI'...`);
  const hcIdArray = Array.from(hcIdsToUpdatePagado);
  for (let i = 0; i < hcIdArray.length; i += chunkSize) {
    const batch = hcIdArray.slice(i, i + chunkSize);
    await ds.query(`UPDATE historia_clinica SET pagado = 'SI' WHERE id IN (${batch.join(',')});`);
  }

  // Check Pago 470 in PG after fix!
  const check470After = await ds.query(`
    SELECT d.*, h.tratamiento, h.pieza, p.nombre, p.paterno
    FROM pagos_detalle_doctores d
    JOIN historia_clinica h ON h.id = d.idhistoria_clinica
    JOIN pacientes p ON p.id = h."pacienteId"
    WHERE d."idPagos" = 470
  `);
  console.log(`\nPago 470 details in PG after fix: ${check470After.length} rows!`);
  console.log('Sample details for Pago 470:', check470After);

  await ds.destroy();
}

main().catch(console.error);
