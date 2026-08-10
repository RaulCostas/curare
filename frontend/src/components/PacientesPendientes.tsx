import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Pagination from './Pagination';
import ManualModal, { type ManualSection } from './ManualModal';
import { Clock, X } from 'lucide-react';
import type { Doctor, Especialidad } from '../types';

interface PacientePendiente {
    id: number;
    nombre: string;
    paterno: string;
    materno: string;
    celular: string;
    ultima_cita: string | null;
    ultimo_doctor: string | null;
    ultimo_tratamiento: string | null;
    ultima_especialidad: string | null;
    numero_presupuesto: number | null;
}

const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
};

const formatFullName = (paterno: string | null, materno: string | null, nombre: string | null) => {
    return [paterno, materno, nombre].filter(Boolean).join(' ') || '-';
};

const PacientesPendientes: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'no_agendados' | 'agendados'>('no_agendados');
    const [pacientes, setPacientes] = useState<PacientePendiente[]>([]);
    const [loading, setLoading] = useState(true);
    const [showManual, setShowManual] = useState(false);

    // Filters
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<string>('');
    const [selectedEspecialidad, setSelectedEspecialidad] = useState<string>('');

    // Search
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const manualSections: ManualSection[] = [
        {
            title: '¿Qué son los Pacientes Pendientes?',
            content: 'Son pacientes que tienen al menos un registro en Historia Clínica con "Estado Presupuesto = No Terminado", lo que indica que aún tienen un tratamiento o presupuesto en proceso.'
        },
        {
            title: 'Pestaña: No Agendados',
            content: 'Muestra pacientes con presupuesto no terminado que NO tienen ninguna cita futura agendada. Son candidatos prioritarios para ser contactados y reagendados.'
        },
        {
            title: 'Pestaña: Agendados',
            content: 'Muestra pacientes con presupuesto no terminado que SÍ tienen al menos una cita futura agendada. Están en seguimiento activo.'
        },
        {
            title: 'Filtros por Doctor y Especialidad',
            content: 'Use los filtros desplegables para ver sólo los pacientes pendientes de un doctor o especialidad específica.'
        },
        {
            title: 'Búsqueda por Paciente',
            content: 'Escriba el nombre o apellido del paciente en el buscador para filtrar la lista. Haga clic en "Limpiar" para restablecer la búsqueda.'
        }
    ];

    useEffect(() => {
        fetchFilters();
    }, []);

    useEffect(() => {
        fetchPacientes();
    }, [activeTab, selectedDoctor, selectedEspecialidad]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, selectedDoctor, selectedEspecialidad, searchTerm]);

    const fetchFilters = async () => {
        try {
            const [doctorsRes, especialidadesRes] = await Promise.all([
                api.get('/doctors?limit=100'),
                api.get('/especialidad?limit=100')
            ]);
            const activeDoctors = (doctorsRes.data.data || []).filter((doctor: any) => doctor.estado === 'activo');
            const activeEspecialidades = (especialidadesRes.data.data || []).filter((esp: any) => esp.estado === 'activo');
            setDoctors(activeDoctors);
            setEspecialidades(activeEspecialidades);
        } catch (error) {
            console.error('Error fetching filters:', error);
        }
    };

    const fetchPacientes = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('tab', activeTab);
            if (selectedDoctor) params.append('doctorId', selectedDoctor);
            if (selectedEspecialidad) params.append('especialidadId', selectedEspecialidad);

            const response = await api.get<PacientePendiente[]>(`/pacientes/pendientes?${params.toString()}`);
            setPacientes(response.data);
        } catch (error) {
            console.error('Error fetching pacientes pendientes:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter by search term (Paterno Materno Nombre)
    const filteredPacientes = pacientes
        .filter(p => {
            if (!searchTerm) return true;
            const fullName = `${p.paterno || ''} ${p.materno || ''} ${p.nombre || ''}`.toLowerCase();
            return fullName.includes(searchTerm.toLowerCase());
        })
        .sort((a, b) => {
            const nameA = `${a.paterno || ''} ${a.materno || ''} ${a.nombre || ''}`.toLowerCase();
            const nameB = `${b.paterno || ''} ${b.materno || ''} ${b.nombre || ''}`.toLowerCase();
            return nameA.localeCompare(nameB);
        });

    // Pagination
    const totalItems = filteredPacientes.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedPacientes = filteredPacientes.slice(startIndex, startIndex + itemsPerPage);

    const tabs = [
        { id: 'no_agendados', label: 'No Agendados' },
        { id: 'agendados', label: 'Agendados' },
    ];

    return (
        <div className="content-card">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 no-print gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 rounded-2xl shadow-sm">
                        <Clock className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
                            Pacientes Pendientes
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                            Pacientes con presupuesto no terminado, agendados y no agendados
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    <button
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="no-print flex flex-wrap border-b border-gray-200 dark:border-gray-600 mb-5 bg-white dark:bg-gray-800 rounded-t-lg pt-2 px-2 transition-colors">
                {tabs.map(tab => (
                    <div
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-5 py-2.5 cursor-pointer border-b-4 flex items-center gap-2 transition-all duration-200 text-base ${activeTab === tab.id
                            ? 'border-blue-500 text-blue-500 font-bold dark:border-blue-400 dark:text-blue-400'
                            : 'border-transparent text-gray-600 dark:text-gray-400 font-normal hover:text-blue-500 dark:hover:text-blue-300'
                            }`}
                    >
                        {tab.id === 'no_agendados' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="8.5" cy="7" r="4"></circle>
                                <line x1="18" y1="8" x2="23" y2="13"></line>
                                <line x1="23" y1="8" x2="18" y2="13"></line>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                                <path d="M9 16l2 2 4-4"></path>
                            </svg>
                        )}
                        {tab.label}
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-colors no-print">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Doctor</label>
                    <select
                        value={selectedDoctor}
                        onChange={(e) => setSelectedDoctor(e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none focus:border-blue-500 text-sm"
                    >
                        <option value="">Todos</option>
                        {doctors.map(d => (
                            <option key={d.id} value={d.id}>
                                {d.paterno} {d.materno} {d.nombre}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Especialidad</label>
                    <select
                        value={selectedEspecialidad}
                        onChange={(e) => setSelectedEspecialidad(e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none focus:border-blue-500 text-sm"
                    >
                        <option value="">Todas</option>
                        {especialidades.map(e => (
                            <option key={e.id} value={e.id}>
                                {e.especialidad}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Search */}
            <div className="mb-5 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 no-print flex items-center gap-2 transition-colors">
                <div className="relative flex-grow max-w-md">
                    <input
                        type="text"
                        placeholder="Buscar por paciente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-300 text-sm"
                    />
                    <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </div>
                {searchTerm && (
                    <button
                        type="button"
                        onClick={() => {
                            setSearchTerm('');
                            setCurrentPage(1);
                        }}
                        className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg shadow-sm transition-all text-xs flex items-center gap-1 shrink-0"
                    >
                        <X size={14} />
                        <span>Limpiar</span>
                    </button>
                )}
            </div>

            {/* Showing status */}
            <div className="mb-3 text-sm text-gray-500 dark:text-gray-400 no-print">
                Mostrando {totalItems === 0 ? 0 : startIndex + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} registros
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto transition-colors">
                {loading ? (
                    <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Cargando...</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Última Cita</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider"># Pres.</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Paciente</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Doctor</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Último Tratamiento</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Especialidad</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {paginatedPacientes.length > 0 ? (
                                paginatedPacientes.map((p, index) => (
                                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                                            {startIndex + index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(p.ultima_cita)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-200">
                                            {p.numero_presupuesto || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {formatFullName(p.paterno, p.materno, p.nombre)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {p.ultimo_doctor || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={p.ultimo_tratamiento || ''}>
                                            {p.ultimo_tratamiento || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {p.ultima_especialidad || '-'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400 italic">
                                        No se encontraron pacientes.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-4 no-print">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            {/* Manual Modal */}
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual - Pacientes Pendientes"
                sections={manualSections}
            />
        </div>
    );
};

export default PacientesPendientes;
