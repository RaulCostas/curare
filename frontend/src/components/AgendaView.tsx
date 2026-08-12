import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './AgendaView.css'; // Import custom overrides
import api from '../services/api';
import type { Agenda, Paciente } from '../types';
import AgendaForm from './AgendaForm';
import Swal from 'sweetalert2';
import ManualModal, { type ManualSection } from './ManualModal';
import QuienAgendoModal from './QuienAgendoModal';
import Pagination from './Pagination';

import { getLocalDateString, formatDate } from '../utils/dateUtils';
import { formatFullName, formatPaternoMaternoNombre } from '../utils/formatters';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

import { Calendar as CalendarIcon, X as CloseIcon, UserCheck, Bell, Contact } from 'lucide-react';

const getStatusColor = (estado?: string) => {
    if (!estado) return '#3498db';
    const est = estado.toLowerCase().trim();
    switch (est) {
        case 'agendado':
        case 'registrado':
        case 'reservado':
        case 'pendiente':
            return '#3498db'; // Blue
        case 'confirmado':
            return '#2ecc71'; // Green
        case 'cancelado':
            return '#e74c3c'; // Red
        case 'atendido':
        case 'completado':
            return '#95a5a6'; // Gray
        case 'no asistio':
        case 'no asistió':
        case 'falta':
            return '#e67e22'; // Orange
        default:
            return '#3498db'; // Blue default
    }
};

const getStatusText = (estado?: string) => {
    if (!estado) return 'Agendado';
    const est = estado.toLowerCase().trim();
    switch (est) {
        case 'agendado':
        case 'registrado':
        case 'reservado':
        case 'pendiente':
            return 'Agendado';
        case 'confirmado':
            return 'Confirmado';
        case 'cancelado':
            return 'Cancelado';
        case 'atendido':
        case 'completado':
            return 'Atendido';
        case 'no asistio':
        case 'no asistió':
        case 'falta':
            return 'No Asistió';
        default:
            return estado;
    }
};

const isLightColor = (color?: string): boolean => {
    if (!color) return false;
    const c = color.trim().toLowerCase();
    if (c === 'yellow' || c === 'yellowaccent' || c.includes('yellow') || c === 'lime' || c === '#ffff00' || c === '#ffeb3b' || c === '#f1c40f' || c === '#facc15' || c === '#eab308' || c === '#f59e0b') return true;
    let hex = c.replace('#', '');
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }
    if (hex.length === 6) {
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
            const yiq = (r * 299 + g * 587 + b * 114) / 1000;
            return yiq > 150;
        }
    }
    return false;
};

interface AgendaViewProps {
    defaultPacienteId?: number;
    isEmbedded?: boolean;
    onAppointmentChange?: () => void;
}

