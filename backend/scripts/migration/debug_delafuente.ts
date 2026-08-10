import { getAppDataSource, getMdbReader } from './config';
import { Paciente } from '../../src/pacientes/entities/paciente.entity';
import { Proforma } from '../../src/proformas/entities/proforma.entity';
import { ProformaDetalle } from '../../src/proformas/entities/proforma-detalle.entity';
import { HistoriaClinica } from '../../src/historia_clinica/entities/historia_clinica.entity';

async function debugDeLaFuente() {
  console.log('=== INVESTIGACIÓN: DE LA FUENTE VELASCO MARIA AMALIA ===\n');

  const reader = getMdbReader();
  const dataSource = await getAppDataSource();

  // 1. Buscar paciente en Access
  const pacienteTable = reader.getTable('Paciente').getData();
  const pacMdb = pacienteTable.find((p: any) => {
    const fn = `${p.Paterno || ''} ${p.Materno || ''} ${p.Nombre || ''}`.toUpperCase();
    return fn.includes('FUENTE') && fn.includes('AMALIA');
  });

  console.log('Paciente en Access:', pacMdb ? { IdPaciente: pacMdb.IdPaciente, Paterno: pacMdb.Paterno, Materno: pacMdb.Materno, Nombre: pacMdb.Nombre } : 'No encontrado');

  const pacAccessId = pacMdb ? pacMdb.IdPaciente : null;

  // 2. Proformas en Access
  const proformaTable = reader.getTable('Proforma').getData();
  const proformaHeadersMdb = proformaTable.filter((pr: any) => {
    return pr.IdPaciente === pacAccessId || (pr.Paciente && pr.Paciente.toUpperCase().includes('FUENTE'));
  });

  console.log('\n--- PROFORMAS (CABECERA) EN ACCESS ---');
  proformaHeadersMdb.forEach((h: any) => {
    console.log({
      IdProforma: h.IdProforma,
      IdPaciente: h.IdPaciente,
      Numero_Pro: h.Numero_Pro,
      Fecha: h.Fecha || h.fnum1,
      Total_Trat: h.Total_Trat,
      Usuario: h.Usuario
    });
  });

  // 3. Pro_Detalle en Access
  const detalleTable = reader.getTable('Pro_Detalle').getData();
  const detallesMdb = detalleTable.filter((d: any) => {
    return (d.Paciente && d.Paciente.toUpperCase().includes('FUENTE'));
  });

  console.log('\n--- PRO_DETALLE EN ACCESS ---');
  detallesMdb.forEach((d: any) => {
    console.log({
      IdPro_Detalle: d.IdPro_Detalle,
      IdProforma: d.IdProforma,
      Numero_Proforma: d.Numero_Proforma,
      Paciente: d.Paciente,
      Codigo: d.Codigo,
      Pieza: d.Pieza,
      Total_T: d.Total_T
    });
  });

  // 4. Historial_Odonto en Access
  const historyTable = reader.getTable('Historial_Odonto').getData();
  const historyMdb = historyTable.filter((h: any) => {
    return h.IdPaciente === pacAccessId;
  });

  console.log('\n--- HISTORIAL_ODONTO EN ACCESS ---');
  historyMdb.forEach((h: any) => {
    console.log({
      IdHistorial_Odonto: h.IdHistorial_Odonto,
      IdPaciente: h.IdPaciente,
      FechaCita: h.FechaCita || h.fnum2,
      Plan_Tratamiento: h.Plan_Tratamiento,
      Pieza: h.Pieza,
      Tratamiento: h.Tratamiento,
      Codigo_Tratamiento: h.Codigo_Tratamiento,
      Precio: h.Precio
    });
  });

  // 5. PostgreSQL estado actual
  const pacPg = await dataSource.getRepository(Paciente).findOne({
    where: { paterno: 'DE LA FUENTE', nombre: 'MARIA AMALIA' }
  });

  if (pacPg) {
    console.log(`\n--- PROFORMAS EN POSTGRESQL PARA PACIENTE ID ${pacPg.id} ---`);
    const proformasPg = await dataSource.getRepository(Proforma).find({
      where: { pacienteId: pacPg.id },
      relations: ['detalles', 'detalles.arancel'],
      order: { numero: 'ASC' }
    });

    proformasPg.forEach(pr => {
      console.log({
        id: pr.id,
        numero: pr.numero,
        fecha: pr.fecha,
        total: pr.total,
        detallesCount: pr.detalles ? pr.detalles.length : 0,
        detalles: pr.detalles ? pr.detalles.map(d => ({ id: d.id, codigo: d.arancel?.codigo, detalle: d.arancel?.detalle, total: d.total })) : []
      });
    });

    const historiaPg = await dataSource.getRepository(HistoriaClinica).find({
      where: { pacienteId: pacPg.id },
      order: { fecha: 'ASC' }
    });

    console.log(`\n--- HISTORIA CLÍNICA EN POSTGRESQL (${historiaPg.length} registros) ---`);
    historiaPg.forEach(hc => {
      console.log({
        id: hc.id,
        fecha: hc.fecha,
        pieza: hc.pieza,
        tratamiento: hc.tratamiento,
        proformaId: hc.proformaId,
        proformaDetalleId: hc.proformaDetalleId,
        precio: hc.precio
      });
    });
  }

  process.exit(0);
}

debugDeLaFuente().catch(err => {
  console.error(err);
  process.exit(1);
});
