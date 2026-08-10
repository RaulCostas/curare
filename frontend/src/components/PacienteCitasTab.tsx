import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { Paciente, Agenda } from '../types';
import { formatDate } from '../utils/dateUtils';
import ManualModal, { type ManualSection } from './ManualModal';
import AgendaForm from './AgendaForm';
import Pagination from './Pagination';
import { Calendar, Plus, ChevronRight } from 'lucide-react';

interface PacienteCitasTabProps {
    pacienteId: number;
    paciente: Paciente | null;
}

const PacienteCitasTab: React.FC<PacienteCitasTabProps> = ({ pacienteId, paciente }) => {
    const navigate = useNavigate();
    const [citas, setCitas] = useState<Agenda[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters checkboxes
    const [showFuturas, setShowFuturas] = useState(true);
    const [showPasadas, setShowPasadas] = useState(true);
    const [showCanceladas, setShowCanceladas] = useState(true);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // AgendaForm Modal state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCita, setEditingCita] = useState<Agenda | null>(null);
    const [showManual, setShowManual] = useState(false);

    useEffect(() => {
        if (pacienteId) {
            fetchCitas();
        }
    }, [pacienteId]);

    const fetchCitas = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/agenda/paciente/${pacienteId}`);
            setCitas(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Error fetching agenda citas for paciente:', error);
        } finally {
            setLoading(false);
        }
    };

    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

    // Filter logic based on checkboxes
    const filteredCitas = useMemo(() => {
        return citas.filter(cita => {
            const isCancelado = cita.estado === 'cancelado';
            if (isCancelado && !showCanceladas) return false;

            const fechaCita = cita.fecha ? cita.fecha.split('T')[0] : '';
            const isFutura = fechaCita >= todayStr;
            const isPasada = fechaCita < todayStr;

            if (isFutura && !showFuturas) return false;
            if (isPasada && !showPasadas) return false;

            return true;
        });
    }, [citas, showFuturas, showPasadas, showCanceladas, todayStr]);

    // Reset pagination to page 1 on filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [showFuturas, showPasadas, showCanceladas]);

    const totalPages = Math.ceil(filteredCitas.length / itemsPerPage);
    const paginatedCitas = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredCitas.slice(start, start + itemsPerPage);
    }, [filteredCitas, currentPage, itemsPerPage]);

    const formatHoraRango = (hora?: string, duracion: number = 60) => {
        if (!hora) return '14:00 - 15:00';
        const parts = hora.split(':');
        const startMin = parseInt(parts[0] || '14', 10) * 60 + parseInt(parts[1] || '00', 10);
        const endMin = startMin + (duracion || 60);

        const formatMin = (m: number) => {
            const hh = Math.floor(m / 60) % 24;
            const mm = m % 60;
            return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
        };

        return `${formatMin(startMin)} - ${formatMin(endMin)}`;
    };

    const formatFechaLegible = (fechaStr?: string) => {
        if (!fechaStr) return '—';
        const clean = fechaStr.split('T')[0];
        const [yyyy, mm, dd] = clean.split('-');
        if (yyyy && mm && dd) {
            return `${dd}/${mm}/${yyyy}`;
        }
        return formatDate(fechaStr);
    };

    // Only future appointments that are not cancelled can be edited
    const canEditCita = (cita: Agenda) => {
        if (cita.estado === 'cancelado') return false;
        const fechaCita = cita.fecha ? cita.fecha.split('T')[0] : '';
        return fechaCita >= todayStr;
    };

    const handleOpenCreateModal = () => {
        setEditingCita(null);
        setIsFormOpen(true);
    };

    const handleOpenEditModal = (cita: Agenda) => {
        if (!canEditCita(cita)) return;
        setEditingCita(cita);
        setIsFormOpen(true);
    };

    const handleFormSave = () => {
        setIsFormOpen(false);
        fetchCitas();
    };

    const manualSections: ManualSection[] = [
        {
            title: 'Historial de Citas',
            content: 'Consulte todas las citas agendadas, atendidas o canceladas del paciente.'
        },
        {
            title: 'Filtros de Búsqueda',
            content: 'Marque o desmarque las casillas de Citas Futuras, Citas Pasadas o Canceladas para filtrar el historial.'
        },
        {
            title: 'Programar Nueva Cita',
            content: 'Haga clic en el botón "Nueva Cita" para agendar una cita directamente utilizando la agenda del sistema.'
        }
    ];

    const nombrePacienteCompleto = paciente
        ? `${paciente.paterno || ''} ${paciente.materno || ''} ${paciente.nombre || ''}`.trim()
        : `Paciente #${pacienteId}`;

    if (loading) {
        return (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
                Cargando Historial de Citas...
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header del Historial de Citas */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Calendar className="text-blue-500" size={22} />
                        <span>Historial de Citas</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                        Consulte, reprograme o agende citas de la atención odontológica del paciente. ({filteredCitas.length} cita(s) registrada(s))
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>
                    <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 text-sm"
                    >
                        <Plus size={18} />
                        <span>Nueva Cita</span>
                    </button>
                </div>
            </div>

            {/* Casillas de Filtro */}
            <div className="flex flex-wrap items-center gap-6 text-xs font-semibold pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-blue-600 dark:text-blue-400 hover:opacity-80">
                    <input
                        type="checkbox"
                        checked={showFuturas}
                        onChange={e => setShowFuturas(e.target.checked)}
                        className="h-4 w-4 rounded text-blue-500 focus:ring-blue-400 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <span>Citas futuras <span className="text-[10px] text-gray-500 dark:text-gray-400 font-normal">(clic en fecha para editar)</span></span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-gray-600 dark:text-gray-400 hover:opacity-80">
                    <input
                        type="checkbox"
                        checked={showPasadas}
                        onChange={e => setShowPasadas(e.target.checked)}
                        className="h-4 w-4 rounded text-gray-500 focus:ring-gray-400 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <span>Citas pasadas</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-red-600 dark:text-red-400 hover:opacity-80">
                    <input
                        type="checkbox"
                        checked={showCanceladas}
                        onChange={e => setShowCanceladas(e.target.checked)}
                        className="h-4 w-4 rounded text-red-500 focus:ring-red-400 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <span>Canceladas</span>
                </label>
            </div>

            {/* Mensaje de número de resultados encima de la tabla */}
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-3 font-medium">
                Mostrando {filteredCitas.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredCitas.length)} de {filteredCitas.length} resultados
            </div>

            {/* Tabla de Citas */}
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wider text-[11px] border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="px-4 py-3">FECHA</th>
                            <th className="px-4 py-3">HORA</th>
                            <th className="px-4 py-3">DOCTOR</th>
                            <th className="px-4 py-3">TRATAMIENTO</th>
                            <th className="px-4 py-3">ESTADO</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700/60 font-medium">
                        {paginatedCitas.length > 0 ? (
                            paginatedCitas.map(cita => {
                                const isCancelado = cita.estado === 'cancelado';
                                const isEditable = canEditCita(cita);
                                const doctorNombre = cita.doctor
                                    ? `${cita.doctor.nombre || ''} ${cita.doctor.paterno || ''}`.toUpperCase().trim()
                                    : '—';

                                return (
                                    <tr
                                        key={cita.id}
                                        className={`transition-colors ${isCancelado
                                                ? 'bg-red-50/60 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100/60 dark:hover:bg-red-900/50'
                                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750'
                                            }`}
                                    >
                                        {/* FECHA (Clic solo si es editable/futura) */}
                                        <td className="px-4 py-3 font-semibold">
                                            {isEditable ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEditModal(cita)}
                                                    className="text-blue-600 dark:text-blue-400 hover:underline bg-transparent p-0 border-0 outline-none text-left font-semibold cursor-pointer"
                                                    title="Clic para editar cita futura"
                                                >
                                                    {formatFechaLegible(cita.fecha)}
                                                </button>
                                            ) : (
                                                <span className="text-gray-700 dark:text-gray-300 font-medium">
                                                    {formatFechaLegible(cita.fecha)}
                                                </span>
                                            )}
                                        </td>

                                        {/* HORA */}
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                            {formatHoraRango(cita.hora, cita.duracion)}
                                        </td>

                                        {/* DOCTOR */}
                                        <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100">
                                            {doctorNombre}
                                        </td>

                                        {/* TRATAMIENTO */}
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                            {cita.tratamiento || '—'}
                                        </td>

                                        {/* ESTADO */}
                                        <td className="px-4 py-3">
                                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold lowercase ${isCancelado
                                                    ? 'bg-red-100 dark:bg-[#450a0a] text-red-700 dark:text-[#fca5a5]'
                                                    : cita.estado === 'atendido'
                                                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                        : cita.estado === 'confirmado'
                                                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                                            : 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
                                                }`}>
                                                {cita.estado || 'atendido'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 italic">
                                    No se encontraron citas con los filtros seleccionados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginación centrada */}
            {filteredCitas.length > 0 && (
                <div className="flex justify-center items-center py-4">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            {/* Footer con Enlace a la Agenda Completa */}
            <div className="flex justify-end pt-2">
                <button
                    type="button"
                    onClick={() => navigate('/agenda')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 text-xs"
                >
                    <span>Ir a la Agenda completa</span>
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* Modal para Crear / Editar Cita de /agenda */}
            {isFormOpen && (
                <AgendaForm
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    onSave={handleFormSave}
                    initialData={editingCita}
                    defaultDate={todayStr}
                    defaultPacienteId={pacienteId}
                    existingAppointments={citas}
                />
            )}

            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Historial de Citas"
                sections={manualSections}
            />
        </div>
    );
};

export default PacienteCitasTab;
