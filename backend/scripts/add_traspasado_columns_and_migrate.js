const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const mdb = require('mdb-reader');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'curare',
  password: 'postgrespg',
  port: parseInt(process.env.DB_PORT || '5433', 10),
});

async function run() {
  await client.connect();
  console.log('Connected to PostgreSQL.');

  // 1. Add columns to PostgreSQL table
  console.log('Adding columns to trabajos_laboratorios...');
  await client.query(`
    ALTER TABLE trabajos_laboratorios 
    ADD COLUMN IF NOT EXISTS traspasado VARCHAR(10) DEFAULT 'no',
    ADD COLUMN IF NOT EXISTS observacion_traspaso TEXT;
  `);
  console.log('Columns added successfully.');

  // 2. Read Access MDB
  const mdbPath = path.resolve(__dirname, '../../backups/curare.mdb');
  if (fs.existsSync(mdbPath)) {
    console.log('Reading Access database from:', mdbPath);
    const MDBReader = mdb.default || mdb;
    const buffer = fs.readFileSync(mdbPath);
    const reader = new MDBReader(buffer);
    const trabajoTable = reader.getTable('Trabajo_Lab');
    const rows = trabajoTable.getData();

    console.log(`Found ${rows.length} rows in Trabajo_Lab.`);
    let updatedCount = 0;

    for (const r of rows) {
      const rawId = r.IdTrabajo ? String(r.IdTrabajo).trim() : null;
      const traspasadoVal = r.Traspasado ? String(r.Traspasado).trim().toLowerCase() : 'no';
      const observacionTraspasoVal = r.Observacion ? String(r.Observacion).trim() : null;
      if (rawId && (traspasadoVal === 'si' || traspasadoVal === 's')) {
        const isTraspasado = 'si';

        const res = await client.query(
          `UPDATE trabajos_laboratorios 
           SET traspasado = $1, observacion_traspaso = $2 
           WHERE access_id = $3 OR access_id = $4`,
          [
            isTraspasado,
            observacionTraspasoVal,
            rawId,
            rawId.startsWith('T-') ? rawId.replace(/^T-/, '') : `T-${rawId}`
          ]
        );
        if (res.rowCount > 0) {
          updatedCount += res.rowCount;
        }
      }
    }

    console.log(`Updated ${updatedCount} rows with traspasado and observacion_traspaso from Access.`);
  }

  // 3. Verify in PostgreSQL
  const checkRes = await client.query(`
    SELECT id, access_id, pieza, pagado, traspasado, observacion_traspaso 
    FROM trabajos_laboratorios 
    WHERE traspasado = 'si' OR observacion_traspaso IS NOT NULL
    LIMIT 10;
  `);
  console.log('Sample updated rows in PostgreSQL:', checkRes.rows);

  await client.end();
}

run().catch(err => {
  console.error('Error running migration:', err);
  process.exit(1);
});
