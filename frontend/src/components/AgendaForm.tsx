import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { formatPaternoMaternoNombre } from '../utils/formatters';
import type { Agenda, Paciente, Doctor, Proforma, Personal } from '../types';

interface AgendaFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    initialData: Agenda | null;
    defaultDate: string;
    defaultTime?: string;
    defaultConsultorio?: number;
    defaultPacienteId?: number;
    existingAppointments?: Agenda[];
}

import QuickPacienteForm from './QuickPacienteForm';
import SearchableSelect, { type Option } from './SearchableSelect';
import Swal from 'sweetalert2';

const AgendaForm: React.FC<AgendaFormProps> = ({
    isOpen, onClose, onSave, initialData, defaultDate, defaultTime, defaultConsultorio, defaultPacienteId, existingAppointments = []
}) => {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [proformas, setProformas] = useState<Proforma[]>([]);
    const [pacientes, setPacientes] = useState<Paciente[]>([]);
    const [personal, setPersonal] = useState<Personal[]>([]);

    
    const [historiaClinica, setHistoriaClinica] = useState<any[]>([]);
    const [tratamientos, setTratamientos] = useState<any[]>([]);
    const [isQuickPatientOpen, setIsQuickPatientOpen] = useState(false);
    const [isNonPatientEvent, setIsNonPatientEvent] = useState(false);

    const [formData, setFormData] = useState({
        fecha: defaultDate,
        hora: defaultTime || '08:00',
        duracion: 30,
        consultorio: defaultConsultorio || 1,
        pacienteId: defaultPacienteId || 0,
        doctorId: 0,
        proformaId: 0,
        estado: 'agendado',
        usuarioId: 0,
        tratamiento: '',
        asistenteId: 0,
        motivoCancelacion: ''
    });

    const [maxDuration, setMaxDuration] = useState(120);
    const [durationWarning, setDurationWarning] = useState<string | null>(null);

    // Calculate Max Duration on changes
    useEffect(() => {
        if (!formData.fecha || !formData.hora) return;

        if (formData.fecha !== defaultDate) {
            setMaxDuration(120);
            setDurationWarning(null);
            return;
        }

        const timeToMinutes = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };

        const currentStart = timeToMinutes(formData.hora);
        const consultorio = Number(formData.consultorio);

        const dayAppointments = existingAppointments.filter(app =>
            app.consultorio === consultorio &&
            app.id !== initialData?.id &&
            app.estado !== 'cancelado' &&
            app.estado !== 'no asistio' &&
            app.estado !== 'eliminado'
        );

        dayAppointments.sort((a, b) => timeToMinutes(a.hora) - timeToMinutes(b.hora));

        const nextApp = dayAppointments.find(app => timeToMinutes(app.hora) > currentStart);

        if (nextApp) {
            const nextStart = timeToMinutes(nextApp.hora);
            const diff = nextStart - currentStart;

            if (diff > 0) {
                setMaxDuration(diff);
                if (formData.duracion > diff) {
                    setFormData(prev => ({ ...prev, duracion: diff }));
                    setDurationWarning(`La duración se ajustó a ${diff} min por choque con cita de las ${nextApp.hora}`);
                } else {
                    setDurationWarning(null);
                }
            }
        } else {
            setMaxDuration(240);
            setDurationWarning(null);
        }

    }, [formData.hora, formData.consultorio, formData.fecha, formData.duracion, existingAppointments, defaultDate, initialData]);

    // Get current user
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setFormData(prev => ({ ...prev, usuarioId: user.id }));
            } catch (e) {
                console.error("Error parsing user", e);
            }
        }
    }, []);

    useEffect(() => {
        if (isOpen && !initialData) {
            const pId = defaultPacienteId || 0;
            setFormData(prev => ({
                ...prev,
                fecha: defaultDate,
                hora: defaultTime || '08:00',
                consultorio: defaultConsultorio || 1,
                pacienteId: pId,
                doctorId: 0,
                proformaId: 0,
                asistenteId: 0,
                tratamiento: '',
                motivoCancelacion: ''
            }));
            setIsNonPatientEvent(false);
            if (pId > 0) {
                fetchProformasByPaciente(pId);
                fetchHistoriaClinica(pId);
            } else {
                setProformas([]);
                setHistoriaClinica([]);
                setTratamientos([]);
            }
        }
    }, [isOpen, initialData, defaultDate, defaultTime, defaultConsultorio, defaultPacienteId]);

    useEffect(() => {
        fetchCatalogs();
        if (initialData) {
            setFormData({
                fecha: initialData.fecha,
                hora: initialData.hora,
                duracion: initialData.duracion,
                consultorio: initialData.consultorio,
                pacienteId: initialData.pacienteId || 0,
                doctorId: initialData.doctorId || 0,
                proformaId: initialData.proformaId || 0,
                estado: initialData.estado,
                usuarioId: initialData.usuarioId || 0,
                tratamiento: initialData.tratamiento || '',
                asistenteId: (initialData as any).asistenteId || 0,
                motivoCancelacion: initialData.motivoCancelacion || ''
            });

            if (!initialData.pacienteId || initialData.pacienteId === 0) {
                setIsNonPatientEvent(true);
            } else {
                setIsNonPatientEvent(false);
                fetchProformasByPaciente(initialData.pacienteId);
                fetchHistoriaClinica(initialData.pacienteId);
            }
        }
    }, [initialData]);

    const fetchCatalogs = async () => {
        try {
            const [doctorsRes, pacientesRes, personalRes] = await Promise.all([
                api.get('/doctors?limit=1000'),
                api.get('/pacientes?limit=100000'),
                api.get('/personal?limit=1000')
            ]);
            
            const activeDoctors = (doctorsRes.data.data || [])
                .filter((d: any) => (!d.estado || d.estado.toLowerCase() === 'activo' || d.id === initialData?.doctorId))
                .sort((a: any, b: any) => formatPaternoMaternoNombre(a).localeCompare(formatPaternoMaternoNombre(b), 'es', { sensitivity: 'base' }));
            setDoctors(activeDoctors);

            const activePacientes = (pacientesRes.data.data || []).filter((p: any) =>
                (!p.estado || p.estado.toLowerCase() === 'activo' || p.id === initialData?.pacienteId)
            );
            setPacientes(activePacientes);

            const clinicaPersonal = (personalRes.data.data || [])
                .filter((p: Personal) =>
                    p.personalTipo?.area === 'Clínica' &&
                    (!p.estado || p.estado.toLowerCase() === 'activo' || p.id === (initialData as any)?.asistenteId)
                )
                .sort((a: any, b: any) => formatPaternoMaternoNombre(a).localeCompare(formatPaternoMaternoNombre(b), 'es', { sensitivity: 'base' }));
            setPersonal(clinicaPersonal);
        } catch (error) {
            console.error('Error fetching catalogs:', error);
        }
    };

    const fetchProformasByPaciente = async (pacienteId: number) => {
        try {
            const response = await api.get(`/proformas/paciente/${pacienteId}`);
            setProformas(response.data || []);
        } catch (error) {
            console.error('Error fetching proformas:', error);
            setProformas([]);
        }
    };

    const fetchHistoriaClinica = async (pacienteId: number) => {
        try {
            const response = await api.get(`/historia-clinica/paciente/${pacienteId}`);
            setHistoriaClinica(response.data || []);
        } catch (error) {
            console.error('Error fetching historia clinica:', error);
        }
    };

    const fetchTratamientosByProforma = async (proformaId: number) => {
        try {
            const response = await api.get(`/proformas/${proformaId}`);
            const proforma = response.data;
            if (proforma.detalles && proforma.detalles.length > 0) {
                setTratamientos(proforma.detalles);
            } else {
                setTratamientos([]);
            }
        } catch (error) {
            console.error('Error fetching tratamientos:', error);
            setTratamientos([]);
        }
    };

    const handlePatientCreated = async (newPaciente: Paciente) => {
        await fetchCatalogs();
        setFormData(prev => ({
            ...prev,
            pacienteId: newPaciente.id,
            proformaId: 0,
            tratamiento: ''
        }));
        setProformas([]);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === 'pacienteId') {
            const newPacienteId = Number(value);
            setFormData(prev => ({
                ...prev,
                pacienteId: newPacienteId,
                proformaId: 0,
                tratamiento: ''
            }));
            if (newPacienteId > 0) {
                fetchProformasByPaciente(newPacienteId);
                fetchHistoriaClinica(newPacienteId);
            } else {
                setProformas([]);
                setHistoriaClinica([]);
                setTratamientos([]);
            }
        } else if (name === 'proformaId') {
            const selectedProformaId = Number(value);

            setFormData(prev => ({
                ...prev,
                proformaId: selectedProformaId,
                tratamiento: ''
            }));

            if (selectedProformaId > 0) {
                fetchTratamientosByProforma(selectedProformaId);
            } else {
                setTratamientos([]);
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: (name.includes('Id') || name === 'duracion' || name === 'consultorio') ? Number(value) : value
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.doctorId || formData.doctorId <= 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Campo Requerido',
                text: 'Por favor seleccione un doctor',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
            return;
        }

        if (!isNonPatientEvent && (!formData.pacienteId || formData.pacienteId <= 0)) {
            Swal.fire({
                icon: 'warning',
                title: 'Campo Requerido',
                text: 'Por favor seleccione un paciente o marque como evento sin paciente',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
            return;
        }

        if (isNonPatientEvent && !formData.tratamiento.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Campo Requerido',
                text: 'Por favor ingrese una descripción para el evento',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
            return;
        }

        const payload: any = {
            ...formData,
            pacienteId: formData.pacienteId > 0 ? formData.pacienteId : null,
            proformaId: formData.proformaId > 0 ? formData.proformaId : null,
            asistenteId: formData.asistenteId > 0 ? formData.asistenteId : null,
            tratamiento: formData.tratamiento || (isNonPatientEvent ? 'Bloqueo / Evento' : '')
        };

        if (!payload.usuarioId || payload.usuarioId <= 0) {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const u = JSON.parse(userStr);
                payload.usuarioId = u.id;
            }
        }

        if (!payload.usuarioId || payload.usuarioId <= 0) {
            Swal.fire('Error', 'No se pudo identificar al usuario. Inicie sesión nuevamente.', 'error');
            return;
        }

        try {
            let response;
            if (initialData) {
                response = await api.patch(`/agenda/${initialData.id}`, payload);
            } else {
                response = await api.post('/agenda', payload);
            }

            if (response.data && response.data.error) {
                throw new Error(response.data.message + ' | ' + response.data.details);
            }

            await Swal.fire({
                icon: 'success',
                title: initialData ? 'Cita Actualizada' : 'Cita Agendada',
                text: initialData ? 'La cita se ha actualizado correctamente' : 'La cita se ha agendado correctamente',
                timer: 1500,
                showConfirmButton: false
            });
            onSave();
        } catch (error: any) {
            console.error('Error saving appointment:', error);
            const msg = error.response?.data?.message || error.message || 'Error al guardar la cita';
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: Array.isArray(msg) ? msg.join(', ') : msg
            });
        }
    };

    const handleDelete = async () => {
        try {
            let currentUserId = 0;
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    currentUserId = JSON.parse(userStr).id;
                } catch (e) {
                    console.error("Error parsing user", e);
                }
            }

            await api.delete(`/agenda/${initialData?.id}?userId=${currentUserId}`);
            await Swal.fire({
                icon: 'success',
                title: 'Cita Eliminada',
                text: 'La cita ha sido eliminada correctamente',
                timer: 1500,
                showConfirmButton: false
            });
            onSave();
        } catch (error) {
            console.error('Error deleting appointment:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al eliminar la cita'
            });
        }
    };

    if (!isOpen) return null;

    // Patient Options sorted by PATERNO MATERNO NOMBRE, with full searchString support
    const patientOptions: Option[] = pacientes
        .map(p => {
            const paternoMaternoNombre = [p.paterno, p.materno, p.nombre].filter(Boolean).join(' ');
            const nombrePaternoMaterno = [p.nombre, p.paterno, p.materno].filter(Boolean).join(' ');
            return {
                id: p.id,
                label: paternoMaternoNombre,
                subLabel: p.ci ? `CI: ${p.ci}` : undefined,
                searchString: `${nombrePaternoMaterno} ${p.ci || ''}`
            };
        })
        .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }));



    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000] p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-[540px] max-w-[95%] max-h-[90vh] overflow-y-auto shadow-2xl text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700">
                <h2 className="mt-0 text-xl font-bold mb-5 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 pb-3">
                    <span className="p-2.5 bg-blue-100 dark:bg-blue-900/60 rounded-xl text-blue-600 dark:text-blue-300 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </span>
                    {initialData ? 'Editar Cita' : 'Nueva Cita'}
                </h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Fecha y Hora */}
                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Fecha:</label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                <input
                                    type="date"
                                    name="fecha"
                                    value={formData.fecha}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Hora:</label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                <input
                                    type="time"
                                    name="hora"
                                    value={formData.hora}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                />
                            </div>
                        </div>

                        {/* Consultorio y Duracion */}
                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Consultorio:</label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                                <select
                                    name="consultorio"
                                    value={formData.consultorio}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none font-medium cursor-pointer"
                                >
                                    {[1, 2, 3, 4, 5].map(num => (
                                        <option key={num} value={num}>Consultorio #{num}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Duración (min):</label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                <input
                                    type="number"
                                    name="duracion"
                                    value={formData.duracion}
                                    onChange={handleChange}
                                    step="30"
                                    min="30"
                                    max={maxDuration}
                                    placeholder="Ej. 30"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                />
                            </div>
                            {durationWarning && (
                                <div className="text-red-500 text-xs mt-1 font-semibold">
                                    {durationWarning}
                                </div>
                            )}
                        </div>

                        {/* Checkbox Evento Sin Paciente */}
                        <div className="col-span-1 md:col-span-2">
                            <label className="inline-flex items-center cursor-pointer my-1 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors w-full">
                                <input
                                    type="checkbox"
                                    checked={isNonPatientEvent}
                                    onChange={(e) => {
                                        setIsNonPatientEvent(e.target.checked);
                                        if (e.target.checked) {
                                            setFormData(prev => ({
                                                ...prev,
                                                pacienteId: 0,
                                                proformaId: 0,
                                                tratamiento: ''
                                            }));
                                            setProformas([]);
                                        }
                                    }}
                                    className="form-checkbox h-5 w-5 text-blue-600 rounded-lg border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:bg-gray-700"
                                />
                                <span className="ml-3 text-gray-700 dark:text-gray-300 font-bold text-sm">Bloqueo / Evento (Sin Paciente)</span>
                            </label>
                        </div>

                        {/* Selector Paciente (Ordenado PATERNO MATERNO NOMBRE) */}
                        {!isNonPatientEvent && (
                            <div className="col-span-1 md:col-span-2">
                                <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Paciente:</label>
                                <div className="flex gap-2.5">
                                    <SearchableSelect
                                        className="flex-1"
                                        options={patientOptions}
                                        value={formData.pacienteId}
                                        onChange={(val) => {
                                            const id = Number(val);
                                            setFormData(prev => ({
                                                ...prev,
                                                pacienteId: id,
                                                proformaId: 0,
                                                tratamiento: ''
                                            }));
                                            if (id > 0) {
                                                fetchProformasByPaciente(id);
                                                fetchHistoriaClinica(id);
                                            } else {
                                                setProformas([]);
                                                setHistoriaClinica([]);
                                                setTratamientos([]);
                                            }
                                        }}
                                        required={!isNonPatientEvent}
                                        placeholder="-- Seleccione Paciente --"
                                        icon={
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                <circle cx="12" cy="7" r="4"></circle>
                                            </svg>
                                        }
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setIsQuickPatientOpen(true)}
                                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-3.5 py-2.5 rounded-xl flex items-center justify-center transform hover:-translate-y-0.5 transition-all active:scale-95 shadow-md flex-shrink-0"
                                        title="Nuevo Paciente Rápido"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="12" y1="5" x2="12" y2="19"></line>
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Doctor (Sin prefix Dr.) */}
                        <div className="col-span-1 md:col-span-2">
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Doctor:</label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                <select
                                    name="doctorId"
                                    value={formData.doctorId}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none font-medium cursor-pointer"
                                >
                                    <option value={0}>-- Seleccione Doctor --</option>
                                    {doctors.map(d => (
                                        <option key={d.id} value={d.id}>{formatPaternoMaternoNombre(d)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Asistente */}
                        <div className="col-span-1 md:col-span-2">
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Asistente (Opcional):</label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                                <select
                                    name="asistenteId"
                                    value={formData.asistenteId}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none font-medium cursor-pointer"
                                >
                                    <option value={0}>-- Ninguno --</option>
                                    {personal.map(p => (
                                        <option key={p.id} value={p.id}>{formatPaternoMaternoNombre(p)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Presupuesto (Opcional) */}
                        {!isNonPatientEvent && (
                            <div className="col-span-1 md:col-span-2">
                                <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Presupuesto (Opcional):</label>
                                <div className="relative">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                        <polyline points="10 9 9 9 8 9"></polyline>
                                    </svg>
                                    <select
                                        name="proformaId"
                                        value={formData.proformaId}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 font-medium cursor-pointer"
                                        disabled={formData.pacienteId === 0}
                                    >
                                        <option value={0}>-- Ninguna --</option>
                                        {proformas.map(p => {
                                            const isCompleted = historiaClinica.some(h =>
                                                Number(h.proformaId) === Number(p.id) &&
                                                (h.estadoPresupuesto?.toLowerCase() === 'terminado' || h.estadoTratamiento?.toLowerCase() === 'terminado')
                                            );

                                            return (
                                                <option
                                                    key={p.id}
                                                    value={p.id}
                                                    style={isCompleted ? {
                                                        color: '#15803d',
                                                        backgroundColor: '#dcfce7',
                                                        fontWeight: 'bold'
                                                    } : undefined}
                                                >
                                                    {isCompleted ? '✓ ' : ''}No. {p.numero} - {p.fecha} {isCompleted ? '(Completado)' : ''}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Description for Non-Patient Event */}
                        {isNonPatientEvent && (
                            <div className="col-span-1 md:col-span-2">
                                <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Motivo / Descripción del Evento:</label>
                                <div className="relative">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-3.5 text-gray-400 pointer-events-none">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                    <textarea
                                        name="tratamiento"
                                        value={formData.tratamiento}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="Ej: Reunión, Viaje, Bloqueo de agenda..."
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                        required={isNonPatientEvent}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Tratamiento - Only show for patient events */}
                        {!isNonPatientEvent && (
                            <div className="col-span-1 md:col-span-2">
                                <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Tratamiento:</label>
                                <div className="relative">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`absolute left-3 text-gray-400 pointer-events-none ${formData.proformaId === 0 ? 'top-3.5' : 'top-1/2 -translate-y-1/2'}`}>
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                        <polyline points="10 9 9 9 8 9"></polyline>
                                    </svg>

                                    {formData.proformaId === 0 ? (
                                        <textarea
                                            name="tratamiento"
                                            value={formData.tratamiento}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-[65px] resize-y font-medium"
                                            placeholder="Detalle del tratamiento..."
                                        />
                                    ) : (
                                        <select
                                            name="tratamiento"
                                            value={formData.tratamiento}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none font-medium cursor-pointer"
                                        >
                                            <option value="">-- Seleccione Tratamiento --</option>
                                            {tratamientos.map((detalle, index) => {
                                                let isCompleted = false;

                                                if (detalle.piezas) {
                                                    const allPiezas = detalle.piezas.split('/').map((p: string) => p.trim());
                                                    const completedPieces: string[] = [];
                                                    historiaClinica.forEach(h => {
                                                        if (Number(h.proformaDetalleId) === Number(detalle.id) &&
                                                            (h.estadoTratamiento?.toLowerCase() === 'terminado' || h.estado?.toLowerCase() === 'terminado') &&
                                                            h.pieza) {
                                                            const pieces = h.pieza.split('/').map((p: string) => p.trim());
                                                            completedPieces.push(...pieces);
                                                        }
                                                    });
                                                    isCompleted = allPiezas.length > 0 && allPiezas.every((p: string) => completedPieces.includes(p));
                                                } else {
                                                    isCompleted = historiaClinica.some(h =>
                                                        Number(h.proformaDetalleId) === Number(detalle.id) &&
                                                        (h.estadoTratamiento?.toLowerCase() === 'terminado' || h.estado?.toLowerCase() === 'terminado')
                                                    );
                                                }

                                                const tratamientoText = detalle.arancel?.detalle || `Tratamiento ${index + 1}`;
                                                const piezasText = detalle.piezas ? ` - Piezas: ${detalle.piezas}` : '';

                                                return (
                                                    <option
                                                        key={index}
                                                        value={tratamientoText}
                                                        style={isCompleted ? {
                                                            color: '#15803d',
                                                            backgroundColor: '#dcfce7',
                                                            fontWeight: 'bold'
                                                        } : undefined}
                                                    >
                                                        {isCompleted ? '✓ ' : ''}{tratamientoText}{piezasText} {isCompleted ? '(Completado / Terminado)' : ''}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Estado */}
                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Estado:</label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                    <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                                    <line x1="12" y1="2" x2="12" y2="12"></line>
                                </svg>
                                <select
                                    name="estado"
                                    value={formData.estado}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none font-medium cursor-pointer"
                                >
                                    <option value="agendado">Agendado</option>
                                    <option value="confirmado">Confirmado</option>
                                    <option value="atendido">Atendido</option>
                                    <option value="no asistio">No Asistió</option>
                                    <option value="cancelado">Cancelado</option>
                                </select>
                            </div>
                        </div>

                        {/* Motivo de Cancelación - Only show when estado is cancelado */}
                        {formData.estado === 'cancelado' && (
                            <div className="col-span-1 md:col-span-2">
                                <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Motivo de Cancelación:</label>
                                <div className="relative">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-3.5 text-gray-400 pointer-events-none">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                    <textarea
                                        name="motivoCancelacion"
                                        value={formData.motivoCancelacion}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="Ingrese el motivo de la cancelación..."
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                    />
                                </div>
                            </div>
                        )}

                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-start gap-3 mt-6">
                        <button
                            type="submit"
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                <polyline points="7 3 7 8 15 8"></polyline>
                            </svg>
                            {initialData ? 'Actualizar' : 'Guardar'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2.5 px-5 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 text-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Cancelar
                        </button>
                        {initialData && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl ml-auto shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 text-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Eliminar
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <QuickPacienteForm
                isOpen={isQuickPatientOpen}
                onClose={() => setIsQuickPatientOpen(false)}
                onSuccess={handlePatientCreated}
            />
        </div>
    );
};

export default AgendaForm;
