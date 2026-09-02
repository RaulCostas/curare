export interface SeguimientoTrabajo {
    id: number;
    envio_retorno: 'Envio' | 'Retorno';
    fecha: string;
    observaciones: string;
    trabajoLaboratorioId: number;
}

export interface GrupoInventario {
    id: number;
    grupo: string;
    estado: string;
}

export interface RecordatorioTratamiento {
    id: number;
    historiaClinicaId: number;
    historiaClinica?: HistoriaClinica;
    fechaRecordatorio: string;
    mensaje: string;
    dias: number;
    estado: string;
    createdAt: string;
    updatedAt: string;
}

export interface RecordatorioPlan {
    id: number;
    proformaId: number;
    proforma?: Proforma;
    fechaRecordatorio: string;
    dias: number;
    mensaje: string;
    estado: string;
    createdAt: string;
    updatedAt: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    estado: string;
    password?: string; // Optional for list view
    foto?: string;
    recepcionista: boolean;
    codigo_proforma?: number;
    permisos?: string[]; // Array of denied module IDs
}

export interface CreateUserDto {
    name: string;
    email: string;
    password: string;
    estado: string;
    foto?: string;
    recepcionista?: boolean;
    codigo_proforma?: number;
    permisos?: string[];
}


export interface Inventario {
    id: number;
    descripcion: string;
    cantidad_existente: number;
    stock_minimo: number;
    estado: string; // 'Activo' | 'Inactivo'
    idespecialidad: number;
    idgrupo_inventario: number;
    especialidad?: Especialidad;
    grupoInventario?: GrupoInventario;
    egresosInventario?: EgresoInventario[];
}

export interface EgresoInventario {
    id: number;
    inventarioId: number;
    inventario?: Inventario;
    fecha: string;
    cantidad: number;
    consultorio: string;
    fecha_vencimiento: string;
}

export interface Doctor {
    id: number;
    paterno: string;
    materno: string;
    nombre: string;
    celular: string;
    direccion: string;
    estado: string;
    idEspecialidad?: number;
    especialidad?: Especialidad;
}

export interface Proveedor {
    id: number;
    proveedor: string;
    celular: string;
    direccion: string;
    email: string;
    nombre_contacto: string;
    celular_contacto: string;
    estado: string;
}

export interface Personal {
    id: number;
    paterno: string;
    materno: string;
    nombre: string;
    ci: string;
    direccion: string;
    telefono: string;
    celular: string;
    fecha_nacimiento: string;
    fecha_ingreso: string;
    personal_tipo_id?: number;
    personalTipo?: PersonalTipo;
    estado: string;
    fecha_baja?: string;
}

export interface Especialidad {
    id: number;
    especialidad: string;
    estado: string;
}

export interface Arancel {
    id: number;
    detalle: string;
    precio1: number;
    precio2: number;
    tc: number;
    estado: string;
    idEspecialidad: number;
    especialidad?: Especialidad;
}

export interface FormaPago {
    id: number;
    forma_pago: string;
    estado: string;
}

export interface Egreso {
    id: number;
    fecha: string;
    destino: 'Consultorio' | 'Casa';
    detalle: string;
    monto: number;
    moneda: 'Bolivianos' | 'Dólares';
    formaPago?: FormaPago;
}

export interface Laboratorio {
    id: number;
    laboratorio: string;
    celular: string;
    telefono: string;
    direccion: string;
    email: string;
    banco: string;
    numero_cuenta: string;
    estado: string;
}

export interface PrecioLaboratorio {
    id: number;
    detalle: string;
    precio: number;
    idLaboratorio: number;
    laboratorio?: Laboratorio;
    estado: string;
}

export interface Paciente {
    id: number;
    access_id?: string;
    ci?: string;
    fecha: string;
    paterno: string;
    materno: string;
    nombre: string;
    direccion: string;
    telefono: string;
    celular: string;
    email: string;
    casilla: string;
    profesion: string;
    estado_civil: string;
    direccion_oficina: string;
    telefono_oficina: string;
    fecha_nacimiento: string;
    sexo: string;
    seguro_medico: string;
    poliza: string;
    recomendado: string;
    responsable: string;
    parentesco: string;
    direccion_responsable: string;
    telefono_responsable: string;
    idCategoria: number;
    categoria?: CategoriaPaciente;
    tipo_paciente?: string;
    motivo?: string;
    nomenclatura?: string;
    estado: string;
    foto?: string;
    fichaMedica?: FichaMedica;
    tieneFirma?: boolean;
}

export interface PersonalTipo {
    id: number;
    area: string;
    estado: string;
    created_at: string;
    updated_at: string;
}

