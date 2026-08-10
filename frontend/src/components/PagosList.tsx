import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import type { Pago, Proforma, HistoriaClinica } from '../types';
import Pagination from './Pagination';
import jsPDF from 'jspdf';
import { formatDate } from '../utils/dateUtils';
import { formatCurrency, formatDateUTC } from '../utils/formatters';
import ManualModal, { type ManualSection } from './ManualModal';
import PagosForm from './PagosForm';

const PagosList: React.FC = () => {
    const [pagos, setPagos] = useState<Pago[]>([]);
    const [proformas, setProformas] = useState<Proforma[]>([]);
    const [selectedProformaId, setSelectedProformaId] = useState<number>(0);
    const [historia, setHistoria] = useState<HistoriaClinica[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showManual, setShowManual] = useState(false);
    const [currentPage, setCurrentPage] = useState<number>(1);

    // Modal state for PagosForm
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedPagoId, setSelectedPagoId] = useState<number | null>(null);
    const itemsPerPage = 10;

    const manualSections: ManualSection[] = [
        {
            title: 'Gestión de Pagos',
            content: 'Registro y control de todos los ingresos por tratamientos realizados a pacientes.'
        },
        {
            title: 'Plan de Tratamiento',
            content: 'Seleccione un Plan de Tratamiento para ver los pagos asociados y el resumen financiero del plan.'
        },
        {
            title: 'Nuevo Pago',
            content: 'Use el botón azul "+ Nuevo Pago". Debe seleccionar el Paciente y la Proforma asociada.'
        },
        {
            title: 'Formas de Pago',
            content: 'Puede registrar pagos en Efectivo, Tarjeta, QR, Transferencia, Cheque o Depósito. Si es en Dólares, el sistema registra el tipo de cambio.'
        },
        {
            title: 'Recibos y Facturas',
            content: 'Es importante registrar el número de Recibo o Factura para la contabilidad.'
        }
    ];

    useEffect(() => {
        fetchPagos();
        fetchProformas();
    }, []);

    const fetchPagos = async () => {
        try {
            const response = await api.get('/pagos');
            setPagos(response.data || []);
        } catch (error) {
            console.error('Error fetching pagos:', error);
        }
    };

    const fetchProformas = async () => {
        try {
            const response = await api.get('/proformas?limit=1000');
            setProformas(response.data || []);
        } catch (error) {
            console.error('Error fetching proformas:', error);
        }
    };

    const fetchHistoria = async (pacienteId: number) => {
        try {
            const response = await api.get(`/historia-clinica/paciente/${pacienteId}`);
            setHistoria(response.data || []);
        } catch (error) {
            console.error('Error fetching historia:', error);
            setHistoria([]);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
        if (selectedProformaId > 0) {
            const selProf = proformas.find(p => p.id === selectedProformaId);
            if (selProf && selProf.pacienteId) {
                fetchHistoria(selProf.pacienteId);
            } else {
                setHistoria([]);
            }
        } else {
            setHistoria([]);
        }
    }, [selectedProformaId, proformas]);

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
                fetchPagos();
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

        doc.setDrawColor(0); // Reset for signatures
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
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.src = String(blobUrl);
        document.body.appendChild(iframe);
    };

    // Filter pagos by selected proforma
    const proformaPagos = selectedProformaId > 0
        ? pagos.filter(p => p.proformaId === selectedProformaId || p.proforma?.id === selectedProformaId)
        : [];

    const filteredPagos = proformaPagos.filter(pago => {
        const term = searchTerm.toLowerCase();
        const pacienteName = pago.paciente ? `${pago.paciente.paterno} ${pago.paciente.materno || ''} ${pago.paciente.nombre}`.toLowerCase() : '';
        const recibo = pago.recibo?.toLowerCase() || '';
        const factura = pago.factura?.toLowerCase() || '';
        return pacienteName.includes(term) || recibo.includes(term) || factura.includes(term);
    });

    // Reset to first page when search term changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredPagos.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredPagos.length / itemsPerPage);

    return (
        <div className="content-card">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 no-print gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-2xl shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
                            Lista de Pagos
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                            Abonos de pacientes, recibos expedidos y estado de planes de tratamiento
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
                            setSelectedPagoId(null);
                            setIsFormOpen(true);
                        }}
                        className="bg-[#3498db] hover:bg-blue-600 text-white font-semibold py-2 px-5 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 text-sm"
                    >
                        <span className="text-xl">+</span> Nuevo Pago
                    </button>
                </div>
            </div>

            {/* Proforma Selection Dropdown */}
            <div className="mb-6 flex flex-wrap items-center gap-3 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                <label className="font-bold text-gray-700 dark:text-gray-300">Seleccione el Plan de Tratamiento:</label>
                <select
                    value={selectedProformaId}
                    onChange={(e) => setSelectedProformaId(Number(e.target.value))}
                    className="p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm flex-grow max-w-xl cursor-pointer"
                >
                    <option value={0}>-- Seleccione un Plan de Tratamiento --</option>
                    {proformas.map(p => {
                        const pacienteNombre = p.paciente ? `${p.paciente.paterno} ${p.paciente.materno || ''} ${p.paciente.nombre}` : '';
                        return (
                            <option key={p.id} value={p.id}>
                                Plan #{p.numero || p.id} - {pacienteNombre} - {formatDateUTC(p.fecha)}
                            </option>
                        );
                    })}
                </select>
            </div>

            {/* If no plan selected, show message only */}
            {selectedProformaId === 0 ? (
                <div className="mb-6 p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400 flex-shrink-0">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                        <span className="font-semibold">ℹ️ Por favor, seleccione un Plan de Tratamiento</span> para ver la lista de pagos y el resumen financiero.
                    </p>
                </div>
            ) : (
                <>
                    {/* Search Bar */}
                    <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 no-print">
                        <div className="relative flex-grow max-w-md">
                            <input
                                type="text"
                                placeholder="Buscar por Paciente, Recibo o Factura..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-300"
                            />
                            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                        </div>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded"
                            >
                                Limpiar
                            </button>
                        )}
                    </div>

                    {/* Record Count Indicator */}
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium">
                        Mostrando {filteredPagos.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredPagos.length)} de {filteredPagos.length} registros
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Paciente</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monto</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Moneda</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Forma Pago</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Recibo/Factura</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {currentItems.map((pago) => {
                                    const isDollar = pago.moneda === 'Dólares';

                                    return (
                                        <tr key={pago.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <td className="p-3 text-gray-700 dark:text-gray-300">{formatDate(pago.fecha)}</td>
                                            <td className="p-3 text-gray-700 dark:text-gray-300">
                                                {pago.paciente ? `${pago.paciente.paterno} ${pago.paciente.materno || ''} ${pago.paciente.nombre}` : '-'}
                                            </td>
                                            <td className="p-3 font-bold text-blue-600 dark:text-blue-400">
                                                {isDollar ? `USD ${formatCurrency(pago.monto)}` : `Bs. ${formatCurrency(pago.monto)}`}
                                            </td>
                                            <td className="p-3 text-gray-700 dark:text-gray-300 font-medium">
                                                {isDollar ? `Dólares (TC: ${formatCurrency(pago.tc || 6.96)})` : (pago.moneda || 'Bolivianos')}
                                            </td>
                                            <td className="p-3 text-gray-700 dark:text-gray-300">
                                                {pago.formaPagoRel ? pago.formaPagoRel.forma_pago : ''}
                                                {pago.formaPagoRel?.forma_pago?.toLowerCase() === 'tarjeta' && pago.comisionTarjeta && ` (${pago.comisionTarjeta.redBanco})`}
                                            </td>
                                            <td className="p-3 text-gray-700 dark:text-gray-300">
                                                {pago.recibo ? `R: ${pago.recibo}` : ''}
                                                {pago.recibo && pago.factura ? ' / ' : ''}
                                                {pago.factura ? `F: ${pago.factura}` : ''}
                                            </td>
                                            <td className="p-3 flex gap-2">
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
                                            No se encontraron pagos registrados para este plan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Financial Summary Card (Imagen 1 style) */}
                    {(() => {
                        const selectedProforma = proformas.find(p => p.id === selectedProformaId);
                        const totalPresupuesto = selectedProforma ? Number(selectedProforma.total || 0) : 0;

                        const filteredHistoria = historia.filter(h => h.proformaId === selectedProformaId && h.estadoTratamiento === 'terminado');

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

                        const totalPagado = proformaPagos.reduce((acc, curr) => {
                            const val = curr.moneda === 'Dólares'
                                ? Number(curr.monto || 0) * (Number(curr.tc) || 6.96)
                                : Number(curr.monto || 0);
                            return acc + val;
                        }, 0);

                        const saldo = totalPagado - totalEjecutado;

                        return (
                            <div className="mt-6 bg-[#1f2937] dark:bg-gray-800 p-5 md:p-6 rounded-2xl border border-gray-700/80 shadow-md">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-8 text-center">
                                    <div>
                                        <div className="text-xs md:text-sm font-medium text-gray-400 mb-1">Total Presupuesto</div>
                                        <div className="text-lg md:text-xl font-bold text-blue-400">Bs. {formatCurrency(totalPresupuesto)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs md:text-sm font-medium text-gray-400 mb-1">Total Ejecutado</div>
                                        <div className="text-lg md:text-xl font-bold text-white">Bs. {formatCurrency(totalEjecutado)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs md:text-sm font-medium text-gray-400 mb-1">Total Pagado</div>
                                        <div className="text-lg md:text-xl font-bold text-white">Bs. {formatCurrency(totalPagado)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs md:text-sm font-medium text-gray-400 mb-1">Saldo</div>
                                        <div className={`text-lg md:text-xl font-bold ${saldo > 0 ? 'text-green-400' : saldo < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                            Bs. {formatCurrency(saldo)}
                                        </div>
                                    </div>
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

            {/* PagosForm Modal */}
            <PagosForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                id={selectedPagoId}
                defaultProformaId={selectedProformaId}
                onSaveSuccess={() => {
                    fetchPagos();
                    setIsFormOpen(false);
                }}
            />

            {/* Manual Modal */}
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Pagos"
                sections={manualSections}
            />
        </div>
    );
};

export default PagosList;

