import { getAppDataSource, getMdbReader } from '../config';
import { cleanAccessId, cleanString, cleanDate, parseCurrency } from '../utils/formatters';
import { Paciente } from '../../../src/pacientes/entities/paciente.entity';
import { User } from '../../../src/users/entities/user.entity';
import { Arancel } from '../../../src/arancel/entities/arancel.entity';

function parseAccessDate(val: any): string | null {
  if (!val) return null;
  const str = val.toString().trim();
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      let year = parts[2];
      if (year.length === 2) year = '20' + year;
      return `${year}-${month}-${day}`;
    }
  }
  return cleanDate(val);
}

export async function migrateProformasModule() {
  console.log('\n======================================================');
  console.log('  INICIANDO MIGRACIÓN: PROFORMAS Y PROFORMA DETALLE');
  console.log('======================================================\n');

  const dataSource = await getAppDataSource();
  const reader = getMdbReader();

  // 1. Limpiar tablas en PostgreSQL
  console.log('Limpiando tablas de proformas en PostgreSQL...');
  await dataSource.query('TRUNCATE TABLE "proforma_detalle", "proformas" RESTART IDENTITY CASCADE;');

  // 2. Cargar mapas auxiliares de PostgreSQL (Pacientes, Usuarios, Aranceles)
  console.log('Cargando referencias de Pacientes, Usuarios y Aranceles...');

  // Map de Pacientes por ID
  const pgPacientes = await dataSource.getRepository(Paciente).find({ select: ['id'] });
  const pacienteIdsSet = new Set<number>(pgPacientes.map(p => p.id));

  // Map de Pacientes por Nombre Completo para cruce cuando IdPaciente falte
  const pacienteRowsMdb = reader.getTable('Paciente').getData();
  const patientNameToIdMap = new Map<string, number>();
  for (const p of pacienteRowsMdb) {
    const pIdObj = cleanAccessId(p.IdPaciente);
    const fullName = `${p.Paterno || ''} ${p.Materno || ''} ${p.Nombre || ''}`.replace(/\s+/g, ' ').trim().toUpperCase();
    if (pIdObj && fullName) {
      patientNameToIdMap.set(fullName, pIdObj.numericId);
    }
  }

  // Map de Usuarios por Nombre o Email
  const pgUsers = await dataSource.getRepository(User).find({ select: ['id', 'name', 'email'] });
  const userMap = new Map<string, number>();
  let defaultUserId: number | null = pgUsers.length > 0 ? pgUsers[0].id : null;

  for (const u of pgUsers) {
    if (u.name) userMap.set(u.name.toUpperCase().trim(), u.id);
    if (u.email) userMap.set(u.email.toLowerCase().trim(), u.id);
  }

  // Map de Aranceles por Código
  const pgAranceles = await dataSource.getRepository(Arancel).find({ select: ['id', 'codigo'] });
  const arancelCodeToIdMap = new Map<string, number>();
  for (const a of pgAranceles) {
    if (a.codigo) {
      arancelCodeToIdMap.set(a.codigo.trim(), a.id);
    }
  }

  // 3. Leemos las cabeceras de Proforma de Access
  const proformaTable = reader.getTable('Proforma');
  const proformaRows: any[] = proformaTable.getData();
  console.log(`Se encontraron ${proformaRows.length} registros de cabecera en Proforma de Access.`);

  const proformaLookupMap = new Map<string, number>();
  const proformaFallbackMap = new Map<string, number>();
  const proformaPacNumMap = new Map<string, number>();

  const proformasToInsert: any[] = [];
  const now = new Date().toISOString();

  for (const row of proformaRows) {
    const rawIdPro = cleanString(row.IdProforma); // ej. "Pro-12765"
    if (!rawIdPro) continue;

    const numIdPro = parseInt(rawIdPro.replace(/^Pro-/i, ''), 10);
    const rawIdPac = cleanString(row.IdPaciente);
    const numIdPac = parseInt(rawIdPac.replace(/^P-/i, ''), 10);
    const pacienteId = (!isNaN(numIdPac) && pacienteIdsSet.has(numIdPac)) ? numIdPac : null;

    const numeroPro = cleanString(row.Numero_Pro, '01');
    const numeroInt = parseInt(numeroPro, 10) || 1;

    const fecha = parseAccessDate(row.Fecha || row.fnum1) || now.split('T')[0];
    const total = parseCurrency(row.Total_Trat);
    const nota = cleanString(row.Nota, '');

    const userName = cleanString(row.Usuario).toUpperCase();
    const usuarioId = userMap.get(userName) || defaultUserId;

    const aprobado = cleanString(row.Aprobado).toUpperCase() === 'SI';
    const fechaAprobado = parseAccessDate(row.Fecha_Aprobado);
    const userAprobName = cleanString(row.U_Aprobado).toUpperCase();
    const usuarioAprobadoId = userMap.get(userAprobName) || null;

    proformasToInsert.push({
      originalProId: rawIdPro,
      numericProId: numIdPro,
      pacienteId: pacienteId,
      numeroProStr: numeroPro,
      numero: numeroInt,
      fecha,
      total,
      nota,
      usuarioId,
      aprobado,
      fecha_aprobado: fechaAprobado,
      usuario_aprobado: usuarioAprobadoId,
    });
  }

  // Insertar proformas en lotes en PostgreSQL
  console.log(`Insertando ${proformasToInsert.length} proformas en PostgreSQL...`);
  const BATCH_SIZE = 500;
  let proformasCreadas = 0;

  for (let i = 0; i < proformasToInsert.length; i += BATCH_SIZE) {
    const chunk = proformasToInsert.slice(i, i + BATCH_SIZE);
    const sqlInsertHeader = `
      INSERT INTO proformas (
        "pacienteId", numero, fecha, total, nota, "usuarioId", aprobado,
        fecha_aprobado, usuario_aprobado, "createdAt", "updatedAt"
      ) VALUES 
    `;

    const valuePlaceholders: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    for (const item of chunk) {
      const rowParams = [
        item.pacienteId,
        item.numero,
        item.fecha,
        item.total,
        item.nota,
        item.usuarioId,
        item.aprobado,
        item.fecha_aprobado,
        item.usuario_aprobado,
        now,
        now,
      ];

      const placeholders = rowParams.map(() => `$${paramIndex++}`).join(', ');
      valuePlaceholders.push(`(${placeholders})`);
      queryParams.push(...rowParams);
    }

    const fullQuery = sqlInsertHeader + valuePlaceholders.join(', ') + ' RETURNING id;';
    const res = await dataSource.query(fullQuery, queryParams);

    for (let j = 0; j < res.length; j++) {
      const createdId = res[j].id;
      const item = chunk[j];

      const fullKey = `${item.originalProId}_${item.pacienteId}_${item.numero}`;
      const proNumKey = `${item.originalProId}_${item.numero}`;
      const proIdKey = `${item.originalProId}`;
      const pacNumKey = `${item.pacienteId}_${item.numero}`;

      proformaLookupMap.set(fullKey, createdId);
      proformaLookupMap.set(proNumKey, createdId);
      if (!proformaFallbackMap.has(proIdKey)) proformaFallbackMap.set(proIdKey, createdId);
      if (item.pacienteId && !proformaPacNumMap.has(pacNumKey)) proformaPacNumMap.set(pacNumKey, createdId);

      proformasCreadas++;
    }
  }

  console.log(`Proformas creadas e indexadas: ${proformasCreadas}\n`);

  // 4. Leemos la tabla Pro_Detalle desde Access
  const detalleTable = reader.getTable('Pro_Detalle');
  const detalleRows: any[] = detalleTable.getData();
  console.log(`Se encontraron ${detalleRows.length} registros en Pro_Detalle de Access.`);

  const detallesToInsert: any[] = [];

  for (const row of detalleRows) {
    const rawIdDetalle = cleanString(row.IdPro_Detalle);
    const numIdDetalle = parseInt(rawIdDetalle.replace(/^Pro-D-/i, ''), 10);

    const rawIdPro = cleanString(row.IdProforma);
    const numeroProforma = cleanString(row.Numero_Proforma, '01');
    const numeroInt = parseInt(numeroProforma, 10) || 1;
    const pacienteNombre = cleanString(row.Paciente).toUpperCase();
    const pacienteIdFromMap = patientNameToIdMap.get(pacienteNombre) || null;

    let matchedProformaId = 
      (pacienteIdFromMap ? proformaPacNumMap.get(`${pacienteIdFromMap}_${numeroInt}`) : null) ||
      proformaLookupMap.get(`${rawIdPro}_${pacienteIdFromMap}_${numeroInt}`) ||
      proformaLookupMap.get(`${rawIdPro}_${numeroInt}`) ||
      proformaFallbackMap.get(rawIdPro);

    if (!matchedProformaId) continue;

    const codigoArancel = cleanString(row.Codigo);
    const arancelId = arancelCodeToIdMap.get(codigoArancel) || null;

    const pu = parseCurrency(row.PU);
    const tc = 1.0;
    const piezas = cleanString(row.Pieza);
    const cantidad = parseInt(cleanString(row.Cant), 10) || 1;
    const subTotal = parseCurrency(row.Total);
    const descuento = parseCurrency(row.Descuento);
    
    let total = parseCurrency(row.Total_T);
    if (total === 0 && subTotal > 0) {
      total = subTotal - (subTotal * (descuento / 100));
    }

    const precio = cleanString(row.Precio);
    const posible = cleanString(row.Posible).toUpperCase() === 'SI';

    detallesToInsert.push({
      id: !isNaN(numIdDetalle) ? numIdDetalle : undefined,
      proformaId: matchedProformaId,
      arancelId: arancelId,
      precioUnitario: pu,
      tc: tc,
      piezas: piezas,
      cantidad: cantidad,
      subTotal: subTotal,
      descuento: descuento,
      total: total,
      precio: precio,
      posible: posible,
    });
  }

  console.log(`Insertando ${detallesToInsert.length} detalles de proforma en PostgreSQL...`);
  let detallesCreados = 0;

  for (let i = 0; i < detallesToInsert.length; i += BATCH_SIZE) {
    const chunk = detallesToInsert.slice(i, i + BATCH_SIZE);
    const sqlInsertDetail = `
      INSERT INTO proforma_detalle (
        "proformaId", "arancelId", "precioUnitario", tc, piezas, cantidad,
        "subTotal", descuento, total, precio, posible
      ) VALUES 
    `;

    const valuePlaceholders: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    for (const item of chunk) {
      const rowParams = [
        item.proformaId,
        item.arancelId,
        item.precioUnitario,
        item.tc,
        item.piezas,
        item.cantidad,
        item.subTotal,
        item.descuento,
        item.total,
        item.precio,
        item.posible,
      ];

      const placeholders = rowParams.map(() => `$${paramIndex++}`).join(', ');
      valuePlaceholders.push(`(${placeholders})`);
      queryParams.push(...rowParams);
    }

    const fullQuery = sqlInsertDetail + valuePlaceholders.join(', ') + ';';
    await dataSource.query(fullQuery, queryParams);
    detallesCreados += chunk.length;
  }

  // 5. Recalcular totales de proformas sin monto (donde total = 0) a partir de sus detalles
  console.log('Recalculando totales de proformas con valor $0 desde sus detalles...');
  await dataSource.query(`
    UPDATE proformas p
    SET total = sub.sum_total
    FROM (
      SELECT "proformaId", ROUND(SUM(total), 2) as sum_total
      FROM proforma_detalle
      GROUP BY "proformaId"
    ) sub
    WHERE p.id = sub."proformaId" AND (p.total = 0 OR p.total IS NULL);
  `);



  // Ajustar secuencias de ID en PostgreSQL
  await dataSource.query(`SELECT setval('proformas_id_seq', (SELECT MAX(id) FROM proformas));`);
  await dataSource.query(`SELECT setval('proforma_detalle_id_seq', (SELECT MAX(id) FROM proforma_detalle));`);

  console.log('\n======================================================');
  console.log('  MIGRACIÓN COMPLETADA CON ÉXITO: PROFORMAS (VALORES REVISADOS)');
  console.log(`  - Total Proformas Cabecera: ${proformasCreadas}`);
  console.log(`  - Total Proformas Detalle: ${detallesCreados}`);
  console.log('======================================================\n');
}

// Permitir ejecución directa del script
if (require.main === module) {
  migrateProformasModule()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error fatal en migración de proformas:', err);
      process.exit(1);
    });
}
