import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { Receta } from '../types';
import Pagination from './Pagination';
import Swal from 'sweetalert2';
import { formatDate } from '../utils/dateUtils';
import { formatPaternoMaternoNombre } from '../utils/formatters';
import ManualModal, { type ManualSection } from './ManualModal';
import RecetarioForm from './RecetarioForm';

const RecetarioList: React.FC = () => {
    const [recetas, setRecetas] = useState<Receta[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showManual, setShowManual] = useState(false);
    const limit = 10;

    // Modal state for RecetarioForm
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedRecetaId, setSelectedRecetaId] = useState<number | null>(null);

    const manualSections: ManualSection[] = [
        {
            title: 'Gestión de Recetas',
            content: 'El módulo de Recetario permite crear y gestionar recetas médicas para los pacientes de la clínica.'
        },
        {
            title: 'Crear Nueva Receta',
            content: 'Use el botón "+ Nueva Receta" para crear una receta. Seleccione el paciente, agregue los medicamentos con sus indicaciones y cantidades.'
        },
        {
            title: 'Acciones Disponibles',
            content: (
                <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>📱 <strong>WhatsApp:</strong> Envía la receta automáticamente por WhatsApp al paciente (requiere chatbot conectado).</li>
                    <li>🖨️ <strong>Imprimir:</strong> Abre el diálogo de impresión para imprimir la receta directamente.</li>
                    <li>✏️ <strong>Editar:</strong> Modifica los datos de la receta existente.</li>
                    <li>🗑️ <strong>Eliminar:</strong> Elimina la receta de forma permanente.</li>
                </ul>
            )
        },
        {
            title: 'Envío por WhatsApp',
            content: 'Para usar la función de WhatsApp, el chatbot debe estar conectado desde Configuración > Chatbot (WhatsApp). El PDF se enviará automáticamente al número de celular del paciente.'
        }
    ];

    useEffect(() => {
        fetchRecetas();
    }, []);

    const fetchRecetas = async () => {
        try {
            const response = await api.get('/receta');
            // Assuming backend currently returns flat array, we handle it here
            const data = Array.isArray(response.data) ? response.data : response.data.data || [];
            setRecetas(data);
            setRecetas(data);
        } catch (error) {
            console.error('Error fetching recetas:', error);
            Swal.fire('Error', 'No se pudieron cargar las recetas', 'error');
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Eliminar receta?',
            text: 'No podrá revertir esta acción',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/receta/${id}`);
                await Swal.fire('¡Eliminado!', 'La receta ha sido eliminada.', 'success');
                fetchRecetas();
            } catch (error) {
                console.error('Error deleting receta:', error);
                Swal.fire('Error', 'No se pudo eliminar la receta', 'error');
            }
        }
    };

    const executePrint = (receta: Receta, mode: 'center' | 'direct') => {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (!doc) {
            document.body.removeChild(iframe);
            return;
        }

        const dateStr = formatDate(receta.fecha);
        const patientName = receta.paciente
            ? `${receta.paciente.paterno || ''} ${receta.paciente.materno || ''} ${receta.paciente.nombre || ''}`.trim().toUpperCase()
            : 'N/A';
        const doctorName = receta.doctor ? formatPaternoMaternoNombre(receta.doctor) : 'NO ESPECIFICADO';

        // Generate medication rows
        let medicationRows = '';
        if (receta.detalles && receta.detalles.length > 0) {
            medicationRows = receta.detalles.map((d: any) => `
                <tr>
                    <td class="med-name">${d.medicamento || ''}</td>
                    <td class="med-qty">${d.cantidad || '-'}</td>
                    <td class="med-ind">${d.indicacion || '-'}</td>
                </tr>
            `).join('');
        } else if (receta.medicamentos) {
            medicationRows = `
                <tr>
                    <td class="med-name">${receta.medicamentos}</td>
                    <td class="med-qty">-</td>
                    <td class="med-ind">${receta.indicaciones || '-'}</td>
                </tr>
            `;
        }

        const isCenter = mode === 'center';

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receta Médica - ${patientName}</title>
                <style>
                    @page {
                        size: ${isCenter ? 'letter portrait' : '140mm 215.9mm portrait'};
                        margin: 0;
                    }
                    * {
                        box-sizing: border-box;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    html, body {
                        width: ${isCenter ? '215.9mm' : '140mm'};
                        height: ${isCenter ? '279.4mm' : '215.9mm'};
                        margin: 0;
                        padding: 0;
                        font-family: Arial, Helvetica, sans-serif;
                        color: #1a202c;
                        background: transparent;
                    }
                    .prescription-container {
                        padding-top: 48mm;
                        padding-left: 8mm;
                        padding-right: 8mm;
                        padding-bottom: 16mm;
                        width: 140mm;
                        min-height: 215mm;
                        box-sizing: border-box;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        ${isCenter ? 'margin: 0 auto;' : ''}
                    }
                    .patient-info {
                        margin-bottom: 8px;
                        padding-bottom: 4px;
                        border-bottom: 1.5px solid #4a5568;
                    }
                    .patient-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: baseline;
                        margin-bottom: 3px;
                    }
                    .patient-name {
                        font-weight: bold;
                        font-size: 11px;
                        color: #000;
                    }
                    .receta-date {
                        font-size: 10.5px;
                        color: #2d3748;
                        font-weight: 600;
                    }
                    .diagnostico-row {
                        font-size: 10.5px;
                        color: #4a5568;
                        margin-top: 2px;
                    }
                    .rx-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 4px;
                        margin-bottom: 8px;
                    }
                    .rx-table th {
                        background-color: #edf2f7 !important;
                        color: #2d3748 !important;
                        font-size: 9.5px;
                        font-weight: bold;
                        text-transform: uppercase;
                        padding: 4px 5px;
                        border: 1px solid #cbd5e0;
                    }
                    .rx-table td {
                        padding: 5px;
                        border: 1px solid #e2e8f0;
                        font-size: 10px;
                        line-height: 1.3;
                        vertical-align: top;
                    }
                    .med-name {
                        font-weight: bold;
                        color: #000;
                    }
                    .med-qty {
                        text-align: center;
                        font-weight: 600;
                    }
                    .med-ind {
                        color: #2d3748;
                    }
                    .indicaciones-box {
                        margin-top: 4px;
                        padding: 5px 7px;
                        background: #f7fafc;
                        border-left: 3px solid #718096;
                        border-radius: 2px;
                        font-size: 9.5px;
                        line-height: 1.35;
                        color: #2d3748;
                    }
                    .indicaciones-title {
                        font-weight: bold;
                        text-transform: uppercase;
                        font-size: 9px;
                        color: #4a5568;
                        margin-bottom: 2px;
                    }
                    .signature-area {
                        margin-top: auto;
                        padding-top: 20px;
                        text-align: center;
                    }
                    .signature-line {
                        width: 180px;
                        margin: 0 auto 4px auto;
                        border-top: 1px solid #2d3748;
                    }
                    .signature-doctor {
                        font-weight: bold;
                        font-size: 10.5px;
                        color: #000;
                    }
                    .signature-subtitle {
                        font-size: 9px;
                        color: #718096;
                    }
                </style>
            </head>
            <body>
                <div class="prescription-container">
                    <div>
                        <div class="patient-info">
                            <div class="patient-row">
                                <div class="patient-name">PACIENTE: ${patientName}</div>
                                <div class="receta-date">FECHA: ${dateStr}</div>
                            </div>
                            ${(receta.diagnostico && receta.diagnostico.trim() !== '') ? `
                            <div class="diagnostico-row">
                                <strong>DIAGNÓSTICO:</strong> ${receta.diagnostico}
                            </div>
                            ` : ''}
                        </div>

                        <table class="rx-table">
                            <thead>
                                <tr>
                                    <th style="width: 38%; text-align: left;">Medicamento</th>
                                    <th style="width: 16%; text-align: center;">Cantidad</th>
                                    <th style="width: 46%; text-align: left;">Indicaciones / Posología</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${medicationRows}
                            </tbody>
                        </table>

                        ${(receta.indicaciones && receta.indicaciones.trim() !== '') ? `
                        <div class="indicaciones-box">
                            <div class="indicaciones-title">Indicaciones Generales / Recomendaciones:</div>
                            <div>${receta.indicaciones.replace(/\n/g, '<br>')}</div>
                        </div>
                        ` : ''}
                    </div>

                    <div class="signature-area">
                        <div class="signature-line"></div>
                        <div class="signature-doctor">${doctorName !== 'NO ESPECIFICADO' ? `Dr. ${doctorName}` : 'Dr. JOSE ARTIEDA S.'}</div>
                        <div class="signature-subtitle">Firma y Sello Médico</div>
                    </div>
                </div>
            </body>
            </html>
        `;

        doc.open();
        doc.write(printContent);
        doc.close();

        setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => {
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
            }, 1000);
        }, 300);
    };

    const handlePrint = (receta: Receta) => {
        Swal.fire({
            title: 'Imprimir Receta Médica',
            text: '¿Cómo coloca la media hoja (14 x 21.5 cm) en su impresora?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Al Centro de la bandeja (Común)',
            cancelButtonText: 'Alineada a la Izquierda / Media Carta',
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#6b7280',
            showDenyButton: true,
            denyButtonText: 'Cancelar',
            denyButtonColor: '#d33'
        }).then((result) => {
            if (result.isConfirmed) {
                executePrint(receta, 'center');
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                executePrint(receta, 'direct');
            }
        });
    };

    const handleWhatsApp = async (receta: Receta) => {
        if (!receta.paciente?.celular) {
            Swal.fire('Atención', 'El paciente no tiene número de celular registrado', 'warning');
            return;
        }

        // Show loading
        Swal.fire({
            title: 'Enviando...',
            text: 'Enviando receta por WhatsApp',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const response = await api.post(`/receta/${receta.id}/send-whatsapp`);

            Swal.fire({
                icon: 'success',
                title: '¡Enviado!',
                text: response.data.message || 'Receta enviada por WhatsApp exitosamente',
                timer: 3000,
                showConfirmButton: false
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
                text: errorMessage,
                confirmButtonText: 'Entendido'
            });
        }
    };

    // Filter logic
    const filteredRecetas = recetas.filter(r =>
    (r.paciente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.paciente?.paterno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Pagination logic
    const paginatedRecetas = filteredRecetas.slice((currentPage - 1) * limit, currentPage * limit);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <div className="content-card">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
                            Recetario Médico
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                            Emisión y registro de recetas médicas y prescripciones odontológicas
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>
                    <button
                        onClick={() => {
                            setSelectedRecetaId(null);
                            setIsFormOpen(true);
                        }}
                        className="bg-[#3498db] hover:bg-blue-600 text-white font-semibold py-2 px-5 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 text-sm"
                    >
                        <span className="text-xl">+</span> Nueva Receta
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 flex-grow max-w-md">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Buscar por paciente o usuario..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                            className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg shadow-sm transition-all text-xs flex items-center gap-1 shrink-0"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            <span>Limpiar</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="mb-4 text-gray-600 dark:text-gray-400 text-sm">
                Mostrando {filteredRecetas.length === 0 ? 0 : (currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, filteredRecetas.length)} de {filteredRecetas.length} registros
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Paciente</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Doctor</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Diagnóstico</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Medicamentos</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedRecetas.map((receta, index) => (
                            <tr key={receta.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="p-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">{(currentPage - 1) * limit + index + 1}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">{formatDate(receta.fecha)}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300 font-medium">
                                    {receta.paciente ? `${receta.paciente.paterno} ${receta.paciente.materno || ''} ${receta.paciente.nombre}`.trim() : 'N/A'}
                                </td>
                                <td className="p-3 text-gray-700 dark:text-gray-300 font-medium">
                                    {receta.doctor ? formatPaternoMaternoNombre(receta.doctor) : <span className="text-gray-400 font-normal">-</span>}
                                </td>
                                <td className="p-3 text-gray-700 dark:text-gray-300 max-w-xs truncate font-medium">
                                    {receta.diagnostico || receta.medicamentos || <span className="text-gray-400 font-normal">-</span>}
                                </td>
                                <td className="p-3 text-gray-700 dark:text-gray-300 max-w-xs truncate">
                                    {receta.detalles && receta.detalles.length > 0
                                        ? `${receta.detalles.length} medicamento${receta.detalles.length !== 1 ? 's' : ''} (${receta.detalles[0].medicamento}...)`
                                        : receta.medicamentos || '-'}
                                </td>
                                <td className="p-3 flex gap-2">
                                    <button
                                        onClick={() => handleWhatsApp(receta)}
                                        className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                        title="Enviar por WhatsApp"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handlePrint(receta)}
                                        className="p-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                        title="Imprimir"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                            <rect x="6" y="14" width="12" height="8"></rect>
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedRecetaId(receta.id);
                                            setIsFormOpen(true);
                                        }}
                                        className="p-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                        title="Editar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(receta.id)}
                                        className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                        title="Eliminar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {paginatedRecetas.length === 0 && (
                            <tr><td colSpan={6} className="text-center p-4 text-gray-500 dark:text-gray-400">No hay recetas registradas</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-center mt-4">
                <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredRecetas.length / limit)}
                    onPageChange={handlePageChange}
                />
            </div>

            {/* RecetarioForm Drawer */}
            <RecetarioForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                id={selectedRecetaId}
                onSaveSuccess={() => {
                    fetchRecetas();
                    setIsFormOpen(false);
                }}
            />

            {/* Manual Modal */}
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Recetario"
                sections={manualSections}
            />
        </div>
    );
};

export default RecetarioList;
