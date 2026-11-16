const fs = require('fs');
const path = require('path');
const MDBReaderModule = require(path.resolve('d:/SOFT-MEDIC/Antigravity/CURARE/backend/node_modules/mdb-reader'));
const MDBReader = MDBReaderModule.default || MDBReaderModule;
const { Client } = require(path.resolve('d:/SOFT-MEDIC/Antigravity/CURARE/backend/node_modules/pg'));

async function main() {
  const mdbPath = 'd:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb';
  if (!fs.existsSync(mdbPath)) {
    console.error('No se encontró el archivo MDB en:', mdbPath);
    process.exit(1);
  }

  const buffer = fs.readFileSync(mdbPath);
  const reader = new MDBReader(buffer);

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgrespg',
    database: process.env.DB_NAME || 'curare',
  });

  await client.connect();
  console.log('Conectado a PostgreSQL local (puerto ' + (process.env.DB_PORT || '5433') + ').');

  try {
    await client.query('BEGIN');

    // 1. Obtener especialidades de Postgres
    const espRes = await client.query('SELECT id, especialidad FROM especialidad');
    const espMap = new Map();
    const normalizeStr = (s) => (s || '').toString().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

    espRes.rows.forEach(r => {
      espMap.set(normalizeStr(r.especialidad), r.id);
    });

    console.log('Especialidades registradas en Postgres:', espRes.rows.map(e => `${e.id}: ${e.especialidad}`).join(', '));

    // Definición de las 3 tablas de Access a migrar
    const tablesConfig = [
      {
        accessTable: 'Conos',
        idGrupo: 5,
        nombreGrupo: 'Conos'
      },
      {
        accessTable: 'Limas',
        idGrupo: 6,
        nombreGrupo: 'Limas'
      },
      {
        accessTable: 'Instrumental',
        idGrupo: 4,
        nombreGrupo: 'Instrumental'
      }
    ];

    const sqlLines = [];
    sqlLines.push('-- =========================================================================');
    sqlLines.push('-- MIGRACIÓN DE ACCESS (Conos, Limas, Instrumental) A POSTGRES (inventario)');
    sqlLines.push('-- Fecha: ' + new Date().toISOString());
    sqlLines.push('-- Grupos: Instrumental=4, Conos=5, Limas=6');
    sqlLines.push('-- =========================================================================');
    sqlLines.push('BEGIN;\n');

    let totalInsertadosGlobal = 0;
    const resumenPorGrupo = {};

    for (const cfg of tablesConfig) {
      const table = reader.getTable(cfg.accessTable);
      const rows = table.getData();
      console.log(`\nProcesando tabla Access '${cfg.accessTable}' (idgrupo: ${cfg.idGrupo} - ${cfg.nombreGrupo}). Total filas: ${rows.length}`);

      let insertadosTabla = 0;
      const conteoEsp = {};

      for (const row of rows) {
        const descripcion = (row.Detalle || '').toString().trim();
        if (!descripcion) continue;

        const cantidadExistente = parseInt(row.Existente, 10) || 0;
        const stockMinimo = parseInt(row.Stock, 10) || 0;

        // SiNo en access es el estado en postgres ('No' -> 'Activo', 'Si' -> 'Inactivo')
        const rawSiNo = (row.SiNo || '').toString().trim().toLowerCase();
        const estado = rawSiNo === 'si' ? 'Inactivo' : 'Activo';

        // Cotejar Especialidad
        const rawEsp = (row.Especialidad || '').toString().trim();
        let idespecialidad = null;
        if (rawEsp) {
          const normEsp = normalizeStr(rawEsp);
          idespecialidad = espMap.get(normEsp) || null;
        }

        const espKey = rawEsp ? `${rawEsp} (id: ${idespecialidad})` : 'SIN ESPECIALIDAD (NULL)';
        conteoEsp[espKey] = (conteoEsp[espKey] || 0) + 1;

        // Inserción en Postgres
        const insertQuery = `
          INSERT INTO inventario (descripcion, cantidad_existente, stock_minimo, estado, idespecialidad, idgrupo_inventario, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
          RETURNING id, descripcion, cantidad_existente, stock_minimo, estado, idespecialidad, idgrupo_inventario;
        `;

        await client.query(insertQuery, [
          descripcion,
          cantidadExistente,
          stockMinimo,
          estado,
          idespecialidad,
          cfg.idGrupo,
        ]);

        insertadosTabla++;
        totalInsertadosGlobal++;

        // Línea SQL para archivo
        const descEscaped = descripcion.replace(/'/g, "''");
        const espSql = idespecialidad === null ? 'NULL' : idespecialidad;
        sqlLines.push(
          `INSERT INTO inventario (descripcion, cantidad_existente, stock_minimo, estado, idespecialidad, idgrupo_inventario, created_at) ` +
          `VALUES ('${descEscaped}', ${cantidadExistente}, ${stockMinimo}, '${estado}', ${espSql}, ${cfg.idGrupo}, NOW());`
        );
      }

      resumenPorGrupo[cfg.nombreGrupo] = {
        insertados: insertadosTabla,
        especialidades: conteoEsp
      };

      console.log(` Insertados ${insertadosTabla} registros de '${cfg.accessTable}'.`);
      console.log('  Desglose por especialidad:', conteoEsp);
    }

    // Actualizar secuencia en Postgres local
    await client.query("SELECT setval(pg_get_serial_sequence('inventario', 'id'), COALESCE((SELECT MAX(id) FROM inventario), 1));");

    sqlLines.push("\n-- Actualizar secuencia de autoincremento");
    sqlLines.push("SELECT setval(pg_get_serial_sequence('inventario', 'id'), COALESCE((SELECT MAX(id) FROM inventario), 1));");
    sqlLines.push('COMMIT;');

    // Guardar archivo SQL para producción
    const sqlFilePath = path.resolve(__dirname, 'migration_conos_limas_instrumental.sql');
    fs.writeFileSync(sqlFilePath, sqlLines.join('\n'), 'utf-8');
    console.log(`\nArchivo SQL generado con éxito en: ${sqlFilePath}`);

    await client.query('COMMIT');
    console.log(`\n======================================================`);
    console.log(`¡MIGRACIÓN COMPLETADA EXITOSAMENTE!`);
    console.log(`Total registros insertados en Postgres local: ${totalInsertadosGlobal}`);
    console.log(`Resumen:`, JSON.stringify(resumenPorGrupo, null, 2));
    console.log(`======================================================\n`);

  } catch (error) {
    console.error('Error durante la migración. Revirtiendo transacción (ROLLBACK)...', error);
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error('Fallo en la ejecución:', err);
  process.exit(1);
});
