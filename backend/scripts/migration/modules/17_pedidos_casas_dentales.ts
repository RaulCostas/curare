import { getAppDataSource } from '../config';
import { Proveedor } from '../../../src/proveedores/entities/proveedor.entity';
import { Pedidos } from '../../../src/pedidos/entities/pedidos.entity';
import { PedidosDetalle } from '../../../src/pedidos/entities/pedidos-detalle.entity';
import { Inventario } from '../../../src/inventario/entities/inventario.entity';
import { PagosPedidos } from '../../../src/pagos_pedidos/entities/pagos_pedidos.entity';
import { cleanString, cleanDate, parseCurrency } from '../utils/formatters';
import * as fs from 'fs';
const mdb = require('mdb-reader');

function normalizeStr(s: string): string {
  return (s || '').toUpperCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export async function migratePedidosCasasDentalesModule() {
  console.log('\n======================================================');
  console.log('  INICIANDO MIGRACIÓN: CASAS DENTALES (PEDIDOS Y PAGOS)');
  console.log('======================================================\n');

  const dataSource = await getAppDataSource();

  // 1. Limpiar tablas
  console.log('Limpiando tablas pagos_pedidos, pedidos_detalle y pedidos en PostgreSQL...');
  await dataSource.query('TRUNCATE TABLE "pagos_pedidos" RESTART IDENTITY CASCADE;');
  await dataSource.query('TRUNCATE TABLE "pedidos_detalle" RESTART IDENTITY CASCADE;');
  await dataSource.query('TRUNCATE TABLE "pedidos" RESTART IDENTITY CASCADE;');

  // 2. Abrir MDB Access
  const mdbPath = 'd:/SOFT-MEDIC/Antigravity/CURARE/backups/curare.mdb';
  if (!fs.existsSync(mdbPath)) {
    throw new Error(`No se encontró la base de datos Access en: ${mdbPath}`);
  }

  const MDBReader = mdb.default || mdb;
  const buffer = fs.readFileSync(mdbPath);
  const reader = new MDBReader(buffer);

  // 3. Obtener o crear Ítem Genérico de Inventario para migración
  const inventarioRepo = dataSource.getRepository(Inventario);
  let genericInventario = await inventarioRepo.findOne({
    where: { descripcion: 'INSUMOS Y MATERIALES DENTALES (MIGRACIÓN ACCESS)' }
  });

  if (!genericInventario) {
    console.log('Creando ítem genérico de inventario para compras históricas...');
    genericInventario = await inventarioRepo.save({
      descripcion: 'INSUMOS Y MATERIALES DENTALES (MIGRACIÓN ACCESS)',
      cantidad_existente: 0,
      stock_minimo: 0,
      estado: 'Activo'
    });
  }
  const genericInventarioId = genericInventario.id;

  // 4. Cargar Proveedores existentes y crear mapa
  const provRepo = dataSource.getRepository(Proveedor);
  const proveedoresList = await provRepo.find();
  const providerMap = new Map<string, number>();

  for (const prov of proveedoresList) {
    providerMap.set(normalizeStr(prov.proveedor), prov.id);
  }

  async function getOrCreateProviderId(casaName: string): Promise<number> {
    const norm = normalizeStr(casaName);
    if (!norm) {
      if (providerMap.has('PROVEEDOR GENERAL')) return providerMap.get('PROVEEDOR GENERAL')!;
      const p = await provRepo.save({ proveedor: 'PROVEEDOR GENERAL', estado: 'activo' });
      providerMap.set(normalizeStr(p.proveedor), p.id);
      return p.id;
    }

    // Coincidencia exacta o parcial
    if (providerMap.has(norm)) return providerMap.get(norm)!;

    for (const [pName, pId] of providerMap.entries()) {
      if (pName.includes(norm) || norm.includes(pName)) {
        return pId;
      }
    }

    // Si no existe, crear nuevo Proveedor
    const newProv = await provRepo.save({
      proveedor: casaName.trim().toUpperCase(),
      estado: 'activo'
    });
    providerMap.set(normalizeStr(newProv.proveedor), newProv.id);
    return newProv.id;
  }

  // 5. Migrar Casas_Dentales -> pedidos y pedidos_detalle
  const casasTable = reader.getTable('Casas_Dentales');
  const casasRows: any[] = casasTable.getData();
  console.log(`Se encontraron ${casasRows.length} registros en Casas_Dentales de Access.`);

  const now = new Date().toISOString().split('T')[0];
  let pedidosCreados = 0;
  let detallesCreados = 0;

  const BATCH_SIZE = 500;

  // Pre-procesar filas
  const pedidosToProcess: any[] = [];
  for (const r of casasRows) {
    const rawId = cleanString(r.Id);
    const numId = parseInt(rawId.replace(/^CD-/i, ''), 10);
    const fecha = cleanDate(r.Fecha || r.fnum1) || now;
    const casaName = cleanString(r.Casa);
    const descripcion = cleanString(r.Descripcion);
    const monto = parseCurrency(r.Monto);
    const pagado = cleanString(r.Pagado).toUpperCase() === 'SI';

    pedidosToProcess.push({
      originalId: rawId,
      numId: !isNaN(numId) ? numId : undefined,
      fecha,
      casaName,
      descripcion,
      monto,
      pagado,
    });
  }

  for (let i = 0; i < pedidosToProcess.length; i += BATCH_SIZE) {
    const chunk = pedidosToProcess.slice(i, i + BATCH_SIZE);

    for (const item of chunk) {
      const provId = await getOrCreateProviderId(item.casaName);

      // Insertar Pedido
      const sqlInsertPedido = `
        INSERT INTO pedidos (
          id, fecha, idproveedor, "Sub_Total", "Descuento", "Total",
          "Observaciones", "Pagado", created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT (id) DO UPDATE SET
          fecha = EXCLUDED.fecha,
          idproveedor = EXCLUDED.idproveedor,
          "Total" = EXCLUDED."Total"
        RETURNING id;
      `;

      let createdPedidoId: number;
      if (item.numId) {
        const res = await dataSource.query(sqlInsertPedido, [
          item.numId,
          item.fecha,
          provId,
          item.monto,
          0,
          item.monto,
          item.descripcion,
          item.pagado
        ]);
        createdPedidoId = res[0].id;
      } else {
        const sqlInsertAuto = `
          INSERT INTO pedidos (
            fecha, idproveedor, "Sub_Total", "Descuento", "Total",
            "Observaciones", "Pagado", created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          RETURNING id;
        `;
        const res = await dataSource.query(sqlInsertAuto, [
          item.fecha,
          provId,
          item.monto,
          0,
          item.monto,
          item.descripcion,
          item.pagado
        ]);
        createdPedidoId = res[0].id;
      }

      pedidosCreados++;

      // Insertar PedidoDetalle enlazado al inventario genérico
      const sqlInsertDetail = `
        INSERT INTO pedidos_detalle (
          idpedidos, idinventario, cantidad, precio_unitario,
          fecha_vencimiento, cantidad_restante
        ) VALUES ($1, $2, $3, $4, $5, $6);
      `;

      await dataSource.query(sqlInsertDetail, [
        createdPedidoId,
        genericInventarioId,
        1,
        item.monto,
        item.fecha,
        0
      ]);

      detallesCreados++;
    }
  }

  // Ajustar secuencia de ID de pedidos
  await dataSource.query(`SELECT setval('pedidos_id_seq', (SELECT MAX(id) FROM pedidos));`);
  await dataSource.query(`SELECT setval('pedidos_detalle_id_seq', (SELECT MAX(id) FROM pedidos_detalle));`);

  // 6. Migrar Pago_Casas -> pagos_pedidos
  const pagoCasasTable = reader.getTable('Pago_Casas');
  const pagoCasasRows: any[] = pagoCasasTable.getData();
  console.log(`\nSe encontraron ${pagoCasasRows.length} registros en Pago_Casas de Access.`);

  let pagosCreados = 0;
  const usedPedidoIds = new Set<number>();

  for (let i = 0; i < pagoCasasRows.length; i += BATCH_SIZE) {
    const chunk = pagoCasasRows.slice(i, i + BATCH_SIZE);

    for (const r of chunk) {
      const fecha = cleanDate(r.Fecha || r.fnum1) || now;
      const casaName = cleanString(r.Casa);
      const monto = parseCurrency(r.Monto);
      const factura = cleanString(r.Factura);
      const formaPagoStr = cleanString(r.Forma_Pago, 'EFECTIVO').toUpperCase();
      const monedaRaw = cleanString(r.Moneda).toUpperCase();
      const isDolar = monedaRaw.includes('DOLAR') || monedaRaw.includes('SUS') || monedaRaw === '$US';
      const monedaStr = isDolar ? 'Dólares' : 'Bolivianos';

      const provId = await getOrCreateProviderId(casaName);

      // Buscar pedido correspondiente por proveedor e importe cercano sin pago asignado aún
      const matchingPedidos = await dataSource.query(`
        SELECT id FROM pedidos 
        WHERE idproveedor = $1 AND ABS("Total" - $2) < 0.1
        ORDER BY ABS(fecha - $3::date) ASC;
      `, [provId, monto, fecha]);

      let pedidoId: number | null = null;
      for (const p of matchingPedidos) {
        if (!usedPedidoIds.has(p.id)) {
          pedidoId = p.id;
          break;
        }
      }

      if (!pedidoId) {
        // Buscar cualquier pedido del mismo proveedor no asignado aún
        const anyPedidos = await dataSource.query(`
          SELECT id FROM pedidos WHERE idproveedor = $1 ORDER BY id DESC;
        `, [provId]);
        for (const p of anyPedidos) {
          if (!usedPedidoIds.has(p.id)) {
            pedidoId = p.id;
            break;
          }
        }
      }

      if (!pedidoId) {
        // Crear pedido de respaldo para que nunca se omita ningún pago
        const sqlInsertFallbackPedido = `
          INSERT INTO pedidos (
            fecha, idproveedor, "Sub_Total", "Descuento", "Total",
            "Observaciones", "Pagado", created_at
          ) VALUES ($1, $2, $3, 0, $3, 'Pedido automático para pago histórico', true, NOW())
          RETURNING id;
        `;
        const res = await dataSource.query(sqlInsertFallbackPedido, [fecha, provId, monto]);
        pedidoId = res[0].id;
      }

      if (pedidoId) {
        usedPedidoIds.add(pedidoId);
        const sqlInsertPago = `
          INSERT INTO pagos_pedidos (
            fecha, "idPedido", monto, factura, forma_pago, moneda
          ) VALUES ($1, $2, $3, $4, $5, $6);
        `;

        await dataSource.query(sqlInsertPago, [
          fecha,
          pedidoId,
          monto,
          factura || null,
          formaPagoStr,
          monedaStr
        ]);

        pagosCreados++;
      }
    }
  }

  // Ajustar secuencia de ID de pagos_pedidos
  await dataSource.query(`SELECT setval('pagos_pedidos_id_seq', (SELECT MAX(id) FROM pagos_pedidos));`);

  console.log('\n======================================================');
  console.log('  MIGRACIÓN COMPLETADA CON ÉXITO: CASAS DENTALES');
  console.log(`  - Total Pedidos Migrados: ${pedidosCreados}`);
  console.log(`  - Total Detalles Migrados: ${detallesCreados}`);
  console.log(`  - Total Pagos a Pedidos Migrados: ${pagosCreados}`);
  console.log('======================================================\n');
}

// Permitir ejecución directa del script
if (require.main === module) {
  migratePedidosCasasDentalesModule()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error fatal en migración de casas dentales / pedidos:', err);
      process.exit(1);
    });
}
