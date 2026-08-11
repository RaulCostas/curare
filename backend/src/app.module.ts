import { Module } from '@nestjs/common'; // Force Rebuild
import { FirmasModule } from './firmas/firmas.module';
import { StorageModule } from './common/storage/storage.module';
import { DatabaseRestoreModule } from './database_restore/database_restore.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DoctorsModule } from './doctors/doctors.module';
import { ProveedoresModule } from './proveedores/proveedores.module';
import { PersonalModule } from './personal/personal.module';
import { PersonalTipoModule } from './personal_tipo/personal_tipo.module';
import { EspecialidadModule } from './especialidad/especialidad.module';
import { ArancelModule } from './arancel/arancel.module';
import { User } from './users/entities/user.entity';
import { Doctor } from './doctors/entities/doctor.entity';
import { Proveedor } from './proveedores/entities/proveedor.entity';
import { Personal } from './personal/entities/personal.entity';
import { PersonalTipo } from './personal_tipo/entities/personal_tipo.entity';
import { Especialidad } from './especialidad/entities/especialidad.entity';
import { Arancel } from './arancel/entities/arancel.entity';
import { EgresosModule } from './egresos/egresos.module';
import { Egreso } from './egresos/entities/egreso.entity';
import { LaboratoriosModule } from './laboratorios/laboratorios.module';
import { Laboratorio } from './laboratorios/entities/laboratorio.entity';
import { PreciosLaboratoriosModule } from './precios_laboratorios/precios-laboratorios.module';
import { PrecioLaboratorio } from './precios_laboratorios/entities/precio-laboratorio.entity';
import { PacientesModule } from './pacientes/pacientes.module';
import { Paciente } from './pacientes/entities/paciente.entity';
import { CategoriaPacienteModule } from './categoria_paciente/categoria_paciente.module';
import { CategoriaPaciente } from './categoria_paciente/entities/categoria_paciente.entity';
import { FichaMedicaModule } from './ficha_medica/ficha_medica.module';
import { FichaMedica } from './ficha_medica/entities/ficha_medica.entity';
import { ProformasModule } from './proformas/proformas.module';
import { HistoriaClinicaModule } from './historia_clinica/historia_clinica.module';
import { Proforma } from './proformas/entities/proforma.entity';
import { ProformaDetalle } from './proformas/entities/proforma-detalle.entity';
import { ProformaImagen } from './proformas/entities/proforma-imagen.entity';
import { HistoriaClinica } from './historia_clinica/entities/historia_clinica.entity';
import { PagosModule } from './pagos/pagos.module';
import { Pago } from './pagos/entities/pago.entity';
import { ComisionTarjetaModule } from './comision_tarjeta/comision_tarjeta.module';
import { ComisionTarjeta } from './comision_tarjeta/entities/comision_tarjeta.entity';
import { AgendaModule } from './agenda/agenda.module';
import { Agenda } from './agenda/entities/agenda.entity';
import { ChatModule } from './chat/chat.module';
import { GastosFijosModule } from './gastos_fijos/gastos_fijos.module';
import { PagosGastosFijosModule } from './pagos_gastos_fijos/pagos_gastos_fijos.module';
import { ProximaCitaModule } from './proxima_cita/proxima_cita.module';

import { PagosGastosFijos } from './pagos_gastos_fijos/entities/pagos_gastos_fijos.entity';
import { GastosFijos } from './gastos_fijos/entities/gastos_fijos.entity';
import { SecuenciaTratamientoModule } from './secuencia_tratamiento/secuencia_tratamiento.module';
import { SecuenciaTratamiento } from './secuencia_tratamiento/entities/secuencia_tratamiento.entity';
import { ProximaCita } from './proxima_cita/entities/proxima_cita.entity';
import { CorreosModule } from './correos/correos.module';
import { Correo } from './correos/entities/correo.entity';

import { FormaPagoModule } from './forma_pago/forma_pago.module';
import { FormaPago } from './forma_pago/entities/forma_pago.entity';
import { GrupoInventarioModule } from './grupo_inventario/grupo_inventario.module';
import { GrupoInventario } from './grupo_inventario/entities/grupo_inventario.entity';
import { InventarioModule } from './inventario/inventario.module';
import { Inventario } from './inventario/entities/inventario.entity';
import { EgresoInventarioModule } from './egreso_inventario/egreso_inventario.module';
import { EgresoInventario } from './egreso_inventario/entities/egreso_inventario.entity';
import { PedidosModule } from './pedidos/pedidos.module';
import { Pedidos } from './pedidos/entities/pedidos.entity';
import { PedidosDetalle } from './pedidos/entities/pedidos-detalle.entity';
import { PagosPedidosModule } from './pagos_pedidos/pagos_pedidos.module';
import { PagosLaboratoriosModule } from './pagos_laboratorios/pagos-laboratorios.module';
import { PagosPedidos } from './pagos_pedidos/entities/pagos_pedidos.entity';

