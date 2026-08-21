import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import type { Pago, Proforma, HistoriaClinica, Paciente } from '../types';
import { formatDate } from '../utils/dateUtils';
import { formatCurrency, formatDateUTC, deduplicateHistoria } from '../utils/formatters';
import PagosForm from './PagosForm';
import Pagination from './Pagination';
import ManualModal, { type ManualSection } from './ManualModal';
import TraspasoSaldoModal from './TraspasoSaldoModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CreditCard, Plus, Printer } from 'lucide-react';

interface PacientePagosTabProps {
    pacienteId: number;
}

const PacientePagosTab: React.FC<PacientePagosTabProps> = ({ pacienteId }) => {
    const [pagos, setPagos] = useState<Pago[]>([]);
    const [proformas, setProformas] = useState<Proforma[]>([]);
    const [selectedProformaId, setSelectedProformaId] = useState<number>(0);
    const [historia, setHistoria] = useState<HistoriaClinica[]>([]);
    const [paciente, setPaciente] = useState<Paciente | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [showManual, setShowManual] = useState(false);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedPagoId, setSelectedPagoId] = useState<number | null>(null);
    const [isTraspasoModalOpen, setIsTraspasoModalOpen] = useState(false);
    const [traspasoMaxAmount, setTraspasoMaxAmount] = useState(0);
    const itemsPerPage = 10;

    const manualSections: ManualSection[] = [
        {
            title: 'Pagos del Paciente',
            content: 'Consulte el historial completo de pagos realizados por el paciente organizados por Plan de Tratamiento.'
        },
        {
            title: 'Registrar Nuevo Pago',
            content: 'Seleccione un Plan de Tratamiento y haga clic en "+ Registrar Nuevo Pago". Los datos del paciente y plan se asociarán automáticamente.'
        },
        {
            title: 'Resumen Financiero',
            content: 'Muestra el desglose de Total Presupuestado, Total Ejecutado (tratamientos terminados), Total Pagado y el Saldo pendiente o a favor.'
        }
    ];

    useEffect(() => {
        if (pacienteId) {
            fetchData();
        }
    }, [pacienteId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pagosRes, proformasRes, historiaRes, pacienteRes] = await Promise.all([
                api.get(`/pagos/paciente/${pacienteId}`),
                api.get(`/proformas/paciente/${pacienteId}`),
                api.get(`/historia-clinica/paciente/${pacienteId}`),
                api.get(`/pacientes/${pacienteId}`).catch(() => null)
            ]);

            setPagos(Array.isArray(pagosRes.data) ? pagosRes.data : []);
            setProformas(Array.isArray(proformasRes.data) ? proformasRes.data : []);
            setHistoria(Array.isArray(historiaRes.data) ? historiaRes.data : []);
            setPaciente(pacienteRes?.data || null);
        } catch (error) {
            console.error('Error fetching data for paciente pagos tab:', error);
            setPagos([]);
            setProformas([]);
            setHistoria([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Está seguro de eliminar este pago?',
            text: "No podrás revertir esto",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/pagos/${id}`);
                fetchData();
                Swal.fire({
                    icon: 'success',
                    title: 'Eliminado',
                    text: 'Pago eliminado correctamente',
                    timer: 1500,
                    showConfirmButton: false
                });
            } catch (error) {
                console.error('Error deleting pago:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al eliminar el pago'
                });
            }
        }
    };

    const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(e);
        });
    };

    const handlePrint = async () => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;

            // Logo
            try {
                const logo = await loadImage('/logo-curare.png');
                doc.addImage(logo, 'PNG', 14, 12, 35, 14);
            } catch (error) {
                console.warn('Could not load logo for print:', error);
            }

            // Title & Header Line
            doc.setDrawColor(52, 152, 219); // #3498db
            doc.setLineWidth(1);
            doc.line(15, 32, pageWidth - 15, 32);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.setTextColor(44, 62, 80); // #2c3e50
            doc.text('ESTADO DE CUENTAS', 105, 23, { align: 'center' });

            // Patient & Plan Info Box
            const boxY = 37;
            const boxHeight = 18;

            doc.setFillColor(248, 249, 250); // #f8f9fa
            doc.rect(15, boxY, pageWidth - 30, boxHeight, 'F');

            doc.setFillColor(52, 152, 219); // #3498db
            doc.rect(15, boxY, 2, boxHeight, 'F');

            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(51, 51, 51);
            doc.text('PACIENTE:', 20, boxY + 6);
            doc.setFont('helvetica', 'normal');
            const pacienteNombre = paciente
                ? `${paciente.paterno} ${paciente.materno || ''} ${paciente.nombre}`.toUpperCase()
                : (pagos[0]?.paciente ? `${pagos[0].paciente.paterno} ${pagos[0].paciente.nombre}`.toUpperCase() : `PACIENTE #${pacienteId}`);
            doc.text(pacienteNombre, 45, boxY + 6);

            const selectedProforma = proformas.find(p => p.id === selectedProformaId);
            doc.setFont('helvetica', 'bold');
            doc.text('PLAN DE TRATAMIENTO:', 20, boxY + 13);
            doc.setFont('helvetica', 'normal');
            const planText = selectedProforma
                ? `Plan #${selectedProforma.numero || selectedProforma.id} - ${formatDateUTC(selectedProforma.fecha)}`
                : 'Todos los planes';
            doc.text(planText, 65, boxY + 13);

            // Filter historia clinica & payments for selected plan if selectedProformaId > 0
            const rawFilteredHistoria = selectedProformaId > 0
                ? historia.filter(h => h.proformaId === selectedProformaId && h.estadoTratamiento === 'terminado')
                : historia.filter(h => h.estadoTratamiento === 'terminado');
            
            const filteredHistoria = deduplicateHistoria(rawFilteredHistoria);

            const filteredPagos = selectedProformaId > 0
                ? pagos.filter(p => p.proformaId === selectedProformaId)
                : pagos;

            // SECTION 1: TRATAMIENTOS EJECUTADOS (HISTORIA CLINICA - TERMINADOS)
            let currentY = boxY + boxHeight + 8;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(44, 62, 80);
            doc.text('TRATAMIENTOS EJECUTADOS (HISTORIA CLÍNICA)', 15, currentY);

            const rowsData = filteredHistoria.map(curr => {
                let itemPrice = Number(curr.precio || 0);
                let discountAmt = 0;
                let discountPct = 0;
                if (selectedProforma && selectedProforma.detalles) {
                    const matchDetalle = selectedProforma.detalles.find(d =>
                        (curr.proformaDetalleId && d.id === curr.proformaDetalleId) ||
                        (d.arancel && d.arancel.detalle === curr.tratamiento)
                    );
                    if (matchDetalle) {
                        if (Number(matchDetalle.total || 0) > 0 && Number(matchDetalle.cantidad || 1) > 0) {
                            const unitNetPrice = Number(matchDetalle.total) / Number(matchDetalle.cantidad || 1);
                            itemPrice = unitNetPrice * Number(curr.cantidad || 1);
                        }
                        if (Number(matchDetalle.descuento || 0) > 0 && Number(matchDetalle.cantidad || 1) > 0) {
                            discountAmt = (Number(matchDetalle.descuento) / Number(matchDetalle.cantidad || 1)) * Number(curr.cantidad || 1);
                            const totalOriginal = Number(matchDetalle.total) + Number(matchDetalle.descuento);
                            if (totalOriginal > 0) {
                                discountPct = Math.round((Number(matchDetalle.descuento) / totalOriginal) * 100);
                            }
                        }
                    }
                }
                return { curr, itemPrice, discountAmt, discountPct };
            });

            const hasDiscount = rowsData.some(r => r.discountAmt > 0);

            const hcTableColumn = ["Fecha", "Pieza", "Tratamiento / Procedimiento"];
            if (hasDiscount) hcTableColumn.push("Descuento");
            hcTableColumn.push("Monto (Bs.)");

            const hcTableRows = filteredHistoria.length > 0 ? rowsData.map(r => {
                const row = [
                    formatDate(r.curr.fecha),
                    r.curr.pieza || '-',
                    r.curr.tratamiento || '-'
                ];
                if (hasDiscount) {
                    if (r.discountAmt > 0) {
                        row.push(`${r.discountPct}% (Bs. ${formatCurrency(r.discountAmt)})`);
                    } else {
                        row.push('-');
                    }
                }
                row.push(`Bs. ${formatCurrency(r.itemPrice)}`);
                return row;
            }) : [["-", "-", "No hay tratamientos ejecutados registrados", ...(hasDiscount ? ["-"] : []), "Bs. 0,00"]];

            autoTable(doc, {
                head: [hcTableColumn],
                body: hcTableRows,
                startY: currentY + 3,
                theme: 'plain',
                margin: { left: 15, right: 15 },
                styles: {
                    fontSize: 8,
                    cellPadding: 2.5,
                },
                headStyles: {
                    fillColor: [235, 245, 255],
                    textColor: [30, 41, 59],
                    fontStyle: 'bold',
                    lineWidth: 0.1,
                    lineColor: [203, 213, 225]
                },
                columnStyles: hasDiscount ? {
                    0: { cellWidth: 25 },
                    1: { cellWidth: 25 },
                    2: { cellWidth: 'auto' },
                    3: { cellWidth: 25, halign: 'right' },
                    4: { cellWidth: 25, halign: 'right' }
                } : {
                    0: { cellWidth: 25 },
                    1: { cellWidth: 25 },
                    2: { cellWidth: 'auto' },
                    3: { cellWidth: 35, halign: 'right' }
                },
                alternateRowStyles: {
                    fillColor: [248, 249, 250]
                }
            });

            currentY = (doc as any).lastAutoTable?.finalY || (currentY + 20);

            // SECTION 2: HISTORIAL DE PAGOS REGISTRADOS
            if (currentY + 25 > pageHeight - 35) {
                doc.addPage();
                currentY = 15;
            } else {
                currentY += 8;
            }

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(44, 62, 80);
            doc.text('HISTORIAL DE PAGOS REGISTRADOS', 15, currentY);

            const pagosTableColumn = ["Fecha", "Recibo / Factura", "Monto", "Moneda", "Forma de Pago", "Observaciones"];
            const pagosTableRows = filteredPagos.length > 0 ? filteredPagos.map(pago => {
                const isDollar = pago.moneda === 'Dólares';
                const reciboFactura = [
                    pago.recibo ? `R: ${pago.recibo}` : '',
                    pago.factura ? `F: ${pago.factura}` : ''
                ].filter(Boolean).join(' / ') || '-';
                const montoStr = isDollar ? `USD ${formatCurrency(pago.monto)}` : `Bs. ${formatCurrency(pago.monto)}`;
                const monedaStr = isDollar ? `Dólares (TC: ${formatCurrency(pago.tc || 6.96)})` : (pago.moneda || 'Bolivianos');
                const formaPagoStr = pago.formaPagoRel ? pago.formaPagoRel.forma_pago : (pago.formaPago || 'Efectivo');

                return [
                    formatDate(pago.fecha),
                    reciboFactura,
                    montoStr,
                    monedaStr,
                    formaPagoStr,
                    pago.observaciones || '-'
                ];
            }) : [["-", "-", "Bs. 0,00", "-", "-", "No hay pagos registrados"]];

            autoTable(doc, {
                head: [pagosTableColumn],
                body: pagosTableRows,
                startY: currentY + 3,
                theme: 'plain',
                margin: { left: 15, right: 15 },
                styles: {
                    fontSize: 8,
                    cellPadding: 2.5,
                },
                headStyles: {
                    fillColor: [235, 245, 255],
                    textColor: [30, 41, 59],
                    fontStyle: 'bold',
                    lineWidth: 0.1,
                    lineColor: [203, 213, 225]
                },
                columnStyles: {
                    0: { cellWidth: 22 },
                    1: { cellWidth: 28 },
                    2: { cellWidth: 25 },
                    3: { cellWidth: 32 },
                    4: { cellWidth: 28 },
                    5: { cellWidth: 'auto' }
                },
                alternateRowStyles: {
                    fillColor: [248, 249, 250]
                }
            });

            let finalY = (doc as any).lastAutoTable?.finalY || (currentY + 20);

            // Calculate Financial Summary values
            const totalPresupuesto = selectedProforma ? Number(selectedProforma.total || 0) : 0;
            const totalEjecutado = filteredHistoria.reduce((acc, curr) => {
                let itemPrice = Number(curr.precio || 0);
                if (selectedProforma && selectedProforma.detalles) {
                    const matchDetalle = selectedProforma.detalles.find(d =>
                        (curr.proformaDetalleId && d.id === curr.proformaDetalleId) ||
                        (d.arancel && d.arancel.detalle === curr.tratamiento)
                    );
                    if (matchDetalle && Number(matchDetalle.total || 0) > 0 && Number(matchDetalle.cantidad || 1) > 0) {
                        const unitNetPrice = Number(matchDetalle.total) / Number(matchDetalle.cantidad || 1);
                        itemPrice = unitNetPrice * Number(curr.cantidad || 1);
                    }
                }
                return acc + itemPrice;
            }, 0);

            const totalPagado = filteredPagos.reduce((acc, curr) => {
                const val = curr.moneda === 'Dólares'
                    ? Number(curr.monto || 0) * Number(curr.tc || 6.96)
                    : Number(curr.monto || 0);
                return acc + val;
            }, 0);

            const saldo = totalPagado - totalEjecutado;
            const saldoFavor = saldo > 0 ? saldo : 0;
            const saldoContra = saldo < 0 ? Math.abs(saldo) : 0;

            // Draw Financial Summary Card in PDF
            if (finalY + 30 > pageHeight - 25) {
                doc.addPage();
                finalY = 15;
            }

            const summaryBoxY = finalY + 6;
            const summaryBoxHeight = 20;

            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(203, 213, 225);
            doc.setLineWidth(0.5);
            doc.roundedRect(15, summaryBoxY, pageWidth - 30, summaryBoxHeight, 2, 2, 'FD');

            doc.setFillColor(52, 152, 219);
            doc.rect(15, summaryBoxY, 2, summaryBoxHeight, 'F');

            const colWidth = (pageWidth - 30) / 4;

            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(100, 116, 139);
            doc.text('TOTAL PRESUPUESTO', 15 + 5, summaryBoxY + 7);
            doc.setFontSize(9);
            doc.setTextColor(29, 78, 216);
            doc.text(`Bs. ${formatCurrency(totalPresupuesto)}`, 15 + 5, summaryBoxY + 14);

            doc.setFontSize(7);
            doc.setTextColor(100, 116, 139);
            doc.text('TOTAL EJECUTADO', 15 + colWidth + 5, summaryBoxY + 7);
            doc.setFontSize(9);
            doc.setTextColor(30, 41, 59);
            doc.text(`Bs. ${formatCurrency(totalEjecutado)}`, 15 + colWidth + 5, summaryBoxY + 14);

            doc.setFontSize(7);
            doc.setTextColor(100, 116, 139);
            doc.text('TOTAL PAGADO', 15 + colWidth * 2 + 5, summaryBoxY + 7);
            doc.setFontSize(9);
            doc.setTextColor(30, 41, 59);
            doc.text(`Bs. ${formatCurrency(totalPagado)}`, 15 + colWidth * 2 + 5, summaryBoxY + 14);

            if (saldoFavor > 0) {
                doc.setFontSize(7);
                doc.setTextColor(21, 128, 61);
                doc.text('SALDO A FAVOR', 15 + colWidth * 3 + 5, summaryBoxY + 7);
                doc.setFontSize(9);
                doc.text(`Bs. ${formatCurrency(saldoFavor)}`, 15 + colWidth * 3 + 5, summaryBoxY + 14);
            } else if (saldoContra > 0) {
                doc.setFontSize(7);
                doc.setTextColor(185, 28, 28);
                doc.text('SALDO EN CONTRA', 15 + colWidth * 3 + 5, summaryBoxY + 7);
                doc.setFontSize(9);
                doc.text(`Bs. ${formatCurrency(saldoContra)}`, 15 + colWidth * 3 + 5, summaryBoxY + 14);
            } else {
                doc.setFontSize(7);
                doc.setTextColor(100, 116, 139);
                doc.text('SALDO', 15 + colWidth * 3 + 5, summaryBoxY + 7);
                doc.setFontSize(9);
                doc.text('Bs. 0,00', 15 + colWidth * 3 + 5, summaryBoxY + 14);
            }

            // Footer
            doc.setDrawColor(51, 51, 51);
            doc.setLineWidth(0.5);
            doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);

            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text(`Fecha de impresión: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}`, pageWidth - 15, pageHeight - 13, { align: 'right' });

            doc.autoPrint();
            const blobUrl = doc.output('bloburl');
            window.open(blobUrl, '_blank');
        } catch (error) {
            console.error('Error al generar impresión de estado de cuentas:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error de impresión',
                text: 'Ocurrió un error al generar la impresión del estado de cuentas.'
            });
        }
    };

    const generateReciboPDF = async (pago: Pago) => {
        const doc = new jsPDF();
        try {
            const logo = await loadImage('/logo-curare.png');
            doc.addImage(logo, 'PNG', 14, 10, 50, 20);
        } catch (error) {
            console.warn('Could not load logo', error);
        }

        const dateStr = formatDate(pago.fecha);

        // Header
        const pageWidth = doc.internal.pageSize.width;
        doc.setDrawColor(52, 152, 219); // #3498db
        doc.setLineWidth(1);
        doc.line(15, 35, pageWidth - 15, 35);

        doc.setFontSize(10);
        doc.text(dateStr, pageWidth - 15, 25, { align: 'right' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(44, 62, 80); // #2c3e50
        doc.text('RECIBO DE PAGO', 105, 25, { align: 'center' });
        doc.setTextColor(0, 0, 0);

        // Box for Recibo Info
        doc.setDrawColor(200);
        doc.setFillColor(248, 249, 250);
        doc.rect(15, 45, pageWidth - 30, 90, 'F');
        doc.setDrawColor(52, 152, 219); // Blue border
        doc.rect(15, 45, pageWidth - 30, 90, 'S');

        doc.setFontSize(11);
        let y = 60;
        const xLabel = 25;
        const xValue = 75;

        // Recibo #
        doc.setFont('helvetica', 'bold');
        doc.text('Nº Recibo:', xLabel, y);
        doc.setFont('helvetica', 'normal');
        doc.text(pago.recibo || String(pago.id), xValue, y);

        // Factura # (if exists)
        if (pago.factura) {
            doc.setFont('helvetica', 'bold');
            doc.text('Factura:', 120, y);
            doc.setFont('helvetica', 'normal');
            doc.text(pago.factura, 150, y);
        }
        y += 12;

        // Paciente
        doc.setFont('helvetica', 'bold');
        doc.text('Recibí de:', xLabel, y);
        doc.setFont('helvetica', 'normal');
        const pacienteNombre = pago.paciente
            ? `${pago.paciente.paterno} ${pago.paciente.materno || ''} ${pago.paciente.nombre}`
            : 'N/A';
        doc.text(pacienteNombre.toUpperCase(), xValue, y);
        y += 12;

        // Monto
        doc.setFont('helvetica', 'bold');
        doc.text('La suma de:', xLabel, y);
        doc.setFont('helvetica', 'normal');
        const montoStr = pago.moneda === 'Dólares'
            ? `USD ${Number(pago.monto).toFixed(2)}`
            : `Bs ${Number(pago.monto).toFixed(2)}`;
        doc.text(montoStr, xValue, y);
        y += 12;

        // Concepto
        doc.setFont('helvetica', 'bold');
        doc.text('Por concepto de:', xLabel, y);
        doc.setFont('helvetica', 'normal');
        const concepto = pago.proforma
            ? `Tratamiento Odontológico - Plan #${pago.proforma.numero}`
            : 'Tratamiento Odontológico';
        doc.text(concepto, xValue, y);
        y += 12;

        // Forma de Pago
        doc.setFont('helvetica', 'bold');
        doc.text('Forma de Pago:', xLabel, y);
        doc.setFont('helvetica', 'normal');
        let fp = pago.formaPagoRel ? pago.formaPagoRel.forma_pago : pago.formaPago || 'Efectivo';
        if (pago.comisionTarjeta) fp += ` (${pago.comisionTarjeta.redBanco})`;
        doc.text(fp, xValue, y);
        y += 12;

        // Observaciones
        if (pago.observaciones) {
            doc.setFont('helvetica', 'bold');
            doc.text('Observaciones:', xLabel, y);
            doc.setFont('helvetica', 'normal');
            doc.text(pago.observaciones, xValue, y);
        }

        // Signatures
        const pageHeight = doc.internal.pageSize.height;

        doc.setDrawColor(0);
        doc.line(30, pageHeight - 50, 90, pageHeight - 50);
        doc.setFontSize(9);
        doc.text('Entregué Conforme', 60, pageHeight - 45, { align: 'center' });

        doc.line(120, pageHeight - 50, 180, pageHeight - 50);
        doc.text('Recibí Conforme', 150, pageHeight - 45, { align: 'center' });
        doc.text('CURARE CENTRO DENTAL', 150, pageHeight - 40, { align: 'center' });

        // Footer
        doc.setDrawColor(0);
        doc.setLineWidth(0.1);
        doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
        doc.setFontSize(8);
        doc.text(`Impreso el: ${new Date().toLocaleString()}`, 15, pageHeight - 10);

        doc.autoPrint();
        const blobUrl = doc.output('bloburl');
        window.open(blobUrl, '_blank');
    };

    const handleSendWhatsApp = async (pago: Pago) => {
        const targetPaciente = pago.paciente || paciente;
        const pacienteName = targetPaciente
            ? `${targetPaciente.nombre} ${targetPaciente.paterno}`
            : 'el paciente';

        const result = await Swal.fire({
            title: '¿Enviar recibo por WhatsApp?',
            text: `Se enviará el recibo de pago por WhatsApp a ${pacienteName}.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10B981',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Sí, enviar por WhatsApp',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return;

        Swal.fire({
            title: 'Enviando...',
            text: 'Enviando recibo de pago por WhatsApp',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const response = await api.post(`/pagos/${pago.id}/send-whatsapp`);
            if (response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Enviado!',
                    text: response.data.message || 'Recibo enviado por WhatsApp exitosamente',
                    timer: 2500,
                    showConfirmButton: false
                });
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'No se pudo enviar',
                    text: response.data.message || 'Error al enviar por WhatsApp'
                });
            }
        } catch (error: any) {
            console.error('Error sending WhatsApp recibo:', error);
            let errorMessage = 'No se pudo enviar el recibo por WhatsApp';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.status === 503) {
                errorMessage = 'El chatbot no está conectado. Por favor, conecte el chatbot primero desde Configuración > Chatbot (WhatsApp).';
            }
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage
            });
        }
    };

    const handleSendEstadoCuentasWhatsApp = async () => {
        const pacienteName = paciente
            ? `${paciente.nombre} ${paciente.paterno}`
            : 'el paciente';

        const result = await Swal.fire({
            title: '¿Enviar Estado de Cuentas por WhatsApp?',
            text: `Se enviará el reporte de Estado de Cuentas por WhatsApp a ${pacienteName}.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10B981',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Sí, enviar por WhatsApp',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return;

        Swal.fire({
            title: 'Enviando...',
            text: 'Enviando Estado de Cuentas por WhatsApp',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const response = await api.post('/pagos/whatsapp', {
                pacienteId,
                proformaId: selectedProformaId > 0 ? selectedProformaId : undefined
            });

            if (response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Enviado!',
                    text: response.data.message || 'Estado de cuentas enviado por WhatsApp exitosamente',
                    timer: 2500,
                    showConfirmButton: false
                });
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'No se pudo enviar',
                    text: response.data.message || 'Error al enviar por WhatsApp'
                });
            }
        } catch (error: any) {
            console.error('Error sending WhatsApp estado de cuentas:', error);
            let errorMessage = 'No se pudo enviar el estado de cuentas por WhatsApp';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.status === 503) {
                errorMessage = 'El chatbot no está conectado. Por favor, conecte el chatbot primero desde Configuración > Chatbot (WhatsApp).';
            }
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage
            });
        }
    };

    // Filter pagos for selected proforma
    const proformaPagos = selectedProformaId > 0
        ? pagos.filter(p => p.proformaId === selectedProformaId || p.proforma?.id === selectedProformaId)
        : [];

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedProformaId]);

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = proformaPagos.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(proformaPagos.length / itemsPerPage);

    return (
        <div className="space-y-4">
            {/* Header del Tab */}
            <div className="pb-4 border-b border-gray-200 dark:border-gray-700 mb-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <CreditCard className="text-blue-500" size={22} />
                    <span>Historial de Pagos y Facturación</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                    Registro de abonos, recibos y facturas del paciente por plan de tratamiento.
                </p>
            </div>

            {/* Proforma Selector & Action Buttons Row */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-wrap items-center gap-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 w-fit">
                    <label className="font-bold text-gray-700 dark:text-gray-300 text-sm">Seleccione el Plan de Tratamiento:</label>
                    <select
                        value={selectedProformaId}
                        onChange={(e) => setSelectedProformaId(Number(e.target.value))}
                        className="p-1.5 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm cursor-pointer min-w-[220px]"
                    >
                        <option value={0}>-- Seleccione un Plan de Tratamiento --</option>
                        {proformas.map(p => (
                            <option key={p.id} value={p.id}>
                                Plan #{p.numero || p.id} - {formatDateUTC(p.fecha)}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[34px] h-[34px] text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shadow-sm"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>
                    {/* Buttons appear ONLY when selectedProformaId > 0 */}
                    {selectedProformaId > 0 && (
                        <>
                            <button
                                type="button"
                                onClick={handlePrint}
                                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-bold shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 text-sm cursor-pointer"
                                title="Imprimir Estado de Cuentas del Plan"
                            >
                                <Printer size={18} />
                                <span>Imprimir Estado de Cuentas</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleSendEstadoCuentasWhatsApp}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 text-sm cursor-pointer"
                                title="Enviar Estado de Cuentas por WhatsApp"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                                </svg>
                                <span>Enviar Estado de Cuentas</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedPagoId(null);
                                    setIsFormOpen(true);
                                }}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 text-sm cursor-pointer"
                            >
                                <Plus size={18} />
                                <span>Registrar Nuevo Pago</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-3"></div>
                    Cargando Pagos del Paciente...
                </div>
            ) : selectedProformaId === 0 ? (
                <div className="mb-6 p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400 flex-shrink-0">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                        <span className="font-semibold">ℹ️ Por favor, seleccione un Plan de Tratamiento</span> para ver la lista de pagos y el resumen financiero.
                    </p>
                </div>
            ) : (
                <>
                    {/* Record Count Indicator */}
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium">
                        Mostrando {proformaPagos.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, proformaPagos.length)} de {proformaPagos.length} registros
                    </div>

                    {/* Payments Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Fecha</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Recibo / Factura</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Monto</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Moneda</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Forma de Pago</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Observaciones</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {currentItems.map(pago => {
                                        const isDollar = pago.moneda === 'Dólares';

                                        return (
                                            <tr key={pago.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{formatDate(pago.fecha)}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200 font-medium">
                                                    {pago.recibo ? `R: ${pago.recibo}` : ''}
                                                    {pago.recibo && pago.factura ? ' / ' : ''}
                                                    {pago.factura ? `F: ${pago.factura}` : ''}
                                                    {!pago.recibo && !pago.factura ? '-' : ''}
                                                </td>
                                                <td className="px-4 py-3 font-bold text-blue-600 dark:text-blue-400">
                                                    {isDollar ? `USD ${formatCurrency(pago.monto)}` : `Bs. ${formatCurrency(pago.monto)}`}
                                                </td>
                                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">
                                                    {isDollar ? `Dólares (TC: ${formatCurrency(pago.tc || 6.96)})` : (pago.moneda || 'Bolivianos')}
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                                    <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold">
                                                        {pago.formaPagoRel ? pago.formaPagoRel.forma_pago : (pago.formaPago || 'Efectivo')}
                                                        {pago.formaPagoRel?.forma_pago?.toLowerCase() === 'tarjeta' && pago.comisionTarjeta && ` (${pago.comisionTarjeta.redBanco})`}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs max-w-[220px] truncate" title={pago.observaciones || ''}>
                                                    {pago.observaciones || '-'}
                                                </td>
                                                <td className="px-4 py-3 flex gap-2">
                                                    <button
                                                        onClick={() => generateReciboPDF(pago)}
                                                        className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                                        title="Imprimir Recibo"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                                            <rect x="6" y="14" width="12" height="8"></rect>
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleSendWhatsApp(pago)}
                                                        className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                                        title="Enviar Recibo por WhatsApp"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedPagoId(pago.id);
                                                            setIsFormOpen(true);
                                                        }}
                                                        className="p-2 bg-amber-400 hover:bg-amber-500 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                                        title="Editar"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(pago.id)}
                                                        className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                                        title="Eliminar"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {currentItems.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="p-5 text-center text-gray-500 dark:text-gray-400 font-medium">
                                                No hay pagos registrados para el plan seleccionado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Resumen Financiero Card - Right-aligned & Compact (Imagen 1 style) */}
                    {(() => {
                        const selectedProforma = proformas.find(p => p.id === selectedProformaId);
                        const totalPresupuesto = selectedProforma ? Number(selectedProforma.total || 0) : 0;

                        const rawFilteredHistoria = historia.filter(h => h.proformaId === selectedProformaId && h.estadoTratamiento === 'terminado');
                        const filteredHistoria = deduplicateHistoria(rawFilteredHistoria);

                        const totalEjecutado = filteredHistoria.reduce((acc, curr) => {
                            if (selectedProforma && selectedProforma.detalles && selectedProforma.detalles.length > 0) {
                                const pdMatch = selectedProforma.detalles.find((d: any) => {
                                    if (curr.pieza && d.piezas) {
                                        const normPz = (str: string) => str.replace(/[^0-9]/g, ' ').trim().split(/\s+/).sort().join('-');
                                        if (normPz(curr.pieza) === normPz(d.piezas)) return true;
                                    }
                                    const currTratNorm = (curr.tratamiento || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, ' ').trim();
                                    const dTratNorm = (d.arancel?.detalle || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, ' ').trim();
                                    return dTratNorm && currTratNorm && (dTratNorm.includes(currTratNorm) || currTratNorm.includes(dTratNorm) || dTratNorm.split(' ')[0] === currTratNorm.split(' ')[0]);
                                });
                                if (pdMatch && Number(pdMatch.total) >= 0 && Number(pdMatch.cantidad) > 0) {
                                    const netUnitPrice = Number(pdMatch.total) / Number(pdMatch.cantidad);
                                    return acc + (netUnitPrice * Number(curr.cantidad || 1));
                                }
                            }
                            return acc + Number(curr.precio || 0);
                        }, 0);

                        const totalPagado = proformaPagos.reduce((acc, curr) => {
                            const val = curr.moneda === 'Dólares'
                                ? Number(curr.monto || 0) * (Number(curr.tc) || 6.96)
                                : Number(curr.monto || 0);
                            return acc + val;
                        }, 0);

                        const saldo = totalPagado - totalEjecutado;
                        const saldoFavor = saldo > 0 ? saldo : 0;
                        const saldoContra = saldo < 0 ? Math.abs(saldo) : 0;

                        return (
                            <div className="mt-6 flex justify-end">
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
                                        <div className="text-right text-green-400 flex flex-col items-end gap-1">
                                            <div className="text-xs text-green-400">Saldo a Favor</div>
                                            <div className="text-lg font-bold">Bs. {formatCurrency(saldoFavor)}</div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setTraspasoMaxAmount(saldoFavor);
                                                    setIsTraspasoModalOpen(true);
                                                }}
                                                className="mt-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow transition-all transform hover:-translate-y-0.5 flex items-center gap-1.5 cursor-pointer"
                                                title="Traspasar Saldo a Favor a otro plan o paciente"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                </svg>
                                                Traspasar Saldo
                                            </button>
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
                            </div>
                        );
                    })()}

                    {/* Pagination */}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </>
            )}

            <PagosForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                id={selectedPagoId}
                defaultPacienteId={pacienteId}
                defaultProformaId={selectedProformaId}
                hidePacienteProforma={true}
                onSaveSuccess={() => {
                    fetchData();
                    setIsFormOpen(false);
                }}
            />

            <TraspasoSaldoModal
                isOpen={isTraspasoModalOpen}
                onClose={() => setIsTraspasoModalOpen(false)}
                sourcePacienteId={pacienteId}
                sourcePacienteNombre={paciente ? `${paciente.paterno} ${paciente.materno || ''} ${paciente.nombre}` : (pagos[0]?.paciente ? `${pagos[0].paciente.paterno} ${pagos[0].paciente.nombre}` : `Paciente #${pacienteId}`)}
                sourceProformaId={selectedProformaId}
                maxAmount={traspasoMaxAmount}
                onSuccess={() => {
                    fetchData();
                }}
            />

            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual - Pagos"
                sections={manualSections}
            />
        </div>
    );
};

export default PacientePagosTab;


