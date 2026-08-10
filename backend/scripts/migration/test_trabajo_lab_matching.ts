import { getAppDataSource } from './config';
import { Laboratorio } from '../../src/laboratorios/entities/laboratorio.entity';
import { Paciente } from '../../src/pacientes/entities/paciente.entity';
import { PrecioLaboratorio } from '../../src/precios_laboratorios/entities/precio-laboratorio.entity';
import { Cubeta } from '../../src/cubetas/entities/cubeta.entity';
import { cleanString } from './utils/formatters';
import * as fs from 'fs';
const mdb = require('mdb-reader');

async function testTrabajoLabMatching() {
  const dataSource = await getAppDataSource();

  // Load maps from PostgreSQL
  const labs = await dataSource.getRepository(Laboratorio).find();
  const labMapByName = new Map<string, number>();
  labs.forEach(l => {
    if (l.laboratorio) labMapByName.set(l.laboratorio.toUpperCase().trim(), l.id);
  });

  const pacs = await dataSource.getRepository(Paciente).find({ select: ['id', 'nombre', 'paterno', 'materno'] });
  const pacMapByName = new Map<string, number>();
  pacs.forEach(p => {
    const full1 = `${p.paterno} ${p.materno} ${p.nombre}`.toUpperCase().trim().replace(/\s+/g, ' ');
    const full2 = `${p.paterno} ${p.nombre}`.toUpperCase().trim().replace(/\s+/g, ' ');
    const full3 = `${p.nombre} ${p.paterno} ${p.materno}`.toUpperCase().trim().replace(/\s+/g, ' ');
    pacMapByName.set(full1, p.id);
    pacMapByName.set(full2, p.id);
    pacMapByName.set(full3, p.id);
  });

  const precios = await dataSource.getRepository(PrecioLaboratorio).find({ relations: ['laboratorio'] });
  // Map of (labId + '_' + detalleUpper) -> id
  const precioMapKey = new Map<string, number>();
  precios.forEach(pr => {
    const key = `${pr.idLaboratorio}_${pr.detalle.toUpperCase().trim()}`;
    precioMapKey.set(key, pr.id);
  });

  const mdbPath = 'd:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb';
  const MDBReader = mdb.default || mdb;
  const buffer = fs.readFileSync(mdbPath);
  const reader = new MDBReader(buffer);

  // First check Cubetas
  const cubetaTable = reader.getTable('Cubeta');
  const cubetaRows = cubetaTable.getData();
  console.log(`--- CUBETAS DE ACCESS (${cubetaRows.length} filas) ---`);

  const cubetaMapByCode = new Map<string, number>();
  // We simulate cubeta insert IDs from 1..242
  cubetaRows.forEach((c: any, index: number) => {
    const code = cleanString(c.Id);
    if (code) cubetaMapByCode.set(code.toUpperCase(), index + 1);
  });

  const trabajoTable = reader.getTable('Trabajo_Lab');
  const trabajoRows = trabajoTable.getData();
  console.log(`\n--- TRABAJO_LAB DE ACCESS (${trabajoRows.length} filas) ---`);

  let matchedLab = 0;
  let matchedPac = 0;
  let matchedPrecio = 0;
  let matchedCubeta = 0;
  let hasCubetaCount = 0;

  trabajoRows.forEach((r: any) => {
    const labName = cleanString(r.Laboratorio).toUpperCase().trim();
    let labId = labMapByName.get(labName);
    if (!labId) {
      for (const [k, id] of labMapByName.entries()) {
        if (k.includes(labName) || labName.includes(k)) {
          labId = id;
          break;
        }
      }
    }
    if (labId) matchedLab++;

    const pacName = cleanString(r.Paciente).toUpperCase().replace(/\s+/g, ' ');
    if (pacMapByName.has(pacName)) matchedPac++;

    const trabajoName = cleanString(r.Trabajo).toUpperCase().trim();
    if (labId && trabajoName) {
      const pKey = `${labId}_${trabajoName}`;
      let precioId = precioMapKey.get(pKey);
      if (!precioId) {
        // Try fuzzy matching among prices for this labId
        for (const pr of precios) {
          if (pr.idLaboratorio === labId) {
            const det = pr.detalle.toUpperCase().trim();
            if (det.includes(trabajoName) || trabajoName.includes(det)) {
              precioId = pr.id;
              break;
            }
          }
        }
      }
      if (precioId) matchedPrecio++;
    }

    const cubCode = cleanString(r.Cubeta).toUpperCase();
    if (cubCode) {
      hasCubetaCount++;
      if (cubetaMapByCode.has(cubCode)) matchedCubeta++;
    }
  });

  console.log(`Matched Lab: ${matchedLab} / ${trabajoRows.length}`);
  console.log(`Matched Paciente: ${matchedPac} / ${trabajoRows.length}`);
  console.log(`Matched Precio: ${matchedPrecio} / ${trabajoRows.length}`);
  console.log(`Filas con Cubeta: ${hasCubetaCount}, Matched Cubeta: ${matchedCubeta}`);

  process.exit(0);
}

testTrabajoLabMatching();
