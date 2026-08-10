import { getAppDataSource } from './config';
import { Paciente } from '../../src/pacientes/entities/paciente.entity';
import { Doctor } from '../../src/doctors/entities/doctor.entity';
import { User } from '../../src/users/entities/user.entity';
import { cleanString } from './utils/formatters';
const mdb = require('mdb-reader');
const fs = require('fs');

async function testAgendaMatching() {
  const dataSource = await getAppDataSource();

  const MDBReader = mdb.default || mdb;
  const mdbPath = 'd:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb';
  const buffer = fs.readFileSync(mdbPath);
  const reader = new MDBReader(buffer);

  // Load maps
  const pacs = await dataSource.getRepository(Paciente).find({ select: ['id', 'nombre', 'paterno', 'materno'] });
  const pacMapByName = new Map<string, number>();
  for (const p of pacs) {
    const full1 = `${p.paterno} ${p.materno} ${p.nombre}`.toUpperCase().trim().replace(/\s+/g, ' ');
    const full2 = `${p.paterno} ${p.nombre}`.toUpperCase().trim().replace(/\s+/g, ' ');
    pacMapByName.set(full1, p.id);
    pacMapByName.set(full2, p.id);
  }

  const doctores = await dataSource.getRepository(Doctor).find();
  function findDoctorId(nombre: string): number | null {
    if (!nombre) return null;
    const str = nombre.toUpperCase().trim();
    for (const d of doctores) {
      const full = `${d.paterno} ${d.materno} ${d.nombre}`.toUpperCase().trim().replace(/\s+/g, ' ');
      if (full.includes(str) || str.includes(d.paterno.toUpperCase())) return d.id;
    }
    return null;
  }

  const usuarios = await dataSource.getRepository(User).find();
  console.log('--- USUARIOS EN POSTGRESQL ---');
  usuarios.forEach(u => console.log(`ID: ${u.id} | Email: ${u.email} | Name: ${u.name}`));

  function findUsuarioId(nombre: string): number | null {
    if (!nombre || !nombre.trim()) return 1; // Default admin/user 1 if blank
    const str = nombre.toUpperCase().trim();

    for (const u of usuarios) {
      const uName = (u.name || '').toUpperCase().trim();
      const uEmail = (u.email || '').toUpperCase().trim();
      if (uName && (uName.includes(str) || str.includes(uName))) return u.id;
      if (uEmail.startsWith(str)) return u.id;
    }

    // Match by first / last name
    for (const u of usuarios) {
      const parts = (u.name || '').toUpperCase().split(/\s+/);
      for (const p of parts) {
        if (p.length > 2 && str.includes(p)) return u.id;
      }
    }

    return 1; // Default fallback to user 1
  }

  const agendaTable = reader.getTable('Agenda');
  const rows = agendaTable.getData();
  console.log(`\nTotal filas en Agenda: ${rows.length}`);

  let matchedPac = 0;
  let matchedDoc = 0;
  let matchedUser = 0;

  for (let i = 0; i < Math.min(10000, rows.length); i++) {
    const r = rows[i];
    const pacName = cleanString(r.Paciente).toUpperCase().replace(/\s+/g, ' ');
    if (pacMapByName.has(pacName)) matchedPac++;

    const docName = cleanString(r.Doctor);
    if (findDoctorId(docName)) matchedDoc++;

    const userName = cleanString(r.Quien_Agendo);
    if (findUsuarioId(userName)) matchedUser++;
  }

  console.log(`En muestra de 10.000: Matched Paciente: ${matchedPac}, Matched Doctor: ${matchedDoc}, Matched Usuario: ${matchedUser}`);

  process.exit(0);
}

testAgendaMatching();
