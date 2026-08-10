import { getAppDataSource } from './config';
import { TrabajoLaboratorio } from '../../src/trabajos_laboratorios/entities/trabajo_laboratorio.entity';
import { cleanString, cleanDate } from './utils/formatters';
import * as fs from 'fs';
const mdb = require('mdb-reader');

async function testFullPagoTrabajos() {
  const dataSource = await getAppDataSource();

  const trabajos = await dataSource.getRepository(TrabajoLaboratorio).find({
    relations: ['laboratorio', 'paciente', 'precioLaboratorio']
  });

  const trabajoByAccessId = new Map<string, number>();
  trabajos.forEach(t => {
    if (t.access_id) trabajoByAccessId.set(t.access_id.toUpperCase().trim(), t.id);
  });

  // Map of candidate list by (pacienteId + '_' + labId)
  const candidateMap = new Map<string, TrabajoLaboratorio[]>();
  trabajos.forEach(t => {
    if (t.idPaciente && t.idLaboratorio) {
      const key = `${t.idPaciente}_${t.idLaboratorio}`;
      if (!candidateMap.has(key)) candidateMap.set(key, []);
      candidateMap.get(key)!.push(t);
    }
  });

  const mdbPath = 'd:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb';
  const MDBReader = mdb.default || mdb;
  const buffer = fs.readFileSync(mdbPath);
  const reader = new MDBReader(buffer);

  const table = reader.getTable('Pago_Trabajos');
  const rows = table.getData();

  let matchedByAccessId = 0;
  let matchedBySmartMatch = 0;
  let unmatched = 0;

  rows.forEach((r: any) => {
    const rawIdTrab = cleanString(r.IdTrabajo).toUpperCase();
    let trabajoId = (rawIdTrab && rawIdTrab !== '.') ? trabajoByAccessId.get(rawIdTrab) : null;

    if (trabajoId) {
      matchedByAccessId++;
    } else {
      // Find candidate in trabajos
      const pacName = cleanString(r.Paciente).toUpperCase().replace(/\s+/g, ' ');
      const labName = cleanString(r.Laboratorio).toUpperCase().trim();
      const pz = cleanString(r.Pieza);

      const candidate = trabajos.find(t => {
        const pName = t.paciente ? `${t.paciente.paterno} ${t.paciente.nombre}`.toUpperCase().replace(/\s+/g, ' ') : '';
        const lName = t.laboratorio ? t.laboratorio.laboratorio.toUpperCase().trim() : '';

        if (!pName || !lName) return false;
        const matchP = pName.includes(pacName) || pacName.includes(pName);
        const matchL = lName.includes(labName) || labName.includes(lName);
        const matchPieza = !pz || !t.pieza || t.pieza.includes(pz) || pz.includes(t.pieza);

        return matchP && matchL && matchPieza;
      });

      if (candidate) {
        matchedBySmartMatch++;
      } else {
        unmatched++;
      }
    }
  });

  console.log(`--- RESULTADOS DE MATCHING PAGO_TRABAJOS ---`);
  console.log(`Total registros: ${rows.length}`);
  console.log(`Coincidencias por IdTrabajo (Access ID): ${matchedByAccessId}`);
  console.log(`Coincidencias inteligentes (Paciente/Lab/Pieza): ${matchedBySmartMatch}`);
  console.log(`Total vinculados: ${matchedByAccessId + matchedBySmartMatch}`);
  console.log(`Sin vinculo (idTrabajo nulo): ${unmatched}`);

  process.exit(0);
}

testFullPagoTrabajos();
