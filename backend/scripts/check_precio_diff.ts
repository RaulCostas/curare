import { getAppDataSource, getMdbReader } from './migration/config';
import { parseCurrency, cleanString } from './migration/utils/formatters';

async function main() {
  const ds = await getAppDataSource();
  const reader = getMdbReader();
  const rows = reader.getTable('Historial_Odonto').getData();

  let diffCount = 0;
  const sampleDiffs: any[] = [];

  for (const r of rows) {
    const rawIdHist = cleanString(r.IdHistorial_Odonto);
    const numIdHist = parseInt(rawIdHist.replace(/^HL-/i, ''), 10);
    if (isNaN(numIdHist)) continue;

    const accessPrecio = parseCurrency(r.Precio);

    const [pgRow] = await ds.query(`SELECT id, precio, tratamiento, pieza, cantidad FROM historia_clinica WHERE id = $1`, [numIdHist]);
    if (pgRow) {
      const pgPrecio = Number(pgRow.precio);
      if (Math.abs(pgPrecio - accessPrecio) > 0.01) {
        diffCount++;
        if (sampleDiffs.length < 10) {
          sampleDiffs.push({
            id: numIdHist,
            tratamiento: r.Tratamiento,
            pieza: r.Pieza,
            cantidad: r.Cantidad,
            accessPrecio,
            pgPrecio
          });
        }
      }
    }
  }

  console.log(`Total records where PG precio differs from Access Precio: ${diffCount}`);
  console.log('Sample differences:', sampleDiffs);

  await ds.destroy();
}

main().catch(console.error);
