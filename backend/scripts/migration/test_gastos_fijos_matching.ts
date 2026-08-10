import { getAppDataSource } from './config';
import { FormaPago } from '../../src/forma_pago/entities/forma_pago.entity';
import { cleanString, parseCurrency } from './utils/formatters';
import * as fs from 'fs';
const mdb = require('mdb-reader');

async function testGastosFijosMatching() {
  const dataSource = await getAppDataSource();

  const mdbPath = 'd:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb';
  const MDBReader = mdb.default || mdb;
  const buffer = fs.readFileSync(mdbPath);
  const reader = new MDBReader(buffer);

  const gfTable = reader.getTable('Gastos_Fijos');
  const gfRows = gfTable.getData();
  console.log(`--- GASTOS_FIJOS DE ACCESS (${gfRows.length} filas) ---`);

  const gfMapByMessage = new Map<string, string>();
  gfRows.forEach((r: any) => {
    const msg = cleanString(r.Mensaje).toUpperCase().trim();
    if (msg) gfMapByMessage.set(msg, r.Id);
  });

  const pgfTable = reader.getTable('Pago_Gasto_Fijo');
  const pgfRows = pgfTable.getData();
  console.log(`\n--- PAGO_GASTO_FIJO DE ACCESS (${pgfRows.length} filas) ---`);

  const formas = await dataSource.getRepository(FormaPago).find();
  console.log('Formas de Pago en PostgreSQL:', formas.map(f => `${f.id}:${f.forma_pago}`));

  function findFormaPagoId(str: string): number {
    if (!str) return 1;
    const s = str.toUpperCase().trim();
    for (const f of formas) {
      if (f.forma_pago.toUpperCase().includes(s) || s.includes(f.forma_pago.toUpperCase())) return f.id;
    }
    return 1;
  }

  let matchedGasto = 0;
  let unmatchedGasto = 0;
  const unmatchedDetails = new Set<string>();

  pgfRows.forEach((r: any) => {
    const det = cleanString(r.Detalle).toUpperCase().trim();
    let foundId = gfMapByMessage.get(det);

    if (!foundId) {
      for (const [k, id] of gfMapByMessage.entries()) {
        if (k.includes(det) || det.includes(k)) {
          foundId = id;
          break;
        }
      }
    }

    if (foundId) {
      matchedGasto++;
    } else {
      unmatchedGasto++;
      unmatchedDetails.add(det);
    }
  });

  console.log(`\nCoincidencias en Gasto Fijo: ${matchedGasto} / ${pgfRows.length}`);
  console.log(`Sin coincidencia en Gasto Fijo: ${unmatchedGasto}`);
  if (unmatchedDetails.size > 0) {
    console.log('Muestra de detalles sin coincidencia (10 primeros):', Array.from(unmatchedDetails).slice(0, 10));
  }

  process.exit(0);
}

testGastosFijosMatching();
