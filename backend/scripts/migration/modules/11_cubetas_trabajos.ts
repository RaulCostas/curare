import { getAppDataSource } from '../config';
import { Cubeta } from '../../../src/cubetas/entities/cubeta.entity';
import { TrabajoLaboratorio } from '../../../src/trabajos_laboratorios/entities/trabajo_laboratorio.entity';
import { Laboratorio } from '../../../src/laboratorios/entities/laboratorio.entity';
import { Paciente } from '../../../src/pacientes/entities/paciente.entity';
import { PrecioLaboratorio } from '../../../src/precios_laboratorios/entities/precio-laboratorio.entity';
import { cleanString, cleanDate, parseCurrency } from '../utils/formatters';
import * as fs from 'fs';
const mdb = require('mdb-reader');

export async function migrateCubetasYTrabajos() {
  console.log('\n======================================================');
  console.log('  INICIANDO MIGRACIÓN: CUBETAS Y TRABAJOS DE LABORATORIO');
  console.log('======================================================\n');

  const dataSource = await getAppDataSource();

  // 1. Limpiar tablas
  console.log('Conexión a PostgreSQL establecida correctamente.');
  console.log('Limpiando tablas trabajos_laboratorios y cubetas en PostgreSQL...');
  await dataSource.query('TRUNCATE TABLE "trabajos_laboratorios" RESTART IDENTITY CASCADE;');
  await dataSource.query('TRUNCATE TABLE "cubetas" RESTART IDENTITY CASCADE;');

  // 2. Cargar mapas auxiliares desde PostgreSQL
  console.log('Cargando mapas auxiliares (Laboratorios, Pacientes, Precios)...');

  const labs = await dataSource.getRepository(Laboratorio).find();
  const labMapByName = new Map<string, number>();
  labs.forEach(l => {
    if (l.laboratorio) labMapByName.set(l.laboratorio.toUpperCase().trim(), l.id);
  });

  const pacs = await dataSource.getRepository(Paciente).find({ select: ['id', 'nombre', 'paterno', 'materno'] });
  const pacMapByName = new Map<string, number>();
  pacs.forEach(p => {
    const full1 = `${p.paterno} ${p.materno} ${p.nombre}`.toUpperCase().trim().replace(/\s+/g, ' ');
    const full2 = `${p.paterno} ${p.nombre}`.toUpperCase().trim().replace(/\s+/g, ' ');
    const full3 = `${p.nombre} ${p.paterno} ${p.materno}`.toUpperCase().trim().replace(/\s+/g, ' ');
    const full4 = `${p.nombre} ${p.paterno}`.toUpperCase().trim().replace(/\s+/g, ' ');
    pacMapByName.set(full1, p.id);
    pacMapByName.set(full2, p.id);
    pacMapByName.set(full3, p.id);
    pacMapByName.set(full4, p.id);
  });

  const precios = await dataSource.getRepository(PrecioLaboratorio).find();
  const precioMapKey = new Map<string, number>();
  precios.forEach(pr => {
    const key = `${pr.idLaboratorio}_${pr.detalle.toUpperCase().trim()}`;
    precioMapKey.set(key, pr.id);
  });

  // 3. Abrir MDB Access
  const mdbPath = 'd:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb';
  if (!fs.existsSync(mdbPath)) {
    throw new Error(`No se encontró la base de datos Access en: ${mdbPath}`);
  }

  const MDBReader = mdb.default || mdb;
  const buffer = fs.readFileSync(mdbPath);
  const reader = new MDBReader(buffer);

  // ----------------------------------------------------
  // 4. MIGRAR CUBETA
  // ----------------------------------------------------
  const cubetaTable = reader.getTable('Cubeta');
  const cubetaRows = cubetaTable.getData();
  console.log(`Se encontraron ${cubetaRows.length} registros en Cubeta de Access.`);

  const cubetasToInsert: any[] = [];

  for (const r of cubetaRows) {
    const rawId = cleanString(r.Id);
    const dentroFuera = cleanString(r.Estado).toLowerCase() || 'dentro';

    cubetasToInsert.push({
      access_id: rawId,
      codigo: rawId, // Access Id es codigo en postgres
      descripcion: cleanString(r.Detalle), // Access Detalle es descripcion en postgres
      dentro_fuera: dentroFuera, // Access Estado es dentro_fuera en postgres
      estado: 'activo' // Todos 'activo'
    });
  }

  console.log(`Insertando ${cubetasToInsert.length} cubetas en PostgreSQL...`);
  const insertedCubetas = await dataSource.getRepository(Cubeta).save(cubetasToInsert);

  const cubetaMapByCode = new Map<string, number>();
  insertedCubetas.forEach(c => {
    if (c.codigo) {
      cubetaMapByCode.set(c.codigo.toUpperCase().trim(), c.id);
    }
  });

  // ----------------------------------------------------
  // 5. MIGRAR TRABAJO_LAB
  // ----------------------------------------------------
  const trabajoTable = reader.getTable('Trabajo_Lab');
  const trabajoRows = trabajoTable.getData();
  console.log(`\nSe encontraron ${trabajoRows.length} registros en Trabajo_Lab de Access.`);

  const trabajosToInsert: any[] = [];
  const now = new Date().toISOString().split('T')[0];

  for (const r of trabajoRows) {
    const rawId = cleanString(r.IdTrabajo);
    const numId = parseInt(rawId.replace(/^T-/i, ''), 10);

    // Cotejar Laboratorio
    const labName = cleanString(r.Laboratorio).toUpperCase().trim();
    let idLaboratorio = labMapByName.get(labName) || null;
    if (!idLaboratorio) {
      for (const [k, id] of labMapByName.entries()) {
        if (k.includes(labName) || labName.includes(k)) {
          idLaboratorio = id;
          break;
        }
      }
    }

    // Cotejar Paciente
    const pacName = cleanString(r.Paciente).toUpperCase().replace(/\s+/g, ' ');
    const idPaciente = pacMapByName.get(pacName) || null;

    // Cotejar Trabajo con Precios_Laboratorios
    const trabajoName = cleanString(r.Trabajo).toUpperCase().trim();
    let idprecios_laboratorios: number | null = null;
    if (idLaboratorio && trabajoName) {
      const pKey = `${idLaboratorio}_${trabajoName}`;
      idprecios_laboratorios = precioMapKey.get(pKey) || null;
      if (!idprecios_laboratorios) {
        for (const pr of precios) {
          if (pr.idLaboratorio === idLaboratorio) {
            const det = pr.detalle.toUpperCase().trim();
            if (det.includes(trabajoName) || trabajoName.includes(det)) {
              idprecios_laboratorios = pr.id;
              break;
            }
          }
        }
      }
    }

    // Cotejar Cubeta
    const cubCode = cleanString(r.Cubeta).toUpperCase().trim();
    const idCubeta = cubCode ? (cubetaMapByCode.get(cubCode) || null) : null;

    // Fechas y Valores
    const fecha = cleanDate(r.Fecha || r.fnum1) || now;
    const fecha_pedido = cleanDate(r.Fecha_Entrega || r.fnum2) || null; // Fecha_Entrega es fecha_pedido
    const cantidad = parseInt(cleanString(r.Cantidad), 10) || 1;
    const precio_unitario = parseCurrency(r.Costo); // Costo es precio_unitario
    const total = parseCurrency(r.Costo_Real); // Costo_Real es total

    const estadoTrabajo = cleanString(r.Estado_Trabajo).toLowerCase() || 'no terminado';
    const cita = cleanString(r.Cita).toLowerCase() || 'no';
    const pagado = cleanString(r.Pagado).toLowerCase() || 'no';
    const resaltar = cleanString(r.Resaltar).toLowerCase() || 'no';

    trabajosToInsert.push({
      id: !isNaN(numId) ? numId : undefined,
      access_id: rawId,
      idLaboratorio,
      idPaciente,
      idprecios_laboratorios,
      fecha,
      pieza: cleanString(r.Pieza),
      cantidad,
      fecha_pedido,
      color: cleanString(r.Color),
      estado: estadoTrabajo,
      cita,
      observacion: cleanString(r.Observaciones),
      pagado,
      precio_unitario,
      total,
      resaltar,
      idCubeta
    });
  }

  console.log(`Insertando ${trabajosToInsert.length} trabajos de laboratorio en PostgreSQL...`);
  const chunkSize = 2000;
  for (let i = 0; i < trabajosToInsert.length; i += chunkSize) {
    const chunk = trabajosToInsert.slice(i, i + chunkSize);
    await dataSource.getRepository(TrabajoLaboratorio).insert(chunk);
    console.log(`  -> Insertados ${Math.min(i + chunkSize, trabajosToInsert.length)} / ${trabajosToInsert.length} trabajos de laboratorio...`);
  }

  console.log('\n======================================================');
  console.log('  MIGRACIÓN COMPLETADA CON ÉXITO: CUBETAS Y TRABAJOS DE LABORATORIO');
  console.log(`  - Cubetas migradas: ${insertedCubetas.length}`);
  console.log(`  - Trabajos de Laboratorio migrados: ${trabajosToInsert.length}`);
  console.log('======================================================\n');
}

if (require.main === module) {
  migrateCubetasYTrabajos()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error durante la migración:', err);
      process.exit(1);
    });
}
