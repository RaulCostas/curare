import { getAppDataSource } from '../config';
import { Agenda } from '../../../src/agenda/entities/agenda.entity';
import { Paciente } from '../../../src/pacientes/entities/paciente.entity';
import { Doctor } from '../../../src/doctors/entities/doctor.entity';
import { User } from '../../../src/users/entities/user.entity';
import { cleanString, cleanDate } from '../utils/formatters';
import * as fs from 'fs';
const mdb = require('mdb-reader');

export async function migrateAgenda() {
  console.log('\n======================================================');
  console.log('  INICIANDO MIGRACIÓN: AGENDA');
  console.log('======================================================\n');

  const dataSource = await getAppDataSource();

  // 1. Limpiar tabla agenda
  console.log('Conexión a PostgreSQL establecida correctamente.');
  console.log('Limpiando tabla agenda en PostgreSQL...');
  await dataSource.query('TRUNCATE TABLE "agenda" RESTART IDENTITY CASCADE;');

  // 2. Cargar mapas auxiliares
  console.log('Cargando mapas auxiliares (Pacientes, Doctores, Usuarios)...');

  // Mapa de Pacientes por Nombre Completo
  const pacs = await dataSource.getRepository(Paciente).find({ select: ['id', 'nombre', 'paterno', 'materno'] });
  const pacMapByName = new Map<string, number>();

  for (const p of pacs) {
    const p1 = `${p.paterno} ${p.materno} ${p.nombre}`.toUpperCase().trim().replace(/\s+/g, ' ');
    const p2 = `${p.paterno} ${p.nombre}`.toUpperCase().trim().replace(/\s+/g, ' ');
    const p3 = `${p.nombre} ${p.paterno} ${p.materno}`.toUpperCase().trim().replace(/\s+/g, ' ');
    const p4 = `${p.nombre} ${p.paterno}`.toUpperCase().trim().replace(/\s+/g, ' ');
    pacMapByName.set(p1, p.id);
    pacMapByName.set(p2, p.id);
    pacMapByName.set(p3, p.id);
    pacMapByName.set(p4, p.id);
  }

  // Mapa de Doctores por Nombre Completo
  const doctores = await dataSource.getRepository(Doctor).find();
  function findDoctorId(nombre: string): number | null {
    if (!nombre) return null;
    const str = nombre.toUpperCase().trim().replace(/\s+/g, ' ');

    for (const d of doctores) {
      const full = `${d.paterno} ${d.materno} ${d.nombre}`.toUpperCase().trim().replace(/\s+/g, ' ');
      if (full.includes(str) || str.includes(full)) return d.id;
      if (str.includes(d.paterno.toUpperCase()) && str.includes(d.nombre.toUpperCase())) return d.id;
    }

    for (const d of doctores) {
      const p1 = d.paterno.toUpperCase();
      const n1 = d.nombre.toUpperCase();
      if (str.includes(p1) || str.includes(n1)) return d.id;
    }

    return null;
  }

  // Mapa de Usuarios (Quien Agendó)
  const usuarios = await dataSource.getRepository(User).find();
  function findUsuarioId(nombre: string): number | null {
    if (!nombre || !nombre.trim()) return 1; // Default admin/user 1 if blank
    const str = nombre.toUpperCase().trim().replace(/\s+/g, ' ');

    for (const u of usuarios) {
      const uName = (u.name || '').toUpperCase().trim().replace(/\s+/g, ' ');
      const uEmail = (u.email || '').toUpperCase().trim();
      if (uName && (uName.includes(str) || str.includes(uName))) return u.id;
      if (uEmail.startsWith(str)) return u.id;
    }

    for (const u of usuarios) {
      const parts = (u.name || '').toUpperCase().split(/\s+/);
      for (const p of parts) {
        if (p.length > 2 && str.includes(p)) return u.id;
      }
    }

    return 1; // Default fallback to user 1
  }

  // Función para parsear Consultorio (1 a 5)
  function parseConsultorio(str: string): number {
    if (!str) return 1;
    // Extraer los dígitos después del # (ej. CONSULTORIO # 4 4 -> 4, CONSULTORIO # 36 -> 3)
    const match = str.match(/#\s*\.?\s*0*([1-5])/);
    if (match) {
      return parseInt(match[1], 10);
    }
    const match2 = str.match(/([1-5])/);
    if (match2) {
      return parseInt(match2[1], 10);
    }
    return 1;
  }

  // Función para combinar Fecha_Agendado y Hora_Agendado en un objeto Date
  function combineFechaHoraAgendado(rawFecha: any, rawHora: any): Date | null {
    const dateStr = cleanDate(rawFecha);
    if (!dateStr) return null;

    let timeStr = cleanString(rawHora);
    if (!timeStr || !timeStr.includes(':')) {
      timeStr = '00:00:00';
    } else {
      const parts = timeStr.split(':');
      const h = parseInt(parts[0], 10) || 0;
      const m = parseInt(parts[1], 10) || 0;
      const s = parseInt(parts[2], 10) || 0;
      timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    const isoCombined = `${dateStr}T${timeStr}`;
    const d = new Date(isoCombined);
    return isNaN(d.getTime()) ? null : d;
  }

  // 3. Leer Agenda desde Access
  const mdbPath = 'd:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb';
  if (!fs.existsSync(mdbPath)) {
    throw new Error(`No se encontró la base de datos Access en: ${mdbPath}`);
  }

  const MDBReader = mdb.default || mdb;
  const buffer = fs.readFileSync(mdbPath);
  const reader = new MDBReader(buffer);

  const agendaTable = reader.getTable('Agenda');
  const rows = agendaTable.getData();
  console.log(`Se encontraron ${rows.length} registros en Agenda de Access.`);

  const agendaToInsert: any[] = [];
  const now = new Date().toISOString();

  for (const r of rows) {
    const rawId = cleanString(r.IdAgenda);
    const numId = parseInt(rawId.replace(/^AG-/i, ''), 10);

    const fecha = cleanDate(r.Fecha || r.fnum1) || now.split('T')[0];
    let hora = cleanString(r.Hora);
    if (!hora || !hora.includes(':')) {
      hora = '08:00';
    } else {
      const parts = hora.split(':');
      const h = parseInt(parts[0], 10) || 8;
      const m = parseInt(parts[1], 10) || 0;
      hora = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
    }

    const duracion = parseInt(cleanString(r.Duracion), 10) || 30;
    const consultorio = parseConsultorio(cleanString(r.Consultorio));

    const pacName = cleanString(r.Paciente).toUpperCase().replace(/\s+/g, ' ');
    const pacienteId = pacMapByName.get(pacName) || null;

    const doctorId = findDoctorId(cleanString(r.Doctor));
    const usuarioId = findUsuarioId(cleanString(r.Quien_Agendo));

    const tratamiento = cleanString(r.Tratamiento);
    const estado = cleanString(r.Estado).toLowerCase() || 'agendado';
    const fechaAgendado = combineFechaHoraAgendado(r.Fecha_Agendado, r.Hora_Agendado);

    agendaToInsert.push({
      id: !isNaN(numId) ? numId : undefined,
      access_id: rawId,
      fecha,
      hora,
      duracion,
      consultorio,
      pacienteId,
      doctorId,
      proformaId: null,
      tratamiento,
      personalId: null,
      usuarioId,
      estado,
      fechaAgendado
    });
  }

  console.log(`Insertando ${agendaToInsert.length} registros de agenda en PostgreSQL...`);
  const chunkSize = 2000;
  for (let i = 0; i < agendaToInsert.length; i += chunkSize) {
    const chunk = agendaToInsert.slice(i, i + chunkSize);
    await dataSource.getRepository(Agenda).insert(chunk);
    console.log(`  -> Insertados ${Math.min(i + chunkSize, agendaToInsert.length)} / ${agendaToInsert.length} registros de agenda...`);
  }

  console.log('\n======================================================');
  console.log('  MIGRACIÓN COMPLETADA CON ÉXITO: AGENDA');
  console.log(`  - Total Registros Migrados: ${agendaToInsert.length}`);
  console.log('======================================================\n');
}

if (require.main === module) {
  migrateAgenda()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error durante la migración:', err);
      process.exit(1);
    });
}
