import React, { useState, useEffect } from 'react';
import api from '../services/api';
import type { Paciente, User } from '../types';
import { formatPaternoMaternoNombre } from '../utils/formatters';

interface CumpleanerosModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CumpleanerosModal: React.FC<CumpleanerosModalProps> = ({ isOpen, onClose }) => {
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [activeTab, setActiveTab] = useState<'pacientes' | 'personal'>('pacientes');

    const [pacientes, setPacientes] = useState<Paciente[]>([]);
    const [personal, setPersonal] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    const meses = [
        { id: 1, nombre: 'Enero' },
        { id: 2, nombre: 'Febrero' },
        { id: 3, nombre: 'Marzo' },
        { id: 4, nombre: 'Abril' },
        { id: 5, nombre: 'Mayo' },
        { id: 6, nombre: 'Junio' },
        { id: 7, nombre: 'Julio' },
        { id: 8, nombre: 'Agosto' },
        { id: 9, nombre: 'Septiembre' },
        { id: 10, nombre: 'Octubre' },
        { id: 11, nombre: 'Noviembre' },
        { id: 12, nombre: 'Diciembre' }
    ];

    useEffect(() => {
        if (isOpen) {
            setSelectedMonth(new Date().getMonth() + 1);
            fetchData();
        }
    }, [isOpen]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch both Pacientes and Personal
            const [pacientesRes, usersRes] = await Promise.all([
                api.get('/pacientes?estado=activo&limit=3000'),
                api.get('/users?estado=activo&limit=1000')
            ]);
            
            const pacientesData = Array.isArray(pacientesRes.data.data) ? pacientesRes.data.data : pacientesRes.data;
            const usersData = Array.isArray(usersRes.data.data) ? usersRes.data.data : usersRes.data;
            
            setPacientes(pacientesData || []);
            setPersonal(usersData || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getBirthMonth = (dateStr?: string) => {
        if (!dateStr) return null;
        // Some dates are YYYY-MM-DD
        const parts = dateStr.split('-');
        if (parts.length >= 2) {
            return parseInt(parts[1], 10);
        }
        return null;
    };
    
    const getBirthDay = (dateStr?: string) => {
        if (!dateStr) return 0;
        const parts = dateStr.split('-');
        if (parts.length >= 3) {
            // Handle time parts if any by just taking the first 2 chars
            return parseInt(parts[2].substring(0, 2), 10);
        }
        return 0;
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        // Format to DD de Mes
        const day = getBirthDay(dateStr);
        const month = getBirthMonth(dateStr);
        if (day && month) {
            const mesNombre = meses.find(m => m.id === month)?.nombre || '';
            return `${day} de ${mesNombre}`;
        }
        return dateStr;
    };

    const getBirthdayDayName = (dateStr?: string) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length >= 3) {
            const year = new Date().getFullYear(); // Current year
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2].substring(0, 2), 10);
            const date = new Date(year, month, day);
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 6) return 'Sábado';
            if (dayOfWeek === 0) return 'Domingo';
        }
        return '';
    };

    const filteredPacientes = pacientes
        .filter(p => getBirthMonth(p.fecha_nacimiento) === selectedMonth)
        .sort((a, b) => getBirthDay(a.fecha_nacimiento) - getBirthDay(b.fecha_nacimiento));

    const filteredPersonal = personal
        .filter(u => getBirthMonth((u as any).fechaNacimiento || (u as any).fecha_nacimiento) === selectedMonth)
        .sort((a, b) => getBirthDay((a as any).fechaNacimiento || (a as any).fecha_nacimiento) - getBirthDay((b as any).fechaNacimiento || (b as any).fecha_nacimiento));

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                    <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                <h3 className="text-xl leading-6 font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2" id="modal-title">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="8" width="18" height="4" rx="1"></rect>
                                        <path d="M12 8v13"></path>
                                        <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"></path>
                                        <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"></path>
                                    </svg>
                                    Cumpleañeros del Mes
                                </h3>

                                <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
                                    {/* Tabs */}
                                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-full sm:w-auto shadow-inner border border-gray-200 dark:border-gray-700">
                                        <button
                                            onClick={() => setActiveTab('pacientes')}
                                            className={`flex-1 sm:flex-none px-6 py-2 rounded-md text-sm font-semibold transition-all duration-300 border-none outline-none ${activeTab === 'pacientes' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md transform scale-105' : 'bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                                        >
                                            Pacientes
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('personal')}
                                            className={`flex-1 sm:flex-none px-6 py-2 rounded-md text-sm font-semibold transition-all duration-300 border-none outline-none ${activeTab === 'personal' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md transform scale-105' : 'bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                                        >
                                            Personal
                                        </button>
                                    </div>

                                    {/* Month Selector */}
                                    <div className="w-full sm:w-auto">
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                                </svg>
                                            </div>
                                            <select
                                                value={selectedMonth}
                                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                                className="w-full sm:w-48 pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm"
                                            >
                                                {meses.map((m) => (
                                                    <option key={m.id} value={m.id}>
                                                        {m.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="py-12 flex justify-center items-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto max-h-[50vh] overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Fecha de Cumpleaños</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Nombre Completo</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Celular</th>
                                                    {activeTab === 'personal' && (
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Rol</th>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                {activeTab === 'pacientes' ? (
                                                    filteredPacientes.length > 0 ? (
                                                        filteredPacientes.map((p) => (
                                                            <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                                                                    <div className="flex items-center gap-2">
                                                                        <span>{formatDate(p.fecha_nacimiento)}</span>
                                                                        {getBirthdayDayName(p.fecha_nacimiento) && (
                                                                            <span className="px-1.5 py-0.5 rounded-md bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                                                                {getBirthdayDayName(p.fecha_nacimiento)}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-medium">
                                                                    {formatPaternoMaternoNombre(p)}
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                                    {p.celular || '-'}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                                                No hay pacientes que cumplan años este mes.
                                                            </td>
                                                        </tr>
                                                    )
                                                ) : (
                                                    filteredPersonal.length > 0 ? (
                                                        filteredPersonal.map((u) => (
                                                            <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                                                                    <div className="flex items-center gap-2">
                                                                        <span>{formatDate((u as any).fechaNacimiento || (u as any).fecha_nacimiento)}</span>
                                                                        {getBirthdayDayName((u as any).fechaNacimiento || (u as any).fecha_nacimiento) && (
                                                                            <span className="px-1.5 py-0.5 rounded-md bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                                                                {getBirthdayDayName((u as any).fechaNacimiento || (u as any).fecha_nacimiento)}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-medium">
                                                                    {u.name || (u as any).nombre}
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                                    {(u as any).celular || (u as any).telefono || '-'}
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                                    <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 text-xs font-semibold capitalize">
                                                                        {(u as any).rol || 'Personal'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                                                No hay personal que cumpla años este mes.
                                                            </td>
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200 dark:border-gray-600">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CumpleanerosModal;
