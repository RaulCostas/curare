import React, { useState, useEffect } from 'react';
import api from '../services/api';
import type { Pedidos } from '../types';
import Swal from 'sweetalert2';
import ManualModal, { type ManualSection } from './ManualModal';
import FormaPagoForm from './FormaPagoForm';
import { getLocalDateString } from '../utils/dateUtils';

interface FormaPago {
    id: number;
    forma_pago: string;
}

interface PagosPedidosFormProps {
    isOpen: boolean;
    onClose: () => void;
    id?: number | null;
    initialPedidoId?: number | null;
    onSaveSuccess: () => void;
}

const PagosPedidosForm: React.FC<PagosPedidosFormProps> = ({ isOpen, onClose, id, initialPedidoId, onSaveSuccess }) => {
    const isEditMode = Boolean(id);

    const [pedidos, setPedidos] = useState<Pedidos[]>([]);
    const [formasPago, setFormasPago] = useState<FormaPago[]>([]);
    const [loading, setLoading] = useState(true);

    const [idPedido, setIdPedido] = useState('');
    const [fecha, setFecha] = useState(getLocalDateString());
    const [monto, setMonto] = useState('');
    const [factura, setFactura] = useState('');
    const [recibo, setRecibo] = useState('');
    const [formaPago, setFormaPago] = useState('');
    const [showManual, setShowManual] = useState(false);
    const [isFormaPagoModalOpen, setIsFormaPagoModalOpen] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Pagos de Pedidos',
            content: 'Registre pagos a proveedores por pedidos realizados. Seleccione el pedido pendiente y registre el monto, factura y forma de pago.'
        },
        {
            title: 'Factura y Recibo',
            content: 'Ingrese el número de factura del proveedor y el número de recibo interno para mantener un registro completo de la transacción.'
        },
        {
            title: 'Actualización Automática',
            content: 'Al registrar el pago, el sistema actualiza automáticamente el estado del pedido a "Pagado" y registra la fecha de pago.'
        }
    ];

    const fetchFormasPago = async () => {
        try {
            const formasRes = await api.get<any>('/forma-pago?limit=100');
            const list = formasRes.data.data || formasRes.data;
            setFormasPago(list);
            if (list.length > 0) {
                const latest = list[list.length - 1];
                setFormaPago(latest.forma_pago);
            }
        } catch (error) {
            console.error('Error fetching payment methods:', error);
        }
    };

    useEffect(() => {
        if (!isOpen) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [pedidosRes, formasRes] = await Promise.all([
                    api.get<Pedidos[]>('/pedidos'),
                    api.get<any>('/forma-pago?limit=100')
                ]);

                const allPedidos = pedidosRes.data;
                const formasList = formasRes.data.data || formasRes.data;
                setFormasPago(formasList);

                if (isEditMode && id) {
                    const response = await api.get(`/pagos-pedidos/${id}`);
                    const pago = response.data;
                    setIdPedido(String(pago.idPedido || pago.pedido?.id || ''));
                    setFecha(pago.fecha ? getLocalDateString(pago.fecha) : getLocalDateString());
                    setMonto(String(pago.monto));
                    setFactura(pago.factura || '');
                    setRecibo(pago.recibo || '');
                    setFormaPago(pago.forma_pago);
                    setPedidos(allPedidos);
                } else if (initialPedidoId) {
                    setIdPedido(String(initialPedidoId));
                    setFecha(getLocalDateString());
                    const target = allPedidos.find(p => p.id === Number(initialPedidoId));
                    if (target) {
                        setMonto(String(target.Total));
                    } else {
                        setMonto('');
                    }
                    setFactura('');
                    setRecibo('');
                    if (formasList.length > 0) {
                        setFormaPago(formasList[0].forma_pago);
                    }
                    setPedidos(allPedidos);
                } else {
                    setIdPedido('');
                    setFecha(getLocalDateString());
                    setMonto('');
                    setFactura('');
                    setRecibo('');
                    if (formasList.length > 0) {
                        setFormaPago(formasList[0].forma_pago);
                    }
                    setPedidos(allPedidos.filter(p => !p.Pagado));
                }

            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isOpen, id, initialPedidoId, isEditMode]);

    const handlePedidoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const pid = e.target.value;
        setIdPedido(pid);
        const selected = pedidos.find(p => p.id === Number(pid));
        if (selected) {
            setMonto(selected.Total.toString());
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const parsedMonto = parseFloat(String(monto).replace(',', '.'));
            const payload = {
                fecha,
                idPedido: Number(idPedido),
                monto: isNaN(parsedMonto) ? 0 : parsedMonto,
                factura,
                recibo,
                forma_pago: formaPago
            };

            if (isEditMode && id) {
                await api.put(`/pagos-pedidos/${id}`, payload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Pago Actualizado',
                    text: 'Pago actualizado correctamente',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                await api.post('/pagos-pedidos', payload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Pago Registrado',
                    text: 'Pago registrado correctamente',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
            onSaveSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving pago:', error);
            const errorMessage = error.response?.data?.message || 'Error al guardar el pago';
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
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-[560px] max-w-[95%] max-h-[90vh] overflow-y-auto shadow-2xl text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-700 pb-3">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <span className="p-2.5 bg-blue-100 dark:bg-blue-900/60 rounded-xl text-blue-600 dark:text-blue-300 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </span>
                        {isEditMode ? 'Editar Pago de Pedido' : 'Nuevo Pago de Pedido'}
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

                {loading ? (
                    <div className="p-6 text-center text-gray-500">Cargando...</div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Pedido:</label>
                            <select
                                value={idPedido}
                                onChange={handlePedidoChange}
                                required
                                disabled={isEditMode}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:outline-none focus:ring-blue-500 font-medium cursor-pointer disabled:bg-gray-100 dark:disabled:bg-gray-800"
                            >
                                <option value="">-- Seleccione un Pedido --</option>
                                {pedidos.map(p => (
                                    <option key={p.id} value={p.id}>
                                        #{p.id} - {p.proveedor?.proveedor} - Total: Bs {p.Total} {p.Pagado ? '(Pagado)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Fecha Pago:</label>
                                <input
                                    type="date"
                                    value={fecha}
                                    onChange={e => setFecha(e.target.value)}
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:outline-none focus:ring-blue-500 font-medium"
                                />
                            </div>

                            <div>
                                <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Monto:</label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={monto}
                                    onChange={e => setMonto(e.target.value)}
                                    required
                                    placeholder="Ej: 150.00 o 150,00"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:outline-none focus:ring-blue-500 font-medium"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Nro. Factura:</label>
                                <input
                                    type="text"
                                    value={factura}
                                    onChange={e => setFactura(e.target.value)}
                                    placeholder="Ej: F-10023"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:outline-none focus:ring-blue-500 font-medium"
                                />
                            </div>

                            <div>
                                <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Nro. Recibo:</label>
                                <input
                                    type="text"
                                    value={recibo}
                                    onChange={e => setRecibo(e.target.value)}
                                    placeholder="Ej: R-504"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:outline-none focus:ring-blue-500 font-medium"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Forma de Pago:</label>
                            <div className="flex gap-2">
                                <select
                                    value={formaPago}
                                    onChange={e => setFormaPago(e.target.value)}
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:outline-none focus:ring-blue-500 font-medium cursor-pointer"
                                >
                                    {formasPago.length > 0 ? (
                                        formasPago.map(fp => (
                                            <option key={fp.id} value={fp.forma_pago}>{fp.forma_pago}</option>
                                        ))
                                    ) : (
                                        <option value="Efectivo">Efectivo</option>
                                    )}
                                </select>
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
                                <span>{isEditMode ? 'Actualizar' : 'Guardar'}</span>
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
                )}
            </div>
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual - Pagos de Pedidos"
                sections={manualSections}
            />
            <FormaPagoForm
                isOpen={isFormaPagoModalOpen}
                onClose={() => setIsFormaPagoModalOpen(false)}
                onSaveSuccess={fetchFormasPago}
            />
        </div>
    );
};

export default PagosPedidosForm;
