import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import type { Especialidad, GrupoInventario, Inventario } from '../types';
import ManualModal, { type ManualSection } from './ManualModal';
import EspecialidadForm from './EspecialidadForm';
import GrupoInventarioForm from './GrupoInventarioForm';

interface InventarioFormProps {
    isOpen: boolean;
    onClose: () => void;
    id?: number | null;
    onSaveSuccess: () => void;
}

const InventarioForm: React.FC<InventarioFormProps> = ({ isOpen, onClose, id, onSaveSuccess }) => {
    const isEditing = Boolean(id);

    const initialFormData: Partial<Inventario> = {
        descripcion: '',
        cantidad_existente: 0,
        stock_minimo: 0,
        estado: 'Activo',
        idespecialidad: 0,
        idgrupo_inventario: 0
    };

    const [formData, setFormData] = useState<Partial<Inventario>>(initialFormData);
    const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
    const [grupos, setGrupos] = useState<GrupoInventario[]>([]);
    const [showManual, setShowManual] = useState(false);
    const [isEspecialidadModalOpen, setIsEspecialidadModalOpen] = useState(false);
    const [isGrupoModalOpen, setIsGrupoModalOpen] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Gestión de Inventario',
            content: 'Registre y administre productos del inventario. Especifique descripción, cantidades, stock mínimo, especialidad y grupo.'
        },
        {
            title: 'Stock Mínimo',
            content: 'Defina el stock mínimo para recibir alertas cuando el inventario esté bajo. El sistema resaltará productos con stock crítico.'
        },
        {
            title: 'Organización',
            content: 'Clasifique productos por especialidad y grupo para facilitar la búsqueda y gestión del inventario.'
        }
    ];

    useEffect(() => {
        if (isOpen) {
            fetchDropdowns();
            if (isEditing && id) {
                api.get<Inventario>(`/inventario/${id}`)
                    .then(response => {
                        const item = response.data;
                        setFormData({
                            id: item.id,
                            descripcion: item.descripcion,
                            cantidad_existente: item.cantidad_existente,
                            stock_minimo: item.stock_minimo,
                            estado: item.estado,
                            idespecialidad: item.idespecialidad,
                            idgrupo_inventario: item.idgrupo_inventario
                        });
                    })
                    .catch(error => console.error('Error fetching inventario:', error));
            } else {
                setFormData(initialFormData);
            }
        }
    }, [isOpen, id, isEditing]);

    const fetchDropdowns = async () => {
        try {
            const [espRes, grupRes] = await Promise.all([
                api.get<any>('/especialidad?limit=100'),
                api.get<any>('/grupo-inventario?limit=100')
            ]);

            const especialidadesData = Array.isArray(espRes.data) ? espRes.data : (espRes.data.data || []);
            setEspecialidades(especialidadesData);

            const gruposData = Array.isArray(grupRes.data) ? grupRes.data : (grupRes.data.data || []);
            setGrupos(gruposData);
        } catch (error) {
            console.error('Error fetching dropdowns:', error);
        }
    };

    const handleEspecialidadSuccess = async () => {
        try {
            const espRes = await api.get<any>('/especialidad?limit=100');
            const list = Array.isArray(espRes.data) ? espRes.data : (espRes.data.data || []);
            setEspecialidades(list);
            if (list.length > 0) {
                const last = list[list.length - 1];
                setFormData(prev => ({ ...prev, idespecialidad: last.id }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleGrupoSuccess = async () => {
        try {
            const grupRes = await api.get<any>('/grupo-inventario?limit=100');
            const list = Array.isArray(grupRes.data) ? grupRes.data : (grupRes.data.data || []);
            setGrupos(list);
            if (list.length > 0) {
                const last = list[list.length - 1];
                setFormData(prev => ({ ...prev, idgrupo_inventario: last.id }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.idespecialidad) {
            Swal.fire('Atención', 'Por favor seleccione una especialidad', 'warning');
            return;
        }
        if (!formData.idgrupo_inventario) {
            Swal.fire('Atención', 'Por favor seleccione un grupo', 'warning');
            return;
        }

        try {
            if (isEditing) {
                await api.patch(`/inventario/${id}`, formData);
                await Swal.fire({
                    icon: 'success',
                    title: 'Actualizado',
                    text: 'El ítem ha sido actualizado correctamente',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                await api.post('/inventario', formData);
                await Swal.fire({
                    icon: 'success',
                    title: 'Creado',
                    text: 'El ítem ha sido creado correctamente',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
            onSaveSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving inventario:', error);
            const errorMessage = error.response?.data?.message || 'Error al guardar el ítem';
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
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-[620px] max-w-[95%] max-h-[90vh] overflow-y-auto shadow-2xl text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-700 pb-3">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <span className="p-2.5 bg-blue-100 dark:bg-blue-900/60 rounded-xl text-blue-600 dark:text-blue-300 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </span>
                        {isEditing ? 'Editar Ítem de Inventario' : 'Nuevo Ítem de Inventario'}
                    </h2>
                    <button
                        type="button"
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Descripción:</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={formData.descripcion || ''}
                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                required
                                placeholder="Ej: Guantes de nitrilo talle M"
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Cantidad Existente:</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={formData.cantidad_existente || ''}
                                    onChange={(e) => setFormData({ ...formData, cantidad_existente: Number(e.target.value) })}
                                    required
                                    min={0}
                                    placeholder="Ej: 100"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                </svg>
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Stock Mínimo:</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={formData.stock_minimo || ''}
                                    onChange={(e) => setFormData({ ...formData, stock_minimo: Number(e.target.value) })}
                                    required
                                    min={0}
                                    placeholder="Ej: 10"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Especialidad:</label>
                            <div className="flex gap-2">
                                <div className="relative flex-grow">
                                    <select
                                        value={formData.idespecialidad || 0}
                                        onChange={(e) => setFormData({ ...formData, idespecialidad: Number(e.target.value) })}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                                    >
                                        <option value={0}>Seleccione Especialidad</option>
                                        {especialidades.map(e => <option key={e.id} value={e.id}>{e.especialidad}</option>)}
                                    </select>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 absolute left-3 top-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsEspecialidadModalOpen(true)}
                                    className="px-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center cursor-pointer shrink-0"
                                    title="Nueva Especialidad"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Grupo:</label>
                            <div className="flex gap-2">
                                <div className="relative flex-grow">
                                    <select
                                        value={formData.idgrupo_inventario || 0}
                                        onChange={(e) => setFormData({ ...formData, idgrupo_inventario: Number(e.target.value) })}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                                    >
                                        <option value={0}>Seleccione Grupo</option>
                                        {grupos.map(g => <option key={g.id} value={g.id}>{g.grupo}</option>)}
                                    </select>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 absolute left-3 top-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                    </svg>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsGrupoModalOpen(true)}
                                    className="px-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center cursor-pointer shrink-0"
                                    title="Nuevo Grupo de Inventario"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Estado:</label>
                        <div className="relative">
                            <select
                                value={formData.estado || 'Activo'}
                                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                            >
                                <option value="Activo">Activo</option>
                                <option value="Inactivo">Inactivo</option>
                            </select>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 absolute left-3 top-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
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
                title="Manual - Inventario"
                sections={manualSections}
            />
            <EspecialidadForm
                isOpen={isEspecialidadModalOpen}
                onClose={() => setIsEspecialidadModalOpen(false)}
                onSaveSuccess={handleEspecialidadSuccess}
            />
            <GrupoInventarioForm
                isOpen={isGrupoModalOpen}
                onClose={() => setIsGrupoModalOpen(false)}
                onSaveSuccess={handleGrupoSuccess}
            />
        </div>
    );
};

export default InventarioForm;
