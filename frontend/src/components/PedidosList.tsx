import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { Pedidos } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';
import ManualModal, { type ManualSection } from './ManualModal';
import PedidosPrintModal from './PedidosPrintModal';
import PedidoViewModal from './PedidoViewModal';
import PedidosForm from './PedidosForm';
import PagosPedidosForm from './PagosPedidosForm';
import Pagination from './Pagination';
import { formatDate, formatNumberBs } from '../utils/dateUtils';

const PedidosList: React.FC = () => {
    const navigate = useNavigate();
    const [pedidos, setPedidos] = useState<Pedidos[]>([]);
    const [loading, setLoading] = useState(true);
    const [showManual, setShowManual] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [showingPrintModal, setShowingPrintModal] = useState(false);
    const [modalMode, setModalMode] = useState<'print' | 'export'>('print');
    const [selectedPedidoId, setSelectedPedidoId] = useState<number | null>(null);

    // Pagination & Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modal state for PedidosForm
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedFormPedidoId, setSelectedFormPedidoId] = useState<number | null>(null);

    // Modal state for PagosPedidosForm
    const [isPagoFormOpen, setIsPagoFormOpen] = useState(false);
    const [selectedPagoPedidoId, setSelectedPagoPedidoId] = useState<number | null>(null);

    const manualSections: ManualSection[] = [
        {
            title: 'Pedidos de Inventario',
            content: 'Gestión de pedidos de suministros e insumos a proveedores.'
        },
        {
            title: 'Nuevo Pedido',
            content: 'Al crear un pedido, el sistema actualizará automáticamente el stock de los productos recibidos.'
        },
        {
            title: 'Pagos',
            content: 'Puede registrar pagos parciales o totales de un pedido usando el botón verde "Pagar" (billete).'
        },
        {
            title: 'Eliminación',
            content: 'Si elimina un pedido, el sistema revertirá (restará) el stock agregado por ese pedido.'
        }
    ];

    useEffect(() => {
        fetchPedidos();
    }, []);

    const fetchPedidos = async () => {
        try {
            const response = await api.get<Pedidos[]>('/pedidos');
            const data = Array.isArray(response.data) ? response.data : ((response.data as any).data || []);
            data.sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
            setPedidos(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching pedidos:', error);
            setPedidos([]);
            setLoading(false);
        }
    };

    const handlePagar = (id: number) => {
        setSelectedPagoPedidoId(id);
        setIsPagoFormOpen(true);
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Eliminar pedido?',
            text: "Esta acción eliminará el pedido y revertirá el stock. ¿Está seguro?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/pedidos/${id}`);
                setPedidos(pedidos.filter(p => p.id !== id));
                Swal.fire({
                    icon: 'success',
                    title: '¡Eliminado!',
                    text: 'El pedido ha sido eliminado correctamente.',
                    showConfirmButton: false,
                    timer: 1500
                });
            } catch (error) {
                console.error('Error deleting pedido:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al eliminar el pedido'
                });
            }
        }
    };

    const exportToExcel = () => {
        try {
            const excelData = pedidos.map(p => ({
                'ID': p.id,
                'Fecha': formatDate(p.fecha),
                'Proveedor': p.proveedor?.proveedor || '',
                'Sub Total': p.Sub_Total,
                'Descuento': p.Descuento,
                'Total': p.Total,
                'Observaciones': p.Observaciones,
                'Pagado': p.Pagado ? 'SI' : 'NO'
            }));
            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');
            XLSX.writeFile(wb, `pedidos_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            console.error('Error exporting to Excel:', error);
        }
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
        try {
            let exportPedidos = filteredPedidos;
            if (filteredProvider) {
                exportPedidos = pedidos.filter(p => p.proveedor?.proveedor === filteredProvider);
            }

            const doc = new jsPDF();

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

            const dateStr = new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const pageWidth = doc.internal.pageSize.width;

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.setTextColor(44, 62, 80);
            doc.text('LISTA DE PEDIDOS', 60, 20);

            doc.setDrawColor(52, 152, 219);
            doc.setLineWidth(0.5);
            doc.line(15, 28, pageWidth - 15, 28);

            let currentY = 35;

            if (filteredProvider) {
                doc.setFillColor(236, 240, 241);
                doc.rect(15, currentY, pageWidth - 30, 10, 'F');
                doc.setFillColor(52, 152, 219);
                doc.rect(15, currentY, 1, 10, 'F');

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.setTextColor(44, 62, 80);
                doc.text(`Proveedor: ${filteredProvider}`, 20, currentY + 6.5);
                currentY += 15;
            }

            doc.setTextColor(0, 0, 0);

            const tableRows = exportPedidos.map((p, index) => [
                index + 1,
                formatDate(p.fecha),
                p.proveedor?.proveedor || '-',
                `Bs ${formatNumberBs(p.Sub_Total)}`,
                `Bs ${formatNumberBs(p.Descuento)}`,
                `Bs ${formatNumberBs(p.Total)}`,
                p.Pagado ? 'SI' : 'NO'
            ]);

            autoTable(doc, {
                head: [['#', 'Fecha', 'Proveedor', 'Sub Total', 'Descuento', 'Total', 'Pagado']],
                body: tableRows,
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
                    fillColor: [52, 152, 219],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    halign: 'left',
                    lineWidth: 0.1,
                    lineColor: [41, 128, 185],
                },
                alternateRowStyles: {
                    fillColor: [248, 249, 250]
                },
            });

            const pageHeight = doc.internal.pageSize.height;
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.1);
            doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);

            doc.setFontSize(8);
            doc.setTextColor(102, 102, 102);
            doc.text('Fecha de impresión: ' + dateStr, pageWidth / 2, pageHeight - 10, { align: 'center' });

            doc.save(`pedidos_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Error exporting to PDF:', error);
        }
    };

    const handlePrint = (filteredProvider: string | null) => {
        let printPedidos = filteredPedidos;
        if (filteredProvider) {
            printPedidos = pedidos.filter(p => p.proveedor?.proveedor === filteredProvider);
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
                <title>Lista de Pedidos</title>
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
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="/logo-curare.png" alt="Curare Centro Dental">
                    <h1>LISTA DE PEDIDOS</h1>
                </div>
                ${filteredProvider ? `<div class="lab-subtitle">Proveedor: ${filteredProvider}</div>` : ''}
                
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Fecha</th>
                            <th>Proveedor</th>
                            <th>Sub Total</th>
                            <th>Descuento</th>
                            <th>Total</th>
                            <th>Pagado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${printPedidos.map((p, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${formatDate(p.fecha)}</td>
                                <td>${p.proveedor?.proveedor || '-'}</td>
                                <td>${formatNumberBs(p.Sub_Total)}</td>
                                <td>${formatNumberBs(p.Descuento)}</td>
                                <td>${formatNumberBs(p.Total)}</td>
                                <td>${p.Pagado ? 'SI' : 'NO'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="footer">
                    <div class="footer-line"></div>
                    <div class="footer-content">
                        <div>Fecha de impresión: ${printDate}</div>
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

    // Filter & Pagination logic
    const filteredPedidos = pedidos.filter(p =>
        searchTerm === '' ||
        p.proveedor?.proveedor.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredPedidos.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredPedidos.length / itemsPerPage);

    if (loading) return <div className="text-center p-4 text-gray-500 dark:text-gray-400">Cargando...</div>;

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
                            Órdenes de Compra & Pedidos
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                            Gestión de pedidos de suministros e insumos a proveedores
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 flex-wrap">
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
                            setSelectedFormPedidoId(null);
                            setIsFormOpen(true);
                        }}
                        className="bg-[#3498db] hover:bg-blue-600 text-white font-semibold py-2 px-5 rounded-xl flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 text-sm"
                    >
                        <span className="text-xl">+</span> Nuevo Pedido
                    </button>
                </div>
            </div>

            {/* Search Bar & Action Links */}
            <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 flex-grow max-w-md">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Buscar por proveedor..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-gray-400 absolute left-3 top-2.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
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
                <button
                    onClick={() => navigate('/pedidos/deudas')}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 text-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Ver Deudas</span>
                </button>
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium">
                Mostrando {filteredPedidos.length === 0 ? 0 : indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredPedidos.length)} de {filteredPedidos.length} registros
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Proveedor</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sub Total</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Descuento</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total (Bs)</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {currentItems.map((pedido, index) => (
                            <tr key={pedido.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="p-3 text-gray-800 dark:text-gray-300 font-medium">{indexOfFirstItem + index + 1}</td>
                                <td className="p-3 text-gray-800 dark:text-gray-300">{formatDate(pedido.fecha)}</td>
                                <td className="p-3 text-gray-800 dark:text-gray-300 font-semibold">{pedido.proveedor?.proveedor || '-'}</td>
                                <td className="p-3 text-gray-800 dark:text-gray-300">{formatNumberBs(pedido.Sub_Total)}</td>
                                <td className="p-3 text-gray-800 dark:text-gray-300">{formatNumberBs(pedido.Descuento)}</td>
                                <td className="p-3 text-gray-900 dark:text-white font-bold">{formatNumberBs(pedido.Total)}</td>
                                <td className="p-3">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${pedido.Pagado ? 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'}`}>
                                        {pedido.Pagado ? 'PAGADO' : 'PENDIENTE'}
                                    </span>
                                </td>
                                <td className="p-3 flex gap-2">
                                    <button
                                        onClick={() => {
                                            setSelectedPedidoId(pedido.id);
                                            setIsViewModalOpen(true);
                                        }}
                                        className="p-2 bg-[#3498db] text-white rounded-lg hover:bg-blue-600 shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
                                        title="Ver Detalles"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                    </button>

                                    <button
                                        onClick={() => handlePagar(pedido.id)}
                                        disabled={pedido.Pagado}
                                        className={`p-2 text-white rounded-lg flex items-center justify-center ${pedido.Pagado ? 'bg-gray-500 opacity-50 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 cursor-pointer shadow-md transition-all transform hover:-translate-y-0.5'}`}
                                        title={pedido.Pagado ? "Pedido ya pagado" : "Pagar Pedido"}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                            <line x1="1" y1="10" x2="23" y2="10"></line>
                                        </svg>
                                    </button>

                                    {pedido.Pagado ? (
                                        <span
                                            className="p-2 bg-gray-500 text-white rounded-lg opacity-50 cursor-not-allowed flex items-center justify-center"
                                            title="No se puede editar un pedido pagado"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                            </svg>
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setSelectedFormPedidoId(pedido.id);
                                                setIsFormOpen(true);
                                            }}
                                            className="p-2 bg-[#ffc107] text-white rounded-lg hover:bg-yellow-600 shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
                                            title="Editar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                            </svg>
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleDelete(pedido.id)}
                                        disabled={pedido.Pagado}
                                        className={`p-2 text-white rounded-lg flex items-center justify-center ${pedido.Pagado ? 'bg-gray-500 opacity-50 cursor-not-allowed' : 'bg-[#dc3545] hover:bg-red-700 cursor-pointer shadow-md transition-all transform hover:-translate-y-0.5'}`}
                                        title={pedido.Pagado ? "No se puede eliminar un pedido pagado" : "Eliminar"}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredPedidos.length === 0 && (
                <p className="text-center py-6 text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'No se encontraron pedidos con ese proveedor' : 'No hay pedidos registrados'}
                </p>
            )}

            {/* Pagination Component */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

            {/* PedidosForm Drawer */}
            <PedidosForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                id={selectedFormPedidoId}
                onSaveSuccess={() => {
                    fetchPedidos();
                    setIsFormOpen(false);
                }}
            />

            {/* PagosPedidosForm Drawer */}
            <PagosPedidosForm
                isOpen={isPagoFormOpen}
                onClose={() => setIsPagoFormOpen(false)}
                initialPedidoId={selectedPagoPedidoId}
                onSaveSuccess={() => {
                    fetchPedidos();
                    setIsPagoFormOpen(false);
                }}
            />

            {/* Manual Modal */}
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Pedidos"
                sections={manualSections}
            />

            {/* Read Only View Modal */}
            <PedidoViewModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                pedidoId={selectedPedidoId}
            />

            {/* Print Filter Modal */}
            <PedidosPrintModal
                isOpen={showingPrintModal}
                onClose={() => setShowingPrintModal(false)}
                onConfirm={handleModalConfirm}
                pedidos={pedidos}
                mode={modalMode}
            />
        </div>
    );
};

export default PedidosList;
