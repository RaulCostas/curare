import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import type { Doctor, Proforma, HistoriaClinica } from '../types';
import { formatDateUTC } from '../utils/formatters';

interface ProximaCitaModalProps {
    isOpen: boolean;
    onClose: () => void;
    pacienteId: number;
    selectedProformaId?: number;
    proformas?: Proforma[];
    historia?: HistoriaClinica[];
    onSuccess: () => void;
    onOmitir?: () => void;
}

const getLocalDateString = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const ProximaCitaModal: React.FC<ProximaCitaModalProps> = ({
    isOpen,
    onClose,
    pacienteId,
    selectedProformaId = 0,
    proformas = [],
    historia = [],
    onSuccess,
    onOmitir
}) => {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [localProformas, setLocalProformas] = useState<Proforma[]>(proformas || []);
    
    const [formData, setFormData] = useState({
        fecha: getLocalDateString(),
        pieza: '',
        proformaId: selectedProformaId || 0,
        proformaDetalleId: 0,
        observaciones: '',
        doctorId: 0,
        estado: 'pendiente'
    });
    
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchDoctors();
            resetForm();
            if (!proformas || proformas.length === 0) {
                fetchProformas();
            } else {
                setLocalProformas(proformas);
            }
        }
    }, [isOpen, proformas]);

    useEffect(() => {
        if (selectedProformaId !== undefined) {
            setFormData(prev => ({ ...prev, proformaId: selectedProformaId }));
        }
    }, [selectedProformaId]);

    const fetchProformas = async () => {
        try {
            const response = await api.get(`/proformas/paciente/${pacienteId}`);
            const list = Array.isArray(response.data) ? response.data : [];
            setLocalProformas(list);
        } catch (error) {
            console.error('Error fetching proformas for citas:', error);
        }
    };

    const fetchDoctors = async () => {
        try {
            const response = await api.get('/doctors?limit=100');
            const allDoctors = response.data.data || response.data || [];
            const activeDoctors = allDoctors.filter((doctor: Doctor) => doctor.estado === 'activo');
            setDoctors(activeDoctors);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    const currentProformaDetails = useMemo(() => {
        const targetPlanId = formData.proformaId || selectedProformaId;
        if (!targetPlanId) return [];
        const proforma = localProformas.find(p => p.id === targetPlanId);
        return proforma ? proforma.detalles.filter((d: any) => !d.posible) : [];
    }, [formData.proformaId, selectedProformaId, localProformas]);

    const handleTreatmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const detailId = Number(e.target.value);
        if (detailId === 0) {
            setFormData(prev => ({ ...prev, proformaDetalleId: 0, pieza: '' }));
            return;
        }

        const detail = currentProformaDetails.find(d => d.id === detailId);
        if (detail) {
            setFormData(prev => ({
                ...prev,
                proformaDetalleId: detailId,
                pieza: detail.piezas || '',
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const targetProformaId = formData.proformaId || selectedProformaId;
            const payload = {
                ...formData,
                pacienteId,
                proformaId: targetProformaId && targetProformaId > 0 ? targetProformaId : undefined,
                doctorId: formData.doctorId > 0 ? formData.doctorId : undefined,
                proformaDetalleId: formData.proformaDetalleId > 0 ? formData.proformaDetalleId : undefined
            };

            await api.post('/proxima-cita', payload);
            
            await Swal.fire({
                icon: 'success',
                title: 'Próxima Cita Guardada',
                text: 'Próxima cita guardada correctamente',
                timer: 1500,
                showConfirmButton: false,
                customClass: { container: '!z-[9999]' }
            });

            onSuccess();
            handleClose();
        } catch (error) {
            console.error('Error saving proxima cita:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al guardar la próxima cita',
                customClass: { container: '!z-[9999]' }
            });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            fecha: getLocalDateString(),
            pieza: '',
            proformaId: selectedProformaId || 0,
            proformaDetalleId: 0,
            observaciones: '',
            doctorId: 0,
            estado: 'pendiente'
        });
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1100] p-3 sm:p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto border border-gray-100 dark:border-gray-700">
                <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-2xl flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <h3 className="text-lg sm:text-xl font-bold">
                        Paso 2: Registrar Próxima Cita
                    </h3>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="flex flex-col gap-6 mb-6">
                        {/* Fecha */}
                        <div>
                            <label className="block mb-2 font-bold text-gray-700 dark:text-gray-300 text-sm">Fecha</label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                <input
                                    type="date"
                                    value={formData.fecha}
                                    onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                        </div>

                        {/* Pieza */}
                        <div>
                            <label className="block mb-2 font-bold text-gray-700 dark:text-gray-300 text-sm">Pieza</label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                </svg>
                                <input
                                    type="text"
                                    value={formData.pieza}
                                    onChange={e => setFormData({ ...formData, pieza: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ej. 11, 12, 13..."
                                />
                            </div>
                        </div>

                        {/* Plan de Tratamiento */}
                        {localProformas.length > 0 && (
                            <div>
                                <label className="block mb-2 font-bold text-gray-700 dark:text-gray-300 text-sm">Plan de Tratamiento</label>
                                <div className="relative">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                        <polyline points="10 9 9 9 8 9"></polyline>
                                    </svg>
                                    <select
                                        value={formData.proformaId || 0}
                                        onChange={e => setFormData({ ...formData, proformaId: Number(e.target.value), proformaDetalleId: 0, pieza: '' })}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                    >
                                        <option value={0}>General (Sin plan específico)</option>
                                        {localProformas.map(p => (
                                            <option key={p.id} value={p.id}>
                                                Plan #{p.numero || p.id} ({formatDateUTC(p.fecha)})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Tratamiento de la Proforma */}
                        <div>
                            <label className="block mb-2 font-bold text-gray-700 dark:text-gray-300 text-sm">Tratamiento</label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                                </svg>
                                <select
                                    value={formData.proformaDetalleId}
                                    onChange={handleTreatmentChange}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value={0}>-- Seleccione Tratamiento --</option>
                                    {currentProformaDetails.map(d => {
                                        let isCompleted = false;

                                        if (d.piezas) {
                                            const allPiezas = d.piezas.split('/').map((p: string) => p.trim());
                                            const completedPieces: string[] = [];
                                            historia.forEach(h => {
                                                if (h.proformaDetalleId === d.id &&
                                                    h.estadoTratamiento === 'terminado' &&
                                                    h.pieza) {
                                                    const pieces = h.pieza.split('/').map((p: string) => p.trim());
                                                    completedPieces.push(...pieces);
                                                }
                                            });
                                            isCompleted = allPiezas.length > 0 && allPiezas.every((p: string) => completedPieces.includes(p));
                                        } else {
                                            isCompleted = historia.some(h =>
                                                h.proformaDetalleId === d.id &&
                                                h.estadoTratamiento === 'terminado'
                                            );
                                        }

                                        return (
                                            <option
                                                key={d.id}
                                                value={d.id}
                                                style={isCompleted ? {
                                                    color: '#16a34a',
                                                    fontWeight: 'bold'
                                                } : undefined}
                                            >
                                                {d.arancel ? d.arancel.detalle : 'Tratamiento'} {d.piezas ? `(Pz: ${d.piezas})` : ''} {isCompleted ? '(Completado)' : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>

                        {/* Doctor */}
                        <div>
                            <label className="block mb-2 font-bold text-gray-700 dark:text-gray-300 text-sm">Doctor</label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                <select
                                    value={formData.doctorId}
                                    onChange={e => setFormData({ ...formData, doctorId: Number(e.target.value) })}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                >
                                    <option value={0}>-- Seleccione --</option>
                                    {doctors.map(d => (
                                        <option key={d.id} value={d.id}>{d.paterno} {d.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Observaciones */}
                        <div>
                            <label className="block mb-2 font-bold text-gray-700 dark:text-gray-300 text-sm">Observaciones / Detalle</label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                                <input
                                    type="text"
                                    value={formData.observaciones}
                                    onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ej. Revisión general..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-gray-200 dark:border-gray-700 justify-start mt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-xl font-bold shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                <polyline points="7 3 7 8 15 8"></polyline>
                            </svg>
                            {loading ? 'Guardando...' : 'Siguiente'}
                        </button>
                        {onOmitir && (
                            <button
                                type="button"
                                onClick={() => {
                                    onOmitir();
                                    handleClose();
                                }}
                                disabled={loading}
                                className="px-5 py-2.5 bg-gray-500 hover:bg-gray-600 active:scale-95 text-white rounded-xl font-bold shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                </svg>
                                Omitir
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProximaCitaModal;
