import { getAppDataSource } from '../config';
import { ProximaCita } from '../../../src/proxima_cita/entities/proxima_cita.entity';
import { SecuenciaTratamiento } from '../../../src/secuencia_tratamiento/entities/secuencia_tratamiento.entity';
import { Paciente } from '../../../src/pacientes/entities/paciente.entity';
import { Proforma } from '../../../src/proformas/entities/proforma.entity';
import { ProformaDetalle } from '../../../src/proformas/entities/proforma-detalle.entity';
import { Doctor } from '../../../src/doctors/entities/doctor.entity';
import { cleanString, cleanDate } from '../utils/formatters';
import * as path from 'path';
import * as fs from 'fs';
const mdb = require('mdb-reader');

export async function migrateProximaCitaSecuencia() {
  console.log('\n======================================================');
  console.log('  INICIANDO MIGRACIÓN: PRÓXIMA CITA Y SECUENCIA TRATAMIENTO');
  console.log('======================================================\n');

  const dataSource = await getAppDataSource();

  // 1. Limpiar tablas
  console.log('Conexión a PostgreSQL establecida correctamente.');
  console.log('Limpiando tablas proxima_cita y secuencia_tratamiento en PostgreSQL...');
  await dataSource.query('TRUNCATE TABLE "proxima_cita" RESTART IDENTITY CASCADE;');
  await dataSource.query('TRUNCATE TABLE "secuencia_tratamiento" RESTART IDENTITY CASCADE;');

  // 2. Cargar mapas auxiliares
  console.log('Cargando mapas auxiliares (Pacientes, Proformas, Detalles, Doctores)...');

  const pacs = await dataSource.getRepository(Paciente).find({ select: ['id'] });
  const pacienteIdsSet = new Set<number>(pacs.map(p => p.id));

  const proformas = await dataSource.getRepository(Proforma).find({ select: ['id', 'pacienteId', 'numero'] });
  const proformaMap = new Map<string, number>();
  for (const pr of proformas) {
    proformaMap.set(`${pr.pacienteId}_${pr.numero}`, pr.id);
  }

  const detalles = await dataSource.getRepository(ProformaDetalle).find({ relations: ['arancel'] });
  const detallesByProId = new Map<number, ProformaDetalle[]>();
  for (const d of detalles) {
    if (!detallesByProId.has(d.proformaId)) detallesByProId.set(d.proformaId, []);
    detallesByProId.get(d.proformaId)!.push(d);
  }

  const doctores = await dataSource.getRepository(Doctor).find();

  function findDoctorId(nombre: string): number | null {
    if (!nombre) return null;
    const str = nombre.toUpperCase().trim();

    // 1. Exact / Full match
    for (const d of doctores) {
      const full = `${d.paterno} ${d.materno} ${d.nombre}`.toUpperCase();
      if (full.includes(str) || str.includes(full)) return d.id;
      if (str.includes(d.paterno.toUpperCase()) && str.includes(d.nombre.toUpperCase())) return d.id;
    }

    // 2. Partial match
    for (const d of doctores) {
      const p1 = d.paterno.toUpperCase();
      const n1 = d.nombre.toUpperCase();
      if (str.includes(p1) || str.includes(n1)) return d.id;
    }

    return null;
  }

  // 3. Abrir MDB Access
  const mdbPath = 'd:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb';
  if (!fs.existsSync(mdbPath)) {
    throw new Error(`No se encontró la base de datos Access en: ${mdbPath}`);
  }

  const MDBReader = mdb.default || mdb;
  const buffer = fs.readFileSync(mdbPath);
  const reader = new MDBReader(buffer);

  const now = new Date().toISOString();

  // ----------------------------------------------------
  // 4. MIGRAR PROXIMA_CITA
  // ----------------------------------------------------
  const proxTable = reader.getTable('Proxima_Cita');
  const proxRows = proxTable.getData();
  console.log(`Se encontraron ${proxRows.length} registros en Proxima_Cita de Access.`);

  const proxToInsert: any[] = [];

  for (const r of proxRows) {
    const rawId = cleanString(r.Id);
    const numId = parseInt(rawId.replace(/^Px-/i, ''), 10);

    const rawIdPac = cleanString(r.IdPaciente);
    const numIdPac = parseInt(rawIdPac.replace(/^[PH]-/i, ''), 10);
    const pacienteId = (!isNaN(numIdPac) && pacienteIdsSet.has(numIdPac)) ? numIdPac : null;

    if (!pacienteId) continue;

    const planTratNum = parseInt(cleanString(r.Plan_Tratamiento), 10);
    const proformaId = (!isNaN(planTratNum) && proformaMap.has(`${pacienteId}_${planTratNum}`))
      ? proformaMap.get(`${pacienteId}_${planTratNum}`)!
      : null;

    const fecha = cleanDate(r.FechaPro || r.fnum3) || now.split('T')[0];
    const pieza = cleanString(r.PT1);
    const pt2Desc = cleanString(r.PT2);
    const observaciones = cleanString(r.PT3);
    const doctorId = findDoctorId(cleanString(r.Doctor));

    // Buscar proformaDetalleId usando PT2 (descripción del tratamiento o código)
    let proformaDetalleId: number | null = null;
    if (proformaId && pt2Desc && detallesByProId.has(proformaId)) {
      const pt2Upper = pt2Desc.toUpperCase();
      const matchDetalle = detallesByProId.get(proformaId)!.find(d => {
        if (!d.arancel) return false;
        const cod = d.arancel.codigo ? d.arancel.codigo.toUpperCase() : '';
        const det = d.arancel.detalle ? d.arancel.detalle.toUpperCase() : '';
        return (cod && pt2Upper.includes(cod)) || (det && (pt2Upper.includes(det) || det.includes(pt2Upper)));
      });
      if (matchDetalle) {
        proformaDetalleId = matchDetalle.id;
      }
    }

    proxToInsert.push({
      id: !isNaN(numId) ? numId : undefined,
      access_id: rawId,
      pacienteId,
      proformaId,
      fecha,
      pieza,
      proformaDetalleId,
      observaciones,
      doctorId,
      estado: 'pendiente'
    });
  }

  console.log(`Insertando ${proxToInsert.length} registros de próxima cita en PostgreSQL...`);
  const chunkSize = 2000;
  for (let i = 0; i < proxToInsert.length; i += chunkSize) {
    const chunk = proxToInsert.slice(i, i + chunkSize);
    await dataSource.getRepository(ProximaCita).insert(chunk);
    console.log(`  -> Insertadas ${Math.min(i + chunkSize, proxToInsert.length)} / ${proxToInsert.length} próximas citas...`);
  }

  // ----------------------------------------------------
  // 5. MIGRAR SECUENCIA_TRAT
  // ----------------------------------------------------
  const secTable = reader.getTable('Secuencia_Trat');
  const secRows = secTable.getData();
  console.log(`\nSe encontraron ${secRows.length} registros en Secuencia_Trat de Access.`);

  const secToInsert: any[] = [];

  for (const r of secRows) {
    const rawId = cleanString(r.Id);
    const numId = parseInt(rawId.replace(/^ST-/i, ''), 10);

    const rawIdPac = cleanString(r.IdPaciente);
    const numIdPac = parseInt(rawIdPac.replace(/^[PH]-/i, ''), 10);
    const pacienteId = (!isNaN(numIdPac) && pacienteIdsSet.has(numIdPac)) ? numIdPac : null;

    if (!pacienteId) continue;

    const planTratNum = parseInt(cleanString(r.Plan_Tratamiento), 10);
    const proformaId = (!isNaN(planTratNum) && proformaMap.has(`${pacienteId}_${planTratNum}`))
      ? proformaMap.get(`${pacienteId}_${planTratNum}`)!
      : null;

    const fecha = cleanDate(r.FechaST || r.fnum1) || now.split('T')[0];

    secToInsert.push({
      id: !isNaN(numId) ? numId : undefined,
      access_id: rawId,
      pacienteId,
      proformaId,
      fecha,
      periodoncia: cleanString(r.ST1),
      cirugia: cleanString(r.ST2),
      endodoncia: cleanString(r.ST3),
      operatoria: cleanString(r.ST4),
      protesis: cleanString(r.ST5),
      implantes: cleanString(r.ST6),
      ortodoncia: cleanString(r.ST7),
      odontopediatria: cleanString(r.ST8)
    });
  }

  console.log(`Insertando ${secToInsert.length} registros de secuencia de tratamiento en PostgreSQL...`);
  for (let i = 0; i < secToInsert.length; i += chunkSize) {
    const chunk = secToInsert.slice(i, i + chunkSize);
    await dataSource.getRepository(SecuenciaTratamiento).insert(chunk);
    console.log(`  -> Insertadas ${Math.min(i + chunkSize, secToInsert.length)} / ${secToInsert.length} secuencias de tratamiento...`);
  }

  console.log('\n======================================================');
  console.log('  MIGRACIÓN COMPLETADA CON ÉXITO: PRÓXIMA CITA Y SECUENCIA TRATAMIENTO');
  console.log(`  - Próximas Citas migradas: ${proxToInsert.length}`);
  console.log(`  - Secuencias de Tratamiento migradas: ${secToInsert.length}`);
  console.log('======================================================\n');
}

if (require.main === module) {
  migrateProximaCitaSecuencia()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error durante la migración:', err);
      process.exit(1);
    });
}
