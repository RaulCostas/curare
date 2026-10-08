import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Printer, Search, Calendar, FileText, Eye, Edit, Image as ImageIcon, XCircle, User, Mic, MicOff, X } from 'lucide-react';
import api from '../services/api';
import Swal from 'sweetalert2';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import Pagination from './Pagination';
import ManualModal, { type ManualSection } from './ManualModal';
import { getLocalDateString, formatDate } from '../utils/dateUtils';
import { formatPaternoMaternoNombre } from '../utils/formatters';
import { printHtml } from '../utils/printUtils';

interface PacienteTabInformesProps {
    pacienteId: number;
    paciente?: any;
}

const PacienteTabInformes: React.FC<PacienteTabInformesProps> = ({ pacienteId, paciente: initialPaciente }) => {
    const [paciente, setPaciente] = useState<any>(initialPaciente || null);
    const [informes, setInformes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingInforme, setEditingInforme] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showManual, setShowManual] = useState(false);
    const [viewingInforme, setViewingInforme] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);

    // Doctor selection state
    const [doctores, setDoctores] = useState<any[]>([]);
    const [doctorId, setDoctorId] = useState<number | ''>('');

    // Extra Data for Historia Clínica & Images
    const [historiaClinica, setHistoriaClinica] = useState<any[]>([]);
    const [proformasList, setProformasList] = useState<any[]>([]);
    const [selectedProforma, setSelectedProforma] = useState<any>(null);
    const [imagenesPorProforma, setImagenesPorProforma] = useState<any[]>([]);
    const [loadingImagenes, setLoadingImagenes] = useState(false);
    const [showHistoriaModal, setShowHistoriaModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedHistoriaItems, setSelectedHistoriaItems] = useState<any[]>([]);
    const [selectedImages, setSelectedImages] = useState<any[]>([]);

    // Voice Dictation state
    const recognitionRef = useRef<any>(null);
    const [isListening, setIsListening] = useState(false);
    const [interimTranscript, setInterimTranscript] = useState('');

    const stopVoiceDictation = () => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {}
            recognitionRef.current = null;
        }
        setIsListening(false);
        setInterimTranscript('');
    };

    const toggleVoiceDictation = () => {
        if (isListening) {
            stopVoiceDictation();
            return;
        }

        const win = window as any;
        const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

        if (!SpeechRecognitionClass) {
            Swal.fire({
                title: 'Reconocimiento de voz no soportado',
                text: 'Tu navegador no soporta reconocimiento de voz nativo (Web Speech API). Te recomendamos usar Google Chrome o Microsoft Edge.',
                icon: 'info',
                confirmButtonColor: '#3085d6',
            });
            return;
        }

        try {
            const recognition = new SpeechRecognitionClass();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'es-BO';

            recognition.onstart = () => {
                setIsListening(true);
                setInterimTranscript('');
            };

            recognition.onresult = (event: any) => {
                let interim = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    const transcriptChunk = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        const cleanText = transcriptChunk.trim();
                        if (cleanText) {
                            const formatted = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
                            setContenido(prev => {
                                if (!prev || prev === '<p><br></p>' || prev.trim() === '') {
                                    return `<p>${formatted}.</p>`;
                                }
                                if (prev.endsWith('</p>')) {
                                    return prev.slice(0, -4) + ` ${formatted}.</p>`;
                                }
                                return prev + `<p>${formatted}.</p>`;
                            });
                        }
                    } else {
                        interim += transcriptChunk;
                    }
                }
                setInterimTranscript(interim);
            };

            recognition.onerror = (event: any) => {
                console.warn('Speech recognition error:', event.error);
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    Swal.fire('Permiso denegado', 'Por favor habilita el permiso de micrófono en tu navegador.', 'warning');
                    stopVoiceDictation();
                }
            };

            recognition.onend = () => {
                setIsListening(false);
                setInterimTranscript('');
            };

            recognitionRef.current = recognition;
            recognition.start();
        } catch (err) {
            console.error('Error starting recognition:', err);
            stopVoiceDictation();
        }
    };

    const handleCloseForm = () => {
        stopVoiceDictation();
        setIsFormOpen(false);
        setEditingInforme(null);
    };

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) {}
            }
        };
    }, []);

    const limit = 10;

    const manualSections: ManualSection[] = [
        {
            title: 'Gestión de Informes',
            content: 'El módulo de Informes Odontológicos permite redactar y guardar documentos e informes formales para el paciente con editor enriquecido, tablas de historia clínica e imágenes.'
        },
        {
            title: 'Editor Enriquecido e Historia Clínica',
            content: 'Utilice el editor de texto enriquecido para dar formato. Use "Añadir Historia Clínica" para insertar registros del historial del paciente o "Añadir Imagen" para adjuntar imágenes.'
        }
    ];

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'align': '' }, { 'align': 'center' }, { 'align': 'right' }, { 'align': 'justify' }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['clean']
        ],
    };

    // Form state
    const [fecha, setFecha] = useState(getLocalDateString());
    const [titulo, setTitulo] = useState('Informe Odontológico');
    const [contenido, setContenido] = useState('');

    useEffect(() => {
        fetchDoctores();
        if (pacienteId) {
            fetchInformes();
            fetchExtraData();
        }
    }, [pacienteId]);

    const fetchDoctores = async () => {
        try {
            const res = await api.get('/doctors?limit=1000&estado=activo');
            const docs = res.data?.data || res.data || [];
            const activeDocs = (Array.isArray(docs) ? docs : [])
                .filter((doc: any) => !doc.estado || doc.estado.toLowerCase() === 'activo' || (editingInforme && doc.id === editingInforme.doctorId))
                .sort((a: any, b: any) => formatPaternoMaternoNombre(a).localeCompare(formatPaternoMaternoNombre(b), 'es', { sensitivity: 'base' }));
            setDoctores(activeDocs);
        } catch (e) {
            console.error("Error fetching doctors:", e);
        }
    };

    const fetchInformes = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/informes?pacienteId=${pacienteId}`);
            setInformes(response.data || []);
            if (!paciente) {
                const resPaciente = await api.get(`/pacientes/${pacienteId}`);
                if (resPaciente.data) {
                    setPaciente(resPaciente.data);
                }
            }
        } catch (error) {
            console.error("Error fetching informes:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchExtraData = async () => {
        try {
            // Historia clínica: ruta correcta es /historia-clinica/paciente/:id
            const historiaRes = await api.get(`/historia-clinica/paciente/${pacienteId}`);
            setHistoriaClinica(historiaRes.data || []);
        } catch (error) {
            console.error("Error fetching historia clínica:", error);
            setHistoriaClinica([]);
        }
        try {
            // Proformas del paciente (para luego cargar imágenes por proforma)
            const proformasRes = await api.get(`/proformas/paciente/${pacienteId}`);
            setProformasList(proformasRes.data || []);
        } catch (error) {
            console.error("Error fetching proformas:", error);
            setProformasList([]);
        }
    };

    const handleSelectProformaForImages = async (proforma: any) => {
        setSelectedProforma(proforma);
        setImagenesPorProforma([]);
        setSelectedImages([]);
        setLoadingImagenes(true);
        try {
            const response = await api.get(`/proformas/${proforma.id}/imagenes`);
            setImagenesPorProforma(response.data || []);
        } catch (error) {
            console.error("Error fetching images:", error);
            setImagenesPorProforma([]);
        } finally {
            setLoadingImagenes(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingInforme(null);
        setFecha(getLocalDateString());
        setTitulo('Informe Odontológico');
        setContenido('');
        setDoctorId('');
        setIsFormOpen(true);
    };

    const handleOpenEdit = (informe: any) => {
        setEditingInforme(informe);
        setFecha(informe.fecha ? getLocalDateString(informe.fecha) : getLocalDateString());
        setTitulo(informe.titulo || 'Informe Odontológico');
        setContenido(informe.contenido || '');
        setDoctorId(informe.doctorId || informe.doctor?.id || '');
        setIsFormOpen(true);
    };

    const toggleHistoriaSelection = (item: any) => {
        if (selectedHistoriaItems.find(i => i.id === item.id)) {
            setSelectedHistoriaItems(selectedHistoriaItems.filter(i => i.id !== item.id));
        } else {
            setSelectedHistoriaItems([...selectedHistoriaItems, item]);
        }
    };

    const handleInsertHistoria = () => {
        if (selectedHistoriaItems.length === 0) return;

        // Sort selected items by date ascending
        const sorted = [...selectedHistoriaItems].sort((a, b) => {
            const da = a.fecha ? new Date(a.fecha).getTime() : 0;
            const db = b.fecha ? new Date(b.fecha).getTime() : 0;
            return da - db;
        });

        // Build header row + one data row per selected item, all in one table
        const headerRow = `<tr><td style="padding:8px;border:1px solid #94a3b8;font-weight:bold;">Fecha</td><td style="padding:8px;border:1px solid #94a3b8;font-weight:bold;">Tratamiento / Procedimiento</td><td style="padding:8px;border:1px solid #94a3b8;font-weight:bold;">Elemento Dental</td><td style="padding:8px;border:1px solid #94a3b8;font-weight:bold;">Observaciones</td></tr>`;

        const dataRows = sorted.map(item => {
            const fechaStr = formatDate(item.fecha) || '-';
            const tratamientoStr = item.tratamiento || item.procedimiento || item.descripcion || '-';
            const piezaStr = item.pieza || item.diente || '-';
            const obsStr = item.observaciones || item.diagnostico || '-';
            return `<tr><td style="padding:8px;border:1px solid #94a3b8;">${fechaStr}</td><td style="padding:8px;border:1px solid #94a3b8;">${tratamientoStr}</td><td style="padding:8px;border:1px solid #94a3b8;">${piezaStr}</td><td style="padding:8px;border:1px solid #94a3b8;">${obsStr}</td></tr>`;
        }).join('');

        const tableHtml = `<table style="width:100%;border-collapse:collapse;margin-bottom:10px;"><tbody>${headerRow}${dataRows}</tbody></table><p><br/></p>`;

        setContenido(prev => prev + tableHtml);
        setSelectedHistoriaItems([]);
        setShowHistoriaModal(false);
    };

    const toggleImageSelection = (img: any) => {
        if (selectedImages.find(i => i.id === img.id)) {
            setSelectedImages(selectedImages.filter(i => i.id !== img.id));
        } else {
            setSelectedImages([...selectedImages, img]);
        }
    };

    const handleInsertImages = () => {
        if (selectedImages.length === 0) return;
        let txt = '<p class="ql-align-center">';
        const baseUrl = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : '';

        for (let i = 0; i < selectedImages.length; i++) {
            const img = selectedImages[i];
            const rawRuta = img.url || img.ruta || img.path || '';
            const imgUrl = rawRuta.startsWith('http') ? rawRuta : `${baseUrl}/uploads/${rawRuta.replace(/^\/?(uploads\/)?/, '')}`;
            txt += `<img src="${imgUrl}" alt="${img.descripcion || 'Imagen Médica'}" style="max-width: 350px; margin: 5px; border-radius: 8px;" />`;
        }
        txt += '</p><p><br/></p>';

        setContenido(prev => prev + txt);
        setShowImageModal(false);
        setSelectedImages([]);
    };

    const handleSaveInforme = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!doctorId) {
            Swal.fire('Atención', 'Debe seleccionar un Doctor obligatorio.', 'warning');
            return;
        }
        if (!contenido || contenido === '<p><br></p>') {
            Swal.fire('Atención', 'El contenido del informe no puede estar vacío.', 'warning');
            return;
        }

        setSubmitting(true);
        try {
            let currentUserId: number | undefined = undefined;
            try {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    const parsed = JSON.parse(storedUser);
                    if (parsed.id || parsed.userId) {
                        currentUserId = Number(parsed.id || parsed.userId);
                    }
                }
            } catch (e) {
                console.error("Error reading user from localStorage:", e);
            }

            const payload = {
                pacienteId: Number(pacienteId),
                doctorId: Number(doctorId),
                userId: currentUserId,
                fecha,
                titulo: titulo.trim() || 'Informe Odontológico',
                contenido,
            };

            if (editingInforme) {
                await api.patch(`/informes/${editingInforme.id}`, payload);
                Swal.fire({
                    icon: 'success',
                    title: 'Informe actualizado',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                await api.post('/informes', payload);
                Swal.fire({
                    icon: 'success',
                    title: 'Informe creado',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
            setIsFormOpen(false);
            fetchInformes();
        } catch (error: any) {
            console.error("Error saving informe:", error);
            Swal.fire('Error', error.response?.data?.message || 'Error al guardar el informe.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteInforme = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Eliminar informe?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/informes/${id}`);
                Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500, showConfirmButton: false });
                fetchInformes();
            } catch (error) {
                console.error("Error deleting informe:", error);
                Swal.fire('Error', 'No se pudo eliminar el informe.', 'error');
            }
        }
    };

    const handleSendWhatsApp = async (informe: any) => {
        const nombrePaciente = paciente ? formatPaternoMaternoNombre(paciente) : 'el paciente';
        const celular = paciente?.celular;

        if (!celular) {
            Swal.fire({
                icon: 'warning',
                title: 'Atención',
                text: 'El paciente no tiene un número de celular registrado.',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
            return;
        }

        const result = await Swal.fire({
            title: '¿Enviar informe por WhatsApp?',
            text: `Se enviará el documento PDF del informe a ${nombrePaciente} (${celular}) mediante el Chatbot.`,
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
            text: 'Enviando informe en formato PDF por WhatsApp mediante el Chatbot...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const response = await api.post(`/informes/${informe.id}/send-whatsapp`);
            Swal.fire({
                icon: 'success',
                title: '¡Enviado!',
                text: response.data?.message || 'Informe enviado por WhatsApp exitosamente',
                timer: 2000,
                showConfirmButton: false,
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
        } catch (error: any) {
            console.error('Error sending WhatsApp informe:', error);
            let errorMessage = 'No se pudo enviar el informe por WhatsApp';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.status === 503) {
                errorMessage = 'El chatbot no está conectado. Por favor, conecte el chatbot primero desde Configuración > Chatbot (WhatsApp).';
            }
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage,
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
        }
    };

    const handlePrintInforme = (informe: any) => {
        const nombrePaciente = paciente
            ? `${paciente.paterno || ''} ${paciente.materno || ''} ${paciente.nombre || ''}`.replace(/\s+/g, ' ').trim().toUpperCase()
            : 'PACIENTE';

        const docObj = informe.doctor || {};
        const doctorName = docObj.paterno
            ? `${docObj.paterno} ${docObj.materno || ''} ${docObj.nombre || ''}`.replace(/\s+/g, ' ').trim()
            : 'No asignado';
        const doctorEsp = docObj.especialidad?.especialidad || 'Odontología General';
        const fechaFormateada = informe.fecha ? formatDate(informe.fecha) : formatDate(getLocalDateString());
        const logoUrl = `${window.location.origin}/logo-curare.png`;
        const doctorNombreFirma = docObj.paterno
            ? `DR. ${docObj.paterno} ${docObj.materno || ''} ${docObj.nombre || ''}`.replace(/\s+/g, ' ').trim().toUpperCase()
            : 'FIRMA Y SELLO ODONTOLÓGICO';

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${informe.titulo || 'Informe Odontológico'}</title>
                <meta charset="utf-8" />
                <style>
                    @page {
                        size: A4;
                        margin: 15mm 15mm 15mm 15mm;
                    }
                    * {
                        box-sizing: border-box;
                    }
                    @media print {
                        html, body {
                            margin: 0 !important;
                            padding: 0 !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                    }
                    body {
                        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                        padding: 0;
                        margin: 0;
                        color: #1e293b;
                        line-height: 1.5;
                        font-size: 13px;
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 12px;
                    }
                    .logo-img {
                        max-height: 48px;
                        max-width: 140px;
                        object-fit: contain;
                    }
                    .clinic-info {
                        text-align: right;
                    }
                    .clinic-title {
                        font-size: 14px;
                        font-weight: 700;
                        color: #1e40af;
                        margin: 0;
                        letter-spacing: 0.3px;
                    }
                    .clinic-subtitle {
                        font-size: 9.5px;
                        color: #6b7280;
                        margin: 2px 0 0 0;
                    }
                    .clinic-location {
                        font-size: 9px;
                        color: #9ca3af;
                        margin: 1px 0 0 0;
                    }
                    .divider {
                        height: 2px;
                        background-color: #1e40af;
                        margin-bottom: 15px;
                        border: none;
                    }
                    .report-title {
                        text-align: center;
                        color: #1e40af;
                        font-size: 15px;
                        font-weight: 700;
                        margin: 0 0 15px 0;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .info-box {
                        background-color: #eff6ff;
                        border: 1px solid #2563eb;
                        border-radius: 4px;
                        padding: 8px 12px;
                        margin-bottom: 20px;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        font-size: 11px;
                        color: #1f2937;
                    }
                    .info-row:not(:last-child) {
                        margin-bottom: 5px;
                    }
                    .info-item {
                        display: flex;
                        gap: 6px;
                    }
                    .info-label {
                        font-weight: 700;
                        color: #1f2937;
                    }
                    .content {
                        font-size: 12px;
                        line-height: 1.55;
                        color: #1e293b;
                        min-height: 200px;
                        margin-bottom: 30px;
                    }
                    .content p {
                        margin: 0 0 8px 0;
                    }
                    .content table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 10px 0 15px 0;
                        font-size: 10px;
                    }
                    .content th, .content td {
                        border: 0.5px solid #cbd5e1;
                        padding: 5px 6px;
                        text-align: left;
                    }
                    .content th {
                        background-color: #0d9488;
                        color: #ffffff;
                        font-weight: 700;
                    }
                    .content img {
                        max-width: 320px;
                        height: auto;
                        border-radius: 6px;
                        margin: 6px;
                        display: inline-block;
                    }
                    .signature-section {
                        margin-top: 50px;
                        text-align: center;
                        page-break-inside: avoid;
                    }
                    .signature-line {
                        display: inline-block;
                        width: 200px;
                        border-top: 1px solid #475569;
                        padding-top: 6px;
                    }
                    .signature-name {
                        font-weight: 700;
                        font-size: 11px;
                        color: #111827;
                        text-transform: uppercase;
                    }
                    .signature-sub {
                        font-size: 9.5px;
                        color: #64748b;
                        margin-top: 2px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="${logoUrl}" alt="Curare Logo" class="logo-img" />
                    <div class="clinic-info">
                        <div class="clinic-title">CURARE CENTRO DENTAL</div>
                        <div class="clinic-subtitle">Especialistas en Odontología Integral</div>
                        <div class="clinic-location">La Paz - Bolivia</div>
                    </div>
                </div>

                <div class="divider"></div>

                <div class="report-title">${(informe.titulo || 'INFORME ODONTOLÓGICO').toUpperCase()}</div>

                <div class="info-box">
                    <div class="info-row">
                        <div class="info-item">
                            <span class="info-label">Paciente:</span>
                            <span>${nombrePaciente}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Fecha:</span>
                            <span>${fechaFormateada}</span>
                        </div>
                    </div>
                    <div class="info-row">
                        <div class="info-item">
                            <span class="info-label">Doctor Tratante:</span>
                            <span>Dr. ${doctorName}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Especialidad:</span>
                            <span>${doctorEsp}</span>
                        </div>
                    </div>
                </div>

                <div class="content">
                    ${informe.contenido || ''}
                </div>

                <div class="signature-section">
                    <div class="signature-line">
                        <div class="signature-name">${doctorNombreFirma}</div>
                        <div class="signature-sub">Odontólogo - ${doctorEsp}</div>
                    </div>
                </div>
            </body>
            </html>
        `;
        printHtml(htmlContent);
    };

    const stripHtmlTags = (html: string) => {
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html || '';
        return tmp.textContent || tmp.innerText || "";
    };

    const filteredInformes = informes.filter(inf =>
        (inf.titulo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inf.contenido || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredInformes.length / limit) || 1;
    const paginatedInformes = filteredInformes.slice((currentPage - 1) * limit, currentPage * limit);

    return (
        <>
        <style>{`
                .ql-editor img, .report-view img {
                    max-width: 350px !important;
                    height: auto !important;
                    display: inline-block !important;
                    margin: 6px !important;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .ql-editor table, .report-view table {
                    width: 100% !important;
                    border-collapse: collapse !important;
                    margin-bottom: 12px !important;
                }
                .ql-editor td, .report-view td, .ql-editor th, .report-view th {
                    border: 1px solid #94a3b8 !important;
                    padding: 8px !important;
                }
                .ql-editor.ql-blank::before {
                    color: #9ca3af;
                    font-style: italic;
                }
                /* ReactQuill Dark Mode Customization */
                .dark .ql-toolbar {
                    background-color: #1f2937 !important;
                    border-color: #4b5563 !important;
                    border-top-left-radius: 0.75rem;
                    border-top-right-radius: 0.75rem;
                }
                .dark .ql-toolbar .ql-stroke {
                    stroke: #f3f4f6 !important;
                }
                .dark .ql-toolbar .ql-fill {
                    fill: #f3f4f6 !important;
                }
                .dark .ql-toolbar .ql-picker {
                    color: #f3f4f6 !important;
                }
                .dark .ql-toolbar .ql-picker-options {
                    background-color: #1f2937 !important;
                    border-color: #4b5563 !important;
                    color: #f3f4f6 !important;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
                }
                .dark .ql-toolbar button:hover .ql-stroke,
                .dark .ql-toolbar button.ql-active .ql-stroke,
                .dark .ql-toolbar .ql-picker-label:hover .ql-stroke,
                .dark .ql-toolbar .ql-picker-label.ql-active .ql-stroke {
                    stroke: #60a5fa !important;
                }
                .dark .ql-toolbar button:hover .ql-fill,
                .dark .ql-toolbar button.ql-active .ql-fill,
                .dark .ql-toolbar .ql-picker-label:hover .ql-fill,
                .dark .ql-toolbar .ql-picker-label.ql-active .ql-fill {
                    fill: #60a5fa !important;
                }
                .dark .ql-toolbar button:hover,
                .dark .ql-toolbar button.ql-active,
                .dark .ql-toolbar .ql-picker-label:hover,
                .dark .ql-toolbar .ql-picker-label.ql-active {
                    color: #60a5fa !important;
                    background-color: rgba(59, 130, 246, 0.2) !important;
                    border-radius: 6px;
                }
                .dark .ql-container {
                    border-color: #4b5563 !important;
                    background-color: #111827 !important;
                    border-bottom-left-radius: 0.75rem;
                    border-bottom-right-radius: 0.75rem;
                }
                .dark .ql-editor {
                    color: #f9fafb !important;
                }
            `}</style>
        <div className="space-y-6">

            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-200 dark:border-gray-700 gap-4 mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <FileText className="text-blue-500" size={22} />
                        <span>Informes Odontológicos</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                        Documentos y reportes clínicos emitidos para el paciente
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[34px] h-[34px] text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shadow-sm cursor-pointer"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>
                    <button
                        onClick={handleOpenCreate}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 text-sm cursor-pointer"
                    >
                        <Plus size={18} /> Nuevo Informe
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 no-print">
                <div className="flex items-center gap-2 max-w-md w-full">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Buscar informe..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-300 text-sm"
                        />
                        <Search size={18} className="text-gray-400 absolute left-3 top-2.5" />
                    </div>
                    {searchTerm && (
                        <button
                            onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                            className="px-3.5 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-medium rounded-xl text-sm transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                            title="Limpiar búsqueda"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Limpiar
                        </button>
                    )}
                </div>
            </div>

            <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                Mostrando {filteredInformes.length === 0 ? 0 : (currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, filteredInformes.length)} de {filteredInformes.length} registros
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider border-b border-gray-100 dark:border-gray-700">
                            <th className="py-3.5 px-6 font-semibold">Fecha</th>
                            <th className="py-3.5 px-6 font-semibold">Título del Informe</th>
                            <th className="py-3.5 px-6 font-semibold">Doctor</th>
                            <th className="py-3.5 px-6 font-semibold">Resumen</th>
                            <th className="py-3.5 px-6 font-semibold text-center no-print">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50 text-sm text-gray-800 dark:text-gray-200">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-gray-400">Cargando informes...</td>
                            </tr>
                        ) : paginatedInformes.length > 0 ? (
                            paginatedInformes.map((inf) => (
                                <tr key={inf.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="py-4 px-6 whitespace-nowrap text-gray-700 dark:text-gray-300 font-medium">
                                        {inf.fecha ? formatDate(inf.fecha) : '-'}
                                    </td>
                                    <td className="py-4 px-6 font-semibold text-gray-900 dark:text-white">
                                        {inf.titulo || 'Informe Odontológico'}
                                    </td>
                                    <td className="py-4 px-6 text-gray-700 dark:text-gray-300">
                                        {inf.doctor ? `Dr. ${inf.doctor.paterno} ${inf.doctor.materno || ''} ${inf.doctor.nombre}`.trim() : '-'}
                                    </td>
                                    <td className="py-4 px-6 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                        {stripHtmlTags(inf.contenido)}
                                    </td>
                                    <td className="py-4 px-6 text-center whitespace-nowrap no-print">
                                        <div className="flex items-center justify-center gap-2">
                                            {/* Ver */}
                                            <button
                                                type="button"
                                                onClick={() => setViewingInforme(inf)}
                                                className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 inline-flex items-center justify-center cursor-pointer"
                                                title="Ver Informe"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            {/* Imprimir */}
                                            <button
                                                type="button"
                                                onClick={() => handlePrintInforme(inf)}
                                                className="p-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 inline-flex items-center justify-center cursor-pointer"
                                                title="Imprimir Informe"
                                            >
                                                <Printer size={16} />
                                            </button>
                                            {/* WhatsApp */}
                                            <button
                                                type="button"
                                                onClick={() => handleSendWhatsApp(inf)}
                                                className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 inline-flex items-center justify-center cursor-pointer"
                                                title="Enviar PDF por WhatsApp"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                </svg>
                                            </button>
                                            {/* Editar */}
                                            <button
                                                type="button"
                                                onClick={() => handleOpenEdit(inf)}
                                                className="p-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 inline-flex items-center justify-center cursor-pointer"
                                                title="Editar Informe"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            {/* Eliminar */}
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteInforme(inf.id)}
                                                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 inline-flex items-center justify-center cursor-pointer"
                                                title="Eliminar Informe"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-gray-400">
                                    No hay informes registrados para este paciente.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {filteredInformes.length > limit && (
                <div className="flex justify-center pt-2">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            {/* Form Modal (Con ReactQuill, Añadir Historia Clínica y Añadir Imagen) */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 transition-opacity">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                                <span className="p-2 bg-purple-100 dark:bg-purple-900 rounded-xl text-purple-600 dark:text-purple-300">
                                    <FileText size={20} />
                                </span>
                                {editingInforme ? 'Editar Informe Odontológico' : 'Nuevo Informe Odontológico'}
                            </h2>
                            <button
                                type="button"
                                onClick={handleCloseForm}
                                className="text-gray-400 bg-transparent hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full transition-all cursor-pointer"
                                title="Cerrar"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form Content */}
                        <div className="p-5 overflow-y-auto flex-1 space-y-4">
                            <form id="informe-form" onSubmit={handleSaveInforme} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Título del Documento <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <FileText size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                            <input
                                                type="text"
                                                value={titulo}
                                                onChange={e => setTitulo(e.target.value)}
                                                placeholder="Ej: Informe Odontológico General / Certificado"
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition duration-200 text-sm"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Fecha <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                            <input
                                                type="date"
                                                value={fecha}
                                                onChange={e => setFecha(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition duration-200 text-sm"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Doctor Tratante <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                            <select
                                                value={doctorId}
                                                onChange={e => setDoctorId(e.target.value ? Number(e.target.value) : '')}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition duration-200 text-sm cursor-pointer"
                                                required
                                            >
                                                <option value="">-- Seleccionar Doctor --</option>
                                                {doctores.map((doc: any) => (
                                                    <option key={doc.id} value={doc.id}>
                                                        Dr(a). {formatPaternoMaternoNombre(doc)} {doc.especialidad ? `(${doc.especialidad.especialidad})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex flex-wrap justify-between items-center gap-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Contenido del Informe <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={toggleVoiceDictation}
                                                className={`text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all shadow-sm ${
                                                    isListening
                                                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse ring-2 ring-red-400'
                                                        : 'bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300'
                                                }`}
                                                title={isListening ? 'Detener dictado por voz' : 'Dictar contenido por micrófono'}
                                            >
                                                {isListening ? <MicOff size={14} className="animate-spin" /> : <Mic size={14} />}
                                                <span>{isListening ? 'Detener Dictado' : 'Dictar por Voz'}</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowHistoriaModal(true)}
                                                className="text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                                            >
                                                <Plus size={14} /> Añadir Historia Clínica
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowImageModal(true)}
                                                className="text-xs bg-green-100 hover:bg-green-200 dark:bg-green-900/40 dark:hover:bg-green-900/60 text-green-700 dark:text-green-300 font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                                            >
                                                <ImageIcon size={14} /> Añadir Imagen
                                            </button>
                                        </div>
                                    </div>

                                    {isListening && (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-lg text-xs text-purple-700 dark:text-purple-300">
                                            <span className="relative flex h-2.5 w-2.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                            </span>
                                            <span className="font-bold">Dictando:</span>
                                            <span className="italic truncate flex-1">{interimTranscript || 'Hable ahora para redactar el informe...'}</span>
                                            <button
                                                type="button"
                                                onClick={stopVoiceDictation}
                                                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                                            >
                                                <MicOff size={13} />
                                                <span>Detener</span>
                                            </button>
                                        </div>
                                    )}

                                    <style>{`
                                        .informe-editor .ql-editor {
                                            min-height: 240px;
                                            font-size: 14px;
                                            line-height: 1.6;
                                        }
                                        .informe-editor .ql-toolbar.ql-snow {
                                            border-radius: 0.75rem 0.75rem 0 0;
                                            background: #f8fafc;
                                        }
                                        .dark .informe-editor .ql-toolbar.ql-snow {
                                            background: #1e293b !important;
                                            border-color: #374151 !important;
                                        }
                                        .dark .informe-editor .ql-container.ql-snow {
                                            border-color: #374151 !important;
                                            background: #111827 !important;
                                        }
                                        .dark .informe-editor .ql-editor {
                                            color: #f9fafb !important;
                                        }
                                        .dark .informe-editor .ql-editor.ql-blank::before {
                                            color: #9ca3af !important;
                                            font-style: italic;
                                        }
                                        .dark .informe-editor .ql-stroke {
                                            stroke: #ffffff !important;
                                        }
                                        .dark .informe-editor .ql-fill {
                                            fill: #ffffff !important;
                                        }
                                        .dark .informe-editor .ql-picker {
                                            color: #ffffff !important;
                                        }
                                        .dark .informe-editor .ql-picker-label {
                                            color: #ffffff !important;
                                        }
                                        .dark .informe-editor .ql-picker-options {
                                            background-color: #1e293b !important;
                                            border-color: #374151 !important;
                                            color: #ffffff !important;
                                        }
                                        .dark .informe-editor .ql-picker-item {
                                            color: #ffffff !important;
                                        }
                                    `}</style>

                                    <div className="informe-editor bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600">
                                        <ReactQuill
                                            theme="snow"
                                            value={contenido}
                                            onChange={setContenido}
                                            modules={quillModules}
                                            className="h-64 mb-12 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-start gap-3 rounded-b-xl">
                            <button
                                type="submit"
                                form="informe-form"
                                disabled={submitting}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-xl flex items-center gap-2 transform hover:-translate-y-0.5 transition-all shadow-md disabled:opacity-50"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                    <polyline points="7 3 7 8 15 8"></polyline>
                                </svg>
                                {submitting ? 'Guardando...' : (editingInforme ? 'Actualizar' : 'Guardar')}
                            </button>
                            <button
                                type="button"
                                onClick={handleCloseForm}
                                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 text-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Añadir Historia Clínica */}
            {showHistoriaModal && (() => {
                // Group historia clinica by proforma
                const groups: Record<string, { label: string; items: any[] }> = {};
                historiaClinica.forEach(h => {
                    const key = h.proformaId ? String(h.proformaId) : 'sin-plan';
                    if (!groups[key]) {
                        const numero = h.proforma?.numero || h.proformaId || null;
                        groups[key] = {
                            label: numero ? `Plan de Tratamiento #${numero}` : 'Sin Plan de Tratamiento',
                            items: []
                        };
                    }
                    groups[key].items.push(h);
                });

                return (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Seleccionar Registro de Historia Clínica</h3>
                                    {selectedHistoriaItems.length > 0 && (
                                        <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full font-semibold">
                                            {selectedHistoriaItems.length} seleccionado(s)
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setShowHistoriaModal(false); setSelectedHistoriaItems([]); }}
                                    className="text-gray-400 bg-transparent hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full transition-all cursor-pointer"
                                    title="Cerrar"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-4 overflow-y-auto flex-1 bg-white dark:bg-gray-800 space-y-4">
                                {!Array.isArray(historiaClinica) || historiaClinica.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">No hay registros de historia clínica para este paciente.</p>
                                ) : (
                                    Object.entries(groups).map(([key, group]) => {
                                        const allSelectedInGroup = group.items.every(h => selectedHistoriaItems.find(i => i.id === h.id));
                                        const someSelectedInGroup = group.items.some(h => selectedHistoriaItems.find(i => i.id === h.id));

                                        const toggleGroupAll = () => {
                                            if (allSelectedInGroup) {
                                                // Deselect all in group
                                                setSelectedHistoriaItems(prev => prev.filter(i => !group.items.find(h => h.id === i.id)));
                                            } else {
                                                // Select all in group (add missing ones)
                                                const toAdd = group.items.filter(h => !selectedHistoriaItems.find(i => i.id === h.id));
                                                setSelectedHistoriaItems(prev => [...prev, ...toAdd]);
                                            }
                                        };

                                        return (
                                            <div key={key} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                                {/* Plan Header */}
                                                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-700/60 border-b border-gray-200 dark:border-gray-700">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2.5 h-2.5 rounded-full ${key === 'sin-plan' ? 'bg-gray-400' : 'bg-teal-500'}`} />
                                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                                                            {group.label}
                                                        </span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            ({group.items.length} registro{group.items.length !== 1 ? 's' : ''})
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={toggleGroupAll}
                                                        className={`text-xs font-semibold px-3 py-1 rounded-lg transition-colors ${
                                                            allSelectedInGroup
                                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 hover:bg-blue-200'
                                                                : someSelectedInGroup
                                                                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300 hover:bg-indigo-100'
                                                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        {allSelectedInGroup ? '✓ Todos seleccionados' : 'Seleccionar todos'}
                                                    </button>
                                                </div>

                                                {/* Items in group */}
                                                <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                                    {group.items.map(h => {
                                                        const isSelected = Boolean(selectedHistoriaItems.find(i => i.id === h.id));
                                                        return (
                                                            <div
                                                                key={h.id}
                                                                onClick={() => toggleHistoriaSelection(h)}
                                                                className={`px-4 py-2.5 flex items-start gap-3 cursor-pointer transition-all ${
                                                                    isSelected
                                                                        ? 'bg-blue-50 dark:bg-blue-900/20'
                                                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/40'
                                                                }`}
                                                            >
                                                                <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                                                                    isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-400 dark:border-gray-500'
                                                                }`}>
                                                                    {isSelected && (
                                                                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/>
                                                                        </svg>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-semibold text-xs text-gray-700 dark:text-gray-200">
                                                                        {formatDate(h.fecha) || 'N/A'}
                                                                        {h.doctor && (
                                                                            <span className="ml-2 font-normal text-gray-500 dark:text-gray-400">
                                                                                · Dr. {h.doctor.paterno || h.doctor.nombre || ''}
                                                                            </span>
                                                                        )}
                                                                    </p>
                                                                    <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                                                                        {h.tratamiento || h.procedimiento || h.descripcion || '-'}
                                                                    </p>
                                                                    <div className="flex gap-3 mt-0.5">
                                                                        {h.pieza && <span className="text-xs text-gray-400 dark:text-gray-500">Elemento Dental: {h.pieza}</span>}
                                                                        {h.observaciones && <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[300px]">Obs: {h.observaciones}</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 rounded-b-xl">
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    {selectedHistoriaItems.length} registro(s) seleccionado(s) &mdash; se insertarán ordenados por fecha
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleInsertHistoria}
                                        disabled={selectedHistoriaItems.length === 0}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow disabled:opacity-50"
                                    >
                                        Insertar Seleccionados
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setShowHistoriaModal(false); setSelectedHistoriaItems([]); }}
                                        className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow"
                                    >
                                        <XCircle size={16} /> Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Modal Añadir Imagen */}
            {showImageModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Añadir Imagen al Informe</h3>
                            <button
                                type="button"
                                onClick={() => { setShowImageModal(false); setSelectedImages([]); setSelectedProforma(null); setImagenesPorProforma([]); }}
                                className="text-gray-400 bg-transparent hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full transition-all cursor-pointer"
                                title="Cerrar"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 bg-white dark:bg-gray-800 space-y-4">
                            {/* Paso 1: seleccionar proforma */}
                            <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                    Paso 1 — Seleccione un Plan / Presupuesto
                                </p>
                                {proformasList.length === 0 ? (
                                    <p className="text-center text-gray-400 py-4 text-sm">No hay presupuestos registrados para este paciente.</p>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {proformasList.map(p => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => handleSelectProformaForImages(p)}
                                                className={`text-left px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${selectedProforma?.id === p.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 text-gray-700 dark:text-gray-300'}`}
                                            >
                                                Plan #{p.numero || p.id}
                                                {p.descripcion && <span className="block font-normal text-gray-400 truncate">{p.descripcion}</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Paso 2: seleccionar imágenes */}
                            {selectedProforma && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                        Paso 2 — Seleccione imágenes del Plan #{selectedProforma.numero || selectedProforma.id}
                                    </p>
                                    {loadingImagenes ? (
                                        <div className="flex justify-center py-6">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                        </div>
                                    ) : imagenesPorProforma.length === 0 ? (
                                        <p className="text-center text-gray-400 py-4 text-sm">Este plan no tiene imágenes registradas.</p>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            {imagenesPorProforma.map(img => {
                                                const isSelected = Boolean(selectedImages.find(i => i.id === img.id));
                                                const rawRuta = img.url || img.ruta || img.path || img.filename || '';
                                                const baseUrl = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : '';
                                                const imgUrl = rawRuta.startsWith('http') ? rawRuta : `${baseUrl}/uploads/${rawRuta.replace(/^\/?(uploads\/)?/, '')}`;
                                                return (
                                                    <div
                                                        key={img.id}
                                                        onClick={() => toggleImageSelection(img)}
                                                        className={`relative border-2 rounded-xl overflow-hidden cursor-pointer transition-all ${isSelected ? 'border-green-500 shadow-md ring-2 ring-green-400' : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'}`}
                                                    >
                                                        <img src={imgUrl} alt={img.descripcion || 'Imagen'} className="w-full h-28 object-cover" />
                                                        <div className="p-1.5 text-xs truncate bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
                                                            {img.titulo || img.descripcion || 'Imagen Médica'}
                                                        </div>
                                                        {isSelected && (
                                                            <div className="absolute top-1.5 right-1.5 bg-green-500 text-white rounded-full p-0.5 shadow">
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 rounded-b-xl">
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                {selectedImages.length} imagen(es) seleccionada(s)
                            </span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleInsertImages}
                                    disabled={selectedImages.length === 0}
                                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow disabled:opacity-50"
                                >
                                    Insertar Seleccionadas
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowImageModal(false); setSelectedImages([]); setSelectedProforma(null); setImagenesPorProforma([]); }}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {viewingInforme && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 transition-opacity">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                                <FileText className="text-purple-600 dark:text-purple-400" size={20} />
                                <span>{viewingInforme.titulo || 'Informe Odontológico'}</span>
                                <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-2">
                                    ({viewingInforme.fecha ? formatDate(viewingInforme.fecha) : 'N/A'})
                                </span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setViewingInforme(null)}
                                className="text-gray-400 bg-transparent hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full transition-all cursor-pointer"
                                title="Cerrar"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-gray-900">
                            <style>{`
                                .report-view {
                                    color: #1f2937;
                                }
                                .report-view * {
                                    color: inherit;
                                }
                                .dark .report-view,
                                .dark .report-view * {
                                    color: #f3f4f6 !important;
                                }
                                .dark .report-view table {
                                    border-color: #374151 !important;
                                }
                                .dark .report-view td {
                                    border-color: #374151 !important;
                                    color: #e5e7eb !important;
                                }
                                .dark .report-view th {
                                    background-color: #1e293b !important;
                                    color: #60a5fa !important;
                                    border-color: #374151 !important;
                                }
                            `}</style>
                            <div className="report-view text-gray-800 dark:text-gray-100 leading-relaxed text-sm max-w-none" dangerouslySetInnerHTML={{ __html: viewingInforme.contenido }} />
                        </div>

                        <div className="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-2 rounded-b-xl">
                            <button
                                onClick={() => handleSendWhatsApp(viewingInforme)}
                                className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                                Enviar WhatsApp
                            </button>
                            <button
                                onClick={() => handlePrintInforme(viewingInforme)}
                                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                            >
                                <Printer size={15} /> Imprimir
                            </button>
                            <button
                                onClick={() => setViewingInforme(null)}
                                className="px-4 py-2 rounded-xl bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                            >
                                <X size={15} /> Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Modal */}
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Informes Odontológicos"
                sections={manualSections}
            />
        </div>
        </>
    );
};

export default PacienteTabInformes;
