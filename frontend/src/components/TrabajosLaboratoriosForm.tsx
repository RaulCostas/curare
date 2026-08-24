import React, { useState, useEffect } from 'react';
import api from '../services/api';
import type { TrabajoLaboratorio, Paciente, Laboratorio, PrecioLaboratorio, Cubeta } from '../types';
import Swal from 'sweetalert2';
import ManualModal, { type ManualSection } from './ManualModal';
import SearchableSelect, { type Option } from './SearchableSelect';

interface TrabajosLaboratoriosFormProps {
    isOpen: boolean;
    onClose: () => void;
    id?: number | null;
    onSaveSuccess: () => void;
}

const TrabajosLaboratoriosForm: React.FC<TrabajosLaboratoriosFormProps> = ({ isOpen, onClose, id, onSaveSuccess }) => {
    const isEditing = Boolean(id);

    const getLocalDate = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const initialFormData: Partial<TrabajoLaboratorio> = {
        idLaboratorio: 0,
        idPaciente: 0,
        idprecios_laboratorios: 0,
        fecha: getLocalDate(),
        pieza: '',
        cantidad: 1,
        fecha_pedido: getLocalDate(),
        color: '',
        estado: 'no terminado',
        cita: 'no',
        observacion: '',
        pagado: 'no',
        precio_unitario: 0,
        total: 0,
        resaltar: 'no',
        idCubeta: 0,
        fecha_terminado: ''
    };

    const [formData, setFormData] = useState<Partial<TrabajoLaboratorio>>(initialFormData);
    const [pacientes, setPacientes] = useState<Paciente[]>([]);
    const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
    const [preciosLaboratorio, setPreciosLaboratorio] = useState<PrecioLaboratorio[]>([]);
    const [cubetas, setCubetas] = useState<Cubeta[]>([]);
    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Trabajos de Laboratorio',
            content: 'Registre los trabajos enviados a laboratorios externos. Especifique el tipo de trabajo, piezas dentales, fechas y estado del trabajo.'
        },
        {
            title: 'Cubetas',
            content: 'Asocie una cubeta al trabajo para rastrear su ubicación. El sistema actualiza automáticamente el estado de la cubeta cuando el trabajo se envía o regresa.'
        },
        {
            title: 'Estados del Trabajo',
            content: 'Los trabajos pueden estar: No Terminado, Terminado, o Entregado. El sistema rastrea las fechas de cada cambio de estado.'
        }
    ];

    useEffect(() => {
        if (isOpen) {
            const initForm = async () => {
                await fetchDropdowns();
                if (isEditing && id) {
                    await fetchTrabajo(id.toString());
                } else {
                    setFormData(initialFormData);
                }
            };
            initForm();
        }
    }, [isOpen, id, isEditing]);

    useEffect(() => {
        const total = (Number(formData.cantidad) || 0) * (Number(formData.precio_unitario) || 0);
        setFormData(prev => ({ ...prev, total }));
    }, [formData.cantidad, formData.precio_unitario]);

    const fetchDropdowns = async () => {
        try {
            const [pacResponse, labRes, preciosRes, cubetasRes] = await Promise.all([
                api.get('/pacientes?limit=50000'),
                api.get('/laboratorios?limit=1000'),
                api.get('/precios-laboratorios?limit=1000'),
                api.get('/cubetas?limit=1000')
            ]);

            const allPacientes = Array.isArray(pacResponse.data.data) ? pacResponse.data.data : (Array.isArray(pacResponse.data) ? pacResponse.data : []);
            setPacientes(allPacientes);

            const allLabs = Array.isArray(labRes.data.data) ? labRes.data.data : (Array.isArray(labRes.data) ? labRes.data : []);
            setLaboratorios(allLabs);

            setPreciosLaboratorio(Array.isArray(preciosRes.data.data) ? preciosRes.data.data : (Array.isArray(preciosRes.data) ? preciosRes.data : []));
            setCubetas(Array.isArray(cubetasRes.data.data) ? cubetasRes.data.data : (Array.isArray(cubetasRes.data) ? cubetasRes.data : []));
        } catch (error) {
            console.error('Error fetching dropdowns:', error);
        }
    };

    const fetchTrabajo = async (workId: string) => {
        try {
            const response = await api.get(`/trabajos-laboratorios/${workId}`);
            const data = response.data;
            const pacId = Number(data.idPaciente || data.pacienteId || data.idpaciente || data.paciente?.id || 0);

            if (data.paciente) {
                setPacientes(prev => {
                    if (!prev.some(p => p.id === data.paciente.id)) {
                        return [data.paciente, ...prev];
                    }
                    return prev;
                });
            }

            setFormData({
                ...data,
                idPaciente: pacId,
                idLaboratorio: Number(data.idLaboratorio || data.laboratorioId || data.idlaboratorio || data.laboratorio?.id || 0),
                idprecios_laboratorios: Number(data.idprecios_laboratorios || data.precioLaboratorioId || data.precioLaboratorio?.id || 0),
                idCubeta: data.idCubeta ? Number(data.idCubeta) : (data.cubeta?.id ? Number(data.cubeta.id) : 0),
                precio_unitario: Number(data.precio_unitario || (data.precioLaboratorio ? data.precioLaboratorio.precio : 0)),
                cantidad: Number(data.cantidad || 1),
                total: Number(data.total || 0)
            });
        } catch (error) {
            console.error('Error fetching trabajo:', error);
        }
    };

    const numericFields = ['idLaboratorio', 'idPaciente', 'idprecios_laboratorios', 'idCubeta', 'cantidad', 'precio_unitario', 'total'];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: numericFields.includes(name) ? Number(value) : value
        }));
    };

    const handlePrecioSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const precioId = Number(e.target.value);
        const selectedPrecio = preciosLaboratorio.find(p => p.id === precioId);

        setFormData(prev => ({
            ...prev,
            idprecios_laboratorios: precioId,
            precio_unitario: selectedPrecio ? Number(selectedPrecio.precio) : 0,
            idLaboratorio: selectedPrecio ? selectedPrecio.idLaboratorio : prev.idLaboratorio
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formData,
            idLaboratorio: Number(formData.idLaboratorio),
            idPaciente: Number(formData.idPaciente),
            idprecios_laboratorios: Number(formData.idprecios_laboratorios),
            idCubeta: formData.idCubeta ? Number(formData.idCubeta) : null,
            cantidad: Number(formData.cantidad),
            precio_unitario: Number(formData.precio_unitario),
            total: Number(formData.total),
            fecha_terminado: formData.estado === 'terminado' ? formData.fecha_terminado : null
        };

        try {
            if (isEditing && id) {
                await api.patch(`/trabajos-laboratorios/${id}`, payload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Trabajo Actualizado',
                    text: 'El trabajo ha sido modificado exitosamente.',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                await api.post('/trabajos-laboratorios', payload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Trabajo Guardado',
                    text: 'El trabajo ha sido registrado exitosamente.',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
            onSaveSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving trabajo:', error);
            const errorMessage = error.response?.data?.message || 'Hubo un problema al guardar el trabajo.';
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage
            });
        }
    };

    const patientOptions: Option[] = pacientes
        .map(p => {
            const paternoMaternoNombre = [p.paterno, p.materno, p.nombre].filter(Boolean).join(' ');
            const nombrePaternoMaterno = [p.nombre, p.paterno, p.materno].filter(Boolean).join(' ');
            return {
                id: p.id,
                label: paternoMaternoNombre,
                subLabel: p.ci ? `CI: ${p.ci}` : undefined,
                searchString: `${nombrePaternoMaterno} ${p.ci || ''}`
            };
        })
        .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }));

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="fixed inset-0 bg-black/50 transition-opacity duration-300 opacity-100" onClick={onClose} />
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-0 flex flex-col">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <span className="p-2.5 bg-purple-100 dark:bg-purple-900/60 rounded-xl text-purple-600 dark:text-purple-300 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        </span>
                        {isEditing ? 'Editar Trabajo de Laboratorio' : 'Nuevo Trabajo de Laboratorio'}
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
                            className="text-gray-400 bg-transparent hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full transition-all"
                            title="Cerrar"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col justify-between space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Fecha Registro:</label>
                            <div className="relative flex-1 w-full">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <input
                                    type="date"
                                    name="fecha"
                                    value={formData.fecha}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-300 text-sm font-medium"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Paciente:</label>
                            <SearchableSelect
                                options={patientOptions}
                                value={Number(formData.idPaciente || 0)}
                                onChange={(val) => {
                                    const pacId = Number(val);
                                    setFormData(prev => ({
                                        ...prev,
                                        idPaciente: pacId
                                    }));
                                }}
                                placeholder="-- Seleccione Paciente --"
                                searchPlaceholder="Buscar paciente por Nombre, Apellido o CI..."
                                required
                                icon={
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                }
                            />
                        </div>

                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Laboratorio:</label>
                            <div className="relative flex-1 w-full">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L5.6 15.12a2 2 0 00-1.4.316l-.8 0.6a2 2 0 00-.8 1.6V20a2 2 0 002 2h16a2 2 0 002-2v-2.358a2 2 0 00-.8-1.6l-.572-.428z" />
                                    </svg>
                                </div>
                                <select
                                    name="idLaboratorio"
                                    value={formData.idLaboratorio}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-300 text-sm font-medium cursor-pointer"
                                >
                                    <option value={0}>Seleccione Laboratorio</option>
                                    {laboratorios.map(lab => (
                                        <option key={lab.id} value={lab.id}>{lab.laboratorio}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Trabajo / Precio:</label>
                            <div className="relative flex-1 w-full">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 11h.01M7 15h.01M13 7h.01M13 11h.01M13 15h.01M19 7h.01M19 11h.01M19 15h.01M4 3h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" />
                                    </svg>
                                </div>
                                <select
                                    name="idprecios_laboratorios"
                                    value={formData.idprecios_laboratorios}
                                    onChange={handlePrecioSelect}
                                    required
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-300 text-sm font-medium cursor-pointer"
                                >
                                    <option value={0}>Seleccione Trabajo</option>
                                    {preciosLaboratorio
                                        .filter(p => {
                                            const labId = Number(formData.idLaboratorio || 0);
                                            return labId === 0 || p.idLaboratorio === labId;
                                        })
                                        .map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.detalle} - Bs {Number(p.precio).toFixed(2)}
                                            </option>
                                        ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Pieza Dental:</label>
                            <div className="relative flex-1 w-full">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    name="pieza"
                                    value={formData.pieza}
                                    onChange={handleChange}
                                    placeholder="Ej: 11, 21, Superior"
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-300 text-sm font-medium"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Cantidad:</label>
                            <div className="relative flex-1 w-full">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <input
                                    type="number"
                                    name="cantidad"
                                    value={formData.cantidad}
                                    onChange={handleChange}
                                    min={1}
                                    required
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-300 text-sm font-medium"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Fecha Pedido:</label>
                            <div className="relative flex-1 w-full">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <input
                                    type="date"
                                    name="fecha_pedido"
                                    value={formData.fecha_pedido}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-300 text-sm font-medium"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Color:</label>
                            <div className="relative flex-1 w-full">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    name="color"
                                    value={formData.color}
                                    onChange={handleChange}
                                    placeholder="Ej: A2, A3"
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-300 text-sm font-medium"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Cubeta:</label>
                            <div className="relative flex-1 w-full">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                    </svg>
                                </div>
                                <select
                                    name="idCubeta"
                                    value={formData.idCubeta || 0}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-300 text-sm font-medium cursor-pointer"
                                >
                                    <option value={0}>-- Sin Cubeta --</option>
                                    {cubetas.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.codigo} - {c.descripcion}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Estado del Trabajo:</label>
                            <div className="relative flex-1 w-full">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <select
                                    name="estado"
                                    value={formData.estado}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-300 text-sm font-medium cursor-pointer"
                                >
                                    <option value="no terminado">No Terminado</option>
                                    <option value="terminado">Terminado</option>
                                    <option value="entregado">Entregado</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Observación:</label>
                        <div className="relative flex-1 w-full">
                            <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </div>
                            <textarea
                                name="observacion"
                                value={formData.observacion}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Ej: Detalles adicionales del trabajo..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-300 text-sm font-medium"
                            />
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl flex justify-end gap-6 items-center border border-gray-100 dark:border-gray-700">
                        <div className="text-right">
                            <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">P. Unitario</span>
                            <span className="text-base font-bold text-gray-800 dark:text-gray-200">Bs {Number(formData.precio_unitario).toFixed(2)}</span>
                        </div>
                        <div className="text-right">
                            <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Total</span>
                            <span className="text-xl font-extrabold text-green-600 dark:text-green-400">Bs {Number(formData.total).toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-start gap-3 mt-6">
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
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual - Trabajos de Laboratorio"
                sections={manualSections}
            />
        </div>
    );
};

export default TrabajosLaboratoriosForm;
