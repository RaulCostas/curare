import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PdfPrinter = require('pdfmake');

@Injectable()
export class RecetaPdfService {
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

    private getLogoBase64(): string | null {
        try {
            // Adjust path based on your project structure. 
            // Assuming dist/backend/src/... or src/... 
            // Typically images might be in 'public' or 'assets'. 
            // In frontend it's '/logo-curare.png'. In backend we need fs path.
            // Let's rely on standard backend assets folder if it exists, or check where prev modules did it.
            // PROVISIONALLY: We will try to read from frontend public folder if local, or standard assets.
            // However, typical setup: 'd:\SOFT-MEDIC\Antigravity\CURARE\frontend\public\logo-curare.png'

            const path = require('path');
            const fs = require('fs');
            // Assuming monorepo structure where we can access frontend public
            // Current dir: .../backend/src/receta
            // Go up: ../../.. -> .../backend -> .../ -> .../frontend/public/logo-curare.png
            const logoPath = path.join(__dirname, '../../../../frontend/public/logo-curare.png');

            if (fs.existsSync(logoPath)) {
                const bitmap = fs.readFileSync(logoPath);
                return `data:image/png;base64,${bitmap.toString('base64')}`;
            }
            return null;
        } catch (error) {
            console.error('Error loading logo:', error);
            return null;
        }
    }

    async generateRecetaPdf(receta: any): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const logoBase64 = this.getLogoBase64();
            const content: any[] = [];

            // Header with Logo and Title
            content.push({
                columns: [
                    {
                        width: 70, // Logo width
                        image: logoBase64 || '', // Fallback handled by pdfmake if empty string or check null
                        fit: [60, 60] // Max dimensions
                    },
                    {
                        width: '*',
                        text: 'RECETA MÉDICA',
                        fontSize: 24,
                        bold: true,
                        color: '#2c3e50', // #2c3e50 equivalent
                        alignment: 'left',
                        margin: [10, 10, 0, 0] // Align vertically with logo center approx
                    }
                ],
                columnGap: 10,
                margin: [0, 0, 0, 15]
            });

            // Blue separator line (Header bottom border)
            content.push({
                canvas: [
                    { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: '#3498db' }
                ],
                margin: [0, 0, 0, 20]
            });


            // Patient Info Box
            // Style: bg #f8f9fa, border-left 4px solid #3498db, padding 15px
            const patientName = receta.paciente
                ? `${receta.paciente.nombre} ${receta.paciente.paterno} ${receta.paciente.materno || ''}`.trim()
                : 'N/A';
            const doctorObj = receta.doctor || receta.user;
            const doctorName = doctorObj
                ? (doctorObj.paterno ? `${doctorObj.paterno} ${doctorObj.materno || ''} ${doctorObj.nombre}`.trim() : (doctorObj.name || 'N/A'))
                : 'N/A';
            const dateStr = this.formatDate(receta.fecha);

            const infoStack: any[] = [
                {
                    text: [
                        { text: 'PACIENTE: ', bold: true, color: '#2c3e50', fontSize: 10 },
                        { text: patientName, color: '#333333', fontSize: 10 }
                    ],
                    margin: [0, 0, 0, 5]
                },
                {
                    text: [
                        { text: 'DOCTOR: ', bold: true, color: '#2c3e50', fontSize: 10 },
                        { text: doctorName !== 'N/A' ? `Dr. ${doctorName}` : 'N/A', color: '#333333', fontSize: 10 }
                    ],
                    margin: [0, 0, 0, 5]
                },
                {
                    text: [
                        { text: 'FECHA: ', bold: true, color: '#2c3e50', fontSize: 10 },
                        { text: dateStr, color: '#333333', fontSize: 10 }
                    ]
                }
            ];

            content.push({
                table: {
                    widths: ['*'],
                    body: [
                        [{
                            stack: infoStack,
                            fillColor: '#f8f9fa',
                            margin: [10, 10, 10, 10]
                        }]
                    ]
                },
                layout: {
                    hLineWidth: () => 0,
                    vLineWidth: (i: number) => (i === 0) ? 4 : 0,
                    vLineColor: () => '#3498db',
                    paddingLeft: () => 10,
                },
                margin: [0, 0, 0, 15]
            });

            // Diagnóstico (justo encima de la tabla, solo si existe)
            if (receta.diagnostico && receta.diagnostico.trim() !== '') {
                content.push({
                    text: [
                        { text: 'DIAGNÓSTICO: ', bold: true, color: '#2c3e50', fontSize: 11 },
                        { text: receta.diagnostico, color: '#1e293b', fontSize: 11 }
                    ],
                    margin: [0, 0, 0, 15]
                });
            }


