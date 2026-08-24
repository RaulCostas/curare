import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import type { Laboratorio } from '../types';
import ManualModal, { type ManualSection } from './ManualModal';

interface PrecioLaboratorioFormProps {
    isOpen: boolean;
    onClose: () => void;
    id?: number | null;
    onSaveSuccess: () => void;
}

const PrecioLaboratorioForm: React.FC<PrecioLaboratorioFormProps> = ({ isOpen, onClose, id, onSaveSuccess }) => {
    const isEditing = Boolean(id);

    const [formData, setFormData] = useState({
        detalle: '',
        precio: '',
        idLaboratorio: '',
        estado: 'activo'
    });
    const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Precios de Laboratorio',
            content: 'Defina los precios de trabajos específicos para cada laboratorio externo. Esto permite calcular costos y márgenes automáticamente.'
        },
        {
            title: 'Gestión de Precios',
            content: 'Registre el detalle del trabajo (ej: Corona, Puente) y su precio para cada laboratorio. Puede tener diferentes precios por laboratorio.'
        },
        {
            title: 'Estado',
            content: 'Los precios inactivos no aparecerán en las opciones de selección al registrar nuevos trabajos de laboratorio.'
        }
    ];

    useEffect(() => {
        if (isOpen) {
            fetchLaboratorios();
            if (isEditing && id) {
                api.get(`/precios-laboratorios/${id}`)
                    .then(response => {
                        setFormData({
                            ...response.data,
                            idLaboratorio: response.data.idLaboratorio ? response.data.idLaboratorio.toString() : ''
                        });
                    })
                    .catch(error => console.error('Error fetching precio:', error));
            } else {
                setFormData({
                    detalle: '',
                    precio: '',
                    idLaboratorio: '',
                    estado: 'activo'
                });
            }
        }
    }, [isOpen, id, isEditing]);

    const fetchLaboratorios = async () => {
        try {
            const response = await api.get('/laboratorios?limit=100');
            const activeLabs = (response.data.data || []).filter((lab: any) => lab.estado === 'activo');
            setLaboratorios(activeLabs);
        } catch (error) {
            console.error('Error fetching laboratorios:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const parsedPrecio = parseFloat(String(formData.precio).replace(',', '.'));
        const payload = {
            ...formData,
            precio: isNaN(parsedPrecio) ? 0 : parsedPrecio,
            idLaboratorio: Number(formData.idLaboratorio)
        };

        try {
            if (isEditing) {
                await api.patch(`/precios-laboratorios/${id}`, payload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Precio Actualizado',
                    text: 'Precio actualizado exitosamente',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                await api.post('/precios-laboratorios', payload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Precio Creado',
                    text: 'Precio creado exitosamente',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
            onSaveSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving precio:', error);
            const errorMessage = error.response?.data?.message || 'Error al guardar el precio';
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
                        <span className="p-2.5 bg-amber-100 dark:bg-amber-900/60 rounded-xl text-amber-600 dark:text-amber-300 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </span>
                        {isEditing ? 'Editar Precio de Laboratorio' : 'Nuevo Precio de Laboratorio'}
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
                    <div>
                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Laboratorio:</label>
                        <select
                            name="idLaboratorio"
                            value={formData.idLaboratorio}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 font-medium cursor-pointer"
                        >
                            <option value="">Seleccione un laboratorio</option>
                            {laboratorios.map(lab => (
                                <option key={lab.id} value={lab.id}>
                                    {lab.laboratorio}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Detalle / Trabajo:</label>
                        <input
                            type="text"
                            name="detalle"
                            value={formData.detalle}
                            onChange={handleChange}
                            required
                            placeholder="Ej: Corona de Porcelana"
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 font-medium"
                        />
                    </div>

                    <div>
                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Precio:</label>
                        <input
                            type="text"
                            inputMode="decimal"
                            name="precio"
                            value={formData.precio}
                            onChange={handleChange}
                            required
                            placeholder="Ej: 150.00 o 150,00"
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 font-medium"
                        />
                    </div>

                    <div>
                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Estado:</label>
                        <select
                            name="estado"
                            value={formData.estado}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 font-medium cursor-pointer"
                        >
                            <option value="activo">Activo</option>
                            <option value="inactivo">Inactivo</option>
                        </select>
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
                title="Manual - Precios de Laboratorio"
                sections={manualSections}
            />
        </div>
    );
};

export default PrecioLaboratorioForm;
