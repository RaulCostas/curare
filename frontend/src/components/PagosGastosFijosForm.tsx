import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import type { GastoFijo, PagoGastoFijo, FormaPago } from '../types';
import FormaPagoForm from './FormaPagoForm';
import { getLocalDateString } from '../utils/dateUtils';

interface PagosGastosFijosFormProps {
    gastoFijo: GastoFijo;
    existingPayment?: PagoGastoFijo | null;
    onClose: () => void;
    onSave: () => void;
}

const PagosGastosFijosForm: React.FC<PagosGastosFijosFormProps> = ({ gastoFijo, existingPayment, onClose, onSave }) => {
    const [fecha, setFecha] = useState(getLocalDateString());
    const [monto, setMonto] = useState<number | string>(gastoFijo.monto);
    const [moneda, setMoneda] = useState(gastoFijo.moneda);
    const [formaPagoId, setFormaPagoId] = useState<number | ''>('');
    const [formasPago, setFormasPago] = useState<FormaPago[]>([]);
    const [observaciones, setObservaciones] = useState('');
    const [isFormaPagoModalOpen, setIsFormaPagoModalOpen] = useState(false);

    useEffect(() => {
        fetchFormasPago();
    }, []);

    const fetchFormasPago = async () => {
        try {
            const response = await api.get('/forma-pago?limit=100');
            if (response.data && response.data.data) {
                const activeFormasPago = (response.data.data || []).filter((fp: any) => !fp.estado || fp.estado.toLowerCase() === 'activo');
                setFormasPago(activeFormasPago);
            } else if (Array.isArray(response.data)) {
                const activeFormasPago = response.data.filter((fp: any) => !fp.estado || fp.estado.toLowerCase() === 'activo');
                setFormasPago(activeFormasPago);
            }
        } catch (err) {
            console.error('Error fetching formas de pago:', err);
        }
    };

    const handleFormaPagoSuccess = async () => {
        try {
            const response = await api.get('/forma-pago?limit=100');
            const data = response.data.data || response.data || [];
            const activeFormasPago = data.filter((fp: any) => !fp.estado || fp.estado.toLowerCase() === 'activo');
            setFormasPago(activeFormasPago);
            if (activeFormasPago.length > 0) {
                const last = activeFormasPago[activeFormasPago.length - 1];
                setFormaPagoId(last.id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (existingPayment) {
            setFecha(existingPayment.fecha);
            setMonto(existingPayment.monto);
            setMoneda(existingPayment.moneda);
            if (existingPayment.formaPagoId) {
                setFormaPagoId(existingPayment.formaPagoId);
            } else if (existingPayment.formaPago && typeof existingPayment.formaPago === 'object') {
                // @ts-ignore
                setFormaPagoId(existingPayment.formaPago.id);
            }
            setObservaciones(existingPayment.observaciones || '');
        }
    }, [existingPayment]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const parsedMonto = parseFloat(String(monto).replace(',', '.'));
        const data = {
            gastoFijoId: gastoFijo.id,
            fecha,
            monto: isNaN(parsedMonto) ? 0 : parsedMonto,
            moneda,
            formaPagoId,
            observaciones
        };

        try {
            if (existingPayment) {
                await api.patch(`/pagos-gastos-fijos/${existingPayment.id}`, data);
            } else {
                await api.post('/pagos-gastos-fijos', data);
            }

            await Swal.fire({
                icon: 'success',
                title: existingPayment ? 'Pago Actualizado' : 'Pago Registrado',
                text: existingPayment ? 'Pago actualizado exitosamente' : 'Pago registrado exitosamente',
                timer: 1500,
                showConfirmButton: false
            });

            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving payment:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al guardar el pago. Por favor intente nuevamente.'
            });
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 relative border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-700 pb-3">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                    <span className="p-2.5 bg-blue-100 dark:bg-blue-900/60 rounded-xl text-blue-600 dark:text-blue-300 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </span>
                    <div>
                        <div className="text-lg font-extrabold text-gray-800 dark:text-white">
                            {existingPayment ? 'Editar Pago de Gasto Fijo' : 'Registrar Pago de Gasto Fijo'}
                        </div>
                        <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5 flex items-center gap-1.5">
                            <span className="bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                                {gastoFijo.gasto_fijo} ({gastoFijo.destino})
                            </span>
                        </div>
                    </div>
                </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Fecha</label>
                    <div style={{ position: 'relative' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <input
                            type="date"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3498db] transition duration-200 text-gray-900 bg-white dark:text-white dark:bg-gray-700 font-medium"
                            style={{ paddingLeft: '35px' }}
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Monto</label>
                        <div style={{ position: 'relative' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                <line x1="12" y1="1" x2="12" y2="23"></line>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={monto}
                                onChange={(e) => setMonto(e.target.value)}
                                placeholder="Ej: 120.00 o 120,00"
                                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3498db] transition duration-200 text-gray-900 bg-white dark:text-white dark:bg-gray-700 font-medium"
                                style={{ paddingLeft: '35px' }}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Moneda</label>
                        <div style={{ position: 'relative' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                <line x1="12" y1="1" x2="12" y2="23"></line>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                            <select
                                value={moneda}
                                onChange={(e) => setMoneda(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3498db] transition duration-200 text-gray-900 bg-white dark:text-white dark:bg-gray-700 font-medium cursor-pointer"
                                style={{ paddingLeft: '35px' }}
                            >
                                <option value="Bolivianos">Bolivianos</option>
                                <option value="Dólares">Dólares</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Forma de Pago</label>
                    <div className="flex gap-2">
                        <div className="relative flex-grow">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                <line x1="1" y1="10" x2="23" y2="10"></line>
                            </svg>
                            <select
                                value={formaPagoId}
                                onChange={(e) => setFormaPagoId(Number(e.target.value))}
                                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3498db] transition duration-200 text-gray-900 bg-white dark:text-white dark:bg-gray-700 font-medium cursor-pointer"
                                style={{ paddingLeft: '35px' }}
                                required
                            >
                                <option value="">Seleccione una forma de pago</option>
                                {formasPago.map((fp) => (
                                    <option key={fp.id} value={fp.id}>
                                        {fp.forma_pago}
                                    </option>
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

                <div>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Observaciones</label>
                    <div style={{ position: 'relative' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '10px', top: '15px', pointerEvents: 'none' }}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        <textarea
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            placeholder="Ej: Pago correspondiente a este mes..."
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3498db] transition duration-200 text-gray-900 bg-white dark:text-white dark:bg-gray-700 font-medium"
                            rows={3}
                            style={{ paddingLeft: '35px' }}
                        />
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
                        <span>{existingPayment ? 'Guardar Cambios' : 'Pagar'}</span>
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
            <FormaPagoForm
                isOpen={isFormaPagoModalOpen}
                onClose={() => setIsFormaPagoModalOpen(false)}
                onSaveSuccess={handleFormaPagoSuccess}
            />
        </div>
    );
};

export default PagosGastosFijosForm;
