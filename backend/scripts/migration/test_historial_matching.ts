import { getAppDataSource, getMdbReader } from './config';
import { Doctor } from '../../src/doctors/entities/doctor.entity';
import { Personal } from '../../src/personal/entities/personal.entity';
import { Especialidad } from '../../src/especialidad/entities/especialidad.entity';
import { Proforma } from '../../src/proformas/entities/proforma.entity';
import { ProformaDetalle } from '../../src/proformas/entities/proforma-detalle.entity';

async function testHistorialMatching() {
  const dataSource = await getAppDataSource();
  const reader = getMdbReader();

  const doctores = await dataSource.getRepository(Doctor).find();
  const personal = await dataSource.getRepository(Personal).find();
  const especialidades = await dataSource.getRepository(Especialidad).find();

  console.log(`DOCTORES EN PG: ${doctores.length}`);
  console.log(`PERSONAL EN PG: ${personal.length}`);
  console.log(`ESPECIALIDADES EN PG: ${especialidades.length}`);

  const historyRows = reader.getTable('Historial_Odonto').getData();

  let matchedDoctorCount = 0;
  let matchedPersonalCount = 0;
  let matchedEspecialidadCount = 0;

  for (const r of historyRows) {
    const docStr = r.Doctor ? r.Doctor.trim().toUpperCase() : '';
    if (docStr) {
      const doc = doctores.find(d => {
        const fullname = `${d.paterno} ${d.materno || ''} ${d.nombre}`.toUpperCase();
        const fullname2 = `${d.nombre} ${d.paterno}`.toUpperCase();
        return fullname.includes(docStr) || fullname2.includes(docStr) || docStr.includes(d.paterno.toUpperCase());
      });
      if (doc) matchedDoctorCount++;
    }

    const asisStr = r.Asistente ? r.Asistente.trim().toUpperCase() : '';
    if (asisStr) {
      const pers = personal.find(p => {
        const fullname = `${p.nombre} ${p.paterno} ${p.materno || ''}`.toUpperCase();
        return fullname.includes(asisStr) || asisStr.includes(p.paterno.toUpperCase());
      });
      if (pers) matchedPersonalCount++;
    }

    const tratStr = r.Trat ? r.Trat.trim().toUpperCase() : '';
    if (tratStr) {
      matchedEspecialidadCount++;
    }
  }

  console.log(`\nRESULTADOS DE COINCIDENCIAS (sobre ${historyRows.length} filas):`);
  console.log(`- Doctores emparejados: ${matchedDoctorCount}`);
  console.log(`- Personal (Asistente) emparejados: ${matchedPersonalCount}`);
  console.log(`- Especialidad (Trat) presentes: ${matchedEspecialidadCount}`);

  process.exit(0);
}

testHistorialMatching();
