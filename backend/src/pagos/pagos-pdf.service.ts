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

    async generatePagosPdf(
        paciente: any,
        proforma: any,
        pagos: any[],
        resumen: { totalEjecutado: number, totalPagado: number, saldoFavor: number, saldoContra: number },
        historia: any[] = []
    ): Promise<Buffer> {
        const logoBase64 = this.getLogoBase64();

        // Format date helper
        const formatDate = (dateString: string) => {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        };

        // Format money helper
        const formatMoney = (amount: number) => `Bs. ${Number(amount).toFixed(2)}`;

        // Build historia clinica table rows
        const filteredHistoria = (historia || []).filter((h: any) => h.estadoTratamiento === 'terminado');

        const historiaTableBody = [
            [
                { text: 'Fecha', style: 'tableHeader' },
                { text: 'Pieza', style: 'tableHeader' },
                { text: 'Tratamiento / Procedimiento', style: 'tableHeader' },
                { text: 'Monto', style: 'tableHeader' }
            ],
            ...(filteredHistoria.length > 0
                ? filteredHistoria.map((h: any) => [
                    formatDate(h.fecha),
                    h.pieza || '-',
                    h.tratamiento || '-',
                    formatMoney(h.precio || 0)
                ])
                : [[{ text: '-' }, { text: '-' }, { text: 'No hay tratamientos ejecutados registrados' }, { text: 'Bs. 0.00' }]])
        ];

        // Build payments table rows
        const tableBody = [
            [
                { text: 'Fecha', style: 'tableHeader' },
                { text: 'Monto', style: 'tableHeader' },
                { text: 'Moneda', style: 'tableHeader' },
                { text: 'Forma Pago', style: 'tableHeader' },
                { text: 'Recibo/Factura', style: 'tableHeader' }
            ],
            ...(pagos.length > 0 ? pagos.map(pago => {
                const isDollar = pago.moneda === 'Dólares';
                const displayMonto = isDollar
                    ? `${Number(pago.monto).toFixed(2)} (TC: ${Number(pago.tc).toFixed(2)})`
                    : Number(pago.monto).toFixed(2);

                return [
                    formatDate(pago.fecha),
                    displayMonto,
                    pago.moneda || 'Bolivianos',
                    pago.formaPagoRel?.forma_pago || '-',
                    pago.recibo ? `R: ${pago.recibo}` : (pago.factura ? `F: ${pago.factura}` : '-')
                ];
            }) : [[{ text: '-' }, { text: '-' }, { text: 'No hay pagos registrados' }, { text: '-' }, { text: '-' }]])
        ];

        const docDefinition = {
            pageSize: 'A4',
            pageMargins: [56.7, 56.7, 42.5, 85], // 2cm, 2cm, 1.5cm, 3cm
            header: null,
            content: [
                // Header
                {
                    columns: [
                        {
                            image: logoBase64,
                            width: 100,
                            height: 40
                        },
                        {
                            text: 'ESTADO DE CUENTAS',
                            style: 'header',
                            alignment: 'center',
                            margin: [0, 10, 0, 0]
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
                            x2: 495, y2: 0,
                            lineWidth: 2,
                            lineColor: '#3498db'
                        }
                    ],
                    margin: [0, 0, 0, 15]
                },
                // Patient Info Box
                {
                    stack: [
                        {
                            canvas: [
                                {
                                    type: 'rect',
                                    x: 0, y: 0,
                                    w: 495, h: 45,
                                    color: '#f8f9fa'
                                },
                                {
                                    type: 'rect',
                                    x: 0, y: 0,
                                    w: 4, h: 45,
                                    color: '#3498db'
                                }
                            ]
                        },
                        {
                            text: [
                                { text: 'PACIENTE: ', bold: true },
                                { text: `${paciente.paterno} ${paciente.materno || ''} ${paciente.nombre}`.toUpperCase() }
                            ],
                            relativePosition: { x: 10, y: -40 }
                        },
                        proforma ? {
                            text: [
                                { text: 'PROFORMA: ', bold: true },
                                { text: `No. ${proforma.numero} - Total: ${proforma.total} Bs` }
                            ],
                            relativePosition: { x: 10, y: -20 }
                        } : { text: '', relativePosition: { x: 0, y: 0 } }
                    ],
                    margin: [0, 0, 0, 15]
                },
                // Section 1: Tratamientos Ejecutados
                {
                    text: 'Tratamientos Ejecutados (Historia Clínica)',
                    style: 'subheader',
                    margin: [0, 5, 0, 8]
                },
                {
                    table: {
                        headerRows: 1,
                        widths: [70, 60, '*', 90],
                        body: historiaTableBody
                    },
                    layout: {
                        fillColor: function (rowIndex: number) {
                            return (rowIndex % 2 === 0) ? '#f8f9fa' : null;
                        },
                        hLineWidth: function () { return 1; },
                        vLineWidth: function () { return 1; },
                        hLineColor: function () { return '#ddd'; },
                        vLineColor: function () { return '#ddd'; }
                    },
                    margin: [0, 0, 0, 15]
                },
                // Section 2: Historial de Pagos
                {
                    text: 'Historial de Pagos Registrados',
                    style: 'subheader',
                    margin: [0, 5, 0, 8]
                },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', '*', '*', '*', '*'],
                        body: tableBody
                    },
                    layout: {
                        fillColor: function (rowIndex: number) {
                            return (rowIndex % 2 === 0) ? '#f8f9fa' : null;
                        },
                        hLineWidth: function () { return 1; },
                        vLineWidth: function () { return 1; },
                        hLineColor: function () { return '#ddd'; },
                        vLineColor: function () { return '#ddd'; }
                    }
                },
                // Financial Summary
                {
                    text: 'Resumen Financiero',
                    style: 'subheader',
                    margin: [0, 30, 0, 10]
                },
                {
                    canvas: [{ type: 'line', x1: 0, y1: 0, x2: 495, y2: 0, lineWidth: 2, lineColor: '#3498db' }],
                    margin: [0, 0, 0, 15]
                },
                {
                    columns: [
                        // Col 1
                        {
                            stack: [
                                {
                                    stack: [
                                        { text: 'Ejecutado por el Dr.:', fontSize: 9, color: '#666' },
                                        { text: formatMoney(resumen.totalEjecutado), fontSize: 14, bold: true, color: '#2c3e50', margin: [0, 2, 0, 0] }
                                    ],
                                    margin: [10, 5, 0, 5]
                                },
                                { canvas: [{ type: 'rect', x: 0, y: -35, w: 4, h: 35, color: '#3498db' }] }
                            ],
                            fillColor: 'white',
                            margin: [0, 0, 10, 0]
                        },
                        // Col 2
                        {
                            stack: [
                                {
                                    stack: [
                                        { text: 'Pagado por Paciente:', fontSize: 9, color: '#666' },
                                        { text: formatMoney(resumen.totalPagado), fontSize: 14, bold: true, color: '#27ae60', margin: [0, 2, 0, 0] }
                                    ],
                                    margin: [10, 5, 0, 5]
                                },
                                { canvas: [{ type: 'rect', x: 0, y: -35, w: 4, h: 35, color: '#27ae60' }] }
                            ],
                            fillColor: 'white',
                            margin: [0, 0, 10, 0]
                        }
                    ]
                },
                {
                    columns: [
                        // Col 3
                        {
                            stack: [
                                {
                                    stack: [
                                        { text: 'Saldo a Favor:', fontSize: 9, color: '#666' },
                                        { text: formatMoney(resumen.saldoFavor), fontSize: 14, bold: true, color: '#3498db', margin: [0, 2, 0, 0] }
                                    ],
                                    margin: [10, 5, 0, 5]
                                },
                                { canvas: [{ type: 'rect', x: 0, y: -35, w: 4, h: 35, color: '#3498db' }] }
                            ],
                            fillColor: 'white',
                            margin: [0, 10, 10, 0]
                        },
                        // Col 4
                        {
                            stack: [
                                {
                                    stack: [
                                        { text: 'Saldo en Contra:', fontSize: 9, color: '#666' },
                                        { text: formatMoney(resumen.saldoContra), fontSize: 14, bold: true, color: '#e74c3c', margin: [0, 2, 0, 0] }
                                    ],
                                    margin: [10, 5, 0, 5]
                                },
                                { canvas: [{ type: 'rect', x: 0, y: -35, w: 4, h: 35, color: '#e74c3c' }] }
                            ],
                            fillColor: 'white',
                            margin: [0, 10, 10, 0]
                        }
                    ]
                }
            ],
            footer: (currentPage: number, pageCount: number) => {
                return {
                    stack: [
                        {
                            canvas: [
                                { type: 'line', x1: 56, y1: 0, x2: 538, y2: 0, lineWidth: 1, lineColor: '#333' }
                            ],
                            margin: [0, 0, 0, 5]
                        },
                        {
                            text: `Fecha de impresión: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
                            alignment: 'right',
                            fontSize: 9,
                            color: '#666',
                            margin: [0, 0, 56, 10]
                        }
                    ]
                };
            },
            styles: {
                header: {
                    fontSize: 22,
                    bold: true,
                    color: '#2c3e50'
                },
                subheader: {
                    fontSize: 16,
                    color: '#2c3e50',
                    bold: true
                },
                tableHeader: {
                    bold: true,
                    fontSize: 10,
                    color: 'white',
                    fillColor: '#3498db'
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

    async generateReciboSinglePdf(pago: any): Promise<Buffer> {
        const logoBase64 = this.getLogoBase64();

        const formatDate = (dateString: string) => {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        };

        const pacienteNombre = pago.paciente
            ? `${pago.paciente.paterno || ''} ${pago.paciente.materno || ''} ${pago.paciente.nombre || ''}`.trim().toUpperCase()
            : 'N/A';

        const montoStr = pago.moneda === 'Dólares'
            ? `USD ${Number(pago.monto).toFixed(2)}`
            : `Bs. ${Number(pago.monto).toFixed(2)}`;

        const concepto = pago.proforma
            ? `Tratamiento Odontológico - Plan #${pago.proforma.numero}`
            : 'Tratamiento Odontológico';

        const docDefinition = {
            pageSize: 'A4',
            pageMargins: [40, 40, 40, 40],
            content: [
                {
                    columns: [
                        { image: logoBase64, width: 120, height: 45 },
                        {
                            stack: [
                                { text: 'RECIBO DE PAGO', style: 'header', alignment: 'right' },
                                { text: `Fecha: ${formatDate(pago.fecha)}`, fontSize: 10, alignment: 'right', margin: [0, 5, 0, 0] }
                            ]
                        }
                    ],
                    margin: [0, 0, 0, 15]
                },
                {
                    canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: '#3498db' }],
                    margin: [0, 0, 0, 20]
                },
                {
                    table: {
                        widths: ['*'],
                        body: [
                            [
                                {
                                    fillColor: '#f8f9fa',
                                    borderColor: ['#3498db', '#3498db', '#3498db', '#3498db'],
                                    margin: [15, 15, 15, 15],
                                    stack: [
                                        {
                                            columns: [
                                                { text: 'Nº Recibo:', width: 110, bold: true, fontSize: 11 },
                                                { text: pago.recibo || String(pago.id), bold: true, fontSize: 11, color: '#2c3e50' },
                                                pago.factura ? { text: `Factura: ${pago.factura}`, width: 140, alignment: 'right', bold: true, fontSize: 11 } : { text: '' }
                                            ],
                                            margin: [0, 0, 0, 12]
                                        },
                                        {
                                            columns: [
                                                { text: 'Recibí de:', width: 110, bold: true, fontSize: 11 },
                                                { text: pacienteNombre, fontSize: 11 }
                                            ],
                                            margin: [0, 0, 0, 12]
                                        },
                                        {
                                            columns: [
                                                { text: 'La suma de:', width: 110, bold: true, fontSize: 11 },
                                                { text: montoStr, bold: true, color: '#27ae60', fontSize: 13 }
                                            ],
                                            margin: [0, 0, 0, 12]
                                        },
                                        {
                                            columns: [
                                                { text: 'Por concepto de:', width: 110, bold: true, fontSize: 11 },
                                                { text: concepto, fontSize: 11 }
                                            ],
                                            margin: [0, 0, 0, 12]
                                        },
                                        pago.observaciones ? {
                                            columns: [
                                                { text: 'Observaciones:', width: 110, bold: true, fontSize: 11 },
                                                { text: pago.observaciones, fontSize: 10, italics: true }
                                            ]
                                        } : { text: '' }
                                    ]
                                }
                            ]
                        ]
                    }
                }
            ],
            styles: {
                header: { fontSize: 20, bold: true, color: '#2c3e50' }
            },
            defaultStyle: { font: 'Helvetica', fontSize: 10 }
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
