import React, { useState, useEffect } from 'react';
import api from '../services/api';
import type { Inventario } from '../types';
import Swal from 'sweetalert2';
import { getLocalDateString } from '../utils/dateUtils';

interface MaterialUtilizadoModalProps {
    isOpen: boolean;
    onClose: () => void;
    historiaClinicaId: number;
    onSuccess: () => void;
    onOmitir?: () => void;
}

interface DetalleItem {
    inventarioId: number;
    descripcion: string;
    cantidad: string;
    observaciones: string;
}

const MaterialUtilizadoModal: React.FC<MaterialUtilizadoModalProps> = ({
    isOpen,
    onClose,
    historiaClinicaId,
    onSuccess,
    onOmitir
}) => {
    const [inventarios, setInventarios] = useState<Inventario[]>([]);
    const [detalles, setDetalles] = useState<DetalleItem[]>([]);
    const [fecha, setFecha] = useState(getLocalDateString());
    const [observacionesGenerales, setObservacionesGenerales] = useState('');

    // Current item being added
    const [currentItem, setCurrentItem] = useState({
        inventarioId: 0,
        cantidad: '1',
        observaciones: ''
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchInventarios();
            resetForm();
        }
    }, [isOpen]);

    const fetchInventarios = async () => {
        try {
            const response = await api.get('/inventario?limit=1000');
            const data = response.data;
            const items = Array.isArray(data) ? data : (data?.data || []);
            setInventarios(items);
        } catch (error) {
            console.error('Error fetching inventarios:', error);
        }
    };

    const resetForm = () => {
        setDetalles([]);
        setFecha(getLocalDateString());
        setObservacionesGenerales('');
        setCurrentItem({
            inventarioId: 0,
            cantidad: '1',
            observaciones: ''
        });
    };

    const handleAddItem = () => {
        if (!currentItem.inventarioId || currentItem.inventarioId === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Campo requerido',
                text: 'Por favor seleccione un material del inventario',
                customClass: { container: '!z-[9999]' }
            });
            return;
        }

        // Check if material already exists in detalles
        const exists = detalles.find(d => d.inventarioId === currentItem.inventarioId);
        if (exists) {
            Swal.fire({
                icon: 'warning',
                title: 'Material duplicado',
                text: 'Este material ya fue agregado. Elimínelo primero si desea modificarlo.',
                customClass: { container: '!z-[9999]' }
            });
            return;
        }

        const inventario = inventarios.find(inv => inv.id === currentItem.inventarioId);
        if (!inventario) return;

        const newDetalle: DetalleItem = {
            inventarioId: currentItem.inventarioId,
            descripcion: inventario.descripcion,
            cantidad: currentItem.cantidad,
            observaciones: currentItem.observaciones
        };

        setDetalles([...detalles, newDetalle]);

        // Reset current item
        setCurrentItem({
            inventarioId: 0,
            cantidad: '1',
            observaciones: ''
        });
    };

    const handleRemoveItem = (index: number) => {
        const newDetalles = [...detalles];
        newDetalles.splice(index, 1);
        setDetalles(newDetalles);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (detalles.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Sin materiales',
                text: 'Debe agregar al menos un material antes de guardar',
                customClass: { container: '!z-[9999]' }
            });
            return;
        }

        setLoading(true);
        try {
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;

            const payload = {
                historiaClinicaId,
                fecha,
                observaciones: observacionesGenerales,
                userId: user?.id || 0,
                detalles: detalles.map(d => ({
                    inventarioId: d.inventarioId,
                    cantidad: d.cantidad,
                    observaciones: d.observaciones
                }))
            };

            await api.post('/material-utilizado', payload);

            await Swal.fire({
                icon: 'success',
                title: 'Materiales Registrados',
                text: `Se registraron ${detalles.length} material(es) exitosamente`,
                timer: 1500,
                showConfirmButton: false,
                customClass: { container: '!z-[9999]' }
            });

            onSuccess();
            handleClose();
        } catch (error: any) {
            console.error('Error saving material utilizado:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'No se pudo guardar el material utilizado',
                customClass: { container: '!z-[9999]' }
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    const cantidadOptions = [
        '1/4', '1/2', '3/4',
        '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1100] p-3 sm:p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto border border-gray-100 dark:border-gray-700">
                {/* Header sin botón X */}
                <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-2xl flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <h3 className="text-lg sm:text-xl font-bold">
                        Registrar Material Utilizado
                    </h3>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* General Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                Fecha
                            </label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                <input
                                    type="date"
                                    value={fecha}
                                    onChange={(e) => setFecha(e.target.value)}
                                    required
                                    className="w-full pl-10 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                Observaciones Generales
                            </label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                                <input
                                    type="text"
                                    value={observacionesGenerales}
                                    onChange={(e) => setObservacionesGenerales(e.target.value)}
                                    className="w-full pl-10 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium outline-none transition-all"
                                    placeholder="Opcional..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Add Item Section */}
                    <div className="border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20 p-5 rounded-xl">
                        <h4 className="text-md font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Agregar Material
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Material
                                </label>
                                <div className="relative">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                    </svg>
                                    <select
                                        value={currentItem.inventarioId}
                                        onChange={(e) => setCurrentItem({ ...currentItem, inventarioId: Number(e.target.value) })}
                                        className="w-full pl-10 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer text-sm outline-none transition-all"
                                    >
                                        <option value={0}>-- Seleccione Material --</option>
                                        {inventarios
                                            .filter(inv => !inv.estado || inv.estado.toLowerCase() === 'activo')
                                            .map(inv => (
                                                <option key={inv.id} value={inv.id}>
                                                    {inv.descripcion} {inv.grupoInventario?.grupo ? `(${inv.grupoInventario.grupo})` : ''}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Cantidad
                                </label>
                                <div className="relative">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                    </svg>
                                    <select
                                        value={currentItem.cantidad}
                                        onChange={(e) => setCurrentItem({ ...currentItem, cantidad: e.target.value })}
                                        className="w-full pl-10 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer text-sm outline-none transition-all"
                                    >
                                        {cantidadOptions.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="sm:col-span-4">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Observaciones del Item
                                </label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                            <line x1="16" y1="13" x2="8" y2="13"></line>
                                            <line x1="16" y1="17" x2="8" y2="17"></line>
                                            <polyline points="10 9 9 9 8 9"></polyline>
                                        </svg>
                                        <input
                                            type="text"
                                            value={currentItem.observaciones}
                                            onChange={(e) => setCurrentItem({ ...currentItem, observaciones: e.target.value })}
                                            className="w-full pl-10 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium outline-none transition-all text-sm"
                                            placeholder="Opcional..."
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddItem}
                                        className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 text-sm cursor-pointer"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                        </svg>
                                        Agregar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-gray-100 dark:bg-gray-700/50 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                            <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                                </svg>
                                Materiales Agregados ({detalles.length})
                            </h4>
                        </div>
                        {detalles.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">#</th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Material</th>
                                            <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-300">Cantidad</th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Observaciones</th>
                                            <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-300">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {detalles.map((detalle, index) => (
                                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-medium">{index + 1}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium">{detalle.descripcion}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900 dark:text-gray-100 font-bold">{detalle.cantidad}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{detalle.observaciones || '-'}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(index)}
                                                        className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                                                        title="Eliminar"
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
                        ) : (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                                <p className="text-sm font-medium">No hay materiales agregados aún</p>
                                <p className="text-xs mt-1">Use el formulario de arriba para agregar materiales</p>
                            </div>
                        )}
                    </div>

                    {/* Left-aligned Footer Buttons */}
                    <div className="flex gap-3 pt-3 border-t border-gray-200 dark:border-gray-700 justify-start">
                        <button
                            type="submit"
                            disabled={loading || detalles.length === 0}
                            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-xl font-bold shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                <polyline points="7 3 7 8 15 8"></polyline>
                            </svg>
                            {loading ? 'Guardando...' : 'Siguiente' + (detalles.length > 0 ? ` (${detalles.length})` : '')}
                        </button>
                        {onOmitir && (
                            <button
                                type="button"
                                onClick={() => {
                                    onOmitir();
                                    handleClose();
                                }}
                                disabled={loading}
                                className="px-5 py-2.5 bg-gray-500 hover:bg-gray-600 active:scale-95 text-white rounded-xl font-bold shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                </svg>
                                Omitir
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MaterialUtilizadoModal;
