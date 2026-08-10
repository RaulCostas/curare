import { getAppDataSource } from './config';
import { TrabajoLaboratorio } from '../../src/trabajos_laboratorios/entities/trabajo_laboratorio.entity';
import { FormaPago } from '../../src/forma_pago/entities/forma_pago.entity';
import { cleanString } from './utils/formatters';
import * as fs from 'fs';
const mdb = require('mdb-reader');

async function testPagoTrabajosMatching() {
  const dataSource = await getAppDataSource();

  const trabajos = await dataSource.getRepository(TrabajoLaboratorio).find({
    relations: ['laboratorio', 'paciente', 'precioLaboratorio']
  });

  const trabajoByAccessId = new Map<string, number>();
  trabajos.forEach(t => {
    if (t.access_id) trabajoByAccessId.set(t.access_id.toUpperCase().trim(), t.id);
  });

  const formas = await dataSource.getRepository(FormaPago).find();
  console.log('--- FORMAS DE PAGO EN POSTGRESQL ---');
  formas.forEach(f => console.log(`ID: ${f.id} | Forma: "${f.forma_pago}"`));

  function findFormaPagoId(nombreStr: string): number {
    if (!nombreStr) return 1; // Default Efectivo
    const str = nombreStr.toUpperCase().trim();
    for (const f of formas) {
      if (f.forma_pago.toUpperCase().includes(str) || str.includes(f.forma_pago.toUpperCase())) return f.id;
    }
    return 1;
  }

  const mdbPath = 'd:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb';
  const MDBReader = mdb.default || mdb;
  const buffer = fs.readFileSync(mdbPath);
  const reader = new MDBReader(buffer);

  const table = reader.getTable('Pago_Trabajos');
  const rows = table.getData();

  console.log(`\nTotal filas en Pago_Trabajos: ${rows.length}`);

  let matchedByAccessId = 0;
  let matchedByDetails = 0;
  let unmatched = 0;

  rows.forEach((r: any) => {
    const rawIdTrab = cleanString(r.IdTrabajo).toUpperCase();
    let trabajoId = (rawIdTrab && rawIdTrab !== '.') ? trabajoByAccessId.get(rawIdTrab) : null;

    if (trabajoId) {
      matchedByAccessId++;
    } else {
      // Try matching by Paciente + Laboratorio + Trabajo/Pieza/Fecha
      const pacName = cleanString(r.Paciente).toUpperCase().replace(/\s+/g, ' ');
      const labName = cleanString(r.Laboratorio).toUpperCase().trim();
      const trabName = cleanString(r.Trabajo).toUpperCase().trim();

      const candidate = trabajos.find(t => {
        const pName = t.paciente ? `${t.paciente.paterno} ${t.paciente.nombre}`.toUpperCase().replace(/\s+/g, ' ') : '';
        const lName = t.laboratorio ? t.laboratorio.laboratorio.toUpperCase().trim() : '';
        const prName = t.precioLaboratorio ? t.precioLaboratorio.detalle.toUpperCase().trim() : '';

        const matchP = pName && (pName.includes(pacName) || pacName.includes(pName));
        const matchL = lName && (lName.includes(labName) || labName.includes(lName));
        const matchT = !trabName || (prName && (prName.includes(trabName) || trabName.includes(prName)));

        return matchP && matchL && matchT;
      });

      if (candidate) {
        matchedByDetails++;
      } else {
        unmatched++;
      }
    }
  });

  console.log(`Coincidencias por IdTrabajo (Access ID): ${matchedByAccessId}`);
  console.log(`Coincidencias secundarias por Detalle (Paciente/Lab): ${matchedByDetails}`);
  console.log(`Sin coincidencia: ${unmatched}`);

  process.exit(0);
}

testPagoTrabajosMatching();
