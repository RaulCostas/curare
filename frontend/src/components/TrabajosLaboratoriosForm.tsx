import React, { useState, useEffect } from 'react';
import api from '../services/api';
import type { TrabajoLaboratorio, Paciente, Laboratorio, PrecioLaboratorio, Cubeta } from '../types';
import Swal from 'sweetalert2';
import ManualModal, { type ManualSection } from './ManualModal';
import SearchableSelect, { type Option } from './SearchableSelect';
import { formatCurrency } from '../utils/formatters';

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
        traspasado: 'no',
        observacion_traspaso: '',
        precio_unitario: 0,
        total: 0,
        fecha_terminado: undefined,
        idCubeta: undefined
    };

    const [formData, setFormData] = useState<Partial<TrabajoLaboratorio>>(initialFormData);
    const [pacientes, setPacientes] = useState<Paciente[]>([]);
    const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
    const [preciosLaboratorio, setPreciosLaboratorio] = useState<PrecioLaboratorio[]>([]);
    const [cubetas, setCubetas] = useState<Cubeta[]>([]);
    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Descripción General',
            content: 'Este formulario permite registrar o editar los trabajos que se envían a los laboratorios dentales externos, asociándolos a un paciente, laboratorio, trabajo y cubeta.'
        },
        {
            title: 'Campos Principales',
            content: '• Paciente: Seleccione el paciente para el cual se realiza el trabajo dental.\n• Laboratorio: Seleccione la empresa o profesional de laboratorio encargado.\n• Trabajo / Precio: Seleccione el ítem tarifario del laboratorio.\n• Pieza Dental: Indique el número o descripción de la pieza dental (ej: 11, 21).\n• Cantidad: Cantidad de piezas o prótesis a elaborar.\n• Color: Guía de color requerida (ej: A2, A3).\n• Cubeta: Cubeta de impresión asignada (opcional).'
        }
    ];

    useEffect(() => {
        fetchDropdowns();
    }, []);

    useEffect(() => {
        if (isEditing && id) {
            fetchTrabajo(id);
        } else {
            setFormData(initialFormData);
        }
    }, [id, isEditing]);

    const fetchDropdowns = async () => {
        try {
            const [resPac, resLab, resPre, resCub] = await Promise.all([
                api.get('/pacientes?estado=activo&limit=100000'),
                api.get('/laboratorios?estado=activo&limit=1000'),
                api.get('/precios-laboratorios?limit=10000'),
                api.get('/cubetas')
            ]);
            setPacientes(resPac.data.data || resPac.data || []);
            const labsRaw = resLab.data.data || resLab.data || [];
            const activeLabs = labsRaw
                .filter((l: any) => !l.estado || l.estado.toLowerCase() === 'activo')
                .sort((a: any, b: any) => (a.laboratorio || '').localeCompare(b.laboratorio || '', 'es', { sensitivity: 'base' }));
            setLaboratorios(activeLabs);
            setPreciosLaboratorio(resPre.data.data || resPre.data || []);
            setCubetas(resCub.data.data || resCub.data || []);
        } catch (error) {
            console.error('Error fetching dropdowns:', error);
        }
    };

    const fetchTrabajo = async (trabajoId: number) => {
        try {
            const res = await api.get(`/trabajos-laboratorios/${trabajoId}`);
            const data = res.data;
            setFormData({
                ...data,
                idLaboratorio: data.idLaboratorio || (data.laboratorio?.id ?? 0),
                idPaciente: data.idPaciente || (data.paciente?.id ?? 0),
                idprecios_laboratorios: data.idprecios_laboratorios || (data.precioLaboratorio?.id ?? 0),
                idCubeta: data.idCubeta || (data.cubeta?.id ?? undefined)
            });
        } catch (error) {
            console.error('Error fetching trabajo:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const numericFields = ['idLaboratorio', 'idPaciente', 'idprecios_laboratorios', 'cantidad', 'precio_unitario', 'total'];

        setFormData(prev => {
            const updated = {
                ...prev,
                [name]: numericFields.includes(name) ? (value === '' ? '' : Number(value)) : value
            };

            // If laboratorio changed, reset trabajo/precio
            if (name === 'idLaboratorio') {
                const newLabId = Number(value || 0);
                if (newLabId !== Number(prev.idLaboratorio || 0)) {
                    updated.idprecios_laboratorios = 0;
                    updated.precio_unitario = 0;
                    updated.total = 0;
                }
            }

            if (name === 'cantidad' || name === 'precio_unitario') {
                const cant = name === 'cantidad' ? Number(value || 0) : Number(prev.cantidad || 0);
                const precio = name === 'precio_unitario' ? Number(value || 0) : Number(prev.precio_unitario || 0);
                updated.total = cant * precio;
            }

            return updated;
        });
    };

    const handlePrecioSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const precioId = Number(e.target.value);
        const selected = preciosLaboratorio.find(p => p.id === precioId);

        setFormData(prev => {
            const precioUnitario = selected ? Number(selected.precio) : 0;
            const cant = Number(prev.cantidad || 1);
            return {
                ...prev,
                idprecios_laboratorios: precioId,
                precio_unitario: precioUnitario,
                total: cant * precioUnitario,
                idLaboratorio: selected ? selected.idLaboratorio : prev.idLaboratorio
            };
        });
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
            traspasado: formData.traspasado || 'no',
            observacion_traspaso: formData.observacion_traspaso || '',
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
        <div className="fixed inset-0 z-[10000] overflow-hidden">
            <div className="fixed inset-0 bg-black/50 transition-opacity duration-300 opacity-100" onClick={onClose} />
            <div className="fixed inset-y-0 right-0 z-[10000] w-full max-w-2xl bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-0 flex flex-col">
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
                                    value={formData.idprecios_laboratorios || 0}
                                    onChange={handlePrecioSelect}
                                    required
                                    disabled={!Number(formData.idLaboratorio || 0)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-300 text-sm font-medium cursor-pointer disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed disabled:text-gray-400"
                                >
                                    <option value={0}>
                                        {!Number(formData.idLaboratorio || 0)
                                            ? '-- Seleccione primero un laboratorio --'
                                            : '-- Seleccione Trabajo --'}
                                    </option>
                                    {Number(formData.idLaboratorio || 0) > 0 &&
                                        preciosLaboratorio
                                            .filter(p => p.idLaboratorio === Number(formData.idLaboratorio))
                                            .map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.detalle} - Bs {formatCurrency(p.precio)}
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
                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Observación General:</label>
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
                                rows={2}
                                placeholder="Ej: Detalles adicionales del trabajo..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-300 text-sm font-medium"
                            />
                        </div>
                    </div>

                    {/* Trabajo Observado / Traspasado */}
                    <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700/60 rounded-xl space-y-2.5">
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                name="traspasado"
                                checked={formData.traspasado === 'si'}
                                onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    setFormData(prev => ({
                                        ...prev,
                                        traspasado: isChecked ? 'si' : 'no'
                                    }));
                                }}
                                className="w-4 h-4 text-amber-600 bg-white border-gray-300 rounded focus:ring-amber-500 cursor-pointer"
                            />
                            <span className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Marcar como Trabajo Observado / Traspasado (No se pagará al laboratorio)
                            </span>
                        </label>

                        {formData.traspasado === 'si' && (
                            <div className="pt-1.5">
                                <label className="block mb-1 font-semibold text-xs text-amber-900 dark:text-amber-300">
                                    Motivo de la Observación (¿Por qué no se paga?):
                                </label>
                                <textarea
                                    name="observacion_traspaso"
                                    value={formData.observacion_traspaso || ''}
                                    onChange={handleChange}
                                    placeholder="Ej. Se compró los ataches, laboratorio no cobra / Falla técnica..."
                                    rows={2}
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-amber-300 dark:border-amber-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder-gray-400"
                                />
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl flex justify-end gap-6 items-center border border-gray-100 dark:border-gray-700">
                        <div className="text-right">
                            <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">P. Unitario</span>
                            <span className="text-base font-bold text-gray-800 dark:text-gray-200">Bs {formatCurrency(formData.precio_unitario)}</span>
                        </div>
                        <div className="text-right">
                            <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Total</span>
                            <span className="text-xl font-extrabold text-green-600 dark:text-green-400">Bs {formatCurrency(formData.total)}</span>
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
