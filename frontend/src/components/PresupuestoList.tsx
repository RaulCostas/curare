import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api, { getMediaUrl } from '../services/api';
import Swal from 'sweetalert2';
import type { Paciente } from '../types';
import jsPDF from 'jspdf';
import Pagination from './Pagination';
import autoTable from 'jspdf-autotable';
import { formatDateSpanish, formatDateUTC, formatCurrency, numberToWords, formatFullName } from '../utils/formatters';
import ManualModal, { type ManualSection } from './ManualModal';
import PlanTratamientoModal from './PlanTratamientoModal';
import { CheckCircle, FileText, Plus, X } from 'lucide-react';
import PresupuestoForm from './PresupuestoForm';
import SignatureModal from './SignatureModal';

interface Proforma {
    id: number;
    numero: number;
    fecha: string;
    total: number;
    nota: string;
    usuario: { name: string };
    aprobado: boolean;
    detalles: any[];
    usuarioAprobado?: { name: string };
    fecha_aprobado?: string;
    tieneFirma?: boolean;
}

const PresupuestoList: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [paciente, setPaciente] = useState<Paciente | null>(null);
    const [proformas, setProformas] = useState<Proforma[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showManual, setShowManual] = useState(false);
    const [viewProforma, setViewProforma] = useState<Proforma | null>(null);
    const [isPresupuestoModalOpen, setIsPresupuestoModalOpen] = useState(false);
    const [editingProformaId, setEditingProformaId] = useState<number | undefined>();
    const [budgetsWithRelations, setBudgetsWithRelations] = useState<Set<number>>(new Set());
    const [completedBudgets, setCompletedBudgets] = useState<Set<number>>(new Set());
    const [historiaList, setHistoriaList] = useState<any[]>([]);

    // Signature Modal State
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [selectedProformaIdForSignature, setSelectedProformaIdForSignature] = useState<number | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;


    const manualSections: ManualSection[] = [
        {
            title: 'Presupuestos',
            content: 'Gestión de proformas y presupuestos de tratamientos para el paciente. Los presupuestos permiten planificar tratamientos, hacer seguimiento de piezas completadas y controlar el estado de finalización.'
        },
        {
            title: 'Nuevo Presupuesto',
            content: 'Cree un nuevo presupuesto seleccionando tratamientos del arancel. Puede especificar las piezas dentales a tratar, agregar notas y generar PDF para entregar al paciente.'
        },
        {
            title: 'Indicadores Visuales',
            content: 'Los presupuestos terminados aparecen con las columnas "# Pres." y "Fecha" tachadas en verde. Esto indica que todos los tratamientos del plan han sido completados en Historia Clínica.'
        },
        {
            title: 'Seguimiento de Piezas',
            content: 'Al ver o editar un presupuesto, las piezas dentales completadas aparecen tachadas en verde. Solo cuando TODAS las piezas de un tratamiento están terminadas, el tratamiento completo se marca como finalizado.'
        },
        {
            title: 'Aprobación',
            content: 'Los presupuestos pueden ser aprobados ingresando un código de seguridad. Una vez aprobados, pueden ser utilizados en Historia Clínica y Agenda para registrar tratamientos realizados.'
        },
        {
            title: 'Acciones Disponibles',
            content: 'Ver/Editar presupuesto, Aprobar, Eliminar (solo si no tiene pagos o historia clínica), Enviar por WhatsApp, Imprimir PDF, y Exportar a Excel.'
        },
        {
            title: 'Estados del Presupuesto',
            content: 'Un presupuesto puede estar: Pendiente (sin aprobar), Aprobado (listo para usar), En Proceso (con tratamientos iniciados), o Terminado (todos los tratamientos completados).'
        }
    ];

    const filteredProformas = proformas.filter(p =>
        p.numero.toString().includes(searchTerm) ||
        p.nota.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.fecha.includes(searchTerm)
    );

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentProformas = filteredProformas.slice(indexOfFirstItem, indexOfLastItem);

    useEffect(() => {
        if (id) {
            fetchPaciente(Number(id));
            fetchProformas(Number(id));
        }
    }, [id]);

    // Reset pagination when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // ... (rest of functions)

    // In render:



    const fetchPaciente = async (pacienteId: number) => {
        try {
            const response = await api.get(`/pacientes/${pacienteId}`);
            setPaciente(response.data);
        } catch (error) {
            console.error('Error fetching paciente:', error);
        }
    };

    const fetchProformas = async (pacienteId: number) => {
        try {
            const response = await api.get(`/proformas/paciente/${pacienteId}`);
            setProformas(response.data);

            // Check which budgets have payments or clinical history
            await checkBudgetsWithRelations(response.data.map((p: any) => p.id));
        } catch (error) {
            console.error('Error fetching proformas:', error);
        }
    };

    const checkBudgetsWithRelations = async (proformaIds: number[]) => {
        try {
            const [pagosResponse, historiaResponse] = await Promise.all([
                api.get('/pagos'),
                api.get(`/historia-clinica/paciente/${id}`)
            ]);

            const budgetsWithData = new Set<number>();
            const budgetsCompleted = new Set<number>();

            // Check for payments
            pagosResponse.data.forEach((pago: any) => {
                if (pago.proformaId && proformaIds.includes(pago.proformaId)) {
                    budgetsWithData.add(pago.proformaId);
                }
            });

            // Check for clinical history and completed budgets
            historiaResponse.data.forEach((historia: any) => {
                if (historia.proformaId && proformaIds.includes(historia.proformaId)) {
                    budgetsWithData.add(historia.proformaId);

                    // Check if this budget is marked as terminado
                    if (historia.estadoPresupuesto === 'terminado') {
                        budgetsCompleted.add(historia.proformaId);
                    }
                }
            });

            setHistoriaList(historiaResponse.data || []);
            setBudgetsWithRelations(budgetsWithData);
            setCompletedBudgets(budgetsCompleted);
        } catch (error) {
            console.error('Error checking budget relations:', error);
        }
    };

    const handleApprove = async (proformaId: number) => {
        // 1. Verify if logged-in user has codigo_proforma registered
        const userStr = localStorage.getItem('user');
        const currentUser = userStr ? JSON.parse(userStr) : null;
        let userObj = currentUser;

        if (currentUser?.id) {
            try {
                const res = await api.get(`/users/${currentUser.id}`);
                userObj = res.data;
            } catch (e) {
                console.error('Error fetching user info:', e);
            }
        }

        if (!userObj || !userObj.codigo_proforma) {
            Swal.fire({
                title: 'Atención',
                text: 'Debe registrar primero su código de aprobación en su perfil de usuario.',
                icon: 'warning',
                confirmButtonText: 'OK',
                confirmButtonColor: '#3085d6',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
            return;
        }

        const { value: codigo } = await Swal.fire({
            title: 'Aprobar Presupuesto',
            text: 'Ingrese su código de aprobación:',
            input: 'password',
            inputValue: '',
            inputPlaceholder: 'Código de aprobación',
            inputAttributes: {
                autocomplete: 'new-password',
                autoCapitalize: 'off',
                autoCorrect: 'off'
            },
            showCancelButton: true,
            confirmButtonText: 'Aprobar',
            cancelButtonText: 'Cancelar',
            background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
            color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            inputValidator: (value) => {
                if (!value) {
                    return '¡Debe ingresar el código!';
                }
            }
        });

        if (codigo) {
            try {
                await api.post(`/proformas/${proformaId}/approve`, { codigo });
                Swal.fire({
                    title: '¡Aprobado!',
                    text: 'El presupuesto ha sido aprobado.',
                    icon: 'success',
                    showConfirmButton: false,
                    timer: 1500,
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
                if (id) fetchProformas(Number(id));
            } catch (error: any) {
                console.error('Error approving proforma:', error);
                Swal.fire({
                    title: 'Error',
                    text: error.response?.data?.message || 'Código incorrecto o error del servidor',
                    icon: 'error',
                    showConfirmButton: false,
                    timer: 1500,
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
            }
        }
    };

    const handleDelete = async (proformaId: number) => {
        const result = await Swal.fire({
            title: '¿Está seguro?',
            text: 'Esta acción eliminará el presupuesto permanentemente',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
            color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/proformas/${proformaId}`);
                Swal.fire({
                    title: '¡Eliminado!',
                    text: 'El presupuesto ha sido eliminado.',
                    icon: 'success',
                    showConfirmButton: false,
                    timer: 1500,
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
                if (id) fetchProformas(Number(id));
            } catch (error: any) {
                console.error('Error deleting proforma:', error);
                Swal.fire({
                    title: 'Error',
                    text: error.response?.data?.message || 'Error al eliminar el presupuesto',
                    icon: 'error',
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
            }
        }
    };

    const canDeleteBudget = (proformaId: number) => {
        return !budgetsWithRelations.has(proformaId);
    };

    const handleSendWhatsApp = async (proforma: Proforma, includePaymentInfo: boolean) => {
        const type = includePaymentInfo ? 'Con Pago' : 'Sin Pago';

        Swal.fire({
            title: 'Enviando...',
            text: `Enviando presupuesto (${type}) por WhatsApp...`,
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            // Generate PDF Blob
            const pdfBlob = await generatePDF(proforma, 'blob', includePaymentInfo);

            if (!(pdfBlob instanceof Blob)) {
                throw new Error('Error al generar el PDF');
            }

            const fullPatientName = (formatFullName(paciente) || `${paciente?.nombre || ''} ${paciente?.paterno || ''} ${paciente?.materno || ''}`).trim() || 'Paciente';
            const safeDocName = `${fullPatientName} - Presupuesto #${proforma.numero}`.replace(/[/\\?%*:|"<>]/g, '');

            const formData = new FormData();
            formData.append('file', pdfBlob, `${safeDocName}.pdf`);

            await api.post(`/proformas/${proforma.id}/send-whatsapp`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            Swal.fire({
                icon: 'success',
                title: '¡Enviado!',
                text: 'El presupuesto se envió correctamente por WhatsApp',
                timer: 2000,
                showConfirmButton: false,
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
        } catch (error: any) {
            console.error('Error sending WhatsApp:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Error al enviar por WhatsApp. Verifique que el chatbot esté conectado.',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
        }
    };

    const generatePDF = async (proforma: Proforma, action: 'print' | 'download' | 'blob', includePaymentInfo: boolean = true) => {
        // Show loading alert because we are not opening a window immediately
        if (action !== 'blob') {
            Swal.fire({
                title: 'Generando PDF...',
                text: 'Por favor espere',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
        }

        const doc = new jsPDF();
        
        let patientSignatureBase64 = null;
        try {
            const firmasRes = await api.get(`/firmas/documento/presupuesto/${proforma.id}`);
            const firmas = firmasRes.data || [];
            const patientSignature = firmas.find((s: any) => s.rolFirmante === 'paciente');
            if (patientSignature && patientSignature.firmaData) {
                const url = getMediaUrl(patientSignature.firmaData);
                const response = await fetch(url);
                const blob = await response.blob();
                patientSignatureBase64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
            }
        } catch (e) {
            console.error('Error al cargar firma:', e);
        }

        const patientName = (formatFullName(paciente) || `${paciente?.nombre || ''} ${paciente?.paterno || ''} ${paciente?.materno || ''}`).trim() || 'Paciente';

        // 1. Date (Right aligned)
        doc.setFontSize(10);
        doc.setTextColor(0);
        const dateStr = formatDateSpanish(proforma.fecha);
        doc.text(dateStr, 200, 20, { align: 'right' });

        // 2. Salutation
        doc.setFont('helvetica', 'normal');
        doc.text('Señor(a):', 14, 35);

        doc.setFont('helvetica', 'bold');
        doc.text(patientName.toUpperCase(), 14, 40);

        doc.setFont('helvetica', 'normal');
        doc.text('De mi consideración:', 14, 50);
        doc.text('Según los estudios realizados le presentamos el siguiente presupuesto del tratamiento odontológico que Ud. requiere:', 14, 55);

        // 3. Proforma Number
        doc.setFont('helvetica', 'bold');
        doc.text(`Pre. # ${proforma.numero.toString().padStart(2, '0')}`, 200, 65, { align: 'right' });

        // 4. Table
        const hasDiscount = proforma.detalles.some(item => item.descuento > 0);

        let tableColumn = ["Descripción", "Pieza(s)", "Cant.", "P.U.", "Total"];
        if (hasDiscount) {
            tableColumn.push("Descuento %", "Total con Dcto %");
        }

        const tableRows: any[] = [];

        proforma.detalles.forEach(item => {
            const detalleArancel = item.arancel?.detalle || 'Tratamiento';
            const description = item.posible ? `${detalleArancel}\n(Posible tratamiento)` : detalleArancel;
            const row = [
                description,
                item.piezas,
                item.cantidad,
                formatCurrency(item.precioUnitario),
                item.posible ? '0,00' : formatCurrency(item.subTotal)
            ];

            if (hasDiscount) {
                row.push(
                    item.posible ? '0' : item.descuento,
                    item.posible ? '0,00' : formatCurrency(item.total)
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
            startY: 70,
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

        doc.text('TOTAL Bs.', penultColX + penultColWidth - 2, finalY + 5, { align: 'right' });
        const printTotal = proforma.detalles.reduce((sum, item) => sum + (item.posible ? 0 : Number(item.total)), 0);
        doc.text(formatCurrency(printTotal), lastColX + lastColWidth - 2, finalY + 5, { align: 'right' });

        finalY += 15;

        // 5. Amount in Words
        doc.setFont('helvetica', 'normal');
        const decimalPart = (printTotal % 1).toFixed(2).substring(2);
        const words = numberToWords(printTotal);
        doc.text(`SON: ${words} ${decimalPart}/100 BOLIVIANOS`, 14, finalY);

        finalY += 10;

        // 5.1 Proforma Note
        if (proforma.nota) {
            doc.setFont('helvetica', 'bold');
            doc.text('NOTA:', 14, finalY);

            doc.setFont('helvetica', 'normal');
            const splitNote = doc.splitTextToSize(proforma.nota, 165);
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

        if (includePaymentInfo) {
            const paymentY = finalY + 25;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.rect(14, paymentY, 40, 5);
            doc.text('SISTEMA DE PAGO', 16, paymentY + 3.5);

            doc.setFont('helvetica', 'normal');
            doc.rect(14, paymentY + 6, 180, 5);
            doc.text('- Cancelación del 50% al inicio. 30% durante el tratamiento. 20% antes de finalizado el mismo.', 16, paymentY + 9.5);

            noteY = paymentY + 20;
        } else {
            const phaseY = finalY + 25;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            // Phase A
            doc.rect(14, phaseY, 60, 5);
            doc.text('Fase A Quirurgica: Implante.', 15, phaseY + 3.5);

            // Phase B
            const phaseBY = phaseY + 7;
            const textPhaseB = 'Fase B Rehabilitación: Transcurridos 4 a 6 meses de la cirugía se realizará la rehabilitación, es decir muñones y coronas sobre implantes.';
            const splitPhaseB = doc.splitTextToSize(textPhaseB, 175);
            const heightPhaseB = splitPhaseB.length * 5;

            doc.rect(14, phaseBY, 180, heightPhaseB + 2);
            doc.text(splitPhaseB, 15, phaseBY + 4.5);

            noteY = phaseBY + heightPhaseB + 10;
        }

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
        const sigY = footerY + 40;

        // Left Signature
        doc.line(30, sigY, 80, sigY);
        doc.text('Dr. JOSE ARTIEDA S.', 35, sigY + 5);

        // Right Signature
        if (patientSignatureBase64) {
            doc.addImage(patientSignatureBase64, 'PNG', 130, sigY - 20, 40, 20);
        }
        doc.line(120, sigY, 180, sigY);
        doc.text(patientName, 125, sigY + 5);

        if (action !== 'blob') {
            if (Swal.isVisible()) Swal.close();
        }

        if (action === 'print') {
            const blobUrl = doc.output('bloburl');
            const printWin = window.open(blobUrl, '_blank');
            if (printWin) {
                printWin.onload = () => {
                    printWin.print();
                };
            } else {
                doc.autoPrint();
                doc.output('dataurlnewwindow');
            }
        } else if (action === 'download') {
            const fullPatientName = (formatFullName(paciente) || `${paciente?.nombre || ''} ${paciente?.paterno || ''} ${paciente?.materno || ''}`).trim() || 'Paciente';
            const safeDocName = `${fullPatientName} - Presupuesto #${proforma.numero}`.replace(/[/\\?%*:|"<>]/g, '');
            doc.save(`${safeDocName}.pdf`);
        } else if (action === 'blob') {
            return doc.output('blob');
        }
    };

    return (
        <div className="space-y-4">
            {/* Header del Tab */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-200 dark:border-gray-700 gap-4 mb-6 no-print">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <FileText className="text-blue-500" size={22} />
                        <span>Planes de Tratamiento &amp; Presupuestos</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                        Gestión de proformas, presupuestos odontológicos y planes de tratamiento del paciente
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
                            setEditingProformaId(undefined);
                            setIsPresupuestoModalOpen(true);
                        }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white hover:text-white no-underline hover:no-underline rounded-xl font-bold shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 text-sm cursor-pointer"
                    >
                        <Plus size={18} />
                        <span>Nuevo Presupuesto</span>
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl shadow-inner border border-gray-100 dark:border-gray-600 no-print">
                <div className="flex items-center gap-2 w-full md:w-auto flex-grow max-w-md">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Buscar por número, nota o fecha..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 text-sm"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg shadow-sm transition-all text-xs flex items-center gap-1 shrink-0"
                        >
                            <X size={14} />
                            <span>Limpiar</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Record Count */}
            {filteredProformas.length > 0 && (
                <div className="mb-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                    Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredProformas.length)} de {filteredProformas.length} presupuestos
                </div>
            )}

            <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider"># Pres.</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Registrado Por</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total (Bs.)</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Aprobado</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nota</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider no-print">Enviar</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider no-print">Imprimir</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider no-print">Exportar</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Firmado</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider no-print">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {currentProformas.map((proforma) => {
                            const isCompleted = completedBudgets.has(proforma.id);
                            return (
                                <tr key={proforma.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-200">
                                        {proforma.numero}
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        <div>{formatDateUTC(proforma.fecha)}</div>
                                        {isCompleted && (
                                            <div className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-tight mt-0.5">
                                                Plan terminado
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {proforma.usuario?.name || 'Sistema'}
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-white">
                                        {formatCurrency(proforma.total)}
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap text-center text-sm">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm cursor-help ${proforma.aprobado
                                                ? 'bg-gradient-to-r from-green-400 to-green-600 text-white'
                                                : 'bg-gradient-to-r from-red-400 to-red-600 text-white'
                                                }`}
                                            title={proforma.aprobado && proforma.usuarioAprobado ? `Aprobado por: ${proforma.usuarioAprobado.name}\nFecha: ${proforma.fecha_aprobado}` : ''}
                                        >
                                            {proforma.aprobado ? 'SÍ' : 'NO'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={proforma.nota}>
                                        {proforma.nota}
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap text-center no-print">
                                        <div className="flex gap-2 justify-center">
                                            <button
                                                onClick={() => handleSendWhatsApp(proforma, true)}
                                                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md transition-all transform hover:-translate-y-0.5"
                                                title="Con pago"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleSendWhatsApp(proforma, false)}
                                                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-md transition-all transform hover:-translate-y-0.5"
                                                title="Sin pago"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap text-center no-print">
                                        <div className="flex gap-2 justify-center">
                                            <button
                                                onClick={() => generatePDF(proforma, 'print', true)}
                                                className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 shadow-md transition-all transform hover:-translate-y-0.5"
                                                title="Con Pago"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => generatePDF(proforma, 'print', false)}
                                                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all transform hover:-translate-y-0.5"
                                                title="Sin pago"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap text-center no-print">
                                        <div className="flex gap-2 justify-center">
                                            <button
                                                onClick={() => generatePDF(proforma, 'download', true)}
                                                className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 shadow-md transition-all transform hover:-translate-y-0.5"
                                                title="Con pago"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => generatePDF(proforma, 'download', false)}
                                                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all transform hover:-translate-y-0.5"
                                                title="Sin pago"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                    <td className="p-3 text-center">
                                        <div className="flex justify-center items-center gap-2">
                                            {proforma.tieneFirma ? (
                                                <div className="flex items-center text-green-600 dark:text-green-400 font-bold" title="Presupuesto Firmado">
                                                    <CheckCircle size={20} className="mr-1" />
                                                    <span className="text-xs">Firmado</span>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setSelectedProformaIdForSignature(proforma.id);
                                                        setShowSignatureModal(true);
                                                    }}
                                                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all transform hover:-translate-y-0.5"
                                                    title="Firmar Presupuesto"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap text-center no-print">
                                        <div className="flex gap-2 justify-center">
                                            <button
                                                onClick={() => setViewProforma(proforma)}
                                                className="p-2 bg-orange-400 text-white rounded-lg hover:bg-orange-500 shadow-md transition-all transform hover:-translate-y-0.5"
                                                title="Ver Detalle"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingProformaId(proforma.id);
                                                    setIsPresupuestoModalOpen(true);
                                                }}
                                                className="p-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 shadow-md transition-all transform hover:-translate-y-0.5 inline-flex items-center justify-center"
                                                title="Editar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                </svg>
                                            </button>
                                            {!proforma.aprobado && (
                                                <button
                                                    onClick={() => handleApprove(proforma.id)}
                                                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-md transition-all transform hover:-translate-y-0.5"
                                                    title="Aprobar Presupuesto"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(proforma.id)}
                                                disabled={!canDeleteBudget(proforma.id)}
                                                className="p-2 bg-red-500 text-white rounded-lg shadow-md transition-all transform disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none hover:bg-red-600 hover:-translate-y-0.5"
                                                title={!canDeleteBudget(proforma.id) ? "No se puede eliminar: tiene pagos o historia clínica asociada" : "Eliminar Presupuesto"}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredProformas.length === 0 && (
                            <tr>
                                <td colSpan={11} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                                    <div className="flex flex-col items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p>No hay presupuestos registrados para este paciente.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {filteredProformas.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredProformas.length / itemsPerPage)}
                    onPageChange={(page) => setCurrentPage(page)}
                />
            )}

            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Presupuestos"
                sections={manualSections}
            />

            {showSignatureModal && selectedProformaIdForSignature && (
                <SignatureModal
                    isOpen={showSignatureModal}
                    onClose={() => {
                        setShowSignatureModal(false);
                        setSelectedProformaIdForSignature(null);
                    }}
                    tipoDocumento="presupuesto"
                    documentoId={selectedProformaIdForSignature}
                    rolFirmante="paciente"
                    onSuccess={() => {
                        fetchProformas(Number(id));
                    }}
                />
            )}

            <PlanTratamientoModal
                isOpen={!!viewProforma}
                onClose={() => setViewProforma(null)}
                proforma={viewProforma as any}
                historia={historiaList}
            />
            {/* Presupuesto Form Modal */}
            <PresupuestoForm
                isOpen={isPresupuestoModalOpen}
                onClose={() => setIsPresupuestoModalOpen(false)}
                onSuccess={() => {
                    fetchProformas(Number(id));
                }}
                id={id || ''}
                proformaId={editingProformaId}
            />
        </div>
    );
};

export default PresupuestoList;
