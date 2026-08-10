import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import type { Doctor, Especialidad } from '../types';
import EspecialidadForm from './EspecialidadForm';

interface DoctorFormProps {
    isOpen: boolean;
    onClose: () => void;
    id?: number | null;
    onSaveSuccess: () => void;
}

const DoctorForm: React.FC<DoctorFormProps> = ({ isOpen, onClose, id, onSaveSuccess }) => {
    const isEditing = Boolean(id);

    const [formData, setFormData] = useState({
        paterno: '',
        materno: '',
        nombre: '',
        celular: '',
        direccion: '',
        estado: 'activo',
        idEspecialidad: 0
    });

    const [countryCode, setCountryCode] = useState('+591');
    const [localCelular, setLocalCelular] = useState('');

    const countryCodes = [
        { code: '+591', label: '🇧🇴 +591' },
        { code: '+54', label: '🇦🇷 +54' },
        { code: '+55', label: '🇧🇷 +55' },
        { code: '+56', label: '🇨🇱 +56' },
        { code: '+51', label: '🇵🇪 +51' },
        { code: '+595', label: '🇵🇾 +595' },
        { code: '+598', label: '🇺🇾 +598' },
        { code: '+57', label: '🇨🇴 +57' },
        { code: '+52', label: '🇲🇽 +52' },
        { code: '+34', label: '🇪🇸 +34' },
        { code: '+1', label: '🇺🇸 +1' },
    ];

    const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
    const [isEspecialidadModalOpen, setIsEspecialidadModalOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchEspecialidades();
            if (isEditing && id) {
                fetchDoctor();
            } else {
                setFormData({
                    paterno: '',
                    materno: '',
                    nombre: '',
                    celular: '',
                    direccion: '',
                    estado: 'activo',
                    idEspecialidad: 0
                });
                setCountryCode('+591');
                setLocalCelular('');
            }
        }
    }, [isOpen, id, isEditing]);

    const fetchDoctor = async () => {
        try {
            const response = await api.get<Doctor>(`/doctors/${id}`);
            const data = response.data;
            setFormData({
                ...data,
                idEspecialidad: data.idEspecialidad || 0
            });

            if (data.celular) {
                const foundCode = countryCodes.find(c => data.celular.startsWith(c.code));
                if (foundCode) {
                    setCountryCode(foundCode.code);
                    setLocalCelular(data.celular.substring(foundCode.code.length));
                } else {
                    setCountryCode('+591');
                    setLocalCelular(data.celular);
                }
            } else {
                setCountryCode('+591');
                setLocalCelular('');
            }
        } catch (error) {
            console.error('Error fetching doctor:', error);
            Swal.fire('Error', 'No se pudo cargar el doctor', 'error');
            onClose();
        }
    };

    const fetchEspecialidades = async () => {
        try {
            const response = await api.get<{ data: Especialidad[] }>('/especialidad?limit=100');
            setEspecialidades(response.data.data || []);
        } catch (error) {
            console.error('Error fetching especialidades:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.name === 'idEspecialidad' ? Number(e.target.value) : e.target.value;
        setFormData({
            ...formData,
            [e.target.name]: value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const finalCelular = `${countryCode}${localCelular}`;

            const payload = {
                paterno: formData.paterno,
                materno: formData.materno,
                nombre: formData.nombre,
                celular: finalCelular,
                direccion: formData.direccion,
                estado: formData.estado,
                idEspecialidad: formData.idEspecialidad === 0 ? null : formData.idEspecialidad
            };

            if (isEditing) {
                await api.patch(`/doctors/${id}`, payload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Doctor Actualizado',
                    text: 'Doctor actualizado exitosamente',
                    timer: 1500,
                    showConfirmButton: false,
                });
            } else {
                await api.post('/doctors', payload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Doctor Creado',
                    text: 'Doctor creado exitosamente',
                    timer: 1500,
                    showConfirmButton: false,
                });
            }
            onSaveSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving doctor:', error);
            const errorMessage = error.response?.data?.message || 'Error al guardar el doctor';
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage,
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div
                className="fixed inset-0 bg-black/50 transition-opacity duration-300 opacity-100"
                onClick={onClose}
            ></div>

            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-0 flex flex-col text-gray-800 dark:text-gray-100 border-l border-gray-100 dark:border-gray-700">

                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <span className="p-2.5 bg-indigo-100 dark:bg-indigo-900/60 rounded-xl text-indigo-600 dark:text-indigo-300 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </span>
                        {isEditing ? 'Editar Doctor' : 'Nuevo Doctor'}
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    <form onSubmit={handleSubmit} id="doctor-form" className="space-y-4">
                        <div>
                            <label className="block mb-1 text-sm font-bold text-gray-700 dark:text-gray-300">Apellido Paterno:</label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <input
                                    type="text"
                                    name="paterno"
                                    value={formData.paterno}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 font-medium transition-all"
                                    placeholder="Ej: Pérez"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 text-sm font-bold text-gray-700 dark:text-gray-300">Apellido Materno:</label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <input
                                    type="text"
                                    name="materno"
                                    value={formData.materno}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 font-medium transition-all"
                                    placeholder="Ej: Mamani"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 text-sm font-bold text-gray-700 dark:text-gray-300">Nombres:</label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 font-medium transition-all"
                                    placeholder="Ej: Carlos"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 text-sm font-bold text-gray-700 dark:text-gray-300">Celular:</label>
                            <div className="flex gap-2">
                                <select
                                    value={countryCode}
                                    onChange={(e) => setCountryCode(e.target.value)}
                                    className="w-1/3 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 font-medium cursor-pointer"
                                >
                                    {countryCodes.map((c) => (
                                        <option key={c.code} value={c.code}>
                                            {c.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="relative flex-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <input
                                        type="text"
                                        value={localCelular}
                                        onChange={(e) => setLocalCelular(e.target.value)}
                                        required
                                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 font-medium transition-all"
                                        placeholder="Ej: 71234567"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 text-sm font-bold text-gray-700 dark:text-gray-300">Dirección:</label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <input
                                    type="text"
                                    name="direccion"
                                    value={formData.direccion}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 font-medium transition-all"
                                    placeholder="Ej: Av. 6 de Agosto #123"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 text-sm font-bold text-gray-700 dark:text-gray-300">Especialidad:</label>
                            <div className="flex gap-2 items-stretch">
                                <div className="relative flex-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                    </svg>
                                    <select
                                        name="idEspecialidad"
                                        value={formData.idEspecialidad}
                                        onChange={handleChange}
                                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 font-medium cursor-pointer"
                                    >
                                        <option value={0}>-- Seleccione Especialidad --</option>
                                        {especialidades.map((esp) => (
                                            <option key={esp.id} value={esp.id}>
                                                {esp.especialidad}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsEspecialidadModalOpen(true)}
                                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 rounded-lg flex items-center justify-center transition-all shadow-md text-lg shrink-0 transform hover:-translate-y-0.5 active:scale-95"
                                    title="Nueva Especialidad"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 text-sm font-bold text-gray-700 dark:text-gray-300">Estado:</label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <select
                                    name="estado"
                                    value={formData.estado}
                                    onChange={handleChange}
                                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 font-medium cursor-pointer"
                                >
                                    <option value="activo">Activo</option>
                                    <option value="inactivo">Inactivo</option>
                                </select>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-start gap-3 bg-gray-50 dark:bg-gray-800">
                    <button
                        type="submit"
                        form="doctor-form"
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        {isEditing ? 'Actualizar' : 'Guardar'}
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
            </div>

            <EspecialidadForm
                isOpen={isEspecialidadModalOpen}
                onClose={() => setIsEspecialidadModalOpen(false)}
                onSaveSuccess={() => {
                    fetchEspecialidades();
                    setIsEspecialidadModalOpen(false);
                }}
            />
        </div>
    );
};

export default DoctorForm;
