import { getAppDataSource } from './config';
import { HistoriaClinica } from '../../src/historia_clinica/entities/historia_clinica.entity';

async function verifyHistoriaClinica() {
  const dataSource = await getAppDataSource();

  const count = await dataSource.getRepository(HistoriaClinica).count();

  console.log('=== VERIFICACIÓN EN POSTGRESQL: HISTORIA CLÍNICA ===');
  console.log(`- Total Registros en historia_clinica: ${count}`);

  const sampleWithRelations = await dataSource.getRepository(HistoriaClinica).find({
    relations: ['paciente', 'doctor', 'personal', 'especialidad', 'proforma', 'proformaDetalle'],
    take: 5,
  });

  console.log('\n--- MUESTRA DE 5 REGISTROS DE HISTORIA CLÍNICA EN POSTGRESQL ---');
  for (const h of sampleWithRelations) {
    console.log({
      id: h.id,
      access_id: h.access_id,
      paciente: h.paciente ? `${h.paciente.id} - ${h.paciente.nombre} ${h.paciente.paterno}` : null,
      fecha: h.fecha,
      pieza: h.pieza,
      cantidad: h.cantidad,
      tratamiento: h.tratamiento,
      especialidad: h.especialidad ? `${h.especialidad.id} - ${h.especialidad.especialidad}` : null,
      doctor: h.doctor ? `${h.doctor.id} - ${h.doctor.nombre} ${h.doctor.paterno}` : null,
      asistente: h.personal ? `${h.personal.id} - ${h.personal.nombre} ${h.personal.paterno}` : null,
      proformaId: h.proformaId,
      proformaDetalleId: h.proformaDetalleId,
      hoja: h.hoja,
      estadoTratamiento: h.estadoTratamiento,
      estadoPresupuesto: h.estadoPresupuesto,
      pagado: h.pagado,
      precio: h.precio,
      access_plan_pagos_id: h.access_plan_pagos_id,
      access_trabajos_doctores_id: h.access_trabajos_doctores_id,
    });
  }

  process.exit(0);
}

verifyHistoriaClinica();
