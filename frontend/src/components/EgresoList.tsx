import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import type { Egreso } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Pagination from './Pagination';
import ManualModal, { type ManualSection } from './ManualModal';
import EgresoForm from './EgresoForm';
import { formatDate, getLocalDateString } from '../utils/dateUtils';
import { formatCurrency } from '../utils/formatters';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import Swal from 'sweetalert2';

interface PaginatedResponse {
    data: Egreso[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    totals?: Record<string, { bolivianos: number; dolares: number }>;
}

const EgresoList: React.FC = () => {
    const [egresos, setEgresos] = useState<Egreso[]>([]);

    // Date & Calendar State
    const [calendarValue, setCalendarValue] = useState<any>(new Date());
    const [startDate, setStartDate] = useState(getLocalDateString()); // Default to today local date
    const [endDate, setEndDate] = useState(getLocalDateString());   // Default to today local date

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;
    const [totals, setTotals] = useState<Record<string, { bolivianos: number; dolares: number }>>({});
    const [showManual, setShowManual] = useState(false);

    // Modal state for EgresoForm
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedEgresoId, setSelectedEgresoId] = useState<number | null>(null);

    const manualSections: ManualSection[] = [
        {
            title: 'Navegación por Calendario',
            content: 'Utilice el calendario a la derecha para ver los egresos de una fecha específica. Al seleccionar un día, la lista se filtra automáticamente.'
        },
        {
            title: 'Gestión de Egresos',
            content: 'Registro de gastos operativos (limpieza, insumos diarios, refacciones, etc) tanto del Consultorio como de Casa.'
        },
        {
            title: 'Registrar Egreso',
            content: 'Botón azul "+ Nuevo Egreso". Seleccione si es un gasto de "Consultorio" o "Casa" para los reportes diferenciados.'
        },
        {
            title: 'Filtros y Búsqueda',
            content: 'Puede buscar por descripción del gasto. El rango de fechas se actualiza automáticamente al usar el calendario, pero también puede modificarse manualmente.'
        },
        {
            title: 'Reportes y Totales',
            content: 'Al final de la lista, el sistema muestra automáticamente los totales sumados por forma de pago (Efectivo, Transferencia, etc) según los filtros aplicados.'
        }
    ];

    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        fetchEgresos();
    }, [currentPage, debouncedSearchTerm, startDate, endDate]);

    const fetchEgresos = async () => {
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: limit.toString(),
            });

            if (startDate && endDate) {
                params.append('startDate', startDate);
                params.append('endDate', endDate);
            }

            if (debouncedSearchTerm) {
                params.append('search', debouncedSearchTerm);
            }

            const response = await api.get<PaginatedResponse>(`/egresos?${params}`);
            setEgresos(response.data.data);
            setTotalPages(response.data.totalPages);
            setTotal(response.data.total);
            if (response.data.totals) {
                setTotals(response.data.totals);
            }
        } catch (error) {
            console.error('Error fetching egresos:', error);
            alert('Error al cargar los egresos');
        }
    };

    // ... (handlers remain same)



    const handleCalendarChange = (value: any) => {
        setCalendarValue(value);
        if (value instanceof Date) {
            const year = value.getFullYear();
            const month = String(value.getMonth() + 1).padStart(2, '0');
            const day = String(value.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;

            // Set both start and end to the selected date for single-day view
            setStartDate(formattedDate);
            setEndDate(formattedDate);
            setCurrentPage(1); // Reset to first page
        }
    };

    const handleClearSearch = () => {
        const today = new Date();
        setCalendarValue(today);
        const todayStr = getLocalDateString();
        setStartDate(todayStr);
        setEndDate(todayStr);
        setSearchTerm('');
        setCurrentPage(1);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('¿Está seguro de eliminar este egreso?')) {
            try {
                await api.delete(`/egresos/${id}`);
                alert('Egreso eliminado exitosamente');
                fetchEgresos();
            } catch (error) {
                console.error('Error deleting egreso:', error);
                alert('Error al eliminar el egreso');
            }
        }
    };

    const handleGenerarRecibo = async (egreso: Egreso) => {
        try {
            const response = await api.post(`/egresos/${egreso.id}/generar-recibo`);
            const { recibo } = response.data;

            Swal.fire({
                icon: 'success',
                title: '¡Recibo Generado!',
                text: `Se generó el Recibo N° ${recibo.accessId || recibo.id} para este egreso.`,
                timer: 1800,
                showConfirmButton: false,
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });

            // Actualizar el estado local para que el botón cambie a "Imprimir Recibo"
            setEgresos(prev => prev.map(e => e.id === egreso.id ? { ...e, reciboId: recibo.id, recibo } : e));

            // Abrir automáticamente la vista de impresión del recibo generado
            handlePrintRecibo(recibo);
        } catch (error) {
            console.error('Error al generar recibo:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo generar el recibo del egreso.',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
        }
    };

    const handlePrintRecibo = (item: any) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const isDolares = (item.moneda || '').toUpperCase().includes('DOLAR');
        const simbolo = isDolares ? '$us' : 'Bs.';
        const montoFormatted = formatCurrency(item.monto);
        const fechaStr = formatDate(item.fecha);
        const numeroRecibo = item.accessId || item.id || '-';

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Recibo N° ${numeroRecibo}</title>
                <style>
                    @page { size: A4 portrait; margin: 15mm; }
                    body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; color: #1e293b; }
                    
                    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 3px solid #3498db; }
                    .header-left { display: flex; align-items: center; gap: 20px; }
                    .header img { height: 60px; object-fit: contain; }
                    .header h1 { color: #2c3e50; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; }
                    
                    .recibo-box { margin-bottom: 25px; padding: 20px 24px; background-color: #f8f9fa; border-left: 6px solid #3498db; border-radius: 4px; }
                    .info-row { margin-bottom: 14px; font-size: 14px; font-family: Arial, sans-serif; display: flex; align-items: baseline; }
                    .info-row:last-child { margin-bottom: 0; }
                    .info-label { font-weight: bold; color: #1e293b; min-width: 140px; text-transform: uppercase; }
                    .info-value { color: #1e293b; letter-spacing: 0.3px; flex: 1; border-bottom: 1px dotted #cbd5e1; padding-bottom: 3px; }

                    .signature-area { margin-top: 100px; display: flex; justify-content: space-around; text-align: center; }
                    .signature-line { width: 220px; margin: 0 auto 8px auto; border-top: 1px solid #334155; }
                    .signature-name { font-weight: bold; font-size: 13px; color: #1e293b; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="header-left">
                        <img src="/logo-curare.png" alt="Curare Centro Dental">
                        <h1>RECIBO</h1>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 18px; font-weight: bold; color: #dc2626;">N° ${numeroRecibo}</div>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Fecha: ${fechaStr}</div>
                    </div>
                </div>

                <div class="recibo-box">
                    <div class="info-row">
                        <span class="info-label">NOMBRE:</span>
                        <span class="info-value" style="font-weight: bold; font-size: 16px;">${item.nombre || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">CONCEPTO:</span>
                        <span class="info-value">${item.concepto || 'Sin concepto'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">MONTO:</span>
                        <span class="info-value" style="font-weight: bold; font-size: 18px; color: #1e3a8a;">${simbolo} ${montoFormatted}</span>
                    </div>
                </div>

                <div class="signature-area">
                    <div>
                        <div class="signature-line"></div>
                        <div class="signature-name">Firma Conforme</div>
                    </div>
                    <div>
                        <div class="signature-line"></div>
                        <div class="signature-name">Entregué Conforme</div>
                    </div>
                </div>

                <script>
                    window.onload = function() {
                        setTimeout(function() { window.print(); }, 500);
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // ... (export functions remain same)

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString();
    };

    const exportToExcel = () => {
        try {
            const excelData = egresos.map(egreso => ({
                'ID': egreso.id,
                'Fecha': formatDate(egreso.fecha),
                'Destino': egreso.destino,
                'Detalle': egreso.detalle,
                'Monto': egreso.monto,
                'Moneda': egreso.moneda,
                'Forma de Pago': egreso.formaPago?.forma_pago || ''
            }));

            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Egresos');
            XLSX.writeFile(wb, `egresos_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            alert('Error al exportar a Excel');
        }
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            doc.text('Reporte de Egresos', 14, 22);
            doc.setFontSize(10);
            doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);
            if (startDate && endDate) {
                doc.text(`Rango: ${startDate} al ${endDate}`, 14, 36);
            }

            const tableData = egresos.map(egreso => [
                egreso.id,
                formatDate(egreso.fecha),
                egreso.destino,
                egreso.detalle,
                egreso.monto,
                egreso.moneda,
                egreso.formaPago?.forma_pago || ''
            ]);

            autoTable(doc, {
                head: [['ID', 'Fecha', 'Destino', 'Detalle', 'Monto', 'Moneda', 'Forma Pago']],
                body: tableData,
                startY: 40,
            });

            doc.save(`egresos_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            alert('Error al exportar a PDF');
        }
    };

    const handlePrint = async () => {
        try {
            // Fetch ALL records for printing with current filters
            const params = new URLSearchParams({
                page: '1',
                limit: '9999'
            });
            if (startDate && endDate) {
                params.append('startDate', startDate);
                params.append('endDate', endDate);
            }
            if (debouncedSearchTerm) {
                params.append('search', debouncedSearchTerm);
            }

            const response = await api.get<PaginatedResponse>(`/egresos?${params}`);
            const allEgresos = response.data.data || [];
            const totals = response.data.totals || {};

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
                day: 'numeric'
            });

            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Reporte de Egresos</title>
                    <style>
                        @page {
                            size: A4;
                            margin: 2cm 1.5cm 3cm 1.5cm;
                        }
                        
                        body {
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 0;
                            padding-bottom: 60px;
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
                        
                        .filter-info {
                            margin-bottom: 15px;
                            font-size: 11px;
                            color: #666;
                        }
                        
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 20px;
                            font-size: 10px;
                        }
                        
                        th {
                            background-color: #3498db;
                            color: white;
                            padding: 8px 6px;
                            text-align: left;
                            font-weight: bold;
                            border: 1px solid #2980b9;
                        }
                        
                        td {
                            padding: 6px;
                            border: 1px solid #ddd;
                        }
                        
                        tr:nth-child(even) {
                            background-color: #f8f9fa;
                        }

                        /* Totals Section Styles */
                        .totals-container {
                            margin-top: 30px;
                            page-break-inside: avoid;
                        }

                        .totals-title {
                            font-size: 14px;
                            font-weight: bold;
                            color: #2c3e50;
                            margin-bottom: 10px;
                            border-bottom: 1px solid #eee;
                            padding-bottom: 5px;
                        }

                        .totals-grid {
                            display: flex;
                            flex-wrap: wrap;
                            gap: 15px;
                        }

                        .total-card {
                            border: 1px solid #ddd;
                            border-radius: 4px;
                            padding: 10px;
                            min-width: 120px;
                            background-color: #f9f9f9;
                        }

                        .total-header {
                            font-weight: bold;
                            font-size: 11px;
                            color: #555;
                            margin-bottom: 5px;
                            text-transform: capitalize;
                            border-bottom: 1px solid #eee;
                            padding-bottom: 3px;
                        }

                        .total-row {
                            display: flex;
                            justify-content: space-between;
                            font-size: 11px;
                            margin-bottom: 2px;
                        }
                        
                        .footer {
                            position: fixed;
                            bottom: 0;
                            left: 0;
                            right: 0;
                            padding: 10px 1.5cm;
                            background: white;
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
                        <h1>Reporte de Egresos</h1>
                    </div>
                    
                    ${startDate && endDate ? `<div class="filter-info">Rango: ${startDate} al ${endDate}</div>` : ''}
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Destino</th>
                                <th>Detalle</th>
                                <th>Monto</th>
                                <th>Moneda</th>
                                <th>Forma Pago</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${allEgresos.map((egreso: Egreso) => `
                                <tr>
                                    <td>${formatDate(egreso.fecha)}</td>
                                    <td>${egreso.destino}</td>
                                    <td>${egreso.detalle}</td>
                                    <td>${egreso.monto}</td>
                                    <td>${egreso.moneda}</td>
                                    <td>${egreso.formaPago?.forma_pago || 'N/A'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="totals-container">
                        <div class="totals-title">Totales por Forma de Pago</div>
                        <div class="totals-grid">
                            ${Object.entries(totals).map(([key, value]) => `
                                <div class="total-card">
                                    <div class="total-header">
                                        ${key === 'Efectivo' ? '💵 ' :
                    key === 'Depósito' ? '🏦 ' :
                        key === 'Transferencia' ? '🏦 ' :
                            key === 'QR' ? '📱 ' : '💰 '} ${key}
                                    </div>
                                    <div class="total-row">
                                        <span>Bs:</span> <span>${value.bolivianos.toFixed(2)}</span>
                                    </div>
                                    <div class="total-row">
                                        <span>$us:</span> <span>${value.dolares.toFixed(2)}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="footer">
                        <div class="footer-line"></div>
                        <div class="footer-content">
                            <div class="footer-info">
                                <div>Fecha de impresión: ${printDate}</div>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;

            doc.open();
            doc.write(printContent);
            doc.close();

            // Wait for images to load (like logo) before printing
            const logo = doc.querySelector('img');

            const doPrint = () => {
                try {
                    iframe.contentWindow?.focus();
                    iframe.contentWindow?.print();
                } catch (e) {
                    console.error('Print error:', e);
                } finally {
                    // Remove iframe after sufficient time
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
            alert('Error al generar el documento de impresión');
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 p-4">
            {/* Main Content */}
            <div className="flex-1 content-card dark:bg-gray-800 rounded-xl max-w-full overflow-hidden">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-center mb-6 no-print gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-2xl shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
                                Lista de Egresos
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                                Control y registro de salidas de dinero, compras y gastos varios
                                {startDate && startDate === endDate ? (
                                    <span className="text-blue-600 dark:text-blue-400 font-bold ml-1">
                                        (Del {formatDate(startDate)})
                                    </span>
                                ) : startDate ? (
                                    <span className="text-gray-600 dark:text-gray-300 ml-1">
                                        (Desde: {formatDate(startDate)} {endDate ? `- Hasta: ${formatDate(endDate)}` : ''})
                                    </span>
                                ) : ''}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center lg:justify-end">
                        <button
                            onClick={() => setShowManual(true)}
                            className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            title="Ayuda / Manual"
                        >
                            ?
                        </button>
                        <button
                            onClick={exportToExcel}
                            className="bg-[#28a745] hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all transform hover:-translate-y-0.5"
                            title="Exportar a Excel"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg> Excel
                        </button>
                        <button
                            onClick={exportToPDF}
                            className="bg-[#dc3545] hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all transform hover:-translate-y-0.5"
                            title="Exportar a PDF"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg> PDF
                        </button>
                        <button
                            onClick={handlePrint}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all transform hover:-translate-y-0.5"
                            title="Imprimir"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg> Imprimir
                        </button>
                        <button
                            onClick={() => {
                                setSelectedEgresoId(null);
                                setIsFormOpen(true);
                            }}
                            className="bg-[#3498db] hover:bg-blue-600 text-white font-semibold py-2 px-5 rounded-xl flex items-center gap-2 text-sm shadow-md transition-all transform hover:-translate-y-0.5"
                        >
                            <span className="text-xl">+</span> Nuevo Egreso
                        </button>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 no-print">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex-grow min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buscar por Detalle:</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Escribe para buscar..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-300"
                                />
                                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                </svg>
                            </div>
                        </div>
                        {/* Manual Date Override Inputs */}
                        <div className="w-full md:w-auto">
                            <div className="flex gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Desde:</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Hasta:</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white bg-white dark:bg-gray-700 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {(startDate || endDate || searchTerm) && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg h-[38px] text-sm shadow-md transition-all transform hover:-translate-y-0.5"
                            >
                                Hoy
                            </button>
                        )}
                    </div>
                </div>

                <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    Mostrando {total === 0 ? 0 : (currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, total)} de {total} registros
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Destino</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Detalle</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monto</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Moneda</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Forma Pago</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {egresos.length > 0 ? (
                                egresos.map((egreso, index) => (
                                    <tr key={egreso.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="p-3 text-gray-700 dark:text-gray-300">{(currentPage - 1) * limit + index + 1}</td>
                                        <td className="p-3 text-gray-700 dark:text-gray-300">{formatDate(egreso.fecha)}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-sm font-medium ${egreso.destino === 'Consultorio'
                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                }`}>
                                                {egreso.destino}
                                            </span>
                                        </td>
                                        <td className="p-3 text-gray-700 dark:text-gray-300">{egreso.detalle}</td>
                                        <td className="p-3 font-bold text-gray-800 dark:text-gray-200">{formatCurrency(egreso.monto)}</td>
                                        <td className="p-3 text-gray-700 dark:text-gray-300">{egreso.moneda}</td>
                                        <td className="p-3 text-gray-700 dark:text-gray-300">
                                            {egreso.formaPago?.forma_pago || 'N/A'}
                                        </td>
                                        <td className="p-3 flex items-center gap-1.5 whitespace-nowrap">
                                            {egreso.reciboId || egreso.recibo ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handlePrintRecibo(egreso.recibo || { id: egreso.reciboId, fecha: egreso.fecha, nombre: egreso.destino, concepto: egreso.detalle, monto: egreso.monto, moneda: egreso.moneda })}
                                                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                                                    title={`Imprimir Recibo N° ${egreso.recibo?.accessId || egreso.recibo?.id || egreso.reciboId || ''}`}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                    </svg>
                                                    <span>Imprimir Recibo</span>
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleGenerarRecibo(egreso)}
                                                    className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                                                    title="Generar Recibo de Egreso"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <span>Generar Recibo</span>
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedEgresoId(egreso.id);
                                                    setIsFormOpen(true);
                                                }}
                                                className="p-2 bg-amber-400 hover:bg-amber-500 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 cursor-pointer"
                                                title="Editar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(egreso.id)}
                                                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 cursor-pointer"
                                                title="Eliminar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        No hay egresos registrados para esta fecha o criterios de búsqueda.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Totals Section */}
                <div className="mt-5 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="mb-2 text-base font-semibold text-gray-800 dark:text-gray-200">Totales por Forma de Pago (Según filtros)</h3>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
                        {Object.entries(totals)
                            .filter(([_, value]) => (value.bolivianos > 0 || value.dolares > 0))
                            .map(([key, value]) => (
                                <div key={key} className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600 shadow-sm">
                                    <div className="font-bold mb-2 text-gray-600 dark:text-gray-300 capitalize flex items-center gap-2">
                                        <span>
                                            {key === 'Efectivo' ? '💵 ' :
                                                key === 'Depósito' ? '🏦 ' :
                                                    key === 'Transferencia' ? '🏦 ' :
                                                        key === 'QR' ? '📱 ' :
                                                            key === 'Debito' ? '💳 ' : '💰 '}
                                        </span>
                                        {key}
                                    </div>
                                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                        <span>Bs:</span> <span>{formatCurrency(value.bolivianos)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                        <span>$us:</span> <span>{formatCurrency(value.dolares)}</span>
                                    </div>
                                </div>
                            ))}
                        {Object.entries(totals).filter(([_, value]) => (value.bolivianos > 0 || value.dolares > 0)).length === 0 && (
                            <div className="text-gray-500 dark:text-gray-400 italic">No hay totales registrados para esta fecha o periodo.</div>
                        )}
                    </div>
                </div>

                {/* Pagination Controls */}
                {
                    totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    )
                }
                {/* EgresoForm Modal */}
                <EgresoForm
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    id={selectedEgresoId}
                    onSaveSuccess={() => {
                        fetchEgresos();
                        setIsFormOpen(false);
                    }}
                />

                {/* Manual Modal */}
                <ManualModal
                    isOpen={showManual}
                    onClose={() => setShowManual(false)}
                    title="Manual de Usuario - Egresos"
                    sections={manualSections}
                />
            </div >

            {/* Sidebar Calendar */}
            <div className="w-full md:w-[350px] flex-shrink-0 flex flex-col gap-5">
                <div className="bg-white dark:bg-gray-800 p-2.5 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 calendar-wrapper">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-white mb-4 text-center py-2">Seleccionar Fecha</h3>
                    <Calendar
                        onChange={handleCalendarChange}
                        value={calendarValue}
                        locale="es-ES"
                        className="dark:bg-gray-800 dark:text-white dark:border-gray-700 w-full"
                        tileClassName={({ date, view }) => {
                            // Check if date matches currently selected start date
                            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                            if (view === 'month' && dateStr === startDate) {
                                return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full font-bold';
                            }
                            return 'hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full';
                        }}
                    />
                </div>
            </div>

            <style>{`
                /* Base Calendar Styles */
                .calendar-wrapper .react-calendar { 
                    border: none; 
                    font-family: inherit;
                    width: 100%;
                    background-color: transparent;
                }
                
                /* Navigation (Month/Year) */
                .calendar-wrapper .react-calendar__navigation button {
                    min-width: 44px;
                    background: none;
                    color: #374151; /* gray-700 */
                }
                
                .calendar-wrapper .react-calendar__navigation__label {
                    font-weight: bold;
                    font-size: 1rem;
                }
                
                .calendar-wrapper .react-calendar__navigation button:enabled:hover,
                .calendar-wrapper .react-calendar__navigation button:enabled:focus {
                    background-color: #f3f4f6;
                }
                
                /* Weekday headers (Lu, Ma, Mi...) */
                .calendar-wrapper .react-calendar__month-view__weekdays {
                    text-align: center;
                    text-transform: uppercase;
                    font-weight: bold;
                    font-size: 0.75em;
                    color: #6b7280; /* gray-500 */
                    margin-bottom: 0.5rem;
                }
                
                .calendar-wrapper .react-calendar__month-view__weekdays__weekday {
                     text-decoration: none; 
                }

                /* Day Tiles */
                .calendar-wrapper .react-calendar__tile {
                    color: #374151; /* gray-700 - Explicitly set dark color for days */
                    font-weight: 500;
                    padding: 0.75em 0.5em;
                }

                .calendar-wrapper .react-calendar__month-view__days__day--neighboringMonth {
                    color: #9ca3af !important; /* gray-400 */
                }

                .calendar-wrapper .react-calendar__month-view__days__day--weekend {
                    color: #ef4444; /* red-500 */
                }

                /* Dark Mode Overrides */
                .dark .calendar-wrapper .react-calendar {
                    color: white;
                }
                
                .dark .calendar-wrapper .react-calendar__navigation button {
                    color: #f3f4f6; /* gray-100 */
                }

                .dark .calendar-wrapper .react-calendar__navigation button:enabled:hover,
                .dark .calendar-wrapper .react-calendar__navigation button:enabled:focus {
                    background-color: #374151;
                }
                
                .dark .calendar-wrapper .react-calendar__month-view__weekdays {
                    color: #9ca3af; /* gray-400 */
                }
                
                .dark .calendar-wrapper .react-calendar__tile {
                    color: #e5e7eb; /* gray-200 */
                }
                
                .dark .calendar-wrapper .react-calendar__month-view__days__day--weekend {
                    color: #f87171; /* red-400 */
                }
                
                .dark .calendar-wrapper .react-calendar__month-view__days__day--neighboringMonth {
                    color: #4b5563 !important; /* gray-600 */
                }

                .dark .calendar-wrapper .react-calendar__tile:enabled:hover,
                .dark .calendar-wrapper .react-calendar__tile:enabled:focus {
                    background-color: #374151;
                }
                
                /* Active/Selected State Overrides (Specific) */
                .calendar-wrapper .react-calendar__tile.bg-blue-100 {
                    color: #1e40af !important; /* blue-800 */
                    background-color: #dbeafe !important;
                }
                .dark .calendar-wrapper .react-calendar__tile.dark\\:bg-blue-900 {
                    background-color: #1e3a8a !important; /* blue-900 */
                    color: #bfdbfe !important; /* blue-200 */
                }
            `}</style>
        </div>
    );
};

export default EgresoList;