export interface UpdateUserDto extends Partial<CreateUserDto> { }

export interface CategoriaPaciente {
    id: number;
    sigla: string;
    descripcion: string;
    color: string;
    estado: string;
}

export interface ProformaDetalle {
    id: number;
    proformaId: number;
    arancelId: number;
    arancel?: Arancel;
    precioUnitario: number;
    tc: number;
    piezas: string;
    cantidad: number;
    subTotal: number;
    descuento: number;
    total: number;
    posible: boolean;
}

export interface Proforma {
    id: number;
    numero: number;
    pacienteId: number;
    paciente?: Paciente;
    usuarioId: number;
    usuario?: User;
    fecha: string;
    nota: string;
    total: number;
    detalles: ProformaDetalle[];
    estado?: string;
    createdAt: string;
    updatedAt: string;
}

export interface HistoriaClinica {
    id: number;
    pacienteId: number;
    paciente?: Paciente;
    fecha: string;
    pieza?: string;
    cantidad: number;
    proformaDetalleId?: number;
    proformaDetalle?: ProformaDetalle;
    tratamiento?: string;
    observaciones?: string;
    especialidadId?: number;
    especialidad?: Especialidad;
    doctorId?: number;
    doctor?: Doctor;
    personalId?: number;
    personal?: Personal;
    estadoTratamiento: string;
    estadoPresupuesto: string;
    proformaId?: number;
    proforma?: Proforma;
    resaltar: boolean;
    casoClinico: boolean;
    control?: boolean;
    pagado: string;
    precio?: number;
    createdAt: string;
    updatedAt: string;
}

export interface FormaPago {
    id: number;
    forma_pago: string;
    estado: string;
}

export interface Pago {
    id: number;
    pacienteId: number;
    paciente?: Paciente;
    fecha: string;
    proformaId?: number;
    proforma?: Proforma;
    monto: number;
    monto_comision?: number;
    tc: number;
    recibo?: string;
    factura?: string;
    formaPagoId?: number;
    formaPago: 'Efectivo' | 'QR' | 'Tarjeta';
    comisionTarjetaId?: number;
    comisionTarjeta?: ComisionTarjeta;
    observaciones?: string;
    formaPagoRel?: FormaPago;
    createdAt: string;
    updatedAt: string;
}

export interface ComisionTarjeta {
    id: number;
    redBanco: string;
    monto: number;
    estado: string;
}

export interface Agenda {
    id: number;
    fecha: string;
    hora: string;
    duracion: number;
    consultorio: number;
    pacienteId: number;
    paciente?: Paciente;
    doctorId: number;
    doctor?: Doctor;
    proformaId?: number;
    proforma?: Proforma;
    usuarioId: number;
    usuario?: User;
    fechaAgendado: string;
    estado: string;
    tratamiento?: string;
    asistenteId?: number;
    asistente?: Personal;
    motivoCancelacion?: string;
}

export interface GastoFijo {
    id: number;
    destino: string;
    dia: number;
    anual: boolean;
    mes?: string;
    gasto_fijo: string;
    monto: number;
    moneda: string;
    estado?: string;
}

export interface PagoGastoFijo {
    id: number;
    gastoFijoId: number;
    gastoFijo?: GastoFijo;
    fecha: string;
    monto: number;
    moneda: string;
    formaPagoId: number;
    formaPago?: FormaPago;
    observaciones: string;
    createdAt?: string;
}

export interface ProximaCita {
    id: number;
    pacienteId: number;
    paciente?: Paciente;
    proformaId?: number;
    proforma?: Proforma;
    fecha: string;
    pieza?: string;
    proformaDetalleId?: number;
    proformaDetalle?: ProformaDetalle;
    observaciones?: string;
    doctorId: number;
    doctor?: Doctor;
    estado: string;
    createdAt?: string;
    updatedAt?: string;
    numero_cuenta: string;
}

export interface PrecioLaboratorio {
    id: number;
    detalle: string;
    precio: number;
    idLaboratorio: number;
    laboratorio?: Laboratorio;
    estado: string;
}

export interface Paciente {
    id: number;
    fecha: string;
    paterno: string;
    materno: string;
    nombre: string;
    direccion: string;
    telefono: string;
    celular: string;
    email: string;
    casilla: string;
    profesion: string;
    estado_civil: string;
    direccion_oficina: string;
    telefono_oficina: string;
    fecha_nacimiento: string;
    sexo: string;
    seguro_medico: string;
    poliza: string;
    recomendado: string;
    responsable: string;
    parentesco: string;
    direccion_responsable: string;
    telefono_responsable: string;
    idCategoria: number;
    categoria?: CategoriaPaciente;
    tipo_paciente?: string;
    motivo?: string;
    nomenclatura?: string;
    estado: string;
    fichaMedica?: FichaMedica;
}

