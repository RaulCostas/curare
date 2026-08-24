import React, { useState, useEffect } from 'react';
import api from '../services/api';
import type { Personal } from '../types';
import Swal from 'sweetalert2';
import ManualModal, { type ManualSection } from './ManualModal';
import { getLocalDateString } from '../utils/dateUtils';

interface VacacionesFormProps {
    isOpen: boolean;
    onClose: () => void;
    id?: number | null;
    onSaveSuccess: () => void;
}

const VacacionesForm: React.FC<VacacionesFormProps> = ({ isOpen, onClose, id, onSaveSuccess }) => {
    const isEditing = Boolean(id);

    const [personalList, setPersonalList] = useState<Personal[]>([]);

    const [idpersonal, setIdPersonal] = useState<number | ''>('');
    const [fecha, setFecha] = useState(getLocalDateString());
    const [tipoSolicitud, setTipoSolicitud] = useState('Vacación');
    const [cantidadDias, setCantidadDias] = useState(0);
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [autorizado, setAutorizado] = useState('');
    const [observaciones, setObservaciones] = useState('');

    const [diasTomados, setDiasTomados] = useState(0);
    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Solicitudes de Vacaciones',
            content: 'Registre solicitudes de vacaciones y permisos del personal. El sistema calcula automáticamente los días disponibles según la antigüedad.'
        },
        {
            title: 'Tipos de Solicitud',
            content: 'Vacación, A cuenta de vacación, Permiso con/sin goce de haber, Compensación, Reemplazo. Cada tipo afecta diferente el saldo de vacaciones.'
        },
        {
            title: 'Saldo de Vacaciones',
            content: 'El sistema muestra los días disponibles, tomados y restantes. Los días se calculan automáticamente según la fecha de ingreso del personal.'
        }
    ];

    const tipoSolicitudOptions = [
        'Vacación',
        'A cuenta de vacación',
        'Permiso con goce de haber',
        'Permiso sin goce de haber',
        'Compensación',
        'Reemplazo'
    ];

    useEffect(() => {
        if (!isOpen) return;

        fetchPersonal();
        if (isEditing && id) {
            fetchVacacion(id);
        } else {
            setIdPersonal('');
            setFecha(getLocalDateString());
            setTipoSolicitud('Vacación');
            setCantidadDias(0);
            setFechaDesde('');
            setFechaHasta('');
            setAutorizado('');
            setObservaciones('');
        }
    }, [isOpen, id, isEditing]);

    useEffect(() => {
        if (idpersonal && isOpen) {
            api.get(`/vacaciones/dias-tomados/${idpersonal}`)
                .then(res => setDiasTomados(Number(res.data) || 0))
                .catch(console.error);
        } else {
            setDiasTomados(0);
        }
    }, [idpersonal, isOpen]);

    const fetchPersonal = async () => {
        try {
            const response = await api.get('/personal?limit=1000');
            const activePersonal = (response.data.data || []).filter((person: any) => person.estado === 'activo');
            setPersonalList(activePersonal);
        } catch (error) {
            console.error('Error fetching personal:', error);
        }
    };

    const fetchVacacion = async (vacacionId: number) => {
        try {
            const response = await api.get(`/vacaciones/${vacacionId}`);
            const data = response.data;
            setIdPersonal(data.idpersonal);
            setFecha(data.fecha.split('T')[0]);
            setTipoSolicitud(data.tipo_solicitud);
            setCantidadDias(data.cantidad_dias);
            setFechaDesde(data.fecha_desde.split('T')[0]);
            setFechaHasta(data.fecha_hasta.split('T')[0]);
            setAutorizado(data.autorizado);
            setObservaciones(data.observaciones || '');
        } catch (error) {
            console.error('Error fetching vacacion:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            idpersonal: Number(idpersonal),
            fecha,
            tipo_solicitud: tipoSolicitud,
            cantidad_dias: Number(cantidadDias),
            fecha_desde: fechaDesde,
            fecha_hasta: fechaHasta,
            autorizado,
            observaciones
        };

        try {
            if (isEditing && id) {
                await api.patch(`/vacaciones/${id}`, payload);
                await Swal.fire({
                    icon: 'success',
                    title: '¡Actualizado!',
                    text: 'La solicitud ha sido actualizada correctamente',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                await api.post('/vacaciones', payload);
                await Swal.fire({
                    icon: 'success',
                    title: '¡Guardado!',
                    text: 'La solicitud ha sido creada correctamente',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
            onSaveSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving vacacion:', error);
            const errorMessage = error.response?.data?.message || 'Error al guardar la solicitud';
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage
            });
        }
    };

    const renderVacationInfo = () => {
        if (!idpersonal) return null;
        const person = personalList.find(p => p.id === Number(idpersonal));

        if (person && person.fecha_ingreso) {
            const fechaParts = person.fecha_ingreso.toString().split('T')[0].split('-');
            const year = parseInt(fechaParts[0]);
            const month = parseInt(fechaParts[1]) - 1;
            const day = parseInt(fechaParts[2]);

            const ingreso = new Date(year, month, day);
            const hoy = new Date();

            let years = hoy.getFullYear() - ingreso.getFullYear();
            const m = hoy.getMonth() - ingreso.getMonth();
            if (m < 0 || (m === 0 && hoy.getDate() < ingreso.getDate())) {
                years--;
            }

            let diasCorrespondientes = 0;
            if (years >= 1 && years <= 5) diasCorrespondientes = 15;
            else if (years >= 6 && years <= 10) diasCorrespondientes = 20;
            else if (years >= 11) diasCorrespondientes = 30;

            const displayDate = `${day}/${month + 1}/${year}`;
            const saldo = diasCorrespondientes - diasTomados;

            return (
                <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-3 rounded-r-xl my-3">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                        <strong>Fecha Ingreso:</strong> {displayDate} | <strong>Antigüedad:</strong> {years} {years === 1 ? 'año' : 'años'}
                    </p>
                    <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-blue-200 dark:border-blue-700/50">
                        <div className="text-center">
                            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium uppercase">Corresponden</p>
                            <p className="font-bold text-base text-blue-800 dark:text-blue-200">{diasCorrespondientes}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] text-red-600 dark:text-red-400 font-medium uppercase">Tomados</p>
                            <p className="font-bold text-base text-red-800 dark:text-red-300">-{diasTomados}</p>
                        </div>
                        <div className="text-center bg-white dark:bg-gray-700 rounded shadow-sm">
                            <p className="text-[10px] text-green-600 dark:text-green-400 font-bold uppercase">Saldo</p>
                            <p className={`font-bold text-base ${saldo < 0 ? 'text-red-600' : 'text-green-700 dark:text-green-300'}`}>
                                {saldo}
                            </p>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000] p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-[600px] max-w-[95%] max-h-[90vh] overflow-y-auto shadow-2xl text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-700 pb-3">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <span className="p-2.5 bg-cyan-100 dark:bg-cyan-900/60 rounded-xl text-cyan-600 dark:text-cyan-300 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </span>
                        {isEditing ? 'Editar Solicitud de Vacación' : 'Nueva Solicitud de Vacación'}
                    </h2>
                    <div className="flex items-center gap-2">
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
                            onClick={onClose}
                            className="text-gray-400 bg-transparent hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full transition-all"
                            title="Cerrar"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Personal:</label>
                        <div className="relative">
                            <select
                                value={idpersonal}
                                onChange={(e) => setIdPersonal(Number(e.target.value))}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                                required
                            >
                                <option value="">Seleccione Personal...</option>
                                {personalList.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.paterno} {p.materno} {p.nombre}
                                    </option>
                                ))}
                            </select>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 absolute left-3 top-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                    </div>

                    {renderVacationInfo()}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Fecha Solicitud:</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={fecha}
                                    onChange={(e) => setFecha(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium"
                                    required
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Tipo de Solicitud:</label>
                            <div className="relative">
                                <select
                                    value={tipoSolicitud}
                                    onChange={(e) => setTipoSolicitud(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                                >
                                    {tipoSolicitudOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 absolute left-3 top-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Días:</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="1"
                                    value={cantidadDias || ''}
                                    onChange={(e) => setCantidadDias(Number(e.target.value))}
                                    placeholder="Ej: 5"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium"
                                    required
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Desde:</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={fechaDesde}
                                    onChange={(e) => setFechaDesde(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium"
                                    required
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Hasta:</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={fechaHasta}
                                    onChange={(e) => setFechaHasta(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium"
                                    required
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Autorizado por:</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={autorizado}
                                onChange={(e) => setAutorizado(e.target.value)}
                                placeholder="Ej: Dr. Fernando Flores"
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium"
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>

                    <div>
                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Observaciones:</label>
                        <div className="relative">
                            <textarea
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                                rows={3}
                                placeholder="Ej: Vacaciones correspondientes al período 2025"
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium"
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-start items-center gap-3 mt-6">
                        <button
                            type="submit"
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm flex items-center gap-2 cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                <polyline points="7 3 7 8 15 8"></polyline>
                            </svg>
                            <span>{isEditing ? 'Actualizar' : 'Guardar'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2.5 px-5 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm flex items-center gap-2 cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                            <span>Cancelar</span>
                        </button>
                    </div>
                </form>
            </div>
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual - Vacaciones"
                sections={manualSections}
            />
        </div>
    );
};

export default VacacionesForm;
