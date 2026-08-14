import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import type { User } from '../types';

interface CorreosFormProps {
    currentUser: User | null;
    onClose: () => void;
}

const CorreosForm: React.FC<CorreosFormProps> = ({ currentUser, onClose }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [destinatarioId, setDestinatarioId] = useState<number | ''>('');
    const [copiaId, setCopiaId] = useState<number | ''>('');
    const [asunto, setAsunto] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            const activeUsers = response.data.filter((u: User) => u.estado?.toLowerCase() === 'activo');
            setUsers(activeUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !destinatarioId) return;

        setSending(true);
        try {
            await api.post('/correos', {
                remitente_id: currentUser.id,
                destinatario_id: Number(destinatarioId),
                copia_id: copiaId ? Number(copiaId) : undefined,
                asunto,
                mensaje
            });
            await Swal.fire({
                icon: 'success',
                title: 'Correo Enviado',
                text: 'El correo ha sido enviado exitosamente',
                timer: 1500,
                showConfirmButton: false
            });
            onClose();
        } catch (error) {
            console.error('Error sending email:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al enviar el correo.'
            });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full transform transition-all border border-gray-200 dark:border-gray-700 max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 rounded-t-2xl">
                    <div>
                        <h3 className="text-xl font-extrabold text-gray-800 dark:text-white flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Nuevo Mensaje
                        </h3>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto">
                    {/* From (Read-only) */}
                    <div className="mb-4">
                        <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">De:</label>
                        <div className="w-full text-gray-800 font-semibold bg-gray-100 dark:bg-gray-600 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-500 text-sm">
                            {currentUser?.name} &lt;{currentUser?.email}&gt;
                        </div>
                    </div>

                    {/* To */}
                    <div className="mb-4">
                        <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Para <span className="text-red-500">*</span>:</label>
                        <select
                            value={destinatarioId}
                            onChange={(e) => setDestinatarioId(Number(e.target.value))}
                            required
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500"
                        >
                            <option value="">Seleccionar destinatario...</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.name} ({user.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* CC */}
                    <div className="mb-4">
                        <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Copia:</label>
                        <select
                            value={copiaId}
                            onChange={(e) => setCopiaId(e.target.value ? Number(e.target.value) : '')}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500"
                        >
                            <option value="">(Opcional) Seleccionar copia...</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.name} ({user.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Subject */}
                    <div className="mb-4">
                        <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Asunto <span className="text-red-500">*</span>:</label>
                        <div className="relative w-full">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={asunto}
                                onChange={(e) => setAsunto(e.target.value)}
                                required
                                placeholder="Asunto del correo"
                                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Message Body */}
                    <div className="mb-4 flex-1 flex flex-col">
                        <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Mensaje <span className="text-red-500">*</span>:</label>
                        <div className="relative flex-1 w-full">
                            <div className="absolute top-3 left-0 pl-3 pointer-events-none text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </div>
                            <textarea
                                value={mensaje}
                                onChange={(e) => setMensaje(e.target.value)}
                                required
                                placeholder="Escribe tu mensaje aquí..."
                                className="w-full h-48 sm:h-64 pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 resize-none"
                            />
                        </div>
                    </div>

                    <div className="mt-4 sm:mt-6 flex flex-wrap justify-start gap-2 sm:gap-3">
                        <button
                            type="submit"
                            disabled={sending}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 rounded-lg font-bold flex items-center transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm shadow-md"
                        >
                            {sending ? 'Enviando...' : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                    Enviar
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 sm:px-6 py-2 rounded-lg font-bold flex items-center transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CorreosForm;
