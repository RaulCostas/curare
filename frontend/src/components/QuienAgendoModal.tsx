import React, { useState, useEffect } from 'react';
import api from '../services/api';
import type { Paciente, User, Agenda } from '../types';
import { formatPaternoMaternoNombre } from '../utils/formatters';

interface QuienAgendoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export interface SearchFilters {
    fechaInicio?: string;
    fechaFinal?: string;
    pacienteId?: number;
    usuarioId?: number;
}

const QuienAgendoModal: React.FC<QuienAgendoModalProps> = ({ isOpen, onClose }) => {
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFinal, setFechaFinal] = useState('');
    const [pacienteId, setPacienteId] = useState<number | undefined>(undefined);
    const [usuarioId, setUsuarioId] = useState<number | undefined>(undefined);

    const [pacientes, setPacientes] = useState<Paciente[]>([]);
    const [usuarios, setUsuarios] = useState<User[]>([]);
    const [results, setResults] = useState<Agenda[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchPacientes();
            fetchUsuarios();
            // Reset state when modal opens
            setShowResults(false);
            setResults([]);
        }
    }, [isOpen]);

    const fetchPacientes = async () => {
        try {
            const response = await api.get('/pacientes?estado=activo&limit=2000');
            const data = Array.isArray(response.data.data) ? response.data.data : response.data;
            setPacientes(data);
        } catch (error) {
            console.error('Error fetching pacientes:', error);
        }
    };

    const fetchUsuarios = async () => {
        try {
            const response = await api.get('/users?estado=activo&limit=1000');
            const data = Array.isArray(response.data.data) ? response.data.data : response.data;
            setUsuarios(data);
        } catch (error) {
            console.error('Error fetching usuarios:', error);
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            let url = '/agenda?';
            const params: string[] = [];

            if (fechaInicio) params.push(`fechaInicio=${fechaInicio}`);
            if (fechaFinal) params.push(`fechaFinal=${fechaFinal}`);
            if (pacienteId) params.push(`pacienteId=${pacienteId}`);
            if (usuarioId) params.push(`usuarioId=${usuarioId}`);

            url += params.join('&');

            const response = await api.get(url);
            const data = Array.isArray(response.data) ? response.data : [];
            setResults(data);
            setShowResults(true);
        } catch (error) {
            console.error('Error searching:', error);
            setResults([]);
            setShowResults(true);
        } finally {
            setLoading(false);
        }
    };

    const handleNewSearch = () => {
        setShowResults(false);
        setResults([]);
        setFechaInicio('');
        setFechaFinal('');
        setPacienteId(undefined);
        setUsuarioId(undefined);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('es-ES');
    };

    const formatTime = (timeStr: string) => {
        if (!timeStr) return '-';
        return timeStr.substring(0, 5);
    };

    const formatDateTime = (dateTimeStr: string) => {
        if (!dateTimeStr) return '-';
        const date = new Date(dateTimeStr);
        return date.toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                    <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4" id="modal-title">
                                    ¿Quién Agendó?
                                </h3>

                                {!showResults ? (
                                    // Search Form
                                    <div className="mt-4 space-y-4">
                                        {/* Date Range */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Fecha Inicio
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                                        </svg>
                                                    </div>
                                                    <input
                                                        type="date"
                                                        value={fechaInicio}
                                                        onChange={(e) => setFechaInicio(e.target.value)}
                                                        className="w-full pl-10 pr-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Fecha Final
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                                        </svg>
                                                    </div>
                                                    <input
                                                        type="date"
                                                        value={fechaFinal}
                                                        onChange={(e) => setFechaFinal(e.target.value)}
                                                        className="w-full pl-10 pr-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Patient Dropdown */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Paciente
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                            <circle cx="12" cy="7" r="4"></circle>
                                                        </svg>
                                                    </div>
                                                    <select
                                                        value={pacienteId || ''}
                                                        onChange={(e) => setPacienteId(e.target.value ? Number(e.target.value) : undefined)}
                                                        className="w-full pl-10 pr-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="">Todos los pacientes</option>
                                                        {pacientes.map((p) => (
                                                            <option key={p.id} value={p.id}>
                                                                {formatPaternoMaternoNombre(p)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* User Dropdown */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Usuario
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                                            <circle cx="8.5" cy="7" r="4"></circle>
                                                            <line x1="20" y1="8" x2="20" y2="14"></line>
                                                            <line x1="23" y1="11" x2="17" y2="11"></line>
                                                        </svg>
                                                    </div>
                                                    <select
                                                        value={usuarioId || ''}
                                                        onChange={(e) => setUsuarioId(e.target.value ? Number(e.target.value) : undefined)}
                                                        className="w-full pl-10 pr-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="">Todos los usuarios</option>
                                                        {usuarios.map((u) => (
                                                            <option key={u.id} value={u.id}>
                                                                {u.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // Results Table
                                    <div className="mt-4">
                                        <div className="mb-4 flex justify-between items-center">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Se encontraron {results.length} resultado(s)
                                            </p>
                                            <button
                                                onClick={handleNewSearch}
                                                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm font-medium transition-colors"
                                            >
                                                Nueva Búsqueda
                                            </button>
                                        </div>

                                        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                                                    <tr>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Usuario</th>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Fecha Agendada</th>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Paciente</th>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Consultorio</th>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Fecha Cita</th>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Hora Cita</th>
                                                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                    {results.length > 0 ? (
                                                        results.map((agenda) => (
                                                            <tr key={agenda.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                                    {agenda.usuario?.name || '-'}
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                                    {formatDateTime(agenda.fechaAgendado)}
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                                    {agenda.paciente ? formatPaternoMaternoNombre(agenda.paciente) : '-'}
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                                    {agenda.consultorio || '-'}
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                                    {formatDate(agenda.fecha)}
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                                    {formatTime(agenda.hora)}
                                                                </td>
                                                                <td className="px-3 py-4 whitespace-nowrap">
                                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${agenda.estado === 'agendado' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                                                        agenda.estado === 'confirmado' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                                            agenda.estado === 'cancelado' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                                                agenda.estado === 'atendido' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' :
                                                                                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                                        }`}>
                                                                        {agenda.estado.toUpperCase()}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={7} className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                                                No se encontraron resultados
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                        {!showResults ? (
                            <>
                                <button
                                    type="button"
                                    onClick={handleSearch}
                                    disabled={loading}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Buscando...' : 'Buscar'}
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-gray-500 text-base font-medium text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-600 dark:border-gray-500 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cerrar
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-gray-500 text-base font-medium text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-600 dark:border-gray-500 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cerrar
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuienAgendoModal;
