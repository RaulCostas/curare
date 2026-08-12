import { migratePacientesModule } from './modules/01_pacientes';
import { migrateArancelEspecialidadesModule } from './modules/02_arancel_especialidades';
import { migrateUsuariosModule } from './modules/03_usuarios';
import { migrateProformasModule } from './modules/04_proformas';
import { migrateDoctoresPersonalModule } from './modules/05_doctores_personal';
import { migrateHistoriaClinicaModule } from './modules/06_historia_clinica';
import { migratePagosModule } from './modules/07_pagos';
import { migrateProximaCitaSecuencia } from './modules/08_proxima_cita_secuencia';
import { migrateAgenda } from './modules/09_agenda';
import { migrateLaboratoriosYPrecios } from './modules/10_laboratorios';
import { migrateCubetasYTrabajos } from './modules/11_cubetas_trabajos';
import { migratePagosLaboratorios } from './modules/12_pagos_laboratorios';
import { migrateGastosFijosYPagos } from './modules/13_gastos_fijos';
import { migrateEgresosYProveedores } from './modules/14_egresos_proveedores';
import { migrateCalificacionVacacionesModule } from './modules/15_calificacion_vacaciones';
import { migratePagosDoctoresModule } from './modules/16_pagos_doctores';
import { migratePedidosCasasDentalesModule } from './modules/17_pedidos_casas_dentales';
import { migrateRecetasModule } from './modules/18_recetas';
import { migrateRecibosYMantenimientoModule } from './modules/19_recibos_y_mantenimiento';
import { migrateMusicaTelevisionModule } from './modules/20_musica_television';
import { migrateContactosModule } from './modules/21_contactos';
import { reconcileDuplicateProformasModule } from './modules/22_reconcile_duplicate_proformas';

async function runAllMigrations() {
  console.log('\n======================================================');
  console.log('  EJECUTANDO MIGRACIÓN COMPLETA DE ACCESS A POSTGRESQL');
  console.log('======================================================\n');

  const startTime = Date.now();

  try {
    console.log('[1/20] Migrando Pacientes...');
    await migratePacientesModule();

    console.log('[2/20] Migrando Aranceles y Especialidades...');
    await migrateArancelEspecialidadesModule();

    console.log('[3/20] Migrando Usuarios...');
    await migrateUsuariosModule();

    console.log('[4/20] Migrando Proformas...');
    await migrateProformasModule();

    console.log('[5/20] Migrando Doctores y Personal...');
    await migrateDoctoresPersonalModule();

    console.log('[6/20] Migrando Historia Clínica...');
    await migrateHistoriaClinicaModule();

    console.log('[7/20] Migrando Formas de Pago y Pagos de Pacientes...');
    await migratePagosModule();

    console.log('[8/20] Migrando Próximas Citas y Secuencia de Tratamiento...');
    await migrateProximaCitaSecuencia();

    console.log('[9/20] Migrando Agenda...');
    await migrateAgenda();

    console.log('[10/20] Migrando Laboratorios y Precios...');
    await migrateLaboratoriosYPrecios();

    console.log('[11/20] Migrando Cubetas y Trabajos de Laboratorio...');
    await migrateCubetasYTrabajos();

    console.log('[12/20] Migrando Pagos de Laboratorios...');
    await migratePagosLaboratorios();

    console.log('[13/20] Migrando Gastos Fijos y sus Pagos...');
    await migrateGastosFijosYPagos();

    console.log('[14/20] Migrando Proveedores y Egresos...');
    await migrateEgresosYProveedores();

    console.log('[15/20] Migrando Calificaciones y Vacaciones...');
    await migrateCalificacionVacacionesModule();

    console.log('[16/20] Migrando Pagos a Doctores y Detalles...');
    await migratePagosDoctoresModule();

    console.log('[17/20] Migrando Casas Dentales (Pedidos, Pedidos Detalle y Pagos)...');
    await migratePedidosCasasDentalesModule();

    console.log('[18/20] Migrando Recetas y Receta Detalle...');
    await migrateRecetasModule();

    console.log('[19/20] Migrando Recibos y Mantenimiento de Consultorios (Repuestos)...');
    await migrateRecibosYMantenimientoModule();

    console.log('[21/22] Migrando Contactos desde Access...');
    await migrateContactosModule();

    console.log('[22/22] Reconciliando y Limpiando Proformas Duplicadas...');
    await reconcileDuplicateProformasModule();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n======================================================');
    console.log(`  ¡MIGRACIÓN COMPLETA FINALIZADA CON ÉXITO EN ${duration} SEGUNDOS!`);
    console.log('======================================================\n');
  } catch (error) {
    console.error('\n Error fatal durante la migración masiva:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runAllMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
