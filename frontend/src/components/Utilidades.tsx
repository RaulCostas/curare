import React, { useState } from 'react';
import Swal from 'sweetalert2';
import ManualModal, { type ManualSection } from './ManualModal';
import { formatPaternoMaternoNombre } from '../utils/formatters';
import { formatNumberBs, getLocalDateString } from '../utils/dateUtils';
import { Printer, X } from 'lucide-react';

interface DetailItem {
    id: number;
    fecha: string;
    descripcion: string;
    monto: number;
    moneda: string;
    paciente?: string;
    presupuesto?: string | number;
    factura?: string;
    recibo?: string;
    formaPago?: string;
    destino?: string;
    laboratorio?: string;
    trabajo?: string;
    proveedor?: string;
    doctor?: string;
    gasto?: string;
}

interface StatCategory {
    label: string;
    bs: number;
    sus: number;
    itemsBs: DetailItem[];
    itemsSus: DetailItem[];
}

const Utilidades: React.FC = () => {
    const [filterType, setFilterType] = useState<'date' | 'month' | 'year' | ''>('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(() => getLocalDateString().slice(0, 7)); // YYYY-MM
    const [selectedYear, setSelectedYear] = useState(() => getLocalDateString().slice(0, 4));
    const [loading, setLoading] = useState(false);

    // DETAIL MODAL STATE
    const [selectedDetail, setSelectedDetail] = useState<{
        title: string;
        currency: 'Bolivianos' | 'Dólares';
        items: DetailItem[];
    } | null>(null);

    // TAB STATE for Egresos Diarios
    const [activeTab, setActiveTab] = useState<'Consultorio' | 'Casa'>('Consultorio');

    const [stats, setStats] = useState<{
        ingresos: StatCategory;
        egresosDiarios: StatCategory;
        pagosLaboratorios: StatCategory;
        pagosPedidos: StatCategory;
        pagosDoctores: StatCategory;
        gastosConsultorio: StatCategory;
        gastosCasa: StatCategory;
        totalIngresos: { bs: number; sus: number };
        totalEgresos: { bs: number; sus: number };
        totalUtilidades: { bs: number; sus: number };
    } | null>(null);

    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Utilidades',
            content: 'Vista general de las finanzas. Permite ver Ingresos VS Egresos y calcular la utilidad neta.'
        },
        {
            title: 'Filtros',
            content: 'Utilice los filtros por Fecha, Mes o Año para acotar los resultados mostrados en el reporte.'
        },
        {
            title: 'Detalles',
            content: 'Haga clic en los botones de "lupa" en cada fila para ver el desglose detallado de cada categoría.'
        }
    ];

    const sortByFechaAsc = (items: DetailItem[]) => {
        return [...items].sort((a, b) => {
            const timeA = a.fecha ? new Date(a.fecha).getTime() : 0;
            const timeB = b.fecha ? new Date(b.fecha).getTime() : 0;
            if (timeA !== timeB) return timeA - timeB;
            return (a.id || 0) - (b.id || 0);
        });
    };

    const handleSearch = async () => {
        let finalStartDate = '';
        let finalEndDate = '';

        if (filterType === 'date') {
            if (!startDate || !endDate) return Swal.fire('Error', 'Seleccione fecha inicio y fin', 'warning');
            finalStartDate = startDate;
            finalEndDate = endDate;
        } else if (filterType === 'month') {
            if (!selectedMonth) return Swal.fire('Error', 'Seleccione un mes', 'warning');
            const [year, month] = selectedMonth.split('-');
            const lastDay = new Date(Number(year), Number(month), 0).getDate();
            finalStartDate = `${selectedMonth}-01`;
            finalEndDate = `${selectedMonth}-${lastDay}`;
        } else if (filterType === 'year') {
            if (!selectedYear) return Swal.fire('Error', 'Seleccione un año', 'warning');
            finalStartDate = `${selectedYear}-01-01`;
            finalEndDate = `${selectedYear}-12-31`;
        } else {
            return Swal.fire('Error', 'Seleccione un tipo de filtro', 'warning');
        }

        setLoading(true);
        try {
            const params = { startDate: finalStartDate, endDate: finalEndDate, limit: 10000 };

            // Import api here or ensure it's imported at top
            const apiImport = await import('../services/api');
            const api = apiImport.default;

            const [
                resIngresos,
                resEgresos,
                resDoctores,
                resLaboratorios,
                resPedidos,
                resGastosFijos
            ] = await Promise.all([
                api.get('/pagos', { params }),
                api.get('/egresos', { params }),
                api.get('/pagos-doctores', { params }),
                api.get('/pagos-laboratorios', { params }),
                api.get('/pagos-pedidos', { params }),
                api.get('/pagos-gastos-fijos', { params })
            ]);

            // Helper to sum amounts and collect items
            const sum = (items: any[], type: 'ingreso' | 'egreso' | 'doctor' | 'laboratorio' | 'pedido' | 'gasto') => {
                let bs = 0;
                let sus = 0;
                const itemsBs: DetailItem[] = [];
                const itemsSus: DetailItem[] = [];

                items.forEach(item => {
                    let amount = 0;
                    let currency = item.moneda || 'Bolivianos';
                    let desc = '';
                    let date = item.fecha ? item.fecha.split('T')[0] : '';
                    let id = item.id || Math.random();

                    // Specific fields
                    let paciente = '';
                    let presupuesto: string | number | undefined = undefined;
                    let factura = '';
                    let recibo = '';
                    let formaPago = '';
                    let destino = '';
                    let laboratorio = '';
                    let trabajo = '';
                    let proveedor = '';
                    let doctor = '';
                    let gasto = '';

                    switch (type) {
                        case 'ingreso':
                            const rawMonto = Number(item.monto) || 0;
                            const comisionBs = Number(item.monto_comision) || 0;
                            amount = rawMonto - comisionBs;
                            const paymentMethod = item.formaPagoRel?.forma_pago || '';
                            formaPago = paymentMethod;

                            if (paymentMethod.toLowerCase() === 'tarjeta' && item.comisionTarjeta?.redBanco) {
                                formaPago += ` (${item.comisionTarjeta.redBanco})`;
                            }

                            paciente = formatPaternoMaternoNombre(item.paciente);
                            presupuesto = item.proforma?.numero || (item.proformaId ? `#${item.proformaId}` : 'Generales');
                            factura = item.factura || '-';
                            recibo = item.recibo || '-';

                            desc = `Pago de Paciente: ${paciente}`;
                            break;
                        case 'egreso':
                            amount = Number(item.monto) || 0;
                            desc = item.detalle || 'Egreso Diario';
                            destino = item.destino || 'consultorio';
                            formaPago = item.formaPago?.forma_pago || '-';
                            break;
                        case 'doctor':
                            amount = Number(item.total) || 0;
                            const docFormatted = formatPaternoMaternoNombre(item.doctor);
                            doctor = docFormatted ? docFormatted : (item.idDoctor ? `Doctor ID: ${item.idDoctor}` : 'Desconocido');
                            formaPago = item.formaPago?.forma_pago || '-';
                            desc = `Pago a Doctor: ${doctor}`;
                            break;
                        case 'laboratorio':
                            amount = Number(item.monto) || 0;
                            laboratorio = item.trabajoLaboratorio?.laboratorio?.laboratorio || '-';
                            trabajo = item.trabajoLaboratorio?.precioLaboratorio?.detalle || '-';
                            paciente = formatPaternoMaternoNombre(item.trabajoLaboratorio?.paciente);
                            formaPago = item.formaPago?.forma_pago || '-';
                            desc = `Lab: ${laboratorio} - ${trabajo}`;
                            break;
                        case 'pedido':
                            amount = Number(item.monto) || 0;
                            proveedor = item.pedido?.proveedor?.proveedor || '-';
                            factura = item.factura || '-';
                            recibo = item.recibo || '-';
                            formaPago = item.forma_pago || '-';
                            desc = `Pedido: ${proveedor}`;
                            break;
                        case 'gasto':
                            amount = Number(item.monto) || 0;
                            gasto = item.gastoFijo?.gasto_fijo || 'Gasto Fijo';
                            destino = item.gastoFijo?.destino || item.destino || 'consultorio';
                            formaPago = item.formaPago?.forma_pago || '-';
                            desc = `${gasto}`;
                            break;
                    }

                    const currUpper = currency.toUpperCase();
                    const detailItem: DetailItem = {
                        id,
                        fecha: date,
                        descripcion: desc,
                        monto: amount,
                        moneda: currency,
                        paciente,
                        presupuesto,
                        factura,
                        recibo,
                        formaPago,
                        destino,
                        laboratorio,
                        trabajo,
                        proveedor,
                        doctor,
                        gasto
                    };

                    if (currUpper.includes('BOLIVIANO') || currUpper === 'BS') {
                        bs += amount;
                        itemsBs.push(detailItem);
                    } else {
                        sus += amount;
                        itemsSus.push(detailItem);
                    }
                });
                return { bs, sus, itemsBs: sortByFechaAsc(itemsBs), itemsSus: sortByFechaAsc(itemsSus) };
            };

            const extractList = (resData: any) => {
                if (!resData) return [];
                if (Array.isArray(resData)) return resData;
                if (Array.isArray(resData.data)) return resData.data;
                return [];
            };

            const ingresos = sum(extractList(resIngresos.data), 'ingreso');
            const egresosDiarios = sum(extractList(resEgresos.data), 'egreso');
            const pagosDoctores = sum(extractList(resDoctores.data), 'doctor');
            const pagosLaboratorios = sum(extractList(resLaboratorios.data), 'laboratorio');
            const pagosPedidos = sum(extractList(resPedidos.data), 'pedido');

            const allGastos = extractList(resGastosFijos.data);
            const sumGastosTotal = sum(allGastos, 'gasto');

            const totalIngresos = { bs: ingresos.bs, sus: ingresos.sus };
            const totalEgresos = {
                bs: egresosDiarios.bs + pagosDoctores.bs + pagosLaboratorios.bs + pagosPedidos.bs + sumGastosTotal.bs,
                sus: egresosDiarios.sus + pagosDoctores.sus + pagosLaboratorios.sus + pagosPedidos.sus + sumGastosTotal.sus
            };

            setStats({
                ingresos: { label: 'Ingresos por Pagos de Pacientes', ...ingresos },
                egresosDiarios: { label: 'Egresos Diarios', ...egresosDiarios },
                pagosLaboratorios: { label: 'Pagos a Laboratorios', ...pagosLaboratorios },
                pagosPedidos: { label: 'Pagos de Pedidos', ...pagosPedidos },
                pagosDoctores: { label: 'Pagos a Doctores', ...pagosDoctores },
                gastosConsultorio: { label: 'Pagos de Gastos Fijos', ...sumGastosTotal }, // This now includes both
                gastosCasa: { label: 'Pagos de Gastos Casa', bs: 0, sus: 0, itemsBs: [], itemsSus: [] }, // Kept empty to not break TS if used elsewhere, but removed from display
                totalIngresos,
                totalEgresos,
                totalUtilidades: {
                    bs: totalIngresos.bs - totalEgresos.bs,
                    sus: totalIngresos.sus - totalEgresos.sus
                }
            });

        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Error al calcular utilidades', 'error');
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = (amount: number, currency: 'Bs' | 'Sus') => {
        const prefix = currency === 'Bs' ? 'Bs' : '$us';
        return `${prefix} ${formatNumberBs(amount)}`;
    };

    const formatDateBO = (dateStr: string) => {
        if (!dateStr || dateStr === '-') return '-';
        const cleanDate = dateStr.split('T')[0];
        const parts = cleanDate.split('-');
        if (parts.length === 3) {
            const [year, month, day] = parts;
            return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
        }
        return dateStr;
    };

    const handleOpenDetail = (category: StatCategory | undefined, currency: 'Bolivianos' | 'Dólares') => {
        if (!category) return;
        const items = currency === 'Bolivianos' ? category.itemsBs : category.itemsSus;
        setSelectedDetail({
            title: category.label,
            currency,
            items
        });
        // Reset tab to Consultorio when opening modal
        setActiveTab('Consultorio');
    };

    const getFilterDescription = () => {
        if (filterType === 'date' && startDate && endDate) {
            return `Del ${formatDateBO(startDate)} al ${formatDateBO(endDate)}`;
        }
        if (filterType === 'month' && selectedMonth) {
            const [y, m] = selectedMonth.split('-');
            const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            return `${monthNames[parseInt(m, 10) - 1] || m} de ${y}`;
        }
        if (filterType === 'year' && selectedYear) {
            return `Año ${selectedYear}`;
        }
        return 'General';
    };

    const handlePrintDetail = (itemsToPrint: DetailItem[], totalMonto: number) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow || !selectedDetail) return;

        const isBs = selectedDetail.currency === 'Bolivianos';
        const prefix = isBs ? 'Bs' : 'Sus';
        const periodText = getFilterDescription();
        const nowStr = `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        const isEgresosOGastos = selectedDetail.title.includes('Egresos Diarios') || selectedDetail.title.includes('Gastos');
        const titleText = `${selectedDetail.title.toUpperCase()} (${selectedDetail.currency.toUpperCase()})${isEgresosOGastos ? ` - ${activeTab.toUpperCase()}` : ''}`;

        let tableHeadersHtml = '';
        let tableRowsHtml = '';

        if (selectedDetail.title.includes('Ingresos')) {
            tableHeadersHtml = `
                <tr>
                    <th style="width: 12%;">Fecha</th>
                    <th style="width: 28%;">Paciente</th>
                    <th style="width: 14%;">Presupuesto</th>
                    <th style="width: 14%;">Fact/Rec</th>
                    <th style="width: 16%;">Forma Pago</th>
                    <th style="width: 16%; text-align: right;">Monto</th>
                </tr>
            `;
            tableRowsHtml = itemsToPrint.map(item => {
                const fact = item.factura && item.factura !== '-' ? `F: ${item.factura}` : '';
                const rec = item.recibo && item.recibo !== '-' ? `R: ${item.recibo}` : '';
                const sep = fact && rec ? ' / ' : '';
                const factRec = fact || rec ? `${fact}${sep}${rec}` : '-';
                return `
                    <tr>
                        <td>${formatDateBO(item.fecha)}</td>
                        <td style="font-weight: 500;">${item.paciente || '-'}</td>
                        <td>${item.presupuesto || '-'}</td>
                        <td>${factRec}</td>
                        <td>${item.formaPago || '-'}</td>
                        <td style="text-align: right; font-weight: bold;">${formatMoney(item.monto, prefix)}</td>
                    </tr>
                `;
            }).join('');
        } else if (selectedDetail.title.includes('Egresos Diarios')) {
            tableHeadersHtml = `
                <tr>
                    <th style="width: 15%;">Fecha</th>
                    <th style="width: 45%;">Descripción</th>
                    <th style="width: 20%;">Forma Pago</th>
                    <th style="width: 20%; text-align: right;">Monto</th>
                </tr>
            `;
            tableRowsHtml = itemsToPrint.map(item => `
                <tr>
                    <td>${formatDateBO(item.fecha)}</td>
                    <td>${item.descripcion || '-'}</td>
                    <td>${item.formaPago || '-'}</td>
                    <td style="text-align: right; font-weight: bold;">${formatMoney(item.monto, prefix)}</td>
                </tr>
            `).join('');
        } else if (selectedDetail.title.includes('Pagos a Laboratorios')) {
            tableHeadersHtml = `
                <tr>
                    <th style="width: 12%;">Fecha</th>
                    <th style="width: 22%;">Laboratorio</th>
                    <th style="width: 22%;">Trabajo</th>
                    <th style="width: 22%;">Paciente</th>
                    <th style="width: 10%;">Forma Pago</th>
                    <th style="width: 12%; text-align: right;">Monto</th>
                </tr>
            `;
            tableRowsHtml = itemsToPrint.map(item => `
                <tr>
                    <td>${formatDateBO(item.fecha)}</td>
                    <td style="font-weight: 500;">${item.laboratorio || '-'}</td>
                    <td>${item.trabajo || '-'}</td>
                    <td>${item.paciente || '-'}</td>
                    <td>${item.formaPago || '-'}</td>
                    <td style="text-align: right; font-weight: bold;">${formatMoney(item.monto, prefix)}</td>
                </tr>
            `).join('');
        } else if (selectedDetail.title.includes('Pagos de Pedidos')) {
            tableHeadersHtml = `
                <tr>
                    <th style="width: 15%;">Fecha</th>
                    <th style="width: 35%;">Proveedor</th>
                    <th style="width: 15%;">Fact/Rec</th>
                    <th style="width: 15%;">Forma Pago</th>
                    <th style="width: 20%; text-align: right;">Monto</th>
                </tr>
            `;
            tableRowsHtml = itemsToPrint.map(item => {
                const fact = item.factura && item.factura !== '-' ? `F: ${item.factura}` : '';
                const rec = item.recibo && item.recibo !== '-' ? `R: ${item.recibo}` : '';
                const sep = fact && rec ? ' / ' : '';
                const factRec = fact || rec ? `${fact}${sep}${rec}` : '-';
                return `
                    <tr>
                        <td>${formatDateBO(item.fecha)}</td>
                        <td style="font-weight: 500;">${item.proveedor || '-'}</td>
                        <td>${factRec}</td>
                        <td>${item.formaPago || '-'}</td>
                        <td style="text-align: right; font-weight: bold;">${formatMoney(item.monto, prefix)}</td>
                    </tr>
                `;
            }).join('');
        } else if (selectedDetail.title.includes('Pagos a Doctores')) {
            tableHeadersHtml = `
                <tr>
                    <th style="width: 15%;">Fecha</th>
                    <th style="width: 45%;">Doctor</th>
                    <th style="width: 20%;">Forma Pago</th>
                    <th style="width: 20%; text-align: right;">Monto</th>
                </tr>
            `;
            tableRowsHtml = itemsToPrint.map(item => `
                <tr>
                    <td>${formatDateBO(item.fecha)}</td>
                    <td style="font-weight: 500;">${item.doctor || '-'}</td>
                    <td>${item.formaPago || '-'}</td>
                    <td style="text-align: right; font-weight: bold;">${formatMoney(item.monto, prefix)}</td>
                </tr>
            `).join('');
        } else if (selectedDetail.title.includes('Pagos de Gastos') || selectedDetail.title.includes('Gastos')) {
            tableHeadersHtml = `
                <tr>
                    <th style="width: 15%;">Fecha</th>
                    <th style="width: 45%;">Gasto Fijo</th>
                    <th style="width: 20%;">Forma Pago</th>
                    <th style="width: 20%; text-align: right;">Monto</th>
                </tr>
            `;
            tableRowsHtml = itemsToPrint.map(item => `
                <tr>
                    <td>${formatDateBO(item.fecha)}</td>
                    <td style="font-weight: 500;">${item.gasto || item.descripcion || '-'}</td>
                    <td>${item.formaPago || '-'}</td>
                    <td style="text-align: right; font-weight: bold;">${formatMoney(item.monto, prefix)}</td>
                </tr>
            `).join('');
        } else {
            tableHeadersHtml = `
                <tr>
                    <th style="width: 20%;">Fecha</th>
                    <th style="width: 55%;">Descripción</th>
                    <th style="width: 25%; text-align: right;">Monto</th>
                </tr>
            `;
            tableRowsHtml = itemsToPrint.map(item => `
                <tr>
                    <td>${formatDateBO(item.fecha)}</td>
                    <td>${item.descripcion || '-'}</td>
                    <td style="text-align: right; font-weight: bold;">${formatMoney(item.monto, prefix)}</td>
                </tr>
            `).join('');
        }

        const colSpanTotal = selectedDetail.title.includes('Ingresos') ? 5 :
            selectedDetail.title.includes('Egresos Diarios') ? 3 :
            selectedDetail.title.includes('Pagos a Laboratorios') ? 5 :
            selectedDetail.title.includes('Pagos de Pedidos') ? 4 :
            selectedDetail.title.includes('Pagos a Doctores') ? 3 :
            (selectedDetail.title.includes('Pagos de Gastos') || selectedDetail.title.includes('Gastos')) ? 3 : 2;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Reporte - ${selectedDetail.title}</title>
                <style>
                    @page { size: A4 portrait; margin: 12mm; }
                    body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; color: #1e293b; font-size: 12px; }
                    
                    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #0ea5e9; }
                    .header-left { display: flex; align-items: center; gap: 15px; }
                    .header img { height: 50px; object-fit: contain; }
                    .header h1 { color: #0f172a; margin: 0; font-size: 18px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }
                    .header p { margin: 2px 0 0 0; font-size: 11px; color: #64748b; }
                    
                    .info-card { display: flex; justify-content: space-between; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-bottom: 15px; }
                    .info-item { font-size: 12px; }
                    .info-item strong { color: #334155; }
                    
                    table { width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 11px; }
                    th { background-color: #0f172a; color: #ffffff; text-align: left; padding: 7px 10px; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
                    td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; }
                    tr:nth-child(even) { background-color: #f8fafc; }
                    
                    tfoot { display: table-row-group; }
                    .tfoot-total td { background-color: #f1f5f9; font-weight: bold; border-top: 2px solid #cbd5e1; border-bottom: 2px solid #cbd5e1; font-size: 12px; padding: 8px 10px; page-break-inside: avoid; }
                    
                    .footer { margin-top: 25px; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="header-left">
                        <img src="/logo-curare.png" alt="Curare Centro Dental">
                        <div>
                            <h1>${titleText}</h1>
                            <p>CURARE CENTRO DENTAL • REPORTE DE UTILIDADES</p>
                        </div>
                    </div>
                    <div style="text-align: right; font-size: 11px; color: #64748b;">
                        <div><strong>Fecha Impresión:</strong> ${nowStr}</div>
                        <div><strong>Registros:</strong> ${itemsToPrint.length}</div>
                    </div>
                </div>

                <div class="info-card">
                    <div class="info-item"><strong>Período:</strong> ${periodText}</div>
                    <div class="info-item"><strong>Moneda:</strong> ${selectedDetail.currency}</div>
                    ${isEgresosOGastos ? `<div class="info-item"><strong>Destino:</strong> ${activeTab}</div>` : ''}
                    <div class="info-item"><strong>Total:</strong> <span style="font-weight: bold; color: #0284c7;">${formatMoney(totalMonto, prefix)}</span></div>
                </div>

                <table>
                    <thead>
                        ${tableHeadersHtml}
                    </thead>
                    <tbody>
                        ${tableRowsHtml.length > 0 ? tableRowsHtml : `<tr><td colspan="${colSpanTotal + 1}" style="text-align: center; padding: 20px; color: #94a3b8;">No se encontraron registros para este período.</td></tr>`}
                    </tbody>
                    <tfoot>
                        <tr class="tfoot-total">
                            <td colspan="${colSpanTotal}" style="text-align: right; text-transform: uppercase;">TOTAL:</td>
                            <td style="text-align: right; color: #0f172a;">${formatMoney(totalMonto, prefix)}</td>
                        </tr>
                    </tfoot>
                </table>

                <div class="footer">
                    <div>Sistema Curare - Control Financiero</div>
                    <div>Reporte Oficial</div>
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

    const closeModal = () => setSelectedDetail(null);

    return (
        <div className="content-card p-6 bg-gray-50 dark:bg-gray-800 min-h-screen relative text-gray-800 dark:text-gray-200">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-2xl shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">Utilidades</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-medium">Cálculo de ganancias netas, margen de utilidad y balance financiero</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowManual(true)}
                    className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm no-print"
                    title="Ayuda / Manual"
                >
                    ?
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 transition-colors duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">

                    {/* Select Option */}
                    <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seleccione una Opción</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                            </div>
                            <select
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 pl-10 pr-3 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value as any)}
                            >
                                <option value="">-- Seleccionar --</option>
                                <option value="date">Por fecha</option>
                                <option value="month">Mensual</option>
                                <option value="year">Anual</option>
                            </select>
                        </div>
                    </div>

                    {/* Conditional Filters */}
                    {filterType === 'date' && (
                        <>
                            <div className="w-full">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Inicio</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="date"
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 pl-10 pr-3 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] cursor-pointer"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        onClick={(e) => {
                                            try { (e.target as any).showPicker(); } catch {}
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="w-full">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Final</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="date"
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 pl-10 pr-3 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] cursor-pointer"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        onClick={(e) => {
                                            try { (e.target as any).showPicker(); } catch {}
                                        }}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {filterType === 'month' && (
                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seleccionar Mes</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <input
                                    type="month"
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 pl-10 pr-9 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] cursor-pointer font-medium"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    onClick={(e) => {
                                        try { (e.target as any).showPicker(); } catch {}
                                    }}
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500 dark:text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    )}

                    {filterType === 'year' && (
                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seleccionar Año</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <select
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 pl-10 pr-3 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer font-medium"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                >
                                    {Array.from({ length: new Date().getFullYear() - 2010 + 2 }, (_, i) => new Date().getFullYear() + 1 - i).map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {filterType && (
                        <div>
                            <button
                                onClick={handleSearch}
                                disabled={loading}
                                className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 dark:hover:bg-blue-500 disabled:opacity-50 disabled:transform-none"
                            >
                                {loading ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        Buscar
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                </div>
            </div>

            {stats ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                    {/* Header */}
                    <div className="grid grid-cols-12 bg-gray-800 dark:bg-gray-950 text-white font-semibold text-sm uppercase py-3 px-4">
                        <div className="col-span-4">Concepto</div>
                        <div className="col-span-3 text-right">Bolivianos</div>
                        <div className="col-span-1 text-center">Detalle</div>
                        <div className="col-span-3 text-right">Dólares</div>
                        <div className="col-span-1 text-center">Detalle</div>
                    </div>

                    {/* Body */}
                    <div className="text-gray-700 dark:text-gray-300">
                        {/* INGRESOS */}
                        <div className="grid grid-cols-12 py-3 px-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 items-center transition-colors">
                            <div className="col-span-4 font-medium">{stats.ingresos.label}</div>
                            <div className="col-span-3 text-right">{formatMoney(stats.ingresos.bs, 'Bs')}</div>
                            <div className="col-span-1 text-center">
                                <button
                                    onClick={() => handleOpenDetail(stats.ingresos, 'Bolivianos')}
                                    className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60 p-2 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </button>
                            </div>
                            <div className="col-span-3 text-right">{formatMoney(stats.ingresos.sus, 'Sus')}</div>
                            <div className="col-span-1 text-center">
                                <button
                                    onClick={() => handleOpenDetail(stats.ingresos, 'Dólares')}
                                    className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60 p-2 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* TOTAL INGRESOS */}
                        <div className="grid grid-cols-12 py-3 px-4 bg-green-50 dark:bg-green-900/20 border-y border-green-100 dark:border-green-900/30 font-bold text-green-900 dark:text-green-300 items-center">
                            <div className="col-span-4">TOTAL INGRESOS</div>
                            <div className="col-span-3 text-right">{formatMoney(stats.totalIngresos.bs, 'Bs')}</div>
                            <div className="col-span-1"></div>
                            <div className="col-span-3 text-right">{formatMoney(stats.totalIngresos.sus, 'Sus')}</div>
                            <div className="col-span-1"></div>
                        </div>

                        {/* SPACING */}
                        <div className="h-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700"></div>

                        {/* EGRESOS ITEMS */}
                        {[
                            stats.egresosDiarios,
                            stats.pagosLaboratorios,
                            stats.pagosPedidos,
                            stats.pagosDoctores,
                            stats.gastosConsultorio
                        ].map((item, idx) => (
                            <div key={idx} className="grid grid-cols-12 py-3 px-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 items-center transition-colors">
                                <div className="col-span-4 font-medium">{item.label}</div>
                                <div className="col-span-3 text-right">{formatMoney(item.bs, 'Bs')}</div>
                                <div className="col-span-1 text-center">
                                    <button
                                        onClick={() => handleOpenDetail(item, 'Bolivianos')}
                                        className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60 p-2 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="col-span-3 text-right">{formatMoney(item.sus, 'Sus')}</div>
                                <div className="col-span-1 text-center">
                                    <button
                                        onClick={() => handleOpenDetail(item, 'Dólares')}
                                        className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60 p-2 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* TOTAL EGRESOS */}
                        <div className="grid grid-cols-12 py-3 px-4 bg-red-50 dark:bg-red-900/20 border-y border-red-100 dark:border-red-900/30 font-bold text-red-900 dark:text-red-300 items-center">
                            <div className="col-span-4">TOTAL EGRESOS</div>
                            <div className="col-span-3 text-right">{formatMoney(stats.totalEgresos.bs, 'Bs')}</div>
                            <div className="col-span-1"></div>
                            <div className="col-span-3 text-right">{formatMoney(stats.totalEgresos.sus, 'Sus')}</div>
                            <div className="col-span-1"></div>
                        </div>

                        {/* TOTAL UTILIDADES */}
                        <div className="grid grid-cols-12 py-6 px-4 bg-blue-50 dark:bg-blue-900/10 border-t-2 border-blue-200 dark:border-blue-700/50 items-center">
                            <div className="col-span-4 text-xl font-bold text-gray-800 dark:text-gray-200">TOTAL UTILIDADES</div>

                            {/* Bolivianos */}
                            <div className={`col-span-3 flex items-center justify-end text-xl font-bold ${stats.totalUtilidades.bs >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {stats.totalUtilidades.bs >= 0 ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
                                    </svg>
                                )}
                                {formatMoney(stats.totalUtilidades.bs, 'Bs')}
                            </div>

                            <div className="col-span-1"></div>

                            {/* Dólares */}
                            <div className={`col-span-3 flex items-center justify-end text-xl font-bold ${stats.totalUtilidades.sus >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {stats.totalUtilidades.sus >= 0 ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
                                    </svg>
                                )}
                                {formatMoney(stats.totalUtilidades.sus, 'Sus')}
                            </div>

                            <div className="col-span-1"></div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 min-h-[300px] flex items-center justify-center text-gray-400 dark:text-gray-500 italic transition-colors">
                    Seleccione los filtros para ver las utilidades.
                </div>
            )}

            {/* DETAIL MODAL */}
            {selectedDetail && (() => {
                let itemsToDisplay = sortByFechaAsc(selectedDetail.items);
                if (selectedDetail.title.includes('Egresos Diarios') || selectedDetail.title.includes('Gastos')) {
                    itemsToDisplay = itemsToDisplay.filter(item => {
                        const itemDest = (item.destino || 'consultorio').toLowerCase();
                        return itemDest === activeTab.toLowerCase();
                    });
                }
                const totalMonto = itemsToDisplay.reduce((acc, item) => acc + (Number(item.monto) || 0), 0);
                const colSpanTotal = selectedDetail.title.includes('Ingresos') ? 5 :
                    selectedDetail.title.includes('Egresos Diarios') ? 3 :
                    selectedDetail.title.includes('Pagos a Laboratorios') ? 5 :
                    selectedDetail.title.includes('Pagos de Pedidos') ? 4 :
                    selectedDetail.title.includes('Pagos a Doctores') ? 3 :
                    (selectedDetail.title.includes('Pagos de Gastos') || selectedDetail.title.includes('Gastos')) ? 3 : 2;

                return (
                    <div className="fixed inset-0 z-[9999] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/80 backdrop-blur-sm transition-opacity" onClick={closeModal} aria-hidden="true"></div>
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                            <div className={`inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:w-full ${selectedDetail.title.includes('Ingresos') || selectedDetail.title.includes('Egresos Diarios') || selectedDetail.title.includes('Pagos a Laboratorios') || selectedDetail.title.includes('Pagos de Pedidos') || selectedDetail.title.includes('Pagos a Doctores') || selectedDetail.title.includes('Gastos') ? 'sm:max-w-6xl' : 'sm:max-w-3xl'}`}>
                                
                                {/* Modal Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white" id="modal-title">
                                            Detalle: {selectedDetail.title} ({selectedDetail.currency})
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            Período: {getFilterDescription()} {selectedDetail.title.includes('Egresos Diarios') || selectedDetail.title.includes('Gastos') ? `• Destino: ${activeTab}` : ''}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="text-gray-400 bg-transparent hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full transition-all cursor-pointer"
                                        title="Cerrar"
                                    >
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Modal Body */}
                                <div className="p-6">
                                    {/* Tabs for Egresos Diarios AND Gastos Fijos */}
                                    {(selectedDetail.title.includes('Egresos Diarios') || selectedDetail.title.includes('Gastos')) && (
                                        <div className="flex items-center gap-2 mb-5">
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('Consultorio')}
                                                className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'Consultorio'
                                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
                                                    }`}
                                            >
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
                                                Consultorio
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('Casa')}
                                                className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'Casa'
                                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
                                                    }`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                                </svg>
                                                Casa
                                            </button>
                                        </div>
                                    )}

                                    <div className="max-h-[420px] overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-700">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                            <thead className="bg-gray-50 dark:bg-gray-700/60 sticky top-0 z-10">
                                                {selectedDetail.title.includes('Ingresos') ? (
                                                    <tr>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Paciente</th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Presup.</th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fact/Rec</th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Forma Pago</th>
                                                        <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monto</th>
                                                    </tr>
                                                ) : selectedDetail.title.includes('Egresos Diarios') ? (
                                                    <tr>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Descripción</th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Forma Pago</th>
                                                        <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monto</th>
                                                    </tr>
                                                ) : selectedDetail.title.includes('Pagos a Laboratorios') ? (
                                                    <tr>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Laboratorio</th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Trabajo</th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Paciente</th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Forma Pago</th>
                                                        <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monto</th>
                                                    </tr>
                                                ) : selectedDetail.title.includes('Pagos de Pedidos') ? (
                                                    <tr>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Proveedor</th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fact/Rec</th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Forma Pago</th>
                                                        <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monto</th>
                                                    </tr>
                                                ) : selectedDetail.title.includes('Pagos a Doctores') ? (
                                                    <tr>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Doctor</th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Forma Pago</th>
                                                        <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monto</th>
                                                    </tr>
                                                ) : selectedDetail.title.includes('Gastos') ? (
                                                    <tr>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Gasto Fijo</th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Forma Pago</th>
                                                        <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monto</th>
                                                    </tr>
                                                ) : (
                                                    <tr>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Descripción</th>
                                                        <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monto</th>
                                                    </tr>
                                                )}
                                            </thead>
                                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                {itemsToDisplay.length > 0 ? itemsToDisplay.map((item) => (
                                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                                                        {selectedDetail.title.includes('Ingresos') ? (
                                                            <>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDateBO(item.fecha)}</td>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200 font-medium">{item.paciente}</td>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.presupuesto}</td>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                                    {item.factura && item.factura !== '-' ? `F: ${item.factura}` : ''}
                                                                    {item.factura && item.recibo && item.factura !== '-' && item.recibo !== '-' ? ' / ' : ''}
                                                                    {item.recibo && item.recibo !== '-' ? `R: ${item.recibo}` : ''}
                                                                    {(!item.factura || item.factura === '-') && (!item.recibo || item.recibo === '-') ? '-' : ''}
                                                                </td>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.formaPago}</td>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200 text-right font-bold">
                                                                    {formatMoney(item.monto, selectedDetail.currency === 'Bolivianos' ? 'Bs' : 'Sus')}
                                                                </td>
                                                            </>
                                                        ) : selectedDetail.title.includes('Egresos Diarios') ? (
                                                            <>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDateBO(item.fecha)}</td>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{item.descripcion}</td>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.formaPago}</td>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200 text-right font-bold">
                                                                    {formatMoney(item.monto, selectedDetail.currency === 'Bolivianos' ? 'Bs' : 'Sus')}
                                                                </td>
                                                            </>
                                                        ) : selectedDetail.title.includes('Pagos a Laboratorios') ? (
                                                            <>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDateBO(item.fecha)}</td>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200 font-medium">{item.laboratorio}</td>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.trabajo}</td>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.paciente}</td>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.formaPago}</td>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200 text-right font-bold">
                                                                    {formatMoney(item.monto, selectedDetail.currency === 'Bolivianos' ? 'Bs' : 'Sus')}
                                                                </td>
                                                            </>
                                                        ) : selectedDetail.title.includes('Pagos de Pedidos') ? (
                                                            <>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDateBO(item.fecha)}</td>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200 font-medium">{item.proveedor}</td>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                                    {item.factura && item.factura !== '-' ? `F: ${item.factura}` : ''}
                                                                    {item.factura && item.recibo && item.factura !== '-' && item.recibo !== '-' ? ' / ' : ''}
                                                                    {item.recibo && item.recibo !== '-' ? `R: ${item.recibo}` : ''}
                                                                    {(!item.factura || item.factura === '-') && (!item.recibo || item.recibo === '-') ? '-' : ''}
                                                                </td>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.formaPago}</td>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200 text-right font-bold">
                                                                    {formatMoney(item.monto, selectedDetail.currency === 'Bolivianos' ? 'Bs' : 'Sus')}
                                                                </td>
                                                            </>
                                                        ) : selectedDetail.title.includes('Pagos a Doctores') ? (
                                                            <>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDateBO(item.fecha)}</td>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200 font-medium">{item.doctor}</td>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.formaPago}</td>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200 text-right font-bold">
                                                                    {formatMoney(item.monto, selectedDetail.currency === 'Bolivianos' ? 'Bs' : 'Sus')}
                                                                </td>
                                                            </>
                                                        ) : selectedDetail.title.includes('Gastos') ? (
                                                            <>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDateBO(item.fecha)}</td>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200 font-medium">{item.gasto}</td>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.formaPago}</td>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200 text-right font-bold">
                                                                    {formatMoney(item.monto, selectedDetail.currency === 'Bolivianos' ? 'Bs' : 'Sus')}
                                                                </td>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDateBO(item.fecha)}</td>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{item.descripcion}</td>
                                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200 text-right font-bold">
                                                                    {formatMoney(item.monto, selectedDetail.currency === 'Bolivianos' ? 'Bs' : 'Sus')}
                                                                </td>
                                                            </>
                                                        )}
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan={selectedDetail.title.includes('Ingresos') ? 6 : selectedDetail.title.includes('Egresos Diarios') ? 4 : selectedDetail.title.includes('Pagos a Laboratorios') ? 6 : selectedDetail.title.includes('Pagos de Pedidos') ? 5 : selectedDetail.title.includes('Pagos a Doctores') ? 4 : selectedDetail.title.includes('Gastos') ? 4 : 3} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400 font-light italic">No hay registros para este criterio</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Modal Footer (Bottom Bar) */}
                                <div className="bg-gray-50 dark:bg-gray-700/60 px-6 py-3.5 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={() => handlePrintDetail(itemsToDisplay, totalMonto)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 text-sm font-semibold cursor-pointer"
                                        title="Imprimir Detalle"
                                    >
                                        <Printer size={16} />
                                        <span>Imprimir Reporte</span>
                                    </button>
                                    <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                        Mostrando <span className="font-bold text-gray-900 dark:text-white">{itemsToDisplay.length}</span> registros &bull; Total: <span className="font-extrabold text-blue-600 dark:text-blue-400">{formatMoney(totalMonto, selectedDetail.currency === 'Bolivianos' ? 'Bs' : 'Sus')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
            {/* Manual Modal */}
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Utilidades"
                sections={manualSections}
            />
        </div>
    );
};

export default Utilidades;
