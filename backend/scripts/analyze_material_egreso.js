const fs = require('fs');
const MDBReader = require('mdb-reader').default || require('mdb-reader');
const { Client } = require('pg');

async function analyze() {
  const buffer = fs.readFileSync('d:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb');
  const reader = new MDBReader(buffer);
  
  const table = reader.getTable('Material_Egreso');
  const rows = table.getData();
  console.log('--- TABLA ACCESS Material_Egreso ---');
  console.log('Total registros:', rows.length);
  console.log('Columnas:', table.getColumnNames());
  console.log('Primeras 5 filas:', JSON.stringify(rows.slice(0, 5), null, 2));
  console.log('Últimas 5 filas:', JSON.stringify(rows.slice(-5), null, 2));

  // Check unique values, missing values, date ranges
  const matIds = new Set();
  const dates = [];
  let nullMatCount = 0;
  let invalidMatCount = 0;
  
  rows.forEach(r => {
    if (!r.IdMaterial) {
      nullMatCount++;
    } else {
      matIds.add(r.IdMaterial);
      const num = parseInt(String(r.IdMaterial).replace(/[^0-9]/g, ''), 10);
      if (isNaN(num)) invalidMatCount++;
    }
    if (r.Fecha) dates.push(new Date(r.Fecha));
  });

  console.log('\nEstadísticas de datos:');
  console.log('- Total Materiales únicos referenciados:', matIds.size);
  console.log('- Filas sin IdMaterial:', nullMatCount);
  console.log('- Filas con IdMaterial no numérico:', invalidMatCount);
  
  const validDates = dates.filter(d => !isNaN(d.getTime())).sort((a, b) => a - b);
  if (validDates.length > 0) {
    console.log(`- Rango de fechas: desde ${validDates[0].toISOString().split('T')[0]} hasta ${validDates[validDates.length - 1].toISOString().split('T')[0]}`);
  }

  // Check other tables like Material_Ingreso just in case
  try {
    const tableIngreso = reader.getTable('Material_Ingreso');
    const rowsIngreso = tableIngreso.getData();
    console.log('\n--- TABLA ACCESS Material_Ingreso (referencia comparativa) ---');
    console.log('Total registros:', rowsIngreso.length);
    console.log('Columnas:', tableIngreso.getColumnNames());
    console.log('Primeras 3 filas:', JSON.stringify(rowsIngreso.slice(0, 3), null, 2));
  } catch (e) {
    console.log('Material_Ingreso no existe o falló:', e.message);
  }

  // Postgres schema
  const client = new Client({ host: 'localhost', port: 5433, user: 'postgres', password: 'postgrespg', database: 'curare' });
  await client.connect();
  const egresosCols = await client.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'egresos_inventario' 
    ORDER BY ordinal_position
  `);
  console.log('\n--- TABLA POSTGRES egresos_inventario ---');
  console.table(egresosCols.rows);

  const existingEgresos = await client.query('SELECT * FROM egresos_inventario LIMIT 5');
  console.log('Registros actuales en egresos_inventario:', existingEgresos.rows);

  // Check how many Material_Egreso match inventario (id = rawNum + 1)
  const inventarioRows = await client.query('SELECT id, descripcion FROM inventario');
  const inventarioMap = new Map();
  inventarioRows.rows.forEach(i => inventarioMap.set(i.id, i.descripcion));

  let matched = 0;
  let unmatched = 0;
  const unmatchedIds = new Set();

  rows.forEach(r => {
    const num = parseInt(String(r.IdMaterial || '').replace(/[^0-9]/g, ''), 10);
    const postgresId = num + 1; // +1 offset
    if (inventarioMap.has(postgresId)) {
      matched++;
    } else {
      unmatched++;
      unmatchedIds.add(r.IdMaterial);
    }
  });

  console.log('\n--- COMPATIBILIDAD CON TABLA INVENTARIO (Postgres) ---');
  console.log(`- Registros de egreso que coinciden con un ítem de inventario: ${matched} (${((matched / rows.length) * 100).toFixed(1)}%)`);
  console.log(`- Registros de egreso huérfanos (sin match): ${unmatched}`);
  if (unmatchedIds.size > 0) {
    console.log('- IDs de Material no encontrados:', Array.from(unmatchedIds));
  }

  await client.end();
}

analyze().catch(console.error);