import { ChatbotModule } from './chatbot/chatbot.module';
import { PacientesDeudoresModule } from './pacientes_deudores/pacientes_deudores.module';
import { ChatbotIntento } from './chatbot/entities/chatbot-intento.entity';
import { WhatsappSession } from './chatbot/entities/whatsapp-session.entity';
import { TrabajosLaboratoriosModule } from './trabajos_laboratorios/trabajos_laboratorios.module';
import { TrabajoLaboratorio } from './trabajos_laboratorios/entities/trabajo_laboratorio.entity';
import { CubetasModule } from './cubetas/cubetas.module';
import { Cubeta } from './cubetas/entities/cubeta.entity';
import { PagoLaboratorio } from './pagos_laboratorios/entities/pago-laboratorio.entity';
import { SeguimientoTrabajoModule } from './seguimiento_trabajo/seguimiento-trabajo.module';
import { SeguimientoTrabajo } from './seguimiento_trabajo/entities/seguimiento-trabajo.entity';
import { VacacionesModule } from './vacaciones/vacaciones.module';
import { CalificacionModule } from './calificacion/calificacion.module';

import { Vacacion } from './vacaciones/entities/vacacion.entity';
import { Calificacion } from './calificacion/entities/calificacion.entity';
import { PagosDoctoresModule } from './pagos_doctores/pagos_doctores.module';
import { PagosDoctores } from './pagos_doctores/entities/pagos_doctores.entity';
import { PagosDetalleDoctores } from './pagos_doctores/entities/pagos-detalle-doctores.entity';

import { PropuestasModule } from './propuestas/propuestas.module';
import { Propuesta } from './propuestas/entities/propuesta.entity';
import { PropuestaDetalle } from './propuestas/entities/propuesta-detalle.entity';
import { UtilidadesModule } from './utilidades/utilidades.module';
import { RecetaModule } from './receta/receta.module';
import { Receta } from './receta/entities/receta.entity';
import { RecetaDetalle } from './receta/entities/receta-detalle.entity';
import { MaterialUtilizadoModule } from './material_utilizado/material_utilizado.module';
import { MaterialUtilizado } from './material_utilizado/entities/material_utilizado.entity';
import { MaterialUtilizadoDetalle } from './material_utilizado/entities/material_utilizado_detalle.entity';
import { RecordatorioModule } from './recordatorio/recordatorio.module';
import { Recordatorio } from './recordatorio/entities/recordatorio.entity';
import { MusicaModule } from './musica/musica.module';
import { Musica } from './musica/entities/musica.entity';
import { TelevisionModule } from './television/television.module';
import { Television } from './television/entities/television.entity';
import { PacienteMusica } from './pacientes/entities/paciente-musica.entity';
import { PacienteTelevision } from './pacientes/entities/paciente-television.entity';
import { RecordatorioTratamientoModule } from './recordatorio-tratamiento/recordatorio-tratamiento.module';
import { RecordatorioTratamiento } from './recordatorio-tratamiento/entities/recordatorio-tratamiento.entity';
import { RecordatorioPlanModule } from './recordatorio_plan/recordatorio-plan.module';
import { RecordatorioPlan } from './recordatorio_plan/entities/recordatorio-plan.entity';
import { ContactosModule } from './contactos/contactos.module';
import { Contacto } from './contactos/entities/contacto.entity';
import { BackupModule } from './backup/backup.module';
import { ReciboModule } from './recibo/recibo.module';
import { Recibo } from './recibo/entities/recibo.entity';
import { RepuestoModule } from './repuesto/repuesto.module';
import { Repuesto } from './repuesto/entities/repuesto.entity';

