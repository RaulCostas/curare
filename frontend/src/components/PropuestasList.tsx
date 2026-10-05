import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';
import type { Paciente, Propuesta } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDateSpanish, numberToWords, formatCurrency, formatDateUTC } from '../utils/formatters';
import ManualModal, { type ManualSection } from './ManualModal';
import { ClipboardList, Plus } from 'lucide-react';
import PropuestasForm from './PropuestasForm';
import { printPdf } from '../utils/printUtils';

const PropuestasList: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    
    // Modal states
    const [showForm, setShowForm] = useState(false);
    const [editingPropuestaId, setEditingPropuestaId] = useState<number | null>(null);
    const [viewOnly, setViewOnly] = useState(false);
    const [paciente, setPaciente] = useState<Paciente | null>(null);
    const [propuestas, setPropuestas] = useState<Propuesta[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Propuestas de Tratamiento',
            content: 'Gestión de múltiples opciones de tratamiento para el paciente. Puede crear hasta 6 variantes (A-F).'
        },
        {
            title: 'Opciones de Propuesta (Columnas A - F)',
            content: 'Cada columna muestra el costo total de esa opción:\n\n- **Botón Gris (Imprimir):** Genera la vista de impresión del PDF para esa opción.\n- **Botón Morado (Pasar a Presupuesto):** Convierte directamente la opción en un Presupuesto / Plan de Tratamiento oficial.\n- **Botón Verde (WhatsApp):** Envía el documento PDF de la opción seleccionada al WhatsApp del paciente mediante el Chatbot.'
        },
        {
            title: 'Acciones Generales',
            content: 'Use los botones de la derecha para Ver (Ojo), Editar (Lápiz) o Eliminar (Basurero) una propuesta completa.'
        },
        {
            title: 'Crear Nueva',
            content: 'Haga clic en "+ Nueva Propuesta" para diseñar opciones de tratamiento.'
        }
    ];

    const filteredPropuestas = propuestas.filter(p =>
        p.numero.toString().includes(searchTerm) ||
        p.nota?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.fecha.includes(searchTerm)
    );

    useEffect(() => {
        if (id) {
            fetchPaciente(Number(id));
            fetchPropuestas(Number(id));
        }
    }, [id]);

    const fetchPaciente = async (pacienteId: number) => {
        try {
            const response = await api.get(`/pacientes/${pacienteId}`);
            setPaciente(response.data);
        } catch (error) {
            console.error('Error fetching paciente:', error);
        }
    };

    const fetchPropuestas = async (pacienteId: number) => {
        try {
            const response = await api.get(`/propuestas/paciente/${pacienteId}`);
            setPropuestas(response.data);
        } catch (error) {
            console.error('Error fetching propuestas:', error);
        }
    };

    const deletePropuesta = async (propuestaId: number) => {
        try {
            const result = await Swal.fire({
                title: '¿Estás seguro?',
                text: "No podrás revertir esto!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, eliminar!',
                cancelButtonText: 'Cancelar',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });

            if (result.isConfirmed) {
                await api.delete(`/propuestas/${propuestaId}`);
                setPropuestas(propuestas.filter(p => p.id !== propuestaId));
                Swal.fire({
                    title: 'Eliminado!',
                    text: 'La propuesta ha sido eliminada.',
                    icon: 'success',
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
            }
        } catch (error) {
            console.error('Error deleting propuesta:', error);
            Swal.fire({
                title: 'Error',
                text: 'No se pudo eliminar la propuesta',
                icon: 'error',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
        }
    };

    const handleConvertToBudget = async (propuesta: Propuesta, letra: string) => {
        const result = await Swal.fire({
            title: `¿Pasar Propuesta ${letra} a Plan de Tratamiento?`,
            text: `Se creará un nuevo Plan de Tratamiento oficial con los tratamientos de la Opción ${letra} de la Propuesta #${propuesta.numero}.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#9333ea',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, Pasar a Plan de Tratamiento',
            cancelButtonText: 'Cancelar',
            background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
            color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
        });

        if (result.isConfirmed) {
            try {
                const userStr = localStorage.getItem('user');
                const currentUser = userStr ? JSON.parse(userStr) : null;
                const usuarioId = currentUser?.id || 1;

                const response = await api.post(`/propuestas/${propuesta.id}/convert-to-budget`, {
                    letra,
                    usuarioId
                });

                const newNumber = response.data?.numero || response.data?.id;

                await Swal.fire({
                    icon: 'success',
                    title: '¡Plan de Tratamiento Creado!',
                    text: `Se ha generado exitosamente el Plan de Tratamiento #${newNumber}`,
                    timer: 2000,
                    showConfirmButton: false,
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });

                if (id) {
                    fetchPropuestas(Number(id));
                }
            } catch (error: any) {
                console.error('Error converting propuesta to budget:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response?.data?.message || 'No se pudo convertir la propuesta a plan de tratamiento',
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
            }
        }
    };

    const handleSendWhatsApp = async (propuesta: Propuesta, letra: string) => {
        const patientName = paciente ? `${paciente.paterno || ''} ${paciente.materno || ''} ${paciente.nombre || ''}`.trim() : 'el paciente';
        const phone = paciente?.celular;

        const result = await Swal.fire({
            title: `¿Enviar Propuesta ${letra} por WhatsApp?`,
            text: `Se enviará el documento PDF de la Opción ${letra} al paciente ${patientName}${phone ? ` (${phone})` : ''} utilizando el Chatbot.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, Enviar por WhatsApp',
            cancelButtonText: 'Cancelar',
            background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
            color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
        });

        if (!result.isConfirmed) return;

        Swal.fire({
            title: 'Enviando...',
            text: `Enviando propuesta (Opción ${letra}) por WhatsApp...`,
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            const pdfBlob = generatePDF(propuesta, 'blob', letra);
            if (!pdfBlob || !(pdfBlob instanceof Blob)) {
                throw new Error('Error al generar el archivo PDF');
            }

            const safePatientName = `${paciente?.paterno || ''}_${paciente?.nombre || ''}`.trim().replace(/[/\\?%*:|"<> ]/g, '_');
            const safeDocName = `Propuesta_${propuesta.numero}_${letra}_${safePatientName}`.replace(/[/\\?%*:|"<>]/g, '');

            const formData = new FormData();
            formData.append('file', pdfBlob, `${safeDocName}.pdf`);
            formData.append('letra', letra);

            const response = await api.post(`/propuestas/${propuesta.id}/send-whatsapp`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            Swal.fire({
                icon: 'success',
                title: '¡Enviado!',
                text: response.data?.message || `La Propuesta (Opción ${letra}) se envió correctamente por WhatsApp`,
                timer: 2000,
                showConfirmButton: false,
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
        } catch (error: any) {
            console.error('Error sending WhatsApp propuesta:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Error al enviar por WhatsApp. Verifique que el chatbot esté conectado.';
            Swal.fire({
                icon: 'error',
                title: 'Error al Enviar',
                text: errorMsg,
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
        }
    };

    const generatePDF = (propuesta: Propuesta, action: 'print' | 'download' | 'blob', letra?: string) => {
        const doc = new jsPDF();

        // 1. Date (Right aligned)
        doc.setFontSize(10);
        doc.setTextColor(0);
        const dateStr = formatDateSpanish(propuesta.fecha);
        doc.text(dateStr, 200, 20, { align: 'right' });

        // 2. Salutation (Lowered to clear the pre-printed clinic letterhead header)
        doc.setFont('helvetica', 'normal');
        doc.text('Señor(a):', 14, 52);

        doc.setFont('helvetica', 'bold');
        const patientName = `${paciente?.paterno || ''} ${paciente?.materno || ''} ${paciente?.nombre || ''}`.trim().toUpperCase();
        doc.text(patientName, 14, 57);

        doc.setFont('helvetica', 'normal');
        doc.text('De mi consideración:', 14, 66);
        doc.text('Según los estudios realizados le presentamos la siguiente propuesta del tratamiento odontológico que Ud. requiere:', 14, 71);

        // 3. Propuesta Number
        doc.setFont('helvetica', 'bold');
        const propNumber = letra ? `Prop. # ${propuesta.numero.toString().padStart(2, '0')} - Opción ${letra}` : `Prop. # ${propuesta.numero.toString().padStart(2, '0')}`;
        doc.text(propNumber, 200, 79, { align: 'right' });

        // 4. Table - Filter by letra if provided
        const filteredDetalles = letra ? propuesta.detalles.filter(d => d.letra === letra) : propuesta.detalles;
        const hasDiscount = filteredDetalles.some(item => item.descuento > 0);

        let tableColumn = ["Descripción", "Elemento Dental", "Cant.", "P.U.", "Total"];
        if (hasDiscount) {
            tableColumn.push("Descuento %", "Total con Dcto %");
        }

        const tableRows: any[] = [];

        filteredDetalles.forEach(item => {
            const row = [
                item.arancel?.detalle || '',
                item.piezas,
                item.cantidad,
                formatCurrency(item.precioUnitario),
                formatCurrency(item.subTotal)
            ];

            if (hasDiscount) {
                row.push(
                    item.descuento,
                    formatCurrency(item.total)
                );
            }

            tableRows.push(row);
        });

        const columnStyles: any = {
            0: { halign: 'left' }, // Descripción
            1: { halign: 'center' }, // Pieza
            2: { halign: 'center' }, // Cant
            3: { halign: 'right' }, // PU
            4: { halign: 'right' } // Total
        };

        if (hasDiscount) {
            columnStyles[5] = { halign: 'center' }; // Descuento
            columnStyles[6] = { halign: 'right' }; // Total con Dcto
        }

        let penultColX = 0;
        let penultColWidth = 0;
        let lastColX = 0;
        let lastColWidth = 0;

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 83,
            theme: 'plain',
            styles: {
                fontSize: 9,
                cellPadding: 2,
                lineColor: [0, 0, 0],
                lineWidth: 0.1,
                textColor: [0, 0, 0]
            },
            headStyles: {
                fillColor: [255, 255, 255],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                halign: 'center',
                lineWidth: 0.1,
                lineColor: [0, 0, 0]
            },
            columnStyles: columnStyles,
            didDrawCell: (data) => {
                if (data.section === 'head') {
                    const lastIndex = tableColumn.length - 1;
                    const penultIndex = tableColumn.length - 2;

                    if (data.column.index === penultIndex) {
                        penultColX = data.cell.x;
                        penultColWidth = data.cell.width;
                    }
                    if (data.column.index === lastIndex) {
                        lastColX = data.cell.x;
                        lastColWidth = data.cell.width;
                    }
                }
            }
        });

        // Totals Row
        let finalY = (doc as any).lastAutoTable.finalY;

        // Fallback static positioning if capture failed
        if (lastColWidth === 0) {
            lastColWidth = 30; lastColX = 165;
            penultColWidth = 30; penultColX = 135;
        }

        doc.setFont('helvetica', 'bold');

        doc.rect(penultColX, finalY, penultColWidth, 7);
        doc.rect(lastColX, finalY, lastColWidth, 7);

        const totalAmount = letra
            ? filteredDetalles.reduce((acc, curr) => acc + Number(curr.total), 0)
            : Number(propuesta.total);

        doc.text('TOTAL Bs.', penultColX + penultColWidth - 2, finalY + 5, { align: 'right' });
        doc.text(formatCurrency(totalAmount), lastColX + lastColWidth - 2, finalY + 5, { align: 'right' });

        finalY += 15;

        // 5. Amount in Words
        doc.setFont('helvetica', 'normal');
        const decimalPart = (totalAmount % 1).toFixed(2).substring(2);
        const words = numberToWords(totalAmount);
        doc.text(`SON: ${words} ${decimalPart}/100 BOLIVIANOS`, 14, finalY);

        finalY += 10;

        // 5.1 Propuesta Note
        let noteToDisplay = '';
        if (propuesta.nota) {
            try {
                const parsed = JSON.parse(propuesta.nota);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    noteToDisplay = letra ? (parsed[letra] || '') : (parsed['A'] || '');
                } else {
                    noteToDisplay = String(propuesta.nota);
                }
            } catch {
                noteToDisplay = String(propuesta.nota);
            }
        }

        if (noteToDisplay && noteToDisplay.trim()) {
            doc.setFont('helvetica', 'bold');
            doc.text('NOTA:', 14, finalY);

            doc.setFont('helvetica', 'normal');
            const splitNote = doc.splitTextToSize(noteToDisplay, 165);
            doc.text(splitNote, 30, finalY);

            finalY += (splitNote.length * 5) + 5;
        }

        // 6. Nomenclature Diagram
        doc.setFont('helvetica', 'bold');
        doc.text('NOMENCLATURA', 14, finalY + 5);

        const circleX = 60;
        const circleY = finalY + 10;
        const radius = 8;

        // Head
        doc.circle(circleX, circleY, radius);

        // Eyes (Grey Diamonds/Ellipses)
        doc.setFillColor(128, 128, 128); // Grey
        // Left Eye
        doc.ellipse(circleX - 3, circleY - 2, 1, 2, 'F');
        // Right Eye
        doc.ellipse(circleX + 3, circleY - 2, 1, 2, 'F');

        // Mouth/Nose Lines
        doc.setDrawColor(0);
        // Vertical Line (from center downwards)
        doc.line(circleX, circleY + 1, circleX, circleY + 6);
        // Horizontal Line (Mouth)
        doc.line(circleX - 4, circleY + 4, circleX + 4, circleY + 4);

        // Numbers
        doc.setFontSize(8);
        doc.text('1', circleX - 3.5, circleY + 2.5);
        doc.text('2', circleX + 2.0, circleY + 2.5);
        doc.text('3', circleX + 2.0, circleY + 6.5);
        doc.text('4', circleX - 3.5, circleY + 6.5);

        // 7. Payment System
        let noteY = finalY + 25;

        const paymentY = finalY + 25;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.rect(14, paymentY, 40, 5);
        doc.text('SISTEMA DE PAGO', 16, paymentY + 3.5);

        doc.setFont('helvetica', 'normal');
        doc.rect(14, paymentY + 6, 180, 5);
        doc.text('- Cancelación del 50% al inicio. 30% durante el tratamiento. 20% antes de finalizado el mismo.', 16, paymentY + 9.5);

        noteY = paymentY + 20;

        // 8. Note
        doc.setFont('helvetica', 'bold');
        doc.rect(14, noteY, 180, 8);
        doc.text('NOTA: CURARE CENTRO DENTAL garantiza los trabajos realizados si el paciente sigue las', 16, noteY + 3.5);
        doc.text('recomendaciones indicadas y asiste a sus controles periódicos de manera puntual.', 16, noteY + 7);

        // 9. Footer Text
        const footerY = noteY + 15;
        doc.setFont('helvetica', 'normal');
        doc.text('El presente presupuesto podría tener modificaciones en el transcurso del tratamiento; el mismo será notificado', 14, footerY);
        doc.text('oportunamente a su persona.', 14, footerY + 5);

        doc.text('Presupuesto válido por 15 días.', 14, footerY + 12);
        doc.text('En conformidad y aceptando el presente presupuesto, firmo.', 14, footerY + 17);

        // 10. Signatures
        const sigY = footerY + 45;

        // Left Signature
        doc.line(30, sigY, 80, sigY);
        doc.text('Dr. JOSE ARTIEDA S.', 35, sigY + 5);

        // Right Signature
        doc.line(120, sigY, 180, sigY);
        doc.text(patientName, 125, sigY + 5);

        if (action === 'print') {
            printPdf(doc);
        } else if (action === 'blob') {
            return doc.output('blob');
        } else {
            const fileName = letra
                ? `propuesta_${propuesta.numero}_${letra}_${paciente?.paterno}.pdf`
                : `propuesta_${propuesta.numero}_${paciente?.paterno}.pdf`;
            doc.save(fileName);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header del Tab */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-200 dark:border-gray-700 gap-4 mb-6 no-print">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <ClipboardList className="text-blue-500" size={22} />
                        <span>Propuestas de Tratamiento</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                        Propuestas estéticas, planes alternativos y presupuestos preliminares para el paciente
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center md:justify-end items-center">
                    <button
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>
                    <button
                        onClick={() => {
                            setEditingPropuestaId(null);
                            setViewOnly(false);
                            setShowForm(true);
                        }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white hover:text-white no-underline hover:no-underline rounded-xl font-bold shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 text-sm cursor-pointer"
                    >
                        <Plus size={18} />
                        <span>Nueva Propuesta</span>
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl shadow-inner border border-gray-100 dark:border-gray-600 no-print">
                <div className="relative flex-grow max-w-md">
                    <input
                        type="text"
                        placeholder="Buscar por número, nota o fecha..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800"
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider"># Prop.</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Registrado Por</th>
                            {['A', 'B', 'C', 'D', 'E', 'F'].map(letra => (
                                <th key={letra} className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total {letra}</th>
                            ))}
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider no-print">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredPropuestas.map((propuesta) => {
                            const calculateTotalByLetra = (letra: string) => {
                                return propuesta.detalles
                                    .filter(d => d.letra === letra)
                                    .reduce((acc, curr) => acc + Number(curr.total), 0);
                            };

                            return (
                                <tr key={propuesta.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium">{propuesta.numero}</td>
                                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDateUTC(propuesta.fecha)}</td>
                                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{propuesta.usuario?.name || 'Sistema'}</td>
                                    {['A', 'B', 'C', 'D', 'E', 'F'].map(letra => {
                                        const total = calculateTotalByLetra(letra);
                                        return (
                                            <td key={letra} className="px-3 py-4 whitespace-nowrap text-sm text-center">
                                                {total > 0 ? (
                                                    <div className="flex flex-col items-center gap-1.5">
                                                        <span className="font-bold text-gray-800 dark:text-gray-200">{formatCurrency(total)}</span>
                                                        <div className="flex items-center justify-center gap-1">
                                                            {/* Botón 1: Imprimir */}
                                                            <button
                                                                onClick={() => generatePDF(propuesta, 'print', letra)}
                                                                className="p-1.5 bg-slate-600 hover:bg-slate-700 active:scale-95 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 cursor-pointer inline-flex items-center justify-center"
                                                                title={`Imprimir Opción ${letra}`}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                                </svg>
                                                            </button>

                                                            {/* Botón 2: Pasar a Presupuesto */}
                                                            <button
                                                                onClick={() => handleConvertToBudget(propuesta, letra)}
                                                                className="p-1.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 cursor-pointer inline-flex items-center justify-center"
                                                                title={`Pasar Opción ${letra} a Presupuesto`}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                                                </svg>
                                                            </button>

                                                            {/* Botón 3: Enviar PDF por WhatsApp con Chatbot */}
                                                            <button
                                                                onClick={() => handleSendWhatsApp(propuesta, letra)}
                                                                className="p-1.5 bg-green-500 hover:bg-green-600 active:scale-95 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 cursor-pointer inline-flex items-center justify-center"
                                                                title={`Enviar Opción ${letra} por WhatsApp`}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 dark:text-gray-600">-</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td className="px-5 py-4 whitespace-nowrap text-center no-print">
                                        <div className="flex gap-2 justify-center">
                                            <button
                                                onClick={() => {
                                                    setEditingPropuestaId(propuesta.id);
                                                    setViewOnly(true);
                                                    setShowForm(true);
                                                }}
                                                className="p-2 bg-orange-400 text-white rounded-lg hover:bg-orange-500 shadow-md transition-all transform hover:-translate-y-0.5"
                                                title="Ver"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingPropuestaId(propuesta.id);
                                                    setViewOnly(false);
                                                    setShowForm(true);
                                                }}
                                                className="p-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 shadow-md transition-all transform hover:-translate-y-0.5 inline-flex items-center justify-center"
                                                title="Editar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => deletePropuesta(propuesta.id)}
                                                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-md transition-all transform hover:-translate-y-0.5"
                                                title="Eliminar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredPropuestas.length === 0 && (
                            <tr>
                                <td colSpan={10} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                                    <div className="flex flex-col items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p>No hay propuestas registradas para este paciente.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Propuestas"
                sections={manualSections}
            />
            <PropuestasForm 
                isOpen={showForm}
                onClose={() => setShowForm(false)}
                onSuccess={() => {
                    setShowForm(false);
                    if (id) {
                        fetchPropuestas(Number(id));
                    }
                }}
                pacienteId={Number(id)}
                propuestaId={editingPropuestaId || undefined}
                readOnly={viewOnly}
            />
        </div>
    );
};

export default PropuestasList;
