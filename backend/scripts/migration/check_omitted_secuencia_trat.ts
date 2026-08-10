import { getAppDataSource } from './config';
import { Paciente } from '../../src/pacientes/entities/paciente.entity';
import { cleanString } from './utils/formatters';
const mdb = require('mdb-reader');
const fs = require('fs');

async function checkOmittedSecuenciaTrat() {
  const dataSource = await getAppDataSource();
  const pacs = await dataSource.getRepository(Paciente).find({ select: ['id'] });
  const pacienteIdsSet = new Set<number>(pacs.map(p => p.id));

  const MDBReader = mdb.default || mdb;
  const mdbPath = 'd:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb';
  const buffer = fs.readFileSync(mdbPath);
  const reader = new MDBReader(buffer);

  const secRows = reader.getTable('Secuencia_Trat').getData();

  const omitted: any[] = [];
  const reasons: Record<string, number> = {};

  secRows.forEach((r: any) => {
    const rawIdPac = cleanString(r.IdPaciente);
    const numIdPac = parseInt(rawIdPac.replace(/^[PH]-/i, ''), 10);
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

  console.log(`--- ANÁLISIS DE LAS 5 FILAS OMITIDAS EN SECUENCIA_TRAT ---`);
  console.log(`Total registros en Access: ${secRows.length}`);
  console.log(`Total omitidos: ${omitted.length}`);
  console.log('\nDesglose de motivos:');
  console.log(reasons);

  console.log('\nMuestra de filas omitidas:');
  omitted.forEach(r => console.log(r));

  process.exit(0);
}

checkOmittedSecuenciaTrat();
