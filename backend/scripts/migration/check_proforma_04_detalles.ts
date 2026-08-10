import { getAppDataSource } from './config';
import { Proforma } from '../../src/proformas/entities/proforma.entity';
import { ProformaDetalle } from '../../src/proformas/entities/proforma-detalle.entity';

async function checkProforma04Detalles() {
  const dataSource = await getAppDataSource();

  const proforma = await dataSource.getRepository(Proforma).findOne({
    where: { id: 10158 },
    relations: ['detalles', 'detalles.arancel']
  });

  console.log(`--- PROFORMA ID 10158 (NUM 04) DETALLES (${proforma?.detalles?.length}) ---`);
  let totalProforma = 0;
  proforma?.detalles?.forEach(d => {
    console.log(`Detalle ID: ${d.id} | Codigo: ${d.arancel?.codigo} | Desc: ${d.arancel?.detalle} | Piezas: "${d.piezas}" | Cant: ${d.cantidad} | Total: ${d.total}`);
    totalProforma += Number(d.total);
  });
  console.log(`TOTAL SUMA PROFORMA DETALLES: ${totalProforma}`);

  process.exit(0);
}

checkProforma04Detalles();
