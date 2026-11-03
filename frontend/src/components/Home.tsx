import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';
import type { Personal, GastoFijo, Inventario, Recordatorio, RecordatorioTratamiento, RecordatorioPlan } from '../types';

import { getLocalDateString, formatDate } from '../utils/dateUtils';
import { formatPaternoMaternoNombre, formatCurrency } from '../utils/formatters';
import Pagination from './Pagination';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const [birthdays, setBirthdays] = useState<Personal[]>([]);
    const [stats, setStats] = useState<{ totalPacientes: number, birthdayPacientes: any[] }>({ totalPacientes: 0, birthdayPacientes: [] });
    const [todayAppointmentsCount, setTodayAppointmentsCount] = useState(0);
    const [dueGastos, setDueGastos] = useState<GastoFijo[]>([]);
    const [labAlerts, setLabAlerts] = useState<any[]>([]);
    const [lowStockItems, setLowStockItems] = useState<Inventario[]>([]);
    const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([]);
    const [tratamientosPendientes, setTratamientosPendientes] = useState<RecordatorioTratamiento[]>([]);
    const [planesPendientes, setPlanesPendientes] = useState<RecordatorioPlan[]>([]);
    const [birthdaySentIds, setBirthdaySentIds] = useState<Set<number>>(new Set());
    const [birthdayLoadingIds, setBirthdayLoadingIds] = useState<Set<number>>(new Set());
    const [selectedDestinoGasto, setSelectedDestinoGasto] = useState<string>('todos');
    const [selectedGrupoStock, setSelectedGrupoStock] = useState<string>('todos');
    const [grupos, setGrupos] = useState<any[]>([]);
    const birthdayLoadingRef = useRef<Set<number>>(new Set());

    // Permission Logic
    const userString = localStorage.getItem('user');
    let user = null;
    try {
        user = userString ? JSON.parse(userString) : null;
    } catch {
        user = null;
    }
    const permisos = (user && Array.isArray(user.permisos)) ? user.permisos : [];
    const hasAccess = (moduleId: string) => !permisos.includes(moduleId);

    useEffect(() => {
        fetchBirthdays();
        fetchStats();
        fetchTodayAppointments();
        fetchDueGastos();
        fetchLabAlerts();
        fetchLowStockItems();
        fetchNoRegistrados();
        fetchRecordatorios();
        fetchTratamientosPendientes();
        fetchPlanesPendientes();
        fetchGrupos();
    }, []);

    const fetchPlanesPendientes = async () => {
        try {
            const response = await api.get<RecordatorioPlan[]>('/recordatorio-plan/pendientes');
            setPlanesPendientes(response.data);
        } catch (error) {
            console.error('Error fetching planes pendientes:', error);
        }
    };

    const fetchTratamientosPendientes = async () => {
        try {
            const response = await api.get<RecordatorioTratamiento[]>('/recordatorio-tratamiento/pendientes');
            setTratamientosPendientes(response.data);
        } catch (error) {
            console.error('Error fetching tratamientos pendientes:', error);
        }
    };

    const handleCompletarTratamiento = async (id: number) => {
        try {
            await api.patch(`/recordatorio-tratamiento/${id}`, { estado: 'completado' });
            fetchTratamientosPendientes(); // Refresh list
        } catch (error) {
            console.error('Error al completar tratamiento:', error);
        }
    };

    const handleCompletarPlan = async (id: number) => {
        try {
            await api.patch(`/recordatorio-plan/${id}`, { estado: 'inactivo' });
            fetchPlanesPendientes();
        } catch (error) {
            console.error('Error al completar plan:', error);
        }
    };

    const handleCompletarRecordatorioGeneral = async (id: number) => {
        try {
            await api.patch(`/recordatorio/${id}`, { estado: 'inactivo' }); // Assuming 'inactivo' means processed/done for general reminders
            fetchRecordatorios();
        } catch (error) {
            console.error('Error al completar recordatorio:', error);
        }
    };

    const fetchTodayAppointments = async () => {
        try {
            const today = getLocalDateString();
            const response = await api.get(`/agenda?date=${today}`);
            if (response.data) {
                setTodayAppointmentsCount(response.data.length);
            }
        } catch (error) {
            console.error('Error fetching today appointments:', error);
        }
    };

    const fetchBirthdays = async () => {
        try {
            const response = await api.get<Personal[]>('/personal/birthdays');
            setBirthdays(response.data);
        } catch (error) {
            console.error('Error fetching birthdays:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/pacientes/dashboard-stats');
            setStats(response.data);
            if (response.data?.birthdayPacientes) {
                const sentIds = new Set<number>();
                response.data.birthdayPacientes.forEach((p: any) => {
                    if (p.felicitacion_enviada) {
                        sentIds.add(p.id);
                    }
                });
                setBirthdaySentIds(sentIds);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchDueGastos = async () => {
        try {
            const response = await api.get<GastoFijo[]>('/gastos-fijos');
            const gastos = response.data;
            const today = new Date();
            const currentDay = today.getDate();
            const currentMonth = today.toLocaleDateString('es-ES', { month: 'long' }).toLowerCase();

            const due = gastos.filter(gasto => {
                if (gasto.dia !== currentDay) return false;
                if (gasto.anual) {
                    return gasto.mes?.toLowerCase() === currentMonth;
                }
                return true; // Monthly expense matches day
            });
            setDueGastos(due);
        } catch (error) {
            console.error('Error fetching due expenses:', error);
        }
    };


    const calculateAge = (dateString: string) => {
        const birthDate = new Date(dateString);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const fetchLabAlerts = async () => {
        try {
            const response = await api.get('/trabajos-laboratorios/alertas/terminados-sin-cita');
            setLabAlerts(response.data);
        } catch (error) {
            console.error('Error fetching lab alerts:', error);
        }
    };

    const fetchLowStockItems = async () => {
        try {
            const response = await api.get<Inventario[]>('/inventario/alertas/bajo-stock');
            setLowStockItems(response.data);
        } catch (error) {
            console.error('Error fetching low stock items:', error);
        }
    };

    const fetchGrupos = async () => {
        try {
            const response = await api.get<any>('/grupo-inventario?limit=1000');
            const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
            const sorted = [...data].sort((a: any, b: any) => (a.grupo || '').localeCompare(b.grupo || ''));
            setGrupos(sorted);
        } catch (error) {
            console.error('Error fetching grupos:', error);
        }
    };

    const destinosDisponibles = ['Casa', 'Consultorio'];

    const filteredDueGastos = useMemo(() => {
        if (selectedDestinoGasto === 'todos') return dueGastos;
        return dueGastos.filter(g => (g.destino || '').trim().toUpperCase() === selectedDestinoGasto.trim().toUpperCase());
    }, [dueGastos, selectedDestinoGasto]);

    const gruposStockDisponibles = useMemo(() => {
        if (grupos.length > 0) return grupos;
        const map = new Map<number, string>();
        lowStockItems.forEach(item => {
            if (item.grupoInventario?.id && item.grupoInventario?.grupo) {
                map.set(item.grupoInventario.id, item.grupoInventario.grupo);
            }
        });
        return Array.from(map.entries())
            .map(([id, grupo]) => ({ id, grupo }))
            .sort((a, b) => a.grupo.localeCompare(b.grupo));
    }, [grupos, lowStockItems]);

    const filteredLowStockItems = useMemo(() => {
        if (selectedGrupoStock === 'todos') return lowStockItems;
        return lowStockItems.filter(item => 
            item.idgrupo_inventario?.toString() === selectedGrupoStock ||
            item.grupoInventario?.id?.toString() === selectedGrupoStock
        );
    }, [lowStockItems, selectedGrupoStock]);

    const [noRegistrados, setNoRegistrados] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchNoRegistrados = async () => {
        try {
            const response = await api.get('/pacientes/no-registrados');
            const data = Array.isArray(response.data) ? response.data : [];
            const validPacientes = data.filter((item: any) => 
                item.pacienteId && 
                formatPaternoMaternoNombre(item).trim() !== '' &&
                !formatPaternoMaternoNombre(item).toLowerCase().includes('bloqueo') &&
                !formatPaternoMaternoNombre(item).toLowerCase().includes('evento') &&
                item.estado?.toLowerCase() !== 'inactivo'
            );
            setNoRegistrados(validPacientes);
        } catch (error) {
            console.error('Error fetching no registrados:', error);
        }
    };

    const fetchRecordatorios = async () => {
        try {
            const usuarioId = user?.id;
            const response = await api.get<Recordatorio[]>(`/recordatorio/activos${usuarioId ? `?usuarioId=${usuarioId}` : ''}`);
            setRecordatorios(response.data);
        } catch (error) {
            console.error('Error fetching recordatorios:', error);
        }
    };

    return (
        <div className="content-card bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm transition-colors duration-200">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2 text-center">Bienvenido a CURARE</h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 text-center mb-8">
                Sistema de Gestión de Consultorio Dental.
            </p>

            {/* Pacientes No Registrados Section */}
            {hasAccess('dashboard_pacientes_no_registrados') && noRegistrados.length > 0 && (
                <div className="mb-8 bg-amber-50/50 dark:bg-amber-950/20 border-l-4 border-amber-500 p-6 rounded-r-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-extrabold text-amber-900 dark:text-amber-300 mb-4 flex items-center gap-2">
                        <span>⚠️</span> Pacientes Agendados (Atendidos) Sin Registro de Historia Clínica
                    </h2>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
                        {/* Header info bar - Mostrando contador */}
                        <div className="flex justify-between items-center mb-3 px-1">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                Mostrando {noRegistrados.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, noRegistrados.length)} de {noRegistrados.length} registros
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-700/80 border-b border-gray-200 dark:border-gray-600 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                        <th className="p-3">Paciente</th>
                                        <th className="p-3">Fecha (cita)</th>
                                        <th className="p-3">Consultorio</th>
                                        <th className="p-3">Hora</th>
                                        <th className="p-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                    {noRegistrados.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="p-3 font-medium text-gray-900 dark:text-white">{formatPaternoMaternoNombre(item)}</td>
                                            <td className="p-3 text-gray-700 dark:text-gray-300">{formatDate(item.fecha)}</td>
                                            <td className="p-3 text-gray-700 dark:text-gray-300">Consultorio #{item.consultorio}</td>
                                            <td className="p-3 text-gray-700 dark:text-gray-300">{item.hora ? item.hora.substring(0, 5) : '-'}</td>
                                            <td className="p-3 text-right">
                                                <button
                                                    onClick={() => navigate(`/pacientes/${item.pacienteId}/historia-clinica`)}
                                                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm transform hover:-translate-y-0.5"
                                                >
                                                    Llenar Historia Clínica
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination footer (Centered, only shown when > 10 records) */}
                        <Pagination
                            currentPage={currentPage}
                            totalPages={Math.ceil(noRegistrados.length / itemsPerPage)}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>
            )}

            {/* Recordatorios Section */}
            {recordatorios.length > 0 && (
                <div className="mb-8 bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 p-6 rounded-r-lg shadow-sm">
                    <h2 className="text-xl font-bold text-purple-700 dark:text-purple-300 mb-4 flex items-center gap-2">
                        <span>🔔</span> Recordatorios Activos
                    </h2>
                    <div className="space-y-3">
                        {recordatorios.map(recordatorio => (
                            <div
                                key={recordatorio.id}
                                className="flex justify-between items-start bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${recordatorio.tipo === 'personal'
                                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                            }`}>
                                            {recordatorio.tipo === 'personal' ? '👤 Personal' : '🏥 Consultorio'}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatDate(recordatorio.fecha)} - {recordatorio.hora.substring(0, 5)}
                                        </span>
                                    </div>
                                    <p className="text-gray-800 dark:text-white font-medium mb-1">
                                        {recordatorio.mensaje}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Repetir: {recordatorio.repetir}
                                    </p>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="text-2xl text-purple-500 dark:text-purple-400">
                                        🔔
                                    </div>
                                    <button
                                        onClick={() => handleCompletarRecordatorioGeneral(recordatorio.id)}
                                        title="Marcar como visto / inactivar"
                                        className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tratamientos Pendientes Section */}
            {tratamientosPendientes.length > 0 && (
                <div className="mb-8 bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500 p-6 rounded-r-lg shadow-sm">
                    <h2 className="text-xl font-bold text-indigo-700 dark:text-indigo-300 mb-4 flex items-center gap-2">
                        <span>📋</span> Seguimiento de Tratamientos
                    </h2>
                    <div className="space-y-3">
                        {tratamientosPendientes.map(recordatorio => (
                            <div
                                key={recordatorio.id}
                                className="flex justify-between items-start bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                                            Tratamiento
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatDate(recordatorio.fechaRecordatorio)}
                                        </span>
                                    </div>
                                    <div className="text-gray-800 dark:text-white mb-1">
                                        <span className="font-bold block text-lg">{formatPaternoMaternoNombre(recordatorio.historiaClinica?.paciente)}</span>
                                        <div className="text-sm mt-1">
                                            <span className="font-semibold text-indigo-700 dark:text-indigo-300">Tratamiento:</span> {recordatorio.historiaClinica?.tratamiento}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            Fecha Cita: {formatDate(recordatorio.historiaClinica?.fecha)} • Recordatorio a los {recordatorio.dias} días
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/pacientes/${recordatorio.historiaClinica?.pacienteId}/historia-clinica`)}
                                        className="mt-3 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
                                    >
                                        Ver Historia Clínica
                                    </button>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="text-2xl text-indigo-500 dark:text-indigo-400">
                                        📋
                                    </div>
                                    <button
                                        onClick={() => handleCompletarTratamiento(recordatorio.id)}
                                        title="Marcar como visto / completado"
                                        className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Planes Pendientes Section */}
            {planesPendientes.length > 0 && (
                <div className="mb-8 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-6 rounded-r-lg shadow-sm">
                    <h2 className="text-xl font-bold text-blue-700 dark:text-blue-300 mb-4 flex items-center gap-2">
                        <span>🗓️</span> Seguimiento de Planes
                    </h2>
                    <div className="space-y-3">
                        {planesPendientes.map(plan => (
                            <div
                                key={plan.id}
                                className="flex justify-between items-start bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                            Plan #{plan.proforma?.numero || plan.proforma?.id}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatDate(plan.fechaRecordatorio)}
                                        </span>
                                    </div>
                                    <div className="text-gray-800 dark:text-white mb-1">
                                        <span className="font-bold block text-lg">{formatPaternoMaternoNombre(plan.proforma?.paciente)}</span>
                                        <div className="text-sm mt-1">
                                            {plan.mensaje}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            Fecha Plan: {formatDate(plan.proforma?.fecha)} • Recordatorio a los {plan.dias} días
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/pacientes/${plan.proforma?.pacienteId}/historia-clinica`)}
                                        className="mt-3 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
                                    >
                                        Ver Historia Clínica
                                    </button>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="text-2xl text-blue-500 dark:text-blue-400">
                                        🗓️
                                    </div>
                                    <button
                                        onClick={() => handleCompletarPlan(plan.id)}
                                        title="Marcar como visto / completado"
                                        className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Expenses Due Today Section */}
            {hasAccess('dashboard_gastos_vencidos') && dueGastos.length > 0 && (
                <div className="mb-8 bg-pink-50 dark:bg-pink-900/20 border-l-4 border-pink-500 p-4 sm:p-6 rounded-r-lg shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <h2 className="text-xl font-bold text-pink-700 dark:text-pink-400 flex items-center gap-2">
                            <span>⚠️</span> Gastos Fijos por Pagar Hoy
                        </h2>
                        <div className="w-full sm:w-60">
                            <select
                                value={selectedDestinoGasto}
                                onChange={(e) => setSelectedDestinoGasto(e.target.value)}
                                className="w-full py-1.5 px-3 border border-pink-300 dark:border-pink-700 rounded-lg text-sm font-medium text-gray-800 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer shadow-sm"
                                title="Filtrar gastos por destino"
                            >
                                <option value="todos">Todos los Destinos</option>
                                {destinosDisponibles.map(dest => (
                                    <option key={dest} value={dest}>
                                        {dest}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {filteredDueGastos.length === 0 ? (
                            <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
                                No hay gastos fijos pendientes hoy para el destino "{selectedDestinoGasto}".
                            </div>
                        ) : (
                            filteredDueGastos.map(gasto => (
                                <div
                                    key={gasto.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-700 p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600"
                                >
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-gray-800 dark:text-white mb-1 break-words">
                                            {gasto.gasto_fijo}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-300">
                                            Destino: {gasto.destino} - <strong className="text-pink-600 dark:text-pink-300">{gasto.moneda === 'DOLARES' || gasto.moneda === '$us' ? '$us' : 'Bs.'} {formatCurrency(gasto.monto)}</strong>
                                        </p>
                                    </div>
                                    <div className="text-2xl text-pink-500 dark:text-pink-400 self-end sm:self-center shrink-0">
                                        💸
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Birthday Section */}
            {hasAccess('dashboard_cumpleanos') && birthdays.length > 0 && (
                <div className="mb-8 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4 sm:p-6 rounded-r-lg shadow-sm">
                    <h2 className="text-xl font-bold text-blue-700 dark:text-blue-300 mb-4 flex items-center gap-2">
                        <span>🎉</span> Cumpleaños de Personal Hoy
                    </h2>
                    <div className="space-y-3">
                        {birthdays.map(person => (
                            <div
                                key={person.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-700 p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600"
                            >
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold text-gray-800 dark:text-white mb-1 break-words">
                                        {formatPaternoMaternoNombre(person)}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-300">
                                        Cumple {calculateAge(person.fecha_nacimiento)} años hoy
                                    </p>
                                </div>
                                <div className="text-2xl sm:text-3xl animate-bounce self-end sm:self-center shrink-0">
                                    🎂
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Patient Birthday Section */}
            {hasAccess('dashboard_cumpleanos') && stats.birthdayPacientes.length > 0 && (
                <div className="mb-8 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 sm:p-6 rounded-r-lg shadow-sm">
                    <h2 className="text-xl font-bold text-green-700 dark:text-green-300 mb-4 flex items-center gap-2">
                        <span>🎉</span> Cumpleaños de Pacientes Hoy
                    </h2>
                    <div className="space-y-3">
                        {stats.birthdayPacientes.map((paciente: any) => {
                            const isSent = birthdaySentIds.has(paciente.id);
                            const isLoading = birthdayLoadingIds.has(paciente.id);
                            return (
                                <div
                                    key={paciente.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-700 p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600"
                                >
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-gray-800 dark:text-white mb-1 break-words">
                                            {formatPaternoMaternoNombre(paciente)}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-300">
                                            Cumple {calculateAge(paciente.fecha_nacimiento)} años hoy
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 w-full sm:w-auto">
                                        <button
                                            onClick={async () => {
                                                if (isSent || isLoading || birthdayLoadingRef.current.has(paciente.id)) return;
                                                birthdayLoadingRef.current.add(paciente.id);
                                                setBirthdayLoadingIds(prev => new Set(prev).add(paciente.id));
                                                try {
                                                    await api.post(`/chatbot/send-birthday/${paciente.id}`);
                                                    setBirthdaySentIds(prev => new Set(prev).add(paciente.id));
                                                    Swal.fire({
                                                        icon: 'success',
                                                        title: '¡Felicitación enviada!',
                                                        text: `Se envió la felicitación de cumpleaños a ${formatPaternoMaternoNombre(paciente)}.`,
                                                        timer: 2500,
                                                        showConfirmButton: false,
                                                    });
                                                } catch (err: any) {
                                                    const errorMsg = err.response?.data?.message || err.message || 'Verifica que el chatbot esté conectado a WhatsApp.';
                                                    const errorLower = String(errorMsg).toLowerCase();
                                                    const isAlreadySent = errorLower.includes('ya recibió') || errorLower.includes('ya recibio');

                                                    if (isAlreadySent) {
                                                        setBirthdaySentIds(prev => new Set(prev).add(paciente.id));
                                                        Swal.fire({
                                                            icon: 'info',
                                                            title: 'Felicitación ya enviada',
                                                            text: `El paciente ${formatPaternoMaternoNombre(paciente)} ya recibió la felicitación de cumpleaños.`,
                                                            confirmButtonText: 'OK',
                                                        });
                                                    } else {
                                                        Swal.fire({
                                                            icon: 'error',
                                                            title: 'Error al enviar mensaje',
                                                            text: errorMsg,
                                                            confirmButtonText: 'OK',
                                                        });
                                                    }
                                                } finally {
                                                    birthdayLoadingRef.current.delete(paciente.id);
                                                    setBirthdayLoadingIds(prev => { const s = new Set(prev); s.delete(paciente.id); return s; });
                                                }
                                            }}
                                            disabled={isSent || isLoading}
                                            title={isSent ? 'Felicitación enviada' : 'Enviar felicitación por WhatsApp'}
                                            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold shadow transition-all transform hover:-translate-y-0.5 ${
                                                isSent
                                                    ? 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                                    : 'bg-[#25D366] hover:bg-[#1ebe57] active:scale-95 text-white cursor-pointer'
                                            }`}
                                        >
                                            {isLoading ? (
                                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                                                </svg>
                                            ) : isSent ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                /* WhatsApp official icon */
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 32 32" fill="currentColor">
                                                    <path d="M16 0C7.163 0 0 7.163 0 16c0 2.833.738 5.494 2.027 7.8L0 32l8.434-2.01A15.937 15.937 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.27 13.27 0 01-6.77-1.851l-.485-.287-5.009 1.194 1.266-4.874-.317-.504A13.27 13.27 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333z"/>
                                                    <path d="M23.2 19.467c-.373-.187-2.208-1.088-2.55-1.213-.341-.124-.589-.187-.838.187-.248.373-.963 1.213-1.18 1.461-.217.249-.435.28-.808.093-.373-.187-1.574-.58-2.997-1.85-1.108-.988-1.856-2.208-2.073-2.581-.217-.373-.023-.574.163-.76.167-.167.373-.435.56-.652.187-.217.249-.373.373-.621.124-.249.062-.466-.031-.652-.093-.187-.838-2.022-1.148-2.77-.302-.727-.608-.627-.838-.639l-.714-.012c-.249 0-.652.093-.993.466-.342.373-1.304 1.274-1.304 3.106s1.336 3.606 1.522 3.855c.187.248 2.63 4.016 6.374 5.633.891.385 1.586.614 2.128.786.894.284 1.708.244 2.352.148.717-.107 2.208-.902 2.52-1.774.311-.871.311-1.617.218-1.774-.093-.156-.341-.249-.714-.436z"/>
                                                </svg>
                                            )}
                                            {isSent ? 'Enviado' : isLoading ? 'Enviando...' : 'Enviar Felicitaciones'}
                                        </button>
                                        <div className="text-2xl sm:text-3xl animate-bounce shrink-0">🎈</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Alertas Trabajos Laboratorio (Terminado Sin Cita) */}
            {hasAccess('dashboard_trabajos_pendientes') && labAlerts.length > 0 && (
                <div className="mb-8 bg-gray-100 dark:bg-gray-700/50 border-l-4 border-gray-500 p-6 rounded-r-lg shadow-sm">
                    <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                        <span>⚠️</span> Trabajos Terminados Sin Cita
                    </h2>
                    <div className="space-y-3">
                        {labAlerts.map(work => (
                            <div
                                key={work.id}
                                className="flex flex-col gap-1 bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600"
                            >
                                <div className="font-bold text-red-500 dark:text-red-400 mb-1">
                                    El siguiente trabajo de Laboratorio se encuentra en la Clínica, y el Paciente no tiene Cita Agendada
                                </div>
                                <div className="text-gray-800 dark:text-white">
                                    <span className="font-semibold">Laboratorio:</span> {work.laboratorio?.laboratorio}
                                </div>
                                <div className="text-gray-800 dark:text-white">
                                    <span className="font-semibold">Paciente:</span> {formatPaternoMaternoNombre(work.paciente)}
                                </div>
                                <div className="text-gray-800 dark:text-white">
                                    <span className="font-semibold">Trabajo:</span> {work.precioLaboratorio?.detalle} (Elemento Dental: {work.pieza})
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Terminado el: {formatDate(work.fecha_terminado)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Low Stock Alert Section */}
            {hasAccess('dashboard_stock_minimo') && lowStockItems.length > 0 && (
                <div className="mb-8 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 sm:p-6 rounded-r-lg shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <h2 className="text-xl font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                            <span>⚠️</span> Alerta de Stock Bajo
                        </h2>
                        <div className="w-full sm:w-60">
                            <select
                                value={selectedGrupoStock}
                                onChange={(e) => setSelectedGrupoStock(e.target.value)}
                                className="w-full py-1.5 px-3 border border-red-300 dark:border-red-700 rounded-lg text-sm font-medium text-gray-800 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer shadow-sm"
                                title="Filtrar stock bajo por grupo"
                            >
                                <option value="todos">Todos los Grupos</option>
                                {gruposStockDisponibles.map(g => (
                                    <option key={g.id} value={g.id.toString()}>
                                        {g.grupo}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {filteredLowStockItems.length === 0 ? (
                            <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
                                No hay productos con stock bajo para este grupo.
                            </div>
                        ) : (
                            filteredLowStockItems.map(item => (
                                <div
                                    key={item.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-700 p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600"
                                >
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-gray-800 dark:text-white mb-1 break-words">{item.descripcion}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-300">
                                            Cantidad: <span className="font-bold text-red-500 dark:text-red-400">{item.cantidad_existente}</span> | Mínimo Requerido: {item.stock_minimo}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">
                                            Especialidad: {item.especialidad?.especialidad} | Grupo: {item.grupoInventario?.grupo || 'Sin Grupo'}
                                        </p>
                                    </div>
                                    <div className="text-2xl text-red-500 dark:text-red-400 self-end sm:self-center shrink-0">
                                        📉
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            <div className="mt-8 sm:mt-12 flex justify-center gap-4 sm:gap-6 flex-wrap">
                <div className="p-4 sm:p-6 bg-blue-500 text-white rounded-xl w-full sm:w-52 text-center shadow-lg hover:shadow-xl transition-shadow transform hover:-translate-y-1 duration-200">
                    <h3 className="mb-1 sm:mb-2 text-base sm:text-lg font-medium opacity-90">Pacientes</h3>
                    <p className="text-2xl sm:text-3xl font-bold">{stats.totalPacientes}</p>
                </div>
                {hasAccess('dashboard_citas_hoy') && (
                    <div className="p-4 sm:p-6 bg-green-500 text-white rounded-xl w-full sm:w-52 text-center shadow-lg hover:shadow-xl transition-shadow transform hover:-translate-y-1 duration-200">
                        <h3 className="mb-1 sm:mb-2 text-base sm:text-lg font-medium opacity-90">Citas Hoy</h3>
                        <p className="text-2xl sm:text-3xl font-bold">{todayAppointmentsCount}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
