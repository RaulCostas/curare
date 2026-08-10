import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatDate, formatLongDate, formatNumberBs } from '../utils/dateUtils';
import type { PagosPedidos } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Pagination from './Pagination';
import Swal from 'sweetalert2';
import ManualModal, { type ManualSection } from './ManualModal';
import PagosPedidosPrintModal from './PagosPedidosPrintModal';
import autoTable from 'jspdf-autotable';
import PagosPedidosForm from './PagosPedidosForm';

const PagosPedidosList: React.FC = () => {
    const [pagos, setPagos] = useState<PagosPedidos[]>([]);
    const [loading, setLoading] = useState(true);
    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Pagos de Pedidos',
            content: 'Gestión de pagos a proveedores por pedidos de insumos/inventario realizados.'
        },
        {
            title: 'Nuevo Pago',
            content: 'Use el botón azul "+ Nuevo Pago". Debe seleccionar el Pedido realizado al Proveedor.'
        },
        {
            title: 'Documentación',
            content: 'Es importante registrar el número de Factura y Recibo del proveedor para el control contable.'
        }
    ];

    // Search & Pagination State
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const [showingPrintModal, setShowingPrintModal] = useState(false);
    const [modalMode, setModalMode] = useState<'print' | 'export'>('print');

    // Modal state for PagosPedidosForm
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedPagoPedidoId, setSelectedPagoPedidoId] = useState<number | null>(null);

    useEffect(() => {
        fetchPagos();
    }, []);

    const fetchPagos = async () => {
        try {
            const response = await api.get<PagosPedidos[]>('/pagos-pedidos');
            // Sort by latest first
            const sorted = response.data.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
            setPagos(sorted);
        } catch (error) {
            console.error('Error fetching pagos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Está seguro de eliminar este pago?',
            text: 'El pedido volverá a estado "Pendiente".',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/pagos-pedidos/${id}`);
                fetchPagos();
                Swal.fire(
                    'Eliminado!',
                    'El pago ha sido eliminado.',
                    'success'
                );
            } catch (error) {
                console.error('Error deleting pago:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al eliminar pago'
                });
            }
        }
    };

    // Filter Logic
    const filteredPagos = pagos.filter(p => {
        const matchesProvider = p.pedido?.proveedor?.proveedor?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesProvider;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredPagos.length / itemsPerPage);
    const currentPagos = filteredPagos.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Export & Print
    const exportToExcel = () => {
        const data = filteredPagos.map(p => ({
            Fecha: p.fecha,
            Pedido: p.pedido?.id || p.idPedido,
            Proveedor: p.pedido?.proveedor?.proveedor || '',
            Monto: p.monto,
            Factura: p.factura,
            Recibo: p.recibo,
            FormaPago: p.forma_pago
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'PagosPedidos');
        XLSX.writeFile(wb, 'pagos_pedidos.xlsx');
    };

    const handleExportClick = () => {
        setModalMode('export');
        setShowingPrintModal(true);
    };

    const handlePrintClick = () => {
        setModalMode('print');
        setShowingPrintModal(true);
    };

    const handleModalConfirm = (filteredProvider: string | null) => {
        if (modalMode === 'print') {
            handlePrint(filteredProvider);
        } else {
            exportToPDF(filteredProvider);
        }
    };

    const exportToPDF = async (filteredProvider: string | null) => {
        let exportPagos = filteredPagos;
        if (filteredProvider) {
            exportPagos = pagos.filter(p => p.pedido?.proveedor?.proveedor === filteredProvider);
        }

        try {
            const doc = new jsPDF();

            // Add logo
            try {
                const logo = await new Promise<HTMLImageElement>((resolve, reject) => {
                    const img = new Image();
                    img.src = '/logo-curare.png';
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                });
                doc.addImage(logo, 'PNG', 15, 10, 40, 16);
            } catch (error) {
                console.warn('Could not load logo', error);
            }

            const headerTitle = 'LISTA DE PAGOS DE PEDIDOS';
            const pageWidth = doc.internal.pageSize.width;

            // Title next to logo
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.setTextColor(44, 62, 80); // #2c3e50
            doc.text(headerTitle, 60, 20);

            // Blue line under header
            doc.setDrawColor(52, 152, 219); // #3498db
            doc.setLineWidth(0.5);
            doc.line(15, 28, pageWidth - 15, 28);

            let currentY = 35;

            // Provider subtitle box (if specific provider selected)
            if (filteredProvider) {
                doc.setFillColor(236, 240, 241); // #ecf0f1
                doc.rect(15, currentY, pageWidth - 30, 10, 'F');

                // Blue left border
                doc.setFillColor(52, 152, 219); // #3498db
                doc.rect(15, currentY, 1, 10, 'F');

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.setTextColor(44, 62, 80);
                doc.text(`Proveedor: ${filteredProvider}`, 20, currentY + 6.5);

                currentY += 15;
            }

            const tableData = exportPagos.map(p => [
                formatDate(p.fecha),
                p.pedido?.proveedor?.proveedor || '',
                p.monto,
                p.factura || '',
                p.recibo || '',
                p.forma_pago || ''
            ]);

            autoTable(doc, {
                head: [['Fecha', 'Proveedor', 'Monto', 'Factura', 'Recibo', 'Forma Pago']],
                body: tableData,
                startY: currentY,
                theme: 'plain',
                margin: { left: 15, right: 15 },
                styles: {
                    fontSize: 9,
                    cellPadding: 3,
                    lineColor: [221, 221, 221],
                    lineWidth: 0.1,
                },
                headStyles: {
                    fillColor: [52, 152, 219], // #3498db
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    halign: 'left',
                    lineWidth: 0.1,
                    lineColor: [41, 128, 185],
                },
                alternateRowStyles: {
                    fillColor: [248, 249, 250] // #f8f9fa
                },
            });

            // Footer
            const pageHeight = doc.internal.pageSize.height;
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.1);
            doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);

            const dateStr = new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            doc.setFontSize(8);
            doc.setTextColor(102, 102, 102);
            doc.text('Fecha de impresión: ' + dateStr, pageWidth / 2, pageHeight - 10, { align: 'center' });

            doc.save(`pagos_pedidos_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Error exporting PDF:', error);
        }
    };

    const handlePrintRecibo = (pago: PagosPedidos) => {
        try {
            const doc = new jsPDF();

            const drawReceipt = (startY: number, title: string) => {
                // Border for the receipt
                doc.setDrawColor(200);
                doc.rect(10, startY, 190, 135);

                // Header without background
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(22);
                doc.setFont('helvetica', 'bold');
                doc.text('RECIBO DE PAGO', 105, startY + 15, { align: 'center' });

                doc.setFontSize(14);
                doc.setTextColor(100);
                doc.text(title, 190, startY + 15, { align: 'right' }); // ORIGINAL / COPIA

                // Info Container
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(12);
                doc.setFont('helvetica', 'normal');

                const contentStartY = startY + 40;
                const lineHeight = 10;

                // Data
                doc.setFont('helvetica', 'bold');
                doc.text('Fecha de Pago:', 20, contentStartY);
                doc.setFont('helvetica', 'normal');
                // Handle potential string date or Date object
                const fechaStr = pago.fecha ? formatLongDate(pago.fecha) : '';
                doc.text(fechaStr, 70, contentStartY);

                doc.setFont('helvetica', 'bold');
                doc.text('Proveedor:', 20, contentStartY + lineHeight);
                doc.setFont('helvetica', 'normal');
                doc.text(pago.pedido?.proveedor?.proveedor || 'N/A', 70, contentStartY + lineHeight);

                doc.setFont('helvetica', 'bold');
                doc.text('Monto:', 20, contentStartY + lineHeight * 2);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(14);
                doc.text(`${formatNumberBs(pago.monto)} BS`, 70, contentStartY + lineHeight * 2);
                doc.setFontSize(12);

                doc.setFont('helvetica', 'bold');
                doc.text('Forma de Pago:', 20, contentStartY + lineHeight * 3);
                doc.setFont('helvetica', 'normal');
                doc.text(pago.forma_pago || 'N/A', 70, contentStartY + lineHeight * 3);

                // Combine Factura and Recibo as observations or additional info
                let detalles = '';
                if (pago.factura) detalles += `Factura: ${pago.factura} `;
                if (pago.recibo) detalles += `Recibo Ext: ${pago.recibo}`;

                if (detalles) {
                    doc.setFont('helvetica', 'bold');
                    doc.text('Referencias:', 20, contentStartY + lineHeight * 4);
                    doc.setFont('helvetica', 'normal');
                    doc.text(detalles, 70, contentStartY + lineHeight * 4);
                }

                // Footer / Signature Area
                doc.setDrawColor(150);
                const sigY = startY + 115;
                doc.line(25, sigY, 85, sigY);
                doc.line(125, sigY, 185, sigY);

                doc.setFontSize(10);
                doc.text('Firma Responsable', 55, sigY + 5, { align: 'center' });
                doc.text('Firma Receptor', 155, sigY + 5, { align: 'center' });
            };

            // Draw Original (Top half)
            drawReceipt(10, 'ORIGINAL');

            // Cutting line
            doc.setDrawColor(200);
            (doc as any).setLineDash([5, 5], 0);
            doc.line(0, 148, 210, 148);
            (doc as any).setLineDash([], 0); // Reset dash

            // Draw Copy (Bottom half)
            drawReceipt(158, 'COPIA');

            // Footer text
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('Comprobante generado automáticamente por el sistema CURARE', 105, 290, { align: 'center' });

            // Auto print and open
            doc.autoPrint();
            window.open(doc.output('bloburl'), '_blank');
        } catch (error) {
            console.error('Error creating receipt:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al generar el recibo'
            });
        }
    };

    const handlePrint = (filteredProvider: string | null) => {
        let printPagos = filteredPagos;
        if (filteredProvider) {
            printPagos = pagos.filter(p => p.pedido?.proveedor?.proveedor === filteredProvider);
        }

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
                <title>Lista de Pagos de Pedidos</title>
                <style>
                    @page {
                        size: A4;
                        margin: 2cm 1.5cm 3cm 1.5cm;
                    }
                    
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 0;
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

                    .lab-subtitle {
                        margin-top: 10px;
                        padding: 8px 15px;
                        background-color: #ecf0f1;
                        border-left: 4px solid #3498db;
                        font-size: 14px;
                        font-weight: bold;
                        color: #2c3e50;
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                        font-size: 11px;
                    }
                    
                    th {
                        background-color: #3498db;
                        color: white;
                        padding: 10px 8px;
                        text-align: left;
                        font-weight: bold;
                        border: 1px solid #2980b9;
                    }
                    
                    td {
                        padding: 8px;
                        border: 1px solid #ddd;
                    }
                    
                    tr:nth-child(even) {
                        background-color: #f8f9fa;
                    }
                    
                    .footer {
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        padding: 10px 0;
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
                    <h1>LISTA DE PAGOS DE PEDIDOS</h1>
                </div>
                ${filteredProvider ? `<div class="lab-subtitle">Proveedor: ${filteredProvider}</div>` : ''}
                
                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Proveedor</th>
                            <th>Monto</th>
                            <th>Factura</th>
                            <th>Recibo</th>
                            <th>Forma Pago</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${printPagos.map((p) => `
                            <tr>
                                <td>${formatDate(p.fecha)}</td>
                                <td>${p.pedido?.proveedor?.proveedor || ''}</td>
                                <td>${p.monto}</td>
                                <td>${p.factura || '-'}</td>
                                <td>${p.recibo || '-'}</td>
                                <td>${p.forma_pago}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

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

    if (loading) return <div className="text-center p-4">Cargando...</div>;

    return (
        <div className="content-card">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
                            Pagos de Pedidos
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                            Control de abonos, saldos pendientes y pagos a proveedores
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowManual(true)}
                        className="w-[30px] h-[30px] flex items-center justify-center bg-[#f1f1f1] dark:bg-gray-700 border border-[#ddd] dark:border-gray-600 rounded-full text-[#555] dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>
                    <button onClick={exportToExcel} className="bg-[#28a745] hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all transform hover:-translate-y-0.5" title="Exportar a Excel">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg> Excel
                    </button>
                    <button onClick={handleExportClick} className="bg-[#dc3545] hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all transform hover:-translate-y-0.5" title="Exportar a PDF">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg> PDF
                    </button>
                    <button onClick={handlePrintClick} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all transform hover:-translate-y-0.5" title="Imprimir">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg> Imprimir
                    </button>
                    <button
                        onClick={() => {
                            setSelectedPagoPedidoId(null);
                            setIsFormOpen(true);
                        }}
                        className="bg-[#3498db] hover:bg-blue-600 text-white font-semibold py-2 px-5 rounded-xl flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 text-sm"
                    >
                        <span className="text-xl">+</span> Nuevo Pago
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="relative flex-grow max-w-md">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar por Proveedor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                </div>
                {(searchTerm) && (
                    <button
                        onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
                    >
                        Limpiar
                    </button>
                )}
            </div>

            <div className="mb-2 text-gray-600 dark:text-gray-400 text-sm">
                Mostrando {filteredPagos.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredPagos.length)} de {filteredPagos.length} registros
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Proveedor</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monto</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Factura</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Recibo</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Forma Pago</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {currentPagos.map((pago, index) => (
                            <tr key={pago.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="p-3 text-gray-800 dark:text-gray-300">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                <td className="p-3 text-gray-800 dark:text-gray-300">{formatDate(pago.fecha)}</td>
                                <td className="p-3 text-gray-800 dark:text-gray-300">{pago.pedido?.proveedor?.proveedor}</td>
                                <td className="p-3 font-semibold text-gray-800 dark:text-gray-300">{pago.monto}</td>
                                <td className="p-3 text-gray-800 dark:text-gray-300">{pago.factura || '-'}</td>
                                <td className="p-3 text-gray-800 dark:text-gray-300">{pago.recibo || '-'}</td>
                                <td className="p-3">
                                    <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-sm">
                                        {pago.forma_pago}
                                    </span>
                                </td>
                                <td className="p-3 flex gap-2">
                                    <button
                                        onClick={() => handlePrintRecibo(pago)}
                                        className="bg-[#3498db] hover:bg-blue-600 text-white font-bold p-2 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
                                        title="Imprimir Recibo"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedPagoPedidoId(pago.id);
                                            setIsFormOpen(true);
                                        }}
                                        className="bg-[#ffc107] hover:bg-yellow-600 text-white font-bold p-2 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
                                        title="Editar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(pago.id)}
                                        className="bg-[#dc3545] hover:bg-red-700 text-white font-bold p-2 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
                                        title="Eliminar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />
            {/* PagosPedidosForm Modal */}
            <PagosPedidosForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                id={selectedPagoPedidoId}
                onSaveSuccess={() => {
                    fetchPagos();
                    setIsFormOpen(false);
                }}
            />

            {/* Manual Modal */}
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Pagos de Pedidos"
                sections={manualSections}
            />

            {/* Print Filter Modal */}
            <PagosPedidosPrintModal
                isOpen={showingPrintModal}
                onClose={() => setShowingPrintModal(false)}
                onConfirm={handleModalConfirm}
                pagos={pagos}
                mode={modalMode}
            />
        </div>
    );
};

export default PagosPedidosList;
