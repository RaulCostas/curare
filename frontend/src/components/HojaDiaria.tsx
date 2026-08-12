import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import ManualModal, { type ManualSection } from './ManualModal';
import { formatCurrency, isDollarCurrency, formatPaternoMaternoNombre } from '../utils/formatters';
import { formatDate, getLocalDateString } from '../utils/dateUtils';
import Pagination from './Pagination';

// Interfaces
interface Ingreso {
    id: number;
    fecha: string;
    monto: number;
    moneda: string;
    observaciones: string;
    paciente: { nombre: string; paterno: string; materno?: string };
    proforma?: { numero: number };
    formaPagoRel?: { forma_pago: string };
    comisionTarjeta?: { redBanco: string; monto: number }; // Updated interface
    tc?: number; // Added TC
    recibo?: string;
    factura?: string;
}

interface Egreso {
    id: number;
    fecha: string;
    destino: string; // 'Consultorio' | 'Casa'
    detalle: string;
    monto: number;
    moneda: string;
    formaPago?: { forma_pago: string };
}

interface PagoDoctor {
    id: number;
    fecha: string;
    total: number;
    moneda: string;
    doctor: { nombre: string; paterno: string; materno?: string };
    formaPago: { forma_pago: string };
}

interface PagoLaboratorio {
    id: number;
    fecha: string;
    moneda: string;
    monto: number;
    trabajoLaboratorio: {
        laboratorio: { laboratorio: string };
        precioLaboratorio: { detalle: string; precio: number };
        paciente: { nombre: string; paterno: string; materno?: string };
        total: number;
    };
    formaPago: { forma_pago: string };
}

interface PagoPedido {
    id: number;
    fecha: string;
    monto: number;
    moneda: string;
    pedido: {
        proveedor: { nombre: string; proveedor: string };
        descripcion: string;
        Observaciones: string;
    };
    forma_pago?: string;
    factura?: string;
    recibo?: string;
}

interface PagoGastoFijo {
    id: number;
    fecha: string;
    monto: number;
    moneda: string;
    gastoFijo: { destino: string; gasto_fijo: string };
    formaPago: { forma_pago: string };
    observaciones?: string;
}

