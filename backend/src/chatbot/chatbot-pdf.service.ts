import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PdfPrinter = require('pdfmake');

@Injectable()
export class ChatbotPdfService {
    private printer: any;

    constructor(
        private readonly dataSource: DataSource
    ) {
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

    async generateProformasPdf(paciente: any, proformas: any[]): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const content: any[] = [];

            proformas.forEach((p, index) => {
                if (index > 0) {
                    content.push({ text: '', pageBreak: 'before' });
                }

                content.push({
                    text: this.formatDateSpanish(p.fecha),
                    alignment: 'right',
                    fontSize: 10,
                    margin: [0, 0, 0, 15]
                });

                const patientName = `${paciente.paterno || ''} ${paciente.materno || ''} ${paciente.nombre || ''}`.trim().toUpperCase();

                content.push({ text: 'Señor(a):', fontSize: 11, margin: [0, 0, 0, 2] });
                content.push({ text: patientName, fontSize: 11, bold: true, margin: [0, 0, 0, 10] });

                content.push({ text: 'De mi consideración:', fontSize: 11, margin: [0, 0, 0, 5] });
                content.push({
                    text: 'Según los estudios realizados le presentamos el siguiente presupuesto del tratamiento odontológico que Ud. requiere:',
                    fontSize: 11,
                    margin: [0, 0, 0, 10]
                });

                content.push({
                    text: `Pre. # ${(p.numero || 0).toString().padStart(2, '0')}`,
                    alignment: 'right',
                    bold: true,
                    fontSize: 11,
                    margin: [0, 0, 0, 5]
                });

                const hasDiscount = p.detalles?.some((d: any) => Number(d.descuento || 0) > 0);

                const tableHeader = [
                    { text: 'Descripción', style: 'tableHeader', alignment: 'left' },
                    { text: 'Pieza(s)', style: 'tableHeader', alignment: 'center' },
                    { text: 'Cant.', style: 'tableHeader', alignment: 'center' },
                    { text: 'P.U.', style: 'tableHeader', alignment: 'right' },
                    { text: 'Total', style: 'tableHeader', alignment: 'right' }
                ];

                const widths: any[] = ['*', 'auto', 'auto', 'auto', 'auto'];

                if (hasDiscount) {
                    tableHeader.push(
                        { text: 'Descuento %', style: 'tableHeader', alignment: 'center' },
                        { text: 'Total con Dcto %', style: 'tableHeader', alignment: 'right' }
                    );
                    widths.push('auto', 'auto');
                }

                const body: any[] = [tableHeader];

                if (p.detalles) {
                    p.detalles.forEach((d: any) => {
                        const row = [
                            { text: d.arancel?.detalle || d.tratamiento || '', alignment: 'left' },
                            { text: d.piezas || '', alignment: 'center' },
                            { text: (d.cantidad || 0).toString(), alignment: 'center' },
                            { text: Number(d.precioUnitario || 0).toFixed(2), alignment: 'right' },
                            { text: Number(d.subTotal || 0).toFixed(2), alignment: 'right' }
                        ];

                        if (hasDiscount) {
                            row.push(
                                { text: (d.descuento || 0).toString(), alignment: 'center' },
                                { text: Number(d.total || 0).toFixed(2), alignment: 'right' }
                            );
                        }
                        body.push(row);
                    });
                }

                content.push({
                    table: {
                        headerRows: 1,
                        widths: widths,
                        body: body
                    },
                    layout: {
                        hLineWidth: (i: number) => 0.5,
                        vLineWidth: (i: number) => 0.5,
                        hLineColor: (i: number) => '#000',
                        vLineColor: (i: number) => '#000',
                        paddingLeft: (i: number) => 2,
                        paddingRight: (i: number) => 2,
                    },
                    fontSize: 9,
                    margin: [0, 0, 0, 10]
                });

                content.push({
                    table: {
                        widths: ['*', 'auto', 'auto'],
                        body: [
                            [
                                { text: '', border: [false, false, false, false] },
                                { text: 'TOTAL Bs.', bold: true, alignment: 'right', border: [true, true, true, true], fillColor: '#fff' },
                                { text: Number(p.total || 0).toFixed(2), bold: true, alignment: 'right', border: [true, true, true, true], fillColor: '#fff' }
                            ]
                        ]
                    },
                    margin: [0, 0, 0, 10]
                });

                const totalVal = Number(p.total || 0);
                const decimalPart = (totalVal % 1).toFixed(2).substring(2);
                const words = this.numberToWords(totalVal);
                content.push({
                    text: `SON: ${words} ${decimalPart}/100 BOLIVIANOS`,
                    fontSize: 10,
                    margin: [0, 0, 0, 10]
                });

                content.push({
                    table: {
                        widths: ['*'],
                        body: [
                            [{ text: 'SISTEMA DE PAGO', bold: true, border: [true, true, true, false] }],
                            [{
                                text: '- Cancelación del 50% al inicio. 30% durante el tratamiento. 20% antes de finalizado el mismo.',
                                border: [true, false, true, true],
                                margin: [0, 5, 0, 5]
                            }]
                        ]
                    },
                    margin: [0, 10, 0, 10],
                    fontSize: 10
                });

                content.push({
                    text: [
                        { text: 'NOTA: CURARE ', bold: true },
                        'garantiza los trabajos realizados si el paciente sigue las recomendaciones indicadas y asiste a sus controles periódicos de manera puntual.'
                    ],
                    fontSize: 10,
                    margin: [0, 0, 0, 15]
                });

                content.push({
                    text: 'El presente presupuesto podría tener modificaciones en el transcurso del tratamiento; el mismo será notificado oportunamente a su persona.',
                    fontSize: 10,
                    margin: [0, 0, 0, 2]
                });
                content.push({
                    text: 'Presupuesto válido por 15 días.',
                    fontSize: 10,
                    margin: [0, 0, 0, 2]
                });
                content.push({
                    text: 'En conformidad y aceptando el presente presupuesto, firmo.',
                    fontSize: 10,
                    margin: [0, 0, 0, 20]
                });

                content.push({
                    columns: [
                        {
                            width: '*',
                            stack: [
                                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 120, y2: 0, lineWidth: 1 }] },
                                { text: 'CURARE', alignment: 'center', margin: [0, 5, 0, 0], width: 120 }
                            ],
                            alignment: 'center'
                        },
                        {
                            width: '*',
                            stack: [
                                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 120, y2: 0, lineWidth: 1 }] },
                                { text: patientName, alignment: 'center', margin: [0, 5, 0, 0], width: 120 }
                            ],
                            alignment: 'center'
                        }
                    ],
                    margin: [0, 20, 0, 0]
                });
            });

            const docDefinition = {
                defaultStyle: {
                    font: 'Helvetica',
                    fontSize: 11
                },
                content: content,
                styles: {
                    tableHeader: { bold: true, fontSize: 10, color: 'black', fillColor: '#eeeeee' }
                },
                pageSize: 'LETTER',
                pageMargins: [40, 40, 40, 40]
            };

            const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
            const chunks: any[] = [];
            pdfDoc.on('data', (chunk: any) => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', (err: any) => reject(err));
            pdfDoc.end();
        });
    }

    async generateEstadoCuentaPdf(paciente: any, proformaGroups: any[]): Promise<Buffer> {
        let logoBase64: string | null = null;
        const possibleLogoPaths = [
            path.join(process.cwd(), '../frontend/public/logo-clinica-dental.jpg'),
            path.join(__dirname, '../../../frontend/public/logo-clinica-dental.jpg'),
        ];
        for (const p of possibleLogoPaths) {
            if (fs.existsSync(p)) {
                logoBase64 = `data:image/jpeg;base64,${fs.readFileSync(p).toString('base64')}`;
                break;
            }
        }

        let centroDental: any = null;
        try {
            const result = await this.dataSource.query('SELECT * FROM "datos_centro_dental" LIMIT 1');
            if (result && result.length > 0) {
                centroDental = result[0];
            }
        } catch (error) {
            console.error('Error fetching datos_centro_dental in generateEstadoCuentaPdf:', error);
        }

        return new Promise((resolve, reject) => {
            const content: any[] = [];
            const patientName = `${paciente.nombre || ''} ${paciente.paterno || ''} ${paciente.materno || ''}`.trim().toUpperCase();

            const headerColumns: any[] = [];

            if (logoBase64) {
                headerColumns.push({
                    image: logoBase64,
                    width: 65,
                    alignment: 'left'
                });
            } else {
                headerColumns.push({ text: '', width: 65 });
            }

            headerColumns.push({
                text: 'ESTADO DE CUENTA',
                fontSize: 18,
                bold: true,
                color: '#2c3e50',
                alignment: 'center',
                margin: [0, 15, 0, 0]
            });

            headerColumns.push({ text: '', width: 65 });

            content.push({
                columns: headerColumns,
                margin: [0, 0, 0, 10]
            });

            content.push({
                canvas: [
                    { type: 'line', x1: 0, y1: 0, x2: 532, y2: 0, lineWidth: 2, lineColor: '#3498db' }
                ],
                margin: [0, 0, 0, 15]
            });

            content.push({
                stack: [
                    {
                        canvas: [
                            { type: 'rect', x: 0, y: 0, w: 532, h: 32, color: '#f8f9fa' },
                            { type: 'rect', x: 0, y: 0, w: 4, h: 32, color: '#3498db' }
                        ]
                    },
                    {
                        text: [
                            { text: 'PACIENTE: ', bold: true, color: '#2c3e50', fontSize: 10 },
                            { text: patientName, color: '#333333', fontSize: 10, bold: true }
                        ],
                        relativePosition: { x: 12, y: -22 }
                    }
                ],
                margin: [0, 0, 0, 20]
            });

            proformaGroups.forEach((group, index) => {
                if (index > 0) {
                    content.push({ text: '', pageBreak: 'before' });
                }

                const titleText = group.proforma
                    ? `PLAN DE TRATAMIENTO #${(group.proforma.numero || group.proforma.id || 0).toString().padStart(2, '0')}`
                    : 'RESUMEN GENERAL DE TRATAMIENTOS Y PAGOS';

                content.push({
                    text: titleText,
                    fontSize: 12,
                    bold: true,
                    color: '#2c3e50',
                    margin: [0, 5, 0, 10]
                });

                content.push({
                    text: 'Resumen de Historia Clínica:',
                    fontSize: 10,
                    bold: true,
                    color: '#34495e',
                    margin: [0, 0, 0, 5]
                });

                const hcTableHeader = [
                    { text: 'Fecha', style: 'tableHeader' },
                    { text: 'Pieza(s)', style: 'tableHeader' },
                    { text: 'Tratamiento', style: 'tableHeader' },
                    { text: 'Observaciones', style: 'tableHeader' },
                    { text: 'Cant.', style: 'tableHeader' },
                    { text: 'Doctor(a)', style: 'tableHeader' },
                    { text: 'Diagnóstico', style: 'tableHeader' },
                    { text: 'Estado', style: 'tableHeader' }
                ];

                const hcBody: any[] = [hcTableHeader];

                if (group.historias && group.historias.length > 0) {
                    group.historias.forEach((h: any) => {
                        const dateStr = h.fecha ? new Date(h.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
                        const docName = h.doctor ? `${h.doctor.paterno || ''} ${h.doctor.nombre || ''}`.trim() : '-';
                        hcBody.push([
                            { text: dateStr, fontSize: 8 },
                            { text: h.pieza || '-', fontSize: 8 },
                            { text: h.tratamiento || '-', fontSize: 8 },
                            { text: h.observaciones || '-', fontSize: 8 },
                            { text: (h.cantidad || 1).toString(), fontSize: 8, alignment: 'center' },
                            { text: docName, fontSize: 8 },
                            { text: h.diagnostico || '-', fontSize: 8 },
                            { text: h.estadoTratamiento || h.estadoPresupuesto || '-', fontSize: 8 }
                        ]);
                    });
                } else {
                    hcBody.push([
                        { text: 'Sin registros de historia clínica', colSpan: 8, alignment: 'center', fontSize: 8, color: '#7f8c8d' },
                        {}, {}, {}, {}, {}, {}, {}
                    ]);
                }

                content.push({
                    table: {
                        headerRows: 1,
                        widths: ['auto', 'auto', '*', '*', 'auto', 'auto', '*', 'auto'],
                        body: hcBody
                    },
                    layout: {
                        fillColor: (rowIndex: number) => (rowIndex === 0 ? '#3498db' : rowIndex % 2 === 0 ? '#f8f9fa' : null),
                        hLineWidth: () => 1,
                        vLineWidth: () => 1,
                        hLineColor: () => '#ddd',
                        vLineColor: () => '#ddd'
                    },
                    fontSize: 8,
                    margin: [0, 0, 0, 15]
                });

                content.push({
                    text: 'Historial de Pagos:',
                    fontSize: 10,
                    bold: true,
                    color: '#34495e',
                    margin: [0, 0, 0, 5]
                });

                const pagosTableHeader = [
                    { text: 'Fecha', style: 'tableHeader' },
                    { text: 'Monto', style: 'tableHeader' },
                    { text: 'Moneda', style: 'tableHeader' },
                    { text: 'Forma Pago', style: 'tableHeader' },
                    { text: 'Recibo/Factura', style: 'tableHeader' }
                ];

                const pagosBody: any[] = [pagosTableHeader];

                if (group.pagos && group.pagos.length > 0) {
                    group.pagos.forEach((pago: any) => {
                        const dateStr = pago.fecha ? new Date(pago.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
                        const rf = pago.recibo ? `R: ${pago.recibo}` : (pago.factura ? `F: ${pago.factura}` : '-');
                        pagosBody.push([
                            { text: dateStr, fontSize: 8 },
                            { text: `Bs. ${Number(pago.monto || 0).toFixed(2)}`, fontSize: 8, alignment: 'right' },
                            { text: pago.moneda || 'Bolivianos', fontSize: 8 },
                            { text: pago.formaPagoRel?.forma_pago || '-', fontSize: 8 },
                            { text: rf, fontSize: 8 }
                        ]);
                    });
                } else {
                    pagosBody.push([
                        { text: 'Sin pagos registrados', colSpan: 5, alignment: 'center', fontSize: 8, color: '#7f8c8d' },
                        {}, {}, {}, {}
                    ]);
                }

                content.push({
                    table: {
                        headerRows: 1,
                        widths: ['*', '*', '*', '*', '*'],
                        body: pagosBody
                    },
                    layout: {
                        fillColor: (rowIndex: number) => (rowIndex === 0 ? '#3498db' : rowIndex % 2 === 0 ? '#f8f9fa' : null),
                        hLineWidth: () => 1,
                        vLineWidth: () => 1,
                        hLineColor: () => '#ddd',
                        vLineColor: () => '#ddd'
                    },
                    fontSize: 8,
                    margin: [0, 0, 0, 15]
                });

                if (group.proforma && group.proforma.plan_pagos && group.proforma.plan_pagos.activo === true) {
                    const plan = group.proforma.plan_pagos;
                    const meses = Number(plan.meses || 1);
                    const dia = Number(plan.diaPago || 15);
                    const cuotaInicial = Number(plan.cuotaInicial || 0);
                    const totalTratamiento = Number(group.totalEjecutado || group.proforma.total || 0);
                    const montoParaCuotas = Math.max(0, totalTratamiento - cuotaInicial);
                    const cuotaMensual = meses > 0 ? (montoParaCuotas / meses) : 0;
                    const fechaActual = new Date(plan.fechaInicio || group.proforma.fecha || new Date());
                    const totalPagado = Number(group.totalPagado || 0);

                    content.push({
                        text: 'Plan de Pagos Activo (Cronograma Proyectado):',
                        fontSize: 10,
                        bold: true,
                        color: '#34495e',
                        margin: [0, 5, 0, 5]
                    });

                    const planTableHeader = [
                        { text: 'Nº Cuota', style: 'tableHeader' },
                        { text: 'Monto Proyectado', style: 'tableHeader' },
                        { text: 'Fecha Vencimiento', style: 'tableHeader' },
                        { text: 'Estado', style: 'tableHeader' }
                    ];

                    const planBody: any[] = [planTableHeader];

                    if (cuotaInicial > 0) {
                        const isInitialPaid = totalPagado >= cuotaInicial - 0.1;
                        const dateStr = fechaActual.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                        planBody.push([
                            { text: 'Cuota Inicial', fontSize: 8, bold: true },
                            { text: `Bs. ${cuotaInicial.toFixed(2)}`, fontSize: 8, alignment: 'right' },
                            { text: dateStr, fontSize: 8, alignment: 'center' },
                            { text: isInitialPaid ? 'Pagado' : 'Pendiente', fontSize: 8, alignment: 'center', color: isInitialPaid ? '#27ae60' : '#e74c3c', bold: true }
                        ]);
                    }

                    for (let i = 1; i <= meses; i++) {
                        let nextMonth = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + i, dia);
                        if (nextMonth.getMonth() !== (fechaActual.getMonth() + i) % 12) {
                            nextMonth = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + i + 1, 0);
                        }

                        const montoAcumuladoRequerido = cuotaInicial + (cuotaMensual * i);
                        const isPaid = totalPagado >= montoAcumuladoRequerido - 0.1;
                        const dateStr = nextMonth.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

                        planBody.push([
                            { text: `Cuota ${i}`, fontSize: 8 },
                            { text: `Bs. ${cuotaMensual.toFixed(2)}`, fontSize: 8, alignment: 'right' },
                            { text: dateStr, fontSize: 8, alignment: 'center' },
                            { text: isPaid ? 'Pagado' : 'Pendiente', fontSize: 8, alignment: 'center', color: isPaid ? '#27ae60' : '#e74c3c', bold: true }
                        ]);
                    }

                    content.push({
                        table: {
                            headerRows: 1,
                            widths: ['*', '*', '*', '*'],
                            body: planBody
                        },
                        layout: {
                            fillColor: (rowIndex: number) => (rowIndex === 0 ? '#3498db' : rowIndex % 2 === 0 ? '#f8f9fa' : null),
                            hLineWidth: () => 1,
                            vLineWidth: () => 1,
                            hLineColor: () => '#ddd',
                            vLineColor: () => '#ddd'
                        },
                        fontSize: 8,
                        margin: [0, 0, 0, 15]
                    });
                }

                const hasPending = Number(group.saldoPendiente || 0) > 0;
                const pendingColor = hasPending ? '#e74c3c' : '#27ae60';

                content.push({
                    columns: [
                        {
                            stack: [
                                {
                                    stack: [
                                        { text: 'TOTAL PAGADO:', fontSize: 8, color: '#666', bold: true },
                                        { text: `Bs. ${Number(group.totalPagado || 0).toFixed(2)}`, fontSize: 12, bold: true, color: '#27ae60', margin: [0, 2, 0, 0] }
                                    ],
                                    margin: [10, 5, 0, 5]
                                },
                                { canvas: [{ type: 'rect', x: 0, y: -30, w: 4, h: 30, color: '#27ae60' }] }
                            ],
                            fillColor: '#f8f9fa',
                            margin: [0, 0, 10, 0]
                        },
                        {
                            stack: [
                                {
                                    stack: [
                                        { text: 'SALDO PENDIENTE:', fontSize: 8, color: '#666', bold: true },
                                        { text: `Bs. ${Number(group.saldoPendiente || 0).toFixed(2)}`, fontSize: 12, bold: true, color: pendingColor, margin: [0, 2, 0, 0] }
                                    ],
                                    margin: [10, 5, 0, 5]
                                },
                                { canvas: [{ type: 'rect', x: 0, y: -30, w: 4, h: 30, color: pendingColor }] }
                            ],
                            fillColor: '#f8f9fa',
                            margin: [0, 0, 0, 0]
                        }
                    ],
                    margin: [0, 5, 0, 20]
                });
            });

            const footerParts: string[] = [];
            if (centroDental) {
                if (centroDental.direccion) footerParts.push(`Dirección: ${centroDental.direccion}`);
                if (centroDental.telefono) footerParts.push(`Teléfono: ${centroDental.telefono}`);
                if (centroDental.celular) footerParts.push(`Celular: ${centroDental.celular}`);
                if (centroDental.emergencias) footerParts.push(`Emergencias: ${centroDental.emergencias}`);
                if (centroDental.email) footerParts.push(`Email: ${centroDental.email}`);
            }

            const docDefinition = {
                pageSize: 'LETTER',
                pageMargins: [40, 40, 40, 70],
                content,
                footer: (currentPage: number, pageCount: number) => {
                    const footerStack: any[] = [];

                    footerStack.push({
                        canvas: [
                            { type: 'line', x1: 40, y1: 0, x2: 572, y2: 0, lineWidth: 0.5, lineColor: '#333333' }
                        ],
                        margin: [0, 0, 0, 6]
                    });

                    if (footerParts.length > 0) {
                        footerStack.push({
                            text: footerParts.join(' | '),
                            fontSize: 7,
                            color: '#555555',
                            alignment: 'center',
                            margin: [0, 0, 0, 4]
                        });
                    }

                    footerStack.push({
                        columns: [
                            {
                                text: 'Documento de Estado de Cuenta emitido por CURARE.',
                                fontSize: 7,
                                color: '#7f8c8d',
                                alignment: 'left',
                                margin: [40, 0, 0, 0]
                            },
                            {
                                text: `Página ${currentPage} de ${pageCount} | Fecha: ${new Date().toLocaleDateString('es-ES')}`,
                                fontSize: 7,
                                color: '#7f8c8d',
                                alignment: 'right',
                                margin: [0, 0, 40, 0]
                            }
                        ]
                    });

                    return {
                        stack: footerStack
                    };
                },
                styles: {
                    tableHeader: { bold: true, fontSize: 8, color: 'white', alignment: 'center' }
                },
                defaultStyle: {
                    font: 'Helvetica',
                    fontSize: 9
                }
            };

            const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
            const chunks: any[] = [];
            pdfDoc.on('data', (chunk: any) => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', (err: any) => reject(err));
            pdfDoc.end();
        });
    }

    private formatDateSpanish(dateString: string): string {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('T')[0].split('-').map(Number);

        const months = [
            'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ];

        const days = [
            'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'
        ];

        const localDate = new Date(year, month - 1, day);
        const dayOfWeek = days[localDate.getDay()];

        return `La Paz ${dayOfWeek}, ${day} de ${months[month - 1]} de ${year}`;
    }

    private numberToWords(amount: number): string {
        const units = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
        const tens = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
        const teens = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
        const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

        const convertGroup = (n: number): string => {
            let output = '';
            if (n === 100) return 'CIEN';
            if (n >= 100) {
                output += hundreds[Math.floor(n / 100)] + ' ';
                n %= 100;
            }
            if (n >= 20) {
                output += tens[Math.floor(n / 10)];
                if (n % 10 > 0) output += ' Y ' + units[n % 10];
            } else if (n >= 10) {
                output += teens[n - 10];
            } else if (n > 0) {
                output += units[n];
            }
            return output.trim();
        };

        const integerPart = Math.floor(amount);
        if (integerPart === 0) return 'CERO';

        let words = '';
        if (integerPart >= 1000000) {
            const millions = Math.floor(integerPart / 1000000);
            words += (millions === 1 ? 'UN MILLON' : convertGroup(millions) + ' MILLONES') + ' ';
            const remainder = integerPart % 1000000;
            if (remainder > 0) {
                if (remainder >= 1000) {
                    const thousands = Math.floor(remainder / 1000);
                    words += (thousands === 1 ? 'MIL' : convertGroup(thousands) + ' MIL') + ' ';
                    words += convertGroup(remainder % 1000);
                } else {
                    words += convertGroup(remainder);
                }
            }
        } else if (integerPart >= 1000) {
            const thousands = Math.floor(integerPart / 1000);
            words += (thousands === 1 ? 'MIL' : convertGroup(thousands) + ' MIL') + ' ';
            words += convertGroup(integerPart % 1000);
        } else {
            words += convertGroup(integerPart);
        }
        return words.trim();
    }
}
