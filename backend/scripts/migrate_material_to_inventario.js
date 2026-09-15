const fs = require('fs');
const path = require('path');
const MDBReader = require('mdb-reader').default || require('mdb-reader');
const { Client } = require('pg');

async function migrate() {
  const mdbPath = 'd:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb';
  const buffer = fs.readFileSync(mdbPath);
  const reader = new MDBReader(buffer);
  const table = reader.getTable('Material');
  const rows = table.getData();

  console.log(`Leídos ${rows.length} registros de la tabla Access 'Material'.`);

  // Desplazar ID por +1: Mt-1 -> id: 2, Mt-2 -> id: 3, etc. Para preservar id: 1 como 'INSUMOS Y MATERIALES DENTALES (MIGRACIÓN ACCESS)'
  const processedRows = rows.map(r => {
    const rawNum = parseInt(String(r.IdMaterial || '').replace(/[^0-9]/g, ''), 10);
    const id = rawNum + 1; // Desplazamiento +1
    const descripcion = (r.Detalle || '').trim();
    const cantidadExistente = parseInt(r.Existente, 10) || 0;
    const stockMinimo = parseInt(r.Stock, 10) || 0;
    const estado = 'Activo';
    
    // IdEspecialidad: EM-X -> X
    let idespecialidad = null;
    if (r.IdEspecialidad_Material) {
      const espNum = parseInt(String(r.IdEspecialidad_Material).replace(/[^0-9]/g, ''), 10);
      if (!isNaN(espNum) && espNum > 0) {
        idespecialidad = espNum;
      }
    }

    // idgrupo_inventario mantener con 1 en postgres
    const idgrupoInventario = 1;

    return {
      rawId: r.IdMaterial,
      rawNum,
      id,
      descripcion,
      cantidad_existente: cantidadExistente,
      stock_minimo: stockMinimo,
      estado,
      idespecialidad,
      idgrupo_inventario: idgrupoInventario,
    };
  }).filter(r => !isNaN(r.id) && r.id > 1);

  processedRows.sort((a, b) => a.id - b.id);

  console.log(`Registros válidos para migrar: ${processedRows.length}`);
  console.log('Muestra de los primeros 3 registros migrados (con id desplazado +1):', processedRows.slice(0, 3));
  console.log('Muestra de los últimos 3 registros migrados:', processedRows.slice(-3));

  // Generar Script SQL para Producción
  const sqlLines = [];
  sqlLines.push('-- ==========================================================');
  sqlLines.push('-- MIGRACIÓN DE ACCESS (TABLA Material) A POSTGRES (TABLA inventario)');
  sqlLines.push('-- Fecha: ' + new Date().toISOString());
  sqlLines.push('-- Nota: Preserva id=1 para "INSUMOS Y MATERIALES DENTALES (MIGRACIÓN ACCESS)"');
  sqlLines.push('-- y desplaza los registros de Material por +1 (Mt-1 -> id: 2, etc.)');
  sqlLines.push('-- Total materiales migrados: ' + processedRows.length);
  sqlLines.push('-- ==========================================================');
  sqlLines.push('');
  sqlLines.push('BEGIN;');
  sqlLines.push('');
  sqlLines.push('-- 1. Asegurar que el grupo con id=1 exista');
  sqlLines.push("INSERT INTO grupo_inventario (id, grupo, estado) VALUES (1, 'Insumos', 'Activo') ON CONFLICT (id) DO NOTHING;");
  sqlLines.push('');
  sqlLines.push('-- 2. Asegurar que el registro genérico id=1 exista');
  sqlLines.push("INSERT INTO inventario (id, descripcion, cantidad_existente, stock_minimo, estado, idespecialidad, idgrupo_inventario, created_at) " +
    "VALUES (1, 'INSUMOS Y MATERIALES DENTALES (MIGRACIÓN ACCESS)', 0, 0, 'Activo', NULL, 1, NOW()) " +
    "ON CONFLICT (id) DO UPDATE SET " +
    "descripcion = 'INSUMOS Y MATERIALES DENTALES (MIGRACIÓN ACCESS)', " +
    "cantidad_existente = 0, " +
    "stock_minimo = 0, " +
    "estado = 'Activo', " +
    "idgrupo_inventario = 1;");
  sqlLines.push('');
  sqlLines.push('-- 3. Inserción de materiales de Access (id = Mt_num + 1)');

  for (const row of processedRows) {
    const descEscaped = row.descripcion.replace(/'/g, "''");
    const espVal = row.idespecialidad === null ? 'NULL' : row.idespecialidad;
    sqlLines.push(
      `INSERT INTO inventario (id, descripcion, cantidad_existente, stock_minimo, estado, idespecialidad, idgrupo_inventario, created_at) ` +
      `VALUES (${row.id}, '${descEscaped}', ${row.cantidad_existente}, ${row.stock_minimo}, '${row.estado}', ${espVal}, ${row.idgrupo_inventario}, NOW()) ` +
      `ON CONFLICT (id) DO UPDATE SET ` +
      `descripcion = EXCLUDED.descripcion, ` +
      `cantidad_existente = EXCLUDED.cantidad_existente, ` +
      `stock_minimo = EXCLUDED.stock_minimo, ` +
      `estado = EXCLUDED.estado, ` +
      `idespecialidad = EXCLUDED.idespecialidad, ` +
      `idgrupo_inventario = EXCLUDED.idgrupo_inventario;`
    );
  }

  sqlLines.push('');
  sqlLines.push('-- 4. Actualizar la secuencia del ID de inventario');
  sqlLines.push("SELECT setval(pg_get_serial_sequence('inventario', 'id'), COALESCE((SELECT MAX(id) FROM inventario), 1));");
  sqlLines.push('');
  sqlLines.push('COMMIT;');

  const sqlOutputDir = path.join(__dirname, 'migration', 'sql');
  if (!fs.existsSync(sqlOutputDir)) {
    fs.mkdirSync(sqlOutputDir, { recursive: true });
  }
  const sqlFilePath = path.join(sqlOutputDir, 'migrate_material_to_inventario.sql');
  fs.writeFileSync(sqlFilePath, sqlLines.join('\n'), 'utf8');
  console.log(`Archivo SQL generado en: ${sqlFilePath}`);

  // Ejecutar en PostgreSQL local
  console.log('Conectando a PostgreSQL local (puerto 5433)...');
  const client = new Client({ host: 'localhost', port: 5433, user: 'postgres', password: 'postgrespg', database: 'curare' });
  await client.connect();

  try {
    await client.query('BEGIN');
    
    // Restaurar/Asegurar id = 1
    await client.query(`
      INSERT INTO inventario (id, descripcion, cantidad_existente, stock_minimo, estado, idespecialidad, idgrupo_inventario, created_at)
      VALUES (1, 'INSUMOS Y MATERIALES DENTALES (MIGRACIÓN ACCESS)', 0, 0, 'Activo', NULL, 1, NOW())
      ON CONFLICT (id) DO UPDATE SET
        descripcion = 'INSUMOS Y MATERIALES DENTALES (MIGRACIÓN ACCESS)',
        cantidad_existente = 0,
        stock_minimo = 0,
        estado = 'Activo',
        idespecialidad = NULL,
        idgrupo_inventario = 1;
    `);

    // Insertar cada registro desplazado
    for (const row of processedRows) {
      await client.query(`
        INSERT INTO inventario (id, descripcion, cantidad_existente, stock_minimo, estado, idespecialidad, idgrupo_inventario, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (id) DO UPDATE SET
          descripcion = EXCLUDED.descripcion,
          cantidad_existente = EXCLUDED.cantidad_existente,
          stock_minimo = EXCLUDED.stock_minimo,
          estado = EXCLUDED.estado,
          idespecialidad = EXCLUDED.idespecialidad,
          idgrupo_inventario = EXCLUDED.idgrupo_inventario;
      `, [row.id, row.descripcion, row.cantidad_existente, row.stock_minimo, row.estado, row.idespecialidad, row.idgrupo_inventario]);
    }

    await client.query("SELECT setval(pg_get_serial_sequence('inventario', 'id'), COALESCE((SELECT MAX(id) FROM inventario), 1));");
    await client.query('COMMIT');
    console.log('Migración completada con éxito en PostgreSQL local.');

    // Validar conteo y muestra
    const countRes = await client.query('SELECT count(*) FROM inventario');
    console.log(`Total registros en inventario después de la migración: ${countRes.rows[0].count}`);

    const sampleRes = await client.query(`
      SELECT i.id, i.descripcion, i.cantidad_existente, i.stock_minimo, i.estado, i.idespecialidad, e.especialidad, i.idgrupo_inventario, g.grupo
      FROM inventario i
      LEFT JOIN especialidad e ON e.id = i.idespecialidad
      LEFT JOIN grupo_inventario g ON g.id = i.idgrupo_inventario
      ORDER BY i.id
      LIMIT 10;
    `);
    console.log('Primeros 10 registros en PostgreSQL (verificando id:1):');
    console.table(sampleRes.rows);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error durante la migración local:', err);
    throw err;
  } finally {
    await client.end();
  }
}

migrate().catch(console.error);
