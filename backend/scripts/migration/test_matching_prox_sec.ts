import { getAppDataSource } from './config';
import { Paciente } from '../../src/pacientes/entities/paciente.entity';
import { Proforma } from '../../src/proformas/entities/proforma.entity';
import { ProformaDetalle } from '../../src/proformas/entities/proforma-detalle.entity';
import { Doctor } from '../../src/doctors/entities/doctor.entity';
import { cleanString, cleanDate } from './utils/formatters';
const mdb = require('mdb-reader');
const fs = require('fs');

async function testMatchingProxSec() {
  const dataSource = await getAppDataSource();

  const MDBReader = mdb.default || mdb;
  const mdbPath = 'd:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb';
  const buffer = fs.readFileSync(mdbPath);
  const reader = new MDBReader(buffer);

  // Load maps
  const pacs = await dataSource.getRepository(Paciente).find({ select: ['id'] });
  const pacSet = new Set(pacs.map(p => p.id));

  const proformas = await dataSource.getRepository(Proforma).find({ select: ['id', 'pacienteId', 'numero'] });
  const proMap = new Map<string, number>();
  for (const pr of proformas) {
    proMap.set(`${pr.pacienteId}_${pr.numero}`, pr.id);
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
    for (const d of doctores) {
      const full = `${d.paterno} ${d.materno} ${d.nombre}`.toUpperCase();
      if (full.includes(str) || str.includes(d.nombre.toUpperCase())) {
        return d.id;
      }
    }
    return null;
  }

  // 1. Proxima_Cita
  const proxRows = reader.getTable('Proxima_Cita').getData();
  console.log(`Proxima_Cita total: ${proxRows.length}`);
  let matchedProforma = 0;
  let matchedDetalle = 0;
  let matchedDoctor = 0;

  for (let i = 0; i < Math.min(5000, proxRows.length); i++) {
    const r = proxRows[i];
    const rawPac = cleanString(r.IdPaciente);
    const pacId = parseInt(rawPac.replace(/^P-/i, ''), 10);
    if (isNaN(pacId) || !pacSet.has(pacId)) continue;

    const planNum = parseInt(cleanString(r.Plan_Tratamiento), 10);
    const proId = !isNaN(planNum) ? proMap.get(`${pacId}_${planNum}`) || null : null;
    if (proId) matchedProforma++;

    if (proId && detallesByProId.has(proId)) {
      const pt2 = cleanString(r.PT2).toUpperCase();
      if (pt2) {
        const dMatch = detallesByProId.get(proId)!.find(d => 
          (d.arancel && d.arancel.detalle.toUpperCase().includes(pt2)) ||
          pt2.includes(d.arancel?.detalle.toUpperCase() || '')
        );
        if (dMatch) matchedDetalle++;
      }
    }

    const docId = findDoctorId(cleanString(r.Doctor));
    if (docId) matchedDoctor++;
  }

  console.log(`En muestra de 5000: Matched Proforma: ${matchedProforma}, Matched Detalle: ${matchedDetalle}, Matched Doctor: ${matchedDoctor}`);

  // 2. Secuencia_Trat
  const secRows = reader.getTable('Secuencia_Trat').getData();
  console.log(`\nSecuencia_Trat total: ${secRows.length}`);
  let secMatchedProforma = 0;

  for (let i = 0; i < Math.min(5000, secRows.length); i++) {
    const r = secRows[i];
    const rawPac = cleanString(r.IdPaciente);
    const pacId = parseInt(rawPac.replace(/^P-/i, ''), 10);
    if (isNaN(pacId) || !pacSet.has(pacId)) continue;

    const planNum = parseInt(cleanString(r.Plan_Tratamiento), 10);
    const proId = !isNaN(planNum) ? proMap.get(`${pacId}_${planNum}`) || null : null;
    if (proId) secMatchedProforma++;
  }

  console.log(`En muestra de 5000: Matched Secuencia Proforma: ${secMatchedProforma}`);

  process.exit(0);
}

testMatchingProxSec();
