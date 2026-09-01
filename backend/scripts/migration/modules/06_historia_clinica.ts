import { getAppDataSource, getMdbReader } from '../config';
import { cleanString, cleanDate, parseBoolean, parseCurrency } from '../utils/formatters';
import { HistoriaClinica } from '../../../src/historia_clinica/entities/historia_clinica.entity';
import { Paciente } from '../../../src/pacientes/entities/paciente.entity';
import { Doctor } from '../../../src/doctors/entities/doctor.entity';
import { Personal } from '../../../src/personal/entities/personal.entity';
import { Especialidad } from '../../../src/especialidad/entities/especialidad.entity';
import { Proforma } from '../../../src/proformas/entities/proforma.entity';
import { ProformaDetalle } from '../../../src/proformas/entities/proforma-detalle.entity';

export async function migrateHistoriaClinicaModule() {
  console.log('\n======================================================');
  console.log('  INICIANDO MIGRACIÓN: HISTORIA CLÍNICA');
  console.log('======================================================\n');

  const dataSource = await getAppDataSource();
  const reader = getMdbReader();

  // 1. Limpiar la tabla en PostgreSQL
  console.log('Limpiando tabla historia_clinica en PostgreSQL...');
  await dataSource.query('TRUNCATE TABLE "historia_clinica" RESTART IDENTITY CASCADE;');

  // 2. Cargar mapas auxiliares desde PostgreSQL
  console.log('Cargando mapas auxiliares (Pacientes, Doctores, Personal, Especialidades, Proformas)...');

  // Mapa de Pacientes ID -> boolean
  const pgPacientes = await dataSource.getRepository(Paciente).find({ select: ['id'] });
  const pacienteIdsSet = new Set<number>(pgPacientes.map(p => p.id));

  // Map de Pacientes por Nombre Completo para fallback
  const pacienteRowsMdb = reader.getTable('Paciente').getData();
  const patientNameToIdMap = new Map<string, number>();
  for (const p of pacienteRowsMdb) {
    const rawP = p.IdPaciente ? p.IdPaciente.toString().trim().replace(/^P-/i, '') : '';
    const numP = parseInt(rawP, 10);
    const fullName = `${p.Paterno || ''} ${p.Materno || ''} ${p.Nombre || ''}`.replace(/\s+/g, ' ').trim().toUpperCase();
    if (!isNaN(numP) && fullName) {
      patientNameToIdMap.set(fullName, numP);
    }
  }

  // Mapa de Doctores en PG
  const pgDoctores = await dataSource.getRepository(Doctor).find();

  function findDoctorId(docStr: string): number | null {
    if (!docStr) return null;
    const str = docStr.trim().toUpperCase();
    if (!str || str === 'SOLO' || str === 'SOLA') return null;

    // Búsqueda en doctores
    for (const d of pgDoctores) {
      const full1 = `${d.nombre} ${d.paterno} ${d.materno || ''}`.toUpperCase();
      const full2 = `${d.paterno} ${d.materno || ''} ${d.nombre}`.toUpperCase();
      const full3 = `${d.paterno} ${d.nombre}`.toUpperCase();

      if (full1.includes(str) || full2.includes(str) || full3.includes(str) || str.includes(d.paterno.toUpperCase())) {
        return d.id;
      }
    }
    return null;
  }

  // Mapa de Personal en PG
  const pgPersonal = await dataSource.getRepository(Personal).find();
  const personalMapByInitials = new Map<string, number>();

  for (const p of pgPersonal) {
    const fullname = `${p.nombre} ${p.paterno} ${p.materno || ''}`.toUpperCase();
    if (fullname.includes('HERRERA CASTRO') && fullname.includes('OSCAR')) {
      personalMapByInitials.set('JH', p.id);
      personalMapByInitials.set('JUAN', p.id);
      personalMapByInitials.set('JUAN HERRERA', p.id);
    }
    if (fullname.includes('LUNA ARNEZ')) {
      personalMapByInitials.set('LL', p.id);
      personalMapByInitials.set('LAURA', p.id);
    }
    if (fullname.includes('HERRERA CASTRO') && fullname.includes('ANGELICA')) {
      personalMapByInitials.set('RH', p.id);
      personalMapByInitials.set('ROSMARY', p.id);
      personalMapByInitials.set('ROSEMARY', p.id);
      personalMapByInitials.set('ROSMARY HERRERA', p.id);
    }
    if (fullname.includes('PAZ YUJRA')) {
      personalMapByInitials.set('DP', p.id);
    }
    if (fullname.includes('MARTINEZ ARELLANO')) {
      personalMapByInitials.set('MM', p.id);
      personalMapByInitials.set('MAYRA', p.id);
    }
    if (fullname.includes('MENDOZA MAMANI')) {
      personalMapByInitials.set('RM', p.id);
    }
    if (fullname.includes('VILLEGAS QUIROGA')) {
      personalMapByInitials.set('AV', p.id);
      personalMapByInitials.set('AQV', p.id);
    }
    if (fullname.includes('URIA TARIFA')) {
      personalMapByInitials.set('MR', p.id);
      personalMapByInitials.set('MARIA RENE', p.id);
      personalMapByInitials.set('MARIA RENEE', p.id);
    }
    if (fullname.includes('MURILLO CASTILLO')) {
      personalMapByInitials.set('PM', p.id);
      personalMapByInitials.set('PATRICIA', p.id);
    }
    if (fullname.includes('VILLALOBOS')) {
      personalMapByInitials.set('MV', p.id);
      personalMapByInitials.set('MARCELO', p.id);
    }
  }

  function findPersonalId(asisStr: string): number | null {
    if (!asisStr) return null;
    let str = asisStr.trim().toUpperCase();
    if (!str) return null;

    // Si viene combinado tipo "JH RH", tomar el primero "JH"
    if (str.includes(' ')) {
      const parts = str.split(/\s+/);
      for (const p of parts) {
        if (personalMapByInitials.has(p)) {
          return personalMapByInitials.get(p)!;
        }
      }
    }

    if (personalMapByInitials.has(str)) {
      return personalMapByInitials.get(str)!;
    }

    for (const p of pgPersonal) {
      const fullname = `${p.nombre} ${p.paterno} ${p.materno || ''}`.toUpperCase();
      if (fullname.includes(str) || str.includes(p.paterno.toUpperCase())) {
        return p.id;
      }
    }
    return null;
  }

  // Mapa de Especialidades en PG
  const pgEspecialidades = await dataSource.getRepository(Especialidad).find();

  function findEspecialidadId(tratStr: string): number | null {
    if (!tratStr) return null;
    const str = tratStr.trim().toUpperCase();
    if (!str) return null;

    let targetName = '';
    if (str === 'OP' || str.includes('ESTET') || str.includes('BLANC') || str.includes('LASER')) {
      targetName = 'ESTETICA';
    } else if (str === 'REAB' || str.includes('REHAB')) {
      targetName = 'REHABILITACION';
    } else if (str === 'PERIO' || str.includes('PERIO')) {
      targetName = 'PERIODONCIA';
    } else if (str === 'ENDO' || str.includes('ENDO')) {
      targetName = 'ENDODONCIA';
    } else if (str === 'CIR' || str.includes('CIRUG')) {
      targetName = 'CIRUGIA';
    } else if (str === 'IMP' || str.includes('IMPLANT')) {
      targetName = 'REHABILITACION';
    }

    if (targetName) {
      const match = pgEspecialidades.find(e => e.especialidad.toUpperCase().includes(targetName));
      if (match) return match.id;
    }

    // Direct match
    for (const e of pgEspecialidades) {
      if (e.especialidad.toUpperCase().includes(str)) {
        return e.id;
      }
    }
    return pgEspecialidades.length > 0 ? pgEspecialidades[0].id : null;
  }

  // Mapa de Proformas en PG: pacId_numero -> id
  const pgProformas = await dataSource.getRepository(Proforma).find({
    select: ['id', 'pacienteId', 'numero'],
  });

  const proformaMap = new Map<string, number>();
  for (const pr of pgProformas) {
    proformaMap.set(`${pr.pacienteId}_${pr.numero}`, pr.id);
  }

  // Mapa de ProformaDetalles en PG: proformaId -> lista de detalles
  const pgProformaDetalles = await dataSource.getRepository(ProformaDetalle).find({
    relations: ['arancel'],
  });

  const proformaDetallesByProId = new Map<number, ProformaDetalle[]>();
  for (const d of pgProformaDetalles) {
    if (!proformaDetallesByProId.has(d.proformaId)) {
      proformaDetallesByProId.set(d.proformaId, []);
    }
    proformaDetallesByProId.get(d.proformaId)!.push(d);
  }

  // 3. Leemos Historial_Odonto desde Access
  const historyTable = reader.getTable('Historial_Odonto');
  const historyRows: any[] = historyTable.getData();
  console.log(`Se encontraron ${historyRows.length} registros en Historial_Odonto de Access.`);

  const historyToInsert: any[] = [];
  const now = new Date().toISOString();

  for (const r of historyRows) {
    const rawIdHist = cleanString(r.IdHistorial_Odonto);
    const numIdHist = parseInt(rawIdHist.replace(/^HL-/i, ''), 10);

    const rawIdPac = cleanString(r.IdPaciente);
    const numIdPac = parseInt(rawIdPac.replace(/^P-/i, ''), 10);
    const pacienteId = (!isNaN(numIdPac) && pacienteIdsSet.has(numIdPac)) ? numIdPac : null;

    if (!pacienteId) continue; // Si no hay paciente válido, omitir

    const fecha = cleanDate(r.FechaCita || r.fnum2) || now.split('T')[0];
    const pieza = cleanString(r.Pieza);
    const cantidad = parseInt(cleanString(r.Cantidad), 10) || 1;

    const tratamientoName = cleanString(r.Tratamiento);
    const codigoTrat = cleanString(r.Codigo_Tratamiento);
    const observaciones = cleanString(r.Observaciones);

    const doctorId = findDoctorId(cleanString(r.Doctor));
    const personalId = findPersonalId(cleanString(r.Asistente));
    const especialidadId = findEspecialidadId(cleanString(r.Trat));

    const numHojaStr = cleanString(r.Numero_Hoja, '0');
    const hoja = parseInt(numHojaStr, 10) || 0;

    const estadoTratamiento = cleanString(r.Estado_Tratamiento).toLowerCase() === 'terminado' ? 'terminado' : 'no terminado';
    const estadoPresupuesto = cleanString(r.Estado_Presupuesto).toLowerCase() === 'terminado' ? 'terminado' : 'no terminado';

    const planTratStr = cleanString(r.Plan_Tratamiento, '01');
    const planTratNum = parseInt(planTratStr, 10) || 1;

    // Buscar proformaId
    const proformaId = proformaMap.get(`${pacienteId}_${planTratNum}`) || null;

    // Buscar proformaDetalleId
    let proformaDetalleId: number | null = null;
    let detalleTotal: number | null = null;
    let detalleDescuento: number = 0;

    if (proformaId && proformaDetallesByProId.has(proformaId)) {
      const detalles = proformaDetallesByProId.get(proformaId)!;

      // 1. Coincidencia por Código de Arancel Y Pieza
      if (codigoTrat && pieza) {
        const matchCodeAndPieza = detalles.find(d => d.arancel && d.arancel.codigo === codigoTrat && d.piezas && d.piezas.includes(pieza));
        if (matchCodeAndPieza) {
          proformaDetalleId = matchCodeAndPieza.id;
          detalleTotal = Number(matchCodeAndPieza.total || 0);
          detalleDescuento = Number(matchCodeAndPieza.descuento || 0);
        }
      }

      // 2. Coincidencia por Código de Arancel si no hubo coincidencia con pieza
      if (!proformaDetalleId && codigoTrat) {
        const matchCode = detalles.find(d => d.arancel && d.arancel.codigo === codigoTrat);
        if (matchCode) {
          proformaDetalleId = matchCode.id;
          detalleTotal = Number(matchCode.total || 0);
          detalleDescuento = Number(matchCode.descuento || 0);
        }
      }

      // 3. Coincidencia por Pieza si no coincidió por código
      if (!proformaDetalleId && pieza) {
        const matchPieza = detalles.find(d => d.piezas && d.piezas.includes(pieza));
        if (matchPieza) {
          proformaDetalleId = matchPieza.id;
          detalleTotal = Number(matchPieza.total || 0);
          detalleDescuento = Number(matchPieza.descuento || 0);
        }
      }
    }

    const resaltar = parseBoolean(r.Resaltado);
    const casoClinico = parseBoolean(r.Caso_Clinico);
    const pagado = 'NO';
    
    // Preservar el precio de Historial_Odonto menos el descuento de proforma_detalle.
    let precio = parseCurrency(r.Precio);
    if ((!precio || precio === 0) && proformaDetalleId !== null && detalleTotal !== null) {
      precio = detalleTotal;
    } else if (precio > 0 && detalleDescuento > 0) {
      precio = precio * (1 - (detalleDescuento / 100));
    }

    if (precio) {
      precio = Math.round(precio * 100) / 100;
    }

    const accessPlanPagosId = cleanString(r.IdPlan_Pagos);
    const accessTrabajosDoctoresId = cleanString(r.IdTrabajos_Doctores);

    historyToInsert.push({
      id: !isNaN(numIdHist) ? numIdHist : undefined,
      access_id: rawIdHist,
      access_plan_pagos_id: accessPlanPagosId,
      access_trabajos_doctores_id: accessTrabajosDoctoresId,
      pacienteId,
      fecha,
      pieza,
      cantidad,
      proformaDetalleId,
      observaciones,
      especialidadId,
      doctorId,
      personalId,
      hoja,
      estadoTratamiento,
      estadoPresupuesto,
      proformaId,
      tratamiento: tratamientoName,
      resaltar,
      casoClinico,
      pagado,
      precio,
    });
  }

  // 4. Insertar en lotes en PostgreSQL
  console.log(`\nInsertando ${historyToInsert.length} registros de historia clínica en PostgreSQL...`);
  const BATCH_SIZE = 500;
  let insertados = 0;

  for (let i = 0; i < historyToInsert.length; i += BATCH_SIZE) {
    const chunk = historyToInsert.slice(i, i + BATCH_SIZE);
    const sqlInsert = `
      INSERT INTO historia_clinica (
        id, access_id, access_plan_pagos_id, access_trabajos_doctores_id,
        "pacienteId", fecha, pieza, cantidad, "proformaDetalleId", observaciones,
        "especialidadId", "doctorId", "personalId", hoja, "estadoTratamiento",
        "estadoPresupuesto", "proformaId", tratamiento, "Resaltar", "Caso_Clinico",
        pagado, precio, "createdAt", "updatedAt"
      ) VALUES 
    `;

    const valuePlaceholders: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    for (const item of chunk) {
      const rowParams = [
        item.id,
        item.access_id,
        item.access_plan_pagos_id,
        item.access_trabajos_doctores_id,
        item.pacienteId,
        item.fecha,
        item.pieza,
        item.cantidad,
        item.proformaDetalleId,
        item.observaciones,
        item.especialidadId,
        item.doctorId,
        item.personalId,
        item.hoja,
        item.estadoTratamiento,
        item.estadoPresupuesto,
        item.proformaId,
        item.tratamiento,
        item.resaltar,
        item.casoClinico,
        item.pagado,
        item.precio,
        now,
        now,
      ];

      const placeholders = rowParams.map(() => `$${paramIndex++}`).join(', ');
      valuePlaceholders.push(`(${placeholders})`);
      queryParams.push(...rowParams);
    }

    const fullQuery = sqlInsert + valuePlaceholders.join(', ') + ';';
    await dataSource.query(fullQuery, queryParams);
    insertados += chunk.length;
  }

  // Ajustar secuencia de ID en PostgreSQL
  await dataSource.query(`SELECT setval('historia_clinica_id_seq', (SELECT MAX(id) FROM historia_clinica));`);

  console.log('\n======================================================');
  console.log('  MIGRACIÓN COMPLETADA CON ÉXITO: HISTORIA CLÍNICA');
  console.log(`  - Total Registros Migrados: ${insertados}`);
  console.log('======================================================\n');
}

// Permitir ejecución directa del script
if (require.main === module) {
  migrateHistoriaClinicaModule()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error fatal en migración de historia clínica:', err);
      process.exit(1);
    });
}
