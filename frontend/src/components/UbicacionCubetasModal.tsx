
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import type { TrabajoLaboratorio } from '../types';

interface UbicacionCubetasModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const UbicacionCubetasModal: React.FC<UbicacionCubetasModalProps> = ({ isOpen, onClose }) => {
    const [trabajosFuera, setTrabajosFuera] = useState<TrabajoLaboratorio[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchTrabajosConCubetas();
        }
    }, [isOpen]);

    const fetchTrabajosConCubetas = async () => {
        setLoading(true);
        try {
            // 1. Fetch ALL Cubetas that are 'FUERA'
            const cubetasResponse = await api.get('/cubetas?dentro_fuera=FUERA&limit=1000');
            const cubetasFueraData = Array.isArray(cubetasResponse.data.data) ? cubetasResponse.data.data : cubetasResponse.data;
            console.log('🔍 DEBUG: Cubetas FUERA:', cubetasFueraData);
            console.log('🔍 DEBUG: First cubeta full object:', JSON.stringify(cubetasFueraData[0], null, 2));

            // 2. Fetch recent jobs to try to link, just in case valuable info is there
            const trabajosResponse = await api.get('/trabajos-laboratorios?limit=3000');
            const jobs = Array.isArray(trabajosResponse.data.data) ? trabajosResponse.data.data : trabajosResponse.data;
            console.log('🔍 DEBUG: Total jobs fetched:', jobs.length);
            console.log('🔍 DEBUG: First job full object:', JSON.stringify(jobs[0], null, 2));
            console.log('🔍 DEBUG: All job idCubeta values:', jobs.map((j: any) => ({ jobId: j.id, idCubeta: j.idCubeta, cubetaId: j.cubeta?.id })));

            // Map jobs by cubeta ID. Prefer active (non-terminated) jobs.
            const jobsByCubeta = new Map<number, any>();
            jobs.forEach((j: any) => {
                // Try to get cubeta ID from column or relation object
                const cId = Number(j.idCubeta || j.cubeta?.id);
                // Skip if no valid cubeta ID
                if (!cId) return;

                // Since the list comes ordered by ID DESC (newest first), 
                // the first job we encounter for a cubeta is the most recent one.
                if (!jobsByCubeta.has(cId)) {
                    jobsByCubeta.set(cId, j);
                    console.log(`🔍 DEBUG: Mapped cubeta ID ${cId} to job ID ${j.id}`);
                }
            });

            console.log('🔍 DEBUG: Jobs by cubeta map:', jobsByCubeta);

            // 3. Construct the display list based primarily on CUBETAS
            const combinedData = cubetasFueraData.map((cubeta: any) => {
                const job = jobsByCubeta.get(Number(cubeta.id));
                console.log(`🔍 DEBUG: For cubeta ${cubeta.id} (${cubeta.codigo}), found job:`, job);
                return {
                    id: job ? job.id : `orphaned-${cubeta.id}`,
                    cubeta: cubeta,
                    laboratorio: job ? job.laboratorio : null,
                    precioLaboratorio: job ? job.precioLaboratorio : null,
                    paciente: job ? job.paciente : null,
                    // Mock properties if job is missing
                    estado: job ? job.estado : 'Desconocido',
                } as any; // Cast to any or TrabajoLaboratorio to satisfy TS
            });

            console.log('🔍 DEBUG: Final combined data:', combinedData);
            setTrabajosFuera(combinedData);
        } catch (error) {
            console.error('Error fetching modal data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

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
                                    <span className="p-2 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 rounded-xl">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </span>
                                    Ubicación de Cubetas (FUERA)
                                </h3>

                                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 max-h-[60vh]">
                                    {loading ? (
                                        <div className="text-center py-6 text-gray-500 font-medium">Cargando...</div>
                                    ) : (
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cubeta</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Laboratorio</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Trabajo</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Paciente</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ubicación</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                {trabajosFuera.length > 0 ? (
                                                    trabajosFuera.map((trabajo) => (
                                                        <tr key={trabajo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                            <td className="p-3 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                                                                {trabajo.cubeta?.descripcion}
                                                                <span className="text-gray-500 text-xs font-normal ml-1">({trabajo.cubeta?.codigo})</span>
                                                            </td>
                                                            <td className="p-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                                {trabajo.laboratorio?.laboratorio || '-'}
                                                            </td>
                                                            <td className="p-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                                {trabajo.precioLaboratorio?.detalle || '-'}
                                                            </td>
                                                            <td className="p-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-medium">
                                                                {trabajo.paciente ? `${trabajo.paciente.nombre} ${trabajo.paciente.paterno}` : '-'}
                                                            </td>
                                                            <td className="p-3 whitespace-nowrap">
                                                                <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-md bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                                                                    {trabajo.cubeta?.dentro_fuera}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={5} className="p-4 text-center text-sm text-gray-500 dark:text-gray-400 italic">
                                                            No hay cubetas fuera.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    )}
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

export default UbicacionCubetasModal;
