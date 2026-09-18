import React, { useState, useMemo } from 'react';
import type { TrabajoLaboratorio } from '../types';
import { formatPaternoMaternoNombre } from '../utils/formatters';
import Pagination from './Pagination';

interface TrabajosObservadosModalProps {
    isOpen: boolean;
    onClose: () => void;
    trabajos: TrabajoLaboratorio[];
    onViewTrabajo?: (id: number) => void;
    onEditTrabajo?: (id: number) => void;
}

const TrabajosObservadosModal: React.FC<TrabajosObservadosModalProps> = ({
    isOpen,
    onClose,
    trabajos,
    onViewTrabajo,
    onEditTrabajo
}) => {
    const [modalSearchTerm, setModalSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const observedJobs = useMemo(() => {
        return (trabajos || []).filter(t => t.traspasado === 'si');
    }, [trabajos]);

    const filteredObservedJobs = useMemo(() => {
        const term = modalSearchTerm.toLowerCase().trim();
        if (!term) return observedJobs;

        return observedJobs.filter(trabajo => {
            const pacienteName = trabajo.paciente ? formatPaternoMaternoNombre(trabajo.paciente).toLowerCase() : '';
            const pacienteCi = trabajo.paciente?.ci?.toLowerCase() || '';
            const labName = trabajo.laboratorio?.laboratorio.toLowerCase() || '';
            const trabajoDetail = trabajo.precioLaboratorio?.detalle.toLowerCase() || '';
            const observacionTraspaso = trabajo.observacion_traspaso?.toLowerCase() || '';
            const observacionGeneral = trabajo.observacion?.toLowerCase() || '';

            return (
                pacienteName.includes(term) ||
                pacienteCi.includes(term) ||
                labName.includes(term) ||
                trabajoDetail.includes(term) ||
                observacionTraspaso.includes(term) ||
                observacionGeneral.includes(term)
            );
        });
    }, [observedJobs, modalSearchTerm]);

    const totalAmount = useMemo(() => {
        return filteredObservedJobs.reduce((sum, t) => sum + (Number(t.total) || 0), 0);
    }, [filteredObservedJobs]);

    // Pagination calculations
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredObservedJobs.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredObservedJobs.length / itemsPerPage);

    const formatMonto = (amount: any): string => {
        const num = Number(amount) || 0;
        return num.toLocaleString('de-DE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        const parts = dateString.split('T')[0].split('-');
        if (parts.length === 3) {
            const [year, month, day] = parts;
            return `${day}/${month}/${year}`;
        }
        return new Date(dateString).toLocaleDateString('es-ES');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9990] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-xs"
                    aria-hidden="true"
                    onClick={onClose}
                ></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full border border-gray-100 dark:border-gray-700">
                    <div className="bg-white dark:bg-gray-800 px-5 pt-5 pb-4 sm:p-6">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <span className="p-2.5 bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 rounded-xl shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </span>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-white" id="modal-title">
                                        Trabajos de Laboratorio Observados
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        Listado de trabajos traspasados / observados que no se pagarán al laboratorio
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-gray-400 bg-transparent hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full transition-all cursor-pointer"
                                title="Cerrar"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Summary Bar & Search */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2 w-full sm:max-w-md">
                                <div className="relative flex-grow">
                                    <input
                                        type="text"
                                        placeholder="Buscar por paciente, laboratorio o motivo..."
                                        value={modalSearchTerm}
                                        onChange={(e) => {
                                            setModalSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 text-sm"
                                    />
                                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                </div>
                                {modalSearchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setModalSearchTerm('');
                                            setCurrentPage(1);
                                        }}
                                        className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-xl shadow-sm transition-all text-xs flex items-center gap-1 shrink-0 transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                                        title="Limpiar búsqueda"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center gap-2 shadow-xs self-end sm:self-auto">
                                <span>Total: <strong>{filteredObservedJobs.length}</strong> trabajos</span>
                                <span>•</span>
                                <span>Monto: <strong>Bs. {formatMonto(totalAmount)}</strong></span>
                            </div>
                        </div>

                        {/* Text showing items count */}
                        <div className="mb-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                            Mostrando {filteredObservedJobs.length === 0 ? 0 : indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredObservedJobs.length)} de {filteredObservedJobs.length} registros
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 max-h-[52vh]">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Paciente</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Laboratorio</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Trabajo / Pieza</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total (Bs)</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Motivo de Observación</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {currentItems.length > 0 ? (
                                        currentItems.map((trabajo, index) => (
                                            <tr key={trabajo.id} className="hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-colors">
                                                <td className="p-3 text-gray-500 dark:text-gray-400 text-xs">{indexOfFirstItem + index + 1}</td>
                                                <td className="p-3 text-gray-700 dark:text-gray-300 whitespace-nowrap text-xs">
                                                    {formatDate(trabajo.fecha)}
                                                </td>
                                                <td className="p-3 text-gray-900 dark:text-gray-100 font-semibold text-xs">
                                                    {trabajo.paciente ? formatPaternoMaternoNombre(trabajo.paciente) : '-'}
                                                </td>
                                                <td className="p-3 text-gray-700 dark:text-gray-300 text-xs">
                                                    {trabajo.laboratorio?.laboratorio || '-'}
                                                </td>
                                                <td className="p-3 text-gray-700 dark:text-gray-300 text-xs">
                                                    <div>{trabajo.precioLaboratorio?.detalle || '-'}</div>
                                                    {trabajo.pieza && (
                                                        <span className="text-[11px] text-gray-500 dark:text-gray-400">Pieza: {trabajo.pieza}</span>
                                                    )}
                                                </td>
                                                <td className="p-3 font-bold text-gray-800 dark:text-gray-200 text-xs whitespace-nowrap text-right">
                                                    Bs. {formatMonto(trabajo.total)}
                                                </td>
                                                <td className="p-3 text-xs max-w-xs">
                                                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 font-medium">
                                                        {trabajo.observacion_traspaso || (
                                                            <span className="italic text-gray-400">Sin motivo registrado</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-3 whitespace-nowrap text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        {onViewTrabajo && (
                                                            <button
                                                                type="button"
                                                                onClick={() => onViewTrabajo(trabajo.id)}
                                                                className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5 cursor-pointer"
                                                                title="Ver Detalles"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                                    <circle cx="12" cy="12" r="3"></circle>
                                                                </svg>
                                                            </button>
                                                        )}
                                                        {onEditTrabajo && (
                                                            <button
                                                                type="button"
                                                                onClick={() => onEditTrabajo(trabajo.id)}
                                                                className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5 cursor-pointer"
                                                                title="Editar Trabajo"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={8} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <span className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-400">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                    </span>
                                                    <span className="font-medium text-sm">
                                                        {modalSearchTerm
                                                            ? 'No se encontraron trabajos observados con ese criterio de búsqueda.'
                                                            : 'No existen trabajos observados registrados.'}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        )}

                        {/* Modal Footer */}
                        <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-5 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm cursor-pointer"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrabajosObservadosModal;