const AgendaView: React.FC<AgendaViewProps> = ({ defaultPacienteId, isEmbedded = false, onAppointmentChange }) => {
    const navigate = useNavigate();

    const [currentDate, setCurrentDate] = useState(getLocalDateString());
    const [dateValue, setDateValue] = useState<Value>(new Date());
    const [appointments, setAppointments] = useState<Agenda[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ time: string, consultorio: number } | null>(null);
    const [editingAppointment, setEditingAppointment] = useState<Agenda | null>(null);
    const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
    const [monthAppointments, setMonthAppointments] = useState<Agenda[]>([]);

    // Patient Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredPacientes, setFilteredPacientes] = useState<Paciente[]>([]);
    const [showPatientResults, setShowPatientResults] = useState(false);
    const [patientHistory, setPatientHistory] = useState<Agenda[]>([]);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedPatientForHistory, setSelectedPatientForHistory] = useState<Paciente | null>(null);
    const [historyPage, setHistoryPage] = useState(1);

    const [showManual, setShowManual] = useState(false);
    const [showQuienAgendoModal, setShowQuienAgendoModal] = useState(false);
    const [showMobileCalendar, setShowMobileCalendar] = useState(false);
    const [isCompact, setIsCompact] = useState(true);

    const manualSections: ManualSection[] = [
        {
            title: 'Navegación',
            content: 'Utilice los botones "<<" y ">>" para moverse entre días, o "Hoy" para volver a la fecha actual. Cambie entre las vistas "Día" y "Mes" para una visión general.'
        },
        {
            title: 'Agendar Cita',
            content: 'Haga clic en cualquier espacio vacío de la grilla para programar una nueva cita en ese horario y consultorio. Complete el formulario con los datos del paciente.'
        },
        {
            title: 'Gestión de Citas',
            content: 'Haga clic en una cita existente (celdas coloreadas) para ver detalles, editarla o cambiar su estado. Los colores indican: Azul (Agendado), Verde (Confirmado), Rojo (Cancelado), Gris (Atendido), Naranja (No asistió).'
        },
        {
            title: 'Búsqueda de Pacientes',
            content: 'Utilice el buscador en la barra lateral izquierda para encontrar pacientes y ver su historial completo de citas.'
        }
    ];

    const timeSlots: string[] = [];
    let startHour = 8;
    let startMinute = 0;
    while (startHour < 20 || (startHour === 20 && startMinute <= 30)) {
        const hourStr = startHour.toString().padStart(2, '0');
        const minStr = startMinute.toString().padStart(2, '0');
        timeSlots.push(`${hourStr}:${minStr}`);

        startMinute += 30;
        if (startMinute === 60) {
            startMinute = 0;
            startHour++;
        }
    }

    useEffect(() => {
        if (viewMode === 'day') {
            fetchAppointments();
        } else {
            fetchMonthAppointments();
        }
    }, [currentDate, viewMode]);

    // Sync dateValue when currentDate changes
    useEffect(() => {
        const [year, month, day] = currentDate.split('-').map(Number);
        setDateValue(new Date(year, month - 1, day));
    }, [currentDate]);

    // Patient Search Logic with debounce
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        if (debouncedSearchTerm.trim() === '') {
            setFilteredPacientes([]);
            setShowPatientResults(false);
            return;
        }

        const searchPatients = async () => {
            try {
                const response = await api.get(`/pacientes?search=${debouncedSearchTerm}&limit=10`);
                setFilteredPacientes(response.data.data || []);
                setShowPatientResults(true);
            } catch (error) {
                console.error('Error searching patients:', error);
            }
        };

        searchPatients();
    }, [debouncedSearchTerm]);

    const handlePatientSelect = async (patient: Paciente) => {
        setSearchTerm(formatPaternoMaternoNombre(patient));
        setShowPatientResults(false);
        setSelectedPatientForHistory(patient);
        setHistoryPage(1);

        try {
            const response = await api.get(`/agenda/paciente/${patient.id}`);
            setPatientHistory(response.data);
            setShowHistoryModal(true);
        } catch (error) {
            console.error('Error fetching patient history:', error);
            Swal.fire('Error', 'No se pudo obtener el historial del paciente', 'error');
        }
    };

    const fetchAppointments = async () => {
        try {
            const response = await api.get(`/agenda?date=${currentDate}`);
            setAppointments(response.data || []);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        }
    };

    const fetchMonthAppointments = async () => {
        try {
            const date = new Date(currentDate + 'T00:00:00');
            const year = date.getFullYear();
            const month = date.getMonth();
            
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            
            const fechaInicio = firstDay.toISOString().split('T')[0];
            const fechaFinal = lastDay.toISOString().split('T')[0];
            
            const response = await api.get(`/agenda?fechaInicio=${fechaInicio}&fechaFinal=${fechaFinal}`);
            setMonthAppointments(response.data || []);
        } catch (error) {
            console.error('Error fetching month appointments:', error);
        }
    };

    const handleEnviarRecordatorioIndividual = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();

        try {
            const result = await Swal.fire({
                title: '¿Enviar recordatorio?',
                text: 'Se enviará un recordatorio de cita individual a través de WhatsApp.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Sí, enviar',
                cancelButtonText: 'Cancelar'
            });

            if (!result.isConfirmed) return;

            Swal.fire({
                title: 'Enviando recordatorio...',
                text: 'Por favor, espere un momento.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                },
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });

            const response = await api.post(`/agenda/${id}/recordatorio`);

            if (response.data.success) {
                Swal.fire({
                    title: '¡Enviado!',
                    text: response.data.message || 'El recordatorio se envió con éxito.',
                    icon: 'success',
                    showConfirmButton: false,
                    timer: 2000,
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
                fetchAppointments();
            } else {
                Swal.fire('Error', response.data.message || 'No se pudo enviar el recordatorio', 'error');
            }
        } catch (error: any) {
            console.error('Error sending individual reminder:', error);
            Swal.fire('Error', error.response?.data?.message || 'Error al conectar con el servidor', 'error');
        }
    };

    const handlePrevDay = () => {
        const date = new Date(currentDate + 'T00:00:00');
        if (viewMode === 'day') {
            date.setDate(date.getDate() - 1);
        } else {
            date.setMonth(date.getMonth() - 1);
            date.setDate(1);
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        setCurrentDate(`${year}-${month}-${day}`);
    };

    const handleNextDay = () => {
        const date = new Date(currentDate + 'T00:00:00');
        if (viewMode === 'day') {
            date.setDate(date.getDate() + 1);
        } else {
            date.setMonth(date.getMonth() + 1);
            date.setDate(1);
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        setCurrentDate(`${year}-${month}-${day}`);
    };

    const handleToday = () => {
        setCurrentDate(getLocalDateString());
    };

    const handleCalendarChange = (value: Value) => {
        if (value instanceof Date) {
            const year = value.getFullYear();
            const month = String(value.getMonth() + 1).padStart(2, '0');
            const day = String(value.getDate()).padStart(2, '0');
            setCurrentDate(`${year}-${month}-${day}`);
            setShowMobileCalendar(false);
        }
    };

    const handleCellClick = (time: string, consultorio: number) => {
        const existing = getAppointmentForSlot(time, consultorio);
        if (existing) {
            setEditingAppointment(existing);
        } else {
            setEditingAppointment(null);
            setSelectedSlot({ time, consultorio });
        }
        setIsFormOpen(true);
    };

    const handleFormClose = () => {
        setIsFormOpen(false);
        setSelectedSlot(null);
        setEditingAppointment(null);
    };

    const handleStatusChange = async (appointmentId: number, nuevoEstado: string, e: React.MouseEvent | React.ChangeEvent) => {
        e.stopPropagation();

        try {
            let motivoCancelacion = '';
            if (nuevoEstado === 'cancelado') {
                const { value: text, isConfirmed } = await Swal.fire({
                    title: 'Motivo de Cancelación',
                    input: 'textarea',
                    inputPlaceholder: 'Ingrese el motivo...',
                    showCancelButton: true,
                    confirmButtonText: 'Confirmar Cancelación',
                    cancelButtonText: 'Volver',
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });

                if (!isConfirmed) {
                    fetchAppointments();
                    return;
                }
                motivoCancelacion = text || 'Sin motivo especificado';
            }

            const payload: any = { estado: nuevoEstado };
            if (nuevoEstado === 'cancelado') {
                payload.motivoCancelacion = motivoCancelacion;
            }

            await api.patch(`/agenda/${appointmentId}`, payload);
            
            Swal.fire({
                icon: 'success',
                title: 'Estado actualizado',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });

            fetchAppointments();
        } catch (error: any) {
            console.error('Error updating status:', error);
            Swal.fire('Error', 'No se pudo actualizar el estado', 'error');
            fetchAppointments();
        }
    };

    const handleFormSave = () => {
        if (viewMode === 'day') {
            fetchAppointments();
        } else {
            fetchMonthAppointments();
        }
        handleFormClose();
        onAppointmentChange?.();
    };

    const getAppointmentForSlot = (time: string, consultorio: number) => {
        return appointments.find(app => {
            const appTime = app.hora.substring(0, 5);
            return appTime === time && app.consultorio === consultorio && app.estado !== 'cancelado';
        });
    };

    const skipCells = new Set<string>();
    appointments.forEach(app => {
        if (app.estado === 'cancelado') return;

        const duration = app.duracion || 30;
        const rowSpan = Math.ceil(duration / 30);
        if (rowSpan > 1) {
            const appTime = app.hora.substring(0, 5);
            const startIndex = timeSlots.indexOf(appTime);
            if (startIndex !== -1) {
                for (let i = 1; i < rowSpan; i++) {
                    if (startIndex + i < timeSlots.length) {
                        const nextTime = timeSlots[startIndex + i];
                        skipCells.add(`${nextTime}-${app.consultorio}`);
                    }
                }
            }
        }
    });

    const renderMonthView = () => {
        const date = new Date(currentDate + 'T00:00:00');
        const year = date.getFullYear();
        const month = date.getMonth();
        
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        
        let firstDayWeekday = firstDayOfMonth.getDay();
        if (firstDayWeekday === 0) firstDayWeekday = 7;
        
        const daysInMonth = lastDayOfMonth.getDate();
        const days = [];
        
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = firstDayWeekday - 1; i > 0; i--) {
            days.push({ day: prevMonthLastDay - i + 1, currentMonth: false, date: null });
        }
        
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const dayAppointments = monthAppointments.filter(app => app.fecha === dateStr && app.estado !== 'cancelado');
            days.push({ day: i, currentMonth: true, date: dateStr, appointments: dayAppointments });
        }
        
        const remainingCells = 42 - days.length;
        for (let i = 1; i <= remainingCells; i++) {
            days.push({ day: i, currentMonth: false, date: null });
        }

        const weekdayNames = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];

        return (
            <div className="flex-1 flex flex-col min-w-0">
                <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                    {weekdayNames.map(name => (
                        <div key={name} className="py-2 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                            {name}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 flex-1 overflow-y-auto">
                    {days.map((dayObj, index) => {
                        const isToday = dayObj.date === getLocalDateString();
                        return (
                            <div 
                                key={index} 
                                className={`min-h-[80px] sm:min-h-[120px] p-1 border-b border-r border-gray-200 dark:border-gray-700 transition-colors ${dayObj.currentMonth ? 'bg-white dark:bg-gray-800 hover:bg-blue-50/30 dark:hover:bg-gray-700' : 'bg-gray-50 dark:bg-gray-900/50 text-gray-300 dark:text-gray-600'} ${dayObj.date ? 'cursor-pointer' : ''}`}
                                onClick={() => {
                                    if (dayObj.date) {
                                        setCurrentDate(dayObj.date);
                                        setViewMode('day');
                                    }
                                }}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`text-[10px] sm:text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full transition-all ${isToday ? 'bg-blue-600 text-white shadow-md scale-110' : 'text-gray-500 dark:text-gray-400 group-hover:text-blue-600'}`}>
                                        {dayObj.day}
                                    </span>
                                    {dayObj.appointments && dayObj.appointments.length > 0 && (
                                        <div className="flex gap-1 items-center">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse sm:hidden"></span>
                                            <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-black hidden sm:inline-block shadow-sm">
                                                {dayObj.appointments.length} CITAS
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    {dayObj.appointments?.slice(0, 4).map((app, appIndex) => {
                                        const catColor = (!app.paciente || !app.pacienteId)
                                            ? '#cbd5e1'
                                            : (app.paciente?.categoria?.color || '#3b82f6');
                                        const statusColor = getStatusColor(app.estado);
                                        const isLight = isLightColor(catColor);
                                        return (
                                            <div 
                                                key={appIndex} 
                                                className={`text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0.5 rounded truncate font-extrabold shadow-sm flex items-center gap-1 ${isLight ? 'text-gray-900' : 'text-white'}`}
                                                style={{ 
                                                    backgroundColor: catColor,
                                                    borderLeft: `4px solid ${statusColor}`
                                                }}
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusColor }}></span>
                                                <span className="truncate">
                                                    {app.hora.substring(0, 5)} {app.paciente ? formatPaternoMaternoNombre(app.paciente) : (app.tratamiento || 'Bloqueo')}
                                                </span>
                                            </div>
                                        );
                                    })}
                                    {(dayObj.appointments?.length || 0) > 4 && (
                                        <div className="text-[9px] text-gray-500 font-bold ml-1">
                                            + {(dayObj.appointments?.length || 0) - 4} más...
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-[85vh] p-2 md:p-5">
            {/* Main View Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-2 md:mb-6 no-print gap-2 md:gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <h1 className="text-xl sm:text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2 sm:gap-3">
                            <CalendarIcon className="text-blue-600" size={24} />
                            Agenda
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 text-xs sm:text-sm hidden sm:block">Gestión de citas y programación de consultorios</p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                        {/* 1. Botón Manual/Ayuda (?) */}
                        <button
                            onClick={() => setShowManual(true)}
                            className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors self-center mr-1"
                            title="Ayuda / Manual"
                        >
                            ?
                        </button>

                        {/* 2. Quién Agendó */}
                        <button
                            onClick={() => setShowQuienAgendoModal(true)}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-lg font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105 active:scale-95 hover:-translate-y-0.5 cursor-pointer"
                            title="Buscar quién agendó"
                        >
                            <UserCheck size={16} />
                            <span>Quién Agendó</span>
                        </button>

                        {/* 3. Recordatorios & 4. Contactos */}
                        {!isEmbedded && (
                            <>
                                <button
                                    onClick={() => navigate('/recordatorio')}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105 active:scale-95 hover:-translate-y-0.5 cursor-pointer"
                                    title="Gestionar recordatorios"
                                >
                                    <Bell size={16} />
                                    <span>Recordatorios</span>
                                </button>
                                <button
                                    onClick={() => navigate('/contactos')}
                                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-lg font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105 active:scale-95 hover:-translate-y-0.5 cursor-pointer"
                                    title="Ver Contactos"
                                >
                                    <Contact size={16} />
                                    <span>Contactos</span>
                                </button>
                            </>
                        )}

                        <div className="flex bg-gray-100/80 dark:bg-gray-700/80 rounded-lg p-1 shadow-inner border border-gray-200 dark:border-gray-600 backdrop-blur-sm">
                            <button
                                onClick={() => setViewMode('day')}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-300 border-none outline-none ${viewMode === 'day' ? 'bg-blue-600 text-white shadow-md transform scale-105' : 'bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            >
                                Día
                            </button>
                            <button
                                onClick={() => setViewMode('month')}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-300 border-none outline-none ${viewMode === 'month' ? 'bg-blue-600 text-white shadow-md transform scale-105' : 'bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            >
                                Mes
                            </button>
                        </div>

                        {/* View Density Switch */}
                        <div className="flex bg-gray-100/80 dark:bg-gray-700/80 rounded-lg p-1 shadow-inner border border-gray-200 dark:border-gray-600 backdrop-blur-sm">
                            <button
                                onClick={() => setIsCompact(true)}
                                className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all duration-300 border-none outline-none ${isCompact ? 'bg-indigo-600 text-white shadow-md' : 'bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                                title="Ver toda la jornada (8:00 - 20:30) en una sola vista sin desplazar"
                            >
                                Ver Todo (8:00-20:30)
                            </button>
                            <button
                                onClick={() => setIsCompact(false)}
                                className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all duration-300 border-none outline-none ${!isCompact ? 'bg-indigo-600 text-white shadow-md' : 'bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                                title="Vista ampliada con filas grandes"
                            >
                                Amplio
                            </button>
                        </div>
                    </div>

                    {/* Status Legend (Compact, placed directly below Día/Mes) */}
                    <div className="flex flex-wrap items-center gap-2.5 px-3 py-1 bg-white/80 dark:bg-gray-800/80 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm no-print">
                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-wider mr-0.5">Estados:</span>
                        {[
                            { label: 'Agendado', color: '#3498db' },
                            { label: 'Confirmado', color: '#2ecc71' },
                            { label: 'Atendido', color: '#95a5a6' },
                            { label: 'No Asistió', color: '#e67e22' },
                            { label: 'Cancelado', color: '#e74c3c' }
                        ].map(s => (
                            <div key={s.label} className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full shadow-xs" style={{ backgroundColor: s.color }}></div>
                                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row-reverse gap-5 flex-1 overflow-hidden">

                {/* Sidebar Calendar - Hidden on mobile */}
                <div className="hidden md:flex w-[300px] flex-shrink-0 flex-col gap-4 overflow-y-auto">

                    {/* Patient Search Widget */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm relative border border-gray-100 dark:border-gray-700">
                        <h3 className="m-0 mb-2.5 text-base font-bold text-gray-800 dark:text-gray-200">Buscar Paciente</h3>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Nombre, Apellido o CI..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-8 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm('')}
                                    className="absolute inset-y-0 right-1.5 my-auto h-6 w-6 flex items-center justify-center bg-transparent hover:bg-gray-200 dark:hover:bg-gray-600 border-none p-0 rounded-full text-gray-400 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white transition-all cursor-pointer outline-none shadow-none"
                                    style={{ background: 'transparent' }}
                                    title="Limpiar búsqueda"
                                >
                                    <CloseIcon size={16} />
                                </button>
                            )}
                        </div>
                        {showPatientResults && filteredPacientes.length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-b-lg shadow-lg z-[9999] max-h-[200px] overflow-y-auto">
                                {filteredPacientes.map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => handlePatientSelect(p)}
                                        className="p-3 cursor-pointer border-b border-gray-100 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm text-gray-800 dark:text-gray-200"
                                    >
                                        <strong>{formatPaternoMaternoNombre(p)}</strong>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Date Navigation Controls (Placed directly ABOVE Calendar) */}
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-1.5">
                            <button
                                onClick={handlePrevDay}
                                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-bold transition-all transform hover:scale-105 active:scale-95 text-xs shadow-sm cursor-pointer"
                                title={viewMode === 'day' ? 'Día anterior' : 'Mes anterior'}
                            >
                                {'<<'}
                            </button>
                            <span className="text-xs sm:text-sm font-extrabold text-center text-gray-800 dark:text-white capitalize flex-1 truncate px-1">
                                {viewMode === 'day' 
                                    ? formatDate(currentDate) 
                                    : new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date(currentDate + 'T00:00:00'))}
                            </span>
                            <button
                                onClick={handleNextDay}
                                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-bold transition-all transform hover:scale-105 active:scale-95 text-xs shadow-sm cursor-pointer"
                                title={viewMode === 'day' ? 'Día siguiente' : 'Mes siguiente'}
                            >
                                {'>>'}
                            </button>
                        </div>
                        <button
                            onClick={handleToday}
                            className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-bold transition-all duration-200 transform hover:scale-102 active:scale-95 text-xs shadow-md flex items-center justify-center cursor-pointer"
                            title="Ir a hoy"
                        >
                            Hoy
                        </button>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-2.5 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 calendar-wrapper">
                        <Calendar
                            onChange={handleCalendarChange}
                            value={dateValue}
                            locale="es-ES"
                            className="dark:bg-gray-800 dark:text-white dark:border-gray-700 w-full"
                            tileClassName={({ date, view }) => view === 'month' && date.toDateString() === new Date().toDateString() ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full' : 'hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full'}
                        />
                    </div>
                </div>

                {/* Main Agenda Grid */}
                <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden min-w-0">

                    {/* Mobile-only date controls bar (Hidden on desktop to maximize vertical space) */}
                    <div className="md:hidden flex justify-between items-center p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-10">
                        <div className="flex items-center gap-1 sm:gap-2 w-full justify-between">
                            <button
                                onClick={handleToday}
                                className="px-2 sm:px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded font-bold transition-all transform hover:-translate-y-0.5 text-xs sm:text-sm shadow-md"
                                title="Ir a hoy"
                            >
                                Hoy
                            </button>
                            <button
                                onClick={() => setShowMobileCalendar(true)}
                                className="px-2 py-1.5 bg-blue-600 text-white rounded font-bold transition-all shadow-md flex items-center justify-center"
                                title="Abrir Calendario"
                            >
                                <CalendarIcon size={16} />
                            </button>
                            <button
                                onClick={handlePrevDay}
                                className="px-2 sm:px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded font-bold transition-all transform hover:-translate-y-0.5 text-xs sm:text-sm shadow-md"
                                title={viewMode === 'day' ? 'Día anterior' : 'Mes anterior'}
                            >
                                {'<<'}
                            </button>
                            <span className="text-xs sm:text-sm font-bold min-w-[90px] text-center text-gray-800 dark:text-white capitalize truncate max-w-[110px]">
                                {viewMode === 'day' 
                                    ? formatDate(currentDate) 
                                    : new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date(currentDate + 'T00:00:00'))}
                            </span>
                            <button
                                onClick={handleNextDay}
                                className="px-2 sm:px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded font-bold transition-all transform hover:-translate-y-0.5 text-xs sm:text-sm shadow-md"
                                title={viewMode === 'day' ? 'Día siguiente' : 'Mes siguiente'}
                            >
                                {'>>'}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-x-auto overflow-y-auto relative bg-white dark:bg-gray-800 flex flex-col">
                        {viewMode === 'day' ? (
                            <table className="min-w-[800px] w-full border-collapse table-fixed">
                                <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700 z-10 shadow-sm">
                                    <tr>
                                        <th className="border border-gray-300 dark:border-gray-600 p-1 text-center font-bold text-gray-700 dark:text-gray-200 w-16 text-[10px]">HORA</th>
                                        {[1, 2, 3, 4, 5].map(num => (
                                            <th key={num} className="border border-gray-300 dark:border-gray-600 p-1 text-center font-bold text-gray-700 dark:text-gray-200 text-[10px] sm:text-xs">
                                                CONSULTORIO #{num}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {timeSlots.map(time => (
                                        <tr key={time}>
                                            <td className={`border border-gray-300 dark:border-gray-600 text-center bg-gray-50 dark:bg-gray-700 font-black text-gray-700 dark:text-gray-300 text-[10px] align-middle ${isCompact ? 'py-0.5 px-0.5' : 'p-1'}`}>{time}</td>
                                            {[1, 2, 3, 4, 5].map(consultorio => {
                                                const cellKey = `${time}-${consultorio}`;
                                                if (skipCells.has(cellKey)) {
                                                    return null;
                                                }

                                                const appointment = getAppointmentForSlot(time, consultorio);
                                                const rowSpan = appointment ? Math.ceil((appointment.duracion || 30) / 30) : 1;

                                                const bgColor = appointment
                                                    ? ((!appointment.paciente || !appointment.pacienteId)
                                                        ? '#cbd5e1'
                                                        : (appointment.paciente?.categoria?.color || '#3b82f6'))
                                                    : undefined;

                                                const statusColor = appointment ? getStatusColor(appointment.estado) : undefined;
                                                const isLight = isLightColor(bgColor);
                                                const cellSlotHeight = isCompact ? '24px' : '40px';

                                                return (
                                                    <td
                                                        key={cellKey}
                                                        rowSpan={rowSpan}
                                                        className={`border border-gray-300 dark:border-gray-600 align-top cursor-pointer transition-colors hover:opacity-95 ${isCompact ? 'p-0.5' : 'p-1'} ${!appointment ? 'bg-white dark:bg-gray-800' : ''}`}
                                                        style={{
                                                            backgroundColor: bgColor,
                                                            borderLeft: statusColor ? `5px solid ${statusColor}` : undefined,
                                                            height: appointment ? 'auto' : cellSlotHeight
                                                        }}
                                                        onClick={() => handleCellClick(time, consultorio)}
                                                    >
                                                        {appointment && (
                                                            <div className={`h-full flex flex-col justify-between text-[10px] overflow-hidden ${isCompact ? 'px-1 py-0.5' : 'pl-2 pr-1 py-1'} rounded-sm relative ${isLight ? 'text-gray-900 font-extrabold' : 'text-white drop-shadow-md'}`}>
                                                                
                                                                {appointment.paciente && (appointment.paciente as any).clasificacion && (
                                                                    <div className={`absolute top-0 right-0 px-1 py-0.2 rounded-bl text-[8px] font-black backdrop-blur-sm z-10 border-l border-b border-black/20 shadow-xs ${
                                                                        (appointment.paciente as any).clasificacion.charAt(0) === 'A' ? 'bg-amber-600/90 text-white' :
                                                                        (appointment.paciente as any).clasificacion.charAt(0) === 'B' ? 'bg-slate-700/90 text-slate-50' :
                                                                            'bg-orange-600/90 text-orange-50'
                                                                        }`}>
                                                                        {(appointment.paciente as any).clasificacion}
                                                                    </div>
                                                                )}

                                                                <div>
                                                                    <div className={`font-extrabold truncate pr-5 leading-tight ${isCompact ? 'text-[10px]' : 'text-[11px]'}`}>
                                                                        {appointment.paciente ? (
                                                                            <span 
                                                                                className={`hover:underline cursor-pointer transition-all ${isLight ? 'hover:text-blue-900 text-gray-900 font-black' : 'hover:text-white/80 font-black'}`}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    const id = appointment.pacienteId;
                                                                                    navigate(`/pacientes/${id}/ficha`);
                                                                                }}
                                                                            >
                                                                                {formatPaternoMaternoNombre(appointment.paciente)}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="italic">
                                                                                {appointment.tratamiento || 'Bloqueo'}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className={`truncate ${isCompact ? 'text-[9px] mt-0' : 'mt-0.5'} ${isLight ? 'text-gray-800 font-bold' : 'opacity-90'}`}>{appointment.doctor ? `Dr. ${formatPaternoMaternoNombre(appointment.doctor)}` : ''}</div>
                                                                    {appointment.paciente && appointment.tratamiento && (
                                                                        <div className={`text-[8.5px] italic truncate ${isCompact ? 'mt-0' : 'mt-0.5'} ${isLight ? 'text-gray-800 font-medium' : 'opacity-85'}`}>
                                                                            {appointment.tratamiento}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className={`text-[8.5px] font-bold uppercase flex items-center gap-1 flex-wrap ${isCompact ? 'mt-0.5' : 'mt-1.5'}`}>
                                                                    {appointment.paciente && appointment.pacienteId ? (
                                                                        <select
                                                                            value={appointment.estado}
                                                                            style={{ 
                                                                                backgroundColor: getStatusColor(appointment.estado),
                                                                                color: isLightColor(getStatusColor(appointment.estado)) ? '#111827' : '#ffffff'
                                                                            }}
                                                                            className="border border-black/30 shadow-xs rounded-full px-2 py-0 cursor-pointer font-black text-[8px] outline-none tracking-wider uppercase"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            onChange={(e) => handleStatusChange(appointment.id, e.target.value, e)}
                                                                        >
                                                                            <option value="agendado" className="bg-[#3498db] text-white font-bold">● AGENDADO</option>
                                                                            <option value="confirmado" className="bg-[#2ecc71] text-white font-bold">● CONFIRMADO</option>
                                                                            <option value="atendido" className="bg-[#95a5a6] text-white font-bold">● ATENDIDO</option>
                                                                            <option value="no asistio" className="bg-[#e67e22] text-white font-bold">● NO ASISTIÓ</option>
                                                                            <option value="cancelado" className="bg-[#e74c3c] text-white font-bold">● CANCELADO</option>
                                                                        </select>
                                                                    ) : (
                                                                        <span className="bg-slate-700/80 text-slate-100 px-1.5 py-0 rounded-full font-extrabold text-[7.5px] tracking-wider uppercase border border-slate-500/50 shadow-xs">
                                                                            BLOQUEO
                                                                        </span>
                                                                    )}
                                                                    {(appointment.paciente || appointment.pacienteId) && (appointment.fecha || currentDate) >= getLocalDateString() && (
                                                                        <button
                                                                            onClick={(e) => handleEnviarRecordatorioIndividual(appointment.id, e)}
                                                                            className="ml-0.5 flex-shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white p-0.5 rounded-full transition-all shadow-xs flex items-center justify-center border border-white/30"
                                                                            title="Enviar recordatorio por WhatsApp"
                                                                        >
                                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                                            </svg>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : renderMonthView()}
                    </div>
                </div>
            </div>

            {isFormOpen && (
                <AgendaForm
                    isOpen={isFormOpen}
                    onClose={handleFormClose}
                    onSave={handleFormSave}
                    initialData={editingAppointment}
                    defaultDate={currentDate}
                    defaultTime={selectedSlot?.time}
                    defaultConsultorio={selectedSlot?.consultorio}
                    defaultPacienteId={defaultPacienteId}
                    existingAppointments={appointments}
                />
            )}

            {/* History Modal */}
            {showHistoryModal && selectedPatientForHistory && (() => {
                const totalHistoryRecords = patientHistory.length;
                const historyLimit = 10;
                const totalHistoryPages = Math.ceil(totalHistoryRecords / historyLimit) || 1;
                const paginatedHistory = patientHistory.slice((historyPage - 1) * historyLimit, historyPage * historyLimit);

                return (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                        <div className="bg-white dark:bg-gray-800 w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 dark:border-gray-700">
                            {/* Modal Header */}
                            <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2 m-0">
                                    <span>📅 Historial de Citas:</span>
                                    <span className="text-blue-600 dark:text-blue-400">{formatPaternoMaternoNombre(selectedPatientForHistory)}</span>
                                </h2>
                            </div>

                            {/* Info Records Count */}
                            <div className="px-6 pt-4 pb-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
                                Mostrando {totalHistoryRecords === 0 ? 0 : (historyPage - 1) * historyLimit + 1} - {Math.min(historyPage * historyLimit, totalHistoryRecords)} de {totalHistoryRecords} registros
                            </div>

                            {/* Table Content */}
                            <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-gray-800 space-y-4">
                                {totalHistoryRecords === 0 ? (
                                    <p className="text-center text-gray-500 dark:text-gray-400 py-8 italic">No hay citas registradas para este paciente.</p>
                                ) : (
                                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                            <thead className="bg-gray-50 dark:bg-gray-700">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Hora</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Doctor</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tratamiento</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Motivo</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                {paginatedHistory.map((cita) => (
                                                    <tr key={cita.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                        <td className="p-3 text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">{formatDate(cita.fecha)}</td>
                                                        <td className="p-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">{cita.hora ? cita.hora.substring(0, 5) : '-'}</td>
                                                        <td className="p-3 text-gray-700 dark:text-gray-300 font-medium">{cita.doctor ? `Dr. ${formatPaternoMaternoNombre(cita.doctor)}` : '-'}</td>
                                                        <td className="p-3 text-gray-700 dark:text-gray-300">{cita.tratamiento || '-'}</td>
                                                        <td className="p-3 whitespace-nowrap">
                                                            <span
                                                                className="px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-sm inline-block"
                                                                style={{ backgroundColor: getStatusColor(cita.estado) }}
                                                            >
                                                                {getStatusText(cita.estado)}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-gray-700 dark:text-gray-300 text-sm">
                                                            {cita.estado === 'cancelado' && cita.motivoCancelacion ? (
                                                                <span className="italic text-red-500 dark:text-red-400">{cita.motivoCancelacion}</span>
                                                            ) : (
                                                                '-'
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Pagination */}
                                {totalHistoryPages > 1 && (
                                    <Pagination
                                        currentPage={historyPage}
                                        totalPages={totalHistoryPages}
                                        onPageChange={setHistoryPage}
                                    />
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowHistoryModal(false)}
                                    className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-5 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 text-sm cursor-pointer"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Agenda"
                sections={manualSections}
            />

            <QuienAgendoModal
                isOpen={showQuienAgendoModal}
                onClose={() => setShowQuienAgendoModal(false)}
            />

            {/* Mobile Calendar Modal */}
            {showMobileCalendar && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in md:hidden">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-[320px] overflow-hidden border border-gray-100 dark:border-gray-700 transform transition-all scale-100">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <CalendarIcon size={18} className="text-blue-500" />
                                Seleccionar Fecha
                            </h3>
                            <button
                                onClick={() => setShowMobileCalendar(false)}
                                className="text-gray-400 hover:text-red-500 transition-colors p-1 bg-transparent border-none flex items-center justify-center"
                            >
                                <CloseIcon size={24} />
                            </button>
                        </div>
                        <div className="p-2 calendar-wrapper mobile-calendar">
                            <Calendar
                                onChange={handleCalendarChange}
                                value={dateValue}
                                locale="es-ES"
                                className="dark:bg-gray-800 dark:text-white dark:border-none w-full border-none"
                            />
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-2">
                            <button
                                onClick={() => { setShowMobileCalendar(false); setShowQuienAgendoModal(true); }}
                                className="w-full py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
                            >
                                <UserCheck size={16} />
                                <span>Quién Agendó</span>
                            </button>
                            {!isEmbedded && (
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => { setShowMobileCalendar(false); navigate('/recordatorio'); }}
                                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
                                    >
                                        <Bell size={16} />
                                        <span>Recordatorios</span>
                                    </button>
                                    <button
                                        onClick={() => { setShowMobileCalendar(false); navigate('/contactos'); }}
                                        className="w-full py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
                                    >
                                        <Contact size={16} />
                                        <span>Contactos</span>
                                    </button>
                                </div>
                            )}
                            <button
                                onClick={() => setShowMobileCalendar(false)}
                                className="w-full py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold text-xs hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors mt-1"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
            .calendar-wrapper .react-calendar { 
                border: none; 
                font-family: inherit;
                width: 100%;
                background-color: white;
                color: #1f2937;
            }
            
            .calendar-wrapper .react-calendar__navigation button {
                min-width: 44px;
                background: none;
                color: #1f2937;
            }
            
            .calendar-wrapper .react-calendar__navigation__label {
                font-weight: bold;
            }
            
            .calendar-wrapper .react-calendar__navigation button:enabled:hover,
            .calendar-wrapper .react-calendar__navigation button:enabled:focus {
                background-color: #f3f4f6;
            }
            
            .calendar-wrapper .react-calendar__month-view__days__day {
                color: #374151;
            }
            
            .calendar-wrapper .react-calendar__month-view__days__day--weekend {
                color: #dc2626;
            }
            
            .calendar-wrapper .react-calendar__month-view__days__day--neighboringMonth {
                color: #9ca3af;
            }
            
            .calendar-wrapper .react-calendar__tile:enabled:hover,
            .calendar-wrapper .react-calendar__tile:enabled:focus {
                background-color: #f3f4f6;
            }
            
            .calendar-wrapper .react-calendar__tile--now {
                background: #fef3c7;
                color: #92400e;
                font-weight: bold;
            }
            
            .calendar-wrapper .react-calendar__tile--now:enabled:hover,
            .calendar-wrapper .react-calendar__tile--now:enabled:focus {
                background: #fde68a;
            }
            
            .calendar-wrapper .react-calendar__tile--active {
                background: #3b82f6;
                color: white;
                font-weight: bold;
            }
            
            .calendar-wrapper .react-calendar__tile--active:enabled:hover,
            .calendar-wrapper .react-calendar__tile--active:enabled:focus {
                background: #2563eb;
            }
            
            .dark .calendar-wrapper .react-calendar {
                background-color: #1f2937;
                color: white;
            }
            
            .dark .calendar-wrapper .react-calendar__navigation button {
                color: white;
            }
            
            .dark .calendar-wrapper .react-calendar__navigation button:enabled:hover,
            .dark .calendar-wrapper .react-calendar__navigation button:enabled:focus {
                background-color: #374151;
            }
            
            .dark .calendar-wrapper .react-calendar__month-view__days__day {
                color: #d1d5db;
            }
            
            .dark .calendar-wrapper .react-calendar__month-view__days__day--weekend {
                color: #f87171;
            }
            
            .dark .calendar-wrapper .react-calendar__month-view__days__day--neighboringMonth {
                color: #6b7280;
            }
            
            .dark .calendar-wrapper .react-calendar__tile:enabled:hover,
            .dark .calendar-wrapper .react-calendar__tile:enabled:focus {
                background-color: #374151;
            }
            
            .dark .calendar-wrapper .react-calendar__tile--now {
                background: #eab308;
                color: black;
                font-weight: bold;
            }
            
            .dark .calendar-wrapper .react-calendar__tile--now:enabled:hover,
            .dark .calendar-wrapper .react-calendar__tile--now:enabled:focus {
                background: #ca8a04;
            }
            
            .dark .calendar-wrapper .react-calendar__tile--active {
                background: #2563eb;
                color: white;
                font-weight: bold;
            }
            
            .dark .calendar-wrapper .react-calendar__tile--active:enabled:hover,
            .dark .calendar-wrapper .react-calendar__tile--active:enabled:focus {
                background: #1d4ed8;
            }

            .mobile-calendar .react-calendar {
                border: none !important;
                width: 100% !important;
            }
            
            .animate-fade-in {
                animation: fadeIn 0.15s ease-out;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
            }

            .no-scrollbar::-webkit-scrollbar {
                display: none;
            }
            .no-scrollbar {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
        `}</style>
        </div>
    );
};

export default AgendaView;
