const fs = require('fs');
const path = require('path');
const MDBReader = require('mdb-reader').default || require('mdb-reader');
const { Client } = require('pg');

function formatDate(d) {
  if (!d) return null;
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return null;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function migrate() {
  const mdbPath = 'd:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb';
  const buffer = fs.readFileSync(mdbPath);
  const reader = new MDBReader(buffer);
  const table = reader.getTable('Material_Egreso');
  const rows = table.getData();

  console.log(`Leídos ${rows.length} registros de la tabla Access 'Material_Egreso'.`);

  // Map each row con observaciones vacías (NULL)
  const processedRows = rows.map((r, idx) => {
    const rawEgresoNum = parseInt(String(r.IdEgreso || '').replace(/[^0-9]/g, ''), 10);
    const egresoId = !isNaN(rawEgresoNum) && rawEgresoNum > 0 ? rawEgresoNum : (idx + 1);

    const matNum = parseInt(String(r.IdMaterial || '').replace(/[^0-9]/g, ''), 10);
    const inventarioId = matNum + 1; // Desplazamiento +1 para coincidir con inventario

    const fechaStr = formatDate(r.FechaE) || '2021-01-01';
    const cantidad = parseInt(r.Cantidad, 10) || 1;
    const consultorio = (r.Consultorio || '1').trim();
    const fechaVencimiento = (r.Fecha_Vencimiento || '').trim() || '-';
    const observaciones = null; // Dejar vacío

    return {
      id: egresoId,
      inventarioId,
      fecha: fechaStr,
      cantidad,
      consultorio,
      fecha_vencimiento: fechaVencimiento,
      observaciones,
      raw: r
    };
  }).filter(r => !isNaN(r.inventarioId) && r.inventarioId > 1);

  // Ordenar por ID de egreso
  processedRows.sort((a, b) => a.id - b.id);

  console.log(`Registros válidos para migrar: ${processedRows.length}`);

  // Generar Script SQL para Producción
  const sqlLines = [];
  sqlLines.push('-- ==========================================================');
  sqlLines.push('-- MIGRACIÓN DE ACCESS (TABLA Material_Egreso) A POSTGRES (TABLA egresos_inventario)');
  sqlLines.push('-- Fecha: ' + new Date().toISOString());
  sqlLines.push('-- Observaciones: campo vacío (NULL)');
  sqlLines.push('-- Total egresos históricos: ' + processedRows.length);
  sqlLines.push('-- ==========================================================');
  sqlLines.push('');
  sqlLines.push('BEGIN;');
  sqlLines.push('');

  for (const row of processedRows) {
    const consEscaped = row.consultorio.replace(/'/g, "''");
    const vencEscaped = row.fecha_vencimiento.replace(/'/g, "''");
    sqlLines.push(
      `INSERT INTO egresos_inventario (id, "inventarioId", fecha, cantidad, consultorio, fecha_vencimiento, observaciones, created_at, updated_at) ` +
      `VALUES (${row.id}, ${row.inventarioId}, '${row.fecha}', ${row.cantidad}, '${consEscaped}', '${vencEscaped}', NULL, '${row.fecha} 00:00:00', NOW()) ` +
      `ON CONFLICT (id) DO UPDATE SET ` +
      `"inventarioId" = EXCLUDED."inventarioId", ` +
      `fecha = EXCLUDED.fecha, ` +
      `cantidad = EXCLUDED.cantidad, ` +
      `consultorio = EXCLUDED.consultorio, ` +
      `fecha_vencimiento = EXCLUDED.fecha_vencimiento, ` +
      `observaciones = NULL, ` +
      `updated_at = NOW();`
    );
  }

  sqlLines.push('');
  sqlLines.push('-- Actualizar secuencia de egresos_inventario');
  sqlLines.push("SELECT setval(pg_get_serial_sequence('egresos_inventario', 'id'), COALESCE((SELECT MAX(id) FROM egresos_inventario), 1));");
  sqlLines.push('');
  sqlLines.push('COMMIT;');

  // Guardar en migration/sql y migrations/
  const sqlDir1 = path.join(__dirname, 'migration', 'sql');
  const sqlDir2 = path.join(__dirname, '..', 'migrations');
  if (!fs.existsSync(sqlDir1)) fs.mkdirSync(sqlDir1, { recursive: true });
  if (!fs.existsSync(sqlDir2)) fs.mkdirSync(sqlDir2, { recursive: true });

  const file1 = path.join(sqlDir1, 'migrate_material_egreso_to_egresos_inventario.sql');
  const file2 = path.join(sqlDir2, 'migrate_material_egreso_to_egresos_inventario.sql');
  fs.writeFileSync(file1, sqlLines.join('\n'), 'utf8');
  fs.writeFileSync(file2, sqlLines.join('\n'), 'utf8');
  console.log(`Archivos SQL actualizados en:\n- ${file1}\n- ${file2}`);

  // Ejecutar en PostgreSQL local
  console.log('\nConectando a PostgreSQL local (puerto 5433)...');
  const client = new Client({ host: 'localhost', port: 5433, user: 'postgres', password: 'postgrespg', database: 'curare' });
  await client.connect();

  try {
    await client.query('BEGIN');

    for (const row of processedRows) {
      await client.query(`
        INSERT INTO egresos_inventario (id, "inventarioId", fecha, cantidad, consultorio, fecha_vencimiento, observaciones, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NULL, $7, NOW())
        ON CONFLICT (id) DO UPDATE SET
          "inventarioId" = EXCLUDED."inventarioId",
          fecha = EXCLUDED.fecha,
          cantidad = EXCLUDED.cantidad,
          consultorio = EXCLUDED.consultorio,
          fecha_vencimiento = EXCLUDED.fecha_vencimiento,
          observaciones = NULL,
          updated_at = NOW();
      `, [row.id, row.inventarioId, row.fecha, row.cantidad, row.consultorio, row.fecha_vencimiento, `${row.fecha} 00:00:00`]);
    }

    await client.query("SELECT setval(pg_get_serial_sequence('egresos_inventario', 'id'), COALESCE((SELECT MAX(id) FROM egresos_inventario), 1));");
    await client.query('COMMIT');
    console.log('Migración de egresos actualizada con observaciones = NULL en PostgreSQL local.');

    // Validar muestra
    const sampleRes = await client.query(`
      SELECT e.id, e."inventarioId", i.descripcion AS material, e.fecha, e.cantidad, e.consultorio, e.fecha_vencimiento, e.observaciones
      FROM egresos_inventario e
      JOIN inventario i ON i.id = e."inventarioId"
      ORDER BY e.id
      LIMIT 5;
    `);
    console.log('\nMuestra de registros verificados:');
    console.table(sampleRes.rows);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error durante la actualización local:', err);
    throw err;
  } finally {
    await client.end();
  }
}

migrate().catch(console.error);
