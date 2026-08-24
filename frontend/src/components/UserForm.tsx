import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import type { CreateUserDto } from '../types';
import ManualModal, { type ManualSection } from './ManualModal';

interface UserFormProps {
    isOpen: boolean;
    onClose: () => void;
    id?: number | null;
    onSaveSuccess: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ isOpen, onClose, id, onSaveSuccess }) => {
    const [formData, setFormData] = useState<CreateUserDto>({
        name: '',
        email: '',
        password: '',
        estado: 'Activo',
        recepcionista: false,
        codigo_proforma: undefined,
    });
    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Gestión de Usuarios',
            content: 'Cree y administre cuentas de usuario del sistema. Configure permisos, roles y acceso a diferentes módulos de la aplicación.'
        },
        {
            title: 'Recepcionista y Código Proforma',
            content: 'Marque como recepcionista para acceso limitado. El código proforma (4 dígitos) identifica al usuario que aprueba presupuestos.'
        },
        {
            title: 'Seguridad',
            content: 'Al editar, deje la contraseña en blanco para mantener la actual. Las contraseñas se almacenan de forma segura.'
        }
    ];

    useEffect(() => {
        if (isOpen) {
            if (id) {
                fetchUser(id);
            } else {
                setFormData({
                    name: '',
                    email: '',
                    password: '',
                    estado: 'Activo',
                    recepcionista: false,
                    codigo_proforma: undefined,
                    foto: ''
                });
            }
        }
    }, [isOpen, id]);

    const fetchUser = async (userId: number) => {
        try {
            const response = await api.get(`/users/${userId}`);
            const { name, email, estado, foto, recepcionista, codigo_proforma } = response.data;
            setFormData({ name, email, estado, foto, recepcionista, codigo_proforma, password: '' });
        } catch (error) {
            console.error('Error fetching user:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (id) {
                let patchPayload: Partial<CreateUserDto>;
                if (!formData.password) {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { password: _pw, ...rest } = formData;
                    patchPayload = rest;
                } else {
                    patchPayload = { ...formData };
                }
                await api.patch(`/users/${id}`, patchPayload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Usuario Actualizado',
                    text: 'El usuario se actualizó correctamente',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                await api.post('/users', formData);
                await Swal.fire({
                    icon: 'success',
                    title: 'Usuario Creado',
                    text: 'El usuario se creó correctamente',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
            onSaveSuccess();
        } catch (error: any) {
            console.error('Error saving user:', error);
            const msg = error.response?.data?.message || 'Error al guardar el usuario';
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: Array.isArray(msg) ? msg.join(', ') : msg
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000] p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-[580px] max-w-[95%] max-h-[90vh] overflow-y-auto shadow-2xl text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-700 pb-3">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <span className="p-2.5 bg-indigo-100 dark:bg-indigo-900/60 rounded-xl text-indigo-600 dark:text-indigo-300 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </span>
                        {id ? 'Editar Usuario' : 'Nuevo Usuario'}
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
                <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                    {/* Dummy hidden inputs to prevent Chrome password manager autofill */}
                    <input type="text" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />
                    <input type="password" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />

                    <div>
                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Nombre Completo:</label>
                        <div className="relative">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                autoComplete="off"
                                placeholder="Ej: Juan Pérez"
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Email:</label>
                        <div className="relative">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                autoComplete="new-username"
                                placeholder="Ej: usuario@clinica.com"
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Contraseña:</label>
                        <div className="relative">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required={!id}
                                autoComplete="new-password"
                                placeholder={id ? 'Dejar en blanco para mantener actual' : 'Ej: ********'}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 font-medium"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Foto:</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        setFormData({ ...formData, foto: reader.result as string });
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }}
                            className="w-full p-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/40 dark:file:text-blue-300"
                        />
                        {formData.foto && (
                            <div className="mt-3 flex items-center gap-3">
                                <img src={formData.foto} alt="Vista previa" className="w-16 h-16 rounded-xl object-cover border border-gray-200 dark:border-gray-600 shadow-sm" />
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, foto: '' })}
                                    className="text-red-500 hover:text-red-700 text-xs font-bold border-none bg-transparent cursor-pointer"
                                >
                                    Eliminar foto
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Recepcionista:</label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <select
                                    name="recepcionista"
                                    value={formData.recepcionista ? 'true' : 'false'}
                                    onChange={(e) => setFormData({ ...formData, recepcionista: e.target.value === 'true' })}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                                >
                                    <option value="false">No</option>
                                    <option value="true">Sí</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Código Proforma (4 dígitos):</label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <input
                                    type="number"
                                    name="codigo_proforma"
                                    value={formData.codigo_proforma || ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val.length <= 4) {
                                            setFormData({ ...formData, codigo_proforma: val ? Number(val) : undefined });
                                        }
                                    }}
                                    placeholder="Ej: 1234"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Estado:</label>
                        <div className="relative">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <select
                                name="estado"
                                value={formData.estado}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                            >
                                <option value="Activo">Activo</option>
                                <option value="Inactivo">Inactivo</option>
                            </select>
                        </div>
                    </div>
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-start gap-3 mt-6">
                        <button
                            type="submit"
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                <polyline points="7 3 7 8 15 8"></polyline>
                            </svg>
                            {id ? 'Actualizar' : 'Guardar'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2.5 px-5 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 text-sm"
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
                title="Manual - Usuarios"
                sections={manualSections}
            />
        </div>
    );
};

export default UserForm;
