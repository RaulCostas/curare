import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { formatDate, formatLongDate } from '../utils/dateUtils';
import { formatCurrency } from '../utils/formatters';
import type { GastoFijo, PagoGastoFijo } from '../types';
import PagosGastosFijosForm from './PagosGastosFijosForm';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Pagination from './Pagination';
import ManualModal, { type ManualSection } from './ManualModal';
import GastosFijosForm from './GastosFijosForm';
import Swal from 'sweetalert2';

const getCleanPrintIframe = () => {
    const existing = document.getElementById('curare-print-iframe');
    if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
    }
    const iframe = document.createElement('iframe');
    iframe.id = 'curare-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    return iframe;
};

const GastosFijosList: React.FC = () => {
    const [gastos, setGastos] = useState<GastoFijo[]>([]);
    const [pagos, setPagos] = useState<PagoGastoFijo[]>([]);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [selectedGasto, setSelectedGasto] = useState<GastoFijo | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<PagoGastoFijo | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentsSearchTerm, setPaymentsSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'gastos' | 'pagos'>('gastos');
    const [showManual, setShowManual] = useState(false);

    // Modal state for GastosFijosForm
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedGastoFijoId, setSelectedGastoFijoId] = useState<number | null>(null);

    // Print Modal State
    // Print/Export Modal State
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [printDestino, setPrintDestino] = useState<string>('todos');
    const [printPeriodo, setPrintPeriodo] = useState<string>('todos');
    const [modalMode, setModalMode] = useState<'print' | 'excel' | 'pdf'>('print');
    const [showPagosPrintModal, setShowPagosPrintModal] = useState(false);
    const [printPagoGastoFilter, setPrintPagoGastoFilter] = useState<string>('todos');
    const [pagosModalMode, setPagosModalMode] = useState<'print' | 'excel' | 'pdf'>('print');

    const manualSections: ManualSection[] = [
        {
            title: 'Gastos Fijos',
            content: 'Gestión de gastos recurrentes (Alquiler, Internet, Sueldos, etc). Se pueden configurar como Mensuales o Anuales.'
        },
        {
            title: 'Historial de Pagos',
            content: 'En la pestaña "Historial de Pagos" puede ver todos los pagos realizados a estos gastos fijos con sus respectivos recibos.'
        },
        {
            title: 'Registrar Pago',
            content: 'Para pagar un gasto, use el botón "Pagar" (icono de billete/tarjeta) en la lista de Gastos Fijos. Esto abrirá el formulario de pago.'
        },
        {
            title: 'Dar de Baja y Reactivar',
            content: 'Para gastos activos, el botón rojo (papelera) cambia el estado a "Inactivo". Para gastos inactivos, aparece un botón verde (check) que permite reactivarlos a estado "Activo".'
        },
        {
            title: 'Recibos',
            content: 'En el historial de pagos puede imprimir un recibo detallado para constancia.'
        }
    ];

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [currentPagosPage, setCurrentPagosPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchGastos();
        fetchPagos();
        injectPrintStyles();
    }, []);

    const fetchGastos = async () => {
        try {
            const response = await api.get('/gastos-fijos');
            console.log('Gastos Fijos fetched:', response.data);
            setGastos(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching gastos fijos:', error);
            setGastos([]);
        }
    };

    const fetchPagos = async () => {
        try {
            const response = await api.get('/pagos-gastos-fijos');
            console.log('Pagos fetched:', response.data);
            setPagos(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching pagos gastos fijos:', error);
            setPagos([]);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Dar de baja gasto fijo?',
            text: 'El gasto pasará a estado Inactivo sin eliminar el registro de la base de datos.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, dar de baja',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.patch(`/gastos-fijos/${id}`, { estado: 'inactivo' });
                await Swal.fire({
                    icon: 'success',
                    title: '¡Gasto dado de baja!',
                    text: 'El estado del gasto ha sido cambiado a Inactivo.',
                    showConfirmButton: false,
                    timer: 1500
                });
                fetchGastos();
            } catch (error) {
                console.error('Error al dar de baja gasto:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo dar de baja el gasto'
                });
            }
        }
    };

    const handleReactivate = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Reactivar gasto fijo?',
            text: 'El gasto volverá a estado Activo.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, reactivar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.patch(`/gastos-fijos/${id}`, { estado: 'activo' });
                await Swal.fire({
                    icon: 'success',
                    title: '¡Gasto reactivado!',
                    text: 'El estado del gasto ha sido cambiado a Activo.',
                    showConfirmButton: false,
                    timer: 1500
                });
                fetchGastos();
            } catch (error) {
                console.error('Error al reactivar gasto:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo reactivar el gasto'
                });
            }
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to first page
    };

    const handlePaymentsSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPaymentsSearchTerm(e.target.value);
        setCurrentPagosPage(1); // Reset to first page
    };

    const filteredGastos = gastos.filter(gasto => {
        if (!gasto) return false;
        const gastoName = gasto.gasto_fijo?.toLowerCase() || '';
        const gastoDestino = gasto.destino?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        return gastoName.includes(search) || gastoDestino.includes(search);
    }).sort((a, b) => a.dia - b.dia);
    const totalsByCurrency = filteredGastos.reduce((acc, g) => {
        const currency = g.moneda || 'Bs';
        const destino = g.destino?.toLowerCase() || 'otros';
        const monto = Number(g.monto) || 0;

        if (!acc[currency]) {
            acc[currency] = { consultorio: 0, casa: 0, total: 0 };
        }

        if (destino === 'consultorio') acc[currency].consultorio += monto;
        else if (destino === 'casa') acc[currency].casa += monto;
        acc[currency].total += monto;

        return acc;
    }, {} as Record<string, { consultorio: number; casa: number; total: number }>);

    // Pagination Logic Gastos
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentGastos = filteredGastos.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredGastos.length / itemsPerPage);
    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    const filteredPagos = pagos.filter(pago => {
        const gastoName = pago.gastoFijo?.gasto_fijo?.toLowerCase() || '';
        const fecha = pago.fecha?.toLowerCase() || '';
        const obs = pago.observaciones?.toLowerCase() || '';
        const search = paymentsSearchTerm.toLowerCase();
        return gastoName.includes(search) || fecha.includes(search) || obs.includes(search);
    });

    // Pagination Logic Pagos
    const indexOfLastPago = currentPagosPage * itemsPerPage;
    const indexOfFirstPago = indexOfLastPago - itemsPerPage;
    const currentPagos = filteredPagos.slice(indexOfFirstPago, indexOfLastPago);
    const totalPagosPages = Math.ceil(filteredPagos.length / itemsPerPage);
    const paginatePagos = (pageNumber: number) => setCurrentPagosPage(pageNumber);

    // --- Exports for Gastos Fijos ---
    const exportGastosToExcel = (data: GastoFijo[]) => {
        try {
            const excelData = data.map(gasto => ({
                'Destino': gasto.destino,
                'Día': gasto.dia,
                'Tipo': gasto.anual ? `Anual (${gasto.mes || '-'})` : 'Mensual',
                'Gasto Fijo': gasto.gasto_fijo,
                'Monto': Number(gasto.monto),
                'Moneda': gasto.moneda,
                'Estado': gasto.estado || 'activo'
            }));
            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Gastos Fijos');
            const date = new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `gastos_fijos_${date}.xlsx`);
        } catch (error) {
            console.error('Error exporting Gastos to Excel:', error);
            alert('Error al exportar Gastos a Excel');
        }
    };

    const getBase64ImageFromURL = (url: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.src = url;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    const dataURL = canvas.toDataURL('image/png');
                    resolve(dataURL);
                } else {
                    reject(new Error('Could not get canvas context'));
                }
            };
            img.onerror = (error) => {
                reject(error);
            };
        });
    };

    const exportGastosToPDF = async (data: GastoFijo[]) => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const logoUrl = '/logo-curare.png';

            // Function to add header and footer to each page
            const addHeaderFooter = () => {
                const printDate = new Date().toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });

                // Footer
                doc.setFontSize(8);
                doc.setTextColor(150);
                const footerText = `Fecha de impresión: ${printDate}`;
                doc.text(footerText, pageWidth - 14 - doc.getTextWidth(footerText), doc.internal.pageSize.height - 10);
            };

            // Header Section
            try {
                const logoDataUrl = await getBase64ImageFromURL(window.location.origin + logoUrl);
                doc.addImage(logoDataUrl, 'PNG', 14, 10, 30, 15);
            } catch (e) {
                console.warn('Could not load logo for PDF', e);
            }

            // Header Title - Centered for elegance
            doc.setFontSize(22);
            doc.setTextColor(44, 62, 80); // #2c3e50
            doc.setFont('helvetica', 'bold');
            doc.text('Lista de Gastos Fijos', pageWidth / 2, 22, { align: 'center' });

            // Filter Subtitle / Description (Below logo and title)
            doc.setFontSize(9);
            const filtrosTexto = [];
            if (printDestino !== 'todos') filtrosTexto.push(`DESTINO: ${printDestino.toUpperCase()}`);
            if (printPeriodo !== 'todos') filtrosTexto.push(`PERIODO: ${printPeriodo.toUpperCase()}`);
            const subtitle = filtrosTexto.length > 0 ? filtrosTexto.join('  |  ') : 'REPORTE GENERAL';

            // Elegant box for filter info - Centered or full margin
            doc.setFillColor(248, 249, 250); // Light gray background
            doc.rect(14, 32, pageWidth - 28, 8, 'F');
            doc.setFillColor(52, 152, 219); // Blue accent side
            doc.rect(14, 32, 2, 8, 'F');

            doc.setTextColor(44, 62, 80);
            doc.setFont('helvetica', 'bold');
            doc.text(subtitle, 20, 37.5);

            // Draw blue line separator
            doc.setDrawColor(52, 152, 219); // #3498db
            doc.setLineWidth(0.5);
            doc.line(14, 45, pageWidth - 14, 45);

            const tableData = data.map(gasto => {
                const currencyLabel = (gasto.moneda || '').toLowerCase().includes('dolar') ? '$us' : 'Bs.';
                const formattedMonto = `${formatCurrency(gasto.monto)} ${currencyLabel}`;
                return [
                    gasto.destino || '',
                    gasto.dia ? String(gasto.dia) : '',
                    gasto.anual ? `Anual (${gasto.mes || '-'})` : 'Mensual',
                    gasto.gasto_fijo || '',
                    formattedMonto,
                    gasto.moneda || '',
                    gasto.estado || 'activo'
                ];
            });

            autoTable(doc, {
                head: [['Destino', 'Día', 'Tipo', 'Gasto Fijo', 'Monto', 'Moneda', 'Estado']],
                body: tableData,
                startY: 52,
                styles: { fontSize: 9, cellPadding: 3 },
                headStyles: { fillColor: [52, 152, 219], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [242, 246, 248] }, // #f2f6f8
                didDrawPage: addHeaderFooter,
                margin: { top: 40 }
            });

            // Calculate Totals
            const totals = data.reduce((acc, g) => {
                const currency = g.moneda || 'Bs';
                if (!acc[currency]) acc[currency] = 0;
                acc[currency] += Number(g.monto);
                return acc;
            }, {} as Record<string, number>);

            // Draw Totals
            let currentY = (doc as any).lastAutoTable.finalY + 10;

            // Check if totals fit on page
            if (currentY + 30 > doc.internal.pageSize.height) {
                doc.addPage();
                currentY = 20;
            }

            doc.setFontSize(11);
            doc.setTextColor(44, 62, 80);

            // Draw totals aligned to right
            const startXTotal = pageWidth - 80;

            Object.entries(totals).forEach(([curr, amount]) => {
                // Ensure amount is a number
                const safeAmount = Number(amount) || 0;

                // Box for total
                doc.setFillColor(248, 249, 250); // #f8f9fa
                doc.setDrawColor(221, 221, 221); // #ddd
                doc.rect(startXTotal, currentY, 66, 15, 'FD');

                doc.setFontSize(8);
                doc.setTextColor(127, 140, 141);
                doc.text(`TOTAL ${curr.toUpperCase()}`, startXTotal + 33, currentY + 5, { align: 'center' });

                doc.setFontSize(12);
                doc.setTextColor(44, 62, 80);
                doc.setFont('helvetica', 'bold');
                doc.text(formatCurrency(safeAmount), startXTotal + 33, currentY + 12, { align: 'center' });

                currentY += 20;
            });

            // Use a highly unique filename to prevent collisions
            const now = new Date();
            const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}_${String(now.getMilliseconds()).padStart(3, '0')}`;
            doc.save(`gastos_fijos_${timestamp}.pdf`);
        } catch (error) {
            console.error('Error exporting Gastos to PDF:', error);
            alert('Error al exportar Gastos a PDF');
        }
    };

    // --- Exports for Pagos ---
    const exportPagosToExcel = () => {
        try {
            const excelData = filteredPagos.map(pago => ({
                'Fecha': pago.fecha,
                'Gasto Fijo': pago.gastoFijo?.gasto_fijo || 'N/A',
                'Monto': pago.monto,
                'Moneda': pago.moneda,
                'Forma Pago': pago.formaPago?.forma_pago || 'N/A',
                'Observaciones': pago.observaciones
            }));
            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Pagos Realizados');
            const date = new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `historial_pagos_${date}.xlsx`);
        } catch (error) {
            console.error('Error exporting Pagos to Excel:', error);
            alert('Error al exportar Pagos a Excel');
        }
    };

    const generatePagosPDF = async (data: PagoGastoFijo[], action: 'save' | 'print' = 'save') => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const logoUrl = '/logo-curare.png';

            const addHeaderFooter = () => {
                const printDate = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
                doc.setFontSize(8);
                doc.setTextColor(150);
                const footerText = `Fecha de impresión: ${printDate}`;
                doc.text(footerText, pageWidth - 14 - doc.getTextWidth(footerText), doc.internal.pageSize.height - 10);
            };

            // Header Section
            try {
                const logoDataUrl = await getBase64ImageFromURL(window.location.origin + logoUrl);
                doc.addImage(logoDataUrl, 'PNG', 14, 10, 30, 15);
            } catch (e) {
                console.warn('Logo error', e);
            }

            // Header Title - Centered
            doc.setFontSize(22);
            doc.setTextColor(44, 62, 80);
            doc.setFont('helvetica', 'bold');
            doc.text('Historial de Pagos', pageWidth / 2, 22, { align: 'center' });

            doc.setFontSize(9);
            const subtitle = printPagoGastoFilter !== 'todos' ? `GASTO FIJO: ${printPagoGastoFilter.toUpperCase()}` : 'REPORTE GENERAL';

            // Elegant box for filter info (Below logo and title)
            doc.setFillColor(248, 249, 250); // Light gray background
            doc.rect(14, 34, pageWidth - 28, 8, 'F');
            doc.setFillColor(52, 152, 219); // Blue accent side
            doc.rect(14, 34, 2, 8, 'F');

            doc.setTextColor(44, 62, 80);
            doc.setFont('helvetica', 'bold');
            doc.text(subtitle, 20, 39.5);

            doc.setDrawColor(52, 152, 219);
            doc.setLineWidth(0.5);
            doc.line(14, 46, pageWidth - 14, 46);

            const isSpecificGasto = printPagoGastoFilter !== 'todos';

            const tableHeaders = isSpecificGasto
                ? [['Fecha', 'Monto', 'Forma Pago', 'Observaciones']]
                : [['Fecha', 'Gasto Fijo', 'Monto', 'Forma Pago', 'Observaciones']];

            const tableData = data.map(pago => {
                const currencyLabel = (pago.moneda || '').toLowerCase().includes('dolar') ? '$us' : 'Bs.';
                const formattedMonto = `${formatCurrency(pago.monto)} ${currencyLabel}`;
                return isSpecificGasto
                    ? [
                        formatDate(pago.fecha),
                        formattedMonto,
                        pago.formaPago?.forma_pago || 'N/A',
                        pago.observaciones || ''
                    ]
                    : [
                        formatDate(pago.fecha),
                        pago.gastoFijo?.gasto_fijo || 'N/A',
                        formattedMonto,
                        pago.formaPago?.forma_pago || 'N/A',
                        pago.observaciones || ''
                    ];
            });

            autoTable(doc, {
                head: tableHeaders,
                body: tableData,
                startY: 55,
                styles: { fontSize: 9, cellPadding: 3 },
                headStyles: { fillColor: [52, 152, 219], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [242, 246, 248] },
                didDrawPage: addHeaderFooter,
                margin: { top: 40 }
            });

            // Totals by currency
            const totals = data.reduce((acc, p) => {
                const currency = p.moneda || 'Bs';
                if (!acc[currency]) acc[currency] = 0;
                acc[currency] += Number(p.monto);
                return acc;
            }, {} as Record<string, number>);

            let currentY = (doc as any).lastAutoTable.finalY + 10;
            const startXTotal = pageWidth - 80;

            Object.entries(totals).forEach(([curr, amount]) => {
                const safeAmount = Number(amount) || 0;
                doc.setFillColor(248, 249, 250);
                doc.setDrawColor(221, 221, 221);
                doc.rect(startXTotal, currentY, 66, 15, 'FD');

                doc.setFontSize(8);
                doc.setTextColor(127, 140, 141);
                doc.text(`TOTAL ${curr.toUpperCase()}`, startXTotal + 33, currentY + 5, { align: 'center' });

                doc.setFontSize(12);
                doc.setTextColor(44, 62, 80);
                doc.setFont('helvetica', 'bold');
                doc.text(formatCurrency(safeAmount), startXTotal + 33, currentY + 12, { align: 'center' });
                currentY += 20;
            });

            const now = new Date();
            const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}_${String(now.getMilliseconds()).padStart(3, '0')}`;

            if (action === 'save') {
                doc.save(`historial_pagos_${timestamp}.pdf`);
            } else {
                doc.autoPrint();
                const blobUrl = doc.output('bloburl');
                const iframe = getCleanPrintIframe();
                iframe.src = blobUrl as unknown as string;
                iframe.onload = () => {
                    try {
                        iframe.contentWindow?.focus();
                        iframe.contentWindow?.print();
                    } catch (e) {
                        console.error('Print error:', e);
                    }
                };
            }
        } catch (error) {
            console.error('Error exporting Pagos PDF:', error);
            alert('Error al generar PDF de Pagos');
        }
    };

    const handlePrintRecibo = (pago: PagoGastoFijo) => {
        try {
            const doc = new jsPDF();

            const drawReceipt = (startY: number, title: string) => {
                doc.setDrawColor(200);
                doc.rect(10, startY, 190, 135);

                doc.setTextColor(0, 0, 0);
                doc.setFontSize(22);
                doc.setFont('helvetica', 'bold');
                doc.text('RECIBO DE PAGO', 105, startY + 15, { align: 'center' });

                doc.setFontSize(14);
                doc.setTextColor(100);
                doc.text(title, 190, startY + 15, { align: 'right' });

                doc.setTextColor(0, 0, 0);
                doc.setFontSize(12);
                doc.setFont('helvetica', 'normal');

                const contentStartY = startY + 40;
                const lineHeight = 10;

                doc.setFont('helvetica', 'bold');
                doc.text('Fecha de Pago:', 20, contentStartY);
                doc.setFont('helvetica', 'normal');
                doc.text(formatLongDate(pago.fecha), 70, contentStartY);

                doc.setFont('helvetica', 'bold');
                doc.text('Concepto:', 20, contentStartY + lineHeight);
                doc.setFont('helvetica', 'normal');
                doc.text(pago.gastoFijo?.gasto_fijo || 'N/A', 70, contentStartY + lineHeight);

                if (pago.gastoFijo?.destino) {
                    doc.setFont('helvetica', 'bold');
                    doc.text('Destino:', 20, contentStartY + lineHeight * 2);
                    doc.setFont('helvetica', 'normal');
                    doc.text(pago.gastoFijo.destino, 70, contentStartY + lineHeight * 2);
                }

                doc.setFont('helvetica', 'bold');
                doc.text('Monto:', 20, contentStartY + lineHeight * 3);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(14);
                doc.text(`${pago.monto} ${pago.moneda}`, 70, contentStartY + lineHeight * 3);
                doc.setFontSize(12);

                doc.setFont('helvetica', 'bold');
                doc.text('Forma de Pago:', 20, contentStartY + lineHeight * 4);
                doc.setFont('helvetica', 'normal');
                doc.text(pago.formaPago?.forma_pago || 'N/A', 70, contentStartY + lineHeight * 4);

                if (pago.observaciones) {
                    doc.setFont('helvetica', 'bold');
                    doc.text('Observaciones:', 20, contentStartY + lineHeight * 5);
                    doc.setFont('helvetica', 'normal');
                    const splitObs = doc.splitTextToSize(pago.observaciones, 110);
                    doc.text(splitObs, 70, contentStartY + lineHeight * 5);
                }

                doc.setDrawColor(150);
                const sigY = startY + 115;
                doc.line(25, sigY, 85, sigY);
                doc.line(125, sigY, 185, sigY);

                doc.setFontSize(10);
                doc.text('Firma Responsable', 55, sigY + 5, { align: 'center' });
                doc.text('Firma Receptor', 155, sigY + 5, { align: 'center' });
            };

            drawReceipt(10, 'ORIGINAL');

            doc.setDrawColor(200);
            (doc as any).setLineDash([5, 5], 0);
            doc.line(0, 148, 210, 148);
            (doc as any).setLineDash([], 0);

            drawReceipt(158, 'COPIA');

            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('Comprobante generado automáticamente por el sistema CURARE', 105, 290, { align: 'center' });

            doc.autoPrint();
            const blobUrl = doc.output('bloburl');
            const iframe = getCleanPrintIframe();
            iframe.src = blobUrl as unknown as string;

            iframe.onload = () => {
                try {
                    iframe.contentWindow?.focus();
                    iframe.contentWindow?.print();
                } catch (e) {
                    console.error('Print error:', e);
                }
            };
        } catch (error) {
            console.error('Error creating receipt:', error);
            alert('Error al generar el recibo');
        }
    };

    const handleOpenPrintModal = (mode: 'print' | 'excel' | 'pdf' = 'print') => {
        setModalMode(mode);
        setShowPrintModal(true);
        setPrintDestino('todos');
        setPrintPeriodo('todos');
    };

    const handleConfirmPrint = async () => {
        try {
            // Filter data based on modal selection
            let dataToPrint = [...filteredGastos];

            if (printDestino !== 'todos') {
                dataToPrint = dataToPrint.filter(g =>
                    g.destino?.toLowerCase() === printDestino.toLowerCase()
                );
            }

            if (printPeriodo !== 'todos') {
                const isAnual = printPeriodo === 'anual';
                dataToPrint = dataToPrint.filter(g =>
                    isAnual ? g.anual : !g.anual
                );
            }

            if (dataToPrint.length === 0) {
                Swal.fire({
                    icon: 'info',
                    title: 'Sin datos',
                    text: 'No hay gastos para exportar/imprimir con los filtros seleccionados',
                    confirmButtonColor: '#3498db'
                });
                return;
            }

            if (modalMode === 'excel') {
                exportGastosToExcel(dataToPrint);
                setShowPrintModal(false);
                return;
            }

            if (modalMode === 'pdf') {
                await exportGastosToPDF(dataToPrint);
                setShowPrintModal(false);
                return;
            }

            // Print Logic
            const printDate = new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // Calculate totals for the report
            const totals = dataToPrint.reduce((acc, g) => {
                const currency = g.moneda || 'Bs';
                if (!acc[currency]) acc[currency] = 0;
                acc[currency] += Number(g.monto);
                return acc;
            }, {} as Record<string, number>);

            // Build filter description
            const filtrosTexto = [];
            if (printDestino !== 'todos') filtrosTexto.push(`Destino: ${printDestino.charAt(0).toUpperCase() + printDestino.slice(1)}`);
            if (printPeriodo !== 'todos') filtrosTexto.push(`Periodo: ${printPeriodo.charAt(0).toUpperCase() + printPeriodo.slice(1)}`);
            const subtitle = filtrosTexto.length > 0 ? filtrosTexto.join(' | ') : 'Reporte General';

            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Reporte de Gastos Fijos</title>
                    <style>
                        @page { size: A4; margin: 2cm; }
                        body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #333; }
                        .header { display: flex; align-items: center; border-bottom: 2px solid #3498db; padding-bottom: 15px; margin-bottom: 20px; }
                        .header img { height: 60px; margin-right: 20px; }
                        h1 { color: #2c3e50; margin: 0; font-size: 24px; }
                        .subtitle { font-size: 14px; color: #7f8c8d; margin-top: 5px; }
                        .filters { background: #f8f9fa; padding: 10px; border-left: 4px solid #3498db; margin-bottom: 20px; font-weight: bold; color: #2c3e50; font-size: 14px; }
                        table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
                        th { background-color: #3498db; color: white; padding: 10px; text-align: left; font-weight: bold; border: 1px solid #2980b9; }
                        td { padding: 8px; border: 1px solid #ddd; }
                        tr:nth-child(even) { background-color: #f2f6f8; }
                        .totals { display: flex; gap: 20px; justify-content: flex-end; margin-top: 20px; border-top: 1px solid #ccc; padding-top: 20px; }
                        .total-card { background: #f8f9fa; padding: 10px 20px; border-radius: 8px; border: 1px solid #ddd; text-align: center; }
                        .total-amount { font-size: 18px; font-weight: bold; color: #2c3e50; display: block; }
                        .total-label { font-size: 12px; color: #7f8c8d; uppercase; letter-spacing: 1px; }
                        .footer { position: fixed; bottom: 0; left: 0; right: 0; padding: 10px 0; border-top: 1px solid #333; font-size: 10px; text-align: right; color: #666; }
                        
                        @media print {
                            th {
                                background-color: #3498db !important;
                                -webkit-print-color-adjust: exact;
                                print-color-adjust: exact;
                            }
                            tr:nth-child(even) {
                                background-color: #f2f6f8 !important;
                                -webkit-print-color-adjust: exact;
                                print-color-adjust: exact;
                            }
                            .filters {
                                background-color: #f8f9fa !important;
                                -webkit-print-color-adjust: exact;
                                print-color-adjust: exact;
                            }
                            .total-card {
                                background-color: #f8f9fa !important;
                                -webkit-print-color-adjust: exact;
                                print-color-adjust: exact;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <img src="/logo-curare.png" alt="Curare Centro Dental">
                        <div>
                            <h1>Lista de Gastos Fijos</h1>
                        </div>
                    </div>

                    ${subtitle ? `<div class="filters">${subtitle}</div>` : ''}

                    <table>
                        <thead>
                            <tr>
                                <th>Destino</th>
                                <th>Día</th>
                                <th>Periodo</th>
                                <th>Concepto</th>
                                <th style="text-align: right;">Monto</th>
                                <th>Moneda</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dataToPrint.map((gasto: GastoFijo) => `
                                <tr>
                                    <td>${gasto.destino || '-'}</td>
                                    <td>${gasto.dia || '-'}</td>
                                    <td>${gasto.anual ? `Anual (${gasto.mes || '-'})` : 'Mensual'}</td>
                                    <td>${gasto.gasto_fijo}</td>
                                    <td style="text-align: right; font-weight: bold;">${formatCurrency(gasto.monto)}</td>
                                    <td>${gasto.moneda}</td>
                                    <td>${gasto.estado || 'Activo'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="totals">
                        ${Object.entries(totals).map(([curr, amount]) => `
                            <div class="total-card">
                                <span class="total-label">Total ${curr}</span>
                                <span class="total-amount">${formatCurrency(amount)}</span>
                            </div>
                        `).join('')}
                    </div>

                    <div class="footer">
                        Fecha de impresión: ${printDate}
                    </div>
                </body>
                </html>
            `;

            const iframe = getCleanPrintIframe();
            const doc = iframe.contentWindow?.document;
            if (!doc) {
                return;
            }

            doc.open();
            doc.write(printContent);
            doc.close();

            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();

            setShowPrintModal(false);
        } catch (error) {
            console.error('Error al imprimir:', error);
            Swal.fire('Error', 'No se pudo generar el documento', 'error');
        }
    };

    const handleOpenPagosPrintModal = (mode: 'print' | 'excel' | 'pdf' = 'print') => {
        setPagosModalMode(mode);
        setPrintPagoGastoFilter('todos');
        setShowPagosPrintModal(true);
    };

    const handleConfirmPagosPrint = async () => {
        let dataToPrint = [...filteredPagos];
        if (printPagoGastoFilter !== 'todos') {
            dataToPrint = dataToPrint.filter(p => p.gastoFijo?.gasto_fijo === printPagoGastoFilter);
        }

        if (dataToPrint.length === 0) {
            Swal.fire({
                icon: 'info',
                title: 'Sin datos',
                text: 'No hay pagos con los filtros seleccionados',
                confirmButtonColor: '#3498db'
            });
            return;
        }

        if (pagosModalMode === 'excel') {
            exportPagosToExcel();
            setShowPagosPrintModal(false);
            return;
        }

        const action = pagosModalMode === 'pdf' ? 'save' : 'print';
        await generatePagosPDF(dataToPrint, action);
        setShowPagosPrintModal(false);
    };

    const injectPrintStyles = () => {
        const styleId = 'gastos-print-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.innerHTML = `
                @media print {
                    .no-print { display: none !important; }
                    body { background-color: white !important; }
                    .print-container { padding: 0 !important; box-shadow: none !important; border: none !important; }
                    table { width: 100% !important; border-collapse: collapse !important; }
                    th, td { border: 1px solid #000 !important; color: black !important; padding: 8px !important; }
                    th { background-color: #f0f0f0 !important; font-weight: bold !important; -webkit-print-color-adjust: exact; }
                }
            `;
            document.head.appendChild(style);
        }
    };

    const handlePagar = (gasto: GastoFijo) => {
        setSelectedGasto(gasto);
        setSelectedPayment(null);
        setShowPaymentForm(true);
    };

    const handleEditPayment = (pago: PagoGastoFijo) => {
        if (pago.gastoFijo) {
            setSelectedGasto(pago.gastoFijo);
            setSelectedPayment(pago);
            setShowPaymentForm(true);
        }
    };

    const handleDeletePayment = async (id: number) => {
        if (window.confirm('¿Está seguro de eliminar este pago?')) {
            try {
                await api.delete(`/pagos-gastos-fijos/${id}`);
                fetchPagos();
            } catch (error) {
                console.error('Error deleting payment:', error);
            }
        }
    };

    const tabStyle = (tab: 'gastos' | 'pagos') => {
        const isActive = activeTab === tab;
        return {
            cursor: 'pointer',
            borderBottom: isActive ? '3px solid #3498db' : '3px solid transparent',

            fontWeight: isActive ? 'bold' : 'normal' as 'bold' | 'normal',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            padding: '10px 20px',
        };
    };

    return (
        <div className="content-card p-6 bg-gray-50 dark:bg-gray-800 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 no-print gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
                            Gastos Fijos
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                            Gestión de egresos recurrentes, servicios y pagos periódicos de la clínica
                        </p>
                    </div>
                </div>
            </div>

            {/* Header and Tabs */}
            {/* New Tabs Navigation matching HistoriaClinica */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-5 bg-white dark:bg-gray-800 rounded-t-lg p-2.5 no-print">
                <div
                    onClick={() => setActiveTab('gastos')}
                    style={tabStyle('gastos')}
                    className={`${activeTab === 'gastos' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'} px-4 py-2 flex items-center gap-2 transition-colors`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                    GASTOS FIJOS
                </div>
                <div
                    onClick={() => setActiveTab('pagos')}
                    style={tabStyle('pagos')}
                    className={`${activeTab === 'pagos' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'} px-4 py-2 flex items-center gap-2 transition-colors`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    HISTORIAL DE PAGOS
                </div>
            </div>

            {/* Content Area */}
            {activeTab === 'gastos' && (
                <>
                    <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 no-print">
                        <div className="flex items-center gap-2 flex-grow max-w-md">
                            <div className="relative flex-grow">
                                <input
                                    type="text"
                                    placeholder="Buscar por gasto o destino..."
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-300"
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

                        {/* Actions Toolbar */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowManual(true)}
                                className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                title="Ayuda / Manual"
                            >
                                ?
                            </button>
                            <button onClick={() => exportGastosToExcel(filteredGastos)} className="bg-[#28a745] hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all transform hover:-translate-y-0.5" title="Exportar a Excel">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg> Excel
                            </button>
                            <button onClick={() => handleOpenPrintModal('pdf')} className="bg-[#dc3545] hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all transform hover:-translate-y-0.5" title="Exportar a PDF">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg> PDF
                            </button>
                            <button onClick={() => handleOpenPrintModal('print')} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all transform hover:-translate-y-0.5" title="Imprimir">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg> Imprimir
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedGastoFijoId(null);
                                    setIsFormOpen(true);
                                }}
                                className="bg-[#3498db] hover:bg-blue-600 text-white font-semibold py-2 px-5 rounded-xl flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 text-sm"
                            >
                                <span className="text-xl">+</span> Nuevo Gasto
                            </button>
                        </div>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium no-print">
                        Mostrando {filteredGastos.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredGastos.length)} de {filteredGastos.length} registros
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 print-container">
                        <div className="hidden print:block text-center mb-6 mt-4">
                            <h1 className="text-2xl font-bold text-gray-800">Lista de Gastos Fijos</h1>
                            <p className="text-sm text-gray-600 mt-2">Fecha de impresión: {new Date().toLocaleDateString()}</p>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Destino</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Día</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Anual/Mes</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Gasto Fijo</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monto</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Moneda</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider no-print">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {currentGastos.map((gasto, index) => (
                                    <tr key={gasto.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="p-3 text-gray-700 dark:text-gray-300">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                        <td className="p-3 text-gray-700 dark:text-gray-300 font-medium">{gasto.destino}</td>
                                        <td className="p-3 text-gray-700 dark:text-gray-300">{gasto.dia}</td>
                                        <td className="p-3 text-gray-700 dark:text-gray-300">
                                            {gasto.anual ? (
                                                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                                    Anual ({gasto.mes})
                                                </span>
                                            ) : (
                                                <span className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                                    Mensual
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3 font-medium text-gray-700 dark:text-gray-300">{gasto.gasto_fijo}</td>
                                        <td className="p-3 font-bold text-gray-800 dark:text-gray-200">{formatCurrency(gasto.monto)}</td>
                                        <td className="p-3 text-gray-700 dark:text-gray-300">{gasto.moneda}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-sm font-medium ${(gasto.estado?.toLowerCase() === 'activo' || !gasto.estado)
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                }`}>
                                                {(gasto.estado || 'activo').charAt(0).toUpperCase() + (gasto.estado || 'activo').slice(1).toLowerCase()}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center no-print">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    className="bg-slate-700 hover:bg-slate-800 text-white font-bold p-2.5 rounded-lg border-none flex items-center justify-center shadow-md transition-all transform hover:-translate-y-0.5"
                                                    onClick={() => handlePagar(gasto)}
                                                    title="Pagar"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedGastoFijoId(gasto.id);
                                                        setIsFormOpen(true);
                                                    }}
                                                    className="bg-amber-400 hover:bg-amber-500 text-white font-bold p-2.5 rounded-lg border-none flex items-center justify-center shadow-md transition-all transform hover:-translate-y-0.5"
                                                    title="Editar"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                    </svg>
                                                </button>
                                                {(gasto.estado?.toLowerCase() === 'activo' || !gasto.estado) ? (
                                                    <button
                                                        onClick={() => handleDelete(gasto.id)}
                                                        className="bg-red-500 hover:bg-red-600 text-white font-bold p-2.5 rounded-lg border-none flex items-center justify-center shadow-md transition-all transform hover:-translate-y-0.5"
                                                        title="Dar de baja"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleReactivate(gasto.id)}
                                                        className="bg-green-600 hover:bg-green-700 text-white font-bold p-2.5 rounded-lg border-none flex items-center justify-center shadow-md transition-all transform hover:-translate-y-0.5"
                                                        title="Reactivar"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredGastos.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                            No se encontraron gastos fijos.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>


                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="no-print">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={paginate}
                            />
                        </div>
                    )}

                    {/* Totals Summary Section (Moved below pagination) */}
                    {Object.keys(totalsByCurrency).length > 0 && (
                        <div className="mt-6 flex flex-col gap-6 no-print">
                            {Object.entries(totalsByCurrency).map(([currency, data]) => (
                                <div key={currency} className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="h-4 w-1 bg-blue-500 rounded-full"></div>
                                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">Resumen en {currency}</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Consultorio ({currency})</span>
                                            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(data.consultorio)} {currency}</span>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Casa ({currency})</span>
                                            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(data.casa)} {currency}</span>
                                        </div>
                                        <div className="bg-[#1e293b] dark:bg-slate-700 p-4 rounded-xl shadow-md flex flex-col items-center justify-center transform hover:scale-105 transition-all duration-300">
                                            <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">Gran Total {currency}</span>
                                            <span className="text-xl font-bold text-white tracking-tight">{formatCurrency(data.total)} {currency}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Pagos Tab Content */}
            {activeTab === 'pagos' && (
                <>
                    <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 no-print">
                        <div className="flex items-center gap-2 flex-grow max-w-md">
                            <div className="relative flex-grow">
                                <input
                                    type="text"
                                    placeholder="Buscar por gasto, fecha, observación..."
                                    value={paymentsSearchTerm}
                                    onChange={handlePaymentsSearch}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-300"
                                />
                                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                </svg>
                            </div>
                            {paymentsSearchTerm && (
                                <button
                                    type="button"
                                    onClick={() => { setPaymentsSearchTerm(''); setCurrentPagosPage(1); }}
                                    className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg shadow-sm transition-all text-xs flex items-center gap-1 shrink-0"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                    <span>Limpiar</span>
                                </button>
                            )}
                        </div>

                        {/* Actions Toolbar */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowManual(true)}
                                className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                title="Ayuda / Manual"
                            >
                                ?
                            </button>
                            <button onClick={() => handleOpenPagosPrintModal('excel')} className="bg-[#28a745] hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all transform hover:-translate-y-0.5" title="Exportar a Excel">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg> Excel
                            </button>
                            <button onClick={() => handleOpenPagosPrintModal('pdf')} className="bg-[#dc3545] hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all transform hover:-translate-y-0.5" title="Exportar a PDF">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg> PDF
                            </button>
                            <button onClick={() => handleOpenPagosPrintModal('print')} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all transform hover:-translate-y-0.5" title="Imprimir">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg> Imprimir
                            </button>
                        </div>
                    </div>

                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium no-print">
                        Mostrando {filteredPagos.length === 0 ? 0 : (currentPagosPage - 1) * itemsPerPage + 1} - {Math.min(currentPagosPage * itemsPerPage, filteredPagos.length)} de {filteredPagos.length} registros
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 print-container">
                        <div className="hidden print:block text-center mb-6 mt-4">
                            <h1 className="text-2xl font-bold text-gray-800">Historial de Pagos Realizados</h1>
                            <p className="text-sm text-gray-600 mt-2">Fecha de impresión: {formatDate(new Date().toISOString())}</p>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Gasto Fijo</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monto</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Moneda</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Forma Pago</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Observaciones</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider no-print">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {currentPagos.map((pago, index) => (
                                    <tr key={pago.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="p-3 text-gray-700 dark:text-gray-300">{(currentPagosPage - 1) * itemsPerPage + index + 1}</td>
                                        <td className="p-3 text-gray-700 dark:text-gray-300 font-medium">{formatDate(pago.fecha)}</td>
                                        <td className="p-3 font-medium text-gray-700 dark:text-gray-300">
                                            {pago.gastoFijo?.gasto_fijo || 'N/A'}
                                        </td>
                                        <td className="p-3 font-bold text-gray-800 dark:text-gray-200">{formatCurrency(pago.monto)}</td>
                                        <td className="p-3 text-gray-700 dark:text-gray-300">{pago.moneda}</td>
                                        <td className="p-3 text-gray-700 dark:text-gray-300">{pago.formaPago?.forma_pago || 'N/A'}</td>
                                        <td className="p-3 text-gray-700 dark:text-gray-300 text-sm max-w-xs truncate">{pago.observaciones}</td>
                                        <td className="p-3 text-center no-print">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handlePrintRecibo(pago)}
                                                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold p-2.5 rounded-lg border-none flex items-center justify-center shadow-md transition-all transform hover:-translate-y-0.5"
                                                    title="Imprimir Recibo"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleEditPayment(pago)}
                                                    className="bg-amber-400 hover:bg-amber-500 text-white font-bold p-2.5 rounded-lg border-none flex items-center justify-center shadow-md transition-all transform hover:-translate-y-0.5"
                                                    title="Editar"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePayment(pago.id)}
                                                    className="bg-red-500 hover:bg-red-600 text-white font-bold p-2.5 rounded-lg border-none flex items-center justify-center shadow-md transition-all transform hover:-translate-y-0.5"
                                                    title="Eliminar"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredPagos.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                            No se encontraron pagos registrados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls for Pagos */}
                    {totalPagosPages > 1 && (
                        <div className="no-print">
                            <Pagination
                                currentPage={currentPagosPage}
                                totalPages={totalPagosPages}
                                onPageChange={paginatePagos}
                            />
                        </div>
                    )}
                </>
            )}

            {showPaymentForm && selectedGasto && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 no-print">
                    <PagosGastosFijosForm
                        gastoFijo={selectedGasto}
                        existingPayment={selectedPayment}
                        onClose={() => setShowPaymentForm(false)}
                        onSave={() => {
                            fetchGastos();
                            fetchPagos();
                        }}
                    />
                </div>
            )}
            {/* GastosFijosForm Modal */}
            <GastosFijosForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                id={selectedGastoFijoId}
                onSaveSuccess={() => {
                    fetchGastos();
                    setIsFormOpen(false);
                }}
            />

            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Gastos Fijos"
                sections={manualSections}
            />
            {/* Print Selection Modal */}
            {showPrintModal && (
                <div className="fixed inset-0 z-[9999] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowPrintModal(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${modalMode === 'excel' ? 'bg-green-100 text-green-600' : modalMode === 'pdf' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {modalMode === 'excel' && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                                        {modalMode === 'pdf' && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
                                        {modalMode === 'print' && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>}
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                                            {modalMode === 'excel' ? 'Exportar a Excel' : modalMode === 'pdf' ? 'Exportar a PDF' : 'Imprimir'}
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                                Seleccione los filtros para generar el reporte:
                                            </p>

                                            <div className="grid gap-4">
                                                <label htmlFor="destino" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Destino
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                        </svg>
                                                    </div>
                                                    <select
                                                        id="destino"
                                                        value={printDestino}
                                                        onChange={(e) => setPrintDestino(e.target.value)}
                                                        className="block w-full pl-10 pr-10 py-2.5 text-base border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-shadow shadow-sm"
                                                    >
                                                        <option value="todos">Todos los destinos</option>
                                                        <option value="Consultorio">Consultorio</option>
                                                        <option value="Casa">Casa</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Periodo Filter */}
                                            <div className="mb-4">
                                                <label htmlFor="periodo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Periodo / Tipo
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                    <select
                                                        id="periodo"
                                                        value={printPeriodo}
                                                        onChange={(e) => setPrintPeriodo(e.target.value)}
                                                        className="block w-full pl-10 pr-10 py-2.5 text-base border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-shadow shadow-sm"
                                                    >
                                                        <option value="todos">Todos los periodos</option>
                                                        <option value="mensual">Mensual</option>
                                                        <option value="anual">Anual</option>
                                                    </select>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${modalMode === 'excel' ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' :
                                        modalMode === 'pdf' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' :
                                            'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                                        }`}
                                    onClick={handleConfirmPrint}
                                >
                                    {modalMode === 'excel' ? 'Exportar Excel' : modalMode === 'pdf' ? 'Exportar PDF' : 'Imprimir'}
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setShowPrintModal(false)}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Pagos Print Modal */}
            {showPagosPrintModal && (
                <div className="fixed inset-0 z-[9999] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowPagosPrintModal(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${pagosModalMode === 'excel' ? 'bg-green-100 text-green-600' : pagosModalMode === 'pdf' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {pagosModalMode === 'excel' && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                                        {pagosModalMode === 'pdf' && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
                                        {pagosModalMode === 'print' && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>}
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                                            {pagosModalMode === 'excel' ? 'Exportar a Excel' : pagosModalMode === 'pdf' ? 'Exportar a PDF' : 'Imprimir'} Historial de Pagos
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                                Seleccione los filtros para su reporte:
                                            </p>
                                            <div className="grid gap-4">
                                                <label htmlFor="pagoGasto" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Filtrar por Gasto Fijo
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                                        </svg>
                                                    </div>
                                                    <select
                                                        id="pagoGasto"
                                                        value={printPagoGastoFilter}
                                                        onChange={(e) => setPrintPagoGastoFilter(e.target.value)}
                                                        className="block w-full pl-10 pr-10 py-2.5 text-base border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-shadow shadow-sm"
                                                    >
                                                        <option value="todos">Todos los gastos</option>
                                                        {gastos.filter(g => (g.estado === 'activo' || !g.estado)).map(g => (
                                                            <option key={g.id} value={g.gasto_fijo}>{g.gasto_fijo}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${pagosModalMode === 'excel' ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' :
                                        pagosModalMode === 'pdf' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' :
                                            'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                                        }`}
                                    onClick={handleConfirmPagosPrint}
                                >
                                    {pagosModalMode === 'excel' ? 'Exportar Excel' : pagosModalMode === 'pdf' ? 'Exportar PDF' : 'Imprimir'}
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setShowPagosPrintModal(false)}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GastosFijosList;
