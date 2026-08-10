import { getAppDataSource } from './config';
import { Paciente } from '../../src/pacientes/entities/paciente.entity';
import { cleanString } from './utils/formatters';
const mdb = require('mdb-reader');
const fs = require('fs');

async function checkOmittedProximaCita() {
  const dataSource = await getAppDataSource();
  const pacs = await dataSource.getRepository(Paciente).find({ select: ['id'] });
  const pacienteIdsSet = new Set<number>(pacs.map(p => p.id));

  const MDBReader = mdb.default || mdb;
  const mdbPath = 'd:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb';
  const buffer = fs.readFileSync(mdbPath);
  const reader = new MDBReader(buffer);

  const proxRows = reader.getTable('Proxima_Cita').getData();

  const omitted: any[] = [];
  const reasons: Record<string, number> = {};

  proxRows.forEach((r: any) => {
    const rawIdPac = cleanString(r.IdPaciente);
    const numIdPac = parseInt(rawIdPac.replace(/^P-/i, ''), 10);
    const pacienteId = (!isNaN(numIdPac) && pacienteIdsSet.has(numIdPac)) ? numIdPac : null;

    if (!pacienteId) {
      omitted.push(r);
      let reason = 'Paciente nulo o vacío';
      if (rawIdPac) {
        reason = `IdPaciente '${rawIdPac}' no existe en la tabla Pacientes de PostgreSQL`;
      }
      reasons[reason] = (reasons[reason] || 0) + 1;
    }
  });

  console.log(`--- ANÁLISIS DE LAS 49 FILAS OMITIDAS EN PROXIMA_CITA ---`);
  console.log(`Total registros en Access: ${proxRows.length}`);
  console.log(`Total omitidos: ${omitted.length}`);
  console.log('\nDesglose de motivos:');
  console.log(reasons);

  console.log('\nMuestra de filas omitidas:');
  omitted.slice(0, 10).forEach(r => console.log(r));

  process.exit(0);
}

checkOmittedProximaCita();
