import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import mammoth from 'mammoth';
import { FileUp, FileText, CheckCircle2, Sparkles } from 'lucide-react';
import { cleanConsentimientoHtml } from '../utils/formatters';

interface ConsentimientosPlantillaFormProps {
    isOpen: boolean;
    id: number | null;
    onClose: () => void;
    onSaved: () => void;
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

const ConsentimientosPlantillaForm: React.FC<ConsentimientosPlantillaFormProps> = ({ isOpen, id, onClose, onSaved }) => {
    const [titulo, setTitulo] = useState('');
    const [especialidadId, setEspecialidadId] = useState<number | ''>('');
    const [contenido, setContenido] = useState('');
    const [loading, setLoading] = useState(false);
    const [isProcessingWord, setIsProcessingWord] = useState(false);
    const [especialidadesList, setEspecialidadesList] = useState<any[]>([]);
    const [wordFileName, setWordFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const quillRef = useRef<any>(null);

    const fetchEspecialidades = async () => {
        try {
            const response = await api.get('/especialidad', { params: { limit: 100 } });
            setEspecialidadesList(response.data.data || response.data || []);
        } catch (error) {
            console.error('Error fetching especialidades:', error);
        }
    };

    useEffect(() => {
        fetchEspecialidades();
    }, []);

    useEffect(() => {
        if (isOpen) {
            setWordFileName(null);
            if (id) {
                fetchPlantilla();
            } else {
                setTitulo('');
                setEspecialidadId('');
                setContenido('');
            }
        }
    }, [id, isOpen]);

    const fetchPlantilla = async () => {
        try {
            const response = await api.get(`/consentimientos-plantillas/${id}`);
            setTitulo(response.data.titulo);
            setEspecialidadId(response.data.especialidadId || response.data.especialidad?.id || '');
            setContenido(response.data.contenido);
        } catch (error) {
            console.error('Error fetching plantilla:', error);
            Swal.fire('Error', 'No se pudo cargar la plantilla', 'error');
        }
    };

    const handleWordUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.docx')) {
            Swal.fire('Formato no soportado', 'Por favor seleccione un archivo Word con formato .docx', 'warning');
            return;
        }

        try {
            setIsProcessingWord(true);
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.convertToHtml({ arrayBuffer });
            
            let html = result.value;
            
            if (!html || html.trim() === '') {
                Swal.fire('Archivo vacío', 'No se pudo extraer texto del archivo Word seleccionado', 'warning');
                return;
            }

            // Ensure empty paragraphs from Word are preserved as visible blank lines and clean isolated hyphens/broken lines
            html = cleanConsentimientoHtml(html.replace(/<p>\s*<\/p>/gi, '<p><br></p>'));

            setContenido(html);
            setWordFileName(file.name);

            // If titulo is empty, auto-populate with file name without extension
            if (!titulo.trim()) {
                const autoTitle = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
                setTitulo(autoTitle);
            }

            Swal.fire({
                icon: 'success',
                title: 'Documento Word Cargado',
                text: `Se importó exitosamente el contenido de "${file.name}". Puede revisarlo y editarlo en el editor.`,
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Error parsing docx with mammoth:', error);
            Swal.fire('Error al procesar Word', 'Hubo un error al leer el archivo .docx. Verifique que el archivo no esté dañado.', 'error');
        } finally {
            setIsProcessingWord(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const insertVariable = (variableTag: string) => {
        const editor = quillRef.current?.getEditor();
        if (editor) {
            const range = editor.getSelection(true);
            const index = (range && typeof range.index === 'number') ? range.index : editor.getLength();
            editor.insertText(index, ` ${variableTag} `);
            editor.setSelection(index + variableTag.length + 2, 0);
            setContenido(editor.root.innerHTML);
        } else {
            setContenido(prev => `${prev} ${variableTag} `);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanedContent = cleanConsentimientoHtml(contenido);
        if (!cleanedContent || cleanedContent.trim() === '' || cleanedContent === '<p><br></p>') {
            Swal.fire('Contenido requerido', 'Por favor cargue un archivo Word o redacte el contenido del consentimiento', 'warning');
            return;
        }

        setLoading(true);

        const data = { titulo, especialidadId: especialidadId === '' ? null : Number(especialidadId), contenido: cleanedContent };

        try {
            if (id) {
                await api.patch(`/consentimientos-plantillas/${id}`, data);
                await Swal.fire({ icon: 'success', title: 'Consentimiento Actualizado', text: 'Consentimiento informado actualizado exitosamente', timer: 1500, showConfirmButton: false });
            } else {
                await api.post('/consentimientos-plantillas', data);
                await Swal.fire({ icon: 'success', title: 'Consentimiento Creado', text: 'Consentimiento informado creado exitosamente', timer: 1500, showConfirmButton: false });
            }
            onSaved();
            onClose();
        } catch (error) {
            console.error('Error:', error);
            Swal.fire('Error', 'No se pudo guardar la plantilla', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[94vh] border border-gray-100 dark:border-gray-700">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-gray-800 dark:to-gray-800">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <span className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-xl text-blue-600 dark:text-blue-300 shadow-sm">
                            <FileText className="h-5 w-5" />
                        </span>
                        {id ? 'Editar Plantilla de Consentimiento' : 'Nueva Plantilla de Consentimiento Informado'}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
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
                    <style>{`
                        .consent-editor .ql-editor {
                            min-height: 260px;
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

                    {/* Banner para Cargar Documento Word */}
                    <div className="p-4 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700/60 bg-blue-50/40 dark:bg-blue-900/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md flex-shrink-0">
                                <FileUp className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    Cargar Consentimiento desde Archivo Word (.docx)
                                    {wordFileName && (
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                                            <CheckCircle2 size={12} /> {wordFileName}
                                        </span>
                                    )}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    Si ya tiene el consentimiento diseñado en Microsoft Word (.docx), cárguelo aquí para importar su formato y texto automáticamente.
                                </p>
                            </div>
                        </div>
                        <div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleWordUpload}
                                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                className="hidden"
                                id="word-upload-input"
                            />
                            <label
                                htmlFor="word-upload-input"
                                className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-md transition-all transform hover:-translate-y-0.5 whitespace-nowrap ${isProcessingWord ? 'opacity-70 pointer-events-none' : ''}`}
                            >
                                <FileUp size={16} />
                                {isProcessingWord ? 'Importando Word...' : 'Seleccionar Archivo Word (.docx)'}
                            </label>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} id="plantilla-form" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Título */}
                            <div>
                                <label className="block mb-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                                    Título de la Plantilla: <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        value={titulo}
                                        onChange={(e) => setTitulo(e.target.value)}
                                        placeholder="Ej: Consentimiento para Cirugía de Terceros Molares..."
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition duration-200 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Especialidad */}
                            <div>
                                <label className="block mb-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                                    Especialidad Odontológica / Médica
                                </label>
                                <select
                                    value={especialidadId}
                                    onChange={(e) => setEspecialidadId(e.target.value === '' ? '' : Number(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition duration-200 text-sm"
                                >
                                    <option value="">General / Todas las especialidades</option>
                                    {especialidadesList.map((esp) => (
                                        <option key={esp.id} value={esp.id}>{esp.especialidad}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Variables dinámicas para insertar */}
                        <div className="p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1">
                                <Sparkles size={14} className="text-amber-500" />
                                Variables automáticas (Clic para insertar en el texto):
                            </span>
                            <button
                                type="button"
                                onClick={() => insertVariable('{{NOMBRE_PACIENTE}}')}
                                className="px-2.5 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-lg transition-colors"
                                title="Inserta el nombre completo del paciente"
                            >
                                + {`{{NOMBRE_PACIENTE}}`}
                            </button>
                            <button
                                type="button"
                                onClick={() => insertVariable('{{CI_PACIENTE}}')}
                                className="px-2.5 py-1 bg-green-100 hover:bg-green-200 dark:bg-green-900/50 dark:hover:bg-green-800 text-green-700 dark:text-green-300 text-xs font-semibold rounded-lg transition-colors"
                                title="Inserta el número de Carnet de Identidad del paciente"
                            >
                                + {`{{CI_PACIENTE}}`}
                            </button>
                            <button
                                type="button"
                                onClick={() => insertVariable('{{FECHA_ACTUAL}}')}
                                className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/50 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-lg transition-colors"
                                title="Inserta la fecha actual de emisión"
                            >
                                + {`{{FECHA_ACTUAL}}`}
                            </button>
                            <button
                                type="button"
                                onClick={() => insertVariable('{{EDAD_PACIENTE}}')}
                                className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 dark:hover:bg-amber-800 text-amber-700 dark:text-amber-300 text-xs font-semibold rounded-lg transition-colors"
                                title="Inserta la edad del paciente"
                            >
                                + {`{{EDAD_PACIENTE}}`}
                            </button>
                            <button
                                type="button"
                                onClick={() => insertVariable('{{TELEFONO_PACIENTE}}')}
                                className="px-2.5 py-1 bg-teal-100 hover:bg-teal-200 dark:bg-teal-900/50 dark:hover:bg-teal-800 text-teal-700 dark:text-teal-300 text-xs font-semibold rounded-lg transition-colors"
                                title="Inserta el teléfono / celular del paciente"
                            >
                                + {`{{TELEFONO_PACIENTE}}`}
                            </button>
                        </div>

                        {/* Contenido con ReactQuill */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">
                                Contenido del Consentimiento: <span className="text-red-500">*</span>
                            </label>
                            <div className="consent-editor bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600">
                                <ReactQuill
                                    ref={quillRef}
                                    theme="snow"
                                    value={contenido}
                                    onChange={setContenido}
                                    modules={quillModules}
                                    className="h-72 mb-12 dark:text-white"
                                    placeholder="Redacte o importe desde Word el texto del consentimiento informado..."
                                />
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-start gap-3 rounded-b-2xl">
                    <button
                        type="submit"
                        form="plantilla-form"
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-xl flex items-center gap-2 transform hover:-translate-y-0.5 transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                    >
                        {loading ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <CheckCircle2 size={18} />
                        )}
                        {loading ? 'Guardando...' : (id ? 'Actualizar Plantilla' : 'Guardar Plantilla')}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
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
    );
};

export default ConsentimientosPlantillaForm;