import { CasosClinicosModule } from './casos_clinicos/casos_clinicos.module';
import { CasoClinico } from './casos_clinicos/entities/caso_clinico.entity';
import { CasoClinicoFoto } from './casos_clinicos/entities/caso_clinico_foto.entity';
import { DatosCentroDentalModule } from './datos_centro_dental/datos_centro_dental.module';
import { DatosCentroDental } from './datos_centro_dental/entities/datos_centro_dental.entity';
import { RecetasPredisenadasModule } from './recetas_predisenadas/recetas_predisenadas.module';
import { RecetaPredisenada } from './recetas_predisenadas/entities/receta_predisenada.entity';
import { RecetaPredisenadaDetalle } from './recetas_predisenadas/entities/receta_predisenada_detalle.entity';
import { InformesModule } from './informes/informes.module';
import { Informe } from './informes/entities/informe.entity';
import { ConsentimientosPlantillasModule } from './consentimientos-plantillas/consentimientos-plantillas.module';
import { ConsentimientoPlantilla } from './consentimientos-plantillas/entities/consentimiento-plantilla.entity';
import { ConsentimientosPacientesModule } from './consentimientos-pacientes/consentimientos-pacientes.module';
import { ConsentimientoPaciente } from './consentimientos-pacientes/entities/consentimiento-paciente.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5433', 10),
      username: process.env.DB_USER || process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgrespg',
      database: process.env.DB_NAME || 'curare',
      entities: [
        User,
        Doctor,
        Proveedor,
        Personal,
        PersonalTipo,
        Especialidad,
        Arancel,
        Egreso,
        Laboratorio,
        PrecioLaboratorio,
        Paciente,
        CategoriaPaciente,
        FichaMedica,
        Proforma,
        ProformaDetalle,
        ProformaImagen,
        Propuesta,
        PropuestaDetalle,
        HistoriaClinica,
        Pago,
        ComisionTarjeta,
        Agenda,
        GastosFijos,
        PagosGastosFijos,
        ProximaCita,
        SecuenciaTratamiento,
        Correo,
        FormaPago,
        GrupoInventario,
        Inventario,
        EgresoInventario,
        Pedidos,
        PedidosDetalle,
        PagosPedidos,
        ChatbotIntento,
        WhatsappSession,
        TrabajoLaboratorio,
        Cubeta,
        PagoLaboratorio,
        SeguimientoTrabajo,
        Vacacion,
        Calificacion,
        RecetaDetalle,
        PagosDetalleDoctores,
        PagosDoctores,
        Receta,
        MaterialUtilizado,
        MaterialUtilizadoDetalle,
        Recordatorio,
        Musica,
        Television,
        PacienteMusica,
        PacienteTelevision,
        PacienteTelevision,
        RecordatorioTratamiento,
        RecordatorioPlan,
        Contacto,
        Recibo,
        Repuesto,
        CasoClinico,
        CasoClinicoFoto,
        DatosCentroDental,
        RecetaPredisenada,
        RecetaPredisenadaDetalle,
        Informe,
        ConsentimientoPlantilla,
        ConsentimientoPaciente,
      ],
      synchronize: false,
    }),
    UsersModule,
    AuthModule,
    DoctorsModule,
    ProveedoresModule,
    PersonalModule,
    PersonalTipoModule,
    EspecialidadModule,
    ArancelModule,
    EgresosModule,
    LaboratoriosModule,
    PreciosLaboratoriosModule,
    PacientesModule,
    CategoriaPacienteModule,
    FichaMedicaModule,
    ProformasModule,
    PropuestasModule,
    HistoriaClinicaModule,
    PagosModule,
    ComisionTarjetaModule,
    AgendaModule,
    ChatModule,
    GastosFijosModule,
    PagosGastosFijosModule,
    ProximaCitaModule,
    SecuenciaTratamientoModule,
    CorreosModule,
    FormaPagoModule,
    GrupoInventarioModule,
    InventarioModule,
    EgresoInventarioModule,
    PedidosModule,
    PagosPedidosModule,
    PagosDoctoresModule,
    ChatbotModule,
    PacientesDeudoresModule,
    TrabajosLaboratoriosModule,
    CubetasModule,
    PagosLaboratoriosModule,
    SeguimientoTrabajoModule,
    VacacionesModule,
    CalificacionModule,
    UtilidadesModule,
    RecetaModule,
    MaterialUtilizadoModule,
    RecordatorioModule,
    MusicaModule,
    TelevisionModule,
    RecordatorioTratamientoModule,
    RecordatorioPlanModule,
    ContactosModule,
    BackupModule,
    ReciboModule,
    RepuestoModule,
    CasosClinicosModule,
    DatosCentroDentalModule,
    RecetasPredisenadasModule,
    InformesModule,
    ConsentimientosPlantillasModule,
    ConsentimientosPacientesModule,
    FirmasModule,
    StorageModule,
    DatabaseRestoreModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
