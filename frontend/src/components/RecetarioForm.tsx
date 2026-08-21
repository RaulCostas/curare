import React, { useState, useEffect } from 'react';
import api from '../services/api';
import type { RecetaDetalle, Doctor, RecetaPredisenada } from '../types';
import Swal from 'sweetalert2';
import ManualModal, { type ManualSection } from './ManualModal';
import { Calendar, Pill, Hash, FileText, MessageSquare, User as UserIcon, X, BookmarkCheck } from 'lucide-react';
import { getLocalDateString } from '../utils/dateUtils';
import { formatPaternoMaternoNombre } from '../utils/formatters';

interface FormData {
    pacienteId: number;
    doctorId: number | '';
    userId: number;
    fecha: string;
    diagnostico: string;
    indicaciones: string;
    detalles: RecetaDetalle[];
}

interface RecetarioFormProps {
    isOpen: boolean;
    onClose: () => void;
    id?: number | null;
    pacienteId?: number;
    onSaveSuccess: () => void;
}

const RecetarioForm: React.FC<RecetarioFormProps> = ({ isOpen, onClose, id, pacienteId, onSaveSuccess }) => {
    const isEditing = Boolean(id);

    const [formData, setFormData] = useState<FormData>({
        pacienteId: pacienteId || 0,
        doctorId: '',
        userId: 0,
        fecha: getLocalDateString(),
        diagnostico: '',
        indicaciones: '',
        detalles: [{
            id: 0,
            recetaId: 0,
            medicamento: '',
            cantidad: '',
            indicacion: ''
        }]
    });

    const [doctores, setDoctores] = useState<Doctor[]>([]);
    const [predisenadas, setPredisenadas] = useState<RecetaPredisenada[]>([]);
    const [selectedPredisenadaId, setSelectedPredisenadaId] = useState<number | ''>('');
    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Crear/Editar Receta Médica',
            content: 'Complete la fecha, doctor a cargo, diagnóstico del paciente, los medicamentos prescritos en la tabla y las indicaciones generales. Al guardar, la receta quedará registrada en el historial del paciente.'
        },
        {
            title: 'Agregar Medicamentos',
            content: 'Use el botón "+ Agregar Medicamento" para añadir múltiples fármacos a la misma prescripción médica.'
        }
    ];

    useEffect(() => {
        if (!isOpen) return;

        fetchDoctores();
        fetchPredisenadas();

        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.id) {
                    setFormData(prev => ({ ...prev, userId: user.id }));
                }
            } catch (e) {
                console.error("Error parsing user", e);
            }
        }

        if (isEditing && id) {
            fetchReceta(id);
        } else {
            setFormData({
                pacienteId: pacienteId || 0,
                doctorId: '',
                userId: 0,
                fecha: getLocalDateString(),
                diagnostico: '',
                indicaciones: '',
                detalles: [{
                    id: 0,
                    recetaId: 0,
                    medicamento: '',
                    cantidad: '',
                    indicacion: ''
                }]
            });
        }
    }, [isOpen, id, isEditing, pacienteId]);

    const fetchDoctores = async () => {
        try {
            const response = await api.get('/doctors?limit=1000');
            const list = Array.isArray(response.data) ? response.data : (response.data?.data || []);
            setDoctores(list);
        } catch (e) {
            console.error('Error fetching doctores:', e);
        }
    };

    const fetchPredisenadas = async () => {
        try {
            const res = await api.get<RecetaPredisenada[]>('/recetas-predisenadas?estado=activo');
            setPredisenadas(res.data || []);
        } catch (e) {
            console.error('Error fetching recetas predisenadas:', e);
        }
    };

    const handleApplyPredisenada = (tmplId: number | '') => {
        setSelectedPredisenadaId(tmplId);
        if (!tmplId) return;

        const found = predisenadas.find(p => p.id === tmplId);
        if (!found) return;

        setFormData(prev => ({
            ...prev,
            diagnostico: found.diagnostico || prev.diagnostico || '',
            indicaciones: found.indicaciones || prev.indicaciones || '',
            detalles: (found as any).detalles && (found as any).detalles.length > 0
                ? (found as any).detalles.map((d: any) => ({
                    id: 0,
                    recetaId: 0,
                    medicamento: d.medicamento || '',
                    cantidad: d.cantidad || '',
                    indicacion: d.indicacion || ''
                }))
                : prev.detalles
        }));
    };

    const fetchReceta = async (recetaId: number) => {
        try {
            const response = await api.get(`/receta/${recetaId}`);
            const data = response.data;
            setFormData({
                pacienteId: data.pacienteId || pacienteId || 0,
                doctorId: data.doctorId || data.doctor?.id || '',
                userId: data.userId || 0,
                fecha: data.fecha ? getLocalDateString(data.fecha) : getLocalDateString(),
                diagnostico: data.diagnostico || data.medicamentos || '',
                indicaciones: data.indicaciones || '',
                detalles: data.detalles || []
            });
            if (!data.detalles || data.detalles.length === 0) {
                addDetalle();
            }
        } catch (error) {
            console.error('Error fetching receta:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: (name === 'pacienteId' || name === 'doctorId') ? (value ? Number(value) : '') : value
        }));
    };

    const addDetalle = () => {
        setFormData(prev => ({
            ...prev,
            detalles: [...prev.detalles, {
                id: 0,
                recetaId: 0,
                medicamento: '',
                cantidad: '',
                indicacion: ''
            }]
        }));
    };

    const removeDetalle = (index: number) => {
        setFormData(prev => ({
            ...prev,
            detalles: prev.detalles.filter((_, i) => i !== index)
        }));
    };

    const handleDetalleChange = (index: number, field: keyof RecetaDetalle, value: string) => {
        setFormData(prev => {
            const newDetalles = [...prev.detalles];
            newDetalles[index] = { ...newDetalles[index], [field]: value };
            return { ...prev, detalles: newDetalles };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const activePacienteId = pacienteId || formData.pacienteId;

        if (!activePacienteId) {
            Swal.fire({
                icon: 'warning',
                title: 'Atención',
                text: 'No se ha detectado el paciente',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
            return;
        }

        const userStr = localStorage.getItem('user');
        const currentUser = userStr ? JSON.parse(userStr) : null;
        const validUserId = currentUser?.id || undefined;

        const validDetalles = formData.detalles
            .filter(d => d.medicamento.trim() !== '')
            .map(d => ({
                medicamento: d.medicamento,
                cantidad: d.cantidad || '',
                indicacion: d.indicacion || ''
            }));

        const payload: any = {
            pacienteId: activePacienteId,
            doctorId: formData.doctorId ? Number(formData.doctorId) : null,
            fecha: formData.fecha,
            diagnostico: formData.diagnostico || '',
            indicaciones: formData.indicaciones || '',
            detalles: validDetalles
        };

        if (validUserId) {
            payload.userId = validUserId;
        }

        try {
            if (isEditing && id) {
                await api.patch(`/receta/${id}`, payload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Receta Actualizada',
                    timer: 1500,
                    showConfirmButton: false,
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
            } else {
                await api.post('/receta', payload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Receta Creada',
                    timer: 1500,
                    showConfirmButton: false,
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
            }
            onSaveSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving receta:', error);
            const errorMessage = error.response?.data?.message || 'No se pudo guardar la receta';
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage,
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="fixed inset-0 bg-black/50 transition-opacity duration-300 opacity-100" onClick={onClose} />
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-4xl bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-0 flex flex-col">
                
                {/* Header del Modal */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <span className="p-2.5 bg-blue-100 dark:bg-blue-900/60 rounded-xl text-blue-600 dark:text-blue-300 shadow-sm">
                            <Pill className="h-6 w-6" />
                        </span>
                        {isEditing ? 'Editar Receta Médica' : 'Nueva Receta Médica'}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowManual(true)}
                            className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[34px] h-[34px] text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all transform hover:-translate-y-0.5 active:scale-95 shadow-sm cursor-pointer"
                            title="Ayuda / Manual"
                        >
                            ?
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col justify-between space-y-6">
                    <div className="space-y-6">
                        
                        {/* Cargar Receta Prediseñada */}
                        {!isEditing && (
                            <div className="bg-teal-50/70 dark:bg-teal-900/30 p-4 rounded-xl border border-teal-200 dark:border-teal-800">
                                <label className="block mb-1.5 font-bold text-xs text-teal-800 dark:text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                                    <BookmarkCheck size={16} /> Cargar Receta Prediseñada (Opcional):
                                </label>
                                <select
                                    value={selectedPredisenadaId}
                                    onChange={e => handleApplyPredisenada(e.target.value ? Number(e.target.value) : '')}
                                    disabled={predisenadas.length === 0}
                                    className="w-full px-4 py-2.5 rounded-xl border border-teal-300 dark:border-teal-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <option value="">
                                        {predisenadas.length > 0 
                                            ? "-- Seleccionar Receta Prediseñada para Autocompletar --" 
                                            : "-- No hay recetas prediseñadas disponibles --"}
                                    </option>
                                    {predisenadas.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.titulo || (p as any).nombre} {p.diagnostico ? `(${p.diagnostico})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* 1. Fecha y 2. Doctor */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* 1. Fecha */}
                            <div>
                                <label className="block mb-1 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha:</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Calendar size={18} />
                                    </div>
                                    <input
                                        type="date"
                                        name="fecha"
                                        value={formData.fecha}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            {/* 2. Doctor */}
                            <div>
                                <label className="block mb-1 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Doctor / Especialista:</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <UserIcon size={18} />
                                    </div>
                                    <select
                                        name="doctorId"
                                        value={formData.doctorId}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                                    >
                                        <option value="">-- Seleccionar Doctor --</option>
                                        {doctores.map(doc => (
                                            <option key={doc.id} value={doc.id}>
                                                {formatPaternoMaternoNombre(doc)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 3. Diagnóstico */}
                        <div>
                            <label className="block mb-1 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Diagnóstico:</label>
                            <div className="relative">
                                <div className="absolute top-3 left-3 flex items-center pointer-events-none text-gray-400">
                                    <FileText size={18} />
                                </div>
                                <textarea
                                    name="diagnostico"
                                    value={formData.diagnostico}
                                    onChange={handleChange}
                                    rows={2}
                                    placeholder="Ingrese el diagnóstico del paciente..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm resize-none"
                                />
                            </div>
                        </div>

                        {/* 4. Tabla de Medicamentos */}
                        <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-800/50 p-4 shadow-sm">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                    <Pill className="text-blue-500" size={18} />
                                    <span>Tabla de Medicamentos e Indicaciones</span>
                                </h3>
                                <button
                                    type="button"
                                    onClick={addDetalle}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                                >
                                    + Agregar Medicamento
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead className="bg-gray-100 dark:bg-gray-700/80 text-gray-600 dark:text-gray-300 uppercase">
                                        <tr>
                                            <th className="p-2.5 rounded-l-lg">Medicamento</th>
                                            <th className="p-2.5 w-36">Cantidad</th>
                                            <th className="p-2.5">Indicaciones</th>
                                            <th className="p-2.5 w-12 text-center rounded-r-lg">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {formData.detalles.map((detalle, index) => (
                                            <tr key={index}>
                                                <td className="p-2">
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
                                                            <Pill size={14} />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={detalle.medicamento}
                                                            onChange={(e) => handleDetalleChange(index, 'medicamento', e.target.value)}
                                                            placeholder="Ej: Amoxicilina 500mg"
                                                            className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="p-2">
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
                                                            <Hash size={14} />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={detalle.cantidad}
                                                            onChange={(e) => handleDetalleChange(index, 'cantidad', e.target.value)}
                                                            placeholder="Ej: 1 caja (20 cap)"
                                                            className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="p-2">
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
                                                            <FileText size={14} />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={detalle.indicacion}
                                                            onChange={(e) => handleDetalleChange(index, 'indicacion', e.target.value)}
                                                            placeholder="Ej: 1 tableta cada 8 horas por 7 días"
                                                            className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="p-2 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeDetalle(index)}
                                                        className="p-1.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 hover:bg-red-200 rounded-lg transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                                                        disabled={formData.detalles.length === 1 && index === 0}
                                                        title="Eliminar fila"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* 5. Indicaciones Generales / Notas Adicionales */}
                        <div>
                            <label className="block mb-1 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Indicaciones Generales / Recomendaciones:</label>
                            <div className="relative">
                                <div className="absolute top-3 left-3 flex items-center pointer-events-none text-gray-400">
                                    <MessageSquare size={18} />
                                </div>
                                <textarea
                                    name="indicaciones"
                                    value={formData.indicaciones}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Ingrese recomendaciones de cuidado o notas generales de la receta..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Botones Alineados al Costado Izquierdo */}
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-start gap-3 mt-6">
                        <button
                            type="submit"
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm flex items-center gap-2 cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                <polyline points="7 3 7 8 15 8"></polyline>
                            </svg>
                            {isEditing ? 'Actualizar Receta' : 'Guardar Receta'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm flex items-center gap-2 cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                            <span>Cancelar</span>
                        </button>
                    </div>
                </form>
            </div>
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Receta Médica"
                sections={manualSections}
            />
        </div>
    );
};

export default RecetarioForm;
