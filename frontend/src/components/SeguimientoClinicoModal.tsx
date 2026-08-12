import React from 'react';
import type { HistoriaClinica, Proforma, Paciente } from '../types';
import { formatDateUTC } from '../utils/formatters';
import { Calendar, Activity, User, ClipboardList, Stethoscope, X } from 'lucide-react';

interface SeguimientoClinicoModalProps {
    isOpen: boolean;
    onClose: () => void;
    historia: HistoriaClinica[];
    paciente: Paciente | null;
    selectedProformaId: number;
    proformas: Proforma[];
}

const SeguimientoClinicoModal: React.FC<SeguimientoClinicoModalProps> = ({
    isOpen,
    onClose,
    historia,
    paciente,
    selectedProformaId,
    proformas
}) => {
    if (!isOpen) return null;

    // 8. Sort history by date ASCENDING (oldest first, newest last)
    const sortedHistory = [...historia].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    // 4. Format patient name: Paterno Materno Nombre
    const pacienteNombreCompleto = paciente
        ? `${paciente.paterno || ''} ${paciente.materno || ''} ${paciente.nombre || ''}`.replace(/\s+/g, ' ').trim()
        : 'Sin nombre';

    // 5. Selected Plan info at the top
    const selectedProforma = proformas.find(p => p.id === selectedProformaId);
    const proformaNumero = selectedProforma ? (selectedProforma.numero || selectedProforma.id) : null;

    // 7. estadoPresupuesto placed ONCE at the top
    const estadoPresupuestoPlan = historia.some(h => h.estadoPresupuesto === 'terminado')
        ? 'terminado'
        : (historia.length > 0 ? (historia[0].estadoPresupuesto || 'no terminado') : 'no terminado');

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col transform transition-all scale-100">
                
                {/* Header (No X button as requested) */}
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                    <div className="flex items-center gap-3">
                        <ClipboardList className="text-blue-500 flex-shrink-0" size={26} />
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                Seguimiento Clínico e Historial Completo
                            </h3>
                            {/* 4. Paterno Materno Nombre */}
                            <p className="text-base font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                                {pacienteNombreCompleto}
                            </p>
                        </div>
                    </div>

                    {/* 5 & 7. PLAN ASOCIADO y ESTADO PRESUPUESTO colocadas arriba una sola vez */}
                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                PLAN ASOCIADO:
                            </span>
                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full font-black text-xs shadow-sm">
                                {proformaNumero ? `Plan #${proformaNumero}` : 'Todos los Planes'}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                ESTADO DEL PLAN:
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm ${
                                estadoPresupuestoPlan === 'terminado' 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 border border-green-300 dark:border-green-800' 
                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800'
                            }`}>
                                {estadoPresupuestoPlan === 'terminado' ? 'TERMINADO' : 'NO TERMINADO'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/30 dark:bg-gray-900/20">
                    {sortedHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                                <Activity size={48} className="text-gray-400 dark:text-gray-500" />
                            </div>
                            <p className="text-lg font-medium text-gray-500 dark:text-gray-400 italic">
                                No se encontraron registros de seguimiento para este plan de tratamiento.
                            </p>
                        </div>
                    ) : (
                        <div className="relative">
                            {/* Timeline vertical line */}
                            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-blue-200 dark:bg-blue-900/50 hidden md:block"></div>

                            <div className="space-y-6">
                                {sortedHistory.map((item) => {
                                    const isTerminado = item.estadoTratamiento === 'terminado';

                                    return (
                                        <div key={item.id} className="relative md:pl-12 group">
                                            {/* Timeline Dot */}
                                            <div className="absolute left-3.5 top-2 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-50 dark:ring-blue-900/30 z-10 hidden md:block"></div>
                                            
                                            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-all hover:shadow-md">
                                                {/* Header Line inside card: Date & Tooth & Estado Tratamiento */}
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 pb-2.5 border-b border-gray-100 dark:border-gray-700/60">
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
                                                            <Calendar size={13} />
                                                            {formatDateUTC(item.fecha)}
                                                        </span>
                                                        {item.pieza && (
                                                            <span className="px-2.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs font-bold border border-gray-200 dark:border-gray-600">
                                                                Pieza: {item.pieza}
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Solo estadoTratamiento (terminado / pendiente) */}
                                                    <div>
                                                        <span className={`px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider ${
                                                            isTerminado 
                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 border border-green-200 dark:border-green-800' 
                                                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800'
                                                        }`}>
                                                            {item.estadoTratamiento || 'pendiente'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Main Content Grid (Sin precio) */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <h4 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                            <Stethoscope size={14} className="text-blue-500" />
                                                            Tratamiento
                                                        </h4>
                                                        <p className="text-gray-800 dark:text-gray-200 font-bold text-base leading-tight">
                                                            {item.tratamiento || 'Sin tratamiento especificado'}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <h4 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                            <User size={14} className="text-blue-500" />
                                                            Doctor & Detalles
                                                        </h4>
                                                        <div className="space-y-2">
                                                            <div className="flex flex-wrap gap-4 text-xs font-medium text-gray-600 dark:text-gray-300">
                                                                <div className="flex items-center gap-1.5">
                                                                    <User size={14} className="text-blue-500" />
                                                                    <span>{item.doctor ? `Dr. ${item.doctor.paterno} ${item.doctor.nombre}` : 'Sin doctor asignado'}</span>
                                                                </div>
                                                                {item.especialidad && (
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Activity size={14} className="text-purple-500" />
                                                                        <span>{item.especialidad.especialidad}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {item.observaciones && (
                                                                <div className="mt-2 text-xs text-gray-700 dark:text-gray-300 leading-relaxed bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100/50 dark:border-blue-800/30">
                                                                    <span className="font-bold text-gray-500 dark:text-gray-400 block text-[10px] uppercase mb-0.5">Observaciones:</span>
                                                                    {item.observaciones}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer (2. Con icono X en el botón Cerrar) */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 text-sm cursor-pointer"
                    >
                        <X size={18} />
                        <span>Cerrar</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SeguimientoClinicoModal;
