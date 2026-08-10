import { getAppDataSource } from './config';
import { Proforma } from '../../src/proformas/entities/proforma.entity';
import { ProformaDetalle } from '../../src/proformas/entities/proforma-detalle.entity';

async function verifyProformas() {
  const dataSource = await getAppDataSource();

  const countProformas = await dataSource.getRepository(Proforma).count();
  const countDetalles = await dataSource.getRepository(ProformaDetalle).count();

  console.log('=== VERIFICACIÓN EN POSTGRESQL ===');
  console.log(`- Total Proformas Cabecera: ${countProformas}`);
  console.log(`- Total Proformas Detalle: ${countDetalles}`);

  const sampleProforma = await dataSource.getRepository(Proforma).findOne({
    where: { id: 1 },
    relations: ['paciente', 'usuario', 'detalles', 'detalles.arancel'],
  });

  console.log('\n--- PROFORMA ID 1 (Muestra) ---');
  console.log({
    id: sampleProforma?.id,
    numero: sampleProforma?.numero,
    fecha: sampleProforma?.fecha,
    total: sampleProforma?.total,
    paciente: sampleProforma?.paciente ? `${sampleProforma.paciente.id} - ${sampleProforma.paciente.nombre} ${sampleProforma.paciente.paterno}` : null,
    usuario: sampleProforma?.usuario ? `${sampleProforma.usuario.id} - ${sampleProforma.usuario.name}` : null,
    detallesCount: sampleProforma?.detalles?.length,
    muestraDetalles: sampleProforma?.detalles?.slice(0, 3).map(d => ({
      id: d.id,
      arancelCodigo: d.arancel?.codigo,
      arancelDetalle: d.arancel?.detalle,
      piezas: d.piezas,
      cantidad: d.cantidad,
      precioUnitario: d.precioUnitario,
      total: d.total,
      precio: d.precio,
    }))
  });

  process.exit(0);
}

verifyProformas();
