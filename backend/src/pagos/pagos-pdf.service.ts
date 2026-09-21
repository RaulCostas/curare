import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PdfPrinter = require('pdfmake');

@Injectable()
export class PagosPdfService {
    private printer: any;

    constructor() {
        const fonts = {
            Helvetica: {
                normal: 'Helvetica',
                bold: 'Helvetica-Bold',
                italics: 'Helvetica-Oblique',
                bolditalics: 'Helvetica-BoldOblique'
            }
        };
        this.printer = new PdfPrinter(fonts);
    }

    findMatchingProformaDetalle(curr: any, detalles?: any[]): any {
        if (!detalles || !Array.isArray(detalles) || detalles.length === 0) return null;
        const currDetId = curr.proformaDetalleId || (curr as any).proformaDetalle?.id;
        let matchDetalle = currDetId ? detalles.find((d: any) => Number(d.id) === Number(currDetId)) : null;

        if (matchDetalle && curr.tratamiento && matchDetalle.arancel?.detalle) {
            const dName = matchDetalle.arancel.detalle.toLowerCase().trim();
            const tName = curr.tratamiento.toLowerCase().trim();
            if (dName !== tName && !dName.includes(tName) && !tName.includes(dName)) {
                const betterMatch = detalles.find((d: any) =>
                    d.arancel && curr.tratamiento && (
                        d.arancel.detalle.toLowerCase().trim() === tName ||
                        d.arancel.detalle.toLowerCase().trim().includes(tName) ||
                        tName.includes(d.arancel.detalle.toLowerCase().trim())
                    )
                );
                if (betterMatch) {
                    matchDetalle = betterMatch;
                }
            }
        } else if (!matchDetalle) {
            matchDetalle = detalles.find((d: any) =>
                (d.arancel && d.arancel.detalle === curr.tratamiento) ||
                (d.arancel && curr.tratamiento && (
                    d.arancel.detalle.toLowerCase().trim() === curr.tratamiento.toLowerCase().trim()
                ))
            );
        }

        return matchDetalle || null;
    }

    async generatePagosPdf(
        paciente: any,
        selectedProforma: any,
        pagos: any[],
        historia: any[] = [],
        proformas: any[] = []
    ): Promise<Buffer> {
        const logoBase64 = this.getLogoBase64();

        // Format helpers
        const formatDate = (dateString: string) => {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        };

        const formatCurrency = (val: number | string | undefined | null): string => {
            if (val === undefined || val === null || val === '') return '0,00';
            const num = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : Number(val);
            if (isNaN(num)) return '0,00';
            return new Intl.NumberFormat('de-DE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(num);
        };

        // Sort both datasets ASC by fecha
        const sortedHistoria = (historia || [])
            .filter((h: any) => h.estadoTratamiento === 'terminado')
            .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

        const sortedPagos = [...(pagos || [])]
            .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

        // Process rows for Section 1: Tratamientos Ejecutados
        const rowsData = sortedHistoria.map((curr: any) => {
            let itemPrice = Number(curr.precio || 0);
            let discountAmt = 0;
            let discountPct = 0;
            const currCant = Math.max(1, Number(curr.cantidad || 1));

            let matchDetalle: any = null;
            if (selectedProforma && selectedProforma.detalles) {
                matchDetalle = this.findMatchingProformaDetalle(curr, selectedProforma.detalles);
            } else if (curr.proformaId) {
                const prof = proformas.find((p: any) => p.id === curr.proformaId);
                if (prof && prof.detalles) {
                    matchDetalle = this.findMatchingProformaDetalle(curr, prof.detalles);
                }
            }

            let unitGrossPrice = Number(curr.precio || 0) / currCant;

            if (matchDetalle) {
                const detalleCant = Math.max(1, Number(matchDetalle.cantidad || 1));

                let ugp = Number(matchDetalle.precioUnitario || 0);
                if (ugp <= 0 && Number(matchDetalle.subTotal || 0) > 0) {
                    ugp = Number(matchDetalle.subTotal) / detalleCant;
                } else if (ugp <= 0 && Number(matchDetalle.total || 0) > 0) {
                    ugp = Number(matchDetalle.total) / detalleCant;
                }
                if (ugp > 0) {
                    unitGrossPrice = ugp;
                }

                discountPct = Number(matchDetalle.descuento || 0);
                if (discountPct === 0 && Number(matchDetalle.subTotal || 0) > Number(matchDetalle.total || 0) && Number(matchDetalle.subTotal || 0) > 0) {
                    discountPct = Math.round(((Number(matchDetalle.subTotal) - Number(matchDetalle.total)) / Number(matchDetalle.subTotal)) * 100);
                }

                let unitNetPrice = 0;
                if (Number(matchDetalle.total || 0) > 0) {
                    unitNetPrice = Number(matchDetalle.total) / detalleCant;
                } else {
                    unitNetPrice = unitGrossPrice * (1 - discountPct / 100);
                }

                itemPrice = unitNetPrice * currCant;

                if (discountPct > 0) {
                    discountAmt = (unitGrossPrice * currCant) * (discountPct / 100);
                }
            }
            return { curr, currCant, unitGrossPrice, itemPrice, discountAmt, discountPct };
        });

        const hasDiscount = rowsData.some((r: any) => r.discountAmt > 0);

        const headerRow: any[] = [
            { text: 'Fecha', style: 'tableHeader' },
            { text: 'Pieza', style: 'tableHeader' },
            { text: 'Tratamiento / Procedimiento', style: 'tableHeader' },
            { text: 'Cant.', style: 'tableHeader', alignment: 'center' },
            { text: 'P. Unit. (Bs.)', style: 'tableHeader', alignment: 'right' }
        ];
        if (hasDiscount) headerRow.push({ text: 'Descuento (Bs.)', style: 'tableHeader', alignment: 'right' });
        headerRow.push({ text: 'Monto (Bs.)', style: 'tableHeader', alignment: 'right' });

        const historiaTableBody = [
            headerRow,
            ...(sortedHistoria.length > 0
                ? rowsData.map((r: any) => {
                    const row: any[] = [
                        { text: formatDate(r.curr.fecha), fontSize: 8 },
                        { text: r.curr.pieza || '-', fontSize: 8 },
                        { text: r.curr.tratamiento || '-', fontSize: 8 },
                        { text: String(r.currCant), fontSize: 8, alignment: 'center' },
                        { text: formatCurrency(r.unitGrossPrice), fontSize: 8, alignment: 'right' }
                    ];
                    if (hasDiscount) {
                        if (r.discountAmt > 0) {
                            row.push({ text: `${r.discountPct}% (${formatCurrency(r.discountAmt)})`, fontSize: 8, alignment: 'right' });
                        } else {
                            row.push({ text: '-', fontSize: 8, alignment: 'center' });
                        }
                    }
                    row.push({ text: formatCurrency(r.itemPrice), fontSize: 8, alignment: 'right' });
                    return row;
                })
                : [[
                    { text: '-', fontSize: 8 },
                    { text: '-', fontSize: 8 },
                    { text: 'No hay tratamientos ejecutados registrados', fontSize: 8 },
                    { text: '-', fontSize: 8, alignment: 'center' },
                    { text: '-', fontSize: 8, alignment: 'right' },
                    ...(hasDiscount ? [{ text: '-', fontSize: 8, alignment: 'center' }] : []),
                    { text: '0,00', fontSize: 8, alignment: 'right' }
                ]])
        ];

        // Section 2: Historial de Pagos Registrados
        const pagosHeaderRow: any[] = [
            { text: 'Fecha', style: 'tableHeader' },
            { text: 'Recibo / Factura', style: 'tableHeader' },
            { text: 'Monto', style: 'tableHeader', alignment: 'right' },
            { text: 'Moneda', style: 'tableHeader' },
            { text: 'Forma de Pago', style: 'tableHeader' },
            { text: 'Observaciones', style: 'tableHeader' }
        ];

        const pagosTableBody = [
            pagosHeaderRow,
            ...(sortedPagos.length > 0 ? sortedPagos.map((pago: any) => {
                const isDollar = pago.moneda === 'Dólares';
                const reciboFactura = [
                    pago.recibo ? `R: ${pago.recibo}` : '',
                    pago.factura ? `F: ${pago.factura}` : ''
                ].filter(Boolean).join(' / ') || '-';
                const montoStr = isDollar ? `USD ${formatCurrency(pago.monto)}` : `Bs. ${formatCurrency(pago.monto)}`;
                const monedaStr = isDollar ? `Dólares (TC: ${formatCurrency(pago.tc || 6.96)})` : (pago.moneda || 'Bolivianos');
                const formaPagoStr = pago.formaPagoRel ? pago.formaPagoRel.forma_pago : (pago.formaPago || 'Efectivo');

                return [
                    { text: formatDate(pago.fecha), fontSize: 8 },
                    { text: reciboFactura, fontSize: 8 },
                    { text: montoStr, fontSize: 8, alignment: 'right' },
                    { text: monedaStr, fontSize: 8 },
                    { text: formaPagoStr, fontSize: 8 },
                    { text: pago.observaciones || '-', fontSize: 8 }
                ];
            }) : [[
                { text: '-', fontSize: 8 },
                { text: '-', fontSize: 8 },
                { text: 'Bs. 0,00', fontSize: 8, alignment: 'right' },
                { text: '-', fontSize: 8 },
                { text: '-', fontSize: 8 },
                { text: 'No hay pagos registrados', fontSize: 8 }
            ]])
        ];

        // Financial Summary values
        const totalPresupuesto = selectedProforma ? Number(selectedProforma.total || 0) : 0;
        const executedByDetalle = new Map<number, number>();
        let rawTotalEjecutado = 0;

        sortedHistoria.forEach((curr: any) => {
            let itemPrice = Number(curr.precio || 0);
            let matchDetalle: any = null;
            if (selectedProforma && selectedProforma.detalles) {
                matchDetalle = this.findMatchingProformaDetalle(curr, selectedProforma.detalles);
            } else if (curr.proformaId) {
                const prof = proformas.find((p: any) => p.id === curr.proformaId);
                if (prof && prof.detalles) {
                    matchDetalle = this.findMatchingProformaDetalle(curr, prof.detalles);
                }
            }

            if (matchDetalle && Number(matchDetalle.total || 0) >= 0 && Number(matchDetalle.cantidad || 1) > 0) {
                const unitNetPrice = Number(matchDetalle.total) / Number(matchDetalle.cantidad || 1);
                itemPrice = unitNetPrice * Number(curr.cantidad || 1);

                const prev = executedByDetalle.get(matchDetalle.id) || 0;
                const maxForThisDetalle = Number(matchDetalle.total || 0);
                const allowed = Math.max(0, Math.min(itemPrice, maxForThisDetalle - prev));
                executedByDetalle.set(matchDetalle.id, prev + allowed);
                rawTotalEjecutado += allowed;
                return;
            }

            rawTotalEjecutado += itemPrice;
        });

        const totalEjecutado = totalPresupuesto > 0 ? Math.min(rawTotalEjecutado, totalPresupuesto) : rawTotalEjecutado;

        const totalPagado = sortedPagos.reduce((acc: number, curr: any) => {
            const val = curr.moneda === 'Dólares'
                ? Number(curr.monto || 0) * (Number(curr.tc) || 6.96)
                : Number(curr.monto || 0);
            return acc + val;
        }, 0);

        const saldo = totalPagado - totalEjecutado;
        const saldoFavor = saldo > 0 ? saldo : 0;
        const saldoContra = saldo < 0 ? Math.abs(saldo) : 0;

        const pacienteNombre = `${paciente.paterno || ''} ${paciente.materno || ''} ${paciente.nombre || ''}`.replace(/\s+/g, ' ').trim().toUpperCase();
        const planText = selectedProforma
            ? `Plan #${selectedProforma.numero || selectedProforma.id} - ${formatDate(selectedProforma.fecha)}`
            : 'Todos los planes';

        const docDefinition = {
            pageSize: 'A4',
            pageMargins: [42.5, 42.5, 42.5, 56.7],
            header: null,
            content: [
                // Header: Logo & Title
                {
                    columns: [
                        logoBase64 ? {
                            image: logoBase64,
                            width: 100,
                            height: 40
                        } : { text: 'CURARE', fontSize: 16, bold: true, color: '#3498db' },
                        {
                            text: 'ESTADO DE CUENTAS',
                            style: 'header',
                            alignment: 'center',
                            margin: [0, 8, 0, 0]
                        }
                    ],
                    margin: [0, 0, 0, 8]
                },
                // Blue line
                {
                    canvas: [
                        {
                            type: 'line',
                            x1: 0, y1: 0,
                            x2: 510, y2: 0,
                            lineWidth: 1.5,
                            lineColor: '#3498db'
                        }
                    ],
                    margin: [0, 0, 0, 10]
                },
                // Patient & Plan Info Box
                {
                    stack: [
                        {
                            canvas: [
                                {
                                    type: 'rect',
                                    x: 0, y: 0,
                                    w: 510, h: 36,
                                    color: '#f8f9fa'
                                },
                                {
                                    type: 'rect',
                                    x: 0, y: 0,
                                    w: 3, h: 36,
                                    color: '#3498db'
                                }
                            ]
                        },
                        {
                            text: [
                                { text: 'PACIENTE:  ', bold: true, fontSize: 9, color: '#333' },
                                { text: pacienteNombre, fontSize: 9, color: '#111' }
                            ],
                            relativePosition: { x: 12, y: -30 }
                        },
                        {
                            text: [
                                { text: 'PLAN DE TRATAMIENTO:  ', bold: true, fontSize: 9, color: '#333' },
                                { text: planText, fontSize: 9, color: '#111' }
                            ],
                            relativePosition: { x: 12, y: -15 }
                        }
                    ],
                    margin: [0, 0, 0, 12]
                },
                // Section 1: Tratamientos Ejecutados
                {
                    text: 'TRATAMIENTOS EJECUTADOS (HISTORIA CLÍNICA)',
                    style: 'subheader',
                    margin: [0, 4, 0, 6]
                },
                {
                    table: {
                        headerRows: 1,
                        widths: hasDiscount ? [45, 35, '*', 25, 50, 65, 50] : [50, 40, '*', 30, 60, 60],
                        body: historiaTableBody
                    },
                    layout: {
                        fillColor: function (rowIndex: number) {
                            return rowIndex === 0 ? '#ebf5ff' : (rowIndex % 2 === 0 ? '#f8f9fa' : null);
                        },
                        hLineWidth: function () { return 0.5; },
                        vLineWidth: function () { return 0.5; },
                        hLineColor: function () { return '#cbd5e1'; },
                        vLineColor: function () { return '#cbd5e1'; },
                        paddingLeft: function () { return 4; },
                        paddingRight: function () { return 4; },
                        paddingTop: function () { return 3; },
                        paddingBottom: function () { return 3; }
                    },
                    margin: [0, 0, 0, 12]
                },
                // Section 2: Historial de Pagos
                {
                    text: 'HISTORIAL DE PAGOS REGISTRADOS',
                    style: 'subheader',
                    margin: [0, 4, 0, 6]
                },
                {
                    table: {
                        headerRows: 1,
                        widths: [55, 70, 60, 70, 65, '*'],
                        body: pagosTableBody
                    },
                    layout: {
                        fillColor: function (rowIndex: number) {
                            return rowIndex === 0 ? '#ebf5ff' : (rowIndex % 2 === 0 ? '#f8f9fa' : null);
                        },
                        hLineWidth: function () { return 0.5; },
                        vLineWidth: function () { return 0.5; },
                        hLineColor: function () { return '#cbd5e1'; },
                        vLineColor: function () { return '#cbd5e1'; },
                        paddingLeft: function () { return 4; },
                        paddingRight: function () { return 4; },
                        paddingTop: function () { return 3; },
                        paddingBottom: function () { return 3; }
                    },
                    margin: [0, 0, 0, 12]
                },
                // Financial Summary Card
                {
                    stack: [
                        {
                            canvas: [
                                {
                                    type: 'rect',
                                    x: 0, y: 0,
                                    w: 510, h: 42,
                                    color: '#f8fafc',
                                    lineColor: '#cbd5e1',
                                    lineWidth: 0.5
                                },
                                {
                                    type: 'rect',
                                    x: 0, y: 0,
                                    w: 3, h: 42,
                                    color: '#3498db'
                                }
                            ]
                        },
                        {
                            columns: [
                                {
                                    stack: [
                                        { text: 'TOTAL PRESUPUESTO', fontSize: 7, bold: true, color: '#64748b' },
                                        { text: `Bs. ${formatCurrency(totalPresupuesto)}`, fontSize: 9, bold: true, color: '#1d4ed8', margin: [0, 2, 0, 0] }
                                    ],
                                    margin: [8, 6, 0, 0]
                                },
                                {
                                    stack: [
                                        { text: 'TOTAL EJECUTADO', fontSize: 7, bold: true, color: '#64748b' },
                                        { text: `Bs. ${formatCurrency(totalEjecutado)}`, fontSize: 9, bold: true, color: '#1e293b', margin: [0, 2, 0, 0] }
                                    ],
                                    margin: [0, 6, 0, 0]
                                },
                                {
                                    stack: [
                                        { text: 'TOTAL PAGADO', fontSize: 7, bold: true, color: '#64748b' },
                                        { text: `Bs. ${formatCurrency(totalPagado)}`, fontSize: 9, bold: true, color: '#1e293b', margin: [0, 2, 0, 0] }
                                    ],
                                    margin: [0, 6, 0, 0]
                                },
                                {
                                    stack: [
                                        {
                                            text: saldoFavor > 0 ? 'SALDO A FAVOR' : (saldoContra > 0 ? 'SALDO EN CONTRA' : 'SALDO'),
                                            fontSize: 7,
                                            bold: true,
                                            color: saldoFavor > 0 ? '#15803d' : (saldoContra > 0 ? '#b91c1c' : '#64748b')
                                        },
                                        {
                                            text: `Bs. ${formatCurrency(saldoFavor > 0 ? saldoFavor : (saldoContra > 0 ? saldoContra : 0))}`,
                                            fontSize: 9,
                                            bold: true,
                                            color: saldoFavor > 0 ? '#15803d' : (saldoContra > 0 ? '#b91c1c' : '#1e293b'),
                                            margin: [0, 2, 0, 0]
                                        }
                                    ],
                                    margin: [0, 6, 8, 0]
                                }
                            ],
                            relativePosition: { x: 5, y: -40 }
                        }
                    ],
                    margin: [0, 5, 0, 10]
                }
            ],
            footer: (currentPage: number, pageCount: number) => {
                return {
                    stack: [
                        {
                            canvas: [
                                { type: 'line', x1: 42.5, y1: 0, x2: 552.5, y2: 0, lineWidth: 0.5, lineColor: '#cbd5e1' }
                            ],
                            margin: [0, 0, 0, 4]
                        },
                        {
                            text: `Fecha de impresión: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
                            alignment: 'right',
                            fontSize: 8,
                            color: '#64748b',
                            margin: [0, 0, 42.5, 0]
                        }
                    ]
                };
            },
            styles: {
                header: {
                    fontSize: 16,
                    bold: true,
                    color: '#2c3e50'
                },
                subheader: {
                    fontSize: 10,
                    color: '#2c3e50',
                    bold: true
                },
                tableHeader: {
                    bold: true,
                    fontSize: 8,
                    color: '#1e293b'
                }
            },
            defaultStyle: {
                font: 'Helvetica',
                fontSize: 8
            }
        };

        return new Promise((resolve, reject) => {
            const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
            const chunks: Buffer[] = [];

            pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', reject);

            pdfDoc.end();
        });
    }

    async generateReciboSinglePdf(
        pago: any,
        targetProforma?: any,
        proformas: any[] = [],
        historia: any[] = [],
        allPacientePagos: any[] = []
    ): Promise<Buffer> {
        const logoBase64 = this.getLogoBase64();

        const formatDate = (dateString: string) => {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        };

        const formatCurrency = (val: number | string | undefined | null): string => {
            if (val === undefined || val === null || val === '') return '0,00';
            const num = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : Number(val);
            if (isNaN(num)) return '0,00';
            return new Intl.NumberFormat('de-DE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(num);
        };

        const totalPresupuesto = targetProforma
            ? Number(targetProforma.total || 0)
            : (proformas.length > 0 ? proformas.reduce((sum, p) => sum + Number(p.total || 0), 0) : 0);

        const relevantHistoria = (historia || []).filter((h: any) =>
            h.estadoTratamiento === 'terminado' && (!pago.proformaId || h.proformaId === pago.proformaId)
        );

        const relevantPagos = pago.proformaId
            ? (allPacientePagos || []).filter((p: any) => p.proformaId === pago.proformaId || p.proforma?.id === pago.proformaId)
            : (allPacientePagos || []);

        const executedByDetalle = new Map<number, number>();
        let rawTotalEjecutado = 0;

        relevantHistoria.forEach((curr: any) => {
            let itemPrice = Number(curr.precio || 0);
            if (targetProforma && targetProforma.detalles) {
                const matchDetalle = this.findMatchingProformaDetalle(curr, targetProforma.detalles);
                if (matchDetalle && Number(matchDetalle.total || 0) >= 0 && Number(matchDetalle.cantidad || 1) > 0) {
                    const unitNetPrice = Number(matchDetalle.total) / Number(matchDetalle.cantidad || 1);
                    itemPrice = unitNetPrice * Number(curr.cantidad || 1);

                    const prev = executedByDetalle.get(matchDetalle.id) || 0;
                    const maxForThisDetalle = Number(matchDetalle.total || 0);
                    const allowed = Math.max(0, Math.min(itemPrice, maxForThisDetalle - prev));
                    executedByDetalle.set(matchDetalle.id, prev + allowed);
                    rawTotalEjecutado += allowed;
                    return;
                }
            }
            rawTotalEjecutado += itemPrice;
        });

        const totalEjecutado = totalPresupuesto > 0 ? Math.min(rawTotalEjecutado, totalPresupuesto) : rawTotalEjecutado;

        const totalPagado = relevantPagos.reduce((acc: number, curr: any) => {
            const val = curr.moneda === 'Dólares'
                ? Number(curr.monto || 0) * (Number(curr.tc) || 6.96)
                : Number(curr.monto || 0);
            return acc + val;
        }, 0);

        const saldo = totalPagado - totalEjecutado;
        const saldoFavor = saldo > 0 ? saldo : 0;
        const saldoContra = saldo < 0 ? Math.abs(saldo) : 0;

        const pacienteNombre = pago.paciente
            ? `${pago.paciente.paterno || ''} ${pago.paciente.materno || ''} ${pago.paciente.nombre || ''}`.replace(/\s+/g, ' ').trim().toUpperCase()
            : 'N/A';

        const isDollar = pago.moneda === 'Dólares' || pago.moneda === '$us' || pago.moneda === 'USD';
        const montoStr = isDollar
            ? `$us. ${formatCurrency(pago.monto)}`
            : `Bs. ${formatCurrency(pago.monto)}`;

        const concepto = pago.proforma
            ? `Tratamiento Odontológico - Plan #${pago.proforma.numero}`
            : (targetProforma ? `Tratamiento Odontológico - Plan #${targetProforma.numero || targetProforma.id}` : 'Tratamiento Odontológico');

        let fp = pago.formaPagoRel ? pago.formaPagoRel.forma_pago : (pago.formaPago || 'Efectivo');
        if (pago.comisionTarjeta) fp += ` (${pago.comisionTarjeta.redBanco})`;

        const docDefinition = {
            pageSize: 'A4',
            pageMargins: [42.5, 42.5, 42.5, 56.7],
            content: [
                // Header
                {
                    columns: [
                        logoBase64 ? {
                            image: logoBase64,
                            width: 100,
                            height: 40
                        } : { text: 'CURARE', fontSize: 16, bold: true, color: '#3498db' },
                        {
                            text: 'RECIBO DE PAGO',
                            style: 'header',
                            alignment: 'center',
                            margin: [0, 8, 0, 0]
                        }
                    ],
                    margin: [0, 0, 0, 10]
                },
                // Blue line
                {
                    canvas: [
                        {
                            type: 'line',
                            x1: 0, y1: 0,
                            x2: 510, y2: 0,
                            lineWidth: 1.5,
                            lineColor: '#3498db'
                        }
                    ],
                    margin: [0, 0, 0, 15]
                },
                // Box for Recibo Info
                {
                    table: {
                        widths: ['*'],
                        body: [
                            [
                                {
                                    fillColor: '#f8f9fa',
                                    borderColor: ['#3498db', '#3498db', '#3498db', '#3498db'],
                                    border: [true, true, true, true],
                                    margin: [15, 12, 15, 12],
                                    stack: [
                                        // Line 1: Fecha & Nº Recibo
                                        {
                                            columns: [
                                                { text: 'Fecha:', width: 100, bold: true, fontSize: 10, color: '#111' },
                                                { text: formatDate(pago.fecha), width: 140, fontSize: 10, color: '#111' },
                                                { text: 'Nº Recibo:', width: 80, bold: true, fontSize: 10, color: '#111' },
                                                { text: pago.recibo || String(pago.id), bold: true, fontSize: 10, color: '#dc2626' }
                                            ],
                                            margin: [0, 0, 0, 10]
                                        },
                                        pago.factura ? {
                                            columns: [
                                                { text: 'Factura:', width: 100, bold: true, fontSize: 10, color: '#111' },
                                                { text: pago.factura, fontSize: 10, color: '#111' }
                                            ],
                                            margin: [0, 0, 0, 10]
                                        } : { text: '' },
                                        // Line 2: Paciente
                                        {
                                            columns: [
                                                { text: 'Paciente:', width: 100, bold: true, fontSize: 10, color: '#111' },
                                                { text: pacienteNombre, fontSize: 10, color: '#111' }
                                            ],
                                            margin: [0, 0, 0, 10]
                                        },
                                        // Line 3: Monto
                                        {
                                            columns: [
                                                { text: 'Monto:', width: 100, bold: true, fontSize: 10, color: '#111' },
                                                { text: montoStr, bold: true, fontSize: 11, color: '#16a34a' }
                                            ],
                                            margin: [0, 0, 0, 10]
                                        },
                                        // Line 4: Forma de Pago
                                        {
                                            columns: [
                                                { text: 'Forma de Pago:', width: 100, bold: true, fontSize: 10, color: '#111' },
                                                { text: fp, fontSize: 10, color: '#111' }
                                            ],
                                            margin: [0, 0, 0, 10]
                                        },
                                        // Line 5: Concepto
                                        {
                                            columns: [
                                                { text: 'Concepto:', width: 100, bold: true, fontSize: 10, color: '#111' },
                                                { text: concepto, fontSize: 10, color: '#111' }
                                            ],
                                            margin: [0, 0, 0, 10]
                                        },
                                        // Inner separator line
                                        {
                                            canvas: [
                                                {
                                                    type: 'line',
                                                    x1: 0, y1: 0,
                                                    x2: 475, y2: 0,
                                                    lineWidth: 0.5,
                                                    lineColor: '#cbd5e1'
                                                }
                                            ],
                                            margin: [0, 2, 0, 10]
                                        },
                                        // Financial Summary 2-column grid
                                        {
                                            columns: [
                                                // Left Col: Total Proforma & Saldo en Contra
                                                {
                                                    stack: [
                                                        {
                                                            columns: [
                                                                { text: 'Total Proforma:', width: 95, bold: true, fontSize: 9.5, color: '#111' },
                                                                { text: `Bs. ${formatCurrency(totalPresupuesto)}`, fontSize: 9.5, color: '#111' }
                                                            ],
                                                            margin: [0, 0, 0, 8]
                                                        },
                                                        {
                                                            columns: [
                                                                { text: 'Saldo en Contra:', width: 95, bold: true, fontSize: 9.5, color: '#111' },
                                                                {
                                                                    text: `Bs. ${formatCurrency(saldoContra)}`,
                                                                    bold: saldoContra > 0,
                                                                    fontSize: 9.5,
                                                                    color: saldoContra > 0 ? '#b91c1c' : '#111'
                                                                }
                                                            ]
                                                        }
                                                    ],
                                                    width: 240
                                                },
                                                // Right Col: Total Ejecutado & Saldo a Favor
                                                {
                                                    stack: [
                                                        {
                                                            columns: [
                                                                { text: 'Total Ejecutado:', width: 95, bold: true, fontSize: 9.5, color: '#111' },
                                                                { text: `Bs. ${formatCurrency(totalEjecutado)}`, fontSize: 9.5, color: '#111' }
                                                            ],
                                                            margin: [0, 0, 0, 8]
                                                        },
                                                        {
                                                            columns: [
                                                                { text: 'Saldo a Favor:', width: 95, bold: true, fontSize: 9.5, color: '#111' },
                                                                {
                                                                    text: `Bs. ${formatCurrency(saldoFavor)}`,
                                                                    bold: saldoFavor > 0,
                                                                    fontSize: 9.5,
                                                                    color: saldoFavor > 0 ? '#16a34a' : '#111'
                                                                }
                                                            ]
                                                        }
                                                    ],
                                                    width: '*'
                                                }
                                            ],
                                            margin: [0, 0, 0, 4]
                                        },
                                        pago.observaciones ? {
                                            columns: [
                                                { text: 'Observaciones:', width: 100, bold: true, fontSize: 9.5, color: '#111' },
                                                { text: pago.observaciones, fontSize: 9.5, color: '#333', italics: true }
                                            ],
                                            margin: [0, 8, 0, 0]
                                        } : { text: '' }
                                    ]
                                }
                            ]
                        ]
                    },
                    margin: [0, 0, 0, 30]
                },
                // Signatures
                {
                    columns: [
                        {
                            stack: [
                                { canvas: [{ type: 'line', x1: 20, y1: 0, x2: 180, y2: 0, lineWidth: 0.5, lineColor: '#333' }] },
                                { text: 'Entregué Conforme', alignment: 'center', fontSize: 9, margin: [0, 5, 0, 0] }
                            ],
                            width: 250
                        },
                        {
                            stack: [
                                { canvas: [{ type: 'line', x1: 20, y1: 0, x2: 180, y2: 0, lineWidth: 0.5, lineColor: '#333' }] },
                                { text: 'Recibí Conforme', alignment: 'center', fontSize: 9, margin: [0, 5, 0, 0] },
                                { text: 'CURARE CENTRO DENTAL', alignment: 'center', fontSize: 9, bold: true, margin: [0, 2, 0, 0] }
                            ],
                            width: '*'
                        }
                    ],
                    margin: [0, 20, 0, 0]
                }
            ],
            footer: (currentPage: number, pageCount: number) => {
                return {
                    stack: [
                        {
                            canvas: [
                                { type: 'line', x1: 42.5, y1: 0, x2: 552.5, y2: 0, lineWidth: 0.5, lineColor: '#cbd5e1' }
                            ],
                            margin: [0, 0, 0, 4]
                        },
                        {
                            text: `Impreso el: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
                            alignment: 'left',
                            fontSize: 8,
                            color: '#64748b',
                            margin: [42.5, 0, 0, 0]
                        }
                    ]
                };
            },
            styles: {
                header: {
                    fontSize: 18,
                    bold: true,
                    color: '#2c3e50'
                }
            },
            defaultStyle: {
                font: 'Helvetica',
                fontSize: 10
            }
        };

        return new Promise((resolve, reject) => {
            const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
            const chunks: Buffer[] = [];
            pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', reject);
            pdfDoc.end();
        });
    }

    private getLogoBase64(): string {
        const possiblePaths = [
            path.join(process.cwd(), 'frontend/public/logo-curare.png'),
            path.join(process.cwd(), '../frontend/public/logo-curare.png'),
            path.join(__dirname, '../../../frontend/public/logo-curare.png'),
            path.join(__dirname, '../../../../frontend/public/logo-curare.png'),
        ];

        for (const logoPath of possiblePaths) {
            try {
                if (fs.existsSync(logoPath)) {
                    const logoBuffer = fs.readFileSync(logoPath);
                    return `data:image/png;base64,${logoBuffer.toString('base64')}`;
                }
            } catch (e) { }
        }
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    }
}
