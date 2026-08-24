import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import type { Doctor, Proforma, ProximaCita, Paciente, HistoriaClinica } from '../types';
import { formatDateUTC } from '../utils/formatters';
import ManualModal, { type ManualSection } from './ManualModal';
import Pagination from './Pagination';

interface ProximaCitaManagerProps {
    pacienteId: number;
    paciente: Paciente | null;
    selectedProformaId?: number;
    proformas?: Proforma[];
    historia?: HistoriaClinica[];
    onCitaSaved?: () => void;
}

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const ProximaCitaManager: React.FC<ProximaCitaManagerProps> = ({
    pacienteId,
    paciente,
    selectedProformaId = 0,
    proformas = [],
    historia = [],
    onCitaSaved
}) => {
    const [citas, setCitas] = useState<ProximaCita[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [localProformas, setLocalProformas] = useState<Proforma[]>(proformas || []);
    const [selectedPlanFilter, setSelectedPlanFilter] = useState<number>(selectedProformaId || 0);
    const [editingId, setEditingId] = useState<number | null>(null);

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
    const [showForm, setShowForm] = useState(false);
    const [showManual, setShowManual] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const itemsPerPage = 10;

    const manualSections: ManualSection[] = [
        {
            title: 'Próxima Cita',
            content: 'Gestione las futuras consultas del paciente para un plan de tratamiento específico o citas generales.'
        },
        {
            title: 'Detalles de la Cita',
            content: 'Indique la fecha, el doctor asignado, y seleccione el tratamiento específico del plan que se realizará.'
        },
        {
            title: 'Acciones',
            content: 'Puede programar nuevas citas, editarlas o eliminarlas. Use el botón de imprimir para generar un listado de citas futuras.'
        }
    ];

    useEffect(() => {
        if (pacienteId) {
            fetchCitas();
        }
        fetchDoctors();
    }, [pacienteId]);

    useEffect(() => {
        if (proformas && proformas.length > 0) {
            setLocalProformas(proformas);
        } else if (pacienteId) {
            fetchProformas();
        }
    }, [pacienteId, proformas]);

    useEffect(() => {
        if (selectedProformaId !== undefined) {
            setSelectedPlanFilter(selectedProformaId);
        }
    }, [selectedProformaId]);

    const fetchCitas = async () => {
        try {
            const response = await api.get(`/proxima-cita/paciente/${pacienteId}`);
            setCitas(response.data || []);
        } catch (error) {
            console.error('Error fetching proxima citas:', error);
        }
    };

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
        const targetPlanId = formData.proformaId || selectedPlanFilter || selectedProformaId;
        if (!targetPlanId) return [];
        const proforma = localProformas.find(p => p.id === targetPlanId);
        return proforma ? (proforma.detalles || []) : [];
    }, [formData.proformaId, selectedPlanFilter, selectedProformaId, localProformas]);

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
            const targetProformaId = formData.proformaId || (selectedPlanFilter > 0 ? selectedPlanFilter : undefined) || (selectedProformaId > 0 ? selectedProformaId : undefined);
            const payload = {
                ...formData,
                pacienteId,
                proformaId: targetProformaId && targetProformaId > 0 ? targetProformaId : undefined
            };

            if (editingId) {
                await api.patch(`/proxima-cita/${editingId}`, payload);
                Swal.fire({
                    icon: 'success',
                    title: 'Cita Actualizada',
                    text: 'Próxima cita actualizada correctamente',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                await api.post('/proxima-cita', payload);
                Swal.fire({
                    icon: 'success',
                    title: 'Cita Guardada',
                    text: 'Próxima cita guardada correctamente',
                    timer: 1500,
                    showConfirmButton: false
                });

                if (onCitaSaved) {
                    onCitaSaved();
                }
            }

            fetchCitas();
            resetForm();
            setShowForm(false);
        } catch (error) {
            console.error('Error saving proxima cita:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al guardar la próxima cita'
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
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (cita: ProximaCita) => {
        setEditingId(cita.id);
        const localDate = cita.fecha ? cita.fecha.split('T')[0] : getLocalDateString();
        setFormData({
            fecha: localDate,
            pieza: cita.pieza || '',
            proformaId: cita.proformaId || 0,
            proformaDetalleId: cita.proformaDetalleId || 0,
            observaciones: cita.observaciones || '',
            doctorId: cita.doctorId,
            estado: cita.estado
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "¿Está seguro de eliminar esta cita?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/proxima-cita/${id}`);
                Swal.fire({
                    icon: 'success',
                    title: 'Eliminado',
                    text: 'Cita eliminada correctamente',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchCitas();
                if (editingId === id) resetForm();
            } catch (error) {
                console.error('Error deleting proxima cita:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al eliminar la cita'
                });
            }
        }
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const date = new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Próximas Citas - Paciente #${pacienteId}</title>
                <style>
                    @page { size: A4; margin: 2cm 1.5cm 3cm 1.5cm; }
                    body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #333; }
                    .header { display: flex; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #3498db; }
                    .header img { height: 60px; margin-right: 20px; }
                    h1 { color: #2c3e50; margin: 0; font-size: 24px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background-color: #ebf5fb; color: #1e293b; padding: 12px 8px; text-align: left; font-weight: bold; border: 1px solid #cbd5e1; font-size: 11px; }
                    td { padding: 8px; border: 1px solid #ddd; font-size: 10px; }
                    tr:nth-child(even) { background-color: #f8f9fa; }
                    .footer { position: fixed; bottom: 0; left: 0; right: 0; padding: 10px 0; }
                    .footer-line { border-top: 1px solid #333; margin-bottom: 10px; }
                    .footer-content { display: flex; justify-content: flex-end; font-size: 9px; color: #666; }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="/logo-curare.png" alt="Curare Centro Dental">
                    <h1>Próximas Citas</h1>
                </div>
                
                <div style="margin-bottom: 20px; padding: 10px; background-color: #f8f9fa; border-left: 4px solid #3498db;">
                    <p style="margin: 0 0 5px 0;"><strong>PACIENTE:</strong> ${paciente ? `${paciente.paterno} ${paciente.materno} ${paciente.nombre}`.toUpperCase() : `Paciente #${pacienteId}`}</p>
                    <p style="margin: 0;"><strong>FILTRO PLAN:</strong> ${selectedPlanFilter > 0 ? (() => {
                const proforma = localProformas.find(p => p.id === selectedPlanFilter);
                return proforma ? `Plan #${proforma.numero || proforma.id} - ${formatDateUTC(proforma.fecha)}` : 'Plan especificado';
            })() : 'Todos los planes'}</p>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Tratamiento</th>
                            <th>Pieza</th>
                            <th>Observaciones</th>
                            <th>Doctor</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredCitas.map(cita => `
                            <tr>
                                <td>${formatDateUTC(cita.fecha)}</td>
                                <td>${cita.proformaDetalle?.arancel?.detalle || '-'}</td>
                                <td>${cita.pieza || '-'}</td>
                                <td>${cita.observaciones || '-'}</td>
                                <td>${cita.doctor ? `${cita.doctor.paterno} ${cita.doctor.nombre}` : '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="footer">
                    <div class="footer-line"></div>
                    <div class="footer-content">
                        <div>Fecha de impresión: ${date}</div>
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        setTimeout(function() { window.print(); window.close(); }, 500);
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();
    };

    // Filter citas by selected plan and search term
    const filteredCitas = useMemo(() => {
        let result = citas;

        if (selectedPlanFilter > 0) {
            result = result.filter(c => c.proformaId === selectedPlanFilter);
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(cita =>
                (cita.pieza?.toLowerCase() || '').includes(term) ||
                (cita.observaciones?.toLowerCase() || '').includes(term) ||
                (cita.proformaDetalle?.arancel?.detalle?.toLowerCase() || '').includes(term) ||
                (cita.doctor?.nombre?.toLowerCase() || '').includes(term) ||
                (cita.doctor?.paterno?.toLowerCase() || '').includes(term)
            );
        }

        return [...result].sort((a, b) => {
            const dateA = new Date(a.fecha).getTime();
            const dateB = new Date(b.fecha).getTime();
            return dateA - dateB;
        });
    }, [citas, selectedPlanFilter, searchTerm]);

    // Pagination
    const totalPages = Math.ceil(filteredCitas.length / itemsPerPage);
    const paginatedCitas = filteredCitas.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedPlanFilter]);

    if (!selectedProformaId || selectedProformaId === 0) {
        return (
            <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm text-center text-gray-500 dark:text-gray-400">
                <div className="flex flex-col items-center justify-center py-6">
                    <span className="p-3.5 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-2xl mb-3 shadow-inner">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    </span>
                    <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-1">Seleccione un Plan de Tratamiento</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                        Por favor, seleccione un Plan de Tratamiento en el desplegable superior para ver o registrar las próximas citas correspondientes.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-colors duration-300">
            {/* Header con Titulo y Filtro de Plan */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
                <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <span className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                        </span>
                        <span>Historial de Próximas Citas</span>
                    </h3>
                    {localProformas.length > 0 && (
                        <select
                            value={selectedPlanFilter}
                            onChange={e => setSelectedPlanFilter(Number(e.target.value))}
                            className="px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white text-xs font-bold shadow-sm"
                        >
                            <option value={0}>Todos los Planes ({citas.length} citas)</option>
                            {localProformas.map(p => (
                                <option key={p.id} value={p.id}>
                                    Plan #{p.numero || p.id} ({formatDateUTC(p.fecha)})
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {(showForm || editingId) && (
                <form onSubmit={handleSubmit} className="mb-8 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 animate-fade-in-down">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
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
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
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
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                >
                                    <option value={0}>-- Seleccione --</option>
                                    {doctors.map(d => (
                                        <option key={d.id} value={d.id}>{d.paterno} {d.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Plan de Tratamiento */}
                        {localProformas.length > 0 && (
                            <div>
                                <label className="block mb-2 font-bold text-gray-700 dark:text-gray-300 text-sm">Plan de Tratamiento</label>
                                <select
                                    value={formData.proformaId || 0}
                                    onChange={e => setFormData({ ...formData, proformaId: Number(e.target.value), proformaDetalleId: 0, pieza: '' })}
                                    className="w-full py-2 px-3 rounded-lg border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                >
                                    <option value={0}>General (Sin plan específico)</option>
                                    {localProformas.map(p => (
                                        <option key={p.id} value={p.id}>
                                            Plan #{p.numero || p.id} ({formatDateUTC(p.fecha)})
                                        </option>
                                    ))}
                                </select>
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
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value={0}>-- Seleccione Tratamiento --</option>
                                    {currentProformaDetails.filter(d => !d.posible).map(d => {
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
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Observaciones */}
                    <div className="mb-6">
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
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading || formData.doctorId === 0}
                            className={`px-6 py-2 rounded-lg font-bold text-white shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 ${editingId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-600 hover:bg-green-700'
                                } ${loading ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            {loading ? 'Guardando...' : (editingId ? 'Actualizar Cita' : 'Guardar Próxima Cita')}
                        </button>
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {/* Search Bar & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 border-b border-gray-200 dark:border-gray-700 pb-6">
                <div className="flex items-center gap-2 w-full md:max-w-md">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Buscar por tratamiento, doctor, pieza..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-300 text-sm"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                            className="px-3.5 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-medium rounded-xl text-sm transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                            title="Limpiar búsqueda"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Limpiar
                        </button>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>
                    {!showForm && !editingId && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            Nueva Cita
                        </button>
                    )}
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-bold shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 cursor-pointer"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <polyline points="6 9 6 2 18 2 18 9"></polyline>
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                            <rect x="6" y="14" width="12" height="8"></rect>
                        </svg>
                        Imprimir
                    </button>
                </div>
            </div>

            <div className="flex justify-between items-center mb-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">
                    Mostrando <span className="text-gray-800 dark:text-gray-200">{filteredCitas.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredCitas.length)}</span> de <span>{filteredCitas.length}</span> registros
                </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tratamiento</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Pieza</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Observaciones</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Doctor</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedCitas.map((cita) => (
                            <tr key={cita.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-medium">
                                    {formatDateUTC(cita.fecha)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 font-medium">
                                    {cita.proformaDetalle?.arancel?.detalle || '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                    {cita.pieza || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={cita.observaciones}>
                                    {cita.observaciones || '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                    {cita.doctor ? `${cita.doctor.paterno} ${cita.doctor.nombre}` : '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => handleEdit(cita)}
                                            className="p-1.5 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                            title="Editar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cita.id)}
                                            className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                            title="Eliminar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {paginatedCitas.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                                    <div className="flex flex-col items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-lg font-medium">{searchTerm ? 'No se encontraron resultados.' : 'No hay próximas citas registradas.'}</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Próxima Cita"
                sections={manualSections}
            />
        </div>
    );
};

export default ProximaCitaManager;