const HojaDiaria: React.FC = () => {
    // State
    const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
    const [calendarValue, setCalendarValue] = useState<any>(new Date());
    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Hoja Diaria',
            content: 'Resumen de movimientos financieros del día o rango de fechas seleccionado.'
        },
        {
            title: 'Pestañas',
            content: 'Navegue entre Ingresos, Egresos Diarios (Consultorio/Casa), Pagos a Doctores, Laboratorios y Gastos Fijos (Consultorio/Casa).'
        },
        {
            title: 'Búsqueda',
            content: 'Puede ver los datos de una fecha específica seleccionándola en el calendario, o buscar un rango de fechas usando el formulario de la derecha.'
        },
        {
            title: 'Impresión',
            content: 'Utilice el botón "Imprimir" para generar un reporte físico de la vista actual.'
        }
    ];

    // Range Search State
    const [rangeStart, setRangeStart] = useState<string>('');
    const [rangeEnd, setRangeEnd] = useState<string>('');
    const [searchMode, setSearchMode] = useState<'single' | 'range'>('single');

    const [activeTab, setActiveTab] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Data States
    const [ingresos, setIngresos] = useState<Ingreso[]>([]);
    const [egresos, setEgresos] = useState<Egreso[]>([]);
    const [pagosDoctores, setPagosDoctores] = useState<PagoDoctor[]>([]);
    const [pagosLaboratorios, setPagosLaboratorios] = useState<PagoLaboratorio[]>([]);
    const [pagosPedidos, setPagosPedidos] = useState<PagoPedido[]>([]);
    const [gastosFijosConsultorio, setGastosFijosConsultorio] = useState<PagoGastoFijo[]>([]);
    const [gastosFijosCasa, setGastosFijosCasa] = useState<PagoGastoFijo[]>([]);

    const [activeEgresosTab, setActiveEgresosTab] = useState<'Consultorio' | 'Casa'>('Consultorio');
    const [activeGastosFijosTab, setActiveGastosFijosTab] = useState<'Consultorio' | 'Casa'>('Consultorio');

    const tabs = [
        {
            label: "Ingresos",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5"></line>
                    <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
            )
        },
        {
            label: "Egresos Diarios",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <polyline points="19 12 12 19 5 12"></polyline>
                </svg>
            )
        },
        {
            label: "Pagos a Doctores",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            )
        },
        {
            label: "Pagos a Laboratorios",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 2v7.31"></path>
                    <path d="M14 2v7.31"></path>
                    <path d="M8.5 2h7"></path>
                    <path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path>
                </svg>
            )
        },
        {
            label: "Pagos de Pedidos",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
            )
        },
        {
            label: "Pagos Gastos Fijos",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                    <line x1="9" y1="22" x2="9" y2="22"></line>
                    <line x1="15" y1="22" x2="15" y2="22"></line>
                    <line x1="12" y1="18" x2="12" y2="18"></line>
                    <line x1="12" y1="14" x2="12" y2="14"></line>
                    <line x1="8" y1="10" x2="8" y2="10"></line>
                    <line x1="8" y1="6" x2="8" y2="6"></line>
                    <line x1="16" y1="10" x2="16" y2="10"></line>
                    <line x1="16" y1="6" x2="16" y2="6"></line>
                </svg>
            )
        }
    ];

    const fetchAllData = async (modeOverride?: 'single' | 'range') => {
        setLoading(true);
        try {
            const currentMode = modeOverride || searchMode;
            const params: any = {};
            if (currentMode === 'single') {
                params.fecha = selectedDate;
            } else {
                if (!rangeStart || !rangeEnd) {
                    Swal.fire('Atención', 'Seleccione ambas fechas para el rango', 'warning');
                    setLoading(false);
                    return;
                }
                params.startDate = rangeStart;
                params.endDate = rangeEnd;
            }

            // Note: Currently backend endpoints accept 'fecha' OR 'startDate'/'endDate'.
            // Ensure all backends support this. We verified Pagos, PagosDoctores, Laboratorios, Pedidos, GastosFijos, Egresos.

            // For Egresos, it uses limit=1000 by default in our previous code, let's keep it.
            const egresosParams = { ...params, limit: 1000 };

            const [
                resIngresos,
                resEgresos,
                resDoctores,
                resLaboratorios,
                resPedidos,
                resGastosFijos
            ] = await Promise.all([
                api.get('/pagos', { params }),
                api.get('/egresos', { params: egresosParams }),
                api.get('/pagos-doctores', { params }),
                api.get('/pagos-laboratorios', { params }),
                api.get('/pagos-pedidos', { params }),
                api.get('/pagos-gastos-fijos', { params })
            ]);

            setIngresos(Array.isArray(resIngresos.data) ? resIngresos.data : (resIngresos.data?.data || []));

            const rawEgresos = resEgresos.data;
            const egresosList = Array.isArray(rawEgresos) ? rawEgresos : (rawEgresos?.data || []);
            setEgresos(egresosList);

            setPagosDoctores(Array.isArray(resDoctores.data) ? resDoctores.data : (resDoctores.data?.data || []));
            setPagosLaboratorios(Array.isArray(resLaboratorios.data) ? resLaboratorios.data : (resLaboratorios.data?.data || []));
            setPagosPedidos(Array.isArray(resPedidos.data) ? resPedidos.data : (resPedidos.data?.data || []));

            const rawGastosFijos = resGastosFijos.data;
            const allGastosFijos: PagoGastoFijo[] = Array.isArray(rawGastosFijos) ? rawGastosFijos : (rawGastosFijos?.data || []);
            setGastosFijosConsultorio(allGastosFijos.filter(gf => {
                const dest = (gf.gastoFijo?.destino || 'consultorio').toLowerCase();
                return dest === 'consultorio';
            }));
            setGastosFijosCasa(allGastosFijos.filter(gf => {
                const dest = (gf.gastoFijo?.destino || '').toLowerCase();
                return dest === 'casa';
            }));

        } catch (error) {
            console.error("Error fetching Hoja Diaria:", error);
            Swal.fire('Error', 'No se pudieron cargar los datos.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Effect for single date change
    useEffect(() => {
        if (searchMode === 'single') {
            fetchAllData();
        }
    }, [selectedDate, searchMode]);

    // Reset pagination page on tab or date changes
    useEffect(() => {
        setCurrentPage(1);
        setSearchTerm('');
    }, [activeTab, activeEgresosTab, activeGastosFijosTab, selectedDate, rangeStart, rangeEnd, searchMode]);

    const handleCalendarChange = (value: any) => {
        setCalendarValue(value);
        if (value instanceof Date) {
            const year = value.getFullYear();
            const month = String(value.getMonth() + 1).padStart(2, '0');
            const day = String(value.getDate()).padStart(2, '0');
            setSelectedDate(`${year}-${month}-${day}`);
            setSearchMode('single'); // Switch to single mode
        }
    };

    const handleRangeSearch = () => {
        if (!rangeStart || !rangeEnd) {
            Swal.fire('Campos requeridos', 'Por favor seleccione fecha inicio y fecha fin', 'warning');
            return;
        }
        setSearchMode('range');
        fetchAllData('range');
    };

    // Helper function to generate filter info text
    const getFilterInfoText = (): string => {
        if (searchMode === 'single') {
            return `Fecha: ${formatDateDisplay(selectedDate)}`;
        } else {
            return `Rango: ${formatDateDisplay(rangeStart)} al ${formatDateDisplay(rangeEnd)}`;
        }
    };

    // Helper function to generate summary HTML
    const generateSummaryHTML = (summary: Summary): string => {
        const entries = Object.entries(summary);
        if (entries.length === 0) return '<p style="color: #666; font-style: italic;">No hay datos.</p>';

        const totalBs = entries.reduce((acc, [, totals]) => acc + totals.Bs, 0);
        const totalSus = entries.reduce((acc, [, totals]) => acc + totals.Sus, 0);

        return `
            <div style="background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-top: 20px;">
                <h3 style="font-size: 14px; font-weight: bold; color: #2c3e50; margin: 0 0 15px 0; border-bottom: 1px solid #ddd; padding-bottom: 8px;">Resumen por Forma de Pago</h3>
                ${entries.map(([method, totals]) => `
                    <div style="background-color: white; padding: 10px; margin-bottom: 8px; border-radius: 4px; border: 1px solid #e0e0e0;">
                        <div style="font-weight: bold; color: #333; margin-bottom: 5px;">${method}</div>
                        <div style="display: flex; justify-content: space-between; font-size: 11px;">
                            <span>Bs: <strong style="color: #2563eb;">${formatCurrency(totals.Bs)}</strong></span>
                            <span>$us: <strong style="color: #16a34a;">${formatCurrency(totals.Sus)}</strong></span>
                        </div>
                    </div>
                `).join('')}
                <div style="margin-top: 12px; padding-top: 12px; border-top: 2px solid #333; font-weight: bold;">
                    <div style="display: flex; justify-content: space-between; font-size: 12px;">
                        <span>Total Bs: ${formatCurrency(totalBs)}</span>
                        <span>Total $us: ${formatCurrency(totalSus)}</span>
                    </div>
                </div>
            </div>
        `;
    };

    const handlePrintIngresos = () => {
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

        const sortedIngresos = sortByFechaAsc(ingresos);
        const summary = calculateSummary(sortedIngresos, 'ingreso');
        const filterInfo = getFilterInfoText();
        const printDate = new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Ingresos - Hoja Diaria</title>
                <style>
                    @page {
                        size: A4 landscape;
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
                    
                    .filter-info {
                        background-color: #f8f9fa;
                        border-left: 4px solid #3498db;
                        padding: 12px 15px;
                        margin-bottom: 20px;
                        font-size: 12px;
                        color: #2c3e50;
                        font-weight: bold;
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                        font-size: 10px;
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
                    <h1>Ingresos - Hoja Diaria</h1>
                </div>
                
                <div class="filter-info">${filterInfo}</div>
                
                <table>
                    <thead>
                        <tr>
                            ${searchMode === 'range' ? '<th>Fecha</th>' : ''}
                            <th>Paciente</th>
                            <th>PRESUP.</th>
                            <th>Recibo/Factura</th>
                            <th>Monto</th>
                            <th>Forma Pago</th>
                            <th>Observaciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedIngresos.length === 0 ? `
                            <tr><td colspan="${searchMode === 'range' ? 7 : 6}" style="text-align: center; font-style: italic; color: #666;">No hay registros</td></tr>
                        ` : sortedIngresos.map(r => {
                            const method = r.formaPagoRel?.forma_pago || '';
                            const amount = getNetMontoIngreso(r);
                            const isDollar = isDollarCurrency(r.moneda);
                            const docInfo = renderReciboFactura(r.recibo, r.factura);
                            return `
                                <tr>
                                    ${searchMode === 'range' ? `<td>${formatDateDisplay(r.fecha.split('T')[0])}</td>` : ''}
                                    <td>${formatPaternoMaternoNombre(r.paciente)}</td>
                                    <td>${r.proforma?.numero || 'Generales'}</td>
                                    <td>${docInfo}</td>
                                    <td style="font-weight: bold; color: #16a34a;">${formatMoney(amount, r.moneda)}${isDollar && r.tc ? ` (TC ${formatCurrency(r.tc)})` : ''}</td>
                                    <td>${method}${method.toLowerCase() === 'tarjeta' && r.comisionTarjeta?.redBanco ? ` (${r.comisionTarjeta.redBanco})` : ''}</td>
                                    <td>${r.observaciones || '-'}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>

                ${generateSummaryHTML(summary)}

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

    const handlePrintEgresos = () => {
        const filteredEgresos = egresos.filter(e => {
            const dest = (e.destino || 'consultorio').toLowerCase();
            return dest === activeEgresosTab.toLowerCase();
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

        const summary = calculateSummary(filteredEgresos, 'egreso');
        const filterInfo = getFilterInfoText();
        const printDate = new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Egresos Diarios (${activeEgresosTab}) - Hoja Diaria</title>
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
                    
                    .filter-info {
                        background-color: #f8f9fa;
                        border-left: 4px solid #3498db;
                        padding: 12px 15px;
                        margin-bottom: 20px;
                        font-size: 12px;
                        color: #2c3e50;
                        font-weight: bold;
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
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
                    <h1>Egresos Diarios (${activeEgresosTab})</h1>
                </div>
                
                <div class="filter-info">${filterInfo}</div>
                
                <table>
                    <thead>
                        <tr>
                            ${searchMode === 'range' ? '<th>Fecha</th>' : ''}
                            <th>Detalle</th>
                            <th>Monto</th>
                            <th>Forma Pago</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredEgresos.length === 0 ? `
                            <tr><td colspan="${searchMode === 'range' ? 4 : 3}" style="text-align: center; font-style: italic; color: #666;">No hay registros</td></tr>
                        ` : filteredEgresos.map(r => `
                            <tr>
                                ${searchMode === 'range' ? `<td>${formatDateDisplay(r.fecha.split('T')[0])}</td>` : ''}
                                <td>${r.detalle}</td>
                                <td style="font-weight: bold; color: #dc2626;">${formatMoney(Number(r.monto), r.moneda)}</td>
                                <td>${r.formaPago?.forma_pago || 'N/A'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                ${generateSummaryHTML(summary)}

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

    const handlePrintDoctores = () => {
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

        const summary = calculateSummary(pagosDoctores, 'doctor');
        const filterInfo = getFilterInfoText();
        const printDate = new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Pagos a Doctores - Hoja Diaria</title>
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
                    
                    .filter-info {
                        background-color: #f8f9fa;
                        border-left: 4px solid #3498db;
                        padding: 12px 15px;
                        margin-bottom: 20px;
                        font-size: 12px;
                        color: #2c3e50;
                        font-weight: bold;
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
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
                    <h1>Pagos a Doctores</h1>
                </div>
                
                <div class="filter-info">${filterInfo}</div>
                
                <table>
                    <thead>
                        <tr>
                            ${searchMode === 'range' ? '<th>Fecha</th>' : ''}
                            <th>Doctor</th>
                            <th>Monto Total</th>
                            <th>Forma Pago</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pagosDoctores.length === 0 ? `
                            <tr><td colspan="${searchMode === 'range' ? 4 : 3}" style="text-align: center; font-style: italic; color: #666;">No hay registros</td></tr>
                        ` : pagosDoctores.map(r => `
                            <tr>
                                ${searchMode === 'range' ? `<td>${formatDateDisplay(r.fecha.split('T')[0])}</td>` : ''}
                                <td>${formatPaternoMaternoNombre(r.doctor)}</td>
                                <td style="font-weight: bold; color: #dc2626;">${formatMoney(Number(r.total), r.moneda)}</td>
                                <td>${r.formaPago?.forma_pago || 'N/A'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                ${generateSummaryHTML(summary)}

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

    const handlePrintLaboratorios = () => {
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

        const summary = calculateSummary(pagosLaboratorios, 'laboratorio');
        const filterInfo = getFilterInfoText();
        const printDate = new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Pagos a Laboratorios - Hoja Diaria</title>
                <style>
                    @page {
                        size: A4 landscape;
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
                    
                    .filter-info {
                        background-color: #f8f9fa;
                        border-left: 4px solid #3498db;
                        padding: 12px 15px;
                        margin-bottom: 20px;
                        font-size: 12px;
                        color: #2c3e50;
                        font-weight: bold;
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                        font-size: 10px;
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
                    <h1>Pagos a Laboratorios</h1>
                </div>
                
                <div class="filter-info">${filterInfo}</div>
                
                <table>
                    <thead>
                        <tr>
                            ${searchMode === 'range' ? '<th>Fecha</th>' : ''}
                            <th>Laboratorio</th>
                            <th>Trabajo</th>
                            <th>Paciente</th>
                            <th>Monto</th>
                            <th>Forma Pago</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pagosLaboratorios.length === 0 ? `
                            <tr><td colspan="${searchMode === 'range' ? 6 : 5}" style="text-align: center; font-style: italic; color: #666;">No hay registros</td></tr>
                        ` : pagosLaboratorios.map(r => `
                            <tr>
                                ${searchMode === 'range' ? `<td>${formatDateDisplay(r.fecha.split('T')[0])}</td>` : ''}
                                <td>${r.trabajoLaboratorio?.laboratorio?.laboratorio || '-'}</td>
                                <td>${r.trabajoLaboratorio?.precioLaboratorio?.detalle || '-'}</td>
                                <td>${formatPaternoMaternoNombre(r.trabajoLaboratorio?.paciente)}</td>
                                <td style="font-weight: bold; color: #dc2626;">${formatMoney(Number(r.monto), r.moneda)}</td>
                                <td>${r.formaPago?.forma_pago || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                ${generateSummaryHTML(summary)}

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

    const handlePrintPedidos = () => {
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

        const summary = calculateSummary(pagosPedidos, 'pedido');
        const filterInfo = getFilterInfoText();
        const printDate = new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Pagos de Pedidos - Hoja Diaria</title>
                <style>
                    @page {
                        size: A4 landscape;
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
                    
                    .filter-info {
                        background-color: #f8f9fa;
                        border-left: 4px solid #3498db;
                        padding: 12px 15px;
                        margin-bottom: 20px;
                        font-size: 12px;
                        color: #2c3e50;
                        font-weight: bold;
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                        font-size: 10px;
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
                    <h1>Pagos de Pedidos</h1>
                </div>
                
                <div class="filter-info">${filterInfo}</div>
                
                <table>
                    <thead>
                        <tr>
                            ${searchMode === 'range' ? '<th>Fecha</th>' : ''}
                            <th>Proveedor</th>
                            <th>Recibo/Factura</th>
                            <th>Monto</th>
                            <th>Forma Pago</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pagosPedidos.length === 0 ? `
                            <tr><td colspan="${searchMode === 'range' ? 5 : 4}" style="text-align: center; font-style: italic; color: #666;">No hay registros</td></tr>
                        ` : pagosPedidos.map(r => `
                            <tr>
                                ${searchMode === 'range' ? `<td>${formatDateDisplay(r.fecha.split('T')[0])}</td>` : ''}
                                <td>${r.pedido?.proveedor?.proveedor || '-'}</td>
                                <td>${renderReciboFactura(r.recibo, r.factura)}</td>
                                <td style="font-weight: bold; color: #dc2626;">${formatMoney(Number(r.monto), 'Bolivianos')}</td>
                                <td>${r.forma_pago || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                ${generateSummaryHTML(summary)}

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

    const handlePrintGastosFijos = () => {
        const currentGastosData = activeGastosFijosTab === 'Consultorio' ? gastosFijosConsultorio : gastosFijosCasa;
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

        const summary = calculateSummary(currentGastosData, 'gasto');
        const filterInfo = getFilterInfoText();
        const printDate = new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Pagos Gastos Fijos (${activeGastosFijosTab}) - Hoja Diaria</title>
                <style>
                    @page {
                        size: A4 landscape;
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
                    
                    .filter-info {
                        background-color: #f8f9fa;
                        border-left: 4px solid #3498db;
                        padding: 12px 15px;
                        margin-bottom: 20px;
                        font-size: 12px;
                        color: #2c3e50;
                        font-weight: bold;
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                        font-size: 10px;
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
                    <h1>Pagos Gastos Fijos (${activeGastosFijosTab})</h1>
                </div>
                
                <div class="filter-info">${filterInfo}</div>
                
                <table>
                    <thead>
                        <tr>
                            ${searchMode === 'range' ? '<th>Fecha</th>' : ''}
                            <th>Gasto</th>
                            <th>Monto</th>
                            <th>Forma Pago</th>
                            <th>Observaciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${currentGastosData.length === 0 ? `
                            <tr><td colspan="${searchMode === 'range' ? 5 : 4}" style="text-align: center; font-style: italic; color: #666;">No hay registros</td></tr>
                        ` : currentGastosData.map(r => `
                            <tr>
                                ${searchMode === 'range' ? `<td>${formatDateDisplay(r.fecha.split('T')[0])}</td>` : ''}
                                <td>${r.gastoFijo?.gasto_fijo || '-'}</td>
                                <td style="font-weight: bold; color: #dc2626;">${formatMoney(Number(r.monto), r.moneda)}</td>
                                <td>${r.formaPago?.forma_pago || '-'}</td>
                                <td>${r.observaciones || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                ${generateSummaryHTML(summary)}

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

    const handlePrint = () => {
        switch (activeTab) {
            case 0:
                handlePrintIngresos();
                break;
            case 1:
                handlePrintEgresos();
                break;
            case 2:
                handlePrintDoctores();
                break;
            case 3:
                handlePrintLaboratorios();
                break;
            case 4:
                handlePrintPedidos();
                break;
            case 5:
                handlePrintGastosFijos();
                break;
            default:
                window.print();
        }
    };

    const renderReciboFactura = (recibo?: string, factura?: string) => {
        const r = recibo?.toString().trim();
        const f = factura?.toString().trim();
        if (r && f) return `${r} / ${f}`;
        if (r) return r;
        if (f) return f;
        return '-';
    };

    const formatMoney = (amount: number, currency: string = 'Bolivianos') => {
        const isDollar = isDollarCurrency(currency);
        const symbol = isDollar ? '$us' : 'Bs.';
        return `${formatCurrency(amount)} ${symbol}`;
    };

    const getNetMontoIngreso = (item: any): number => {
        const rawMonto = Number(item.monto) || 0;
        const comisionBs = Number(item.monto_comision) || 0;
        return rawMonto - comisionBs;
    };

    const utilitySummary = useMemo(() => {
        let ingresosBs = 0;
        let ingresosSus = 0;
        const ingresosByMethod: Record<string, { Bs: number; Sus: number }> = {};

        ingresos.forEach(item => {
            const amount = getNetMontoIngreso(item);
            const isDollar = isDollarCurrency(item.moneda);
            const method = item.formaPagoRel?.forma_pago || 'Otros';

            if (isDollar) ingresosSus += amount;
            else ingresosBs += amount;

            if (!ingresosByMethod[method]) ingresosByMethod[method] = { Bs: 0, Sus: 0 };
            if (isDollar) ingresosByMethod[method].Sus += amount;
            else ingresosByMethod[method].Bs += amount;
        });

        let egresosDiariosBs = 0, egresosDiariosSus = 0;
        egresos.forEach(e => {
            const amt = Number(e.monto) || 0;
            if (isDollarCurrency(e.moneda)) egresosDiariosSus += amt;
            else egresosDiariosBs += amt;
        });

        let pagosDoctoresBs = 0, pagosDoctoresSus = 0;
        pagosDoctores.forEach(pd => {
            const amt = Number(pd.total) || 0;
            if (isDollarCurrency(pd.moneda)) pagosDoctoresSus += amt;
            else pagosDoctoresBs += amt;
        });

        let pagosLaboratoriosBs = 0, pagosLaboratoriosSus = 0;
        pagosLaboratorios.forEach(pl => {
            const amt = Number(pl.monto) || 0;
            if (isDollarCurrency(pl.moneda)) pagosLaboratoriosSus += amt;
            else pagosLaboratoriosBs += amt;
        });

        let pagosPedidosBs = 0;
        pagosPedidos.forEach(pp => {
            const amt = Number(pp.monto) || 0;
            pagosPedidosBs += amt;
        });

        let gastosFijosBs = 0, gastosFijosSus = 0;
        [...gastosFijosConsultorio, ...gastosFijosCasa].forEach(gf => {
            const amt = Number(gf.monto) || 0;
            if (isDollarCurrency(gf.moneda)) gastosFijosSus += amt;
            else gastosFijosBs += amt;
        });

        const totalEgresosBs = egresosDiariosBs + pagosDoctoresBs + pagosLaboratoriosBs + pagosPedidosBs + gastosFijosBs;
        const totalEgresosSus = egresosDiariosSus + pagosDoctoresSus + pagosLaboratoriosSus + gastosFijosSus;

        const utilidadBs = ingresosBs - totalEgresosBs;
        const utilidadSus = ingresosSus - totalEgresosSus;

        return {
            ingresosBs,
            ingresosSus,
            ingresosByMethod,
            egresosDiariosBs,
            egresosDiariosSus,
            pagosDoctoresBs,
            pagosDoctoresSus,
            pagosLaboratoriosBs,
            pagosLaboratoriosSus,
            pagosPedidosBs,
            gastosFijosBs,
            gastosFijosSus,
            totalEgresosBs,
            totalEgresosSus,
            utilidadBs,
            utilidadSus
        };
    }, [ingresos, egresos, pagosDoctores, pagosLaboratorios, pagosPedidos, gastosFijosConsultorio, gastosFijosCasa]);

    // Summary Engine
    type Summary = Record<string, { Bs: number; Sus: number }>;

    const calculateSummary = (data: any[], type: 'ingreso' | 'egreso' | 'doctor' | 'laboratorio' | 'pedido' | 'gasto'): Summary => {
        const summary: Summary = {};

        data.forEach(item => {
            let paymentMethod = 'Desconocido';
            let amount = 0;
            let currency = 'Bolivianos';

            switch (type) {
                case 'ingreso':
                    paymentMethod = item.formaPagoRel?.forma_pago || 'N/A';
                    amount = getNetMontoIngreso(item);
                    currency = item.moneda || 'Bolivianos';
                    break;
                case 'egreso':
                    paymentMethod = item.formaPago?.forma_pago || 'N/A';
                    amount = Number(item.monto) || 0;
                    currency = item.moneda || 'Bolivianos';
                    break;
                case 'doctor':
                    paymentMethod = item.formaPago?.forma_pago || 'N/A';
                    amount = Number(item.total) || 0;
                    currency = item.moneda || 'Bolivianos';
                    break;
                case 'laboratorio':
                    paymentMethod = item.formaPago?.forma_pago || 'N/A';
                    amount = Number(item.monto) || 0;
                    currency = item.moneda || 'Bolivianos';
                    break;
                case 'pedido':
                    paymentMethod = item.forma_pago || 'N/A';
                    amount = Number(item.monto) || 0;
                    currency = item.moneda || 'Bolivianos';
                    break;
                case 'gasto':
                    paymentMethod = item.formaPago?.forma_pago || 'N/A';
                    amount = Number(item.monto) || 0;
                    currency = item.moneda || 'Bolivianos';
                    break;
            }

            if (!summary[paymentMethod]) {
                summary[paymentMethod] = { Bs: 0, Sus: 0 };
            }

            const isDollar = isDollarCurrency(currency);

            if (isDollar) {
                summary[paymentMethod].Sus += amount;
            } else {
                summary[paymentMethod].Bs += amount;
            }
        });

        return summary;
    };

    const renderSummary = (
        summary: Summary,
        type?: 'ingreso' | 'egreso' | 'doctor' | 'laboratorio' | 'pedido' | 'gasto',
        sortedData?: any[]
    ) => {
        let docSummary = {
            recibos: { Bs: 0, Sus: 0, count: 0 },
            facturas: { Bs: 0, Sus: 0, count: 0 },
            sinDoc: { Bs: 0, Sus: 0, count: 0 }
        };

        if (type === 'ingreso' && sortedData) {
            sortedData.forEach((item: Ingreso) => {
                const amount = getNetMontoIngreso(item);
                const isDollar = isDollarCurrency(item.moneda);
                const hasRecibo = Boolean(item.recibo && item.recibo.toString().trim() !== '' && item.recibo.toString().trim() !== '-');
                const hasFactura = Boolean(item.factura && item.factura.toString().trim() !== '' && item.factura.toString().trim() !== '-');

                if (hasRecibo) {
                    docSummary.recibos.count++;
                    if (isDollar) docSummary.recibos.Sus += amount;
                    else docSummary.recibos.Bs += amount;
                }
                if (hasFactura) {
                    docSummary.facturas.count++;
                    if (isDollar) docSummary.facturas.Sus += amount;
                    else docSummary.facturas.Bs += amount;
                }
                if (!hasRecibo && !hasFactura) {
                    docSummary.sinDoc.count++;
                    if (isDollar) docSummary.sinDoc.Sus += amount;
                    else docSummary.sinDoc.Bs += amount;
                }
            });
        }

        return (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm w-full md:w-80 flex-shrink-0 text-gray-800 dark:text-gray-200">
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-4 border-b dark:border-gray-700 pb-2">Resumen</h3>
                {Object.keys(summary).length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 italic">No hay datos.</p>
                ) : (
                    <ul className="space-y-3">
                        {Object.entries(summary).map(([method, totals], idx) => (
                            <li key={idx} className="flex flex-col bg-white dark:bg-gray-700 p-3 rounded border border-gray-100 dark:border-gray-600 shadow-sm">
                                <span className="font-semibold text-gray-800 dark:text-gray-200 mb-1">{method}</span>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-300">Bs: <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totals.Bs)}</span></span>
                                    <span className="text-gray-600 dark:text-gray-300">Sus: <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(totals.Sus)}</span></span>
                                </div>
                            </li>
                        ))}
                        <li className="pt-2 mt-2 border-t dark:border-gray-600 flex flex-col">
                            <span className="font-bold text-gray-900 dark:text-white">Total General</span>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-800 dark:text-gray-300">Bs: {formatCurrency(Object.values(summary).reduce((acc, v) => acc + v.Bs, 0))}</span>
                                <span className="text-gray-800 dark:text-gray-300">Sus: {formatCurrency(Object.values(summary).reduce((acc, v) => acc + v.Sus, 0))}</span>
                            </div>
                        </li>
                    </ul>
                )}

                {type === 'ingreso' && sortedData && sortedData.length > 0 && (
                    <div className="mt-5 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                            Documentos Registrados
                        </h4>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between items-center p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50">
                                <div>
                                    <div className="font-bold text-blue-800 dark:text-blue-300">Recibos ({docSummary.recibos.count})</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-extrabold text-blue-700 dark:text-blue-400">Bs: {formatCurrency(docSummary.recibos.Bs)}</div>
                                    {docSummary.recibos.Sus > 0 && <div className="text-green-600 dark:text-green-400 font-semibold">$us: {formatCurrency(docSummary.recibos.Sus)}</div>}
                                </div>
                            </div>
                            <div className="flex justify-between items-center p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-800/50">
                                <div>
                                    <div className="font-bold text-purple-800 dark:text-purple-300">Facturas ({docSummary.facturas.count})</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-extrabold text-purple-700 dark:text-purple-400">Bs: {formatCurrency(docSummary.facturas.Bs)}</div>
                                    {docSummary.facturas.Sus > 0 && <div className="text-green-600 dark:text-green-400 font-semibold">$us: {formatCurrency(docSummary.facturas.Sus)}</div>}
                                </div>
                            </div>
                            {docSummary.sinDoc.count > 0 && (
                                <div className="flex justify-between items-center p-2.5 rounded-lg bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                                    <div>
                                        <div className="font-medium text-gray-700 dark:text-gray-300">Sin Doc ({docSummary.sinDoc.count})</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold text-gray-800 dark:text-gray-200">Bs: {formatCurrency(docSummary.sinDoc.Bs)}</div>
                                        {docSummary.sinDoc.Sus > 0 && <div className="text-green-600 dark:text-green-400 font-semibold">$us: {formatCurrency(docSummary.sinDoc.Sus)}</div>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const sortByFechaAsc = <T extends { fecha?: string; id?: number }>(items: T[]): T[] => {
        return [...items].sort((a, b) => {
            const timeA = a?.fecha ? new Date(a.fecha).getTime() : 0;
            const timeB = b?.fecha ? new Date(b.fecha).getTime() : 0;
            if (timeA !== timeB) return timeA - timeB;
            return (a?.id || 0) - (b?.id || 0);
        });
    };

    const renderTableWithSummary = (
        columns: { header: string, accessor: (row: any) => React.ReactNode }[],
        data: any[],
        type: 'ingreso' | 'egreso' | 'doctor' | 'laboratorio' | 'pedido' | 'gasto'
    ) => {
        const filteredData = data.filter(row => {
            if (!searchTerm.trim()) return true;
            const term = searchTerm.toLowerCase().trim();
            return JSON.stringify(row).toLowerCase().includes(term);
        });

        const sortedData = sortByFechaAsc(filteredData);
        const summary = calculateSummary(sortedData, type);
        const totalItems = sortedData.length;
        const itemsPerPage = 10;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

        return (
            <div>
                {/* Search Bar Above Table */}
                <div className="mb-4 flex items-center gap-2 max-w-md no-print">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Buscar en esta tabla..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 font-medium placeholder-gray-400 dark:placeholder-gray-300"
                        />
                        <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-3 rounded-lg text-sm transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 shadow-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span>Limpiar</span>
                        </button>
                    )}
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium no-print">
                    Mostrando {totalItems === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} de {totalItems} registros
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-grow flex flex-col justify-between">
                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
                                        {columns.map((col, idx) => (
                                            <th key={idx} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                {col.header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {paginatedData.length === 0 ? (
                                        <tr>
                                            <td colSpan={columns.length + 1} className="p-6 text-center italic text-gray-400 dark:text-gray-500">
                                                No hay registros para esta {searchMode === 'single' ? 'fecha' : 'rango'}.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedData.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="p-3 text-gray-700 dark:text-gray-300 font-medium">
                                                    {startIndex + idx + 1}
                                                </td>
                                                {columns.map((col, colIdx) => (
                                                    <td key={colIdx} className="p-3 text-gray-700 dark:text-gray-300">
                                                        {col.accessor(row)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="mt-4 no-print">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                />
                            </div>
                        )}
                    </div>
                    {renderSummary(summary, type, sortedData)}
                </div>
            </div>
        );
    };

    const renderContent = () => {
        const getDateColumn = () => searchMode === 'range'
            ? [{
                header: 'Fecha',
                accessor: (r: any) => {
                    if (!r.fecha) return '-';
                    const datePart = r.fecha.toString().split('T')[0];
                    const parts = datePart.split('-');
                    if (parts.length === 3) {
                        return `${parts[2]}/${parts[1]}/${parts[0]}`;
                    }
                    return datePart;
                }
            }]
            : [];

        switch (activeTab) {
            case 0: // Ingresos
                return renderTableWithSummary([
                    ...getDateColumn(),
                    { header: 'Paciente', accessor: r => formatPaternoMaternoNombre(r.paciente) },
                    { header: 'PRESUP.', accessor: r => r.proforma?.numero || 'Generales' },
                    { header: 'Recibo/Factura', accessor: r => renderReciboFactura(r.recibo, r.factura) },
                    {
                        header: 'Monto',
                        accessor: r => {
                            const isDollar = isDollarCurrency(r.moneda);
                            const amount = getNetMontoIngreso(r);

                            return (
                                <span className="font-bold text-green-600 dark:text-green-400">
                                    {formatMoney(amount, r.moneda)}
                                    {isDollar && r.tc && ` (TC. ${formatCurrency(r.tc)})`}
                                </span>
                            );
                        }
                    },
                    {
                        header: 'Forma Pago',
                        accessor: r => {
                            const method = r.formaPagoRel?.forma_pago || 'N/A';
                            // Show Bank for Tarjeta
                            if (method.toLowerCase() === 'tarjeta' && r.comisionTarjeta?.redBanco) {
                                return `${method} (${r.comisionTarjeta.redBanco})`;
                            }
                            return method;
                        }
                    },
                    { header: 'Observaciones', accessor: r => r.observaciones || '-' },
                ], ingresos, 'ingreso');
            case 1: // Egresos Diarios
                const filteredEgresos = egresos.filter(e => {
                    const dest = (e.destino || 'consultorio').toLowerCase();
                    return dest === activeEgresosTab.toLowerCase();
                });
                return (
                    <div>
                        <div className="no-print flex flex-wrap border-b border-gray-200 dark:border-gray-600 mb-5 bg-white dark:bg-gray-800 rounded-t-lg pt-2 px-2">
                            {['Consultorio', 'Casa'].map((tab) => (
                                <div
                                    key={tab}
                                    onClick={() => setActiveEgresosTab(tab as any)}
                                    className={`px-5 py-2.5 cursor-pointer border-b-4 flex items-center gap-2 transition-all duration-200 text-base ${activeEgresosTab === tab
                                        ? 'border-blue-500 text-blue-500 font-bold dark:border-blue-400 dark:text-blue-400'
                                        : 'border-transparent text-gray-600 dark:text-gray-400 font-normal hover:text-blue-500 dark:hover:text-blue-300'
                                        }`}
                                >
                                    {tab === 'Consultorio' ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                                            <line x1="9" y1="22" x2="9" y2="22"></line>
                                            <line x1="15" y1="22" x2="15" y2="22"></line>
                                            <line x1="12" y1="18" x2="12" y2="18"></line>
                                            <line x1="12" y1="14" x2="12" y2="14"></line>
                                            <line x1="8" y1="10" x2="8" y2="10"></line>
                                            <line x1="8" y1="6" x2="8" y2="6"></line>
                                            <line x1="16" y1="10" x2="16" y2="10"></line>
                                            <line x1="16" y1="6" x2="16" y2="6"></line>
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                        </svg>
                                    )}
                                    {tab}
                                </div>
                            ))}
                        </div>
                        {renderTableWithSummary([
                            ...getDateColumn(),
                            { header: 'Detalle', accessor: r => r.detalle },
                            { header: 'Monto', accessor: r => <span className="font-bold text-red-600 dark:text-red-400">{formatMoney(Number(r.monto), r.moneda)}</span> },
                            { header: 'Forma Pago', accessor: r => r.formaPago?.forma_pago || 'N/A' },
                        ], filteredEgresos, 'egreso')}
                    </div>
                );
            case 2: // Pagos Doctores
                return renderTableWithSummary([
                    ...getDateColumn(),
                    { header: 'Doctor', accessor: r => formatPaternoMaternoNombre(r.doctor) },
                    { header: 'Monto Total', accessor: r => <span className="font-bold text-red-600 dark:text-red-400">{formatMoney(Number(r.total), r.moneda)}</span> },
                    { header: 'Forma Pago', accessor: r => r.formaPago?.forma_pago || 'N/A' },
                ], pagosDoctores, 'doctor');
            case 3: // Pagos Laboratorios
                return renderTableWithSummary([
                    ...getDateColumn(),
                    { header: 'Laboratorio', accessor: r => r.trabajoLaboratorio?.laboratorio?.laboratorio || '-' },
                    { header: 'Trabajo', accessor: r => r.trabajoLaboratorio?.precioLaboratorio?.detalle || '-' },
                    { header: 'Paciente', accessor: r => formatPaternoMaternoNombre(r.trabajoLaboratorio?.paciente) },
                    { header: 'Monto', accessor: r => <span className="font-bold text-red-600 dark:text-red-400">{formatMoney(Number(r.monto), r.moneda)}</span> },
                    { header: 'Forma Pago', accessor: r => r.formaPago?.forma_pago || '-' },
                ], pagosLaboratorios, 'laboratorio');
            case 4: // Pagos Pedidos
                return renderTableWithSummary([
                    ...getDateColumn(),
                    { header: 'Proveedor', accessor: r => r.pedido?.proveedor?.proveedor || '-' },
                    { header: 'Recibo/Factura', accessor: r => renderReciboFactura(r.recibo, r.factura) },
                    { header: 'Monto', accessor: r => <span className="font-bold text-red-600 dark:text-red-400">{formatMoney(Number(r.monto), 'Bolivianos')}</span> },
                    { header: 'Forma Pago', accessor: r => r.forma_pago || '-' },
                ], pagosPedidos, 'pedido');
            case 5: // Gastos Fijos
                const currentGastosData = activeGastosFijosTab === 'Consultorio' ? gastosFijosConsultorio : gastosFijosCasa;
                return (
                    <div>
                        <div className="no-print flex flex-wrap border-b border-gray-200 dark:border-gray-600 mb-5 bg-white dark:bg-gray-800 rounded-t-lg pt-2 px-2">
                            {['Consultorio', 'Casa'].map((tab) => (
                                <div
                                    key={tab}
                                    onClick={() => setActiveGastosFijosTab(tab as any)}
                                    className={`px-5 py-2.5 cursor-pointer border-b-4 flex items-center gap-2 transition-all duration-200 text-base ${activeGastosFijosTab === tab
                                        ? 'border-blue-500 text-blue-500 font-bold dark:border-blue-400 dark:text-blue-400'
                                        : 'border-transparent text-gray-600 dark:text-gray-400 font-normal hover:text-blue-500 dark:hover:text-blue-300'
                                        }`}
                                >
                                    {tab === 'Consultorio' ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                                            <line x1="9" y1="22" x2="9" y2="22"></line>
                                            <line x1="15" y1="22" x2="15" y2="22"></line>
                                            <line x1="12" y1="18" x2="12" y2="18"></line>
                                            <line x1="12" y1="14" x2="12" y2="14"></line>
                                            <line x1="8" y1="10" x2="8" y2="10"></line>
                                            <line x1="8" y1="6" x2="8" y2="6"></line>
                                            <line x1="16" y1="10" x2="16" y2="10"></line>
                                            <line x1="16" y1="6" x2="16" y2="6"></line>
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                        </svg>
                                    )}
                                    {tab}
                                </div>
                            ))}
                        </div>
                        {renderTableWithSummary([
                            ...getDateColumn(),
                            { header: 'Gasto', accessor: r => r.gastoFijo?.gasto_fijo || '-' },
                            { header: 'Monto', accessor: r => <span className="font-bold text-red-600 dark:text-red-400">{formatMoney(Number(r.monto), r.moneda)}</span> },
                            { header: 'Forma Pago', accessor: r => r.formaPago?.forma_pago || '-' },
                            { header: 'Observaciones', accessor: r => r.observaciones || '-' },
                        ], currentGastosData, 'gasto')}
                    </div>
                );
            default:
                return null;
        }
    };

    const formatDateDisplay = (dateStr: string) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    };

    return (
        <div className="content-card p-6 min-h-screen bg-gray-50 dark:bg-gray-800 flex flex-col text-gray-800 dark:text-white">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">Hoja Diaria</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-medium">Resumen diario de caja, ingresos, egresos y flujo financiero</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm no-print"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>
                    <button
                        onClick={handlePrint}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 no-print"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Imprimir
                    </button>
                    <div className="text-xl font-semibold text-gray-600 dark:text-gray-300">
                        {searchMode === 'single' ? (
                            <>Fecha: <span className="text-blue-600 dark:text-blue-400">{formatDateDisplay(selectedDate)}</span></>
                        ) : (
                            <>Rango: <span className="text-blue-600 dark:text-blue-400">{formatDateDisplay(rangeStart)}</span> al <span className="text-blue-600 dark:text-blue-400">{formatDateDisplay(rangeEnd)}</span></>
                        )}
                    </div>
                </div>
            </div>

            <div className="mb-6">
                {/* Tabs Navigation */}
                <div className="no-print flex flex-wrap border-b border-gray-200 dark:border-gray-600 mb-5 bg-white dark:bg-gray-800 rounded-t-lg pt-2 px-2">
                    {tabs.map((tab, idx) => (
                        <div
                            key={idx}
                            onClick={() => setActiveTab(idx)}
                            className={`px-5 py-2.5 cursor-pointer border-b-4 flex items-center gap-2 transition-all duration-200 text-base ${activeTab === idx
                                ? 'border-blue-500 text-blue-500 font-bold dark:border-blue-400 dark:text-blue-400'
                                : 'border-transparent text-gray-600 dark:text-gray-400 font-normal hover:text-blue-500 dark:hover:text-blue-300'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8 flex-grow overflow-hidden" id="printable-section">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
                    </div>
                ) : (
                    renderContent()
                )}
            </div>

            {/* Bottom Section: Calendar + Range Search + Resumen de Utilidad */}
            <div className="flex flex-col xl:flex-row items-stretch justify-center mt-auto gap-6 no-print">

                {/* 1. Calendar (Single Date) */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 w-full xl:w-1/3 flex flex-col items-center">
                    <h3 className="text-lg font-bold text-gray-700 dark:text-white mb-4 text-center">Seleccionar Fecha</h3>
                    <div className="flex justify-center calendar-container w-full">
                        <Calendar
                            onChange={handleCalendarChange}
                            value={calendarValue}
                            locale="es-ES"
                        />
                    </div>
                </div>

                {/* 2. Range Search */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 flex flex-col justify-between w-full xl:w-1/3">
                    <div>
                        <h3 className="text-lg font-bold text-gray-700 dark:text-white mb-4 border-b dark:border-gray-700 pb-2">Búsqueda por Rango</h3>

                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Inicio</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="date"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                        value={rangeStart}
                                        onChange={(e) => setRangeStart(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Fin</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="date"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                        value={rangeEnd}
                                        onChange={(e) => setRangeEnd(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleRangeSearch}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 mt-4"
                    >
                        Buscar por Rango
                    </button>
                </div>

                {/* 3. Resumen de Utilidad (2 Columnas por Moneda) */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 w-full xl:w-1/3 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-4 border-b dark:border-gray-700 pb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Resumen de Utilidad</h3>
                        </div>

                        {/* Grid de 2 Columnas: Bs y $us */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            
                            {/* Columna 1: Bolivianos (Bs) */}
                            <div className="space-y-3">
                                <div className="text-center font-extrabold text-[11px] uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 py-1 px-2 rounded-md border border-blue-100 dark:border-blue-800/50">
                                    Bolivianos (Bs)
                                </div>

                                {/* Ingresos Box Bs */}
                                <div className="bg-gray-50 dark:bg-gray-700/60 p-2.5 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="font-bold text-gray-800 dark:text-gray-200 text-xs">Ingresos:</span>
                                        <span className="font-extrabold text-green-600 dark:text-green-400 text-xs">
                                            {formatCurrency(utilitySummary.ingresosBs)} Bs
                                        </span>
                                    </div>
                                    {Object.keys(utilitySummary.ingresosByMethod).length > 0 && (
                                        <div className="pt-1.5 border-t border-gray-200 dark:border-gray-600 space-y-0.5 text-gray-600 dark:text-gray-300">
                                            {Object.entries(utilitySummary.ingresosByMethod).map(([method, totals], idx) => (
                                                totals.Bs > 0 && (
                                                    <div key={idx} className="flex justify-between text-[11px] pl-1">
                                                        <span>• {method}</span>
                                                        <span className="font-medium">{formatCurrency(totals.Bs)}</span>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Egresos Box Bs */}
                                <div className="bg-gray-50 dark:bg-gray-700/60 p-2.5 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="font-bold text-gray-800 dark:text-gray-200 text-xs">Egresos:</span>
                                        <span className="font-extrabold text-red-600 dark:text-red-400 text-xs">
                                            {formatCurrency(utilitySummary.totalEgresosBs)} Bs
                                        </span>
                                    </div>
                                    <div className="pt-1.5 border-t border-gray-200 dark:border-gray-600 space-y-0.5 text-[11px] text-gray-600 dark:text-gray-300">
                                        {utilitySummary.egresosDiariosBs > 0 && (
                                            <div className="flex justify-between pl-1">
                                                <span>• Diarios</span>
                                                <span className="font-medium">{formatCurrency(utilitySummary.egresosDiariosBs)}</span>
                                            </div>
                                        )}
                                        {utilitySummary.pagosDoctoresBs > 0 && (
                                            <div className="flex justify-between pl-1">
                                                <span>• Doctores</span>
                                                <span className="font-medium">{formatCurrency(utilitySummary.pagosDoctoresBs)}</span>
                                            </div>
                                        )}
                                        {utilitySummary.pagosLaboratoriosBs > 0 && (
                                            <div className="flex justify-between pl-1">
                                                <span>• Laboratorios</span>
                                                <span className="font-medium">{formatCurrency(utilitySummary.pagosLaboratoriosBs)}</span>
                                            </div>
                                        )}
                                        {utilitySummary.pagosPedidosBs > 0 && (
                                            <div className="flex justify-between pl-1">
                                                <span>• Pedidos</span>
                                                <span className="font-medium">{formatCurrency(utilitySummary.pagosPedidosBs)}</span>
                                            </div>
                                        )}
                                        {utilitySummary.gastosFijosBs > 0 && (
                                            <div className="flex justify-between pl-1">
                                                <span>• Gastos Fijos</span>
                                                <span className="font-medium">{formatCurrency(utilitySummary.gastosFijosBs)}</span>
                                            </div>
                                        )}
                                        {utilitySummary.totalEgresosBs === 0 && (
                                            <div className="pl-1 italic text-gray-400 text-[11px]">Sin egresos</div>
                                        )}
                                    </div>
                                </div>

                                {/* Utilidad Neta Bs */}
                                <div className="bg-blue-50/80 dark:bg-blue-900/40 p-2 rounded-lg border border-blue-200 dark:border-blue-800 flex justify-between items-center">
                                    <span className="font-bold text-blue-900 dark:text-blue-200 text-xs">Utilidad:</span>
                                    <span className={`font-extrabold text-xs ${
                                        utilitySummary.utilidadBs >= 0 
                                            ? 'text-blue-600 dark:text-blue-400' 
                                            : 'text-red-600 dark:text-red-400'
                                    }`}>
                                        {formatCurrency(utilitySummary.utilidadBs)} Bs
                                    </span>
                                </div>
                            </div>

                            {/* Columna 2: Dólares ($us) */}
                            <div className="space-y-3">
                                <div className="text-center font-extrabold text-[11px] uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/40 py-1 px-2 rounded-md border border-emerald-100 dark:border-emerald-800/50">
                                    Dólares ($us)
                                </div>

                                {/* Ingresos Box $us */}
                                <div className="bg-gray-50 dark:bg-gray-700/60 p-2.5 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="font-bold text-gray-800 dark:text-gray-200 text-xs">Ingresos:</span>
                                        <span className="font-extrabold text-green-600 dark:text-green-400 text-xs">
                                            {formatCurrency(utilitySummary.ingresosSus)} $us
                                        </span>
                                    </div>
                                    {Object.keys(utilitySummary.ingresosByMethod).length > 0 && (
                                        <div className="pt-1.5 border-t border-gray-200 dark:border-gray-600 space-y-0.5 text-gray-600 dark:text-gray-300">
                                            {Object.entries(utilitySummary.ingresosByMethod).map(([method, totals], idx) => (
                                                totals.Sus > 0 && (
                                                    <div key={idx} className="flex justify-between text-[11px] pl-1">
                                                        <span>• {method}</span>
                                                        <span className="font-medium">{formatCurrency(totals.Sus)}</span>
                                                    </div>
                                                )
                                            ))}
                                            {utilitySummary.ingresosSus === 0 && (
                                                <div className="pl-1 italic text-gray-400 text-[11px]">Sin ingresos</div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Egresos Box $us */}
                                <div className="bg-gray-50 dark:bg-gray-700/60 p-2.5 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="font-bold text-gray-800 dark:text-gray-200 text-xs">Egresos:</span>
                                        <span className="font-extrabold text-red-600 dark:text-red-400 text-xs">
                                            {formatCurrency(utilitySummary.totalEgresosSus)} $us
                                        </span>
                                    </div>
                                    <div className="pt-1.5 border-t border-gray-200 dark:border-gray-600 space-y-0.5 text-[11px] text-gray-600 dark:text-gray-300">
                                        {utilitySummary.egresosDiariosSus > 0 && (
                                            <div className="flex justify-between pl-1">
                                                <span>• Diarios</span>
                                                <span className="font-medium">{formatCurrency(utilitySummary.egresosDiariosSus)}</span>
                                            </div>
                                        )}
                                        {utilitySummary.pagosDoctoresSus > 0 && (
                                            <div className="flex justify-between pl-1">
                                                <span>• Doctores</span>
                                                <span className="font-medium">{formatCurrency(utilitySummary.pagosDoctoresSus)}</span>
                                            </div>
                                        )}
                                        {utilitySummary.pagosLaboratoriosSus > 0 && (
                                            <div className="flex justify-between pl-1">
                                                <span>• Laboratorios</span>
                                                <span className="font-medium">{formatCurrency(utilitySummary.pagosLaboratoriosSus)}</span>
                                            </div>
                                        )}
                                        {utilitySummary.gastosFijosSus > 0 && (
                                            <div className="flex justify-between pl-1">
                                                <span>• Gastos Fijos</span>
                                                <span className="font-medium">{formatCurrency(utilitySummary.gastosFijosSus)}</span>
                                            </div>
                                        )}
                                        {utilitySummary.totalEgresosSus === 0 && (
                                            <div className="pl-1 italic text-gray-400 text-[11px]">Sin egresos</div>
                                        )}
                                    </div>
                                </div>

                                {/* Utilidad Neta $us */}
                                <div className="bg-emerald-50/80 dark:bg-emerald-900/40 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800 flex justify-between items-center">
                                    <span className="font-bold text-emerald-900 dark:text-emerald-200 text-xs">Utilidad:</span>
                                    <span className={`font-extrabold text-xs ${
                                        utilitySummary.utilidadSus >= 0 
                                            ? 'text-emerald-600 dark:text-emerald-400' 
                                            : 'text-red-600 dark:text-red-400'
                                    }`}>
                                        {formatCurrency(utilitySummary.utilidadSus)} $us
                                    </span>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

            </div>

            <style>{`
                .react-calendar { 
                    border: none; 
                    font-family: inherit;
                    width: 100%;
                    color: inherit;
                    background-color: transparent;
                }
                .react-calendar__navigation button {
                    min-width: 44px;
                    background: none;
                }
                .react-calendar__navigation__label {
                    font-weight: bold;
                }
                
                /* Dark Mode Styles for Calendar */
                .dark .calendar-container .react-calendar {
                    background-color: #1f2937; /* gray-800 */
                    color: white;
                }
                .dark .calendar-container .react-calendar__navigation button {
                    color: white;
                }
                .dark .calendar-container .react-calendar__navigation button:enabled:hover,
                .dark .calendar-container .react-calendar__navigation button:enabled:focus {
                    background-color: #374151; /* gray-700 */
                }
                .dark .calendar-container .react-calendar__month-view__days__day {
                    color: #d1d5db; /* gray-300 */
                }
                .dark .calendar-container .react-calendar__month-view__days__day--weekend {
                    color: #f87171; /* red-400 */
                }
                .dark .calendar-container .react-calendar__month-view__days__day--neighboringMonth {
                    color: #6b7280; /* gray-500 */
                }
                .dark .calendar-container .react-calendar__tile:enabled:hover,
                .dark .calendar-container .react-calendar__tile:enabled:focus {
                    background-color: #374151; /* gray-700 */
                }
                .dark .calendar-container .react-calendar__tile--now {
                    background: #eab308; /* yellow-500 */
                    color: black;
                }
                .dark .calendar-container .react-calendar__tile--now:enabled:hover,
                .dark .calendar-container .react-calendar__tile--now:enabled:focus {
                    background: #ca8a04; /* yellow-600 */
                }
                .dark .calendar-container .react-calendar__tile--active {
                    background: #2563eb; /* blue-600 */
                    color: white;
                }
                .dark .calendar-container .react-calendar__tile--active:enabled:hover,
                .dark .calendar-container .react-calendar__tile--active:enabled:focus {
                    background: #1d4ed8; /* blue-700 */
                }
                
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body {
                        background-color: white !important;
                        color: black !important;
                    }
                    #printable-section {
                        box-shadow: none !important;
                        position: static !important;
                        width: 100% !important;
                        overflow: visible !important;
                    }
                     table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                    }
                    th, td {
                        border: 1px solid #ddd !important;
                        padding: 8px !important;
                        color: black !important;
                    }
                    .bg-blue-100 { /* Tailwind classes might not print background colors by default in browsers without settings */
                        background-color: #dbeafe !important;
                        -webkit-print-color-adjust: exact;
                    }
                }
            `}</style>
            {/* Manual Modal */}
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Hoja Diaria"
                sections={manualSections}
            />
        </div>
    );
};

export default HojaDiaria;
