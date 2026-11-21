import { getAppDataSource, getMdbReader } from '../config';
import { cleanString, cleanDate, parseCurrency } from '../utils/formatters';

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

function parseCleanDate(val: any): string | null {
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
  return cleanDate(val);
}

export async function migratePropuestasModule() {
  console.log('\n======================================================');
  console.log('  INICIANDO MIGRACIÓN: PROPUESTAS Y PROPUESTA DETALLE');
  console.log('======================================================\n');

  const dataSource = await getAppDataSource();
  const reader = getMdbReader();

  // 1. Verificar / insertar aranceles faltantes
  console.log('1. Verificando aranceles requeridos...');
  for (const a of MISSING_ARANCELES) {
    const existing = await dataSource.query('SELECT id FROM arancel WHERE codigo = $1', [a.codigo]);
    if (existing.length === 0) {
      await dataSource.query(`
        INSERT INTO arancel (codigo, detalle, precio1, precio2, tc, estado, "idEspecialidad", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, 1.0, 'activo', $5, NOW(), NOW())
      `, [a.codigo, a.detalle, a.precio1, a.precio2, a.idEspecialidad]);
    }
  }

  // Load Aranceles
  const aranceles = await dataSource.query('SELECT id, codigo, detalle FROM arancel');
  const arancelMap = new Map<string, number>();
  for (const a of aranceles) {
    if (a.codigo) arancelMap.set(a.codigo.trim(), a.id);
  }
  const controlArancel = aranceles.find((a: any) => a.codigo === '01.10') || aranceles[0];

  // Load Users
  const users = await dataSource.query('SELECT id, name, email FROM "user"');
  const userMap = new Map<string, number>();
  const defaultUserId = users.find((u: any) => u.name && u.name.includes('COSTAS'))?.id || users[0]?.id || 1;
  for (const u of users) {
    if (u.name) userMap.set(u.name.toUpperCase().trim(), u.id);
    if (u.email) userMap.set(u.email.toLowerCase().trim(), u.id);
  }

  // Load Patients
  const pgPatients = await dataSource.query(`
    SELECT id, access_id, 
           UPPER(TRIM(CONCAT(COALESCE(paterno, ''), ' ', COALESCE(materno, ''), ' ', COALESCE(nombre, '')))) as fullname,
           UPPER(TRIM(CONCAT(COALESCE(paterno, ''), ' ', COALESCE(nombre, '')))) as shortname
    FROM pacientes
  `);

  const accessIdMap = new Map<string, number>();
  const nameMap = new Map<string, number>();
  const pIdSet = new Set<number>(pgPatients.map((p: any) => p.id));
  for (const p of pgPatients) {
    if (p.access_id) accessIdMap.set(p.access_id.toUpperCase().trim(), p.id);
    if (p.fullname) nameMap.set(p.fullname.replace(/\s+/g, ' ').trim(), p.id);
    if (p.shortname) nameMap.set(p.shortname.replace(/\s+/g, ' ').trim(), p.id);
  }

  // Read Access Propu_Detalle
  const propuTable = reader.getTable('Propu_Detalle');
  const rows: any[] = propuTable.getData();
  console.log(`2. Leídos ${rows.length} registros de Propu_Detalle en Access.`);

  // Group items by patient
  const patientItems = new Map<number, any[]>();

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
      numStr
    };

    if (!patientItems.has(pid)) patientItems.set(pid, []);
    patientItems.get(pid)!.push(detailObj);
  }

  // Group into proposal headers
  const accessProposalsByPatient = new Map<number, any[]>();

  for (const [pid, items] of patientItems.entries()) {
    items.sort((a, b) => {
      if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
      const numA = parseInt(a.idDetalle.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.idDetalle.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });

    const groups = new Map<string, any[]>();
    for (const item of items) {
      let gKey = item.numStr ? `NUM_${item.numStr}` : `DATE_${item.fecha}`;
      if (!item.numStr) {
        const sameDateKey = Array.from(groups.keys()).find(k => {
          return groups.get(k)!.some(gi => gi.fecha === item.fecha);
        });
        if (sameDateKey) gKey = sameDateKey;
      }

      if (!groups.has(gKey)) groups.set(gKey, []);
      groups.get(gKey)!.push(item);
    }

    const patientProposalsList = [];
    for (const [, gItems] of groups.entries()) {
      const pDates = gItems.map(i => i.fecha).sort();
      const headerDate = pDates[0];

      const notasByLetra: Record<string, string> = {};
      for (const item of gItems) {
        if (item.nota && item.nota.trim()) {
          if (!notasByLetra[item.letra]) {
            notasByLetra[item.letra] = item.nota.trim();
          }
        }
      }
      const notaHeader = Object.keys(notasByLetra).length > 0 ? JSON.stringify(notasByLetra) : '';
      const totalHeader = gItems.reduce((sum, item) => sum + item.total, 0);
      const usuarioId = gItems[0].usuarioId || defaultUserId;

      patientProposalsList.push({
        pacienteId: pid,
        fecha: headerDate,
        total: totalHeader,
        nota: notaHeader,
        usuarioId,
        detalles: gItems
      });
    }

    accessProposalsByPatient.set(pid, patientProposalsList);
  }

  console.log(`3. Insertando propuestas y detalles...`);
  // Sync sequences first to prevent ID collisions
  await dataSource.query(`
    SELECT setval('propuestas_id_seq', (SELECT COALESCE(MAX(id), 1) FROM propuestas));
    SELECT setval('propuesta_detalle_id_seq', (SELECT COALESCE(MAX(id), 1) FROM propuesta_detalle));
  `);

  let totalHeaders = 0;
  let totalDetails = 0;

  for (const [pid, propsList] of accessProposalsByPatient.entries()) {
    for (const prop of propsList) {
      totalHeaders++;
      const resHeader = await dataSource.query(`
        INSERT INTO propuestas ("pacienteId", numero, fecha, total, nota, "usuarioId")
        VALUES ($1, 1, $2, $3, $4, $5)
        RETURNING id
      `, [prop.pacienteId, prop.fecha, prop.total, prop.nota || null, prop.usuarioId]);

      const propId = resHeader[0].id;

      for (const d of prop.detalles) {
        totalDetails++;
        await dataSource.query(`
          INSERT INTO propuesta_detalle ("propuestaId", letra, "arancelId", "precioUnitario", tc, piezas, cantidad, "subTotal", descuento, total, posible)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          propId,
          d.letra || null,
          d.arancelId,
          d.precioUnitario,
          d.tc,
          d.piezas || null,
          d.cantidad,
          d.subTotal,
          d.descuento,
          d.total,
          d.posible
        ]);
      }
    }
  }

  console.log(`4. Reordenando correlativamente las propuestas según fecha...`);
  await dataSource.query(`
    WITH numbered AS (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY "pacienteId" ORDER BY fecha ASC, id ASC) as new_numero
      FROM propuestas
    )
    UPDATE propuestas p
    SET numero = n.new_numero
    FROM numbered n
    WHERE p.id = n.id AND p.numero != n.new_numero;
  `);

  // Final sequence sync
  await dataSource.query(`
    SELECT setval('propuestas_id_seq', (SELECT COALESCE(MAX(id), 1) FROM propuestas));
    SELECT setval('propuesta_detalle_id_seq', (SELECT COALESCE(MAX(id), 1) FROM propuesta_detalle));
  `);

  console.log(`\n======================================================`);
  console.log(`  MIGRACIÓN COMPLETADA: ${totalHeaders} propuestas, ${totalDetails} detalles.`);
  console.log(`======================================================\n`);
}
