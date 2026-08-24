import React, { useState, useEffect } from 'react';
import api from '../services/api';
import type { Musica } from '../types';
import Pagination from './Pagination';
import Swal from 'sweetalert2';

const MusicaList: React.FC = () => {
    const [musicas, setMusicas] = useState<Musica[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalRecords, setTotalRecords] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ musica: '', estado: 'activo' });

    const limit = 10;

    useEffect(() => {
        fetchMusicas();
    }, [searchTerm, currentPage]);

    const fetchMusicas = async () => {
        try {
            const response = await api.get('/musica');
            let allMusicas = Array.isArray(response.data) ? response.data : [];

            // Filter by search term
            if (searchTerm) {
                allMusicas = allMusicas.filter((musica: Musica) =>
                    musica.musica.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }

            // Calculate pagination
            const total = allMusicas.length;
            const pages = Math.ceil(total / limit);
            const startIndex = (currentPage - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedMusicas = allMusicas.slice(startIndex, endIndex);

            setMusicas(paginatedMusicas);
            setTotalPages(pages);
            setTotalRecords(total);
        } catch (error) {
            console.error('Error fetching musicas:', error);
            setMusicas([]);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Dar de baja música?',
            text: 'La música pasará a estado Inactivo sin eliminar el registro.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, dar de baja',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.patch(`/musica/${id}`, { estado: 'inactivo' });
                await Swal.fire({
                    icon: 'success',
                    title: '¡Música dada de baja!',
                    showConfirmButton: false,
                    timer: 1500
                });
                fetchMusicas();
            } catch (error) {
                console.error('Error al dar de baja música:', error);
                Swal.fire('Error', 'No se pudo dar de baja la música', 'error');
            }
        }
    };

    const handleReactivate = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Reactivar música?',
            text: 'La música volverá a estado Activo.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, reactivar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.patch(`/musica/${id}`, { estado: 'activo' });
                await Swal.fire({
                    icon: 'success',
                    title: '¡Música reactivada!',
                    showConfirmButton: false,
                    timer: 1500
                });
                fetchMusicas();
            } catch (error) {
                console.error('Error al reactivar música:', error);
                Swal.fire('Error', 'No se pudo reactivar la música', 'error');
            }
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        setCurrentPage(1);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleNewClick = () => {
        setEditingId(null);
        setFormData({ musica: '', estado: 'activo' });
        setShowForm(true);
    };

    const handleEditClick = async (id: number) => {
        try {
            const response = await api.get(`/musica/${id}`);
            setFormData({
                musica: response.data.musica,
                estado: response.data.estado
            });
            setEditingId(id);
            setShowForm(true);
        } catch (error) {
            console.error('Error loading musica:', error);
            Swal.fire('Error', 'No se pudo cargar la música', 'error');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.musica.trim()) {
            Swal.fire('Error', 'El nombre de la música es requerido', 'error');
            return;
        }

        try {
            if (editingId) {
                await api.patch(`/musica/${editingId}`, formData);
                await Swal.fire({
                    icon: 'success',
                    title: '¡Música actualizada!',
                    showConfirmButton: false,
                    timer: 1500
                });
            } else {
                await api.post('/musica', formData);
                await Swal.fire({
                    icon: 'success',
                    title: '¡Música creada!',
                    showConfirmButton: false,
                    timer: 1500
                });
            }
            setShowForm(false);
            setFormData({ musica: '', estado: 'activo' });
            setEditingId(null);
            fetchMusicas();
        } catch (error: any) {
            console.error('Error saving musica:', error);
            const message = error.response?.data?.message || 'No se pudo guardar la música';
            Swal.fire('Error', message, 'error');
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setFormData({ musica: '', estado: 'activo' });
        setEditingId(null);
    };

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-2xl shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 .895-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 .895-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-2xl font-extrabold text-gray-800 dark:text-white tracking-tight">
                            Gestión de Música
                        </h3>
                        <button
                            type="button"
                            onClick={() => { setShowForm(false); setEditingId(null); }}
                            className="text-gray-400 bg-transparent hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full transition-all"
                            title="Cerrar"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                            Preferencias de géneros musicales para el confort del paciente
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleNewClick}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5"
                >
                    <span className="text-xl">+</span> Nueva Música
                </button>
            </div>

            {/* Search Bar */}
            <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                <div className="flex items-center gap-2 max-w-md w-full">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Buscar música..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors text-sm"
                        />
                        <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                    {searchTerm && (
                        <button
                            onClick={handleClearSearch}
                            className="px-3.5 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-medium rounded-xl text-sm transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                            title="Limpiar búsqueda"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Limpiar
                        </button>
                    )}
                </div>
            </div>

            <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                Mostrando {totalRecords === 0 ? 0 : (currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, totalRecords)} de {totalRecords} registros
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Música</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {Array.isArray(musicas) && musicas.map((musica, index) => (
                            <tr key={musica.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="p-3 text-gray-700 dark:text-gray-300">{(currentPage - 1) * limit + index + 1}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300 font-medium">{musica.musica}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-sm font-medium ${musica.estado === 'activo'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                        }`}>
                                        {musica.estado}
                                    </span>
                                </td>
                                <td className="p-3 flex gap-2">
                                    <button
                                        onClick={() => handleEditClick(musica.id)}
                                        className="p-2 bg-amber-400 hover:bg-amber-500 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                        title="Editar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                    </button>
                                    {musica.estado === 'activo' ? (
                                        <button
                                            onClick={() => handleDelete(musica.id)}
                                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                            title="Dar de baja"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                                            </svg>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleReactivate(musica.id)}
                                            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                            title="Reactivar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {(!musicas || musicas.length === 0) && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-gray-400 italic">No hay música registrada</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="mt-6">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </div>
            )}

            {/* Modal Form for Musica */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000] p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-[500px] max-w-[95%] max-h-[90vh] overflow-y-auto shadow-2xl text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-700 pb-3">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                                <span className="p-2.5 bg-blue-100 dark:bg-blue-900/60 rounded-xl text-blue-600 dark:text-blue-300 shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 18V5l12-2v13"></path>
                                        <circle cx="6" cy="18" r="3"></circle>
                                        <circle cx="18" cy="16" r="3"></circle>
                                    </svg>
                                </span>
                                {editingId ? 'Editar Música' : 'Nueva Música'}
                            </h3>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">
                                    Nombre de la Música:
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                            <path d="M9 18V5l12-2v13"></path>
                                            <circle cx="6" cy="18" r="3"></circle>
                                            <circle cx="18" cy="16" r="3"></circle>
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.musica}
                                        onChange={(e) => setFormData({ ...formData, musica: e.target.value })}
                                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium text-sm"
                                        placeholder="Ej: Rock, Pop, Clásica..."
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">
                                    Estado:
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="12" y1="8" x2="12" y2="12"></line>
                                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                        </svg>
                                    </div>
                                    <select
                                        value={formData.estado}
                                        onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium cursor-pointer text-sm"
                                    >
                                        <option value="activo">Activo</option>
                                        <option value="inactivo">Inactivo</option>
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
                                    {editingId ? 'Actualizar' : 'Guardar'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancel}
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
                </div>
            )}
        </div>
    );
};

export default MusicaList;