            // Medications Table
            if (receta.detalles && receta.detalles.length > 0) {
                const tableBody: any[] = [
                    [
                        { text: 'Medicamento', style: 'tableHeader', alignment: 'left' },
                        { text: 'Cantidad', style: 'tableHeader', alignment: 'center' },
                        { text: 'Indicaciones', style: 'tableHeader', alignment: 'left' }
                    ]
                ];

                receta.detalles.forEach((detalle: any, index: number) => {
                    const rowColor = index % 2 === 0 ? '#f8f9fa' : null;
                    tableBody.push([
                        { text: detalle.medicamento || '', alignment: 'left', fillColor: rowColor, fontSize: 10 },
                        { text: detalle.cantidad || '', alignment: 'center', fillColor: rowColor, fontSize: 10 },
                        { text: detalle.indicacion || '', alignment: 'left', fillColor: rowColor, fontSize: 10 }
                    ]);
                });

                content.push({
                    table: {
                        headerRows: 1,
                        widths: ['35%', 'auto', '*'], // 35% Medicamento, Auto Cantidad, Rest Indicaciones
                        body: tableBody
                    },
                    layout: {
                        hLineWidth: (i: number, node: any) => (i === 0 || i === 1) ? 0 : 1, // Header line? 
                        vLineWidth: () => 1,
                        hLineColor: () => '#dddddd',
                        vLineColor: () => '#dddddd',
                        paddingLeft: () => 8,
                        paddingRight: () => 8,
                        paddingTop: () => 8,
                        paddingBottom: () => 8
                    },
                    margin: [0, 0, 0, 20]
                });
            } else {
                // Legacy Text Support
                content.push({
                    text: 'MEDICAMENTOS:',
                    bold: true,
                    fontSize: 10,
                    margin: [0, 0, 0, 5]
                });
                content.push({
                    text: receta.medicamentos || 'No especificado',
                    fontSize: 10,
                    margin: [0, 0, 0, 20]
                });
            }

            // General Indications / Observations
            if (receta.indicaciones) {
                content.push({
                    text: 'INDICACIONES GENERALES / OBSERVACIONES',
                    fontSize: 10,
                    bold: true,
                    color: '#2c3e50',
                    margin: [0, 0, 0, 5],
                    decoration: 'underline', // Optional styling
                    decorationColor: '#eeeeee' // Actually borderline
                });
                // Add bottom border line for title manually if needed, or just text
                content.push({
                    canvas: [
                        { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#eeeeee' }
                    ],
                    margin: [0, 0, 0, 5]
                });

                content.push({
                    text: receta.indicaciones,
                    fontSize: 10,
                    color: '#555555',
                    margin: [0, 0, 0, 20]
                });
            }

            const docDefinition = {
                defaultStyle: {
                    font: 'Helvetica',
                    fontSize: 10
                },
                content: content,
                footer: (currentPage: number, pageCount: number) => {
                    const footerStack: any[] = [];

                    // Signature only on the last page
                    if (currentPage === pageCount) {
                        footerStack.push({
                            stack: [
                                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 150, y2: 0, lineWidth: 1, lineColor: '#000' }] },
                                { text: 'Firma y Sello', alignment: 'center', fontSize: 10, margin: [0, 5, 0, 0] }
                            ],
                            alignment: 'center',
                            margin: [0, 0, 0, 20] // Spacing before footer line
                        });
                    }

                    // Standard Footer (Line + Disclaimer + Date)
                    footerStack.push({
                        canvas: [
                            { type: 'line', x1: 56, y1: 0, x2: 538, y2: 0, lineWidth: 0.5, lineColor: '#333333' }
                        ],
                        margin: [0, 0, 0, 10]
                    });

                    footerStack.push({
                        columns: [
                            {
                                text: 'El presente documento es una receta médica válida emitida por CURARE CENTRO DENTAL.',
                                fontSize: 8,
                                color: '#333333',
                                alignment: 'left',
                                width: '*'
                            },
                            {
                                text: `Fecha de impresión: ${new Date().toLocaleString('es-ES')}`,
                                fontSize: 8,
                                color: '#333333',
                                alignment: 'right',
                                width: 'auto'
                            }
                        ],
                        margin: [56, 0, 42, 0] // Align with page margins (Left 56, Right 42)
                    });

