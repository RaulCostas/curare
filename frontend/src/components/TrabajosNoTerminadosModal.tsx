import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { TrabajoLaboratorio } from '../types';

interface TrabajosNoTerminadosModalProps {
    isOpen: boolean;
    onClose: () => void;
    trabajos: TrabajoLaboratorio[];
    onEditTrabajo?: (id: number) => void;
}

const TrabajosNoTerminadosModal: React.FC<TrabajosNoTerminadosModalProps> = ({ isOpen, onClose, trabajos, onEditTrabajo }) => {
    const navigate = useNavigate();
    const [modalSearchTerm, setModalSearchTerm] = React.useState('');

    if (!isOpen) return null;

    const pendingJobs = trabajos.filter(t => t.estado !== 'terminado');

    const filteredPendingJobs = pendingJobs.filter(trabajo => {
        const term = modalSearchTerm.toLowerCase();
        const pacienteName = trabajo.paciente ? `${trabajo.paciente.nombre} ${trabajo.paciente.paterno}`.toLowerCase() : '';
        const labName = trabajo.laboratorio?.laboratorio.toLowerCase() || '';
        const trabajoDetail = trabajo.precioLaboratorio?.detalle.toLowerCase() || '';
        return pacienteName.includes(term) || labName.includes(term) || trabajoDetail.includes(term);
    });

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    return (
        <div className="fixed inset-0 z-[9999] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border border-gray-100 dark:border-gray-700">
                    <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2" id="modal-title">
                                    <span className="p-2 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300 rounded-xl">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </span>
                                    Trabajos No Terminados
                                </h3>

                                {/* Search Bar */}
                                <div className="flex items-center gap-2 mb-4 max-w-md">
                                    <div className="relative flex-grow">
                                        <input
                                            type="text"
                                            placeholder="Ej: Buscar por paciente, laboratorio o trabajo..."
                                            value={modalSearchTerm}
                                            onChange={(e) => setModalSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-300 text-sm"
                                        />
                                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                        </svg>
                                    </div>
                                    {modalSearchTerm && (
                                        <button
                                            type="button"
                                            onClick={() => setModalSearchTerm('')}
                                            className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-xl shadow-sm transition-all text-xs flex items-center gap-1 shrink-0 transform hover:-translate-y-0.5 active:scale-95"
                                            title="Limpiar búsqueda"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            Limpiar
                                        </button>
                                    )}
                                </div>

                                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 max-h-[60vh]">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Paciente</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Laboratorio</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Trabajo</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {filteredPendingJobs.length > 0 ? (
                                                filteredPendingJobs.map((trabajo) => (
                                                    <tr key={trabajo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                        <td className="p-3 text-gray-700 dark:text-gray-300 text-sm whitespace-nowrap">{formatDate(trabajo.fecha)}</td>
                                                        <td className="p-3 text-gray-700 dark:text-gray-300 text-sm font-medium whitespace-nowrap">
                                                            {trabajo.paciente ? `${trabajo.paciente.nombre} ${trabajo.paciente.paterno}` : '-'}
                                                        </td>
                                                        <td className="p-3 text-gray-700 dark:text-gray-300 text-sm whitespace-nowrap">
                                                            {trabajo.laboratorio?.laboratorio || '-'}
                                                        </td>
                                                        <td className="p-3 text-gray-700 dark:text-gray-300 text-sm whitespace-nowrap">
                                                            {trabajo.precioLaboratorio?.detalle || '-'}
                                                        </td>
                                                        <td className="p-3 whitespace-nowrap">
                                                            <button
                                                                onClick={() => {
                                                                    onClose();
                                                                    if (onEditTrabajo) {
                                                                        onEditTrabajo(trabajo.id);
                                                                    } else {
                                                                        navigate(`/trabajos-laboratorios`);
                                                                    }
                                                                }}
                                                                className="px-3 py-1 bg-amber-400 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-all transform hover:-translate-y-0.5 active:scale-95 shadow-sm flex items-center gap-1"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                                Editar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="p-4 text-center text-sm text-gray-500 dark:text-gray-400 italic">
                                                        No hay trabajos pendientes que coincidan con la búsqueda.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-start">
                        <button
                            type="button"
                            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2.5 px-5 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm flex items-center gap-2"
                            onClick={onClose}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrabajosNoTerminadosModal;
