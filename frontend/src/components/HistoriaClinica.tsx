import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';
import type { Paciente, HistoriaClinica as HistoriaClinicaType, Proforma, Pago } from '../types';
import HistoriaClinicaForm from './HistoriaClinicaForm';
import HistoriaClinicaList from './HistoriaClinicaList';
import ProximaCitaManager from './ProximaCitaManager';
import SecuenciaTratamientoManager from './SecuenciaTratamientoManager';
import MaterialUtilizadoModal from './MaterialUtilizadoModal';
import PlanTratamientoModal from './PlanTratamientoModal';
import RecordatorioTratamientoModal from './RecordatorioTratamientoModal';
import RecordatorioPlanModal from './RecordatorioPlanModal';
import SeguimientoClinicoModal from './SeguimientoClinicoModal';
import { Activity } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { formatDateUTC } from '../utils/formatters';

const HistoriaClinica: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [paciente, setPaciente] = useState<Paciente | null>(null);
    const [historia, setHistoria] = useState<HistoriaClinicaType[]>([]);
    const [proformas, setProformas] = useState<Proforma[]>([]);
    const [pagos, setPagos] = useState<Pago[]>([]);
    const [musicaPreferences, setMusicaPreferences] = useState<string[]>([]);
    const [televisionPreferences, setTelevisionPreferences] = useState<string[]>([]);
    const [selectedProformaId, setSelectedProformaId] = useState<number>(0);

    const [activeTab, setActiveTab] = useState<'historia' | 'cita' | 'secuencia'>('historia');
    const [historiaToEdit, setHistoriaToEdit] = useState<HistoriaClinicaType | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [showSeguimientoModal, setShowSeguimientoModal] = useState(false);
    const [showRecordatorioPlanModal, setShowRecordatorioPlanModal] = useState(false);
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [selectedReminderHistoria, setSelectedReminderHistoria] = useState<HistoriaClinicaType | null>(null);

    // Material Utilizado workflow state
    const [showMaterialModal, setShowMaterialModal] = useState(false);
    const [currentHistoriaId, setCurrentHistoriaId] = useState<number | null>(null);

    // Format phone number as (+code) number
    const formatPhoneNumber = (phone: string | undefined): string => {
        if (!phone) return 'N/A';

        // Remove any spaces or special characters
        const cleaned = phone.replace(/\D/g, '');

        // If it starts with a country code (e.g., 591 for Bolivia)
        if (cleaned.length >= 10) {
            // Assume first 2-3 digits are country code
            const countryCode = cleaned.substring(0, cleaned.length - 8);
            const number = cleaned.substring(cleaned.length - 8);
            return `(+${countryCode}) ${number}`;
        }

        // If it's just a local number
        return phone;
    };

    useEffect(() => {
        if (id) {
            fetchPaciente();
            fetchHistoria();
            fetchProformas();
            fetchPagos();
            fetchMusicaTelevision();
        }
    }, [id]);

    const fetchPagos = async () => {
        try {
            const response = await api.get(`/pagos/paciente/${id}`);
            setPagos(response.data);
        } catch (error) {
            console.error('Error fetching pagos:', error);
        }
    };

    const fetchPaciente = async () => {
        try {
            const response = await api.get(`/pacientes/${id}`);
            setPaciente(response.data);
        } catch (error) {
            console.error('Error fetching paciente:', error);
        }
    };

    const fetchHistoria = async () => {
        try {
            const response = await api.get(`/historia-clinica/paciente/${id}`);
            setHistoria(response.data);
        } catch (error) {
            console.error('Error fetching historia:', error);
        }
    };

    const fetchProformas = async () => {
        try {
            const response = await api.get(`/proformas/paciente/${id}`);
            setProformas(response.data);
        } catch (error) {
            console.error('Error fetching proformas:', error);
        }
    };

    const fetchMusicaTelevision = async () => {
        if (!id) return;
        try {
            const [musicasRes, televisionesRes, allMusicasRes, allTelevisionesRes] = await Promise.all([
                api.get(`/pacientes/${id}/musica`),
                api.get(`/pacientes/${id}/television`),
                api.get('/musica?limit=100'),
                api.get('/television?limit=100')
            ]);

            const selectedMusicaIds = musicasRes.data || [];
            const selectedTelevisionIds = televisionesRes.data || [];

            const allMusicas = allMusicasRes.data.data || allMusicasRes.data;
            const allTelevisiones = allTelevisionesRes.data.data || allTelevisionesRes.data;

            // Mapear IDs a nombres
            const musicaNames = allMusicas
                .filter((m: any) => selectedMusicaIds.includes(m.id))
                .map((m: any) => m.musica);
            const televisionNames = allTelevisiones
                .filter((t: any) => selectedTelevisionIds.includes(t.id))
                .map((t: any) => t.television);

            setMusicaPreferences(musicaNames);
            setTelevisionPreferences(televisionNames);
        } catch (error) {
            console.error('Error fetching música/televisión:', error);
        }
    };

    const handleDelete = async (historiaId: number) => {
        const result = await Swal.fire({
            title: '¿Está seguro?',
            text: "No podrá revertir esta acción",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/historia-clinica/${historiaId}`);
                fetchHistoria();
                Swal.fire({
                    icon: 'success',
                    title: '¡Eliminado!',
                    text: 'El registro ha sido eliminado.',
                    showConfirmButton: false,
                    timer: 1500
                });
            } catch (error) {
                console.error('Error deleting historia:', error);
                Swal.fire(
                    'Error',
                    'Hubo un problema al eliminar el registro.',
                    'error'
                );
            }
        }
    };

    const handleEdit = (item: HistoriaClinicaType) => {
        setHistoriaToEdit(item);
        setShowForm(true);
        if (item.proformaId) {
            setSelectedProformaId(item.proformaId);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setHistoriaToEdit(null);
        setShowForm(false);
    };

    const handleMaterialUtilizadoSuccess = async () => {
        // After Material Utilizado is saved, prompt to register Próxima Cita
        const result = await Swal.fire({
            icon: 'info',
            title: 'Próxima Cita',
            text: 'Siguiente paso, registrar PRÓXIMA CITA',
            confirmButtonText: 'OK',
            background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
            color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
        });

        if (result.isConfirmed) {
            setActiveTab('cita');
        }
    };

    const handleProximaCitaSaved = async () => {
        // Check if Secuencia de Tratamiento exists for this patient/proforma
        if (!selectedProformaId || !id) {
            setActiveTab('historia');
            return;
        }

        try {
            const response = await api.get(`/secuencia-tratamiento/exists/${id}/${selectedProformaId}`);
            const exists = response.data?.exists || false;

            if (exists) {
                // Secuencia already exists
                const result = await Swal.fire({
                    icon: 'info',
                    title: 'Secuencia de Tratamiento',
                    text: 'El Paciente ya tiene guardada una Secuencia de Tratamiento',
                    confirmButtonText: 'OK',
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });

                if (result.isConfirmed) {
                    setActiveTab('historia');
                }
            } else {
                // Secuencia doesn't exist, prompt to create it
                const result = await Swal.fire({
                    icon: 'info',
                    title: 'Secuencia de Tratamiento',
                    text: 'Siguiente paso, registrar SECUENCIA DE TRATAMIENTO',
                    confirmButtonText: 'OK',
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });

                if (result.isConfirmed) {
                    setActiveTab('secuencia');
                }
            }
        } catch (error) {
            console.error('Error checking secuencia tratamiento:', error);
            setActiveTab('historia');
        }
    };


    const filteredHistoria = selectedProformaId ? historia.filter(h => h.proformaId === selectedProformaId) : historia;


    const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(e);
        });
    };

    const handlePrintHistory = async () => {
        try {
            const doc = new jsPDF();

            try {
                const logo = await loadImage('/logo-curare.png');
                doc.addImage(logo, 'PNG', 14, 15, 35, 14);
            } catch (error) {
                console.warn('Could not load logo', error);
            }

            // Header
            const pageWidth = doc.internal.pageSize.width;
            doc.setDrawColor(52, 152, 219); // #3498db
            doc.setLineWidth(1);
            doc.line(15, 35, pageWidth - 15, 35);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.setTextColor(44, 62, 80); // #2c3e50
            doc.text('HISTORIAL DE TRATAMIENTOS', 105, 25, { align: 'center' });
            doc.setTextColor(0, 0, 0);

            // Patient info box with blue border (matching Próxima Cita format)
            const boxY = 40;
            const boxHeight = selectedProformaId > 0 ? 18 : 12;

            // Gray background
            doc.setFillColor(248, 249, 250); // #f8f9fa
            doc.rect(15, boxY, pageWidth - 30, boxHeight, 'F');

            // Blue left border
            doc.setFillColor(52, 152, 219); // #3498db
            doc.rect(15, boxY, 2, boxHeight, 'F');

            // Patient info text
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('PACIENTE:', 20, boxY + 6);
            doc.setFont('helvetica', 'normal');
            const pacienteNombre = paciente
                ? `${paciente.paterno} ${paciente.materno || ''} ${paciente.nombre}`
                : 'N/A';
            doc.text(pacienteNombre.toUpperCase(), 45, boxY + 6);

            // Plan de Tratamiento info
            if (selectedProformaId > 0) {
                const proforma = proformas.find(p => p.id === selectedProformaId);
                if (proforma) {
                    doc.setFont('helvetica', 'bold');
                    doc.text('PLAN DE TRATAMIENTO:', 20, boxY + 13);
                    doc.setFont('helvetica', 'normal');
                    doc.text(`Plan #${proforma.numero || proforma.id} - ${formatDateUTC(proforma.fecha)}`, 70, boxY + 13);
                }
            }

            // Table
            if (filteredHistoria.length > 0) {
                const tableColumn = ["Fecha", "Pieza", "Tratamiento", "Observaciones", "Cant.", "Doctor", "Asistente", "Estado"];
                const tableRows = filteredHistoria.map(item => [
                    formatDateUTC(item.fecha),
                    item.pieza || '-',
                    item.tratamiento || '-',
                    item.observaciones || '-',
                    String(item.cantidad || 1),
                    item.doctor ? `${item.doctor.paterno} ${item.doctor.nombre}` : '-',
                    item.personal ? `${item.personal.paterno} ${item.personal.nombre}` : '-',
                    item.estadoTratamiento || '-'
                ]);

                const tableStartY = boxY + boxHeight + 5; // Start table 5 units after the box

                autoTable(doc, {
                    head: [tableColumn],
                    body: tableRows,
                    startY: tableStartY,
                    theme: 'plain',
                    margin: { left: 15, right: 15 },
                    styles: {
                        fontSize: 9,
                        cellPadding: 2,
                    },
                    headStyles: {
                        fillColor: [235, 245, 255],
                        textColor: [30, 41, 59],
                        fontStyle: 'bold',
                        lineWidth: 0.1,
                        lineColor: [203, 213, 225]
                    },
                    columnStyles: {
                        0: { cellWidth: 20 },
                        1: { cellWidth: 15 },
                        2: { cellWidth: 35 },
                        3: { cellWidth: 'auto' }, // Observaciones takes remaining space
                        4: { cellWidth: 10 },
                        5: { cellWidth: 25 },
                        6: { cellWidth: 20 },
                        7: { cellWidth: 20 }
                    },
                    alternateRowStyles: {
                        fillColor: [248, 249, 250] // #f8f9fa
                    }
                });
            }

            // Footer
            const pageHeight = doc.internal.pageSize.height;
            doc.setDrawColor(51, 51, 51); // #333 - darker line
            doc.setLineWidth(0.5);
            doc.line(15, pageHeight - 25, pageWidth - 15, pageHeight - 25);

            doc.setFontSize(9); // Increased from 8
            doc.setTextColor(51, 51, 51); // #333 - darker text
            doc.text(`Fecha de impresión: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}`, pageWidth - 15, pageHeight - 18, { align: 'right' });

            doc.autoPrint();
            const blobUrl = doc.output('bloburl');
            window.open(blobUrl, '_blank');
        } catch (error) {
            console.error('Error generating print history:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error de impresión',
                text: 'Ocurrió un error al generar la impresión del historial de tratamientos.'
            });
        }
    };

    return (
        <div className="space-y-4">
            {/* Header del Tab */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-200 dark:border-gray-700 gap-4 mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Activity className="text-blue-500" size={22} />
                        <span>Seguimiento Clínico e Historial</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                        Evolución clínica, registro de tratamientos realizados y secuencia odontológica.
                    </p>
                </div>
            </div>

            {/* Proforma Selection Global - Compact Size */}
            <div className="mb-6 flex flex-wrap items-center gap-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 w-fit">
                <label className="font-bold text-gray-700 dark:text-gray-300 text-sm">Seleccione el Plan de Tratamiento:</label>
                <select
                    value={selectedProformaId}
                    onChange={(e) => setSelectedProformaId(Number(e.target.value))}
                    className="p-1.5 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm cursor-pointer min-w-[220px]"
                >
                    <option value={0}>-- Todos / Sin Plan --</option>
                    {proformas.map(p => {
                        // Check if this proforma is marked as terminado in Historia Clinica
                        const isCompleted = historia.some(h =>
                            h.proformaId === p.id && h.estadoPresupuesto === 'terminado'
                        );

                        return (
                            <option
                                key={p.id}
                                value={p.id}
                                style={isCompleted ? {
                                    textDecoration: 'line-through',
                                    color: '#16a34a',
                                    fontWeight: 'bold'
                                } : undefined}
                            >
                                Plan #{p.numero || p.id} - {formatDateUTC(p.fecha)}
                            </option>
                        );
                    })}
                </select>
                <span className="text-xs text-blue-600 dark:text-blue-400 ml-auto">
                    * Filtrar por plan actualiza todas las pestañas
                </span>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('historia')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-all whitespace-nowrap ${activeTab === 'historia'
                        ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-700 shadow-md transform -translate-y-0.5'
                        : 'text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm hover:shadow-md hover:transform hover:-translate-y-0.5'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    HISTORIA CLÍNICA
                </button>
                <button
                    onClick={() => setActiveTab('cita')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-all whitespace-nowrap ${activeTab === 'cita'
                        ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-700 shadow-md transform -translate-y-0.5'
                        : 'text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm hover:shadow-md hover:transform hover:-translate-y-0.5'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    PRÓXIMA CITA
                </button>
                <button
                    onClick={() => setActiveTab('secuencia')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-all whitespace-nowrap ${activeTab === 'secuencia'
                        ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-700 shadow-md transform -translate-y-0.5'
                        : 'text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm hover:shadow-md hover:transform hover:-translate-y-0.5'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="8" y1="6" x2="21" y2="6"></line>
                        <line x1="8" y1="12" x2="21" y2="12"></line>
                        <line x1="8" y1="18" x2="21" y2="18"></line>
                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                    SECUENCIA DE TRATAMIENTO
                </button>
            </div>

            {/* Message when no plan is selected - shows in all tabs */}
            {selectedProformaId === 0 && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400 flex-shrink-0">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                        <span className="font-semibold">ℹ️ Por favor, seleccione un Plan de Tratamiento</span> para registrar tratamientos, próximas citas y secuencias.
                    </p>
                </div>
            )}

            {/* Tab Contents */}
            <div className="animate-fade-in-up">
                {activeTab === 'historia' && (
                    <>
                        {selectedProformaId > 0 ? (
                            <>
                                {(showForm || historiaToEdit) && (
                                    <div className="mb-6">
                                        <HistoriaClinicaForm
                                            pacienteId={Number(id)}
                                            onSuccess={() => {
                                                fetchHistoria();
                                                setShowForm(false);
                                            }}
                                            historiaToEdit={historiaToEdit}
                                            onCancelEdit={handleCancelEdit}
                                            selectedProformaId={selectedProformaId}
                                            proformas={proformas}
                                            onMaterialUtilizadoRequired={(historiaId) => {
                                                setCurrentHistoriaId(historiaId);
                                                setShowMaterialModal(true);
                                            }}
                                        />
                                    </div>
                                )}

                                <HistoriaClinicaList
                                    historia={filteredHistoria}
                                    allHistoria={historia}
                                    onDelete={handleDelete}
                                    onEdit={handleEdit}
                                    onNewHistoria={!showForm && !historiaToEdit ? () => setShowForm(true) : undefined}
                                    onPrint={handlePrintHistory}
                                    onViewPlan={() => setShowPlanModal(true)}
                                    onViewHistorial={() => setShowSeguimientoModal(true)}
                                    onPlanTiempo={() => setShowRecordatorioPlanModal(true)}
                                    onReminder={(item) => {
                                        setSelectedReminderHistoria(item);
                                        setShowReminderModal(true);
                                    }}
                                />

                                <div className="mt-6 flex justify-end">
                                    {(() => {
                                        const selectedProforma = proformas.find(p => p.id === selectedProformaId);
                                        const totalPresupuesto = selectedProforma ? Number(selectedProforma.total || 0) : 0;

                                        const filteredHistoria = historia.filter(h => h.proformaId === selectedProformaId && h.estadoTratamiento === 'terminado');

                                        const totalEjecutado = filteredHistoria.reduce((acc, curr) => {
                                            if (curr.proformaDetalle && Number(curr.proformaDetalle.total) > 0 && Number(curr.proformaDetalle.cantidad) > 0) {
                                                const netUnitPrice = Number(curr.proformaDetalle.total) / Number(curr.proformaDetalle.cantidad);
                                                return acc + (netUnitPrice * Number(curr.cantidad || 1));
                                            }
                                            if (selectedProforma && selectedProforma.detalles) {
                                                const currTratNorm = (curr.tratamiento || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, ' ').trim();
                                                const pdMatch = selectedProforma.detalles.find((d: any) => {
                                                    if (curr.proformaDetalleId && Number(d.id) === Number(curr.proformaDetalleId)) return true;
                                                    const dTratNorm = (d.arancel?.detalle || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, ' ').trim();
                                                    return dTratNorm && currTratNorm && (dTratNorm.includes(currTratNorm) || currTratNorm.includes(dTratNorm) || dTratNorm.split(' ')[0] === currTratNorm.split(' ')[0]);
                                                });
                                                if (pdMatch && Number(pdMatch.total) > 0 && Number(pdMatch.cantidad) > 0) {
                                                    const netUnitPrice = Number(pdMatch.total) / Number(pdMatch.cantidad);
                                                    return acc + (netUnitPrice * Number(curr.cantidad || 1));
                                                }
                                            }
                                            return acc + Number(curr.precio || 0);
                                        }, 0);

                                        const filteredPagos = pagos.filter(p => p.proformaId === selectedProformaId);
                                        const totalPagado = filteredPagos.reduce((acc, curr) => {
                                            const val = curr.moneda === 'Dólares'
                                                ? Number(curr.monto || 0) * (Number(curr.tc) || 6.96)
                                                : Number(curr.monto || 0);
                                            return acc + val;
                                        }, 0);

                                        const saldo = totalPagado - totalEjecutado;
                                        const saldoFavor = saldo > 0 ? saldo : 0;
                                        const saldoContra = saldo < 0 ? Math.abs(saldo) : 0;

                                        return (
                                            <div className="bg-[#1f2937] dark:bg-gray-800 p-5 rounded-xl border border-gray-700/80 shadow-md inline-flex flex-wrap justify-end gap-8">
                                                <div className="text-right">
                                                    <div className="text-xs text-gray-400">Total Presupuesto</div>
                                                    <div className="text-lg font-bold text-blue-400">Bs. {formatCurrency(totalPresupuesto)}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-gray-400">Total Ejecutado</div>
                                                    <div className="text-lg font-bold text-white">Bs. {formatCurrency(totalEjecutado)}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-gray-400">Total Pagado</div>
                                                    <div className="text-lg font-bold text-white">Bs. {formatCurrency(totalPagado)}</div>
                                                </div>
                                                {saldoFavor > 0 && (
                                                    <div className="text-right text-green-400">
                                                        <div className="text-xs text-green-400">Saldo a Favor</div>
                                                        <div className="text-lg font-bold">Bs. {formatCurrency(saldoFavor)}</div>
                                                    </div>
                                                )}
                                                {saldoContra > 0 && (
                                                    <div className="text-right text-red-400">
                                                        <div className="text-xs text-red-400">Saldo en Contra</div>
                                                        <div className="text-lg font-bold">Bs. {formatCurrency(saldoContra)}</div>
                                                    </div>
                                                )}
                                                {saldo === 0 && (
                                                    <div className="text-right text-gray-400">
                                                        <div className="text-xs text-gray-400">Saldo</div>
                                                        <div className="text-lg font-bold">Bs. 0,00</div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </>
                        ) : null}
                    </>
                )}

                {activeTab === 'cita' && (
                    <ProximaCitaManager
                        pacienteId={Number(id)}
                        paciente={paciente}
                        selectedProformaId={selectedProformaId}
                        proformas={proformas}
                        historia={historia}
                        onCitaSaved={handleProximaCitaSaved}
                    />
                )}

                {activeTab === 'secuencia' && (
                    <SecuenciaTratamientoManager
                        pacienteId={Number(id)}
                        paciente={paciente}
                        selectedProformaId={selectedProformaId}
                    />
                )}
            </div>

            {/* Material Utilizado Modal */}
            <MaterialUtilizadoModal
                isOpen={showMaterialModal}
                onClose={() => setShowMaterialModal(false)}
                historiaClinicaId={currentHistoriaId || 0}
                onSuccess={handleMaterialUtilizadoSuccess}
            />

            {/* Plan Tratamiento Modal */}
            <PlanTratamientoModal
                isOpen={showPlanModal}
                onClose={() => setShowPlanModal(false)}
                proforma={proformas.find(p => p.id === selectedProformaId) || null}
                historia={historia}
            />

            {/* Recordatorio Modal */}
            <RecordatorioTratamientoModal
                isOpen={showReminderModal}
                onClose={() => setShowReminderModal(false)}
                historia={selectedReminderHistoria}
                paciente={paciente}
            />

            {/* Recordatorio Plan Modal */}
            <RecordatorioPlanModal
                isOpen={showRecordatorioPlanModal}
                onClose={() => setShowRecordatorioPlanModal(false)}
                proformaId={selectedProformaId}
                proforma={proformas.find(p => p.id === selectedProformaId) || null}
            />

            {/* Seguimiento Clinico Modal */}
            <SeguimientoClinicoModal
                isOpen={showSeguimientoModal}
                onClose={() => setShowSeguimientoModal(false)}
                historia={filteredHistoria}
                paciente={paciente}
                selectedProformaId={selectedProformaId}
                proformas={proformas}
            />
        </div >
    );
};

export default HistoriaClinica;
