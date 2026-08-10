import { getAppDataSource, getMdbReader } from './config';
import { Paciente } from '../../src/pacientes/entities/paciente.entity';
import { cleanAccessId } from './utils/formatters';

async function findMissing() {
  const dataSource = await getAppDataSource();
  const reader = getMdbReader();

  const accessRows = reader.getTable('Paciente').getData();
  const pgPacientes = await dataSource.getRepository(Paciente).find({ select: ['id'] });
  const pgIds = new Set(pgPacientes.map(p => p.id));

  const missing: any[] = [];
  for (const r of accessRows) {
    const parsed = cleanAccessId(r.IdPaciente);
    if (parsed && !pgIds.has(parsed.numericId)) {
      missing.push({ id: r.IdPaciente, num: parsed.numericId, nombre: `${r.Nombre} ${r.Paterno}` });
    }
  }

  console.log(`Total en Access: ${accessRows.length}`);
  console.log(`Total en PostgreSQL: ${pgIds.size}`);
  console.log(`Faltantes: ${missing.length}`);
  if (missing.length > 0) {
    console.log('Muestra de faltantes (primeros 5):', missing.slice(0, 5));
  }

  process.exit(0);
}

findMissing();
