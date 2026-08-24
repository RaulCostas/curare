import React, { useState, useEffect } from 'react';
import api from '../services/api';
import type { RepuestoItem } from '../types';
import Swal from 'sweetalert2';
import ManualModal, { type ManualSection } from './ManualModal';
import { Calendar, Wrench, FileText, DollarSign, Home } from 'lucide-react';
import { getLocalDateString } from '../utils/dateUtils';

interface MantenimientoConsultorioFormProps {
    isOpen: boolean;
    onClose: () => void;
    id?: number | null;
    onSaveSuccess: () => void;
}

const MantenimientoConsultorioForm: React.FC<MantenimientoConsultorioFormProps> = ({ isOpen, onClose, id, onSaveSuccess }) => {
    const isEditing = Boolean(id);

    const [formData, setFormData] = useState({
        fecha: getLocalDateString(),
        consultorio: '',
        descripcion: '',
        motivo: '',
        observaciones: '',
        costo: '',
        manoObra: ''
    });

    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Mantenimiento de Consultorios & Repuestos',
            content: 'Complete la fecha, el consultorio asignado (ej. Consultorio 1, 2, Esterilización, etc.), la descripción del repuesto o mantenimiento, motivo, observaciones, costo de piezas y mano de obra.'
        }
    ];

    useEffect(() => {
        if (!isOpen) return;

        if (isEditing && id) {
            fetchRepuesto(id);
        } else {
            setFormData({
                fecha: getLocalDateString(),
                consultorio: '',
                descripcion: '',
                motivo: '',
                observaciones: '',
                costo: '',
                manoObra: ''
            });
        }
    }, [isOpen, id, isEditing]);

    const fetchRepuesto = async (repuestoId: number) => {
        try {
            const response = await api.get(`/repuesto/${repuestoId}`);
            const data: RepuestoItem = response.data;
            setFormData({
                fecha: data.fecha ? getLocalDateString(data.fecha) : getLocalDateString(),
                consultorio: data.consultorio || '',
                descripcion: data.descripcion || '',
                motivo: data.motivo || '',
                observaciones: data.observaciones || '',
                costo: data.costo !== undefined ? String(data.costo) : '',
                manoObra: data.manoObra !== undefined ? String(data.manoObra) : ''
            });
        } catch (error) {
            console.error('Error fetching repuesto:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.descripcion.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Atención',
                text: 'El campo Descripción es obligatorio',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
            return;
        }

        const costoNum = formData.costo ? parseFloat(formData.costo) : 0;
        const manoObraNum = formData.manoObra ? parseFloat(formData.manoObra) : 0;

        const payload = {
            fecha: formData.fecha,
            consultorio: formData.consultorio.trim(),
            descripcion: formData.descripcion.trim(),
            motivo: formData.motivo.trim(),
            observaciones: formData.observaciones.trim(),
            costo: isNaN(costoNum) ? 0 : costoNum,
            manoObra: isNaN(manoObraNum) ? 0 : manoObraNum
        };

        try {
            if (isEditing && id) {
                await api.patch(`/repuesto/${id}`, payload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Mantenimiento Actualizado',
                    timer: 1500,
                    showConfirmButton: false,
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
            } else {
                await api.post('/repuesto', payload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Mantenimiento Registrado',
                    timer: 1500,
                    showConfirmButton: false,
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
            }
            onSaveSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving repuesto:', error);
            const msg = error.response?.data?.message || 'No se pudo guardar el mantenimiento';
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: Array.isArray(msg) ? msg.join(', ') : msg,
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000] p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-[640px] max-w-[95%] max-h-[90vh] overflow-y-auto shadow-2xl text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-700 pb-3">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <span className="p-2.5 bg-green-100 dark:bg-green-900/60 rounded-xl text-green-600 dark:text-green-300 shadow-sm">
                            <Wrench className="h-6 w-6" />
                        </span>
                        {isEditing ? 'Editar Mantenimiento' : 'Nuevo Mantenimiento / Repuesto'}
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

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Fecha y Consultorio */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                        <div>
                            <label className="block mb-1 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Consultorio / Área:</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Home size={18} />
                                </div>
                                <input
                                    type="text"
                                    name="consultorio"
                                    value={formData.consultorio}
                                    onChange={handleChange}
                                    placeholder="Ej: Consultorio 1 / Esterilización"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block mb-1 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descripción del Trabajo / Repuesto:</label>
                        <div className="relative">
                            <div className="absolute top-3 left-3 flex items-center pointer-events-none text-gray-400">
                                <FileText size={18} />
                            </div>
                            <textarea
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={handleChange}
                                rows={2}
                                required
                                placeholder="Ej: Cambio de filtro de agua destilador Cristofoli..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm resize-none"
                            />
                        </div>
                    </div>

                    {/* Motivo */}
                    <div>
                        <label className="block mb-1 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Motivo:</label>
                        <div className="relative">
                            <div className="absolute top-3 left-3 flex items-center pointer-events-none text-gray-400">
                                <Wrench size={18} />
                            </div>
                            <textarea
                                name="motivo"
                                value={formData.motivo}
                                onChange={handleChange}
                                rows={2}
                                placeholder="Ej: Filtro sucio / Mantenimiento preventivo anual..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm resize-none"
                            />
                        </div>
                    </div>

                    {/* Observaciones */}
                    <div>
                        <label className="block mb-1 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Observaciones / Proveedor:</label>
                        <div className="relative">
                            <div className="absolute top-3 left-3 flex items-center pointer-events-none text-gray-400">
                                <FileText size={18} />
                            </div>
                            <textarea
                                name="observaciones"
                                value={formData.observaciones}
                                onChange={handleChange}
                                rows={2}
                                placeholder="Ej: Proveedor Gedesa S.A. - Factura #11..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm resize-none"
                            />
                        </div>
                    </div>

                    {/* Costo y Mano de Obra */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Costo Repuesto / Piezas (Bs):</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <DollarSign size={18} />
                                </div>
                                <input
                                    type="number"
                                    step="any"
                                    name="costo"
                                    value={formData.costo}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mano de Obra (Bs):</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <DollarSign size={18} />
                                </div>
                                <input
                                    type="number"
                                    step="any"
                                    name="manoObra"
                                    value={formData.manoObra}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-start items-center gap-3 mt-6">
                        <button
                            type="submit"
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm flex items-center gap-2 cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                <polyline points="7 3 7 8 15 8"></polyline>
                            </svg>
                            <span>{isEditing ? 'Actualizar' : 'Guardar'}</span>
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
                title="Manual de Usuario - Mantenimiento de Consultorios"
                sections={manualSections}
            />
        </div>
    );
};

export default MantenimientoConsultorioForm;