                    return {
                        stack: footerStack
                    };
                },
                styles: {
                    tableHeader: {
                        bold: true,
                        fontSize: 10,
                        color: 'white',
                        fillColor: '#3498db'
                    }
                },
                pageSize: 'A4',
                pageMargins: [56, 56, 42, 110] // Increased bottom margin to accommodate signature + footer
            };

            const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
            const chunks: any[] = [];
            pdfDoc.on('data', (chunk: any) => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', (err: any) => reject(err));
            pdfDoc.end();
        });
    }

    async generatePagoDoctorPdf(pago: any): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const logoBase64 = this.getLogoBase64();
            const content: any[] = [];
            const isDollar = ['Dólares', '$us', 'Sus', 'USD'].includes(pago.moneda);
            const currencySymbol = isDollar ? '$us' : 'Bs';

            // Header (Logo + Title + Quote No)
            content.push({
                columns: [
                    {
                        width: 70,
                        image: logoBase64 || '',
                        fit: [60, 60]
                    },
                    {
                        width: '*',
                        stack: [
                            { text: 'RECIBO DE PAGO A DOCTOR', fontSize: 18, bold: true, color: '#2c3e50', margin: [0, 10, 0, 5] },
                            { text: `Nº Recibo: ${String(pago.id).padStart(6, '0')}`, fontSize: 10, color: '#7f8c8d' }
                        ],
                        alignment: 'left'
                    }
                ],
                margin: [0, 0, 0, 15]
            });

            // Blue separator line
            content.push({
                canvas: [
                    { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: '#3498db' }
                ],
                margin: [0, 0, 0, 20]
            });

            // Info Box
            // Mimicking the HTML: bg #f8f9fa, border-left 4px #3498db.
            // Using a table created to look like a box.
            const doctorName = pago.doctor
                ? `${pago.doctor.nombre} ${pago.doctor.paterno} ${pago.doctor.materno || ''}`.trim()
                : 'N/A';

            content.push({
                table: {
                    widths: ['50%', '50%'],
                    body: [
                        [
                            {
                                stack: [
                                    { text: 'DOCTOR:', fontSize: 9, bold: true, color: '#2c3e50' },
                                    { text: doctorName, fontSize: 10, color: '#333333', margin: [0, 2, 0, 10] },
                                    { text: 'FORMA DE PAGO:', fontSize: 9, bold: true, color: '#2c3e50' },
                                    { text: pago.formaPago?.forma_pago || 'No especificado', fontSize: 10, color: '#333333', margin: [0, 2, 0, 0] }
                                ],
                                border: [false, false, false, false]
                            },
                            {
                                stack: [
                                    { text: 'FECHA DE PAGO:', fontSize: 9, bold: true, color: '#2c3e50' },
                                    { text: this.formatDate(pago.fecha), fontSize: 10, color: '#333333', margin: [0, 2, 0, 10] },
                                    { text: 'MONEDA:', fontSize: 9, bold: true, color: '#2c3e50' },
                                    { text: pago.moneda || 'Bs', fontSize: 10, color: '#333333', margin: [0, 2, 0, 0] }
                                ],
                                border: [false, false, false, false]
                            }
                        ]
                    ]
                },
                layout: {
                    hLineWidth: () => 0,
                    vLineWidth: (i: number) => (i === 0) ? 4 : 0,
                    vLineColor: () => '#3498db',
                    paddingLeft: () => 15,
                    paddingTop: () => 10,
                    paddingBottom: () => 10,
                    fillColor: () => '#f8f9fa'
                },
                margin: [0, 0, 0, 20]
            });

            // Treatments Table
            if (pago.detalles && pago.detalles.length > 0) {
                const tableBody: any[] = [
                    [
                        { text: 'Paciente', style: 'tableHeader', alignment: 'left' },
                        { text: 'Tratamiento', style: 'tableHeader', alignment: 'left' },
                        { text: 'Pieza', style: 'tableHeader', alignment: 'center' },
                        { text: 'Precio', style: 'tableHeader', alignment: 'right' },
                        { text: 'Desc.', style: 'tableHeader', alignment: 'right' },
                        { text: 'Lab.', style: 'tableHeader', alignment: 'right' },
                        { text: 'Subtotal', style: 'tableHeader', alignment: 'right' }
                    ]
                ];

                pago.detalles.forEach((detalle: any, index: number) => {
                    const rowColor = index % 2 === 0 ? '#f8f9fa' : null;
                    const hc = detalle.historiaClinica;
                    const paciente = hc?.paciente
                        ? `${hc.paciente.nombre} ${hc.paciente.paterno}`
                        : 'Desconocido';

                    tableBody.push([
                        { text: paciente, fontSize: 9, alignment: 'left', fillColor: rowColor },
                        { text: hc?.tratamiento || '-', fontSize: 9, alignment: 'left', fillColor: rowColor },
                        { text: hc?.pieza || '-', fontSize: 9, alignment: 'center', fillColor: rowColor },
                        { text: Number(hc?.precio || 0).toFixed(2), fontSize: 9, alignment: 'right', fillColor: rowColor },
                        { text: detalle.descuento > 0 ? `-${detalle.descuento}%` : '-', fontSize: 9, alignment: 'right', color: '#e74c3c', fillColor: rowColor },
                        { text: detalle.costo_laboratorio > 0 ? `-${Number(detalle.costo_laboratorio).toFixed(2)}` : '-', fontSize: 9, alignment: 'right', color: '#e74c3c', fillColor: rowColor },
                        { text: Number(detalle.total).toFixed(2), fontSize: 9, alignment: 'right', bold: true, fillColor: rowColor }
                    ]);
                });

                content.push({
                    table: {
                        headerRows: 1,
                        widths: ['*', '*', 'auto', 'auto', 'auto', 'auto', 'auto'],
                        body: tableBody
                    },
                    layout: {
                        hLineWidth: () => 0.5,
                        vLineWidth: () => 0.5,
                        hLineColor: () => '#dddddd',
                        vLineColor: () => '#dddddd',
                        paddingLeft: () => 5,
                        paddingRight: () => 5,
                        paddingTop: () => 5,
                        paddingBottom: () => 5
                    },
                    margin: [0, 0, 0, 15]
                });
            }

            // Totals Section
            const totalsContent: any[] = [];

            totalsContent.push({
                columns: [
                    { width: '*', text: '' }, // Spacer
                    {
                        width: 'auto',
                        table: {
                            widths: ['auto', 100],
                            body: [
                                [
                                    { text: 'Subtotal:', alignment: 'right', fontSize: 10, bold: true },
                                    { text: `${Number(pago.total).toFixed(2)} ${currencySymbol}`, alignment: 'right', fontSize: 10 }
                                ]
                            ]
                        },
                        layout: 'noBorders'
                    }
                ],
                margin: [0, 0, 0, 2]
            });

            if (pago.comision > 0) {
                totalsContent.push({
                    columns: [
                        { width: '*', text: '' }, // Spacer
                        {
                            width: 'auto',
                            table: {
                                widths: ['auto', 100],
                                body: [
                                    [
                                        { text: `Comisión (${Number(pago.comision).toFixed(2)}%):`, alignment: 'right', fontSize: 10, bold: true },
                                        { text: `-${((pago.total * pago.comision) / 100).toFixed(2)}`, alignment: 'right', fontSize: 10, color: '#e74c3c' }
                                    ]
                                ]
                            },
                            layout: 'noBorders'
                        }
                    ],
                    margin: [0, 0, 0, 2]
                });
            }

            totalsContent.push({
                columns: [
                    { width: '*', text: '' }, // Spacer
                    {
                        width: 'auto',
                        table: {
                            widths: ['auto', 100],
                            body: [
                                [
                                    { text: 'Total Pagado:', alignment: 'right', fontSize: 11, bold: true },
                                    { text: `${Number(pago.total).toFixed(2)} ${currencySymbol}`, alignment: 'right', fontSize: 11, bold: true }
                                ]
                            ]
                        },
                        layout: 'noBorders'
                    }
                ],
                margin: [0, 5, 0, 0]
            });

            content.push({ stack: totalsContent, margin: [0, 0, 0, 20] });

            const docDefinition = {
                defaultStyle: {
                    font: 'Helvetica',
                    fontSize: 10
                },
                content: content,
                footer: (currentPage: number, pageCount: number) => {
                    const footerStack: any[] = [];

                    // Signature only on the last page
                    if (currentPage === pageCount) {
                        footerStack.push({
                            stack: [
                                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1, lineColor: '#000' }] },
                                { text: 'Firma y Sello', alignment: 'center', fontSize: 12, margin: [0, 5, 0, 0] }
                            ],
                            alignment: 'center',
                            margin: [0, 0, 0, 30] // Spacing before footer line
                        });
                    }

                    // Standard Footer (Line + Date) - Removed Page Number as requested
                    footerStack.push({
                        canvas: [
                            { type: 'line', x1: 56, y1: 0, x2: 538, y2: 0, lineWidth: 0.5, lineColor: '#333333' }
                        ],
                        margin: [0, 0, 0, 10]
                    });

                    footerStack.push({
                        columns: [
                            {
                                text: '', // Empty left side
                                width: '*'
                            },
                            {
                                text: `Fecha de impresión: ${new Date().toLocaleString('es-ES')}`,
                                fontSize: 9,
                                color: '#666666',
                                alignment: 'right',
                                width: 'auto'
                            }
                        ],
                        margin: [56, 0, 42, 0]
                    });

                    return {
                        stack: footerStack
                    };
                },
                styles: {
                    tableHeader: {
                        bold: true,
                        fontSize: 10,
                        color: 'white',
                        fillColor: '#3498db'
                    }
                },
                pageSize: 'A4',
                pageMargins: [56, 56, 42, 110]
            };

            const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
            const chunks: any[] = [];
            pdfDoc.on('data', (chunk: any) => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', (err: any) => reject(err));
            pdfDoc.end();
        });
    }

    private formatDate(dateString: string): string {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
        return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
    }
}
