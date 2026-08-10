import { getAppDataSource } from '../config';
import { PagoLaboratorio } from '../../../src/pagos_laboratorios/entities/pago-laboratorio.entity';
import { TrabajoLaboratorio } from '../../../src/trabajos_laboratorios/entities/trabajo_laboratorio.entity';
import { FormaPago } from '../../../src/forma_pago/entities/forma_pago.entity';
import { cleanString, cleanDate, parseCurrency } from '../utils/formatters';
import * as fs from 'fs';
const mdb = require('mdb-reader');

export async function migratePagosLaboratorios() {
  console.log('\n======================================================');
  console.log('  INICIANDO MIGRACIÓN: PAGOS LABORATORIOS');
  console.log('======================================================\n');

  const dataSource = await getAppDataSource();

  // 1. Limpiar tabla
  console.log('Conexión a PostgreSQL establecida correctamente.');
  console.log('Limpiando tabla pagos_laboratorios en PostgreSQL...');
  await dataSource.query('TRUNCATE TABLE "pagos_laboratorios" RESTART IDENTITY CASCADE;');

  // 2. Cargar mapas auxiliares
  console.log('Cargando mapas auxiliares (Trabajos de Laboratorio, Formas de Pago)...');

  const trabajos = await dataSource.getRepository(TrabajoLaboratorio).find({
    relations: ['laboratorio', 'paciente', 'precioLaboratorio']
  });

  const trabajoByAccessId = new Map<string, number>();
  trabajos.forEach(t => {
    if (t.access_id) trabajoByAccessId.set(t.access_id.toUpperCase().trim(), t.id);
  });

  function normalizeStr(s: string): string {
    return (s || '').toUpperCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  const formaRepo = dataSource.getRepository(FormaPago);
  let formas = await formaRepo.find();
  const existingNorms = new Set(formas.map(f => normalizeStr(f.forma_pago)));

  const defaultsNeeded = ['Efectivo', 'Cheque', 'Transferencia', 'QR', 'Tarjeta', 'Débito', 'Depósito'];
  let addedAny = false;
  for (const defName of defaultsNeeded) {
    if (!existingNorms.has(normalizeStr(defName))) {
      await formaRepo.save({ forma_pago: defName, estado: 'activo' });
      addedAny = true;
    }
  }
  if (addedAny) {
    formas = await formaRepo.find();
  }

  function findFormaPagoId(nombreStr: string): number {
    if (!nombreStr) return 1; // Default Efectivo
    const str = normalizeStr(nombreStr);
    for (const f of formas) {
      const fn = normalizeStr(f.forma_pago);
      if (fn.includes(str) || str.includes(fn)) return f.id;
    }
    return 1;
  }

  // 3. Leer Pago_Trabajos desde Access
  const mdbPath = 'd:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb';
  if (!fs.existsSync(mdbPath)) {
    throw new Error(`No se encontró la base de datos Access en: ${mdbPath}`);
  }

  const MDBReader = mdb.default || mdb;
  const buffer = fs.readFileSync(mdbPath);
  const reader = new MDBReader(buffer);

  const pagoTable = reader.getTable('Pago_Trabajos');
  const rows = pagoTable.getData();
  console.log(`Se encontraron ${rows.length} registros en Pago_Trabajos de Access.`);

  const pagosToInsert: any[] = [];
  const now = new Date().toISOString().split('T')[0];

  for (const r of rows) {
    const rawId = cleanString(r.IdPagos);
    const numId = parseInt(rawId.replace(/^P-L-/i, ''), 10);

    const rawIdTrab = cleanString(r.IdTrabajo).toUpperCase();
    let idTrabajos_Laboratorios = (rawIdTrab && rawIdTrab !== '.') ? (trabajoByAccessId.get(rawIdTrab) || null) : null;

    // Si IdTrabajo era '.' intentamos matching secundario
    if (!idTrabajos_Laboratorios) {
      const pacName = cleanString(r.Paciente).toUpperCase().replace(/\s+/g, ' ');
      const labName = cleanString(r.Laboratorio).toUpperCase().trim();
      const pz = cleanString(r.Pieza);

      const candidate = trabajos.find(t => {
        const pName = t.paciente ? `${t.paciente.paterno} ${t.paciente.nombre}`.toUpperCase().replace(/\s+/g, ' ') : '';
        const lName = t.laboratorio ? t.laboratorio.laboratorio.toUpperCase().trim() : '';

        if (!pName || !lName) return false;
        const matchP = pName.includes(pacName) || pacName.includes(pName);
        const matchL = lName.includes(labName) || labName.includes(lName);
        const matchPieza = !pz || !t.pieza || t.pieza.includes(pz) || pz.includes(t.pieza);

        return matchP && matchL && matchPieza;
      });

      if (candidate) {
        idTrabajos_Laboratorios = candidate.id;
      }
    }

    const fecha = cleanDate(r.Fecha || r.fnum1) || now;
    const monto = parseCurrency(r.Total);
    const monedaStr = cleanString(r.Moneda).toUpperCase();
    const moneda = monedaStr.includes('DOLAR') || monedaStr.includes('SUS') ? 'DOLARES' : 'BOLIVIANOS';
    const tc = moneda === 'DOLARES' ? 6.95 : 1.0;

    const idforma_pago = findFormaPagoId(cleanString(r.Forma_Pago));
    const recibo = cleanString(r.Recibo);
    const banco = cleanString(r.Banco);

    pagosToInsert.push({
      id: !isNaN(numId) ? numId : undefined,
      access_id: rawId,
      fecha,
      idTrabajos_Laboratorios,
      monto,
      moneda,
      idforma_pago,
      tc,
      recibo: (recibo && recibo !== '.') ? recibo : null,
      banco: (banco && banco !== '.') ? banco : null
    });
  }

  console.log(`Insertando ${pagosToInsert.length} pagos de laboratorio en PostgreSQL...`);
  const chunkSize = 2000;
  for (let i = 0; i < pagosToInsert.length; i += chunkSize) {
    const chunk = pagosToInsert.slice(i, i + chunkSize);
    await dataSource.getRepository(PagoLaboratorio).insert(chunk);
    console.log(`  -> Insertados ${Math.min(i + chunkSize, pagosToInsert.length)} / ${pagosToInsert.length} pagos de laboratorio...`);
  }

  console.log('\n======================================================');
  console.log('  MIGRACIÓN COMPLETADA CON ÉXITO: PAGOS LABORATORIOS');
  console.log(`  - Total Registros Migrados: ${pagosToInsert.length}`);
  console.log('======================================================\n');
}

if (require.main === module) {
  migratePagosLaboratorios()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error durante la migración:', err);
      process.exit(1);
    });
}
