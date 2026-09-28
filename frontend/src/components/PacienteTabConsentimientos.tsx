import React, { useEffect, useState } from 'react';
import api from '../services/api';
import type { Paciente, ConsentimientoPlantilla, ConsentimientoPaciente } from '../types';
import Swal from 'sweetalert2';
import { FileText, Printer, Trash2, CheckCircle2, Eye, Sparkles, Filter, Edit3, Save } from 'lucide-react';
import { formatFullName, cleanConsentimientoHtml } from '../utils/formatters';
import { printHtml } from '../utils/printUtils';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface PacienteTabConsentimientosProps {
    pacienteId: number;
    paciente?: Paciente;
}

const quillModules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'align': '' }, { 'align': 'center' }, { 'align': 'right' }, { 'align': 'justify' }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['clean']
    ],
};

const PacienteTabConsentimientos: React.FC<PacienteTabConsentimientosProps> = ({ pacienteId, paciente: initialPaciente }) => {
    const [paciente, setPaciente] = useState<Paciente | null>(initialPaciente || null);
    const [plantillas, setPlantillas] = useState<ConsentimientoPlantilla[]>([]);
    const [historial, setHistorial] = useState<ConsentimientoPaciente[]>([]);
    const [especialidadesList, setEspecialidadesList] = useState<any[]>([]);
    const [selectedEspecialidad, setSelectedEspecialidad] = useState<string>('all');

    // Form state
    const [selectedPlantillaId, setSelectedPlantillaId] = useState<number | ''>('');
    const [previewContent, setPreviewContent] = useState<string>('');
    const [previewTitle, setPreviewTitle] = useState<string>('');
    const [isEditingPreview, setIsEditingPreview] = useState<boolean>(false);
    const [loading, setLoading] = useState(false);

    // Modal Ver Historial State
    const [viewItem, setViewItem] = useState<ConsentimientoPaciente | null>(null);

    // Modal Editar Historial State
    const [editItem, setEditItem] = useState<ConsentimientoPaciente | null>(null);
    const [editTitle, setEditTitle] = useState<string>('');
    const [editContent, setEditContent] = useState<string>('');
    const [savingEdit, setSavingEdit] = useState<boolean>(false);

    useEffect(() => {
        if (pacienteId) {
            fetchData();
        }
    }, [pacienteId]);

    const fetchData = async () => {
        try {
            const [pacRes, plantillasRes, historialRes, espRes] = await Promise.all([
                api.get(`/pacientes/${pacienteId}`),
                api.get('/consentimientos-plantillas?page=1&limit=9999'),
                api.get(`/consentimientos-pacientes?pacienteId=${pacienteId}`),
                api.get('/especialidad', { params: { limit: 100 } })
            ]);
            setPaciente(pacRes.data);
            const plantillasData = plantillasRes.data?.data || plantillasRes.data || [];
            setPlantillas(plantillasData);
            setHistorial(historialRes.data || []);
            setEspecialidadesList(espRes.data?.data || espRes.data || []);
        } catch (error) {
            console.error('Error fetching consentimientos data:', error);
        }
    };

    // Replace patient placeholders in the template
    const populateTemplate = (templateContent: string, currentPaciente: Paciente | null): string => {
        if (!templateContent) return '';
        let texto = templateContent;
        const nombreCompleto = currentPaciente ? formatFullName(currentPaciente) : '_____________';
        const ci = currentPaciente?.ci ? currentPaciente.ci : '_____________';
        const fechaActual = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const telefono = currentPaciente?.celular || currentPaciente?.telefono || '_____________';

        // Calculate age if birthdate exists
        let edad = '___';
        if (currentPaciente?.fecha_nacimiento) {
            const birthDate = new Date(currentPaciente.fecha_nacimiento);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            if (age >= 0 && !isNaN(age)) {
                edad = `${age} años`;
            }
        }

        // Replace case-insensitive and standard tag variations
        texto = texto.replace(/{{\s*NOMBRE_PACIENTE\s*}}/gi, `<strong>${nombreCompleto}</strong>`);
        texto = texto.replace(/\[\s*NOMBRE_PACIENTE\s*\]/gi, `<strong>${nombreCompleto}</strong>`);
        texto = texto.replace(/{{\s*PACIENTE\s*}}/gi, `<strong>${nombreCompleto}</strong>`);
        texto = texto.replace(/\[\s*PACIENTE\s*\]/gi, `<strong>${nombreCompleto}</strong>`);

        texto = texto.replace(/{{\s*CI_PACIENTE\s*}}/gi, `<strong>${ci}</strong>`);
        texto = texto.replace(/\[\s*CI_PACIENTE\s*\]/gi, `<strong>${ci}</strong>`);
        texto = texto.replace(/{{\s*CI\s*}}/gi, `<strong>${ci}</strong>`);
        texto = texto.replace(/\[\s*CI\s*\]/gi, `<strong>${ci}</strong>`);

        texto = texto.replace(/{{\s*FECHA_ACTUAL\s*}}/gi, `<strong>${fechaActual}</strong>`);
        texto = texto.replace(/\[\s*FECHA_ACTUAL\s*\]/gi, `<strong>${fechaActual}</strong>`);
        texto = texto.replace(/{{\s*FECHA\s*}}/gi, `<strong>${fechaActual}</strong>`);
        texto = texto.replace(/\[\s*FECHA\s*\]/gi, `<strong>${fechaActual}</strong>`);

        texto = texto.replace(/{{\s*EDAD_PACIENTE\s*}}/gi, `<strong>${edad}</strong>`);
        texto = texto.replace(/\[\s*EDAD_PACIENTE\s*\]/gi, `<strong>${edad}</strong>`);
        texto = texto.replace(/{{\s*EDAD\s*}}/gi, `<strong>${edad}</strong>`);

        texto = texto.replace(/{{\s*TELEFONO_PACIENTE\s*}}/gi, `<strong>${telefono}</strong>`);
        texto = texto.replace(/\[\s*TELEFONO_PACIENTE\s*\]/gi, `<strong>${telefono}</strong>`);

        return cleanConsentimientoHtml(texto);
    };

    const handleSelectPlantilla = (plantillaId: number | '') => {
        setSelectedPlantillaId(plantillaId);
        if (!plantillaId) {
            setPreviewContent('');
            setPreviewTitle('');
            setIsEditingPreview(false);
            return;
        }

        const found = plantillas.find(p => p.id === Number(plantillaId));
        if (found) {
            setPreviewTitle(found.titulo);
            const populated = populateTemplate(found.contenido, paciente);
            setPreviewContent(populated);
            setIsEditingPreview(false);
        }
    };

    const printConsentimiento = async (titulo: string, contenidoHTML: string) => {
        let centroDental: any = null;
        try {
            const resCentro = await api.get('/datos-centro');
            if (resCentro.data && resCentro.data.length > 0) {
                centroDental = resCentro.data[0];
            }
        } catch (error) {
            console.error('Error fetching centro dental data:', error);
        }

        const footerParts: string[] = [];
        if (centroDental?.nombre_centro) footerParts.push(centroDental.nombre_centro);
        if (centroDental?.direccion) footerParts.push(`Dirección: ${centroDental.direccion}`);
        if (centroDental?.telefono) footerParts.push(`Tel: ${centroDental.telefono}`);
        if (centroDental?.celular) footerParts.push(`Cel: ${centroDental.celular}`);
        if (centroDental?.emergencias) footerParts.push(`Emergencias: ${centroDental.emergencias}`);
        const footerString = footerParts.join(' | ');

        const cleanedContent = cleanConsentimientoHtml(contenidoHTML);

        const printHtmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <title></title>
    <style>
        @page {
            margin: 15mm 18mm;
            size: portrait;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: Arial, sans-serif;
            font-size: 11pt;
            color: #000;
            padding: 0;
            line-height: 1.6;
            width: 100%;
            word-break: normal;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        .content {
            width: 100%;
            max-width: 100%;
            word-break: normal;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        .content p {
            margin-bottom: 8px;
            min-height: 1.25em;
            word-break: normal;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        .content p:empty::before,
        .content p > br:only-child::before {
            content: "\\00a0";
            display: inline-block;
        }
        .content ul, .content ol {
            margin: 8px 0 12px 24px;
        }
        .content li {
            margin-bottom: 4px;
        }
        .ql-align-center {
            text-align: center !important;
        }
        .ql-align-right {
            text-align: right !important;
        }
        .ql-align-justify {
            text-align: justify !important;
        }
        .ql-align-left {
            text-align: left !important;
        }
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            border-top: 1px solid #ccc;
            padding-top: 4px;
            text-align: center;
            font-size: 8pt;
            color: #555;
        }
        @media print {
            body { padding: 0; }
            .footer { position: fixed; bottom: 0; }
        }
    </style>
</head>
<body>
    <div class="content">${cleanedContent}</div>
    ${footerString ? `<div class="footer">${footerString}</div>` : ''}
</body>
</html>
        `;
        printHtml(printHtmlContent);
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPlantillaId || !paciente || !previewContent) return;

        setLoading(true);

        try {
            const dataToSave = {
                pacienteId: Number(pacienteId),
                titulo: previewTitle || 'Consentimiento Informado',
                contenido_generado: previewContent
            };

            await api.post('/consentimientos-pacientes', dataToSave);
            await printConsentimiento(previewTitle, previewContent);

            await Swal.fire({
                icon: 'success',
                title: '¡Consentimiento Registrado y Emitido!',
                text: 'El consentimiento informado quedó registrado en el historial del paciente.',
                showConfirmButton: false,
                timer: 1800
            });

            setSelectedPlantillaId('');
            setPreviewContent('');
            setPreviewTitle('');
            setIsEditingPreview(false);
            
            const historialRes = await api.get(`/consentimientos-pacientes?pacienteId=${pacienteId}`);
            setHistorial(historialRes.data || []);
        } catch (error) {
            console.error('Error:', error);
            Swal.fire('Error', 'Ocurrió un error al generar el consentimiento', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenEdit = (item: ConsentimientoPaciente) => {
        setEditItem(item);
        setEditTitle(item.titulo || '');
        setEditContent(item.contenido_generado || '');
    };

    const handleSaveEdit = async (andPrint: boolean = false) => {
        if (!editItem) return;
        if (!editTitle.trim()) {
            Swal.fire('Título requerido', 'Por favor ingrese el título del consentimiento', 'warning');
            return;
        }

        try {
            setSavingEdit(true);
            await api.patch(`/consentimientos-pacientes/${editItem.id}`, {
                titulo: editTitle,
                contenido_generado: editContent
            });

            await Swal.fire({
                icon: 'success',
                title: 'Consentimiento Actualizado',
                text: 'Los cambios se guardaron correctamente en el historial.',
                timer: 1500,
                showConfirmButton: false
            });

            if (andPrint) {
                await printConsentimiento(editTitle, editContent);
            }

            setEditItem(null);
            const historialRes = await api.get(`/consentimientos-pacientes?pacienteId=${pacienteId}`);
            setHistorial(historialRes.data || []);
        } catch (error) {
            console.error('Error updating consentimiento:', error);
            Swal.fire('Error', 'No se pudo actualizar el consentimiento', 'error');
        } finally {
            setSavingEdit(false);
        }
    };

    const handleDelete = async (conId: number) => {
        const result = await Swal.fire({
            title: '¿Eliminar del historial?',
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
                await api.delete(`/consentimientos-pacientes/${conId}`);
                await Swal.fire({ icon: 'success', title: '¡Eliminado!', showConfirmButton: false, timer: 1500 });
                const historialRes = await api.get(`/consentimientos-pacientes?pacienteId=${pacienteId}`);
                setHistorial(historialRes.data || []);
            } catch (error) {
                console.error('Error:', error);
                Swal.fire('Error', 'No se pudo eliminar el consentimiento', 'error');
            }
        }
    };

    // Filter plantillas by especialidad
    const filteredPlantillas = plantillas.filter(p => {
        if (selectedEspecialidad === 'all') return true;
        if (selectedEspecialidad === 'none') return !(p as any).especialidadId && !(p as any).especialidad;
        const espId = (p as any).especialidadId || (p as any).especialidad?.id;
        return espId === Number(selectedEspecialidad);
    });

    const nombrePaciente = paciente ? formatFullName(paciente) : 'Cargando...';

    return (
        <div className="space-y-6">
            <style>{`
                .consent-editor .ql-editor {
                    min-height: 240px;
                    font-size: 14px;
                    line-height: 1.6;
                }
                .consent-editor .ql-toolbar.ql-snow {
                    border-radius: 0.75rem 0.75rem 0 0;
                    background: #f8fafc;
                }
                .dark .consent-editor .ql-toolbar.ql-snow {
                    background: #1e293b !important;
                    border-color: #374151 !important;
                }
                .dark .consent-editor .ql-container.ql-snow {
                    border-color: #374151 !important;
                    background: #111827 !important;
                }
                .dark .consent-editor .ql-editor {
                    color: #f9fafb !important;
                }
                .dark .consent-editor .ql-editor.ql-blank::before {
                    color: #9ca3af !important;
                    font-style: italic;
                }
                .dark .consent-editor .ql-stroke {
                    stroke: #ffffff !important;
                }
                .dark .consent-editor .ql-fill {
                    fill: #ffffff !important;
                }
                .dark .consent-editor .ql-picker {
                    color: #ffffff !important;
                }
                .dark .consent-editor .ql-picker-label {
                    color: #ffffff !important;
                }
                .dark .consent-editor .ql-picker-options {
                    background-color: #1e293b !important;
                    border-color: #374151 !important;
                    color: #ffffff !important;
                }
                .dark .consent-editor .ql-picker-item {
                    color: #ffffff !important;
                }
            `}</style>
            {/* Header del Tab */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-200 dark:border-gray-700 gap-4 mb-2">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <FileText className="text-blue-500" size={22} />
                        <span>Consentimientos Informados del Paciente</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                        Emisión, edición y registro histórico de consentimientos informados firmados por {nombrePaciente}
                    </p>
                </div>
            </div>

            {/* Formulario de selección y generación */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                <h4 className="font-bold text-gray-800 dark:text-white text-base flex items-center gap-2">
                    <Sparkles className="text-amber-500" size={18} />
                    Emitir Nuevo Consentimiento Informado
                </h4>

                <form onSubmit={handleGenerate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Filtro de Especialidad */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase flex items-center gap-1.5">
                                <Filter size={14} className="text-teal-600" />
                                Filtrar por Especialidad
                            </label>
                            <select
                                value={selectedEspecialidad}
                                onChange={e => {
                                    setSelectedEspecialidad(e.target.value);
                                    setSelectedPlantillaId('');
                                    setPreviewContent('');
                                }}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            >
                                <option value="all">Todas las Especialidades</option>
                                <option value="none">General / Sin Especialidad</option>
                                {especialidadesList.map(esp => (
                                    <option key={esp.id} value={esp.id}>{esp.especialidad}</option>
                                ))}
                            </select>
                        </div>

                        {/* Seleccionar Plantilla */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">
                                Seleccionar Consentimiento Word / Plantilla <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedPlantillaId}
                                onChange={e => handleSelectPlantilla(e.target.value ? Number(e.target.value) : '')}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium"
                                required
                            >
                                <option value="">-- Seleccionar Consentimiento --</option>
                                {filteredPlantillas.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {(p as any).especialidad?.especialidad ? `[${(p as any).especialidad.especialidad}] ` : ''}{p.titulo}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Previsualización del Consentimiento con datos del Paciente */}
                    {selectedPlantillaId && (
                        <div className="mt-4 p-5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-900/10 space-y-3">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-blue-200/60 dark:border-blue-800/60 pb-3">
                                <div>
                                    <h5 className="font-bold text-sm text-gray-800 dark:text-white flex items-center gap-2">
                                        <FileText size={16} className="text-blue-600 dark:text-blue-400" />
                                        <span>Vista Previa con datos de: <span className="text-blue-600 dark:text-blue-400">{nombrePaciente}</span> (CI: {paciente?.ci || 'S/N'})</span>
                                    </h5>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        Los datos del paciente y la fecha actual se han completado automáticamente.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsEditingPreview(!isEditingPreview)}
                                    className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-1.5 shadow-sm transition-all"
                                >
                                    <Edit3 size={14} />
                                    {isEditingPreview ? 'Ver Vista de Lectura' : 'Personalizar Texto'}
                                </button>
                            </div>

                            {/* Título editable */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                    Título del Documento a Emitir:
                                </label>
                                <input
                                    type="text"
                                    value={previewTitle}
                                    onChange={e => setPreviewTitle(e.target.value)}
                                    className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium"
                                />
                            </div>

                            {/* Editor or Preview Content */}
                            {isEditingPreview ? (
                                <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600">
                                    <ReactQuill
                                        theme="snow"
                                        value={previewContent}
                                        onChange={setPreviewContent}
                                        modules={quillModules}
                                        className="h-64 mb-12 dark:text-white"
                                    />
                                </div>
                            ) : (
                                <div className="p-4 bg-white dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 max-h-72 overflow-y-auto">
                                    <div
                                        className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed text-sm"
                                        dangerouslySetInnerHTML={{ __html: previewContent }}
                                    />
                                </div>
                            )}

                            {/* Botón de Generar */}
                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={loading || !selectedPlantillaId}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transform hover:-translate-y-0.5 transition-all shadow-md disabled:opacity-50 text-sm cursor-pointer"
                                >
                                    {loading ? (
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <CheckCircle2 size={18} />
                                    )}
                                    {loading ? 'Registrando e Imprimiendo...' : 'Generar, Registrar e Imprimir Consentimiento'}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>

            {/* History Table */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <h4 className="font-bold text-gray-800 dark:text-white text-base mb-4 flex items-center gap-2">
                    <Printer size={18} className="text-purple-600" />
                    Historial de Consentimientos Informados Emitidos
                </h4>

                <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider border-b border-gray-100 dark:border-gray-700">
                                <th className="py-4 px-6 font-semibold">Fecha de Emisión</th>
                                <th className="py-4 px-6 font-semibold">Título del Consentimiento</th>
                                <th className="py-4 px-6 font-semibold text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50 text-sm">
                            {historial.length > 0 ? (
                                historial.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-all text-gray-800 dark:text-gray-200">
                                        <td className="py-4 px-6 font-medium text-gray-700 dark:text-gray-300">
                                            {item.fecha ? new Date(item.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                        </td>
                                        <td className="py-4 px-6 font-bold text-gray-800 dark:text-white">
                                            <div className="flex items-center gap-2">
                                                <FileText className="text-blue-500 flex-shrink-0" size={16} />
                                                <span>{item.titulo}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {/* 1. Ver */}
                                                <button
                                                    onClick={() => setViewItem(item)}
                                                    className="bg-teal-600 hover:bg-teal-700 text-white p-2 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
                                                    title="Ver Consentimiento Emitido"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                    </svg>
                                                </button>

                                                {/* 2. Imprimir */}
                                                <button
                                                    onClick={() => printConsentimiento(item.titulo, item.contenido_generado || '')}
                                                    className="p-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center cursor-pointer"
                                                    title="Imprimir Consentimiento"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                    </svg>
                                                </button>

                                                {/* 3. Editar */}
                                                <button
                                                    onClick={() => handleOpenEdit(item)}
                                                    className="p-2 bg-amber-400 hover:bg-amber-500 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
                                                    title="Editar Consentimiento Emitido"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                    </svg>
                                                </button>

                                                {/* 4. Eliminar */}
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="bg-[#dc3545] hover:bg-red-700 text-white p-2 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
                                                    title="Eliminar del Historial"
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
                                    <td colSpan={3} className="py-8 text-center text-gray-400 italic">
                                        No se han emitido consentimientos informados para este paciente aún.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Editar Consentimiento Emitido */}
            {editItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200 dark:border-gray-700 max-h-[92vh] flex flex-col">
                        {/* Header */}
                        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-amber-50/60 dark:bg-amber-950/20 rounded-t-2xl">
                            <div className="flex items-center gap-3">
                                <span className="p-2 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-xl shadow-sm">
                                    <Edit3 size={20} />
                                </span>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                                        Editar Consentimiento Informado Emitido
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Modifique el título o contenido emitido para {nombrePaciente}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditItem(null)}
                                className="text-gray-400 hover:text-red-500 p-1.5 rounded-full transition-colors"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-5 overflow-y-auto flex-grow space-y-4">
                            <style>{`
                                .consent-editor .ql-editor {
                                    min-height: 240px;
                                    font-size: 14px;
                                    line-height: 1.6;
                                }
                                .consent-editor .ql-toolbar.ql-snow {
                                    border-radius: 0.75rem 0.75rem 0 0;
                                    background: #f8fafc;
                                }
                                .dark .consent-editor .ql-toolbar.ql-snow {
                                    background: #1e293b !important;
                                    border-color: #374151 !important;
                                }
                                .dark .consent-editor .ql-container.ql-snow {
                                    border-color: #374151 !important;
                                    background: #111827 !important;
                                }
                                .dark .consent-editor .ql-editor {
                                    color: #f9fafb !important;
                                }
                                .dark .consent-editor .ql-editor.ql-blank::before {
                                    color: #9ca3af !important;
                                    font-style: italic;
                                }
                                .dark .consent-editor .ql-stroke {
                                    stroke: #ffffff !important;
                                }
                                .dark .consent-editor .ql-fill {
                                    fill: #ffffff !important;
                                }
                                .dark .consent-editor .ql-picker {
                                    color: #ffffff !important;
                                }
                                .dark .consent-editor .ql-picker-label {
                                    color: #ffffff !important;
                                }
                                .dark .consent-editor .ql-picker-options {
                                    background-color: #1e293b !important;
                                    border-color: #374151 !important;
                                    color: #ffffff !important;
                                }
                                .dark .consent-editor .ql-picker-item {
                                    color: #ffffff !important;
                                }
                            `}</style>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1.5">
                                    Título del Documento: <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={e => setEditTitle(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Título del consentimiento..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1.5">
                                    Contenido del Documento Emitido: <span className="text-red-500">*</span>
                                </label>
                                <div className="consent-editor bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600">
                                    <ReactQuill
                                        theme="snow"
                                        value={editContent}
                                        onChange={setEditContent}
                                        modules={quillModules}
                                        className="h-64 mb-12 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-wrap justify-start items-center gap-3 rounded-b-2xl">
                            <button
                                type="button"
                                onClick={() => handleSaveEdit(false)}
                                disabled={savingEdit}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-xl flex items-center gap-2 transform hover:-translate-y-0.5 transition-all shadow-md disabled:opacity-50 text-sm"
                            >
                                {savingEdit ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <CheckCircle2 size={18} />
                                )}
                                {savingEdit ? 'Guardando...' : 'Guardar Cambios'}
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSaveEdit(true)}
                                disabled={savingEdit}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-5 rounded-xl flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 text-sm disabled:opacity-50"
                            >
                                <Printer size={18} /> Guardar e Imprimir
                            </button>

                            <button
                                type="button"
                                onClick={() => setEditItem(null)}
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

            {/* Modal Ver Consentimiento Emitido */}
            {viewItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full border border-gray-200 dark:border-gray-700 max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-t-2xl">
                            <div>
                                <h3 className="text-xl font-extrabold text-gray-800 dark:text-white flex items-center gap-2">
                                    <FileText className="text-blue-500" size={20} />
                                    {viewItem.titulo}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                                    Emitido el: {viewItem.fecha ? new Date(viewItem.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewItem(null)}
                                className="text-gray-400 hover:text-red-500 p-1.5 rounded-full"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        {/* Body */}
                        <div className="p-6 overflow-y-auto flex-grow">
                            <div
                                className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed text-sm"
                                dangerouslySetInnerHTML={{ __html: viewItem.contenido_generado || '<p class="text-gray-400 italic">Sin contenido</p>' }}
                            />
                        </div>
                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 rounded-b-2xl flex justify-between items-center">
                            <button
                                onClick={() => printConsentimiento(viewItem.titulo, viewItem.contenido_generado || '')}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 text-sm"
                            >
                                <Printer size={16} /> Imprimir
                            </button>
                            <button
                                onClick={() => setViewItem(null)}
                                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-semibold py-2 px-6 rounded-lg flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 text-sm"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PacienteTabConsentimientos;
