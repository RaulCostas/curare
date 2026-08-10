import React, { useState, useEffect } from 'react';
import api from '../services/api';
import type { MaterialUtilizado } from '../types';
import Swal from 'sweetalert2';

interface ViewMaterialUtilizadoModalProps {
    isOpen: boolean;
    onClose: () => void;
    historiaClinicaId: number;
}

const ViewMaterialUtilizadoModal: React.FC<ViewMaterialUtilizadoModalProps> = ({
    isOpen,
    onClose,
    historiaClinicaId
}) => {
    const [material, setMaterial] = useState<MaterialUtilizado | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && historiaClinicaId) {
            fetchMaterial();
        }
    }, [isOpen, historiaClinicaId]);

    const fetchMaterial = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/material-utilizado/historia/${historiaClinicaId}`);
            setMaterial(response.data);
        } catch (error) {
            console.error('Error fetching material utilizado:', error);
            Swal.fire({
                icon: 'info',
                title: 'Sin Material Registrado',
                text: 'No se ha registrado material utilizado para esta Historia Clínica',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-2 sm:p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
                <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
                    <h3 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">
                        Material Utilizado
                    </h3>
                    <button
                        onClick={onClose}
                        className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-2 px-3 sm:px-4 rounded transition-colors text-sm sm:text-base">
                        Cerrar
                    </button>
                </div>

                <div className="p-4 sm:p-6">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando...</p>
                        </div>
                    ) : material ? (
                        <div className="space-y-4">
                            {/* General Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                        Fecha
                                    </label>
                                    <p className="text-lg font-medium text-gray-800 dark:text-white">
                                        {material.fecha ? new Date(material.fecha).toLocaleDateString('es-ES') : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                        Registrado por
                                    </label>
                                    <p className="text-lg font-medium text-gray-800 dark:text-white">
                                        {material.user?.name || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Observaciones Generales */}
                            {material.observaciones && (
                                <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                                    <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                        Observaciones Generales
                                    </label>
                                    <p className="text-gray-800 dark:text-white">
                                        {material.observaciones}
                                    </p>
                                </div>
                            )}

                            {/* Detalles Table */}
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                                    <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                                        </svg>
                                        Materiales Utilizados ({material.detalles?.length || 0})
                                    </h4>
                                </div>
                                {material.detalles && material.detalles.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                            <thead className="bg-gray-50 dark:bg-gray-700">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Material</th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cantidad</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Observaciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                {material.detalles.map((detalle, index) => (
                                                    <tr key={detalle.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-medium">{index + 1}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                                            {detalle.inventario?.descripcion || 'N/A'}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900 dark:text-gray-100 font-bold">
                                                            {detalle.cantidad}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                            {detalle.observaciones || '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        <p className="text-sm">No hay materiales registrados</p>
                                    </div>
                                )}
                            </div>

                            {/* Fecha de registro */}
                            {material.createdAt && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                                    Registrado el: {new Date(material.createdAt).toLocaleString('es-ES')}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <p>No hay información disponible</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ViewMaterialUtilizadoModal;
