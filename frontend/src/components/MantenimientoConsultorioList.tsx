import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';
import type { RepuestoItem } from '../types';
import ManualModal, { type ManualSection } from './ManualModal';
import MantenimientoConsultorioForm from './MantenimientoConsultorioForm';
import Pagination from './Pagination';
import Swal from 'sweetalert2';
import { formatDate } from '../utils/dateUtils';
import { formatCurrency } from '../utils/formatters';
import { Wrench, Calendar, Home, Search, RotateCcw } from 'lucide-react';

interface PaginatedResponse {
    data: RepuestoItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const MantenimientoConsultorioList: React.FC = () => {
    const navigate = useNavigate();
    const [repuestos, setRepuestos] = useState<RepuestoItem[]>([]);
    const [consultoriosDisponibles, setConsultoriosDisponibles] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedConsultorio, setSelectedConsultorio] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [showManual, setShowManual] = useState(false);

    // Modal state for MantenimientoConsultorioForm
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedRepuestoId, setSelectedRepuestoId] = useState<number | null>(null);

    const limit = 10;

    const manualSections: ManualSection[] = [
        {
            title: 'Mantenimiento de Consultorios & Repuestos',
            content: 'Consulte, filtre por consultorio o fechas, registre y gestione los mantenimientos preventivos/correctivos, cambio de repuestos y piezas de mano en los consultorios dentales.'
        },
        {
            title: 'Acciones Disponibles',
            content: (
                <ul className="list-disc pl-5 space-y-1">
                    <li>🔍 <strong>Filtros:</strong> Búsqueda por descripción/motivo, filtro por consultorio y rango de fechas (Desde / Hasta).</li>
                    <li>✏️ <strong>Editar:</strong> Modifica la información del mantenimiento registrado.</li>
                    <li>🗑️ <strong>Eliminar:</strong> Borra el registro de mantenimiento del historial.</li>
                </ul>
            )
        }
    ];

    useEffect(() => {
        fetchConsultorios();
    }, []);

    useEffect(() => {
        fetchRepuestos();
    }, [currentPage, searchTerm, selectedConsultorio, startDate, endDate]);

    const fetchConsultorios = async () => {
        try {
            const response = await api.get<string[]>('/repuesto/consultorios');
            setConsultoriosDisponibles(response.data || []);
        } catch (error) {
            console.error('Error fetching consultorios:', error);
        }
    };

    const fetchRepuestos = async () => {
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: limit.toString(),
            });

            if (searchTerm.trim()) {
                params.append('search', searchTerm.trim());
            }

            if (selectedConsultorio.trim()) {
                params.append('consultorio', selectedConsultorio.trim());
            }

            if (startDate) {
                params.append('startDate', startDate);
            }

            if (endDate) {
                params.append('endDate', endDate);
            }

            const response = await api.get<PaginatedResponse>(`/repuesto?${params}`);
            setRepuestos(response.data.data || []);
            setTotalPages(response.data.totalPages || 1);
            setTotal(response.data.total || 0);
        } catch (error) {
            console.error('Error fetching repuestos:', error);
        }
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedConsultorio('');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    };

    const hasActiveFilters = Boolean(searchTerm || selectedConsultorio || startDate || endDate);

    const getConsultorioNumero = (consultorio?: string) => {
        if (!consultorio) return '-';
        const match = consultorio.match(/\d+/);
        if (match) return match[0];
        const cleaned = consultorio.replace(/consultorio\s*/i, '').trim();
        return cleaned || '-';
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Eliminar mantenimiento?',
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
                await api.delete(`/repuesto/${id}`);
                Swal.fire({
                    icon: 'success',
                    title: '¡Eliminado!',
                    text: 'Mantenimiento eliminado correctamente',
                    timer: 1500,
                    showConfirmButton: false,
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
                fetchRepuestos();
                fetchConsultorios();
            } catch (error) {
                console.error('Error deleting repuesto:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo eliminar el registro',
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
            }
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const fetchAllFilteredRepuestos = async (): Promise<RepuestoItem[]> => {
        try {
            const params = new URLSearchParams({
                page: '1',
                limit: '10000',
            });
            if (searchTerm.trim()) params.append('search', searchTerm.trim());
            if (selectedConsultorio.trim()) params.append('consultorio', selectedConsultorio.trim());
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const response = await api.get<PaginatedResponse>(`/repuesto?${params}`);
            return response.data.data || [];
        } catch (error) {
            console.error('Error fetching filtered repuestos for export:', error);
            return repuestos;
        }
    };

    const exportToExcel = async () => {
        try {
            const dataToExport = await fetchAllFilteredRepuestos();
            const excelData = dataToExport.map(r => ({
                'N°': r.id,
                'Fecha': formatDate(r.fecha),
                'Consultorio': getConsultorioNumero(r.consultorio),
                'Descripción': r.descripcion,
                'Motivo': r.motivo || '-',
                'Observaciones': r.observaciones || '-',
                'Costo Repuesto (Bs)': r.costo,
                'Mano de Obra (Bs)': r.manoObra,
                'Total (Bs)': (r.costo || 0) + (r.manoObra || 0)
            }));
            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Mantenimientos');
            XLSX.writeFile(wb, `Mantenimientos_Consultorios_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (err) {
            console.error(err);
        }
    };

    const exportToPDF = async () => {
        try {
            const dataToExport = await fetchAllFilteredRepuestos();
            const doc = new jsPDF();
            doc.text('Reporte de Mantenimiento de Consultorios y Repuestos', 14, 15);
            const tableData = dataToExport.map(r => [
                r.id.toString(),
                formatDate(r.fecha),
                getConsultorioNumero(r.consultorio),
                r.descripcion,
                formatCurrency(r.costo),
                formatCurrency(r.manoObra),
                formatCurrency((r.costo || 0) + (r.manoObra || 0))
            ]);
            autoTable(doc, {
                startY: 20,
                head: [['N°', 'Fecha', 'Consultorio', 'Descripción', 'Costo Rep.', 'Mano Obra', 'Total (Bs)']],
                body: tableData,
            });
            doc.save(`Mantenimientos_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error(err);
        }
    };

    const handlePrint = async () => {
        try {
            const allData = await fetchAllFilteredRepuestos();

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

            const printDate = new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const filterDetails: string[] = [];
            if (selectedConsultorio) {
                filterDetails.push(`<strong>Consultorio:</strong> Consultorio ${getConsultorioNumero(selectedConsultorio)}`);
            }
            if (startDate && endDate) {
                filterDetails.push(`<strong>Rango:</strong> ${formatDate(startDate)} al ${formatDate(endDate)}`);
            } else if (startDate) {
                filterDetails.push(`<strong>Desde:</strong> ${formatDate(startDate)}`);
            } else if (endDate) {
                filterDetails.push(`<strong>Hasta:</strong> ${formatDate(endDate)}`);
            }
            if (searchTerm.trim()) {
                filterDetails.push(`<strong>Búsqueda:</strong> "${searchTerm.trim()}"`);
            }

            const totalRepuestos = allData.reduce((acc, curr) => acc + (Number(curr.costo) || 0), 0);
            const totalManoObra = allData.reduce((acc, curr) => acc + (Number(curr.manoObra) || 0), 0);
            const totalGeneral = totalRepuestos + totalManoObra;

            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Reporte de Mantenimiento de Consultorios</title>
                    <style>
                        @page {
                            size: A4 portrait;
                            margin: 1.8cm 1.2cm 2cm 1.2cm;
                        }
                        
                        body {
                            font-family: Arial, 'Segoe UI', sans-serif;
                            margin: 0;
                            padding: 0;
                            padding-bottom: 50px;
                            color: #333;
                            font-size: 11px;
                        }
                        
                        .header {
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            position: relative;
                            margin-bottom: 20px;
                            padding-bottom: 15px;
                            border-bottom: 2px solid #3498db;
                            min-height: 55px;
                        }

                        .header img {
                            position: absolute;
                            left: 0;
                            top: 50%;
                            transform: translateY(-50%);
                            height: 55px;
                            object-fit: contain;
                        }
                        
                        h1 {
                            color: #2c3e50;
                            margin: 0;
                            font-size: 22px;
                            font-weight: bold;
                            text-align: center;
                        }
                        
                        .filter-info {
                            background-color: #f8fafc;
                            border: 1px solid #e2e8f0;
                            border-radius: 6px;
                            padding: 8px 12px;
                            margin-bottom: 15px;
                            font-size: 11px;
                            color: #475569;
                            display: flex;
                            flex-wrap: wrap;
                            gap: 15px;
                        }

                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 5px;
                            font-size: 10px;
                        }
                        
                        th {
                            background-color: #3498db !important;
                            color: white !important;
                            padding: 8px 6px;
                            text-align: left;
                            font-weight: bold;
                            border: 1px solid #2980b9;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }

                        th.text-center, td.text-center {
                            text-align: center;
                        }

                        th.text-right, td.text-right {
                            text-align: right;
                        }
                        
                        td {
                            padding: 6px;
                            border: 1px solid #e2e8f0;
                            vertical-align: middle;
                        }
                        
                        tr:nth-child(even) {
                            background-color: #f8fafc !important;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }

                        tfoot tr td {
                            background-color: #f1f5f9 !important;
                            font-weight: bold;
                            border-top: 2px solid #cbd5e1;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        
                        .footer {
                            position: fixed;
                            bottom: 0;
                            left: 0;
                            right: 0;
                            padding: 8px 1.2cm;
                            background: white;
                        }
                        
                        .footer-line {
                            border-top: 1px solid #cbd5e1;
                            margin-bottom: 6px;
                        }
                        
                        .footer-content {
                            display: flex;
                            justify-content: space-between;
                            font-size: 9px;
                            color: #94a3b8;
                        }
                        
                        @media print {
                            body {
                                -webkit-print-color-adjust: exact;
                                print-color-adjust: exact;
                            }
                            th {
                                background-color: #3498db !important;
                                color: white !important;
                            }
                            .footer {
                                position: fixed;
                                bottom: 0;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <img src="/logo-curare.png" alt="Curare Centro Dental">
                        <h1>Mantenimiento de Consultorios</h1>
                    </div>
                    
                    ${filterDetails.length > 0 ? `
                        <div class="filter-info">
                            ${filterDetails.map(f => `<div>${f}</div>`).join('')}
                        </div>
                    ` : ''}
                    
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 30px;">#</th>
                                <th style="width: 70px;">Fecha</th>
                                <th class="text-center" style="width: 65px;">Consultorio</th>
                                <th>Descripción Trabajo / Repuesto</th>
                                <th>Motivo / Notas</th>
                                <th class="text-right" style="width: 80px;">Costo Rep.</th>
                                <th class="text-right" style="width: 80px;">Mano Obra</th>
                                <th class="text-right" style="width: 85px;">Total (Bs)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${allData.length === 0 ? `
                                <tr>
                                    <td colspan="8" class="text-center" style="padding: 20px; color: #94a3b8;">
                                        No se encontraron registros con los filtros aplicados.
                                    </td>
                                </tr>
                            ` : allData.map((item) => {
                                const itemTotal = (Number(item.costo) || 0) + (Number(item.manoObra) || 0);
                                return `
                                    <tr>
                                        <td>${item.id}</td>
                                        <td>${formatDate(item.fecha)}</td>
                                        <td class="text-center" style="font-weight: bold;">${getConsultorioNumero(item.consultorio)}</td>
                                        <td>${item.descripcion || '-'}</td>
                                        <td style="color: #64748b;">${item.motivo || item.observaciones || '-'}</td>
                                        <td class="text-right">Bs. ${formatCurrency(item.costo)}</td>
                                        <td class="text-right">Bs. ${formatCurrency(item.manoObra)}</td>
                                        <td class="text-right" style="font-weight: bold; color: #059669;">Bs. ${formatCurrency(itemTotal)}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                        ${allData.length > 0 ? `
                            <tfoot>
                                <tr>
                                    <td colspan="5" class="text-right" style="font-weight: bold;">TOTALES:</td>
                                    <td class="text-right">Bs. ${formatCurrency(totalRepuestos)}</td>
                                    <td class="text-right">Bs. ${formatCurrency(totalManoObra)}</td>
                                    <td class="text-right" style="color: #059669; font-weight: bold;">Bs. ${formatCurrency(totalGeneral)}</td>
                                </tr>
                            </tfoot>
                        ` : ''}
                    </table>

                    <div class="footer">
                        <div class="footer-line"></div>
                        <div class="footer-content">
                            <div>Curare Centro Dental</div>
                            <div>Fecha y hora de impresión: ${printDate}</div>
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
        } catch (error) {
            console.error('Error al imprimir:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo generar el documento para impresión'
            });
        }
    };

    return (
        <div className="content-card">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 no-print gap-4">
                <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                    <button
                        onClick={() => navigate('/otros')}
                        className="p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 shadow-sm transition-all transform hover:-translate-y-0.5 no-print flex items-center justify-center w-10 h-10 cursor-pointer"
                        title="Volver a Otros"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-2xl shadow-sm">
                        <Wrench className="h-8 w-8 text-green-600 dark:text-green-300" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                            Mantenimiento de Consultorios
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Registro de mantenimientos, cambio de repuestos y equipos por consultorio
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    <button
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center w-10 h-10 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shadow-sm no-print cursor-pointer"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>
                    <button
                        onClick={exportToExcel}
                        className="bg-[#28a745] hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm cursor-pointer"
                        title="Exportar a Excel"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg> Excel
                    </button>
                    <button
                        onClick={exportToPDF}
                        className="bg-[#dc3545] hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm cursor-pointer"
                        title="Exportar a PDF"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg> PDF
                    </button>
                    <button
                        onClick={handlePrint}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm cursor-pointer"
                        title="Imprimir"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg> Imprimir
                    </button>
                    <button
                        onClick={() => {
                            setSelectedRepuestoId(null);
                            setIsFormOpen(true);
                        }}
                        className="bg-[#3498db] hover:bg-blue-600 text-white font-semibold py-2 px-5 rounded-xl flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 text-sm cursor-pointer"
                    >
                        <span className="text-xl">+</span> Nuevo Mantenimiento
                    </button>
                </div>
            </div>

            {/* Filter / Search Bar */}
            <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 no-print">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
                    {/* Búsqueda por descripción / motivo */}
                    <div className="lg:col-span-4">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                            Búsqueda:
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar por descripción o motivo..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-400 text-sm"
                            />
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        </div>
                    </div>

                    {/* Filtro por Consultorio */}
                    <div className="lg:col-span-3">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                            Consultorio:
                        </label>
                        <div className="relative">
                            <select
                                value={selectedConsultorio}
                                onChange={(e) => { setSelectedConsultorio(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 text-sm appearance-none cursor-pointer"
                            >
                                <option value="">Todos los consultorios</option>
                                {consultoriosDisponibles.map((c) => (
                                    <option key={c} value={c}>
                                        Consultorio {getConsultorioNumero(c)}
                                    </option>
                                ))}
                            </select>
                            <Home className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                        </div>
                    </div>

                    {/* Fecha Desde */}
                    <div className="lg:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                            Desde:
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 text-sm"
                            />
                            <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                        </div>
                    </div>

                    {/* Fecha Hasta */}
                    <div className="lg:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                            Hasta:
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 text-sm"
                            />
                            <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                        </div>
                    </div>

                    {/* Botón Limpiar */}
                    <div className="lg:col-span-1 flex items-end">
                        {hasActiveFilters ? (
                            <button
                                onClick={handleClearFilters}
                                className="w-full py-2 px-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-medium rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer h-[38px]"
                                title="Limpiar todos los filtros"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span className="hidden sm:inline lg:hidden">Limpiar</span>
                            </button>
                        ) : (
                            <div className="h-[38px] w-full" />
                        )}
                    </div>
                </div>
            </div>

            {/* Contador Mostrando x - y de z registros */}
            <div className="mb-4 text-gray-600 dark:text-gray-400 text-sm font-medium">
                Mostrando {repuestos.length === 0 ? 0 : (currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, total)} de {total} registros
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden mb-6">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">#</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Fecha</th>
                                <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-300">Consultorio</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Descripción Trabajo / Repuesto</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Motivo / Notas</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Costo Repuesto</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Mano Obra</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Total (Bs)</th>
                                <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-300">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {repuestos.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                        No se encontraron registros de mantenimiento.
                                    </td>
                                </tr>
                            ) : (
                                repuestos.map((item) => {
                                    const totalTrabajo = (Number(item.costo) || 0) + (Number(item.manoObra) || 0);
                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-bold whitespace-nowrap">
                                                {item.id}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                                {formatDate(item.fecha)}
                                            </td>
                                            <td className="px-4 py-3 text-gray-900 dark:text-white font-bold whitespace-nowrap text-center">
                                                {getConsultorioNumero(item.consultorio)}
                                            </td>
                                            <td className="px-4 py-3 text-gray-800 dark:text-gray-200 font-medium max-w-xs">
                                                {item.descripcion}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs max-w-xs truncate">
                                                {item.motivo || item.observaciones || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap font-medium">
                                                Bs. {formatCurrency(item.costo)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap font-medium">
                                                Bs. {formatCurrency(item.manoObra)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-green-600 dark:text-green-400 whitespace-nowrap">
                                                Bs. {formatCurrency(totalTrabajo)}
                                            </td>
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                <div className="flex gap-2 justify-center">
                                                    {/* Botón Editar */}
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRepuestoId(item.id);
                                                            setIsFormOpen(true);
                                                        }}
                                                        className="p-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 inline-flex items-center justify-center cursor-pointer"
                                                        title="Editar Mantenimiento"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                        </svg>
                                                    </button>
                                                    {/* Botón Eliminar */}
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 inline-flex items-center justify-center cursor-pointer"
                                                        title="Eliminar Mantenimiento"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            )}

            {/* Form Modal */}
            <MantenimientoConsultorioForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                id={selectedRepuestoId}
                onSaveSuccess={() => {
                    fetchRepuestos();
                    fetchConsultorios();
                    setIsFormOpen(false);
                }}
            />

            {/* Manual Modal */}
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Mantenimiento de Consultorios"
                sections={manualSections}
            />
        </div>
    );
};

export default MantenimientoConsultorioList;
