import { getAppDataSource } from './config';
import { Pago } from '../../src/pagos/entities/pago.entity';
import { FormaPago } from '../../src/forma_pago/entities/forma_pago.entity';
import { ComisionTarjeta } from '../../src/comision_tarjeta/entities/comision_tarjeta.entity';

async function verifyPagos() {
  const dataSource = await getAppDataSource();

  const countFormas = await dataSource.getRepository(FormaPago).count();
  const countComisiones = await dataSource.getRepository(ComisionTarjeta).count();
  const countPagos = await dataSource.getRepository(Pago).count();

  console.log('=== VERIFICACIÓN EN POSTGRESQL: PAGOS Y MÓDULOS ASOCIADOS ===');
  console.log(`- Total Formas de Pago: ${countFormas}`);
  console.log(`- Total Comisiones de Tarjeta: ${countComisiones}`);
  console.log(`- Total Pagos en PostgreSQL: ${countPagos}`);

  const formas = await dataSource.getRepository(FormaPago).find();
  console.log('\n--- FORMAS DE PAGO REGISTRADAS ---');
  console.log(formas.map(f => `${f.id} - ${f.forma_pago} (${f.estado})`));

  const comisiones = await dataSource.getRepository(ComisionTarjeta).find();
  console.log('\n--- COMISIONES DE TARJETA REGISTRADAS ---');
  console.log(comisiones.map(c => `${c.id} - Red: ${c.redBanco} | Comisión: ${c.monto}% (${c.estado})`));

  const samplePagos = await dataSource.getRepository(Pago).find({
    relations: ['paciente', 'proforma', 'formaPagoRel', 'comisionTarjeta'],
    take: 5,
  });

  console.log('\n--- MUESTRA DE 5 PAGOS EN POSTGRESQL ---');
  for (const p of samplePagos) {
    console.log({
      id: p.id,
      access_id: p.access_id,
      paciente: p.paciente ? `${p.paciente.id} - ${p.paciente.nombre} ${p.paciente.paterno}` : null,
      fecha: p.fecha,
      proformaId: p.proformaId,
      monto: p.monto,
      moneda: p.moneda,
      monto_comision: p.monto_comision,
      tc: p.tc,
      recibo: p.recibo,
      factura: p.factura,
      forma_pago: p.formaPagoRel ? p.formaPagoRel.forma_pago : null,
      comision_tarjeta: p.comisionTarjeta ? `${p.comisionTarjeta.redBanco} (${p.comisionTarjeta.monto}%)` : null,
      observaciones: p.observaciones,
    });
  }

  process.exit(0);
}

verifyPagos();
