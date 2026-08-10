import { getAppDataSource } from '../config';
import { cleanString } from '../utils/formatters';
import * as fs from 'fs';
const mdb = require('mdb-reader');

export async function migrateMusicaTelevisionModule() {
  console.log('\n======================================================');
  console.log('  INICIANDO MIGRACIÓN: MÚSICA Y TELEVISIÓN PREFERENCIAS');
  console.log('======================================================\n');

  const dataSource = await getAppDataSource();

  // 1. Limpiar tablas relacionales en PostgreSQL
  console.log('Limpiando tablas paciente_musica y paciente_television...');
  await dataSource.query('TRUNCATE TABLE "paciente_musica" RESTART IDENTITY CASCADE;');
  await dataSource.query('TRUNCATE TABLE "paciente_television" RESTART IDENTITY CASCADE;');

  // 2. Mapear pacientes por access_id -> id
  console.log('Cargando mapa de pacientes por access_id...');
  const pacientesRows: any[] = await dataSource.query('SELECT id, access_id FROM pacientes WHERE access_id IS NOT NULL;');
  const pacienteMap = new Map<string, number>();
  for (const p of pacientesRows) {
    if (p.access_id) {
      pacienteMap.set(cleanString(p.access_id), Number(p.id));
    }
  }
  console.log(`Pacientes cargados en mapa: ${pacienteMap.size}`);

  // 3. Obtener IDs de las tablas musica y television en PostgreSQL
  const musicaRows: any[] = await dataSource.query('SELECT id, musica FROM musica;');
  const musicaMap = new Map<string, number>();
  for (const m of musicaRows) {
    const key = m.musica.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    musicaMap.set(key, m.id);
  }

  const televisionRows: any[] = await dataSource.query('SELECT id, television FROM television;');
  const tvMap = new Map<string, number>();
  for (const t of televisionRows) {
    const key = t.television.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    tvMap.set(key, t.id);
  }

  // Mapeos explícitos de columnas de Access -> IDs de PostgreSQL
  const musicFieldToId: { [key: string]: number } = {
    instrumental: musicaMap.get('instrumental') || 1,
    clasica: musicaMap.get('clasica') || 2,
    pop_rock_ingles: musicaMap.get('pop rock ingles') || 3,
    pop_rock_espanol: musicaMap.get('pop rock espanol') || 4,
    baladas_ingles: musicaMap.get('baladas en ingles') || 5,
    baladas_espanol: musicaMap.get('baladas en espanol') || 6,
  };

  const tvFieldToId: { [key: string]: number } = {
    culturales: tvMap.get('culturales') || 1,
    deportivos: tvMap.get('deportivos') || 2,
    informativos: tvMap.get('informativos') || 3,
    peliculas: tvMap.get('peliculas') || 4,
    infantiles: tvMap.get('infantiles') || 5,
    musicales: tvMap.get('musicales') || 6,
    varios: tvMap.get('varios') || 7,
    ninguna: tvMap.get('ninguna') || 8,
  };

  // 4. Abrir MDB Access
  const mdbPath = 'd:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb';
  if (!fs.existsSync(mdbPath)) {
    throw new Error(`No se encontró la base de datos Access en: ${mdbPath}`);
  }

  const MDBReader = mdb.default || mdb;
  const buffer = fs.readFileSync(mdbPath);
  const reader = new MDBReader(buffer);

  let pacienteMusicaInsertados = 0;
  let pacienteTvInsertados = 0;

  if (reader.getTableNames().includes('Musica_Tele')) {
    const table = reader.getTable('Musica_Tele');
    const rows: any[] = table.getData();
    console.log(`Migrando preferencias para ${rows.length} registros de la tabla Musica_Tele...`);

    for (const r of rows) {
      const accessId = cleanString(r.Id);
      if (!accessId) continue;

      const pacienteId = pacienteMap.get(accessId);
      if (!pacienteId) continue;

      // A. Procesar Música
      for (const [colName, musicaId] of Object.entries(musicFieldToId)) {
        const val = cleanString(r[colName]);
        if (val && val.toUpperCase() === 'X') {
          await dataSource.query(`
            INSERT INTO paciente_musica ("pacienteId", "musicaId", created_at)
            VALUES ($1, $2, NOW());
          `, [pacienteId, musicaId]);
          pacienteMusicaInsertados++;
        }
      }

      // B. Procesar Televisión
      for (const [colName, televisionId] of Object.entries(tvFieldToId)) {
        const val = cleanString(r[colName]);
        if (val && val.toUpperCase() === 'X') {
          await dataSource.query(`
            INSERT INTO paciente_television ("pacienteId", "televisionId", created_at)
            VALUES ($1, $2, NOW());
          `, [pacienteId, televisionId]);
          pacienteTvInsertados++;
        }
      }
    }

    await dataSource.query(`SELECT setval('paciente_musica_id_seq', (SELECT GREATEST(MAX(id), 1) FROM paciente_musica));`);
    await dataSource.query(`SELECT setval('paciente_television_id_seq', (SELECT GREATEST(MAX(id), 1) FROM paciente_television));`);
  }

  console.log('\n======================================================');
  console.log('  MIGRACIÓN COMPLETADA CON ÉXITO: MÚSICA Y TELEVISIÓN');
  console.log(`  - Total Relaciones Música Paciente Migradas: ${pacienteMusicaInsertados}`);
  console.log(`  - Total Relaciones Televisión Paciente Migradas: ${pacienteTvInsertados}`);
  console.log('======================================================\n');
}

if (require.main === module) {
  migrateMusicaTelevisionModule()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error durante la migración:', err);
      process.exit(1);
    });
}
