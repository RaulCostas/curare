import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import type { Proveedor, Inventario } from '../types';
import ManualModal, { type ManualSection } from './ManualModal';
import { getLocalDateString, formatDate, formatNumberBs } from '../utils/dateUtils';

interface PedidoDetail {
    idinventario: number;
    cantidad: number;
    precio_unitario: number;
    fecha_vencimiento: string;
    inventarioNombre?: string;
}

interface PedidosFormProps {
    isOpen: boolean;
    onClose: () => void;
    id?: number | null;
    onSaveSuccess: () => void;
}

const PedidosForm: React.FC<PedidosFormProps> = ({ isOpen, onClose, id, onSaveSuccess }) => {
    const isEditMode = Boolean(id);

    const [providers, setProviders] = useState<Proveedor[]>([]);
    const [inventarioItems, setInventarioItems] = useState<Inventario[]>([]);

    const [fecha, setFecha] = useState(getLocalDateString());
    const [idproveedor, setIdProveedor] = useState<number>(0);
    const [observaciones, setObservaciones] = useState('');
    const [subTotal, setSubTotal] = useState(0);
    const [descuento, setDescuento] = useState<number | string>(0);
    const [total, setTotal] = useState(0);

    const [detalles, setDetalles] = useState<PedidoDetail[]>([]);

    const [tempIdInventario, setTempIdInventario] = useState<number>(0);
    const [tempCantidad, setTempCantidad] = useState<number>(1);
    const [tempPrecio, setTempPrecio] = useState<number | string>(0);
    const [tempVencimiento, setTempVencimiento] = useState(getLocalDateString());
    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Pedidos a Proveedores',
            content: 'Registre pedidos de inventario a proveedores. Agregue múltiples ítems con sus cantidades, precios y fechas de vencimiento.'
        },
        {
            title: 'Agregar Ítems',
            content: 'Seleccione productos del inventario y especifique cantidad, precio unitario y fecha de vencimiento. Use el botón "+" para agregar cada ítem al pedido.'
        },
        {
            title: 'Cálculos Automáticos',
            content: 'El sistema calcula automáticamente el subtotal y total del pedido. Puede aplicar descuentos al total general.'
        }
    ];

    useEffect(() => {
        if (isOpen) {
            fetchProviders();
            fetchInventario();
            if (isEditMode && id) {
                fetchPedidoData(id.toString());
            } else {
                setFecha(getLocalDateString());
                setIdProveedor(0);
                setObservaciones('');
                setDescuento(0);
                setDetalles([]);
                setTempIdInventario(0);
                setTempCantidad(1);
                setTempPrecio(0);
                setTempVencimiento(getLocalDateString());
            }
        }
    }, [isOpen, id, isEditMode]);

    useEffect(() => {
        calculateTotals();
    }, [detalles, descuento]);

    const fetchPedidoData = async (pedidoId: string) => {
        try {
            const response = await api.get(`/pedidos/${pedidoId}`);
            const pedido = response.data;

            setFecha(pedido.fecha ? getLocalDateString(pedido.fecha) : getLocalDateString());
            setIdProveedor(pedido.idproveedor);
            setObservaciones(pedido.Observaciones || '');
            setDescuento(Number(pedido.Descuento) || 0);

            const mappedDetalles = (pedido.detalles || []).map((d: any) => ({
                idinventario: d.idinventario,
                cantidad: d.cantidad,
                precio_unitario: Number(d.precio_unitario),
                fecha_vencimiento: d.fecha_vencimiento ? getLocalDateString(d.fecha_vencimiento) : '',
                inventarioNombre: d.inventario?.descripcion
            }));
            setDetalles(mappedDetalles);
        } catch (error) {
            console.error('Error fetching pedido:', error);
        }
    };

    const fetchProviders = async () => {
        try {
            const response = await api.get('/proveedores?limit=100');
            const allProviders = Array.isArray(response.data) ? response.data : response.data.data;
            const activeProviders = (allProviders || []).filter((p: any) => p.estado === 'activo');
            setProviders(activeProviders);
        } catch (error) {
            console.error('Error fetching providers:', error);
        }
    };

    const fetchInventario = async () => {
        try {
            const response = await api.get('/inventario?limit=1000');
            const activeInventario = (response.data.data || []).filter((item: any) => item.estado === 'Activo');
            setInventarioItems(activeInventario);
        } catch (error) {
            console.error('Error fetching inventario:', error);
        }
    };

    const calculateTotals = () => {
        const newSubTotal = detalles.reduce((acc, curr) => acc + (curr.cantidad * curr.precio_unitario), 0);
        setSubTotal(newSubTotal);
        const descNum = parseFloat(String(descuento).replace(',', '.')) || 0;
        setTotal(Math.max(0, newSubTotal - descNum));
    };

    const handleAddDetail = () => {
        if (!tempIdInventario) {
            Swal.fire('Atención', 'Seleccione un ítem del inventario', 'warning');
            return;
        }
        if (tempCantidad <= 0) {
            Swal.fire('Atención', 'La cantidad debe ser mayor a 0', 'warning');
            return;
        }

        const selectedItem = inventarioItems.find(i => i.id === tempIdInventario);
        const parsedPrecio = parseFloat(String(tempPrecio).replace(',', '.'));

        const newDetail: PedidoDetail = {
            idinventario: tempIdInventario,
            cantidad: tempCantidad,
            precio_unitario: isNaN(parsedPrecio) ? 0 : parsedPrecio,
            fecha_vencimiento: tempVencimiento,
            inventarioNombre: selectedItem?.descripcion || ''
        };

        setDetalles(prev => [...prev, newDetail]);
        setTempIdInventario(0);
        setTempCantidad(1);
        setTempPrecio(0);
        setTempVencimiento(getLocalDateString());
    };

    const handleRemoveDetail = (index: number) => {
        setDetalles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!idproveedor) {
            Swal.fire('Atención', 'Seleccione un proveedor', 'warning');
            return;
        }

        if (detalles.length === 0) {
            Swal.fire('Atención', 'Debe agregar al menos un ítem al pedido', 'warning');
            return;
        }

        const descNum = parseFloat(String(descuento).replace(',', '.')) || 0;

        const payload = {
            fecha,
            idproveedor,
            SubTotal: subTotal,
            Descuento: descNum,
            Total: total,
            Observaciones: observaciones,
            detalles: detalles.map(d => ({
                idinventario: d.idinventario,
                cantidad: d.cantidad,
                precio_unitario: d.precio_unitario,
                fecha_vencimiento: d.fecha_vencimiento
            }))
        };

        try {
            if (isEditMode && id) {
                await api.patch(`/pedidos/${id}`, payload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Éxito',
                    text: 'Pedido actualizado correctamente',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                await api.post('/pedidos', payload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Éxito',
                    text: 'Pedido registrado correctamente',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
            onSaveSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving pedido:', error);
            const errorMessage = error.response?.data?.message || 'Error al procesar el pedido';
            Swal.fire('Error', Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage, 'error');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="fixed inset-0 bg-black/50 transition-opacity duration-300 opacity-100" onClick={onClose} />
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-3xl bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-0 flex flex-col">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <span className="p-2.5 bg-blue-100 dark:bg-blue-900/60 rounded-xl text-blue-600 dark:text-blue-300 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </span>
                        {isEditMode ? 'Editar Pedido' : 'Nuevo Pedido a Proveedor'}
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
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col justify-between space-y-6">
                    <div className="space-y-6">
                        {/* Master Header */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                            <div>
                                <label className="block mb-1 font-medium text-sm text-gray-700 dark:text-gray-300">Fecha:</label>
                                <input
                                    type="date"
                                    value={fecha}
                                    onChange={(e) => setFecha(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block mb-1 font-medium text-sm text-gray-700 dark:text-gray-300">Proveedor:</label>
                                <select
                                    value={idproveedor}
                                    onChange={(e) => setIdProveedor(Number(e.target.value))}
                                    required
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 cursor-pointer"
                                >
                                    <option value={0}>Seleccione Proveedor</option>
                                    {providers.map(p => (
                                        <option key={p.id} value={p.id}>{p.proveedor}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Add Detail Section */}
                        <div className="bg-blue-50/50 dark:bg-gray-700/30 p-4 rounded-xl border border-blue-100 dark:border-gray-700 space-y-4">
                            <h3 className="font-bold text-sm text-blue-900 dark:text-blue-300 uppercase tracking-wider">Agregar Productos al Pedido</h3>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                <div className="md:col-span-4">
                                    <label className="block mb-1 font-medium text-xs text-gray-600 dark:text-gray-400">Producto / Ítem:</label>
                                    <select
                                        value={tempIdInventario}
                                        onChange={(e) => setTempIdInventario(Number(e.target.value))}
                                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 cursor-pointer"
                                    >
                                        <option value={0}>Seleccione Ítem...</option>
                                        {inventarioItems.map(i => (
                                            <option key={i.id} value={i.id}>{i.descripcion}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block mb-1 font-medium text-xs text-gray-600 dark:text-gray-400">Cant:</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={tempCantidad}
                                        onChange={(e) => setTempCantidad(Number(e.target.value))}
                                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block mb-1 font-medium text-xs text-gray-600 dark:text-gray-400">Precio Unit:</label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={tempPrecio}
                                        onChange={(e) => setTempPrecio(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 font-medium"
                                    />
                                </div>

                                <div className="md:col-span-3">
                                    <label className="block mb-1 font-medium text-xs text-gray-600 dark:text-gray-400">Vencimiento:</label>
                                    <input
                                        type="date"
                                        value={tempVencimiento}
                                        onChange={(e) => setTempVencimiento(e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500"
                                    />
                                </div>

                                <div className="md:col-span-1 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handleAddDetail}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded-lg shadow-md transition-all text-sm w-full flex justify-center items-center h-[38px]"
                                        title="Agregar Ítem"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Details Table */}
                        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 uppercase text-xs">
                                    <tr>
                                        <th className="p-3">Producto</th>
                                        <th className="p-3 text-center">Cant.</th>
                                        <th className="p-3 text-right">P. Unit</th>
                                        <th className="p-3 text-right">Subtotal</th>
                                        <th className="p-3 text-center">Vencimiento</th>
                                        <th className="p-3 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {detalles.map((d, index) => (
                                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                            <td className="p-3 font-medium text-gray-900 dark:text-white">{d.inventarioNombre}</td>
                                            <td className="p-3 text-center font-bold">{d.cantidad}</td>
                                            <td className="p-3 text-right">{formatNumberBs(d.precio_unitario)}</td>
                                            <td className="p-3 text-right font-bold text-blue-600 dark:text-blue-400">{formatNumberBs(d.cantidad * d.precio_unitario)}</td>
                                            <td className="p-3 text-center">{d.fecha_vencimiento ? formatDate(d.fecha_vencimiento) : '-'}</td>
                                            <td className="p-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveDetail(index)}
                                                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md transition-all flex items-center justify-center mx-auto"
                                                    title="Eliminar ítem"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {detalles.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-6 text-center text-gray-400 dark:text-gray-500">
                                                No hay productos agregados a este pedido
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary & Observaciones */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                            <div>
                                <label className="block mb-1 font-medium text-sm text-gray-700 dark:text-gray-300">Observaciones:</label>
                                <textarea
                                    value={observaciones}
                                    onChange={(e) => setObservaciones(e.target.value)}
                                    rows={3}
                                    placeholder="Detalles o notas sobre el pedido..."
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500"
                                />
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 space-y-2 text-sm">
                                <div className="flex justify-between font-medium">
                                    <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                                    <span className="font-bold text-gray-800 dark:text-gray-200">Bs {formatNumberBs(subTotal)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-400 font-medium">Descuento:</span>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={descuento}
                                        onChange={(e) => setDescuento(e.target.value)}
                                        placeholder="0.00"
                                        className="w-28 px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 text-right font-bold"
                                    />
                                </div>
                                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600 text-base font-extrabold">
                                    <span className="text-gray-900 dark:text-white">TOTAL:</span>
                                    <span className="text-green-600 dark:text-green-400">Bs {formatNumberBs(total)}</span>
                                </div>
                            </div>
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
                            {isEditMode ? 'Actualizar Pedido' : 'Guardar Pedido'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2.5 px-5 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span>Cancelar</span>
                        </button>
                    </div>
                </form>
            </div>
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual - Pedidos"
                sections={manualSections}
            />
        </div>
    );
};

export default PedidosForm;
