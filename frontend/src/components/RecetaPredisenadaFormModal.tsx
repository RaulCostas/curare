import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';
import type { Especialidad, RecetaPredisenada, RecetaPredisenadaDetalle } from '../types';
import { FileText, Plus, Stethoscope, Pill } from 'lucide-react';

interface RecetaPredisenadaFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    id?: number | null;
    onSaveSuccess: () => void;
}

const RecetaPredisenadaFormModal: React.FC<RecetaPredisenadaFormModalProps> = ({
    isOpen,
    onClose,
    id,
    onSaveSuccess
}) => {
    const isEditing = Boolean(id);

    const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState<{
        nombre: string;
        especialidadId: number;
        diagnostico: string;
        indicaciones: string;
        estado: 'activo' | 'inactivo';
        detalles: RecetaPredisenadaDetalle[];
    }>({
        nombre: '',
        especialidadId: 0,
        diagnostico: '',
        indicaciones: '',
        estado: 'activo',
        detalles: [{ medicamento: '', cantidad: '', indicacion: '' }]
    });

    useEffect(() => {
        if (!isOpen) return;

        fetchEspecialidades();

        if (id) {
            loadTemplate(id);
        } else {
            resetForm();
        }
    }, [isOpen, id]);

    const fetchEspecialidades = async () => {
        try {
            const res = await api.get('/especialidad?limit=1000');
            const data = res.data.data || res.data || [];
            const activeOnly = data.filter((e: Especialidad) => e.estado === 'activo');
            setEspecialidades(activeOnly);
        } catch (error) {
            console.error('Error fetching especialidades:', error);
        }
    };

    const loadTemplate = async (templateId: number) => {
        setLoading(true);
        try {
            const res = await api.get(`/recetas-predisenadas/${templateId}`);
            const template = res.data;
            if (template) {
                setFormData({
                    nombre: template.nombre || '',
                    especialidadId: template.especialidadId || 0,
                    diagnostico: template.diagnostico || '',
                    indicaciones: template.indicaciones || '',
                    estado: template.estado || 'activo',
                    detalles: template.detalles && template.detalles.length > 0
                        ? template.detalles
                        : [{ medicamento: '', cantidad: '', indicacion: '' }]
                });
            }
        } catch (error) {
            console.error('Error loading template:', error);
            Swal.fire('Error', 'No se pudo cargar la receta pre-diseñada', 'error');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            nombre: '',
            especialidadId: 0,
            diagnostico: '',
            indicaciones: '',
            estado: 'activo',
            detalles: [{ medicamento: '', cantidad: '', indicacion: '' }]
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'especialidadId' ? Number(value) : value
        }));
    };

    const handleDetalleChange = (index: number, field: keyof RecetaPredisenadaDetalle, value: string) => {
        setFormData(prev => {
            const newDetalles = [...prev.detalles];
            newDetalles[index] = { ...newDetalles[index], [field]: value };
            return { ...prev, detalles: newDetalles };
        });
    };

    const addDetalle = () => {
        setFormData(prev => ({
            ...prev,
            detalles: [...prev.detalles, { medicamento: '', cantidad: '', indicacion: '' }]
        }));
    };

    const removeDetalle = (index: number) => {
        if (formData.detalles.length <= 1) {
            Swal.fire('Atención', 'Debe haber al menos un medicamento en la plantilla', 'info');
            return;
        }
        setFormData(prev => ({
            ...prev,
            detalles: prev.detalles.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nombre.trim()) {
            Swal.fire('Atención', 'Ingrese el nombre de la receta pre-diseñada', 'warning');
            return;
        }

        if (!formData.especialidadId) {
            Swal.fire('Atención', 'Seleccione una especialidad', 'warning');
            return;
        }

        const validDetalles = formData.detalles.filter(d => d.medicamento.trim() !== '');
        if (validDetalles.length === 0) {
            Swal.fire('Atención', 'Agregue al menos un medicamento válido con su nombre', 'warning');
            return;
        }

        const payload: Partial<RecetaPredisenada> = {
            nombre: formData.nombre.trim(),
            especialidadId: formData.especialidadId,
            diagnostico: formData.diagnostico.trim(),
            indicaciones: formData.indicaciones.trim(),
            estado: formData.estado,
            detalles: validDetalles
        };

        setSubmitting(true);
        try {
            if (id) {
                await api.patch(`/recetas-predisenadas/${id}`, payload);
                await Swal.fire({
                    icon: 'success',
                    title: '¡Receta Pre-Diseñada Actualizada!',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                await api.post('/recetas-predisenadas', payload);
                await Swal.fire({
                    icon: 'success',
                    title: '¡Receta Pre-Diseñada Creada!',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
            onSaveSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving template:', error);
            Swal.fire('Error', 'No se pudo guardar la receta pre-diseñada', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 transition-opacity">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Modal Header (Sin botón X) */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <span className="p-2 bg-[#3498db]/10 rounded-xl text-[#3498db]">
                            <FileText size={20} />
                        </span>
                        {isEditing ? 'Editar Receta Pre-Diseñada' : 'Nueva Receta Pre-Diseñada'}
                    </h2>
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

                {/* Modal Body */}
                <div className="p-5 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <form id="recetaPredisenadaForm" onSubmit={handleSubmit} className="space-y-4">
                            {/* Grid 1: Name & Specialty */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Nombre de la Receta: <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <FileText size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        <input
                                            type="text"
                                            name="nombre"
                                            value={formData.nombre}
                                            onChange={handleChange}
                                            placeholder="Ej: Post-Extracción Dental, Endodoncia Aguda..."
                                            required
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition duration-200"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Especialidad: <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Stethoscope size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        <select
                                            name="especialidadId"
                                            value={formData.especialidadId}
                                            onChange={handleChange}
                                            required
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition duration-200"
                                        >
                                            <option value="">-- Seleccionar Especialidad --</option>
                                            {especialidades.map(e => (
                                                <option key={e.id} value={e.id}>
                                                    {e.especialidad}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Diagnosis & State */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Diagnóstico Sugerido (Opcional):
                                    </label>
                                    <div className="relative">
                                        <Stethoscope size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        <input
                                            type="text"
                                            name="diagnostico"
                                            value={formData.diagnostico}
                                            onChange={handleChange}
                                            placeholder="Ej: Extracción dental simple / Quirúrgica"
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition duration-200"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Estado:
                                    </label>
                                    <select
                                        name="estado"
                                        value={formData.estado}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition duration-200"
                                    >
                                        <option value="activo">Activo</option>
                                        <option value="inactivo">Inactivo</option>
                                    </select>
                                </div>
                            </div>

                            {/* Indications */}
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Indicaciones Generales (Opcional):
                                </label>
                                <div className="relative">
                                    <FileText size={18} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
                                    <textarea
                                        name="indicaciones"
                                        value={formData.indicaciones}
                                        onChange={handleChange}
                                        rows={2}
                                        placeholder="Ej: Mantener gasa por 45 minutos. No usar sorbete ni escupir..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition duration-200"
                                    />
                                </div>
                            </div>

                            {/* Details Table */}
                            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-bold text-base text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <Pill size={18} className="text-blue-500" />
                                        Detalle de Medicamentos
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={addDetalle}
                                        className="p-1 bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 text-green-600 dark:text-green-400 rounded-full transition-all transform hover:-translate-y-0.5 shadow-sm flex items-center gap-1 px-2.5 py-1 text-xs font-semibold"
                                        title="Agregar Medicamento"
                                    >
                                        <Plus size={16} />
                                        <span>Agregar Medicamento</span>
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs">
                                            <tr>
                                                <th className="px-3 py-2 text-left font-medium uppercase tracking-wider">Medicamento</th>
                                                <th className="px-3 py-2 text-left font-medium uppercase tracking-wider w-36">Cantidad</th>
                                                <th className="px-3 py-2 text-left font-medium uppercase tracking-wider">Indicación Específica</th>
                                                <th className="px-3 py-2 text-center w-10">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {formData.detalles.map((det, index) => (
                                                <tr key={index}>
                                                    <td className="p-2 align-top">
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                                                </svg>
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={det.medicamento}
                                                                onChange={(e) => handleDetalleChange(index, 'medicamento', e.target.value)}
                                                                placeholder="Nombre medicamento"
                                                                required
                                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition duration-200"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="p-2 align-top">
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                                                </svg>
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={det.cantidad}
                                                                onChange={(e) => handleDetalleChange(index, 'cantidad', e.target.value)}
                                                                placeholder="Ej: 1 caja (21 tab)"
                                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition duration-200"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="p-2 align-top">
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={det.indicacion}
                                                                onChange={(e) => handleDetalleChange(index, 'indicacion', e.target.value)}
                                                                placeholder="Ej: Tomar 1 tableta c/8 horas"
                                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition duration-200"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="p-2 text-center align-middle">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeDetalle(index)}
                                                            className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-all transform hover:-translate-y-0.5 shadow-sm"
                                                            disabled={formData.detalles.length === 1 && index === 0}
                                                            title="Eliminar fila"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
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
                        </form>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-start gap-3 rounded-b-xl">
                    <button
                        type="submit"
                        form="recetaPredisenadaForm"
                        disabled={submitting}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-xl flex items-center gap-2 transform hover:-translate-y-0.5 transition-all shadow-md disabled:opacity-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        {submitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar')}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecetaPredisenadaFormModal;
