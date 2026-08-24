import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Printer, Search, Calendar, FileText, Eye, Edit, Image as ImageIcon, XCircle, User } from 'lucide-react';
import api from '../services/api';
import Swal from 'sweetalert2';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import Pagination from './Pagination';
import ManualModal, { type ManualSection } from './ManualModal';
import { getLocalDateString, formatDate } from '../utils/dateUtils';
import { formatPaternoMaternoNombre } from '../utils/formatters';

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
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'align': [] }],
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
            const res = await api.get('/doctors?limit=1000');
            const docs = res.data?.data || res.data || [];
            setDoctores(Array.isArray(docs) ? docs : []);
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
        const headerRow = `<tr><td style="padding:8px;border:1px solid #94a3b8;font-weight:bold;">Fecha</td><td style="padding:8px;border:1px solid #94a3b8;font-weight:bold;">Tratamiento / Procedimiento</td><td style="padding:8px;border:1px solid #94a3b8;font-weight:bold;">Pieza</td><td style="padding:8px;border:1px solid #94a3b8;font-weight:bold;">Observaciones</td></tr>`;

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
            const payload = {
                pacienteId: Number(pacienteId),
                doctorId: Number(doctorId),
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

    const handlePrintInforme = (informe: any) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const nombrePaciente = paciente ? formatPaternoMaternoNombre(paciente) : 'Paciente';

        let doctorNombreFirma = 'FIRMA DEL PROFESIONAL ODONTÓLOGO';
        let doctorEspecialidadFirma = 'Profesional Odontólogo';

        if (informe.doctor) {
            const docPaterno = informe.doctor.paterno || '';
            const docMaterno = informe.doctor.materno || '';
            const docNombre = informe.doctor.nombre || '';
            doctorNombreFirma = `DR. ${docPaterno} ${docMaterno} ${docNombre}`.replace(/\s+/g, ' ').trim().toUpperCase();
            if (informe.doctor.especialidad?.especialidad) {
                doctorEspecialidadFirma = `Odontólogo - ${informe.doctor.especialidad.especialidad}`;
            }
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${informe.titulo || 'Informe Odontológico'}</title>
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1f2937; line-height: 1.6; }
                    .header { text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 20px; margin-bottom: 30px; }
                    .header h1 { color: #0f766e; margin: 0; font-size: 24px; text-transform: uppercase; }
                    .header p { color: #6b7280; font-size: 14px; margin-top: 5px; }
                    .info-box { background-color: #f0fdfa; border-left: 4px solid #0d9488; padding: 15px; margin-bottom: 30px; border-radius: 4px; }
                    .info-box p { margin: 4px 0; font-size: 14px; }
                    .content { font-size: 15px; margin-bottom: 60px; min-height: 250px; }
                    .content table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    .content th, .content td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
                    .content th { background-color: #102a6b; color: #ffffff; }
                    .content img { max-width: 350px; height: auto; border-radius: 6px; margin: 10px; }
                    .signature-line { margin-top: 80px; text-align: center; }
                    .signature-box { display: inline-block; border-top: 1px solid #374151; width: 280px; padding-top: 6px; text-align: center; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${informe.titulo || 'INFORME ODONTOLÓGICO'}</h1>
                    <p>Documento de Consulta e Historial Clínico</p>
                </div>
                <div class="info-box">
                    <p><strong>Paciente:</strong> ${nombrePaciente}</p>
                    <p><strong>Doctor Tratante:</strong> ${informe.doctor ? `${informe.doctor.paterno} ${informe.doctor.materno || ''} ${informe.doctor.nombre}`.replace(/\s+/g, ' ').trim() : 'No asignado'}</p>
                    <p><strong>Fecha del Informe:</strong> ${informe.fecha || getLocalDateString()}</p>
                </div>
                <div class="content">
                    ${informe.contenido}
                </div>
                <div class="signature-line">
                    <div class="signature-box">
                        <div style="font-weight: bold; font-size: 13px; color: #111827;">${doctorNombreFirma}</div>
                        <div style="font-size: 11px; color: #4b5563; margin-top: 2px;">${doctorEspecialidadFirma}</div>
                    </div>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
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
                            <th className="py-3 px-5 font-semibold">Fecha</th>
                            <th className="py-3 px-5 font-semibold">Título del Informe</th>
                            <th className="py-3 px-5 font-semibold">Doctor</th>
                            <th className="py-3 px-5 font-semibold">Resumen</th>
                            <th className="py-3 px-5 font-semibold text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50 text-xs text-gray-800 dark:text-gray-200">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-gray-400">Cargando informes...</td>
                            </tr>
                        ) : paginatedInformes.length > 0 ? (
                            paginatedInformes.map((inf) => (
                                <tr key={inf.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-all">
                                    <td className="py-3.5 px-5 font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                                        <Calendar size={14} /> {inf.fecha || 'N/A'}
                                    </td>
                                    <td className="py-3.5 px-5 font-bold">{inf.titulo || 'Informe Odontológico'}</td>
                                    <td className="py-3.5 px-5 font-medium text-gray-700 dark:text-gray-300">
                                        {inf.doctor ? `Dr. ${inf.doctor.paterno} ${inf.doctor.materno || ''} ${inf.doctor.nombre}` : '-'}
                                    </td>
                                    <td className="py-3.5 px-5 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                        {stripHtmlTags(inf.contenido)}
                                    </td>
                                    <td className="py-3.5 px-5 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => setViewingInforme(inf)}
                                                className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg"
                                                title="Ver Informe"
                                            >
                                                <Eye size={15} />
                                            </button>
                                            <button
                                                onClick={() => handlePrintInforme(inf)}
                                                className="p-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 rounded-lg"
                                                title="Imprimir Informe"
                                            >
                                                <Printer size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleOpenEdit(inf)}
                                                className="bg-[#ffc107] hover:bg-yellow-600 text-white p-2 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
                                                title="Editar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteInforme(inf.id)}
                                                className="bg-[#dc3545] hover:bg-red-700 text-white p-2 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
                                                title="Eliminar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
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
                                onClick={() => setEditingInforme(null)}
                                className="text-gray-400 bg-transparent hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full transition-all"
                                title="Cerrar"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                </svg>
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
                                                        Dr. {doc.paterno} {doc.materno || ''} {doc.nombre} {doc.especialidad ? `(${doc.especialidad.especialidad})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Contenido del Informe <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex gap-2">
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
                                    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600">
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
                                onClick={() => setIsFormOpen(false)}
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
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Seleccionar Registro de Historia Clínica</h3>
                                {selectedHistoriaItems.length > 0 && (
                                    <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full font-semibold">
                                        {selectedHistoriaItems.length} seleccionado(s)
                                    </span>
                                )}
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
                                                                        {h.pieza && <span className="text-xs text-gray-400 dark:text-gray-500">Pieza: {h.pieza}</span>}
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
                        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                                <FileText className="text-purple-600" size={20} />
                                {viewingInforme.titulo || 'Informe Odontológico'}
                                <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-2">
                                    ({viewingInforme.fecha})
                                </span>
                            </h3>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-gray-900">
                            <div className="report-view prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: viewingInforme.contenido }} />
                        </div>

                        <div className="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-2 rounded-b-xl">
                            <button
                                onClick={() => handlePrintInforme(viewingInforme)}
                                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
                            >
                                <Printer size={14} /> Imprimir
                            </button>
                            <button
                                onClick={() => setViewingInforme(null)}
                                className="px-4 py-2 rounded-xl bg-gray-500 hover:bg-gray-600 text-white text-xs font-semibold shadow"
                            >
                                Cerrar
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
