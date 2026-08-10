import { getAppDataSource, getMdbReader } from './config';
import { cleanString } from './utils/formatters';

async function testVacaciones() {
  const dataSource = await getAppDataSource();
  const reader = getMdbReader();

  const pgPersonal = await dataSource.query('SELECT id, paterno, materno, nombre FROM personal;');
  const personalSet = new Set(pgPersonal.map((p: any) => p.id));

  const vacTable = reader.getTable('Vacaciones');
  const vacRows = vacTable.getData();

  let matched = 0;
  let missing = 0;

  for (const r of vacRows) {
    const rawId = cleanString(r.IdPersonal);
    const numId = parseInt(rawId.replace(/^PE-/i, ''), 10);
    if (!isNaN(numId) && personalSet.has(numId)) {
      matched++;
    } else {
      missing++;
      console.log('Missing personal for vacacion:', r);
    }
  }

  console.log(`Vacaciones: Total ${vacRows.length} | Matched PG Personal ID: ${matched} | Missing: ${missing}`);

  process.exit(0);
}

testVacaciones().catch(console.error);