export interface FichaMedica {
    id?: number;
    alergia_anestesicos?: boolean;
    alergias_drogas: boolean;
    hepatitis: boolean;
    asma: boolean;
    diabetes: boolean;
    dolencia_cardiaca: boolean;
    hipertension: boolean;
    fiebre_reumatica: boolean;
    diatesis_hemorragia: boolean;
    sinusitis: boolean;
    ulcera_gastroduodenal: boolean;
    enfermedades_tiroides: boolean;
    observaciones: string;
    medico_cabecera: string;
    enfermedad_actual: string;
    toma_medicamentos: boolean;
    medicamentos_detalle: string;
    tratamiento: string;
    ultima_consulta: string;
    frecuencia_cepillado: string;
    usa_cepillo: boolean;
    usa_hilo_dental: boolean;
    usa_enjuague: boolean;
    mal_aliento: boolean;
    causa_mal_aliento: string;
    sangra_encias: boolean;
    dolor_cara: boolean;
    comentarios: string;
}

export interface UpdateUserDto extends Partial<CreateUserDto> { }

export interface CategoriaPaciente {
    id: number;
    sigla: string;
    descripcion: string;
    color: string;
    estado: string;
}

export interface ProformaDetalle {
    id: number;
    proformaId: number;
    arancelId: number;
    arancel?: Arancel;
    precioUnitario: number;
    tc: number;
    piezas: string;
    cantidad: number;
    subTotal: number;
    descuento: number;
    total: number;
    posible: boolean;
}

export interface Proforma {
    id: number;
    numero: number;
    pacienteId: number;
    paciente?: Paciente;
    usuarioId: number;
    usuario?: User;
    fecha: string;
    nota: string;
    total: number;
    aprobado: boolean;
    usuario_aprobado?: number;
    usuarioAprobado?: User;
    fecha_aprobado?: string;
    detalles: ProformaDetalle[];
    createdAt: string;
    updatedAt: string;
}

export interface HistoriaClinica {
    id: number;
    pacienteId: number;
    paciente?: Paciente;
    fecha: string;
    pieza?: string;
    cantidad: number;
    proformaDetalleId?: number;
    proformaDetalle?: ProformaDetalle;
    tratamiento?: string;
    observaciones?: string;
    especialidadId?: number;
    especialidad?: Especialidad;
    doctorId?: number;
    doctor?: Doctor;
    personalId?: number;
    personal?: Personal;
    hoja: number;
    estadoTratamiento: string;
    estadoPresupuesto: string;
    proformaId?: number;
    proforma?: Proforma;
    resaltar: boolean;
    casoClinico: boolean;
    control?: boolean;
    pagado: string;
    precio?: number;
    createdAt: string;
    updatedAt: string;
}

export interface Pago {
    id: number;
    pacienteId: number;
    paciente?: Paciente;
    fecha: string;
    proformaId?: number;
    proforma?: Proforma;
    monto: number;
    moneda: 'Bolivianos' | 'Dólares';
    tc: number;
    recibo?: string;
    factura?: string;
    formaPagoId?: number;
    formaPago: 'Efectivo' | 'QR' | 'Tarjeta';
    comisionTarjetaId?: number;
    comisionTarjeta?: ComisionTarjeta;
    observaciones?: string;
    formaPagoRel?: FormaPago;
    createdAt: string;
    updatedAt: string;
}

export interface ComisionTarjeta {
    id: number;
    redBanco: string;
    monto: number;
    estado: string;
}

export interface Agenda {
    id: number;
    fecha: string;
    hora: string;
    duracion: number;
    consultorio: number;
    pacienteId: number;
    paciente?: Paciente;
    doctorId: number;
    doctor?: Doctor;
    proformaId?: number;
    proforma?: Proforma;
    usuarioId: number;
    usuario?: User;
    fechaAgendado: string;
    estado: string;
    tratamiento?: string;
    asistenteId?: number;
    asistente?: Personal;
    motivoCancelacion?: string;
}

export interface GastoFijo {
    id: number;
    destino: string;
    dia: number;
    anual: boolean;
    mes?: string;
    gasto_fijo: string;
    monto: number;
    moneda: string;
    estado?: string;
}

export interface PagoGastoFijo {
    id: number;
    gastoFijoId: number;
    gastoFijo?: GastoFijo;
    fecha: string;
    monto: number;
    moneda: string;
    formaPagoId: number;
    formaPago?: FormaPago;
    observaciones: string;
    createdAt?: string;
}

