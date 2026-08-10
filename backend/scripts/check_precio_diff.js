const { DataSource } = require('typeorm');
const MDBReaderModule = require('mdb-reader');
const MDBReader = MDBReaderModule.default || MDBReaderModule;
const fs = require('fs');

const ds = new DataSource({
  type: 'postgres', host: 'localhost', port: 5433, username: 'postgres', password: 'postgrespg', database: 'curare'
});

async function main() {
  await ds.initialize();
  
  const mdbPath = 'D:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb';
  const buffer = fs.readFileSync(mdbPath);
  const reader = new MDBReader(buffer);
  const rows = reader.getTable('Historial_Odonto').getData();

  let diffCount = 0;
  const sampleDiffs = [];

  for (const r of rows) {
    const rawIdHist = String(r.IdHistorial_Odonto || '').trim();
    const numIdHist = parseInt(rawIdHist.replace(/^HL-/i, ''), 10);
    if (isNaN(numIdHist)) continue;

    const accessPrecio = parseFloat(String(r.Precio || 0).replace(/[^0-9.-]+/g, '')) || 0;

    const pgRow = (await ds.query(`SELECT id, precio, tratamiento, pieza, cantidad FROM historia_clinica WHERE id = $1`, [numIdHist]))[0];
    if (pgRow) {
      const pgPrecio = Number(pgRow.precio);
      if (Math.abs(pgPrecio - accessPrecio) > 0.01) {
        diffCount++;
        if (sampleDiffs.length < 15) {
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
