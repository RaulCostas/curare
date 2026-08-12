import React, { useState } from 'react';
import type { HistoriaClinica } from '../types';

interface HistoriaClinicaListProps {
    historia: HistoriaClinica[];
    allHistoria?: HistoriaClinica[];
    onDelete: (id: number) => void;
    onEdit: (item: HistoriaClinica) => void;
    onNewHistoria?: () => void;
    onViewPlan?: () => void;
    onViewHistorial?: () => void;
    onPlanTiempo?: () => void;
    onPrint?: () => void;
    onReminder?: (item: HistoriaClinica) => void;
}

import { formatDateUTC } from '../utils/formatters';
import ManualModal, { type ManualSection } from './ManualModal';
import ViewMaterialUtilizadoModal from './ViewMaterialUtilizadoModal';
import Pagination from './Pagination';

const HistoriaClinicaList: React.FC<HistoriaClinicaListProps> = ({ historia, allHistoria, onDelete, onEdit, onNewHistoria, onPrint, onViewPlan, onViewHistorial, onReminder, onPlanTiempo }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchAllProformas, setSearchAllProformas] = useState(false);
    const [showManual, setShowManual] = useState(false);
    const [showMaterialModal, setShowMaterialModal] = useState(false);
    const [selectedHistoriaId, setSelectedHistoriaId] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const manualSections: ManualSection[] = [
        {
            title: 'Historia Clínica',
            content: 'Registro detallado de todos los tratamientos realizados al paciente.'
        },
        {
            title: 'Estados',
            content: 'Cada registro muestra el estado del Tratamiento (Terminado/Pendiente) y del Presupuesto (Cobrado/Pendiente).'
        },
        {
            title: 'Acciones',
            content: 'Puede Editar, Eliminar o ver el Material de un registro.'
        },
        {
            title: 'Recordatorio de Tratamiento',
            content: 'Utilice el botón de campana/ícono índigo para programar un recordatorio de seguimiento para un tratamiento específico. Este recordatorio aparecerá en la página de inicio cuando llegue la fecha programada.'
        }
    ];

    const sourceHistory = React.useMemo(() => {
        return (searchAllProformas && allHistoria && allHistoria.length > 0)
            ? allHistoria
            : historia;
    }, [searchAllProformas, allHistoria, historia]);

    const sortedHistoria = React.useMemo(() => {
        return [...sourceHistory].sort((a, b) => {
            const dateA = new Date(a.fecha).getTime();
            const dateB = new Date(b.fecha).getTime();
            return dateA - dateB;
        });
    }, [sourceHistory]);

    const filteredHistoria = sortedHistoria.filter(item => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase().trim();
        const pieza = (item.pieza || '').toLowerCase();
        const tratamiento = (item.tratamiento || '').toLowerCase();
        const proformaNum = (item.proforma?.numero || item.proformaId || '').toString();
        return pieza.includes(term) || tratamiento.includes(term) || proformaNum.includes(term);
    });

    // Pagination
    const totalPages = Math.ceil(filteredHistoria.length / itemsPerPage);
    const paginatedHistoria = filteredHistoria.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset to page 1 when search or mode changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, searchAllProformas]);

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                </div>
                <div>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
                        Historial de Historias Clínicas
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                        Registro de tratamientos realizados, piezas dentales y evolución clínica
                    </p>
                </div>
            </div>

            {/* Search Bar & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-gray-200 dark:border-gray-700 pb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:max-w-xl">
                    <div className="relative flex-grow w-full">
                        <input
                            type="text"
                            placeholder="Buscar por Pieza o Tratamiento..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-300 text-sm"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                            className="px-3.5 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-medium rounded-xl text-sm transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                            title="Limpiar búsqueda"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Limpiar
                        </button>
                    )}
                    <label className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-800 cursor-pointer whitespace-nowrap select-none hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors shadow-sm">
                        <input
                            type="checkbox"
                            checked={searchAllProformas}
                            onChange={(e) => {
                                setSearchAllProformas(e.target.checked);
                                setCurrentPage(1);
                            }}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <span>Buscar en todos los presupuestos</span>
                    </label>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>
                    {onViewPlan && (
                        <button
                            onClick={onViewPlan}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 text-sm cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                            Ver Plan
                        </button>
                    )}
                    {onViewHistorial && (
                        <button
                            onClick={onViewHistorial}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 text-sm cursor-pointer"
                            title="Ver todo el historial del plan de tratamiento seleccionado"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Ver Historial
                        </button>
                    )}
                    <button
                        onClick={onPlanTiempo}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Plan Tiempo
                    </button>
                    {onNewHistoria && (
                        <button
                            onClick={onNewHistoria}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Nueva Historia
                        </button>
                    )}
                    {onPrint && (
                        <button
                            onClick={onPrint}
                            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-bold shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                <rect x="6" y="14" width="12" height="8"></rect>
                            </svg>
                            Imprimir
                        </button>
                    )}
                </div>
            </div>

            <div className="flex justify-between items-center mb-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">
                    Mostrando <span className="text-gray-800 dark:text-gray-200">{filteredHistoria.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredHistoria.length)}</span> de <span>{filteredHistoria.length}</span> registros
                </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Pieza</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tratamiento</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Observaciones</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cant.</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Especialidad</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Doctor</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Asistente</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider"># Hoja</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Est. Trat.</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Est. Presup.</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedHistoria.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{formatDateUTC(item.fecha)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{item.pieza || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 font-medium">
                                    {item.tratamiento || '-'}
                                    {searchAllProformas && item.proformaId && (
                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 border border-blue-200 dark:border-blue-700 shadow-sm">
                                            Plan #{item.proforma?.numero || item.proformaId}
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={item.observaciones}>{item.observaciones || '-'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-600 dark:text-gray-300">{item.cantidad}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                    {item.especialidad ? item.especialidad.especialidad : '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                    {item.doctor ? `${item.doctor.paterno} ${item.doctor.nombre}` : '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                    {item.personal ? `${item.personal.paterno} ${item.personal.nombre}` : '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-600 dark:text-gray-300 font-mono bg-gray-50 dark:bg-gray-700/30 rounded">{item.hoja}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${item.estadoTratamiento === 'terminado'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'
                                        }`}>
                                        {item.estadoTratamiento}
                                    </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${item.estadoPresupuesto === 'terminado'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'
                                        }`}>
                                        {item.estadoPresupuesto}
                                    </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedHistoriaId(item.id);
                                                setShowMaterialModal(true);
                                            }}
                                            className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                            title="Ver Material Utilizado"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                        {onReminder && (
                                            <button
                                                onClick={() => onReminder(item)}
                                                className="p-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                                title="Recordatorio de Tratamiento"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                                </svg>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onEdit(item)}
                                            className="p-1.5 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                            title="Editar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => onDelete(item.id)}
                                            className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                            title="Eliminar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {paginatedHistoria.length === 0 && (
                            <tr>
                                <td colSpan={12} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                                    <div className="flex flex-col items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-lg font-medium">{searchTerm ? 'No se encontraron resultados.' : 'No hay registros en la historia clínica.'}</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

            {/* Manual Modal */}
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Historia Clínica"
                sections={manualSections}
            />

            {/* View Material Utilizado Modal */}
            <ViewMaterialUtilizadoModal
                isOpen={showMaterialModal}
                onClose={() => setShowMaterialModal(false)}
                historiaClinicaId={selectedHistoriaId}
            />
        </div>
    );
};

export default HistoriaClinicaList;
