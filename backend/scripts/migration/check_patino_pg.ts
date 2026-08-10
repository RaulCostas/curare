import { getAppDataSource } from './config';
import { Paciente } from '../../src/pacientes/entities/paciente.entity';
import { Proforma } from '../../src/proformas/entities/proforma.entity';
import { HistoriaClinica } from '../../src/historia_clinica/entities/historia_clinica.entity';
import { Pago } from '../../src/pagos/entities/pago.entity';

async function checkPatinoPg() {
  const dataSource = await getAppDataSource();

  const paciente = await dataSource.getRepository(Paciente).findOne({
    where: { paterno: 'PATIÑO', nombre: 'MARIA JIMENA' }
  });

  console.log('--- PACIENTE EN PG ---');
  console.log(paciente);

  if (paciente) {
    // Proforma 04
    const proforma04 = await dataSource.getRepository(Proforma).findOne({
      where: { pacienteId: paciente.id, numero: 4 },
      relations: ['detalles']
    });

    console.log('\n--- PROFORMA 04 EN PG ---');
    console.log({
      id: proforma04?.id,
      numero: proforma04?.numero,
      total: proforma04?.total,
      detallesCount: proforma04?.detalles?.length
    });

    // Historia Clinica for Proforma 04
    const historia = await dataSource.getRepository(HistoriaClinica).find({
      where: { pacienteId: paciente.id, proformaId: proforma04?.id }
    });

    console.log(`\n--- HISTORIA CLINICA PROFORMA 04 EN PG (${historia.length}) ---`);
    let totalEjecutado = 0;
    historia.forEach(h => {
      console.log(`ID: ${h.id} | Fecha: ${h.fecha} | Trat: ${h.tratamiento} | Estado: ${h.estadoTratamiento} | Precio: ${h.precio}`);
      if (h.estadoTratamiento === 'terminado') {
        totalEjecutado += Number(h.precio);
      }
    });
    console.log(`TOTAL EJECUTADO EN HISTORIA CLINICA: ${totalEjecutado}`);

    // Pagos for Proforma 04
    const pagos = await dataSource.getRepository(Pago).find({
      where: { pacienteId: paciente.id, proformaId: proforma04?.id }
    });

    console.log(`\n--- PAGOS PROFORMA 04 EN PG (${pagos.length}) ---`);
    let totalPagadoBs = 0;
    pagos.forEach(p => {
      console.log(`ID: ${p.id} | AccessID: ${p.access_id} | Fecha: ${p.fecha} | Monto: ${p.monto} | Moneda: ${p.moneda} | TC: ${p.tc}`);
      totalPagadoBs += Number(p.monto);
    });
    console.log(`TOTAL PAGADO EN PAGOS PG: ${totalPagadoBs}`);
  }

  process.exit(0);
}

checkPatinoPg();
