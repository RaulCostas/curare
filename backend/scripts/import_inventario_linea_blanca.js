const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { Client } = require('pg');

async function importLineaBlanca() {
  const excelPath = path.resolve(__dirname, '../../INVENTARIO LINEA BLANCA 2026.xlsx');
  
  if (!fs.existsSync(excelPath)) {
    console.error('El archivo Excel no fue encontrado en:', excelPath);
    process.exit(1);
  }

  const wb = xlsx.readFile(excelPath);
  const sheetName = wb.SheetNames[0];
  const rawRows = xlsx.utils.sheet_to_json(wb.Sheets[sheetName]);

  console.log(`Archivo Excel cargado: ${excelPath}`);
  console.log(`Hoja: "${sheetName}", Total filas leídas: ${rawRows.length}`);

  const client = new Client({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5433', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgrespg',
    database: process.env.DB_NAME || 'curare',
  });

  await client.connect();
  console.log('Conectado a PostgreSQL local.');

  try {
    await client.query('BEGIN');

    // Validar grupo "Línea Blanca"
    let grupoRes = await client.query("SELECT id, grupo FROM grupo_inventario WHERE id = 2 OR LOWER(grupo) LIKE '%blanca%' LIMIT 1");
    let grupoId = 2;
    if (grupoRes.rows.length === 0) {
      const newG = await client.query("INSERT INTO grupo_inventario (id, grupo, estado) VALUES (2, 'Línea Blanca', 'Activo') RETURNING id");
      grupoId = newG.rows[0].id;
    } else {
      grupoId = grupoRes.rows[0].id;
    }

    const sqlInserts = [];
    sqlInserts.push('-- Script de migración a producción: INVENTARIO LÍNEA BLANCA 2026');
    sqlInserts.push('-- Fecha de generación: ' + new Date().toISOString());
    sqlInserts.push('BEGIN;\n');

    let insertedCount = 0;
    const sampleItems = [];

    for (const row of rawRows) {
      const descripcion = (row.Descripcion || row.descripcion || '').trim();
      if (!descripcion) continue;

      const cantidadExistente = parseInt(row.Cantidad_Existente ?? row.cantidad_existente ?? 0, 10) || 0;
      const stockMinimo = parseInt(row.Stock_minimo ?? row.stock_minimo ?? 0, 10) || 0;
      const estado = (row.Estado || row.estado || 'Activo').trim();
      const idespecialidad = parseInt(row.idespecialidad ?? 9, 10) || 9;
      const idgrupoInventario = parseInt(row.idgrupo_inventario ?? grupoId, 10) || grupoId;

      const insertQuery = `
        INSERT INTO inventario (descripcion, cantidad_existente, stock_minimo, estado, idespecialidad, idgrupo_inventario, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING id, descripcion, cantidad_existente, stock_minimo, estado, idespecialidad, idgrupo_inventario;
      `;

      const res = await client.query(insertQuery, [
        descripcion,
        cantidadExistente,
        stockMinimo,
        estado,
        idespecialidad,
        idgrupoInventario,
      ]);

      const inserted = res.rows[0];
      insertedCount++;

      if (sampleItems.length < 5 || insertedCount === rawRows.length) {
        sampleItems.push(inserted);
      }

      // Escapar comillas simples para el script SQL
      const descSql = descripcion.replace(/'/g, "''");
      sqlInserts.push(
        `INSERT INTO inventario (descripcion, cantidad_existente, stock_minimo, estado, idespecialidad, idgrupo_inventario, created_at) ` +
        `VALUES ('${descSql}', ${cantidadExistente}, ${stockMinimo}, '${estado}', ${idespecialidad}, ${idgrupoInventario}, NOW());`
      );
    }

    // Actualizar secuencia en local
    await client.query("SELECT setval(pg_get_serial_sequence('inventario', 'id'), COALESCE((SELECT MAX(id) FROM inventario), 1));");

    sqlInserts.push("\nSELECT setval(pg_get_serial_sequence('inventario', 'id'), COALESCE((SELECT MAX(id) FROM inventario), 1));");
    sqlInserts.push('COMMIT;');

    await client.query('COMMIT');
    console.log(`\n ¡Éxito! Se insertaron ${insertedCount} ítems en la tabla "inventario" de la base de datos local.`);

    // Guardar script SQL para producción
    const sqlFilePath = path.resolve(__dirname, 'migration_inventario_linea_blanca_2026.sql');
    fs.writeFileSync(sqlFilePath, sqlInserts.join('\n'), 'utf8');
    console.log(` Script SQL generado para producción en: ${sqlFilePath}`);

    console.log('\nMuestra de ítems insertados:');
    console.table(sampleItems);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(' Error durante la inserción, transacción revertida:', error);
  } finally {
    await client.end();
  }
}

importLineaBlanca();
