import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import ManualModal, { type ManualSection } from './ManualModal';

interface CubetasFormProps {
    isOpen: boolean;
    onClose: () => void;
    id?: number | null;
    onSaveSuccess: () => void;
}

const CubetasForm: React.FC<CubetasFormProps> = ({ isOpen, onClose, id, onSaveSuccess }) => {
    const isEditMode = Boolean(id);

    const [codigo, setCodigo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [dentroFuera, setDentroFuera] = useState('DENTRO');
    const [estado, setEstado] = useState('activo');
    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Gestión de Cubetas',
            content: 'Registre y rastree cubetas (bandejas) de trabajos de laboratorio. Controle si están dentro o fuera de la clínica para seguimiento.'
        },
        {
            title: 'Código y Descripción',
            content: 'Asigne un código único a cada cubeta y una descripción para identificar fácilmente su contenido o propósito.'
        },
        {
            title: 'Estado Dentro/Fuera',
            content: 'Marque "DENTRO" cuando la cubeta está en la clínica, "FUERA" cuando está en el laboratorio externo. Facilita el control de inventario.'
        }
    ];

    useEffect(() => {
        if (isOpen) {
            if (isEditMode && id) {
                api.get(`/cubetas/${id}`)
                    .then(response => {
                        const data = response.data;
                        setCodigo(data.codigo || '');
                        setDescripcion(data.descripcion || '');
                        setDentroFuera(data.dentro_fuera || 'DENTRO');
                        setEstado(data.estado || 'activo');
                    })
                    .catch(error => console.error('Error fetching cubeta:', error));
            } else {
                setCodigo('');
                setDescripcion('');
                setDentroFuera('DENTRO');
                setEstado('activo');
            }
        }
    }, [isOpen, id, isEditMode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            codigo,
            descripcion,
            dentro_fuera: dentroFuera,
            estado
        };

        try {
            if (isEditMode) {
                await api.patch(`/cubetas/${id}`, payload);
                await Swal.fire({
                    title: 'Actualizado',
                    text: 'Cubeta actualizada correctamente',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                await api.post('/cubetas', payload);
                await Swal.fire({
                    title: 'Registrado',
                    text: 'Cubeta registrada correctamente',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
            onSaveSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving cubeta:', error);
            const errorMessage = error.response?.data?.message || 'Error al guardar la cubeta';
            Swal.fire({
                title: 'Error',
                text: Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage,
                icon: 'error'
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000] p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-[520px] max-w-[95%] max-h-[90vh] overflow-y-auto shadow-2xl text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-700 pb-3">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <span className="p-2.5 bg-teal-100 dark:bg-teal-900/60 rounded-xl text-teal-600 dark:text-teal-300 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </span>
                        {isEditMode ? 'Editar Cubeta' : 'Nueva Cubeta'}
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
                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Código:</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={codigo}
                                onChange={e => setCodigo(e.target.value)}
                                required
                                placeholder="Ej: CUB-01"
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                            </svg>
                        </div>
                    </div>

                    <div>
                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Descripción:</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={descripcion}
                                onChange={e => setDescripcion(e.target.value)}
                                required
                                placeholder="Ej: Cubeta superior metálica"
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Ubicación:</label>
                            <div className="relative">
                                <select
                                    value={dentroFuera}
                                    onChange={e => setDentroFuera(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                                >
                                    <option value="DENTRO">DENTRO</option>
                                    <option value="FUERA">FUERA</option>
                                </select>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 absolute left-3 top-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Estado:</label>
                            <div className="relative">
                                <select
                                    value={estado}
                                    onChange={e => setEstado(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                                >
                                    <option value="activo">Activo</option>
                                    <option value="inactivo">Inactivo</option>
                                </select>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 absolute left-3 top-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
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
                            {isEditMode ? 'Actualizar' : 'Guardar'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2.5 px-5 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual - Cubetas"
                sections={manualSections}
            />
        </div>
    );
};

export default CubetasForm;
