import React, { useState, useEffect } from 'react';
import api from '../services/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Pagination from './Pagination';
import ManualModal, { type ManualSection } from './ManualModal';
import { DollarSign, X, ArrowRightLeft, AlertTriangle, Edit3, Undo2 } from 'lucide-react';

interface Deudor {
    proformaId: number;
    numeroPresupuesto: number;
    pacienteId: number;
    totalPresupuesto: number;
    totalPagado: number;
    saldo: number;
    ultimaCita: string;
    especialidad: string;
    tratamiento: string;
    paciente: string;
    status: string;
    traspasado?: boolean;
    traspasoObservacion?: string;
    deudaObservada?: boolean;
    deudaObservadaObservacion?: string;
}

const PacientesDeudores: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'pasivos' | 'activos' | 'traspasados' | 'observados'>('pasivos');
    const [deudores, setDeudores] = useState<Deudor[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [showManual, setShowManual] = useState(false);

    // Modal State for Actions (Traspasar / Observar)
    const [selectedDeudor, setSelectedDeudor] = useState<Deudor | null>(null);
    const [actionType, setActionType] = useState<'traspasar' | 'observar' | 'revertir_traspaso' | 'revertir_observacion' | null>(null);
    const [observacionInput, setObservacionInput] = useState('');
    const [savingAction, setSavingAction] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const manualSections: ManualSection[] = [
        {
            title: '¿Qué es Pacientes Deudores?',
            content: 'Muestra a los pacientes que poseen proformas o presupuestos con saldos pendientes por cancelar, organizados por estado.'
        },
        {
            title: 'Pestañas Disponibles',
            content: '• Pasivos (Terminado): Pacientes cuyo tratamiento clínico en Historia Clínica figura como terminado pero aún tienen saldo pendiente.\n• Activos (No Terminado): Pacientes cuyo tratamiento está en curso y registran saldo pendiente.\n• Traspasados: Presupuestos condonados o retirados del cobro activo (ej: acuerdos personales, parientes del Dr.).\n• Deudas Observadas: Presupuestos con observaciones especiales en el cobro.'
        },
        {
            title: 'Mover Deudas entre Pestañas',
            content: 'En la columna Acciones de cada fila puede hacer clic en "Traspasar" u "Observar" para mover la deuda ingresando el motivo u observación. Desde las pestañas "Traspasados" u "Observadas" puede editar la nota o hacer clic en "Restaurar" para mover la deuda de vuelta a deudores activos/pasivos.'
        },
        {
            title: 'Exportar e Imprimir',
            content: 'Puede descargar el reporte en formato Excel o PDF, o enviarlo a imprimir directamente mediante los botones superiores.'
        }
    ];

    useEffect(() => {
        fetchDeudores();
    }, [activeTab]);

    const fetchDeudores = async () => {
        setLoading(true);
        try {
            const endpoint = `/pacientes-deudores/${activeTab}`;
            const response = await api.get<Deudor[]>(endpoint);
            setDeudores(response.data);
            setCurrentPage(1);
        } catch (error) {
            console.error('Error fetching deudores:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(amount);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return '-';
        const day = String(d.getUTCDate()).padStart(2, '0');
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const year = d.getUTCFullYear();
        return `${day}/${month}/${year}`;
    };

    // --- Action Handlers ---
    const handleOpenActionModal = (deudor: Deudor, type: 'traspasar' | 'observar' | 'revertir_traspaso' | 'revertir_observacion') => {
        setSelectedDeudor(deudor);
        setActionType(type);
        if (type === 'traspasar') {
            setObservacionInput(deudor.traspasoObservacion || '');
        } else if (type === 'observar') {
            setObservacionInput(deudor.deudaObservadaObservacion || '');
        } else {
            setObservacionInput('');
        }
    };

    const handleSaveAction = async () => {
        if (!selectedDeudor || !actionType) return;
        setSavingAction(true);
        try {
            if (actionType === 'traspasar') {
                await api.patch(`/pacientes-deudores/proforma/${selectedDeudor.proformaId}/traspasar`, {
                    traspasado: true,
                    observacion: observacionInput.trim()
                });
            } else if (actionType === 'observar') {
                await api.patch(`/pacientes-deudores/proforma/${selectedDeudor.proformaId}/observar`, {
                    deudaObservada: true,
                    observacion: observacionInput.trim()
                });
            } else if (actionType === 'revertir_traspaso') {
                await api.patch(`/pacientes-deudores/proforma/${selectedDeudor.proformaId}/traspasar`, {
                    traspasado: false,
                    observacion: ''
                });
            } else if (actionType === 'revertir_observacion') {
                await api.patch(`/pacientes-deudores/proforma/${selectedDeudor.proformaId}/observar`, {
                    deudaObservada: false,
                    observacion: ''
                });
            }

            setSelectedDeudor(null);
            setActionType(null);
            setObservacionInput('');
            await fetchDeudores();
        } catch (error) {
            console.error('Error saving action:', error);
            alert('Ocurrió un error al procesar la acción.');
        } finally {
            setSavingAction(false);
        }
    };

    // --- Pagination Logic ---
    const filteredDeudores = deudores.filter(d =>
        d.paciente.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => b.saldo - a.saldo);

    const totalItems = filteredDeudores.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedDeudores = filteredDeudores.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const isObservacionTab = activeTab === 'traspasados' || activeTab === 'observados';

    const getTabTitle = () => {
        switch (activeTab) {
            case 'pasivos': return 'PASIVOS (Tratamiento Terminado)';
            case 'activos': return 'ACTIVOS (Tratamiento No Terminado)';
            case 'traspasados': return 'TRASPASADOS';
            case 'observados': return 'DEUDAS OBSERVADAS';
        }
    };

    // --- Export Logic ---
    const exportToExcel = () => {
        try {
            const excelData = deudores.map(d => {
                const row: any = {
                    '# Presupuesto': d.numeroPresupuesto,
                    'Paciente': d.paciente,
                    'Especialidad': d.especialidad,
                    'Tratamiento': d.tratamiento,
                    'Última Cita': formatDate(d.ultimaCita)
                };
                if (isObservacionTab) {
                    row['Observaciones'] = activeTab === 'traspasados' ? d.traspasoObservacion : d.deudaObservadaObservacion;
                }
                row['Saldo'] = d.saldo;
                return row;
            });

            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, `Deudores_${activeTab}`);
            const date = new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `deudores_${activeTab}_${date}.xlsx`);
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            alert('Error al exportar a Excel');
        }
    };

    const exportToPDF = async () => {
        try {
            const doc = new jsPDF('portrait');

            const logoUrl = '/logo-curare.png';
            const logoImg = new Image();
            logoImg.src = logoUrl;

            await new Promise((resolve) => {
                logoImg.onload = resolve;
                logoImg.onerror = resolve;
            });

            if (logoImg.complete && logoImg.naturalWidth > 0) {
                doc.addImage(logoImg, 'PNG', 14, 10, 30, 15);
            }

            doc.setFontSize(20);
            doc.setTextColor(44, 62, 80);
            doc.text('Pacientes Deudores', 50, 20);

            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Tipo: ${getTabTitle()}`, 50, 26);

            doc.setDrawColor(52, 152, 219);
            doc.setLineWidth(0.5);
            doc.line(14, 32, 196, 32);

            const headCols = isObservacionTab
                ? ['# Pr.', 'Paciente', 'Especialidad', 'Tratamiento', 'Última Cita', 'Observación', 'Saldo']
                : ['# Pr.', 'Paciente', 'Especialidad', 'Tratamiento', 'Última Cita', 'Saldo'];

            const tableData = filteredDeudores.map(d => {
                if (isObservacionTab) {
                    const obs = activeTab === 'traspasados' ? d.traspasoObservacion : d.deudaObservadaObservacion;
                    return [
                        d.numeroPresupuesto,
                        d.paciente,
                        d.especialidad || '-',
                        d.tratamiento || '-',
                        formatDate(d.ultimaCita),
                        obs || '-',
                        formatCurrency(d.saldo)
                    ];
                } else {
                    return [
                        d.numeroPresupuesto,
                        d.paciente,
                        d.especialidad || '-',
                        d.tratamiento || '-',
                        formatDate(d.ultimaCita),
                        formatCurrency(d.saldo)
                    ];
                }
            });

            autoTable(doc, {
                head: [headCols],
                body: tableData,
                startY: 38,
                styles: {
                    fontSize: 8,
                    cellPadding: 2.5
                },
                headStyles: {
                    fillColor: [52, 152, 219],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    halign: 'left'
                },
                alternateRowStyles: {
                    fillColor: [248, 249, 250]
                },
                columnStyles: {
                    [headCols.length - 1]: { halign: 'right', textColor: [231, 76, 60], fontStyle: 'bold' }
                }
            });

            const finalY = (doc as any).lastAutoTable.finalY + 10;
            const totalDeuda = filteredDeudores.reduce((sum, d) => sum + d.saldo, 0);

            doc.setFillColor(248, 249, 250);
            doc.rect(120, finalY, 76, 15, 'F');

            doc.setFontSize(11);
            doc.setTextColor(44, 62, 80);
            doc.setFont('helvetica', 'bold');
            doc.text('Total Deuda:', 125, finalY + 10);

            doc.setTextColor(231, 76, 60);
            doc.text(formatCurrency(totalDeuda), 190, finalY + 10, { align: 'right' });

            const printDate = new Date();
            const dateStr = `${String(printDate.getDate()).padStart(2, '0')}/${String(printDate.getMonth() + 1).padStart(2, '0')}/${printDate.getFullYear()}`;

            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.setFont('helvetica', 'normal');
            doc.text(`Fecha de impresión: ${dateStr}`, 196, 280, { align: 'right' });

            doc.save(`deudores_${activeTab}_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            alert('Error al exportar a PDF');
        }
    };

    const handlePrint = () => {
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

        const printDate = new Date();
        const dateStr = `${String(printDate.getDate()).padStart(2, '0')}/${String(printDate.getMonth() + 1).padStart(2, '0')}/${printDate.getFullYear()}`;

        const totalDeuda = filteredDeudores.reduce((sum, d) => sum + d.saldo, 0);

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Pacientes Deudores - ${getTabTitle()}</title>
                <style>
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 1.5cm 1cm;
                        color: #333;
                    }
                    .header {
                        display: flex;
                        align-items: center;
                        margin-bottom: 20px;
                        padding-bottom: 15px;
                        border-bottom: 2px solid #3498db;
                    }
                    .header img {
                        height: 60px;
                        margin-right: 20px;
                    }
                    h1 {
                        color: #2c3e50;
                        margin: 0;
                        font-size: 24px;
                    }
                    .subtitle {
                        margin: 10px 0;
                        padding: 8px;
                        background-color: #f8f9fa;
                        border-left: 4px solid #3498db;
                        font-size: 12px;
                        font-weight: bold;
                        color: #2c3e50;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 15px;
                    }
                    th {
                        background-color: #3498db;
                        color: white;
                        padding: 10px 6px;
                        text-align: left;
                        font-weight: bold;
                        border: 1px solid #2980b9;
                        font-size: 10px;
                    }
                    td {
                        padding: 6px;
                        border: 1px solid #ddd;
                        font-size: 9px;
                    }
                    tr:nth-child(even) {
                        background-color: #f8f9fa;
                    }
                    .text-right {
                        text-align: right;
                    }
                    .total-section {
                        margin-top: 20px;
                        padding: 15px;
                        background-color: #f8f9fa;
                        border-radius: 8px;
                        border: 1px solid #dee2e6;
                        text-align: right;
                    }
                    .total-label {
                        font-size: 14px;
                        font-weight: bold;
                        color: #2c3e50;
                        margin-right: 10px;
                    }
                    .total-amount {
                        font-size: 18px;
                        font-weight: bold;
                        color: #e74c3c;
                    }
                    .footer {
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        padding: 10px 1cm;
                    }
                    .footer-line {
                        border-top: 1px solid #333;
                        margin-bottom: 10px;
                    }
                    .footer-content {
                        display: flex;
                        justify-content: flex-end;
                        font-size: 9px;
                        color: #666;
                    }
                    .footer-info {
                        text-align: right;
                    }
                    @media print {
                        body {
                            margin: 0;
                        }
                        th {
                            background-color: #3498db !important;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        tr:nth-child(even) {
                            background-color: #f8f9fa !important;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        .subtitle, .total-section {
                            background-color: #f8f9fa !important;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        .footer {
                            position: fixed;
                            bottom: 1cm;
                            left: 1cm;
                            right: 1cm;
                            width: auto;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="/logo-curare.png" alt="Curare Centro Dental">
                    <h1>Pacientes Deudores</h1>
                </div>
                
                <div class="subtitle">
                    Tipo: ${getTabTitle()}
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th># Pr.</th>
                            <th>Paciente</th>
                            <th>Especialidad</th>
                            <th>Tratamiento</th>
                            <th>Última Cita</th>
                            ${isObservacionTab ? '<th>Observación</th>' : ''}
                            <th class="text-right">Saldo</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredDeudores.map(d => `
                            <tr>
                                <td>${d.numeroPresupuesto}</td>
                                <td>${d.paciente}</td>
                                <td>${d.especialidad || '-'}</td>
                                <td>${d.tratamiento || '-'}</td>
                                <td>${formatDate(d.ultimaCita)}</td>
                                ${isObservacionTab ? `<td>${(activeTab === 'traspasados' ? d.traspasoObservacion : d.deudaObservadaObservacion) || '-'}</td>` : ''}
                                <td class="text-right" style="font-weight: bold; color: #e74c3c;">${formatCurrency(d.saldo)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="total-section">
                    <span class="total-label">Total Deuda:</span>
                    <span class="total-amount">${formatCurrency(totalDeuda)}</span>
                </div>
                
                <div class="footer">
                    <div class="footer-line"></div>
                    <div class="footer-content">
                        <div class="footer-info">
                            <div>Fecha de impresión: ${dateStr}</div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        doc.open();
        doc.write(printContent);
        doc.close();

        const logo = doc.querySelector('img');

        const doPrint = () => {
            try {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
            } catch (e) {
                console.error('Print error:', e);
            } finally {
                setTimeout(() => {
                    if (document.body.contains(iframe)) {
                        document.body.removeChild(iframe);
                    }
                }, 2000);
            }
        };

        if (logo) {
            if (logo.complete) {
                doPrint();
            } else {
                logo.onload = doPrint;
                logo.onerror = doPrint;
            }
        } else {
            doPrint();
        }
    };

    return (
        <div className="content-card">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 no-print gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-2xl shadow-sm">
                        <DollarSign className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
                            Pacientes Deudores
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                            Reporte y control de pacientes con saldos pendientes por presupuestos
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    <button
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>
                    <button
                        onClick={exportToExcel}
                        className="bg-[#28a745] hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm"
                        title="Exportar a Excel"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg> Excel
                    </button>
                    <button
                        onClick={exportToPDF}
                        className="bg-[#dc3545] hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm"
                        title="Exportar a PDF"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg> PDF
                    </button>
                    <button
                        onClick={handlePrint}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm"
                        title="Imprimir"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg> Imprimir
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="no-print flex flex-wrap border-b border-gray-200 dark:border-gray-600 mb-5 bg-white dark:bg-gray-800 rounded-t-lg pt-2 px-2 transition-colors">
                <div
                    onClick={() => setActiveTab('pasivos')}
                    className={`px-5 py-2.5 cursor-pointer border-b-4 flex items-center gap-2 transition-all duration-200 text-base ${activeTab === 'pasivos'
                        ? 'border-blue-500 text-blue-500 font-bold dark:border-blue-400 dark:text-blue-400'
                        : 'border-transparent text-gray-600 dark:text-gray-400 font-normal hover:text-blue-500 dark:hover:text-blue-300'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="8.5" cy="7" r="4"></circle>
                        <polyline points="17 11 19 13 23 9"></polyline>
                    </svg>
                    Pasivos (Terminado)
                </div>
                <div
                    onClick={() => setActiveTab('activos')}
                    className={`px-5 py-2.5 cursor-pointer border-b-4 flex items-center gap-2 transition-all duration-200 text-base ${activeTab === 'activos'
                        ? 'border-blue-500 text-blue-500 font-bold dark:border-blue-400 dark:text-blue-400'
                        : 'border-transparent text-gray-600 dark:text-gray-400 font-normal hover:text-blue-500 dark:hover:text-blue-300'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="8.5" cy="7" r="4"></circle>
                        <line x1="20" y1="8" x2="20" y2="14"></line>
                        <line x1="23" y1="11" x2="17" y2="11"></line>
                    </svg>
                    Activos (No Terminado)
                </div>
                <div
                    onClick={() => setActiveTab('traspasados')}
                    className={`px-5 py-2.5 cursor-pointer border-b-4 flex items-center gap-2 transition-all duration-200 text-base ${activeTab === 'traspasados'
                        ? 'border-orange-500 text-orange-500 font-bold dark:border-orange-400 dark:text-orange-400'
                        : 'border-transparent text-gray-600 dark:text-gray-400 font-normal hover:text-orange-500 dark:hover:text-orange-300'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 1l4 4-4 4"></path>
                        <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                        <path d="M7 23l-4-4 4-4"></path>
                        <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                    </svg>
                    Traspasados
                </div>
                <div
                    onClick={() => setActiveTab('observados')}
                    className={`px-5 py-2.5 cursor-pointer border-b-4 flex items-center gap-2 transition-all duration-200 text-base ${activeTab === 'observados'
                        ? 'border-amber-500 text-amber-500 font-bold dark:border-amber-400 dark:text-amber-400'
                        : 'border-transparent text-gray-600 dark:text-gray-400 font-normal hover:text-amber-500 dark:hover:text-amber-300'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    Deudas Observadas
                </div>
            </div>

            {/* Search */}
            <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 no-print flex justify-between items-center transition-colors">
                <div className="flex items-center gap-2 flex-grow max-w-md">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Buscar por Paciente..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors text-sm"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                        <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchTerm('');
                                setCurrentPage(1);
                            }}
                            className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg shadow-sm transition-all text-xs flex items-center gap-1 shrink-0"
                        >
                            <X size={14} />
                            <span>Limpiar</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Showing status */}
            <div className="mb-3 text-sm text-gray-500 dark:text-gray-400 no-print">
                Mostrando {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} registros
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto transition-colors">
                {loading ? (
                    <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Cargando...</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider"># Presupuesto</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Paciente</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Especialidad</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tratamiento</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Última Cita</th>
                                {isObservacionTab && (
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Observación</th>
                                )}
                                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Saldo</th>
                                <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider no-print">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {paginatedDeudores.length > 0 ? (
                                paginatedDeudores.map((deudor) => (
                                    <tr key={deudor.proformaId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-200">#{deudor.numeroPresupuesto}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{deudor.paciente}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{deudor.especialidad || '-'}</td>
                                        <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={deudor.tratamiento}>
                                            {deudor.tratamiento || '-'}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(deudor.ultimaCita)}</td>
                                        {isObservacionTab && (
                                            <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-xs italic truncate" title={(activeTab === 'traspasados' ? deudor.traspasoObservacion : deudor.deudaObservadaObservacion) || ''}>
                                                {(activeTab === 'traspasados' ? deudor.traspasoObservacion : deudor.deudaObservadaObservacion) || '-'}
                                            </td>
                                        )}
                                        <td className={`px-4 py-4 whitespace-nowrap text-sm font-bold ${deudor.saldo > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                            {formatCurrency(deudor.saldo)}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center no-print">
                                            {activeTab === 'pasivos' || activeTab === 'activos' ? (
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => handleOpenActionModal(deudor, 'traspasar')}
                                                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-950/40 dark:text-orange-300 dark:hover:bg-orange-900/50 border border-orange-200 dark:border-orange-800 transition-all flex items-center gap-1"
                                                        title="Traspasar Deuda (Condonar / Retirar de cobro activo)"
                                                    >
                                                        <ArrowRightLeft size={13} />
                                                        <span>Traspasar</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenActionModal(deudor, 'observar')}
                                                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 transition-all flex items-center gap-1"
                                                        title="Marcar como Deuda Observada"
                                                    >
                                                        <AlertTriangle size={13} />
                                                        <span>Observar</span>
                                                    </button>
                                                </div>
                                            ) : activeTab === 'traspasados' ? (
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => handleOpenActionModal(deudor, 'traspasar')}
                                                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 transition-all flex items-center gap-1"
                                                        title="Editar Nota de Traspaso"
                                                    >
                                                        <Edit3 size={13} />
                                                        <span>Editar Nota</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenActionModal(deudor, 'revertir_traspaso')}
                                                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 transition-all flex items-center gap-1"
                                                        title="Restaurar Deuda a lista Activa/Pasiva"
                                                    >
                                                        <Undo2 size={13} />
                                                        <span>Restaurar</span>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => handleOpenActionModal(deudor, 'observar')}
                                                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 transition-all flex items-center gap-1"
                                                        title="Editar Observación de Deuda"
                                                    >
                                                        <Edit3 size={13} />
                                                        <span>Editar Nota</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenActionModal(deudor, 'revertir_observacion')}
                                                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 transition-all flex items-center gap-1"
                                                        title="Restaurar Deuda a lista Activa/Pasiva"
                                                    >
                                                        <Undo2 size={13} />
                                                        <span>Restaurar</span>
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={isObservacionTab ? 8 : 7} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400 italic">
                                        No se encontraron registros.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Total Footer */}
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex justify-end items-center transition-colors">
                <span className="text-base font-bold text-gray-700 dark:text-gray-300 mr-2">Total Deuda:</span>
                <span className="text-lg font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(filteredDeudores.reduce((sum, d) => sum + d.saldo, 0))}
                </span>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="mt-4 no-print">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </div>
            )}

            {/* Modal for Traspaso / Observación */}
            {selectedDeudor && actionType && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto no-print">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                                    {actionType === 'traspasar' && <ArrowRightLeft className="text-orange-500 w-5 h-5" />}
                                    {actionType === 'observar' && <AlertTriangle className="text-amber-500 w-5 h-5" />}
                                    {(actionType === 'revertir_traspaso' || actionType === 'revertir_observacion') && <Undo2 className="text-blue-500 w-5 h-5" />}
                                    {actionType === 'traspasar' ? 'Traspasar Deuda' : actionType === 'observar' ? 'Marcar Deuda Observada' : 'Restaurar Deuda'}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Paciente: <strong className="text-gray-800 dark:text-gray-200">{selectedDeudor.paciente}</strong> | Presupuesto: <strong>#{selectedDeudor.numeroPresupuesto}</strong>
                                </p>
                            </div>
                            <button
                                onClick={() => { setSelectedDeudor(null); setActionType(null); }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {(actionType === 'traspasar' || actionType === 'observar') ? (
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                    {actionType === 'traspasar' ? 'Motivo / Observación del Traspaso:' : 'Motivo / Detalle de la Observación:'}
                                </label>
                                <textarea
                                    rows={3}
                                    className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder={actionType === 'traspasar' ? 'Ej: Familiar del Dr., Acuerdo de exoneración, etc.' : 'Ej: Monto en revisión de laboratorio, ajuste de garantía, etc.'}
                                    value={observacionInput}
                                    onChange={(e) => setObservacionInput(e.target.value)}
                                />
                            </div>
                        ) : (
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                                ¿Está seguro de retirar la marca y restaurar esta deuda de <strong>Bs. {formatCurrency(selectedDeudor.saldo)}</strong> a la lista activa/pasiva de deudores?
                            </p>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => { setSelectedDeudor(null); setActionType(null); }}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold transition-all"
                                disabled={savingAction}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveAction}
                                className={`px-4 py-2 text-white rounded-xl text-xs font-bold shadow transition-all ${
                                    actionType === 'traspasar' ? 'bg-orange-600 hover:bg-orange-700' :
                                    actionType === 'observar' ? 'bg-amber-600 hover:bg-amber-700' :
                                    'bg-blue-600 hover:bg-blue-700'
                                }`}
                                disabled={savingAction}
                            >
                                {savingAction ? 'Guardando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Modal */}
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual - Pacientes Deudores"
                sections={manualSections}
            />
        </div>
    );
};

export default PacientesDeudores;
