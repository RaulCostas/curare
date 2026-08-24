import React, { useState, useEffect } from 'react';
import api from '../services/api';
import type { Personal, Paciente } from '../types';
import Swal from 'sweetalert2';
import ManualModal, { type ManualSection } from './ManualModal';
import { getLocalDateString } from '../utils/dateUtils';

interface CalificacionFormProps {
    isOpen: boolean;
    onClose: () => void;
    id?: number | null;
    onSaveSuccess: () => void;
}

const CalificacionForm: React.FC<CalificacionFormProps> = ({ isOpen, onClose, id, onSaveSuccess }) => {
    const isEditing = Boolean(id);

    const [formData, setFormData] = useState({
        personalId: 0,
        pacienteId: 0,
        consultorio: 1,
        calificacion: 'Bueno' as 'Malo' | 'Regular' | 'Bueno',
        fecha: getLocalDateString(),
        observaciones: '',
        evaluadorId: 0
    });

    const [personal, setPersonal] = useState<Personal[]>([]);
    const [pacientes, setPacientes] = useState<Paciente[]>([]);
    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Calificaciones de Personal',
            content: 'Registre evaluaciones del personal por parte de pacientes. Califique el servicio como Malo, Regular o Bueno para seguimiento de calidad.'
        },
        {
            title: 'Consultorio y Fecha',
            content: 'Indique el consultorio (1-5) donde se brindó el servicio y la fecha de la evaluación para análisis estadístico.'
        },
        {
            title: 'Observaciones',
            content: 'Agregue comentarios adicionales para proporcionar contexto sobre la calificación y mejorar el servicio.'
        }
    ];

    useEffect(() => {
        if (!isOpen) return;

        fetchPersonal();
        fetchPacientes();
        getCurrentUser();
        if (isEditing && id) {
            fetchCalificacion(id);
        } else {
            setFormData({
                personalId: 0,
                pacienteId: 0,
                consultorio: 1,
                calificacion: 'Bueno',
                fecha: getLocalDateString(),
                observaciones: '',
                evaluadorId: 0
            });
            getCurrentUser();
        }
    }, [isOpen, id, isEditing]);

    const getCurrentUser = () => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setFormData(prev => ({ ...prev, evaluadorId: user.id }));
        }
    };

    const fetchPersonal = async () => {
        try {
            const response = await api.get('/personal?limit=1000');
            const activePersonal = (response.data.data || []).filter((person: any) => person.estado === 'activo');
            const sortedPersonal = activePersonal.sort((a: any, b: any) => {
                const nameA = `${a.paterno || ''} ${a.materno || ''} ${a.nombre || ''}`.trim().toLowerCase();
                const nameB = `${b.paterno || ''} ${b.materno || ''} ${b.nombre || ''}`.trim().toLowerCase();
                return nameA.localeCompare(nameB);
            });
            setPersonal(sortedPersonal);
        } catch (error) {
            console.error('Error fetching personal:', error);
        }
    };

    const fetchPacientes = async () => {
        try {
            const response = await api.get('/pacientes?limit=1000');
            const activePacientes = (response.data.data || []).filter((p: any) => p.estado === 'activo');
            const sortedPacientes = activePacientes.sort((a: any, b: any) => {
                const nameA = `${a.paterno || ''} ${a.materno || ''} ${a.nombre || ''}`.trim().toLowerCase();
                const nameB = `${b.paterno || ''} ${b.materno || ''} ${b.nombre || ''}`.trim().toLowerCase();
                return nameA.localeCompare(nameB);
            });
            setPacientes(sortedPacientes);
        } catch (error) {
            console.error('Error fetching pacientes:', error);
        }
    };

    const fetchCalificacion = async (calId: number) => {
        try {
            const response = await api.get(`/calificacion/${calId}`);
            const cal = response.data;
            setFormData({
                personalId: cal.personalId,
                pacienteId: cal.pacienteId,
                consultorio: cal.consultorio,
                calificacion: cal.calificacion,
                fecha: cal.fecha.split('T')[0],
                observaciones: cal.observaciones || '',
                evaluadorId: cal.evaluadorId
            });
        } catch (error) {
            console.error('Error fetching calificacion:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.personalId || formData.personalId === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Campo requerido',
                text: 'Por favor seleccione el personal'
            });
            return;
        }

        if (!formData.pacienteId || formData.pacienteId === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Campo requerido',
                text: 'Por favor seleccione el paciente'
            });
            return;
        }

        try {
            if (isEditing && id) {
                await api.patch(`/calificacion/${id}`, formData);
                await Swal.fire({
                    icon: 'success',
                    title: 'Actualizado',
                    text: 'Calificación actualizada exitosamente',
                    showConfirmButton: false,
                    timer: 1500
                });
            } else {
                await api.post('/calificacion', formData);
                await Swal.fire({
                    icon: 'success',
                    title: 'Guardado',
                    text: 'Calificación guardada exitosamente',
                    showConfirmButton: false,
                    timer: 1500
                });
            }
            onSaveSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving calificacion:', error);
            const errorMessage = error.response?.data?.message || 'No se pudo guardar la calificación';
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage
            });
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'personalId' || name === 'pacienteId' || name === 'consultorio' || name === 'evaluadorId'
                ? Number(value)
                : value
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000] p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-[600px] max-w-[95%] max-h-[90vh] overflow-y-auto shadow-2xl text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-700 pb-3">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <span className="p-2.5 bg-purple-100 dark:bg-purple-900/60 rounded-xl text-purple-600 dark:text-purple-300 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                        </span>
                        {isEditing ? 'Editar Calificación' : 'Nueva Calificación'}
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
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Personal:</label>
                            <div className="relative">
                                <select
                                    name="personalId"
                                    value={formData.personalId}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                                >
                                    <option value={0}>-- Seleccione Personal --</option>
                                    {personal.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {`${p.paterno} ${p.materno} ${p.nombre}`.trim()}
                                        </option>
                                    ))}
                                </select>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 absolute left-3 top-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Paciente:</label>
                            <div className="relative">
                                <select
                                    name="pacienteId"
                                    value={formData.pacienteId}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                                >
                                    <option value={0}>-- Seleccione Paciente --</option>
                                    {pacientes.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {`${p.paterno} ${p.materno} ${p.nombre}`.trim()}
                                        </option>
                                    ))}
                                </select>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 absolute left-3 top-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Consultorio:</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="consultorio"
                                    value={formData.consultorio || ''}
                                    onChange={handleChange}
                                    min={1}
                                    max={5}
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium"
                                    placeholder="Ej: 1"
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Fecha:</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    name="fecha"
                                    value={formData.fecha}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium"
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block mb-2 font-bold text-sm text-gray-700 dark:text-gray-300">Calificación:</label>
                        <div className="flex gap-4">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="calificacion"
                                    value="Malo"
                                    checked={formData.calificacion === 'Malo'}
                                    onChange={handleChange}
                                    className="mr-2"
                                />
                                <span className="px-4 py-1.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300 font-semibold text-sm">
                                    Malo
                                </span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="calificacion"
                                    value="Regular"
                                    checked={formData.calificacion === 'Regular'}
                                    onChange={handleChange}
                                    className="mr-2"
                                />
                                <span className="px-4 py-1.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-300 font-semibold text-sm">
                                    Regular
                                </span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="calificacion"
                                    value="Bueno"
                                    checked={formData.calificacion === 'Bueno'}
                                    onChange={handleChange}
                                    className="mr-2"
                                />
                                <span className="px-4 py-1.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300 font-semibold text-sm">
                                    Bueno
                                </span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Observaciones:</label>
                        <div className="relative">
                            <textarea
                                name="observaciones"
                                value={formData.observaciones}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Ej: Excelente atención brindada al paciente durante el tratamiento"
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium"
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
                title="Manual - Calificaciones"
                sections={manualSections}
            />
        </div>
    );
};

export default CalificacionForm;
