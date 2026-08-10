import { getAppDataSource } from './config';
import { HistoriaClinica } from '../../src/historia_clinica/entities/historia_clinica.entity';

async function testPatinoEjecutado() {
  const dataSource = await getAppDataSource();

  const historia = await dataSource.getRepository(HistoriaClinica).find({
    where: { pacienteId: 415, proformaId: 10158 }
  });

  console.log('--- HISTORIA CLINICA PATIÑO PROFORMA 04 ---');
  let totalTodosTerminados = 0;
  let totalSoloConDetalle = 0;

  historia.forEach(h => {
    console.log(`ID: ${h.id} | Trat: ${h.tratamiento} | DetalleId: ${h.proformaDetalleId} | Estado: ${h.estadoTratamiento} | Precio: ${h.precio}`);
    if (h.estadoTratamiento === 'terminado') {
      totalTodosTerminados += Number(h.precio);
      if (h.proformaDetalleId !== null) {
        totalSoloConDetalle += Number(h.precio);
      }
    }
  });

  console.log(`\n- Total Todos Terminados: ${totalTodosTerminados}`);
  console.log(`- Total Solo Con ProformaDetalle (del Plan): ${totalSoloConDetalle}`);

  process.exit(0);
}

testPatinoEjecutado();
