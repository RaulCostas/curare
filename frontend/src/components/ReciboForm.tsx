import React, { useState, useEffect } from 'react';
import api from '../services/api';
import type { ReciboItem } from '../types';
import Swal from 'sweetalert2';
import ManualModal, { type ManualSection } from './ManualModal';
import { Calendar, User, FileText, DollarSign, CreditCard } from 'lucide-react';
import { getLocalDateString } from '../utils/dateUtils';

interface ReciboFormProps {
    isOpen: boolean;
    onClose: () => void;
    id?: number | null;
    onSaveSuccess: () => void;
}

const ReciboForm: React.FC<ReciboFormProps> = ({ isOpen, onClose, id, onSaveSuccess }) => {
    const isEditing = Boolean(id);

    const [formData, setFormData] = useState({
        fecha: getLocalDateString(),
        nombre: '',
        concepto: '',
        moneda: 'BOLIVIANOS',
        monto: ''
    });

    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Crear / Editar Recibo',
            content: 'Complete la fecha, el nombre del beneficiario o pagador, el concepto de la transacción, la moneda (Bolivianos o Dólares) y el monto total.'
        }
    ];

    useEffect(() => {
        if (!isOpen) return;

        if (isEditing && id) {
            fetchRecibo(id);
        } else {
            setFormData({
                fecha: getLocalDateString(),
                nombre: '',
                concepto: '',
                moneda: 'BOLIVIANOS',
                monto: ''
            });
        }
    }, [isOpen, id, isEditing]);

    const fetchRecibo = async (reciboId: number) => {
        try {
            const response = await api.get(`/recibo/${reciboId}`);
            const data: ReciboItem = response.data;
            setFormData({
                fecha: data.fecha ? getLocalDateString(data.fecha) : getLocalDateString(),
                nombre: data.nombre || '',
                concepto: data.concepto || '',
                moneda: data.moneda || 'BOLIVIANOS',
                monto: data.monto ? String(data.monto) : ''
            });
        } catch (error) {
            console.error('Error fetching recibo:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nombre.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Atención',
                text: 'El campo Nombre es obligatorio',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
            return;
        }

        const montoNum = parseFloat(formData.monto);
        if (isNaN(montoNum) || montoNum < 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Atención',
                text: 'Ingrese un monto válido',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
            return;
        }

        const payload = {
            fecha: formData.fecha,
            nombre: formData.nombre.trim(),
            concepto: formData.concepto.trim(),
            moneda: formData.moneda,
            monto: montoNum
        };

        try {
            if (isEditing && id) {
                await api.patch(`/recibo/${id}`, payload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Recibo Actualizado',
                    timer: 1500,
                    showConfirmButton: false,
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
            } else {
                await api.post('/recibo', payload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Recibo Creado',
                    timer: 1500,
                    showConfirmButton: false,
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
            }
            onSaveSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving recibo:', error);
            const msg = error.response?.data?.message || 'No se pudo guardar el recibo';
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
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-[580px] max-w-[95%] max-h-[90vh] overflow-y-auto shadow-2xl text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-700 pb-3">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <span className="p-2.5 bg-blue-100 dark:bg-blue-900/60 rounded-xl text-blue-600 dark:text-blue-300 shadow-sm">
                            <FileText className="h-6 w-6" />
                        </span>
                        {isEditing ? 'Editar Recibo' : 'Nuevo Recibo'}
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
                    {/* Fecha */}
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

                    {/* Nombre */}
                    <div>
                        <label className="block mb-1 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre / Entregado a:</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <User size={18} />
                            </div>
                            <input
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                required
                                placeholder="Ej: Juan Pérez"
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Concepto */}
                    <div>
                        <label className="block mb-1 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Concepto:</label>
                        <div className="relative">
                            <div className="absolute top-3 left-3 flex items-center pointer-events-none text-gray-400">
                                <FileText size={18} />
                            </div>
                            <textarea
                                name="concepto"
                                value={formData.concepto}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Detalle el motivo o concepto del recibo..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm resize-none"
                            />
                        </div>
                    </div>

                    {/* Moneda y Monto */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Moneda:</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <CreditCard size={18} />
                                </div>
                                <select
                                    name="moneda"
                                    value={formData.moneda}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                                >
                                    <option value="BOLIVIANOS">BOLIVIANOS (Bs)</option>
                                    <option value="DOLARES">DÓLARES ($us)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Monto:</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <DollarSign size={18} />
                                </div>
                                <input
                                    type="number"
                                    step="any"
                                    name="monto"
                                    value={formData.monto}
                                    onChange={handleChange}
                                    required
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
                title="Manual de Usuario - Recibos"
                sections={manualSections}
            />
        </div>
    );
};

export default ReciboForm;
