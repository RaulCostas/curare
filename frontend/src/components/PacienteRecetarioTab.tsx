import React, { useState, useEffect } from 'react';
import api from '../services/api';
import type { Receta, Paciente } from '../types';
import { formatDate } from '../utils/dateUtils';
import { formatPaternoMaternoNombre } from '../utils/formatters';
import Swal from 'sweetalert2';
import RecetarioForm from './RecetarioForm';
import ManualModal, { type ManualSection } from './ManualModal';
import { Pill, Plus } from 'lucide-react';

interface PacienteRecetarioTabProps {
    pacienteId: number;
}

const PacienteRecetarioTab: React.FC<PacienteRecetarioTabProps> = ({ pacienteId }) => {
    const [recetas, setRecetas] = useState<Receta[]>([]);
    const [paciente, setPaciente] = useState<Paciente | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedRecetaId, setSelectedRecetaId] = useState<number | null>(null);
    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Recetas Médicas & Prescripciones',
            content: 'Consulte e imprima la lista de recetas médicas emitidas para el paciente seleccionado.'
        },
        {
            title: 'Emitir Nueva Receta',
            content: 'Haga clic en "+ Nueva Receta" para abrir el formulario y prescribir medicamentos, posología y observaciones.'
        },
        {
            title: 'Acciones Disponibles',
            content: (
                <ul className="list-disc pl-5 space-y-1">
                    <li>📱 <strong>WhatsApp:</strong> Envía automáticamente el documento PDF de la receta al WhatsApp del paciente.</li>
                    <li>🖨️ <strong>Imprimir:</strong> Genera la versión impresa de la receta con diagnóstico y firma del doctor.</li>
                    <li>✏️ <strong>Editar:</strong> Modifica la receta existente.</li>
                    <li>🗑️ <strong>Eliminar:</strong> Cancela la receta del historial.</li>
                </ul>
            )
        }
    ];

    useEffect(() => {
        if (pacienteId) {
            fetchPaciente(pacienteId);
            fetchRecetas();
        }
    }, [pacienteId]);

    const fetchPaciente = async (pId: number) => {
        try {
            const response = await api.get(`/pacientes/${pId}`);
            setPaciente(response.data);
        } catch (error) {
            console.error('Error fetching paciente:', error);
        }
    };

    const fetchRecetas = async () => {
        setLoading(true);
        try {
            const response = await api.get('/receta');
            const data = Array.isArray(response.data) ? response.data : response.data.data || [];
            // Filter by patient ID
            const filtered = data.filter((r: any) => r.idPaciente === pacienteId || r.pacienteId === pacienteId || r.paciente?.id === pacienteId);
            setRecetas(filtered);
        } catch (error) {
            console.error('Error fetching recetas for paciente:', error);
            setRecetas([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Está seguro?',
            text: 'No podrá revertir esta acción',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
            color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/receta/${id}`);
                Swal.fire({
                    icon: 'success',
                    title: 'Eliminado',
                    text: 'Receta eliminada correctamente',
                    timer: 1500,
                    showConfirmButton: false,
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
                fetchRecetas();
            } catch (error) {
                console.error('Error deleting receta:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al eliminar la receta',
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
            }
        }
    };

    const handleWhatsApp = async (recetaItem: Receta) => {
        const targetCelular = paciente?.celular || recetaItem.paciente?.celular;
        if (!targetCelular) {
            Swal.fire({
                icon: 'warning',
                title: 'Atención',
                text: 'El paciente no tiene número de celular registrado',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
            return;
        }

        Swal.fire({
            title: 'Enviando...',
            text: 'Enviando receta por WhatsApp al paciente',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
            background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
            color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
        });

        try {
            const response = await api.post(`/receta/${recetaItem.id}/send-whatsapp`);
            Swal.fire({
                icon: 'success',
                title: '¡Enviado!',
                text: response.data.message || 'Receta enviada por WhatsApp exitosamente',
                timer: 3000,
                showConfirmButton: false,
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
        } catch (error: any) {
            console.error('Error sending WhatsApp:', error);
            let errorMessage = 'No se pudo enviar la receta por WhatsApp';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.status === 503) {
                errorMessage = 'El chatbot no está conectado. Por favor, conecte el chatbot primero desde Configuración > Chatbot (WhatsApp).';
            }
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage,
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
        }
    };

    const handlePrint = (receta: Receta) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const patientName = paciente
            ? `${paciente.paterno || ''} ${paciente.materno || ''} ${paciente.nombre || ''}`.trim().toUpperCase()
            : `${receta.paciente?.paterno || ''} ${receta.paciente?.materno || ''} ${receta.paciente?.nombre || ''}`.trim().toUpperCase() || 'N/A';

        const doctorName = receta.doctor
            ? formatPaternoMaternoNombre(receta.doctor)
            : 'NO ESPECIFICADO';

        const fechaFormateada = formatDate(receta.fecha);

        let medicationRows = '';
        if (receta.detalles && receta.detalles.length > 0) {
            medicationRows = receta.detalles.map(d => `
                <tr>
                    <td style="font-weight: bold; color: #1e293b;">${d.medicamento || ''}</td>
                    <td style="text-align: center;">${d.cantidad || '-'}</td>
                    <td>${d.indicacion || '-'}</td>
                </tr>
            `).join('');
        } else if (receta.medicamentos) {
            medicationRows = `
                <tr>
                    <td style="font-weight: bold; color: #1e293b;">${receta.medicamentos}</td>
                    <td style="text-align: center;">-</td>
                    <td>${receta.indicaciones || '-'}</td>
                </tr>
            `;
        }

        const hasDiagnostico = receta.diagnostico && receta.diagnostico.trim() !== '';
        const hasIndicaciones = receta.indicaciones && receta.indicaciones.trim() !== '';

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receta Médica - ${patientName}</title>
                <style>
                    @page { size: A4 portrait; margin: 15mm; }
                    body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; color: #2c3e50; }
                    
                    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 3px solid #3498db; }
                    .header-left { display: flex; align-items: center; gap: 20px; }
                    .header img { height: 60px; object-fit: contain; }
                    .header h1 { color: #2c3e50; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; }
                    
                    .info-box { margin-bottom: 20px; padding: 14px 18px; background-color: #f8f9fa; border-left: 6px solid #3498db; border-radius: 2px; }
                    .info-row { margin-bottom: 6px; font-size: 13px; font-family: Arial, sans-serif; }
                    .info-row:last-child { margin-bottom: 0; }
                    .info-label { font-weight: bold; color: #1e293b; min-width: 140px; display: inline-block; }
                    .info-value { color: #1e293b; letter-spacing: 0.3px; }

                    .diagnostico-box { margin-bottom: 20px; padding: 10px 14px; background-color: #f1f5f9; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 13px; }
                    
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 25px; }
                    th {
                        background-color: #ebf5fb !important;
                        color: #1e293b !important;
                        padding: 12px 10px;
                        text-align: left;
                        font-weight: bold;
                        border: 1px solid #dce6f1;
                        font-size: 12px;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    td { padding: 10px; border: 1px solid #e2e8f0; font-size: 12px; color: #334155; }
                    tr:nth-child(even) { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    
                    .section-title { font-weight: bold; color: #2c3e50; font-size: 13px; margin-top: 25px; margin-bottom: 8px; text-transform: uppercase; }
                    .notes-box { font-size: 12px; line-height: 1.6; color: #334155; background: #fff; border: 1px solid #e2e8f0; padding: 12px; border-radius: 4px; }
                    
                    .signature-area { margin-top: 80px; text-align: center; }
                    .signature-line { width: 220px; margin: 0 auto 8px auto; border-top: 1px solid #334155; }
                    .signature-name { font-weight: bold; font-size: 13px; color: #1e293b; }
                    .signature-title { font-size: 11px; color: #64748b; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="header-left">
                        <img src="/logo-curare.png" alt="Curare Centro Dental">
                        <h1>RECETA MÉDICA</h1>
                    </div>
                </div>

                <div class="info-box">
                    <div class="info-row">
                        <span class="info-label">PACIENTE:</span>
                        <span class="info-value" style="font-weight: bold; font-size: 14px;">${patientName}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">DOCTOR:</span>
                        <span class="info-value" style="font-weight: bold;">${doctorName}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">FECHA:</span>
                        <span class="info-value">${fechaFormateada}</span>
                    </div>
                </div>

                ${hasDiagnostico ? `
                <div class="diagnostico-box">
                    <strong style="color: #0f172a; text-transform: uppercase;">DIAGNÓSTICO:</strong>
                    <span style="color: #334155; font-weight: 500; margin-left: 6px;">${receta.diagnostico}</span>
                </div>
                ` : ''}

                <table>
                    <thead>
                        <tr>
                            <th style="width: 35%;">Medicamento</th>
                            <th style="width: 20%; text-align: center;">Cantidad</th>
                            <th style="width: 45%;">Indicaciones / Posología</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${medicationRows}
                    </tbody>
                </table>

                ${hasIndicaciones ? `
                    <div class="section-title">Indicaciones Generales / Recomendaciones</div>
                    <div class="notes-box">
                        ${receta.indicaciones.replace(/\n/g, '<br>')}
                    </div>
                ` : ''}

                <div class="signature-area">
                    <div class="signature-line"></div>
                    <div class="signature-name">${doctorName !== 'NO ESPECIFICADO' ? `Dr. ${doctorName}` : 'Dr. JOSE ARTIEDA S.'}</div>
                    <div class="signature-title">Firma y Sello Médico</div>
                </div>

                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    return (
        <div className="space-y-4">
            {/* Header del Tab */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-200 dark:border-gray-700 gap-4 mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Pill className="text-blue-500" size={22} />
                        <span>Recetas Médicas & Prescripciones</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                        Emisión y registro de recetas médicas, diagnóstico, fármacos recetados e indicaciones.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[34px] h-[34px] text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shadow-sm cursor-pointer"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>
                    <button
                        onClick={() => {
                            setSelectedRecetaId(null);
                            setIsFormOpen(true);
                        }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 text-sm cursor-pointer"
                    >
                        <Plus size={18} />
                        <span>Nueva Receta</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-3"></div>
                    Cargando Recetas...
                </div>
            ) : recetas.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
                    <p className="text-lg font-medium mb-2">No hay recetas registradas para este paciente</p>
                    <p className="text-xs">Haga clic en "+ Nueva Receta" para emitir una prescripción médica.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Fecha</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Doctor</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Diagnóstico</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Medicamentos Prescritos</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Indicaciones Generales</th>
                                    <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-300">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {recetas.map(receta => (
                                    <tr key={receta.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-bold whitespace-nowrap">{formatDate(receta.fecha)}</td>
                                        <td className="px-4 py-3 text-gray-800 dark:text-gray-200 font-medium">
                                            {receta.doctor ? formatPaternoMaternoNombre(receta.doctor) : <span className="text-gray-400 font-normal">-</span>}
                                        </td>
                                        <td className="px-4 py-3 text-gray-800 dark:text-gray-200 font-medium max-w-xs">
                                            {receta.diagnostico || receta.medicamentos || <span className="text-gray-400 font-normal">-</span>}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                            {receta.detalles && receta.detalles.length > 0 ? (
                                                <ul className="space-y-1.5 list-disc pl-4">
                                                    {receta.detalles.map((d, i) => (
                                                        <li key={i} className="text-xs text-gray-800 dark:text-gray-200">
                                                            <span className="font-bold text-blue-600 dark:text-blue-400">{d.medicamento}</span>
                                                            {d.cantidad && <span className="ml-1 text-gray-600 dark:text-gray-400">({d.cantidad})</span>}
                                                            {d.indicacion && <span className="ml-1 text-gray-500 dark:text-gray-400 font-normal">- {d.indicacion}</span>}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{receta.medicamentos || '-'}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs font-medium max-w-xs">
                                            {receta.indicaciones || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                            <div className="flex gap-2 justify-center">
                                                {/* Botón WhatsApp */}
                                                <button
                                                    onClick={() => handleWhatsApp(receta)}
                                                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 inline-flex items-center justify-center cursor-pointer"
                                                    title="Enviar por WhatsApp"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                    </svg>
                                                </button>
                                                {/* Botón Imprimir */}
                                                <button
                                                    onClick={() => handlePrint(receta)}
                                                    className="p-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 inline-flex items-center justify-center cursor-pointer"
                                                    title="Imprimir Receta Médica"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                    </svg>
                                                </button>
                                                {/* Botón Editar */}
                                                <button
                                                    onClick={() => {
                                                        setSelectedRecetaId(receta.id);
                                                        setIsFormOpen(true);
                                                    }}
                                                    className="p-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 inline-flex items-center justify-center cursor-pointer"
                                                    title="Editar Receta"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                    </svg>
                                                </button>
                                                {/* Botón Eliminar */}
                                                <button
                                                    onClick={() => handleDelete(receta.id)}
                                                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 inline-flex items-center justify-center cursor-pointer"
                                                    title="Eliminar Receta"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <RecetarioForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                id={selectedRecetaId}
                pacienteId={pacienteId}
                onSaveSuccess={() => {
                    fetchRecetas();
                    setIsFormOpen(false);
                }}
            />

            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Recetas Médicas"
                sections={manualSections}
            />
        </div>
    );
};

export default PacienteRecetarioTab;
