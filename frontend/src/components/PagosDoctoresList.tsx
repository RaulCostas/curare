import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../services/api';
import { CreditCard, X } from 'lucide-react';

import { formatDate, formatDateUTC } from '../utils/dateUtils';
import { formatCurrency } from '../utils/formatters';
import ManualModal, { type ManualSection } from './ManualModal';
import Pagination from './Pagination';
import PagosDoctoresForm from './PagosDoctoresForm';

const PagosDoctoresList = () => {
    const [pagos, setPagos] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showManual, setShowManual] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    // Modal state for PagosDoctoresForm
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedPagoDoctorId, setSelectedPagoDoctorId] = useState<number | null>(null);

    // Cancelled patients modal state
    const [showCancelledModal, setShowCancelledModal] = useState(false);
    const [cancelledTreatments, setCancelledTreatments] = useState([]);
    const [patientSearch, setPatientSearch] = useState('');
    const [cancelledCurrentPage, setCancelledCurrentPage] = useState(1);
    const cancelledLimit = 10;

    const manualSections: ManualSection[] = [
        {
            title: 'Pagos a Doctores',
            content: 'Registro de pagos por porcentajes/comisiones de tratamientos realizados por doctores.'
        },
        {
            title: 'Nuevo Pago',
            content: 'Al crear un nuevo pago, seleccione el Doctor y el sistema calculará automáticamente sus comisiones pendientes según los tratamientos realizados.'
        },
        {
            title: 'Acciones Disponibles',
            content: '**Imprimir (morado):** Imprime un recibo de pago formal para el doctor.\n\n**WhatsApp (verde):** Envía el recibo de pago en PDF directamente al celular del doctor vía WhatsApp (requiere chatbot conectado).\n\n**Editar (amarillo):** Modifica los datos del pago.\n\n**Eliminar (rojo):** Elimina el registro de pago.'
        },
        {
            title: 'Envío por WhatsApp',
            content: 'Para usar la función de WhatsApp, el chatbot debe estar conectado desde Configuración > Chatbot (WhatsApp). El PDF del recibo se enviará automáticamente al número de celular del doctor con un mensaje personalizado.'
        },
        {
            title: 'Pacientes Cancelados',
            content: 'El botón rojo "Pacientes Cancelados" abre una ventana con el listado de todos los tratamientos que han sido pagados al doctor (historia clínica marcada como pagada). Permite filtrar por nombre de paciente y ver detalles como fecha de pago, tratamiento, costos y descuentos.'
        }
    ];

    useEffect(() => {
        fetchPagos();
    }, [currentPage, searchTerm]);

    const fetchPagos = async () => {
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: limit.toString(),
            });

            if (searchTerm) {
                params.append('search', searchTerm);
            }

            const response = await api.get(`/pagos-doctores?${params}`);
            const dataArray = response.data.data || response.data;
            setPagos(dataArray);
            setTotalPages(response.data.totalPages || 1);
            setTotal(response.data.total || (Array.isArray(dataArray) ? dataArray.length : 0));
        } catch (error) {
            console.error('Error fetching pagos:', error);
            Swal.fire('Error', 'No se pudieron cargar los pagos', 'error');
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "¡No podrás revertir esto!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/pagos-doctores/${id}`);
                setPagos(pagos.filter((p: any) => p.id !== id));
                Swal.fire('¡Eliminado!', 'El pago ha sido eliminado.', 'success');
            } catch (error) {
                console.error('Error deleting pago:', error);
                Swal.fire('Error', 'No se pudo eliminar el pago', 'error');
            }
        }
    };



    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const fetchCancelledTreatments = async () => {
        try {
            const response = await api.get('/historia-clinica/cancelados');
            setCancelledTreatments(response.data || []);
            setCancelledCurrentPage(1);
            setPatientSearch('');
            setShowCancelledModal(true);
        } catch (error) {
            console.error('Error fetching cancelled treatments:', error);
            Swal.fire('Error', 'No se pudieron cargar los pacientes cancelados', 'error');
        }
    };

    const filteredCancelledTreatments = cancelledTreatments.filter((t: any) => {
        if (!patientSearch) return true;
        const search = patientSearch.toLowerCase();
        const fullName = `${t.paciente?.paterno || ''} ${t.paciente?.materno || ''} ${t.paciente?.nombre || ''}`.toLowerCase();
        const trat = (t.tratamiento || '').toLowerCase();
        const doc = `${t.doctor?.paterno || ''} ${t.doctor?.nombre || ''}`.toLowerCase();
        return fullName.includes(search) || trat.includes(search) || doc.includes(search);
    });

    const cancelledTotal = filteredCancelledTreatments.length;
    const cancelledTotalPages = Math.ceil(cancelledTotal / cancelledLimit) || 1;
    const paginatedCancelledTreatments = filteredCancelledTreatments.slice(
        (cancelledCurrentPage - 1) * cancelledLimit,
        cancelledCurrentPage * cancelledLimit
    );

    const handleWhatsApp = async (pago: any) => {
        if (!pago.doctor?.celular) {
            Swal.fire('Atención', 'El doctor no tiene número de celular registrado', 'warning');
            return;
        }

        // Show loading
        Swal.fire({
            title: 'Enviando...',
            text: 'Enviando recibo de pago por WhatsApp',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const response = await api.post(`/pagos-doctores/${pago.id}/send-whatsapp`);

            Swal.fire({
                icon: 'success',
                title: '¡Enviado!',
                text: response.data.message || 'Recibo enviado por WhatsApp exitosamente',
                timer: 3000,
                showConfirmButton: false
            });
        } catch (error: any) {
            console.error('Error sending WhatsApp:', error);

            let errorMessage = 'No se pudo enviar el recibo por WhatsApp';

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



    const handlePrint = async (pagoSummary: any) => {
        try {
            // 1. Fetch full details
            const response = await api.get(`/pagos-doctores/${pagoSummary.id}`);
            const pago = response.data;
            const isDollar = ['Dólares', '$us', 'Sus', 'USD'].includes(pago.moneda);
            const currencySymbol = isDollar ? '$us' : 'Bs';

            const dateStr = new Date(pago.fecha).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

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

            // Generate rows for the table
            const tableRows = pago.detalles?.map((d: any) => {
                const hc = d.historiaClinica;
                const paciente = hc?.paciente 
                    ? `${hc.paciente.paterno || ''} ${hc.paciente.materno || ''} ${hc.paciente.nombre || ''}`.trim() || `${hc.paciente.nombre} ${hc.paciente.paterno}`
                    : 'Desconocido';
                return `
                    <tr>
                        <td style="font-size: 10px;">${paciente}</td>
                        <td style="font-size: 10px;">${hc?.tratamiento || '-'}</td>
                        <td style="font-size: 10px; text-align: center;">${hc?.pieza || '-'}</td>
                        <td style="font-size: 10px; text-align: right;">${formatCurrency(hc?.precio || 0)}</td>
                        <td style="font-size: 10px; text-align: right; color: #e74c3c;">${d.descuento > 0 ? `-${formatCurrency(d.descuento)}%` : '-'}</td>
                        <td style="font-size: 10px; text-align: right; color: #e74c3c;">${d.costo_laboratorio > 0 ? `-${formatCurrency(d.costo_laboratorio)}` : '-'}</td>
                        <td style="font-size: 10px; text-align: right; font-weight: bold;">${formatCurrency(d.total)}</td>
                    </tr>
                `;
            }).join('') || '';

            const finalTableRows = tableRows || `
                <tr>
                    <td style="font-size: 10px;">Resumen de Pago</td>
                    <td style="font-size: 10px;">Pago a Doctor según registro</td>
                    <td style="font-size: 10px; text-align: center;">-</td>
                    <td style="font-size: 10px; text-align: right;">${formatCurrency(pago.total)}</td>
                    <td style="font-size: 10px; text-align: right;">-</td>
                    <td style="font-size: 10px; text-align: right;">-</td>
                    <td style="font-size: 10px; text-align: right; font-weight: bold;">${formatCurrency(pago.total)}</td>
                </tr>
            `;

            const doctorNombre = pago.doctor 
                ? `${pago.doctor.paterno || ''} ${pago.doctor.materno || ''} ${pago.doctor.nombre || ''}`.trim() 
                : 'No especificado';

            const subtotalSum = Array.isArray(pago.detalles) && pago.detalles.length > 0
                ? pago.detalles.reduce((sum: number, d: any) => sum + (Number(d.total) || 0), 0)
                : Number(pago.total) || 0;

            const commissionAmount = pago.comision > 0
                ? (subtotalSum * Number(pago.comision)) / 100
                : 0;

            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Recibo de Pago - ${pago.id}</title>
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

                        .receipt-number {
                            font-size: 14px;
                            color: #7f8c8d;
                            margin-top: 5px;
                        }
                        
                        /* Info Box Style to match Recetario/Historia */
                        .info-box {
                            background-color: #f8f9fa;
                            border-left: 4px solid #3498db;
                            padding: 15px;
                            margin-bottom: 20px;
                        }

                        .info-row {
                            display: flex;
                            margin-bottom: 8px;
                        }
                        
                        .info-col {
                            flex: 1;
                            display: flex;
                            flex-direction: column;
                        }

                        .info-label {
                            font-weight: bold;
                            color: #2c3e50;
                            font-size: 11px;
                            margin-bottom: 2px;
                        }
                        
                        .info-value {
                            color: #333;
                            font-size: 11px;
                        }
                        
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 10px;
                            font-size: 11px;
                        }
                        
                        th {
                            background-color: #3498db;
                            color: white;
                            padding: 8px;
                            text-align: left;
                            font-weight: bold;
                            border: 1px solid #2980b9;
                            font-size: 10px;
                        }
                        
                        td {
                            padding: 6px 8px;
                            border: 1px solid #ddd;
                        }
                        
                        tr:nth-child(even) {
                            background-color: #f8f9fa;
                        }

                        .totals-section {
                            margin-top: 20px;
                            display: flex;
                            flex-direction: column;
                            align-items: flex-end;
                            font-size: 11px;
                        }

                        .total-row {
                            display: flex;
                            justify-content: flex-end;
                            margin-bottom: 5px;
                            min-width: 250px;
                        }

                        .total-label {
                            font-weight: bold;
                            margin-right: 15px;
                            color: #2c3e50;
                        }

                        .total-value {
                            text-align: right;
                            width: 100px;
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

                        .signature-section {
                            margin-top: 50px;
                            display: flex;
                            justify-content: center;
                        }

                        .signature-line {
                            border-top: 1px solid #000;
                            width: 200px;
                            text-align: center;
                            padding-top: 5px;
                            font-size: 12px;
                        }
                        
                        @media print {
                            body { margin: 0; }
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
                        <div>
                            <h1>RECIBO DE PAGO A DOCTOR</h1>
                            <div class="receipt-number">Nº Recibo: ${String(pago.id).padStart(6, '0')}</div>
                        </div>
                    </div>
                    
                    <div class="info-box">
                        <div class="info-row">
                            <div class="info-col">
                                <span class="info-label">DOCTOR:</span>
                                <span class="info-value">${doctorNombre}</span>
                            </div>
                            <div class="info-col">
                                <span class="info-label">FECHA DE PAGO:</span>
                                <span class="info-value">${dateStr}</span>
                            </div>
                        </div>
                        <div class="info-row">
                            <div class="info-col">
                                <span class="info-label">FORMA DE PAGO:</span>
                                <span class="info-value">${pago.formaPago?.forma_pago || 'No especificado'}${pago.banco ? ` (${pago.banco})` : ''}</span>
                            </div>
                            <div class="info-col">
                                <span class="info-label">MONEDA:</span>
                                <span class="info-value">${pago.moneda || 'Bs'}</span>
                            </div>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Paciente</th>
                                <th>Tratamiento</th>
                                <th style="text-align: center;">Pieza</th>
                                <th style="text-align: right;">Precio</th>
                                <th style="text-align: right;">Desc.</th>
                                <th style="text-align: right;">Lab.</th>
                                <th style="text-align: right;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${finalTableRows}
                        </tbody>
                    </table>

                    <div class="totals-section">
                        <div class="total-row">
                            <span class="total-label">Subtotal:</span>
                            <span class="total-value">${formatCurrency(subtotalSum)} ${currencySymbol}</span>
                        </div>
                        ${pago.comision > 0 ? `
                        <div class="total-row">
                            <span class="total-label">Comisión (${formatCurrency(pago.comision)}%):</span>
                            <span class="total-value" style="color: #e74c3c;">-${formatCurrency(commissionAmount)}</span>
                        </div>
                        ` : ''}
                        <div class="total-row" style="font-size: 14px; margin-top: 5px;">
                            <span class="total-label">Total Pagado:</span>
                            <span class="total-value" style="font-weight: bold;">${formatCurrency(pago.total)} ${currencySymbol}</span>
                        </div>
                    </div>

                    <div class="signature-section">
                        <div class="signature-line">
                            Firma y Sello
                        </div>
                    </div>

                    <div class="footer">
                        <div class="footer-line"></div>
                        <div class="footer-content">
                            <div class="footer-info">
                                <div>Fecha de impresión: ${new Date().toLocaleString('es-ES')}</div>
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
                setTimeout(() => {
                    iframe.contentWindow?.focus();
                    iframe.contentWindow?.print();
                    setTimeout(() => {
                        if (document.body.contains(iframe)) {
                            document.body.removeChild(iframe);
                        }
                    }, 1000);
                }, 500);
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
            console.error('Error printing payment:', error);
            Swal.fire('Error', 'No se pudieron cargar los detalles para imprimir', 'error');
        }
    };

    return (
        <div className="content-card p-6 bg-gray-50 dark:bg-gray-800 min-h-screen text-gray-800 dark:text-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl shadow-sm">
                        <CreditCard className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
                            Pagos a Doctores
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                            Gestión de pagos por tratamientos realizados y liquidación de honorarios
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-500 p-2 rounded-full w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>
                    <button
                        onClick={() => {
                            setSelectedPagoDoctorId(null);
                            setIsFormOpen(true);
                        }}
                        className="bg-[#3498db] hover:bg-blue-600 text-white font-semibold py-2 px-5 rounded-xl flex items-center gap-2 transition-all transform hover:-translate-y-0.5 shadow-md text-sm"
                    >
                        <span className="text-xl">+</span> Nuevo Pago
                    </button>
                </div>
            </div>

            <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                <div className="flex items-center gap-2 flex-grow max-w-md">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Buscar por doctor..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 text-sm"
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
                            className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-xs flex items-center gap-1 shrink-0"
                            title="Limpiar búsqueda"
                        >
                            <X size={14} />
                            <span>Limpiar</span>
                        </button>
                    )}
                </div>

                <button
                    onClick={fetchCancelledTreatments}
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg transition-all transform hover:-translate-y-0.5 shadow-sm text-sm"
                >
                    Pacientes Cancelados
                </button>
            </div>

            <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                Mostrando {total === 0 ? 0 : (currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, total)} de {total} registros
            </div>

            <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Doctor</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Forma de Pago</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Comisión</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {Array.isArray(pagos) && pagos.map((pago: any, index: number) => (
                            <tr key={pago.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                                <td className="p-4 text-center text-gray-500 dark:text-gray-400 font-mono">{(currentPage - 1) * limit + index + 1}</td>
                                <td className="p-4 font-medium text-gray-800 dark:text-white">{pago.doctor?.paterno} {pago.doctor?.materno} {pago.doctor?.nombre}</td>
                                <td className="p-4 text-gray-600 dark:text-gray-300">{formatDateUTC(pago.fecha)}</td>
                                <td className="p-4">
                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                                        {pago.formaPago?.forma_pago}{pago.banco ? ` (${pago.banco})` : ''}
                                    </span>
                                </td>
                                <td className="p-4 text-right font-medium text-gray-600 dark:text-gray-400">{Number(pago.comision).toFixed(2)}%</td>
                                <td className="p-4 text-right font-bold text-green-600 dark:text-green-400">
                                    {['Dólares', '$us', 'Sus', 'USD'].includes(pago.moneda) ? '$us' : 'Bs'} {formatCurrency(pago.total)}
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex justify-center items-center gap-2">
                                        <button
                                            onClick={() => handlePrint(pago)}
                                            className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all transform hover:-translate-y-0.5 shadow-md"
                                            title="Imprimir"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                                <rect x="6" y="14" width="12" height="8"></rect>
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleWhatsApp(pago)}
                                            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all transform hover:-translate-y-0.5 shadow-md"
                                            title="Enviar por WhatsApp"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedPagoDoctorId(pago.id);
                                                setIsFormOpen(true);
                                            }}
                                            className="p-2 bg-amber-400 hover:bg-amber-500 text-white rounded-lg transition-all transform hover:-translate-y-0.5 shadow-md"
                                            title="Editar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(pago.id)}
                                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all transform hover:-translate-y-0.5 shadow-md"
                                            title="Eliminar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {pagos.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-gray-500 dark:text-gray-400 italic">No se encontraron pagos registrados.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            )}

            {/* Manual Modal */}
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Pagos Doctores"
                sections={manualSections}
            />

            {/* Cancelled Patients Modal */}
            {showCancelledModal && (
                <div className="fixed inset-0 z-[9999] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/80 transition-opacity" aria-hidden="true" onClick={() => setShowCancelledModal(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-7xl sm:w-full border border-gray-100 dark:border-gray-700">

                            {/* Header */}
                            <div className="bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2" id="modal-title">
                                    <span className="p-2 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 rounded-xl">
                                        <CreditCard className="w-5 h-5" />
                                    </span>
                                    Pacientes con Tratamientos Cancelados
                                </h3>
                            </div>

                            {/* Body */}
                            <div className="p-6">
                                {/* Search bar */}
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 max-w-md w-full">
                                        <div className="relative flex-grow">
                                            <input
                                                type="text"
                                                placeholder="Buscar por paciente, tratamiento o doctor..."
                                                value={patientSearch}
                                                onChange={(e) => {
                                                    setPatientSearch(e.target.value);
                                                    setCancelledCurrentPage(1);
                                                }}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                            />
                                            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                            </svg>
                                        </div>
                                        {patientSearch && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPatientSearch('');
                                                    setCancelledCurrentPage(1);
                                                }}
                                                className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-xs flex items-center gap-1 shrink-0"
                                                title="Limpiar búsqueda"
                                            >
                                                <X size={14} />
                                                <span>Limpiar</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Records Count (Above Table) */}
                                <div className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Mostrando {cancelledTotal === 0 ? 0 : (cancelledCurrentPage - 1) * cancelledLimit + 1} - {Math.min(cancelledCurrentPage * cancelledLimit, cancelledTotal)} de {cancelledTotal} registros
                                </div>

                                {/* Table */}
                                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl mb-4">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">F. Pago</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">F. Historia</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Paciente</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Doctor</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tratamiento</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Piezas</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cant.</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider"># Presup.</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Costo Lab.</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">F. Pago Pac.</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Forma Pago</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Descuento</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {paginatedCancelledTreatments.length > 0 ? (
                                                paginatedCancelledTreatments.map((item: any) => (
                                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                        <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-600 dark:text-gray-300">
                                                            {item.fechaPagoDoctor ? formatDateUTC(item.fechaPagoDoctor) : '-'}
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-600 dark:text-gray-300">
                                                            {formatDateUTC(item.fecha)}
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-xs font-medium text-gray-800 dark:text-white">
                                                            {`${item.paciente?.paterno || ''} ${item.paciente?.materno || ''} ${item.paciente?.nombre || ''}`.trim() || `${item.paciente?.nombre || ''} ${item.paciente?.apellidop || ''}`}
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-600 dark:text-gray-300">
                                                            {`${item.doctor?.paterno || ''} ${item.doctor?.nombre || ''}`.trim()}
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-600 dark:text-gray-300">
                                                            {item.tratamiento || 'N/A'}
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-center text-xs text-gray-600 dark:text-gray-300">
                                                            {item.pieza || '-'}
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-center text-xs text-gray-600 dark:text-gray-300">
                                                            {item.cantidad || 1}
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-center text-xs text-gray-600 dark:text-gray-300">
                                                            {item.numeroPresupuesto || '-'}
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-right text-xs text-gray-600 dark:text-gray-300">
                                                            {formatCurrency(item.costoLaboratorio || 0)}
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-600 dark:text-gray-300">
                                                            {item.fechaPagoPaciente ? formatDateUTC(item.fechaPagoPaciente) : '-'}
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-600 dark:text-gray-300">
                                                            {item.formaPagoPaciente || '-'}
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-right text-xs text-gray-600 dark:text-gray-300">
                                                            {item.descuento ? `${formatCurrency(item.descuento)}%` : '0%'}
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap text-right text-xs font-bold text-green-600 dark:text-green-400">
                                                            {formatCurrency(item.precio || 0)}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={13} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 italic">
                                                        No se encontraron tratamientos cancelados
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Centered in Modal */}
                                {cancelledTotalPages > 1 && (
                                    <div className="flex justify-center mt-4">
                                        <Pagination
                                            currentPage={cancelledCurrentPage}
                                            totalPages={cancelledTotalPages}
                                            onPageChange={(page) => setCancelledCurrentPage(page)}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-t border-gray-200 dark:border-gray-600 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowCancelledModal(false)}
                                    className="px-5 py-2.5 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm flex items-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    <span>Cerrar</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* PagosDoctoresForm Drawer */}
            <PagosDoctoresForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                id={selectedPagoDoctorId}
                onSaveSuccess={() => {
                    fetchPagos();
                    setIsFormOpen(false);
                }}
            />
        </div>
    );
};

export default PagosDoctoresList;