export interface ProximaCita {
    id: number;
    pacienteId: number;
    paciente?: Paciente;
    proformaId?: number;
    proforma?: Proforma;
    fecha: string;
    pieza?: string;
    proformaDetalleId?: number;
    proformaDetalle?: ProformaDetalle;
    observaciones?: string;
    doctorId: number;
    doctor?: Doctor;
    estado: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface SecuenciaTratamiento {
    id: number;
    pacienteId: number;
    paciente?: Paciente;
    proformaId: number;
    proforma?: Proforma;
    fecha: string;
    periodoncia?: string;
    cirugia?: string;
    endodoncia?: string;
    operatoria?: string;
    protesis?: string;
    implantes?: string;
    ortodoncia?: string;
    odontopediatria?: string;
}

export interface Correo {
    id: number;
    remitente_id: number;
    remitente?: User;
    destinatario_id: number;
    destinatario?: User;
    copia_id?: number;
    copia?: User;
    asunto: string;
    mensaje: string;
    fecha_envio: string;
    leido_destinatario: boolean;
    leido_copia: boolean;
    // Helper property I will use in frontend logic? No, backend sends these raw fields.
}

export interface CreateCorreoDto {
    remitente_id: number;
    destinatario_id: number;
    copia_id?: number;
    asunto: string;
    mensaje: string;
}

export interface PedidosDetalle {
    id: number;
    idpedidos: number;
    idinventario: number;
    cantidad: number;
    precio_unitario: number;
    fecha_vencimiento: string;
    inventario?: Inventario;
}

export interface Pedidos {
    id: number;
    fecha: string;
    idproveedor: number;
    Sub_Total: number;
    Descuento: number;
    Total: number;
    Observaciones: string;
    Pagado: boolean;
    proveedor?: Proveedor;
    detalles?: PedidosDetalle[];
}

export interface PagosPedidos {
    id: number;
    fecha: string;
    idPedido: number;
    pedido?: Pedidos;
    monto: number;
    factura?: string;
    recibo?: string;
    forma_pago: string;
}

export interface Cubeta {
    id: number;
    codigo: string;
    descripcion: string;
    dentro_fuera: string;
    estado: string;
}

export interface TrabajoLaboratorio {
    id: number;
    idLaboratorio: number;
    laboratorio?: Laboratorio;
    idPaciente: number;
    paciente?: Paciente;
    idprecios_laboratorios: number;
    precioLaboratorio?: PrecioLaboratorio;
    fecha: string;
    pieza: string;
    cantidad: number;
    fecha_pedido: string;
    color: string;
    estado: string;
    cita: string;
    observacion: string;
    fecha_terminado?: string;
    pagado: string;
    precio_unitario: number;
    total: number;
    resaltar: string;
    idCubeta?: number;
    cubeta?: Cubeta;
}

export interface PropuestaDetalle {
    id: number;
    propuestaId: number;
    letra?: string;
    arancelId: number;
    arancel?: Arancel;
    precioUnitario: number;
    tc: number;
    piezas: string;
    cantidad: number;
    subTotal: number;
    descuento: number;
    total: number;
    posible: boolean;
}

export interface Propuesta {
    id: number;
    pacienteId: number;
    paciente?: Paciente;
    numero: number;
    letra?: string;
    fecha: string;
    total: number;
    nota: string;
    usuarioId: number;
    usuario?: User;
    detalles: PropuestaDetalle[];
}

export interface Calificacion {
    id: number;
    personalId: number;
    personal?: Personal;
    pacienteId: number;
    paciente?: Paciente;
    consultorio: number;
    calificacion: 'Malo' | 'Regular' | 'Bueno';
    fecha: string;
    observaciones?: string;
    evaluadorId: number;
    evaluador?: User;
    createdAt?: string;
    updatedAt?: string;
}

export interface Receta {
    id: number;
    pacienteId: number;
    paciente?: Paciente;
    doctorId?: number;
    doctor?: Doctor;
    userId: number;
    user?: { id: number; name: string };
    fecha: string;
    diagnostico?: string;
    medicamentos?: string;
    indicaciones: string;
    detalles?: RecetaDetalle[];
}

export interface RecetaDetalle {
    id: number;
    recetaId: number;
    medicamento: string;
    cantidad: string;
    indicacion: string;
}

export interface MaterialUtilizadoDetalle {
    id: number;
    materialUtilizadoId: number;
    inventarioId: number;
    inventario?: Inventario;
    cantidad: string;
    observaciones?: string;
    createdAt: string;
    updatedAt: string;
}

export interface MaterialUtilizado {
    id: number;
    historiaClinicaId: number;
    historiaClinica?: HistoriaClinica;
    fecha: string;
    observaciones?: string;
    userId: number;
    user?: User;
    detalles: MaterialUtilizadoDetalle[];
    createdAt: string;
    updatedAt: string;
}

export interface Recordatorio {
    id: number;
    tipo: 'personal' | 'consultorio';
    fecha: string;
    hora: string;
    mensaje: string;
    repetir: 'Mensual' | 'Anual' | 'Solo una vez';
    estado: 'activo' | 'inactivo';
    usuarioId?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface Contacto {
    id: number;
    contacto: string;
    celular?: string;
    telefono?: string;
    telefonoof?: string;
    email?: string;
    direccion?: string;
    createdAt?: string;
    updatedAt?: string;
}


export interface Musica {
    id: number;
    musica: string;
    estado: string;
    created_at?: string;
    updated_at?: string;
}

export interface Television {
    id: number;
    television: string;
    estado: string;
    created_at?: string;
    updated_at?: string;
}

export interface PacienteMusica {
    id: number;
    pacienteId: number;
    musicaId: number;
}

export interface PacienteTelevision {
    id: number;
    pacienteId: number;
    televisionId: number;
}

export interface BackupInfo {
    filename: string;
    size: number;
    createdAt: string;
    path: string;
}

export interface ReciboItem {
    id: number;
    accessId?: string;
    fecha?: string;
    nombre: string;
    concepto?: string;
    moneda?: string;
    monto: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface RepuestoItem {
    id: number;
    fecha?: string;
    consultorio?: string;
    descripcion: string;
    motivo?: string;
    observaciones?: string;
    costo: number;
    manoObra: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface CasoClinicoFoto {
    id: number;
    casoClinicoId?: number;
    foto: string;
    tipo: 'antes' | 'despues' | 'proceso';
    descripcion?: string;
}

export interface CasoClinico {
    id: number;
    nombre: string;
    especialidadId?: number;
    especialidad?: Especialidad;
    descripcion?: string;
    diagnostico?: string;
    tratamiento?: string;
    observaciones?: string;
    estado?: string;
    video?: string;
    fotos?: CasoClinicoFoto[];
    createdAt?: string;
    updatedAt?: string;
}

export interface DatosCentroDental {
    id: number;
    nombre?: string;
    nombre_centro?: string;
    propietario?: string;
    direccion?: string;
    latitud?: string;
    longitud?: string;
    telefono?: string;
    celular?: string;
    emergencias?: string;
    email?: string;
    ciudad?: string;
    pais?: string;
    nit?: string;
    logotipo?: string;
    qr?: string;
    horarios?: string;
    estado?: string;
}

export interface RecetaPredisenadaDetalle {
    id?: number;
    recetaPredisenadaId?: number;
    medicamento: string;
    cantidad?: string;
    indicacion?: string;
}

export interface RecetaPredisenada {
    id: number;
    nombre?: string;
    titulo?: string;
    especialidadId?: number;
    especialidad?: Especialidad;
    diagnostico?: string;
    medicamentos?: string;
    indicaciones?: string;
    estado?: 'activo' | 'inactivo' | string;
    detalles?: RecetaPredisenadaDetalle[];
    createdAt?: string;
    updatedAt?: string;
}

export interface Informe {
    id: number;
    pacienteId: number;
    paciente?: Paciente;
    doctorId?: number;
    doctor?: Doctor;
    fecha: string;
    titulo: string;
    diagnostico?: string;
    tratamientoRealizado?: string;
    recomendaciones?: string;
    observaciones?: string;
    firmaDoctor?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ConsentimientoPlantilla {
    id: number;
    titulo: string;
    contenido: string;
    tipo?: string;
    activo: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface ConsentimientoPaciente {
    id: number;
    pacienteId: number;
    paciente?: Paciente;
    plantillaId?: number;
    plantilla?: ConsentimientoPlantilla;
    fecha: string;
    titulo: string;
    contenido_generado?: string;
    contenidoFirmado?: string;
    firmaPaciente?: string;
    firmaDoctor?: string;
    observaciones?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface EstudioComplementario {
    id: number;
    pacienteId: number;
    paciente?: Paciente;
    fecha: string;
    tipo_estudio: string;
    observaciones?: string;
    orden_estudio_url?: string;
    archivo_url?: string;
    usuarioId?: number;
    usuario?: User;
    createdAt?: string;
    updatedAt?: string;
}


