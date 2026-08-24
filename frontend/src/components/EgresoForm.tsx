import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import ManualModal, { type ManualSection } from './ManualModal';
import FormaPagoForm from './FormaPagoForm';
import { getLocalDateString } from '../utils/dateUtils';

interface EgresoFormProps {
    isOpen: boolean;
    onClose: () => void;
    id?: number | null;
    onSaveSuccess: () => void;
}

const EgresoForm: React.FC<EgresoFormProps> = ({ isOpen, onClose, id, onSaveSuccess }) => {
    const isEditing = Boolean(id);

    const [formData, setFormData] = useState({
        fecha: getLocalDateString(),
        destino: 'Consultorio',
        detalle: '',
        monto: '',
        moneda: 'Bolivianos',
        formaPagoId: ''
    });
    const [formasPago, setFormasPago] = useState<any[]>([]);
    const [showManual, setShowManual] = useState(false);
    const [isFormaPagoModalOpen, setIsFormaPagoModalOpen] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Registro de Egresos',
            content: 'Registre gastos generales de la clínica. Especifique destino (Consultorio/Casa), detalle, monto, moneda y forma de pago.'
        },
        {
            title: 'Destino y Moneda',
            content: 'Indique si el egreso es para Consultorio o Casa. Seleccione la moneda (Bolivianos/Dólares) para registro contable correcto.'
        }
    ];

    useEffect(() => {
        if (isOpen) {
            fetchFormasPago();
            if (isEditing && id) {
                api.get<any>(`/egresos/${id}`)
                    .then(response => {
                        const data = response.data;
                        const rawDestino = (data.destino || '').toString().trim().toUpperCase();
                        const normalizedDestino = rawDestino.includes('CASA') ? 'Casa' : 'Consultorio';
                        setFormData({
                            fecha: data.fecha ? getLocalDateString(data.fecha) : getLocalDateString(),
                            destino: normalizedDestino,
                            detalle: data.detalle || '',
                            monto: data.monto?.toString() || '',
                            moneda: data.moneda || 'Bolivianos',
                            formaPagoId: data.formaPago?.id?.toString() || data.formaPagoId?.toString() || ''
                        });
                    })
                    .catch(error => {
                        console.error('Error fetching egreso:', error);
                    });
            } else {
                setFormData({
                    fecha: getLocalDateString(),
                    destino: 'Consultorio',
                    detalle: '',
                    monto: '',
                    moneda: 'Bolivianos',
                    formaPagoId: ''
                });
            }
        }
    }, [isOpen, id, isEditing]);

    const fetchFormasPago = async () => {
        try {
            const response = await api.get('/forma-pago');
            const data = response.data.data || response.data || [];
            const activeFormasPago = data.filter((fp: any) => !fp.estado || fp.estado.toLowerCase() === 'activo');
            setFormasPago(activeFormasPago);
        } catch (error) {
            console.error('Error fetching formas de pago:', error);
        }
    };

    const handleFormaPagoSuccess = async () => {
        try {
            const response = await api.get('/forma-pago');
            const data = response.data.data || response.data || [];
            const activeFormasPago = data.filter((fp: any) => !fp.estado || fp.estado.toLowerCase() === 'activo');
            setFormasPago(activeFormasPago);
            if (activeFormasPago.length > 0) {
                const last = activeFormasPago[activeFormasPago.length - 1];
                setFormData(prev => ({ ...prev, formaPagoId: last.id.toString() }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const parsedMonto = parseFloat(String(formData.monto).replace(',', '.'));
            const payload = {
                ...formData,
                monto: isNaN(parsedMonto) ? 0 : parsedMonto,
                formaPagoId: parseInt(formData.formaPagoId)
            };

            if (isEditing) {
                await api.patch(`/egresos/${id}`, payload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Egreso Actualizado',
                    text: 'Egreso actualizado exitosamente',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                await api.post('/egresos', payload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Egreso Creado',
                    text: 'Egreso creado exitosamente',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
            onSaveSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving egreso:', error);
            const errorMessage = error.response?.data?.message || 'Error al guardar el egreso';
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000] p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-[600px] max-w-[95%] max-h-[90vh] overflow-y-auto shadow-2xl text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-700 pb-3">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <span className="p-2.5 bg-red-100 dark:bg-red-900/60 rounded-xl text-red-600 dark:text-red-300 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </span>
                        {isEditing ? 'Editar Egreso' : 'Nuevo Egreso'}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Fecha:</label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <input
                                    type="date"
                                    name="fecha"
                                    value={formData.fecha}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 font-medium"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Destino:</label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <select
                                    name="destino"
                                    value={formData.destino}
                                    onChange={handleChange}
                                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 font-medium cursor-pointer"
                                >
                                    <option value="Consultorio">Consultorio</option>
                                    <option value="Casa">Casa</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Detalle / Descripción del Egreso:</label>
                        <div className="relative">
                            <textarea
                                name="detalle"
                                value={formData.detalle}
                                onChange={handleChange}
                                required
                                rows={3}
                                placeholder="Ej: Compra de insumos de limpieza para consultorio..."
                                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 font-medium"
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Monto:</label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    name="monto"
                                    value={formData.monto}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ej: 120.50 o 120,50"
                                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 font-medium"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Moneda:</label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <select
                                    name="moneda"
                                    value={formData.moneda}
                                    onChange={handleChange}
                                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 font-medium cursor-pointer"
                                >
                                    <option value="Bolivianos">Bolivianos</option>
                                    <option value="Dólares">Dólares</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Forma de Pago:</label>
                        <div className="flex gap-2">
                            <div className="relative flex-grow">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <select
                                    name="formaPagoId"
                                    value={formData.formaPagoId}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 font-medium cursor-pointer"
                                >
                                    <option value="">Seleccione...</option>
                                    {formasPago.map(fp => (
                                        <option key={fp.id} value={fp.id}>{fp.forma_pago}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsFormaPagoModalOpen(true)}
                                className="px-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center cursor-pointer shrink-0"
                                title="Nueva Forma de Pago"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-start items-center gap-3 mt-6">
                        <button
                            type="submit"
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm flex items-center gap-2 cursor-pointer"
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
                            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2.5 px-5 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm flex items-center gap-2 cursor-pointer"
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
                title="Manual - Egresos"
                sections={manualSections}
            />
            <FormaPagoForm
                isOpen={isFormaPagoModalOpen}
                onClose={() => setIsFormaPagoModalOpen(false)}
                onSaveSuccess={handleFormaPagoSuccess}
            />
        </div>
    );
};

export default EgresoForm;
