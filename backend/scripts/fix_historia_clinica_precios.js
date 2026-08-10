const { DataSource } = require('typeorm');
const MDBReaderModule = require('mdb-reader');
const MDBReader = MDBReaderModule.default || MDBReaderModule;
const fs = require('fs');

const ds = new DataSource({
  type: 'postgres', host: 'localhost', port: 5433, username: 'postgres', password: 'postgrespg', database: 'curare'
});

function parseCurrency(val) {
  if (!val) return 0;
  const str = String(val).replace(/[^0-9.,-]+/g, '').replace(',', '.');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

async function main() {
  await ds.initialize();
  console.log('--- Correcting historia_clinica.precio from Access Historial_Odonto ---');

  const mdbPath = 'D:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb';
  const buffer = fs.readFileSync(mdbPath);
  const reader = new MDBReader(buffer);
  const rows = reader.getTable('Historial_Odonto').getData();

  let updatedCount = 0;

  for (const r of rows) {
    const rawIdHist = String(r.IdHistorial_Odonto || '').trim();
    const numIdHist = parseInt(rawIdHist.replace(/^HL-/i, ''), 10);
    if (isNaN(numIdHist)) continue;

    const accessPrecio = parseCurrency(r.Precio);
    if (accessPrecio > 0) {
      // Update DB if different
      const [pgRow] = await ds.query(`SELECT id, precio FROM historia_clinica WHERE id = $1`, [numIdHist]);
      if (pgRow) {
        const pgPrecio = Number(pgRow.precio);
        if (Math.abs(pgPrecio - accessPrecio) > 0.01) {
          await ds.query(`UPDATE historia_clinica SET precio = $1 WHERE id = $2`, [accessPrecio, numIdHist]);
          updatedCount++;
        }
      }
    }
  }

  console.log(`Successfully updated ${updatedCount} historia_clinica records with exact Access prices.`);

  // Verify HC 76775
  const [hc76775] = await ds.query(`SELECT id, tratamiento, pieza, cantidad, precio FROM historia_clinica WHERE id = 76775`);
  console.log('Updated HC 76775:', hc76775);

  await ds.destroy();
}

main().catch(console.error);
