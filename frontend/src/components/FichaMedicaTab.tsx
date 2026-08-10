import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import type { Paciente, FichaMedica } from '../types';
import { formatDate } from '../utils/dateUtils';
import {
    User, MapPin, Shield, Users, Stethoscope, Smile,
    Edit, Save, X, AlertTriangle, HeartPulse
} from 'lucide-react';

interface FichaMedicaTabProps {
    pacienteId: number;
    onUpdateSuccess?: () => void;
}

const FichaMedicaTab: React.FC<FichaMedicaTabProps> = ({ pacienteId, onUpdateSuccess }) => {
    const [paciente, setPaciente] = useState<Paciente | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Estado editable de los campos de la tabla pacientes
    const [pacienteForm, setPacienteForm] = useState({
        nombre: '',
        paterno: '',
        materno: '',
        casilla: '',
        fecha_nacimiento: '',
        sexo: 'Femenino',
        estado_civil: 'Soltero',
        tipo_paciente: 'NORMAL',
        nomenclatura: '',
        direccion: '',
        telefono: '',
        celular: '',
        email: '',
        profesion: '',
        direccion_oficina: '',
        telefono_oficina: '',
        seguro_medico: '',
        poliza: '',
        recomendado: '',
        motivo: '',
        responsable: '',
        parentesco: '',
        direccion_responsable: '',
        telefono_responsable: ''
    });

    // Estado editable de los campos de la tabla ficha_medica
    const [ficha, setFicha] = useState<FichaMedica>({
        alergia_anestesicos: false,
        alergias_drogas: false,
        hepatitis: false,
        asma: false,
        diabetes: false,
        dolencia_cardiaca: false,
        hipertension: false,
        fiebre_reumatica: false,
        diatesis_hemorragia: false,
        sinusitis: false,
        ulcera_gastroduodenal: false,
        enfermedades_tiroides: false,
        observaciones: '',
        medico_cabecera: '',
        enfermedad_actual: '',
        toma_medicamentos: false,
        medicamentos_detalle: '',
        tratamiento: '',
        ultima_consulta: '',
        frecuencia_cepillado: '',
        usa_cepillo: false,
        usa_hilo_dental: false,
        usa_enjuague: false,
        mal_aliento: false,
        causa_mal_aliento: '',
        sangra_encias: false,
        dolor_cara: false,
        comentarios: ''
    });

    useEffect(() => {
        if (pacienteId) {
            fetchPaciente();
        }
    }, [pacienteId]);

    const fetchPaciente = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/pacientes/${pacienteId}`);
            const data: Paciente = response.data;
            setPaciente(data);

            setPacienteForm({
                nombre: data.nombre || '',
                paterno: data.paterno || '',
                materno: data.materno || '',
                casilla: data.casilla || '',
                fecha_nacimiento: data.fecha_nacimiento || '',
                sexo: data.sexo || 'Femenino',
                estado_civil: data.estado_civil || 'Soltero',
                tipo_paciente: data.tipo_paciente || 'NORMAL',
                nomenclatura: data.nomenclatura || '',
                direccion: data.direccion || '',
                telefono: data.telefono || '',
                celular: data.celular || '',
                email: data.email || '',
                profesion: data.profesion || '',
                direccion_oficina: data.direccion_oficina || '',
                telefono_oficina: data.telefono_oficina || '',
                seguro_medico: data.seguro_medico || '',
                poliza: data.poliza || '',
                recomendado: data.recomendado || '',
                motivo: data.motivo || '',
                responsable: data.responsable || '',
                parentesco: data.parentesco || '',
                direccion_responsable: data.direccion_responsable || '',
                telefono_responsable: data.telefono_responsable || ''
            });

            if (data.fichaMedica) {
                setFicha(prev => ({
                    ...prev,
                    ...data.fichaMedica
                }));
            }
        } catch (error) {
            console.error('Error fetching paciente ficha medica:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePacienteInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setPacienteForm(prev => ({ ...prev, [name]: value }));
    };

    const handleFichaInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFicha(prev => ({ ...prev, [name]: value }));
    };

    const handleFichaCheckboxChange = (field: keyof FichaMedica) => {
        setFicha(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        if (paciente) {
            setPacienteForm({
                nombre: paciente.nombre || '',
                paterno: paciente.paterno || '',
                materno: paciente.materno || '',
                casilla: paciente.casilla || '',
                fecha_nacimiento: paciente.fecha_nacimiento || '',
                sexo: paciente.sexo || 'Femenino',
                estado_civil: paciente.estado_civil || 'Soltero',
                tipo_paciente: paciente.tipo_paciente || 'NORMAL',
                nomenclatura: paciente.nomenclatura || '',
                direccion: paciente.direccion || '',
                telefono: paciente.telefono || '',
                celular: paciente.celular || '',
                email: paciente.email || '',
                profesion: paciente.profesion || '',
                direccion_oficina: paciente.direccion_oficina || '',
                telefono_oficina: paciente.telefono_oficina || '',
                seguro_medico: paciente.seguro_medico || '',
                poliza: paciente.poliza || '',
                recomendado: paciente.recomendado || '',
                motivo: paciente.motivo || '',
                responsable: paciente.responsable || '',
                parentesco: paciente.parentesco || '',
                direccion_responsable: paciente.direccion_responsable || '',
                telefono_responsable: paciente.telefono_responsable || ''
            });
            if (paciente.fichaMedica) {
                setFicha(prev => ({ ...prev, ...paciente.fichaMedica }));
            }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.patch(`/pacientes/${pacienteId}`, {
                ...pacienteForm,
                fichaMedica: ficha
            });

            Swal.fire({
                icon: 'success',
                title: 'Expediente y Ficha Médica Guardados',
                text: 'La información del paciente y su ficha médica se actualizaron con éxito',
                timer: 1500,
                showConfirmButton: false,
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
            setIsEditing(false);
            if (onUpdateSuccess) onUpdateSuccess();
            fetchPaciente();
        } catch (error) {
            console.error('Error saving ficha medica:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo guardar la información de la ficha médica',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
        } finally {
            setSaving(false);
        }
    };

    const calcularEdad = (fechaNac?: string) => {
        if (!fechaNac) return 'N/A';
        const birthDate = new Date(fechaNac);
        if (isNaN(birthDate.getTime())) return fechaNac;
        const age = new Date().getFullYear() - birthDate.getFullYear();
        return `${formatDate(fechaNac)} (${age} años)`;
    };

    const enfermedadesChecklist: { key: keyof FichaMedica; label: string; desc: string }[] = [
        { key: 'alergia_anestesicos', label: 'Alergia a Anestésicos', desc: 'Reacción adversa o alergia previa a anestesia' },
        { key: 'alergias_drogas', label: 'Alergia a Medicamentos / Drogas', desc: 'Alergias a antibióticos, analgésicos u otros' },
        { key: 'hipertension', label: 'Hipertensión Arterial', desc: 'Presión arterial elevada' },
        { key: 'diabetes', label: 'Diabetes', desc: 'Trastorno de glucosa en sangre' },
        { key: 'asma', label: 'Asma / Afección Pulmonar', desc: 'Problemas respiratorios o de asma' },
        { key: 'hepatitis', label: 'Hepatitis / Hígado', desc: 'Afecciones hepáticas previas o crónicas' },
        { key: 'dolencia_cardiaca', label: 'Dolencia Cardíaca / Articulaciones', desc: 'Problemas cardíacos o de articulación' },
        { key: 'fiebre_reumatica', label: 'Fiebre Reumática', desc: 'Historial de fiebre reumática' },
        { key: 'diatesis_hemorragia', label: 'Diátesis Hemorrágica', desc: 'Tendencia a sangrado prolongado o coagulación' },
        { key: 'sinusitis', label: 'Sinusitis / Neurológicas', desc: 'Problemas sinusales o neurológicos' },
        { key: 'ulcera_gastroduodenal', label: 'Úlcera Gastroduodenal', desc: 'Afecciones gastroduodenales o estómago' },
        { key: 'enfermedades_tiroides', label: 'Enfermedades de Tiroides', desc: 'Hiper o hipotiroidismo' },
    ];

    if (loading) {
        return (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-3"></div>
                Cargando Ficha Médica y Expediente Completo...
            </div>
        );
    }

    return (
        <form onSubmit={handleSave} className="space-y-8">
            {/* Header del Tab */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-200 dark:border-gray-700 gap-4 mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <HeartPulse className="text-blue-500" size={22} />
                        <span>Ficha Médica y Expediente</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                        Antecedentes patológicos, alergias, estado de salud general y datos personales del paciente.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {!isEditing ? (
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl shadow transition-all flex items-center gap-2 text-sm"
                        >
                            <Edit size={16} />
                            <span>Editar Expediente</span>
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                disabled={saving}
                                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-xl shadow transition-all flex items-center gap-2 text-sm"
                            >
                                <X size={16} />
                                <span>Cancelar</span>
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl shadow transition-all flex items-center gap-2 text-sm disabled:opacity-50"
                            >
                                <Save size={16} />
                                <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* SECCIÓN 1: DATOS PERSONALES */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700/60 space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-gray-700/50">
                    <h4 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2 uppercase tracking-wide">
                        <User className="text-blue-500" size={18} />
                        <span>1. Datos Personales e Identificación</span>
                    </h4>
                    {paciente?.access_id && (
                        <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 text-xs px-3 py-1 rounded-full font-bold">
                            Código Access: {paciente.access_id}
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div>
                        <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Nombres</label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="nombre"
                                value={pacienteForm.nombre}
                                onChange={handlePacienteInputChange}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium"
                            />
                        ) : (
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{paciente?.nombre || '—'}</span>
                        )}
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Ap. Paterno</label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="paterno"
                                value={pacienteForm.paterno}
                                onChange={handlePacienteInputChange}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium"
                            />
                        ) : (
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{paciente?.paterno || '—'}</span>
                        )}
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Ap. Materno</label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="materno"
                                value={pacienteForm.materno}
                                onChange={handlePacienteInputChange}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium"
                            />
                        ) : (
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{paciente?.materno || '—'}</span>
                        )}
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">C.I. / Documento</label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="casilla"
                                value={pacienteForm.casilla}
                                onChange={handlePacienteInputChange}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium"
                            />
                        ) : (
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{paciente?.casilla || '—'}</span>
                        )}
                    </div>

                    <div>
                        <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Fecha Nacimiento</label>
                        {isEditing ? (
                            <input
                                type="date"
                                name="fecha_nacimiento"
                                value={pacienteForm.fecha_nacimiento}
                                onChange={handlePacienteInputChange}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium"
                            />
                        ) : (
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{calcularEdad(paciente?.fecha_nacimiento)}</span>
                        )}
                    </div>

                    <div>
                        <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Sexo</label>
                        {isEditing ? (
                            <select
                                name="sexo"
                                value={pacienteForm.sexo}
                                onChange={handlePacienteInputChange}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium"
                            >
                                <option value="Masculino">Masculino</option>
                                <option value="Femenino">Femenino</option>
                                <option value="Otro">Otro</option>
                            </select>
                        ) : (
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{paciente?.sexo || '—'}</span>
                        )}
                    </div>

                    <div>
                        <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Estado Civil</label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="estado_civil"
                                value={pacienteForm.estado_civil}
                                onChange={handlePacienteInputChange}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium"
                            />
                        ) : (
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{paciente?.estado_civil || '—'}</span>
                        )}
                    </div>

                    <div>
                        <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Categoría</label>
                        <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                            {paciente?.categoria ? `${paciente.categoria.sigla} - ${paciente.categoria.descripcion}` : 'Sin categoría'}
                        </span>
                    </div>

                    <div>
                        <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Tipo Paciente</label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="tipo_paciente"
                                value={pacienteForm.tipo_paciente}
                                onChange={handlePacienteInputChange}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium"
                            />
                        ) : (
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{paciente?.tipo_paciente || 'NORMAL'}</span>
                        )}
                    </div>

                    <div>
                        <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Nomenclatura</label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="nomenclatura"
                                value={pacienteForm.nomenclatura}
                                onChange={handlePacienteInputChange}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium"
                            />
                        ) : (
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{paciente?.nomenclatura || '—'}</span>
                        )}
                    </div>

                    <div>
                        <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Fecha Registro</label>
                        <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{paciente?.fecha ? formatDate(paciente.fecha) : '—'}</span>
                    </div>

                    <div>
                        <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Estado</label>
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-extrabold uppercase ${paciente?.estado === 'activo' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-700'}`}>
                            {paciente?.estado || 'activo'}
                        </span>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: CONTACTO Y UBICACIÓN */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700/60 space-y-4">
                <h4 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2 uppercase tracking-wide border-b pb-3 border-gray-100 dark:border-gray-700/50">
                    <MapPin className="text-emerald-500" size={18} />
                    <span>2. Contacto, Dirección y Empleo</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div className="lg:col-span-2">
                        <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Dirección Domicilio</label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="direccion"
                                value={pacienteForm.direccion}
                                onChange={handlePacienteInputChange}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium"
                            />
                        ) : (
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{paciente?.direccion || '—'}</span>
                        )}
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Teléfono Fijo</label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="telefono"
                                value={pacienteForm.telefono}
                                onChange={handlePacienteInputChange}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium"
                            />
                        ) : (
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{paciente?.telefono || '—'}</span>
                        )}
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Celular (Prefijo +591)</label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="celular"
                                value={pacienteForm.celular}
                                onChange={handlePacienteInputChange}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium"
                            />
                        ) : (
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{paciente?.celular || '—'}</span>
                        )}
                    </div>

                    <div className="lg:col-span-2">
                        <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Correo Electrónico (Email)</label>
                        {isEditing ? (
                            <input
                                type="email"
                                name="email"
                                value={pacienteForm.email}
                                onChange={handlePacienteInputChange}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium"
                            />
                        ) : (
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{paciente?.email || '—'}</span>
                        )}
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Profesión / Ocupación</label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="profesion"
                                value={pacienteForm.profesion}
                                onChange={handlePacienteInputChange}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium"
                            />
                        ) : (
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{paciente?.profesion || '—'}</span>
                        )}
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Teléfono Oficina</label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="telefono_oficina"
                                value={pacienteForm.telefono_oficina}
                                onChange={handlePacienteInputChange}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium"
                            />
                        ) : (
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{paciente?.telefono_oficina || '—'}</span>
                        )}
                    </div>

                    <div className="lg:col-span-4">
                        <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Dirección Trabajo / Oficina</label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="direccion_oficina"
                                value={pacienteForm.direccion_oficina}
                                onChange={handlePacienteInputChange}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium"
                            />
                        ) : (
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{paciente?.direccion_oficina || '—'}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* SECCIÓN 3: SEGURO Y RESPONSABLE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Seguro y Referencias */}
                <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700/60 space-y-4">
                    <h4 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2 uppercase tracking-wide border-b pb-3 border-gray-100 dark:border-gray-700/50">
                        <Shield className="text-purple-500" size={18} />
                        <span>3. Seguro Médico y Recomendación</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                            <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Seguro Médico</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="seguro_medico"
                                    value={pacienteForm.seguro_medico}
                                    onChange={handlePacienteInputChange}
                                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium"
                                />
                            ) : (
                                <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{paciente?.seguro_medico || '—'}</span>
                            )}
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">N° Póliza</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="poliza"
                                    value={pacienteForm.poliza}
                                    onChange={handlePacienteInputChange}
                                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium"
                                />
                            ) : (
                                <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{paciente?.poliza || '—'}</span>
                            )}
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Recomendado Por</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="recomendado"
                                    value={pacienteForm.recomendado}
                                    onChange={handlePacienteInputChange}
                                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium"
                                />
                            ) : (
                                <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{paciente?.recomendado || '—'}</span>
                            )}
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Motivo Consulta</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="motivo"
                                    value={pacienteForm.motivo}
                                    onChange={handlePacienteInputChange}
                                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium"
                                />
                            ) : (
                                <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{paciente?.motivo || '—'}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Responsable / Tutor */}
                <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700/60 space-y-4">
                    <h4 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2 uppercase tracking-wide border-b pb-3 border-gray-100 dark:border-gray-700/50">
                        <Users className="text-amber-500" size={18} />
                        <span>4. Datos del Responsable / Tutor</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                            <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Nombre Responsable</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="responsable"
                                    value={pacienteForm.responsable}
                                    onChange={handlePacienteInputChange}
                                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium"
                                />
                            ) : (
                                <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{paciente?.responsable || '—'}</span>
                            )}
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Parentesco</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="parentesco"
                                    value={pacienteForm.parentesco}
                                    onChange={handlePacienteInputChange}
                                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium"
                                />
                            ) : (
                                <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{paciente?.parentesco || '—'}</span>
                            )}
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Teléfono Responsable</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="telefono_responsable"
                                    value={pacienteForm.telefono_responsable}
                                    onChange={handlePacienteInputChange}
                                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium"
                                />
                            ) : (
                                <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{paciente?.telefono_responsable || '—'}</span>
                            )}
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Dirección Responsable</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="direccion_responsable"
                                    value={pacienteForm.direccion_responsable}
                                    onChange={handlePacienteInputChange}
                                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium"
                                />
                            ) : (
                                <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{paciente?.direccion_responsable || '—'}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 5: ESTADO DE SALUD Y ATENCIÓN MÉDICA */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700/60 space-y-6">
                <h4 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2 uppercase tracking-wide border-b pb-3 border-gray-100 dark:border-gray-700/50">
                    <Stethoscope className="text-indigo-500" size={18} />
                    <span>5. Estado de Salud General & Tratamientos</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    <div>
                        <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Médico de Cabecera</label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="medico_cabecera"
                                value={ficha.medico_cabecera || ''}
                                onChange={handleFichaInputChange}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium"
                                placeholder="Nombre del médico de cabecera..."
                            />
                        ) : (
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{ficha.medico_cabecera || '—'}</span>
                        )}
                    </div>

                    <div>
                        <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Enfermedad Actual</label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="enfermedad_actual"
                                value={ficha.enfermedad_actual || ''}
                                onChange={handleFichaInputChange}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium"
                                placeholder="Descripción de enfermedad actual..."
                            />
                        ) : (
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{ficha.enfermedad_actual || '—'}</span>
                        )}
                    </div>

                    <div>
                        <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">¿Toma Medicamentos Activamente?</label>
                        {isEditing ? (
                            <div className="flex items-center gap-4 mt-1">
                                <label className="flex items-center gap-2 font-semibold cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(ficha.toma_medicamentos)}
                                        onChange={() => handleFichaCheckboxChange('toma_medicamentos')}
                                        className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                                    />
                                    <span>Sí, actualmente toma medicamentos</span>
                                </label>
                            </div>
                        ) : (
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${Boolean(ficha.toma_medicamentos) ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                                {Boolean(ficha.toma_medicamentos) ? 'SÍ (Toma medicamentos)' : 'NO'}
                            </span>
                        )}
                    </div>

                    <div>
                        <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Detalle de Medicamentos</label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="medicamentos_detalle"
                                value={ficha.medicamentos_detalle || ''}
                                onChange={handleFichaInputChange}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium"
                                placeholder="Detalle de fármacos o dosis..."
                            />
                        ) : (
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{ficha.medicamentos_detalle || '—'}</span>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Tratamiento Médico Recibido</label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="tratamiento"
                                value={ficha.tratamiento || ''}
                                onChange={handleFichaInputChange}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium"
                                placeholder="Tratamientos médicos actuales o pasados..."
                            />
                        ) : (
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{ficha.tratamiento || '—'}</span>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Observaciones Médicas</label>
                        {isEditing ? (
                            <textarea
                                name="observaciones"
                                rows={2}
                                value={ficha.observaciones || ''}
                                onChange={handleFichaInputChange}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium text-xs"
                                placeholder="Observaciones generales..."
                            />
                        ) : (
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm block">{ficha.observaciones || '—'}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* SECCIÓN 6: ANTECEDENTES PATOLÓGICOS Y ENFERMEDADES */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700/60 space-y-4">
                <h4 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2 uppercase tracking-wide border-b pb-3 border-gray-100 dark:border-gray-700/50">
                    <AlertTriangle className="text-rose-500" size={18} />
                    <span>6. Antecedentes Patológicos & Enfermedades</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {enfermedadesChecklist.map(item => {
                        const isChecked = Boolean(ficha[item.key]);
                        return (
                            <div
                                key={item.key}
                                onClick={() => isEditing && handleFichaCheckboxChange(item.key)}
                                className={`p-3.5 rounded-xl border transition-all ${isEditing ? 'cursor-pointer hover:border-rose-400' : ''} ${isChecked
                                        ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700/50 text-rose-900 dark:text-rose-200'
                                        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        disabled={!isEditing}
                                        checked={isChecked}
                                        onChange={() => handleFichaCheckboxChange(item.key)}
                                        className="mt-0.5 h-4 w-4 text-rose-600 rounded focus:ring-rose-500 cursor-pointer"
                                    />
                                    <div>
                                        <span className={`text-xs font-bold block ${isChecked ? 'text-rose-700 dark:text-rose-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {item.label}
                                        </span>
                                        <span className="text-[10px] text-gray-400 block leading-tight mt-0.5">
                                            {item.desc}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* SECCIÓN 7: HISTORIAL DENTAL, HIGIENE Y SÍNTOMAS */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700/60 space-y-6">
                <h4 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2 uppercase tracking-wide border-b pb-3 border-gray-100 dark:border-gray-700/50">
                    <Smile className="text-cyan-500" size={18} />
                    <span>7. Historial Bucal, Hábitos de Higiene y Síntomas</span>
                </h4>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
                    {/* Última consulta */}
                    <div>
                        <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Última Consulta Dental</label>
                        {isEditing ? (
                            <select
                                name="ultima_consulta"
                                value={ficha.ultima_consulta || ''}
                                onChange={handleFichaInputChange}
                                className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium"
                            >
                                <option value="">Seleccionar...</option>
                                <option value="6 meses">Hace 6 meses</option>
                                <option value="mas de 1 año">Más de 1 año</option>
                                <option value="mas de 3 años">Más de 3 años</option>
                            </select>
                        ) : (
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm block p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                                {ficha.ultima_consulta || '—'}
                            </span>
                        )}
                    </div>

                    {/* Frecuencia cepillado */}
                    <div>
                        <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Frecuencia de Cepillado</label>
                        {isEditing ? (
                            <select
                                name="frecuencia_cepillado"
                                value={ficha.frecuencia_cepillado || ''}
                                onChange={handleFichaInputChange}
                                className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium"
                            >
                                <option value="">Seleccionar...</option>
                                <option value="Una">Una vez al día</option>
                                <option value="Dos">Dos veces al día</option>
                                <option value="Tres">Tres veces al día</option>
                                <option value="Mas">Más veces</option>
                            </select>
                        ) : (
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm block p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                                {ficha.frecuencia_cepillado || '—'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Elementos de Higiene Bucal (Tarjetas Interactivas) */}
                <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 block mb-3">ELEMENTOS DE HIGIENE BUCAL</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                            { key: 'usa_cepillo' as keyof FichaMedica, label: 'Cepillo Dental', icon: '🪥', desc: 'Usa cepillo de dientes' },
                            { key: 'usa_hilo_dental' as keyof FichaMedica, label: 'Hilo Dental', icon: '🧵', desc: 'Usa hilo dental en higiene' },
                            { key: 'usa_enjuague' as keyof FichaMedica, label: 'Enjuague Bucal', icon: '🧪', desc: 'Usa enjuague bucal' },
                        ].map(item => {
                            const isChecked = Boolean(ficha[item.key]);
                            return (
                                <div
                                    key={item.key}
                                    onClick={() => isEditing && handleFichaCheckboxChange(item.key)}
                                    className={`p-3.5 rounded-xl border transition-all ${isEditing ? 'cursor-pointer hover:border-cyan-400' : ''} ${isChecked
                                            ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-700 text-cyan-900 dark:text-cyan-200 font-bold'
                                            : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            disabled={!isEditing}
                                            checked={isChecked}
                                            onChange={() => handleFichaCheckboxChange(item.key)}
                                            className="h-4 w-4 text-cyan-600 rounded focus:ring-cyan-500 cursor-pointer"
                                        />
                                        <div>
                                            <span className="text-xs font-bold block flex items-center gap-1.5">
                                                <span>{item.icon}</span>
                                                <span>{item.label}</span>
                                            </span>
                                            <span className="text-[10px] text-gray-400 block leading-tight mt-0.5">
                                                {isChecked ? 'Sí (Utiliza)' : 'No registrado'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Síntomas y Molestias Bucales / Faciales (Tarjetas Interactivas) */}
                <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 block mb-3">SÍNTOMAS Y MOLESTIAS BUCALES / FACIALES</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                            { key: 'mal_aliento' as keyof FichaMedica, label: 'Mal Aliento (Halitosis)', icon: '💨', desc: 'Presenta mal aliento' },
                            { key: 'sangra_encias' as keyof FichaMedica, label: 'Sangrado de Encías', icon: '🩸', desc: 'Encías sangrantes' },
                            { key: 'dolor_cara' as keyof FichaMedica, label: 'Dolor en la Cara / TMJ', icon: '⚡', desc: 'Dolor facial o articulación' },
                        ].map(item => {
                            const isChecked = Boolean(ficha[item.key]);
                            return (
                                <div
                                    key={item.key}
                                    onClick={() => isEditing && handleFichaCheckboxChange(item.key)}
                                    className={`p-3.5 rounded-xl border transition-all ${isEditing ? 'cursor-pointer hover:border-amber-400' : ''} ${isChecked
                                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-bold'
                                            : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            disabled={!isEditing}
                                            checked={isChecked}
                                            onChange={() => handleFichaCheckboxChange(item.key)}
                                            className="h-4 w-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                                        />
                                        <div>
                                            <span className="text-xs font-bold block flex items-center gap-1.5">
                                                <span>{item.icon}</span>
                                                <span>{item.label}</span>
                                            </span>
                                            <span className="text-[10px] text-gray-400 block leading-tight mt-0.5">
                                                {isChecked ? 'Sí (Presenta)' : 'No presenta'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Causa del mal aliento si está marcado */}
                    {Boolean(ficha.mal_aliento) && (
                        <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs">
                            <label className="text-[10px] uppercase font-extrabold text-amber-700 dark:text-amber-300 block mb-1">
                                Causa o Detalle de Mal Aliento (Halitosis)
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="causa_mal_aliento"
                                    value={ficha.causa_mal_aliento || ''}
                                    onChange={handleFichaInputChange}
                                    placeholder="Causa o detalle..."
                                    className="w-full p-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium text-xs"
                                />
                            ) : (
                                <span className="font-semibold text-amber-900 dark:text-amber-200">
                                    {ficha.causa_mal_aliento || 'No especificada'}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Comentarios */}
                <div className="pt-2">
                    <label className="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Comentarios y Notas Adicionales</label>
                    {isEditing ? (
                        <textarea
                            name="comentarios"
                            rows={3}
                            value={ficha.comentarios || ''}
                            onChange={handleFichaInputChange}
                            placeholder="Comentarios o notas adicionales..."
                            className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-xs font-medium"
                        />
                    ) : (
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300">
                            {ficha.comentarios || 'Sin comentarios registrados.'}
                        </div>
                    )}
                </div>
            </div>
        </form>
    );
};

export default FichaMedicaTab;
