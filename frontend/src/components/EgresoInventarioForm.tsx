import React, { useState } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import type { Inventario, EgresoInventario } from '../types';
import { getLocalDateString } from '../utils/dateUtils';

interface EgresoInventarioFormProps {
    inventario: Inventario;
    egresoToEdit?: EgresoInventario;
    onClose: () => void;
    onSuccess: () => void;
}

const EgresoInventarioForm: React.FC<EgresoInventarioFormProps> = ({ inventario, egresoToEdit, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        fecha: egresoToEdit ? egresoToEdit.fecha : getLocalDateString(),
        cantidad: egresoToEdit ? egresoToEdit.cantidad : 0,
        consultorio: egresoToEdit ? egresoToEdit.consultorio : '',
        fecha_vencimiento: egresoToEdit ? egresoToEdit.fecha_vencimiento || '' : '',
        observaciones: egresoToEdit ? egresoToEdit.observaciones || '' : ''
    });
    const [availableDates, setAvailableDates] = useState<{ fecha: string; stock: number }[]>([]);

    React.useEffect(() => {
        const fetchDates = async () => {
            try {
                // Returns array of objects now: { fecha, stock }
                const response = await api.get<any>(`/pedidos/vencimientos/${inventario.id}`);
                setAvailableDates(response.data);

                // Auto-select first date if available and not editing
                if (!egresoToEdit && response.data.length > 0) {
                    setFormData(prev => ({ ...prev, fecha_vencimiento: response.data[0].fecha }));
                }
            } catch (error) {
                console.error('Error fetching expiration dates:', error);
            }
        };
        fetchDates();
    }, [inventario.id, egresoToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                inventarioId: inventario.id,
                cantidad: Number(formData.cantidad)
            };

            if (egresoToEdit) {
                await api.put(`/egreso-inventario/${egresoToEdit.id}`, payload);
            } else {
                await api.post('/egreso-inventario', payload);
            }

            await Swal.fire({
                icon: 'success',
                title: egresoToEdit ? 'Egreso Actualizado' : 'Egreso Registrado',
                text: egresoToEdit ? 'El egreso ha sido actualizado correctamente' : 'El egreso ha sido registrado correctamente',
                timer: 1500,
                showConfirmButton: false
            });

            onSuccess();
        } catch (error: any) {
            console.error('Error saving egreso:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Error al guardar el egreso'
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-2 sm:p-4 overflow-x-hidden">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-4 sm:p-6 relative max-h-[95vh] overflow-y-auto overflow-x-hidden border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-700 pb-3 gap-2">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="p-2 bg-red-100 dark:bg-red-900/60 rounded-xl text-red-600 dark:text-red-300 shadow-sm flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </span>
                        <div className="truncate min-w-0 flex-1">
                            <span>{egresoToEdit ? 'Editar Egreso:' : 'Egreso de:'}</span>{' '}
                            <span className="text-[#3498db] dark:text-[#5dade2]">{inventario.descripcion}</span>
                        </div>
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 bg-transparent hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full transition-all flex-shrink-0 cursor-pointer"
                        title="Cerrar"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
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
                                value={formData.fecha}
                                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3498db] transition duration-200 bg-white dark:bg-gray-700 dark:text-white text-sm"
                                style={{ paddingLeft: '35px' }}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Cantidad</label>
                        <div style={{ position: 'relative' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                            </svg>
                            <input
                                type="number"
                                value={formData.cantidad}
                                onChange={(e) => setFormData({ ...formData, cantidad: Number(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3498db] transition duration-200 text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm"
                                style={{ paddingLeft: '35px' }}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Consultorio</label>
                        <div style={{ position: 'relative' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                <circle cx="12" cy="10" r="3"></circle>
                                <path d="M12 2a8 8 0 0 0-8 8c0 1.892.402 3.13 1.5 4.5L12 22l6.5-7.5c1.098-1.37 1.5-2.608 1.5-4.5a8 8 0 0 0-8-8z"></path>
                            </svg>
                            <input
                                type="text"
                                value={formData.consultorio}
                                onChange={(e) => setFormData({ ...formData, consultorio: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3498db] transition duration-200 text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm"
                                style={{ paddingLeft: '35px' }}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Fecha Vencimiento (Lote)</label>
                        <div style={{ position: 'relative' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            <select
                                value={formData.fecha_vencimiento}
                                onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3498db] transition duration-200 text-gray-900 dark:text-white appearance-none bg-white dark:bg-gray-700 text-sm cursor-pointer"
                                style={{ paddingLeft: '35px' }}
                            >
                                <option value="">Sin lote específico (Opcional)</option>
                                {availableDates.map((date, idx) => (
                                    <option key={idx} value={date.fecha}>
                                        {date.fecha} (Stock: {date.stock})
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Observaciones</label>
                        <div style={{ position: 'relative' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '10px', top: '12px', pointerEvents: 'none' }}>
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                            <textarea
                                value={formData.observaciones}
                                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                placeholder="Detalles específicos sobre el egreso de material (opcional)..."
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3498db] transition duration-200 text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-sm resize-none box-border"
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
                            <span>{egresoToEdit ? 'Actualizar' : 'Guardar'}</span>
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
        </div>
    );
};

export default EgresoInventarioForm;
