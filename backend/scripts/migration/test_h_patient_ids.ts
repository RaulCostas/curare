import { getAppDataSource } from './config';
import { Paciente } from '../../src/pacientes/entities/paciente.entity';
import { cleanString } from './utils/formatters';
const mdb = require('mdb-reader');
const fs = require('fs');

async function testHPatientIDs() {
  const dataSource = await getAppDataSource();
  const pacs = await dataSource.getRepository(Paciente).find({ select: ['id'] });
  const pacienteIdsSet = new Set<number>(pacs.map(p => p.id));

  const MDBReader = mdb.default || mdb;
  const mdbPath = 'd:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb';
  const buffer = fs.readFileSync(mdbPath);
  const reader = new MDBReader(buffer);

  const proxRows = reader.getTable('Proxima_Cita').getData();

  let hMatches = 0;
  let hTotal = 0;

  proxRows.forEach((r: any) => {
    const rawIdPac = cleanString(r.IdPaciente);
    if (rawIdPac.toUpperCase().startsWith('H-')) {
      hTotal++;
      const numIdPac = parseInt(rawIdPac.replace(/^H-/i, ''), 10);
      if (!isNaN(numIdPac) && pacienteIdsSet.has(numIdPac)) {
        hMatches++;
      }
    }
  });

  console.log(`--- PRUEBA DE IDPACIENTE H- ---`);
  console.log(`Total registros con H-: ${hTotal}`);
  console.log(`Si ignoramos el prefijo 'H-' y buscamos por número, coinciden en Pacientes: ${hMatches}`);

  process.exit(0);
}

testHPatientIDs();
