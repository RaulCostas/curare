import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import ManualModal, { type ManualSection } from './ManualModal';
import MusicaTelevisionTab from './MusicaTelevisionTab';

interface PacienteFormProps {
    isOpen: boolean;
    onClose: () => void;
    id?: number | null;
    onSaveSuccess: () => void;
}

const PacienteForm: React.FC<PacienteFormProps> = ({ isOpen, onClose, id, onSaveSuccess }) => {
    const isEditing = Boolean(id);
    const [activeTab, setActiveTab] = useState('datos');
    const [showManual, setShowManual] = useState(false);
    const [selectedMusicas, setSelectedMusicas] = useState<number[]>([]);
    const [selectedTelevisiones, setSelectedTelevisiones] = useState<number[]>([]);

    const manualSections: ManualSection[] = [
        {
            title: 'Registro de Pacientes',
            content: 'Complete los datos personales, de contacto y médicos del paciente. Use las pestañas para organizar la información. El formulario cuenta con 3 pestañas: Datos Personales, Ficha Médica y Música/Televisión.'
        },
        {
            title: 'Ficha Médica',
            content: 'Registre el historial médico del paciente, incluyendo alergias, enfermedades crónicas y medicamentos. Esta información es crucial para la atención odontológica segura.'
        },
        {
            title: 'Categoría y Tipo',
            content: 'Asigne una categoría al paciente (ej: VIP, Regular) y defina si es Particular o de Seguro para aplicar tarifas correctas.'
        },
        {
            title: 'Música / Televisión',
            content: 'Configure las preferencias de música y televisión del paciente para personalizar su experiencia durante los tratamientos.'
        }
    ];

    const initialFormData = {
        fecha: new Date().toISOString().split('T')[0],
        paterno: '',
        materno: '',
        nombre: '',
        direccion: '',
        telefono: '',
        celular: '',
        email: '',
        casilla: '',
        profesion: '',
        estado_civil: '',
        direccion_oficina: '',
        telefono_oficina: '',
        fecha_nacimiento: '',
        sexo: '',
        seguro_medico: '',
        poliza: '',
        recomendado: '',
        responsable: '',
        parentesco: '',
        direccion_responsable: '',
        telefono_responsable: '',
        idCategoria: 0,
        tipo_paciente: '',
        motivo: '',
        nomenclatura: '',
        estado: 'activo',
        fax: '',
        casilla_postal: '',
        forma_pago: '',
        fichaMedica: {
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
        }
    };

    const [formData, setFormData] = useState(initialFormData);

    const [countryCode, setCountryCode] = useState('+591');
    const [localCelular, setLocalCelular] = useState('');

    const countryCodes = [
        { code: '+591', label: 'Bolivia (+591)' },
        { code: '+1', label: 'USA/Canadá (+1)' },
        { code: '+54', label: 'Argentina (+54)' },
        { code: '+55', label: 'Brasil (+55)' },
        { code: '+56', label: 'Chile (+56)' },
        { code: '+51', label: 'Perú (+51)' },
        { code: '+595', label: 'Paraguay (+595)' },
        { code: '+598', label: 'Uruguay (+598)' },
        { code: '+57', label: 'Colombia (+57)' },
        { code: '+52', label: 'México (+52)' },
        { code: '+34', label: 'España (+34)' },
        { code: '+0', label: 'Otro' },
    ];

    const [categorias, setCategorias] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchCategorias();
            setActiveTab('datos');
            if (isEditing && id) {
                fetchPaciente(id);
            } else {
                setFormData(initialFormData);
                setCountryCode('+591');
                setLocalCelular('');
                setSelectedMusicas([]);
                setSelectedTelevisiones([]);
            }
        }
    }, [isOpen, id, isEditing]);

    const fetchPaciente = async (pacienteId: number) => {
        try {
            const response = await api.get(`/pacientes/${pacienteId}`);
            const data = response.data;

            if (data.categoria && !data.idCategoria) {
                data.idCategoria = data.categoria.id;
            }
            if (!data.idCategoria) {
                data.idCategoria = 0;
            }

            if (!data.fichaMedica) {
                data.fichaMedica = { ...initialFormData.fichaMedica };
            }

            setFormData(data);

            if (data.celular) {
                const foundCode = countryCodes.find(c => data.celular.startsWith(c.code));
                if (foundCode && foundCode.code !== '+0') {
                    setCountryCode(foundCode.code);
                    setLocalCelular(data.celular.substring(foundCode.code.length));
                } else {
                    if (data.celular.startsWith('+')) {
                        setCountryCode('+0');
                        setLocalCelular(data.celular);
                    } else {
                        setCountryCode('+591');
                        setLocalCelular(data.celular);
                    }
                }
            } else {
                setCountryCode('+591');
                setLocalCelular('');
            }
        } catch (error) {
            console.error('Error fetching paciente:', error);
        }
    };

    const fetchCategorias = async () => {
        try {
            const response = await api.get('/categoria-paciente?limit=100');
            const activeCategorias = (response.data.data || []).filter((cat: any) => cat.estado === 'activo');
            setCategorias(activeCategorias);
        } catch (error) {
            console.error('Error fetching categorias:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (name.startsWith('fichaMedica.')) {
            const field = name.split('.')[1];
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({
                ...prev,
                fichaMedica: {
                    ...prev.fichaMedica,
                    [field]: type === 'checkbox' ? checked : value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: name === 'idCategoria' ? Number(value) : value
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const finalCelular = countryCode === '+0' ? localCelular : `${countryCode}${localCelular}`;

            const payload = {
                ...formData,
                celular: finalCelular,
                idCategoria: formData.idCategoria === 0 ? null : formData.idCategoria
            };

            if (isEditing) {
                await api.patch(`/pacientes/${id}`, payload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Paciente Actualizado',
                    text: 'Paciente actualizado exitosamente',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                const response = await api.post('/pacientes', payload);
                const newPacienteId = response.data.id;

                if (selectedMusicas.length > 0) {
                    await api.post(`/pacientes/${newPacienteId}/musica`, { musicaIds: selectedMusicas });
                }
                if (selectedTelevisiones.length > 0) {
                    await api.post(`/pacientes/${newPacienteId}/television`, { televisionIds: selectedTelevisiones });
                }

                await Swal.fire({
                    icon: 'success',
                    title: 'Paciente Creado',
                    text: 'Paciente creado exitosamente',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
            onSaveSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving paciente:', error);
            const errorMessage = error.response?.data?.message || 'Error al guardar el paciente';
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="fixed inset-0 bg-black/50 transition-opacity duration-300 opacity-100" onClick={onClose} />
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-3xl bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-0 flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <span className="p-2.5 bg-blue-100 dark:bg-blue-900/60 rounded-xl text-blue-600 dark:text-blue-300 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </span>
                        {isEditing ? 'Editar Paciente' : 'Nuevo Paciente'}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowManual(true)}
                            className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            title="Ayuda / Manual"
                        >
                            ?
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Tabs Header */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 px-6">
                    <button
                        type="button"
                        className={`py-3 px-5 border-b-2 font-bold text-sm transition-colors ${activeTab === 'datos'
                            ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                        onClick={() => setActiveTab('datos')}
                    >
                        Datos Personales
                    </button>
                    <button
                        type="button"
                        className={`py-3 px-5 border-b-2 font-bold text-sm transition-colors ${activeTab === 'ficha'
                            ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                        onClick={() => setActiveTab('ficha')}
                    >
                        Ficha Médica
                    </button>
                    <button
                        type="button"
                        className={`py-3 px-5 border-b-2 font-bold text-sm transition-colors ${activeTab === 'musica-tv'
                            ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                        onClick={() => setActiveTab('musica-tv')}
                    >
                        Música / Televisión
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col justify-between">
                    <div>
                        {activeTab === 'datos' && (
                            <div className="space-y-4">
                                {/* Row 1: Paterno */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-1">
                                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Ape. Paterno:</label>
                                        <input type="text" name="paterno" value={formData.paterno} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium" />
                                    </div>
                                </div>
                                {/* Row 2: Materno & Nombres */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Ape. Materno:</label>
                                        <input type="text" name="materno" value={formData.materno} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium" />
                                    </div>
                                    <div>
                                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Nombres:</label>
                                        <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium" />
                                    </div>
                                </div>
                                {/* Row 3: Domicilio, Telf. Domicilio, Celular */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                    <div className="md:col-span-6">
                                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Domicilio:</label>
                                        <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium" />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Telf. Domicilio:</label>
                                        <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium" />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Celular:</label>
                                        <div className="flex gap-2">
                                            <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="w-[100px] px-2 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm font-medium">
                                                {countryCodes.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                                            </select>
                                            <input type="text" value={localCelular} onChange={(e) => setLocalCelular(e.target.value)} placeholder="Número" className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium" />
                                        </div>
                                    </div>
                                </div>
                                {/* Row 4: Casilla, Email */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                    <div className="md:col-span-3">
                                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Casilla:</label>
                                        <input type="text" name="casilla" value={formData.casilla} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium" />
                                    </div>
                                    <div className="md:col-span-9">
                                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Email:</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium" />
                                    </div>
                                </div>
                                {/* Row 5: Profesión, Estado Civil */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                    <div className="md:col-span-8">
                                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Profesión:</label>
                                        <input type="text" name="profesion" value={formData.profesion} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium" />
                                    </div>
                                    <div className="md:col-span-4">
                                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Estado Civil:</label>
                                        <select name="estado_civil" value={formData.estado_civil} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer">
                                            <option value="">Seleccione...</option>
                                            <option value="Soltero(a)">Soltero(a)</option>
                                            <option value="Casado(a)">Casado(a)</option>
                                            <option value="Divorciado(a)">Divorciado(a)</option>
                                            <option value="Viudo(a)">Viudo(a)</option>
                                        </select>
                                    </div>
                                </div>
                                <hr className="my-2 border-gray-200 dark:border-gray-700" />
                                {/* Row 6: Dirección de Oficina, Telf. Oficina */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Dirección de Oficina:</label>
                                        <input type="text" name="direccion_oficina" value={formData.direccion_oficina} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium" />
                                    </div>
                                    <div>
                                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Telf. Oficina:</label>
                                        <input type="text" name="telefono_oficina" value={formData.telefono_oficina} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium" />
                                    </div>
                                </div>
                                {/* Row 7: Fax, Casilla Postal */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Fax:</label>
                                        <input type="text" name="fax" value={(formData as any).fax || ''} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium" />
                                    </div>
                                    <div>
                                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Casilla Postal:</label>
                                        <input type="text" name="casilla_postal" value={(formData as any).casilla_postal || ''} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium" />
                                    </div>
                                </div>
                                {/* Row 8: Fecha Nacimiento, Edad, Sexo */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                    <div className="md:col-span-5">
                                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Fecha Nacimiento:</label>
                                        <input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium" />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Edad:</label>
                                        <div className="flex items-center gap-2">
                                            <input type="text" readOnly value={formData.fecha_nacimiento ? Math.floor((new Date().getTime() - new Date(formData.fecha_nacimiento).getTime()) / 31557600000) : ''} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed font-medium" />
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Años</span>
                                        </div>
                                    </div>
                                    <div className="md:col-span-4">
                                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Sexo:</label>
                                        <div className="flex items-center gap-4 py-2.5">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" name="sexo" value="M" checked={formData.sexo === 'M'} onChange={handleChange} className="text-blue-600 focus:ring-blue-500" />
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Masculino</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" name="sexo" value="F" checked={formData.sexo === 'F'} onChange={handleChange} className="text-blue-600 focus:ring-blue-500" />
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Femenino</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <hr className="my-2 border-gray-200 dark:border-gray-700" />
                                {/* Row 9: Seguro Médico, Póliza */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300 uppercase">Seguro Médico:</label>
                                        <input type="text" name="seguro_medico" value={formData.seguro_medico} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium" />
                                    </div>
                                    <div>
                                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Póliza No.:</label>
                                        <input type="text" name="poliza" value={formData.poliza} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium" />
                                    </div>
                                </div>
                                <hr className="my-2 border-gray-200 dark:border-gray-700" />
                                {/* Row 10: Recomendado por */}
                                <div>
                                    <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Recomendado por:</label>
                                    <input type="text" name="recomendado" value={formData.recomendado} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium" />
                                </div>
                                {/* Row 11: Responsable, Parentesco */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Responsable familia:</label>
                                        <input type="text" name="responsable" value={formData.responsable} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium" />
                                    </div>
                                    <div>
                                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Parentesco:</label>
                                        <input type="text" name="parentesco" value={formData.parentesco} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium" />
                                    </div>
                                </div>
                                {/* Row 12: Dirección Responsable, Teléfono Responsable */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Dirección:</label>
                                        <input type="text" name="direccion_responsable" value={formData.direccion_responsable} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium" />
                                    </div>
                                    <div>
                                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Teléfonos:</label>
                                        <input type="text" name="telefono_responsable" value={formData.telefono_responsable} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium" />
                                    </div>
                                </div>
                                <hr className="my-2 border-gray-200 dark:border-gray-700" />
                                {/* Row 13: Categoría, Nomenclatura */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                    <div>
                                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300 uppercase">Categoría:</label>
                                        <select name="idCategoria" value={formData.idCategoria} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer">
                                            <option value={0}>-- Sin Categoría --</option>
                                            {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.categoria}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Nomenclatura:</label>
                                        <input type="text" name="nomenclatura" value={formData.nomenclatura} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium" />
                                    </div>
                                </div>
                                {/* Row 14: Tipo Paciente */}
                                <div>
                                    <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300 uppercase">Tipo de Paciente:</label>
                                    <div className="flex items-center gap-6 py-2.5">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="tipo_paciente" value="Particular" checked={formData.tipo_paciente === 'Particular' || formData.tipo_paciente === 'Normal'} onChange={() => setFormData(p => ({ ...p, tipo_paciente: 'Particular' }))} className="text-blue-600 focus:ring-blue-500" />
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase">Normal</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="tipo_paciente" value="Seguro" checked={formData.tipo_paciente === 'Seguro' || formData.tipo_paciente === 'Especial'} onChange={() => setFormData(p => ({ ...p, tipo_paciente: 'Seguro' }))} className="text-blue-600 focus:ring-blue-500" />
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase">Especial (Agregar...)</span>
                                        </label>
                                    </div>
                                </div>
                                {/* Row 15: Forma de Pago */}
                                <div className="mt-4 bg-blue-900 dark:bg-blue-900/60 p-2 rounded-t-lg">
                                    <h4 className="text-white text-center font-bold italic uppercase tracking-widest">Forma de Pago</h4>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-b-lg border border-t-0 border-gray-200 dark:border-gray-600 flex gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="forma_pago" value="Efectivo" checked={(formData as any).forma_pago === 'Efectivo'} onChange={handleChange} className="text-blue-600 focus:ring-blue-500 w-4 h-4" />
                                        <span className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase">Efectivo</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="forma_pago" value="Tarjeta de Crédito" checked={(formData as any).forma_pago === 'Tarjeta de Crédito'} onChange={handleChange} className="text-blue-600 focus:ring-blue-500 w-4 h-4" />
                                        <span className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase">Tarjeta de Crédito</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="forma_pago" value="Cheque" checked={(formData as any).forma_pago === 'Cheque'} onChange={handleChange} className="text-blue-600 focus:ring-blue-500 w-4 h-4" />
                                        <span className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase">Cheque</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {activeTab === 'ficha' && (
                            <div className="space-y-4">
                                <h3 className="font-bold text-lg text-gray-800 dark:text-white border-b pb-2">Antecedentes Médicos</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                    {[
                                        ['alergia_anestesicos', 'Alergia a Anestésicos'],
                                        ['alergias_drogas', 'Alergia a Medicamentos / Drogas'],
                                        ['hepatitis', 'Hepatitis'],
                                        ['asma', 'Asma'],
                                        ['diabetes', 'Diabetes'],
                                        ['dolencia_cardiaca', 'Dolencia Cardíaca'],
                                        ['hipertension', 'Hipertensión'],
                                        ['fiebre_reumatica', 'Fiebre Reumática'],
                                        ['diatesis_hemorragia', 'Diátesis Hemorrágica'],
                                        ['sinusitis', 'Sinusitis'],
                                        ['ulcera_gastroduodenal', 'Úlcera Gastroduodenal'],
                                        ['enfermedades_tiroides', 'Enfermedades Tiroideas'],
                                    ].map(([field, label]) => (
                                        <label key={field} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <input
                                                type="checkbox"
                                                name={`fichaMedica.${field}`}
                                                checked={(formData.fichaMedica as any)[field]}
                                                onChange={handleChange}
                                                className="w-4 h-4 text-blue-600 rounded"
                                            />
                                            <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
                                        </label>
                                    ))}
                                </div>
                                <div className="pt-2">
                                    <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Observaciones Médicas / Medicamentos Actuales:</label>
                                    <textarea
                                        name="fichaMedica.observaciones"
                                        value={formData.fichaMedica.observaciones}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium"
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'musica-tv' && (
                            <MusicaTelevisionTab
                                pacienteId={id ? Number(id) : null}
                                selectedMusicas={selectedMusicas}
                                setSelectedMusicas={setSelectedMusicas}
                                selectedTelevisiones={selectedTelevisiones}
                                setSelectedTelevisiones={setSelectedTelevisiones}
                            />
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-start gap-3 mt-6">
                        <button
                            type="submit"
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                <polyline points="7 3 7 8 15 8"></polyline>
                            </svg>
                            {isEditing ? 'Actualizar' : 'Guardar'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2.5 px-5 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual - Pacientes"
                sections={manualSections}
            />
        </div>
    );
};

export default PacienteForm;
