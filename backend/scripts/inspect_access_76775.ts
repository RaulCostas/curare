import { getMdbReader } from './migration/config';

async function main() {
  const reader = getMdbReader();
  const rows = reader.getTable('Historial_Odonto').getData();
  const match = rows.find((r: any) => String(r.IdHistorial_Odonto).trim() === 'HL-76775' || String(r.IdHistorial_Odonto).trim() === '76775');
  console.log('ACCESS ROW FOR HL-76775:', match);

  // Also search ProformaDetalle / Plan_Tratamiento details in Access for Proforma 14691
  const presRows = reader.getTable('Presupuesto_Detalle').getData();
  const presMatch = presRows.filter((r: any) => String(r.IdPresupuesto).includes('14691'));
  console.log('PRESUPUESTO DETALLE FOR 14691:', presMatch);
}

main().catch(console.error);
