import { getAppDataSource } from './config';
import { ProformaDetalle } from '../../src/proformas/entities/proforma-detalle.entity';
import { HistoriaClinica } from '../../src/historia_clinica/entities/historia_clinica.entity';

async function checkDiscountsInProformas() {
  const dataSource = await getAppDataSource();

  const detallesConDescuento = await dataSource.getRepository(ProformaDetalle).find({
    where: {},
    relations: ['proforma', 'arancel'],
    take: 10
  });

  const sample = detallesConDescuento.filter(d => Number(d.descuento) > 0);

  console.log(`--- MUESTRA DE DETALLES CON DESCUENTO (${sample.length}) ---`);
  for (const d of sample.slice(0, 5)) {
    console.log(`Proforma ID: ${d.proformaId} | Detalle ID: ${d.id} | Arancel: ${d.arancel?.detalle} | SubTotal: ${d.subTotal} | Desc: ${d.descuento}% | Total: ${d.total}`);

    const hc = await dataSource.getRepository(HistoriaClinica).find({
      where: { proformaDetalleId: d.id }
    });

    hc.forEach(h => {
      console.log(`   -> HC ID: ${h.id} | Precio en HC: ${h.precio} | Estado: ${h.estadoTratamiento}`);
    });
  }

  process.exit(0);
}

checkDiscountsInProformas();
