import { getAppDataSource, getMdbReader } from './config';
import { cleanString, cleanDate } from './utils/formatters';

async function testMatchPDetalle() {
  const ds = await getAppDataSource();
  const reader = getMdbReader();

  const hcRows = await ds.query('SELECT id, access_trabajos_doctores_id, "pacienteId", fecha, pieza, tratamiento, "doctorId", pagado FROM historia_clinica;');
  console.log('Total historia_clinica en PG:', hcRows.length);

  const hcMapByAccessId = new Map<string, number>();
  for (const h of hcRows) {
    if (h.access_trabajos_doctores_id) {
      hcMapByAccessId.set(h.access_trabajos_doctores_id.toUpperCase().trim(), h.id);
    }
  }

  const pddTable = reader.getTable('Pago_Doctores_Detalle');
  const pddRows = pddTable.getData();
  console.log('Total Pago_Doctores_Detalle en Access:', pddRows.length);

  let matchedAccessId = 0;
  let matchedSecondary = 0;
  let missing = 0;
  const matchedHcIds = new Set<number>();

  for (const r of pddRows) {
    const rawTrDr = cleanString(r.IdTrabajos_Doctores).toUpperCase().trim();
    const foundId = (rawTrDr && hcMapByAccessId.has(rawTrDr)) ? hcMapByAccessId.get(rawTrDr) : undefined;

    if (foundId !== undefined) {
      matchedAccessId++;
      matchedHcIds.add(foundId);
    } else {
      // Intentar coincidencia secundaria por fecha, tratamiento, etc.
      const r1Fecha = cleanDate(r.R1);
      const r3Trat = cleanString(r.R3).toUpperCase();
      const r4Pieza = cleanString(r.R4);

      const candidate = hcRows.find((h: any) => {
        const matchFecha = r1Fecha && h.fecha && h.fecha.toString().split('T')[0] === r1Fecha;
        const matchTrat = r3Trat && h.tratamiento && h.tratamiento.toUpperCase().includes(r3Trat);
        const matchPieza = !r4Pieza || !h.pieza || h.pieza === r4Pieza;
        return matchFecha && (matchTrat || matchPieza);
      });

      if (candidate) {
        matchedSecondary++;
        matchedHcIds.add(candidate.id);
      } else {
        missing++;
        if (missing <= 5) {
          console.log('Missing sample:', {
            Id: r.Id,
            IdTrabajos_Doctores: r.IdTrabajos_Doctores,
            R1: r.R1,
            R2: r.R2,
            R3: r.R3,
            R4: r.R4,
          });
        }
      }
    }
  }

  console.log(`Matching Summary:`);
  console.log(`- Matched by IdTrabajos_Doctores: ${matchedAccessId}`);
  console.log(`- Matched by Secondary Fields: ${matchedSecondary}`);
  console.log(`- Total Matched: ${matchedAccessId + matchedSecondary} / ${pddRows.length}`);
  console.log(`- Missing: ${missing}`);
  console.log(`- Total Registros de Historia Clínica a marcar como pagado='SI': ${matchedHcIds.size}`);

  process.exit(0);
}

testMatchPDetalle().catch(console.error);
