import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { CURARE_LOGO_BASE64 } from '../common/logo.constant';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PdfPrinter = require('pdfmake');

@Injectable()
export class InformesPdfService {
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

    private getLogoBase64(): string {
        const possiblePaths = [
            path.join(process.cwd(), 'frontend/public/logo-curare.png'),
            path.join(process.cwd(), '../frontend/public/logo-curare.png'),
            path.join(process.cwd(), 'public/logo-curare.png'),
            path.join(process.cwd(), '../public/logo-curare.png'),
            path.join(__dirname, '../../../frontend/public/logo-curare.png'),
            path.join(__dirname, '../../../../frontend/public/logo-curare.png'),
            path.join(__dirname, '../../public/logo-curare.png'),
        ];

        for (const logoPath of possiblePaths) {
            try {
                if (fs.existsSync(logoPath)) {
                    const logoBuffer = fs.readFileSync(logoPath);
                    return `data:image/png;base64,${logoBuffer.toString('base64')}`;
                }
            } catch (error) {
                console.error(`Error reading logo from ${logoPath}:`, error);
            }
        }

        return CURARE_LOGO_BASE64;
    }

    private formatDateSpanish(dateStr: string | Date): string {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return String(dateStr);
        const day = d.getUTCDate().toString().padStart(2, '0');
        const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
        const year = d.getUTCFullYear();
        return `${day}/${month}/${year}`;
    }

