import { getAppDataSource, getMdbReader } from './config';
import { Paciente } from '../../src/pacientes/entities/paciente.entity';
import { Proforma } from '../../src/proformas/entities/proforma.entity';
import { cleanString, parseCurrency } from './utils/formatters';

async function testPagosMatching() {
  const dataSource = await getAppDataSource();
  const reader = getMdbReader();

  const pgPacientes = await dataSource.getRepository(Paciente).find();
  console.log(`PACIENTES EN PG: ${pgPacientes.length}`);

  const patientMapByName = new Map<string, number>();
  for (const p of pgPacientes) {
    const fn1 = `${p.paterno} ${p.materno || ''} ${p.nombre}`.replace(/\s+/g, ' ').trim().toUpperCase();
    const fn2 = `${p.paterno} ${p.nombre}`.replace(/\s+/g, ' ').trim().toUpperCase();
    patientMapByName.set(fn1, p.id);
    if (!patientMapByName.has(fn2)) patientMapByName.set(fn2, p.id);
  }

  // Mapa de pacientes de Access (para cruce exacto por IdPaciente)
  const pacienteRowsMdb = reader.getTable('Paciente').getData();
  const accessNameToIdMap = new Map<string, number>();
  for (const p of pacienteRowsMdb) {
    const rawId = cleanString(p.IdPaciente).replace(/^P-/i, '');
    const numId = parseInt(rawId, 10);
    const fullName = `${p.Paterno || ''} ${p.Materno || ''} ${p.Nombre || ''}`.replace(/\s+/g, ' ').trim().toUpperCase();
    if (!isNaN(numId) && fullName) {
      accessNameToIdMap.set(fullName, numId);
    }
  }

  const pgProformas = await dataSource.getRepository(Proforma).find({ select: ['id', 'pacienteId', 'numero'] });
  const proformaMap = new Map<string, number>();
  for (const pr of pgProformas) {
    proformaMap.set(`${pr.pacienteId}_${pr.numero}`, pr.id);
  }

  const table = reader.getTable('Plan_Pagos');
  const rows = table.getData();
  const fechaPagoRows = rows.filter(r => r.Pieza && r.Pieza.toString().trim().toUpperCase() === 'FECHA PAGO');

  console.log(`TOTAL FILAS 'FECHA PAGO': ${fechaPagoRows.length}`);

  let matchedPacienteCount = 0;
  let matchedProformaCount = 0;

  for (const r of fechaPagoRows) {
    const pacName = cleanString(r.Paciente).toUpperCase();
    let pacId = accessNameToIdMap.get(pacName) || patientMapByName.get(pacName);

    if (!pacId && pacName) {
      // Buscar aproximado
      const match = pgPacientes.find(p => {
        const fn = `${p.paterno} ${p.nombre}`.toUpperCase();
        return pacName.includes(p.paterno.toUpperCase()) && pacName.includes(p.nombre.toUpperCase());
      });
      if (match) pacId = match.id;
    }

    if (pacId) {
      matchedPacienteCount++;
      const numPro = parseInt(cleanString(r.Plan_Tratamiento), 10);
      if (!isNaN(numPro) && proformaMap.has(`${pacId}_${numPro}`)) {
        matchedProformaCount++;
      }
    }
  }

  console.log(`\nRESULTADOS DE EMPAREJAMIENTO DE PAGOS:`);
  console.log(`- Pacientes emparejados: ${matchedPacienteCount} / ${fechaPagoRows.length}`);
  console.log(`- Proformas emparejadas: ${matchedProformaCount} / ${fechaPagoRows.length}`);

  process.exit(0);
}

testPagosMatching();