    private decodeHtmlEntities(text: string): string {
        if (!text) return '';
        return text
            .replace(/&nbsp;?/gi, ' ')
            .replace(/&amp;/gi, '&')
            .replace(/&lt;/gi, '<')
            .replace(/&gt;/gi, '>')
            .replace(/&quot;/gi, '"')
            .replace(/&#39;|&apos;/gi, "'")
            .replace(/&aacute;/gi, 'á')
            .replace(/&eacute;/gi, 'é')
            .replace(/&iacute;/gi, 'í')
            .replace(/&oacute;/gi, 'ó')
            .replace(/&uacute;/gi, 'ú')
            .replace(/&Aacute;/gi, 'Á')
            .replace(/&Eacute;/gi, 'É')
            .replace(/&Iacute;/gi, 'Í')
            .replace(/&Oacute;/gi, 'Ó')
            .replace(/&Uacute;/gi, 'Ú')
            .replace(/&ntilde;/gi, 'ñ')
            .replace(/&Ntilde;/gi, 'Ñ')
            .replace(/&uuml;/gi, 'ü')
            .replace(/&Uuml;/gi, 'Ü')
            .replace(/&#(\d+);?/g, (_, dec) => {
                try {
                    return String.fromCodePoint(parseInt(dec, 10));
                } catch {
                    return '';
                }
            })
            .replace(/&#x([0-9a-fA-F]+);?/g, (_, hex) => {
                try {
                    return String.fromCodePoint(parseInt(hex, 16));
                } catch {
                    return '';
                }
            })
            .replace(/\u00a0/g, ' ');
    }

    private cleanHtmlText(text: string): string {
        if (!text) return '';
        const withoutTags = text.replace(/<[^>]+>/g, '');
        const decoded = this.decodeHtmlEntities(withoutTags);
        return decoded.replace(/[ \t]+/g, ' ').trim();
    }

    private parseHtmlToPdfContent(html: string): any[] {
        if (!html) return [];
        const contentList: any[] = [];

        // Clean and normalize line breaks and basic block elements
        let rawHtml = html
            .replace(/<br\s*[\/]?>/gi, '\n')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<\/div>/gi, '\n')
            .replace(/<\/h[1-6]>/gi, '\n\n')
            .replace(/<\/li>/gi, '\n');

        // Extract tables if any
        const tableRegex = /<table[\s\S]*?<\/table>/gi;
        const parts = rawHtml.split(tableRegex);
        const tableMatches = rawHtml.match(tableRegex) || [];

        for (let i = 0; i < parts.length; i++) {
            const partText = parts[i];
            if (partText) {
                const paragraphs = partText.split('\n');
                for (const p of paragraphs) {
                    const clean = this.cleanHtmlText(p);
                    if (clean) {
                        contentList.push({
                            text: clean,
                            fontSize: 10,
                            lineHeight: 1.35,
                            margin: [0, 2, 0, 4]
                        });
                    }
                }
            }

            if (i < tableMatches.length) {
                const tableHtml = tableMatches[i];
                const rows: any[] = [];
                const rowRegex = /<tr[\s\S]*?<\/tr>/gi;
                const rowMatches = tableHtml.match(rowRegex) || [];

                for (const rHtml of rowMatches) {
                    const cellRegex = /<(?:td|th)[\s\S]*?>([\s\S]*?)<\/(?:td|th)>/gi;
                    const rowCells: any[] = [];
                    let match;
                    while ((match = cellRegex.exec(rHtml)) !== null) {
                        const cellText = this.cleanHtmlText(match[1]);
                        const isTh = /<th/i.test(match[0]);
                        rowCells.push({
                            text: cellText,
                            bold: isTh,
                            fillColor: isTh ? '#0d9488' : '#ffffff',
                            color: isTh ? '#ffffff' : '#1f2937',
                            fontSize: 8.5,
                            margin: [2, 3, 2, 3]
                        });
                    }
                    if (rowCells.length > 0) {
                        rows.push(rowCells);
                    }
                }

                if (rows.length > 0) {
                    const numCols = rows[0].length;
                    const widths = Array(numCols).fill('*');
                    contentList.push({
                        table: {
                            headerRows: 1,
                            widths,
                            body: rows
                        },
                        layout: {
                            hLineWidth: () => 0.5,
                            vLineWidth: () => 0.5,
                            hLineColor: () => '#cbd5e1',
                            vLineColor: () => '#cbd5e1',
                            paddingLeft: () => 4,
                            paddingRight: () => 4,
                        },
                        margin: [0, 6, 0, 10]
                    });
                }
            }
        }

        return contentList;
    }

    async generateInformePdf(informe: any): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const logoBase64 = this.getLogoBase64();
            const content: any[] = [];

            const paciente = informe.paciente || {};
            const doctor = informe.doctor || {};

            const patientName = this.cleanHtmlText(`${paciente.paterno || ''} ${paciente.materno || ''} ${paciente.nombre || ''}`).toUpperCase() || 'PACIENTE';
            const doctorName = this.cleanHtmlText(`${doctor.paterno || ''} ${doctor.materno || ''} ${doctor.nombre || ''}`) || 'No asignado';
            const doctorEsp = this.cleanHtmlText(doctor.especialidad?.especialidad || 'Odontología General');
            const fechaFormateada = this.formatDateSpanish(informe.fecha);

            // 1. Header with Logo and Clinic Title
            content.push({
                columns: [
                    {
                        width: 120,
                        image: logoBase64,
                        fit: [110, 45],
                        margin: [0, 0, 0, 10]
                    },
                    {
                        width: '*',
                        stack: [
                            { text: 'CURARE CENTRO DENTAL', fontSize: 13, bold: true, color: '#1e40af', alignment: 'right' },
                            { text: 'Especialistas en Odontología Integral', fontSize: 9, color: '#6b7280', alignment: 'right', margin: [0, 2, 0, 0] },
                            { text: 'La Paz - Bolivia', fontSize: 8.5, color: '#9ca3af', alignment: 'right', margin: [0, 1, 0, 0] }
                        ]
                    }
                ],
                margin: [0, 0, 0, 15]
            });

            // Divider
            content.push({
                canvas: [
                    { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: '#1e40af' }
                ],
                margin: [0, 0, 0, 15]
            });

            // Title
            content.push({
                text: this.cleanHtmlText(informe.titulo || 'INFORME ODONTOLÓGICO').toUpperCase(),
                fontSize: 15,
                bold: true,
                color: '#1e40af',
                alignment: 'center',
                margin: [0, 0, 0, 15]
            });

            // 2. Patient & Doctor Info Box
            content.push({
                table: {
                    widths: ['*'],
                    body: [
                        [
                            {
                                stack: [
                                    {
                                        columns: [
                                            { text: [{ text: 'Paciente: ', bold: true }, patientName], fontSize: 9.5, color: '#1f2937' },
                                            { text: [{ text: 'Fecha: ', bold: true }, fechaFormateada], fontSize: 9.5, color: '#1f2937', alignment: 'right' }
                                        ]
                                    },
                                    {
                                        columns: [
                                            { text: [{ text: 'Doctor Tratante: ', bold: true }, `Dr. ${doctorName}`], fontSize: 9.5, color: '#1f2937', margin: [0, 4, 0, 0] },
                                            { text: [{ text: 'Especialidad: ', bold: true }, doctorEsp], fontSize: 9.5, color: '#1f2937', alignment: 'right', margin: [0, 4, 0, 0] }
                                        ]
                                    }
                                ],
                                fillColor: '#eff6ff',
                                border: [true, true, true, true],
                                borderColor: ['#2563eb', '#2563eb', '#2563eb', '#2563eb'],
                                margin: [6, 6, 6, 6]
                            }
                        ]
                    ]
                },
                layout: {
                    hLineWidth: () => 1,
                    vLineWidth: () => 1,
                    hLineColor: () => '#2563eb',
                    vLineColor: () => '#2563eb',
                },
                margin: [0, 0, 0, 20]
            });

            // 3. Main Content
            const parsedContent = this.parseHtmlToPdfContent(informe.contenido);
            content.push(...parsedContent);

            // 4. Signature Area
            const docNombreFirma = doctor.paterno ? `DR. ${doctor.paterno} ${doctor.materno || ''} ${doctor.nombre || ''}`.replace(/\s+/g, ' ').trim().toUpperCase() : 'FIRMA Y SELLO ODONTOLÓGICO';

            content.push({
                unbreakable: true,
                stack: [
                    {
                        canvas: [
                            { type: 'line', x1: 170, y1: 0, x2: 345, y2: 0, lineWidth: 1, lineColor: '#475569' }
                        ],
                        margin: [0, 60, 0, 6]
                    },
                    { text: docNombreFirma, bold: true, fontSize: 9.5, alignment: 'center', color: '#111827' },
                    { text: `Odontólogo - ${doctorEsp}`, fontSize: 8.5, alignment: 'center', color: '#64748b', margin: [0, 2, 0, 0] }
                ],
                margin: [0, 20, 0, 10]
            });

            const docDefinition: any = {
                pageSize: 'A4',
                pageMargins: [40, 40, 40, 40],
                content,
                defaultStyle: {
                    font: 'Helvetica',
                    color: '#1e293b'
                }
            };

            const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
            const chunks: Buffer[] = [];
            pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', (err: any) => reject(err));
            pdfDoc.end();
        });
    }
}
