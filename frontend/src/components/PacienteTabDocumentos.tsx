import React, { useState, useEffect } from 'react';
import { FileText, Download, Upload, Trash2, Edit, Search, Plus, Save, X } from 'lucide-react';
import api from '../services/api';
import Swal from 'sweetalert2';
import type { DocumentoGeneral, PacienteDocumento } from '../types';
import { formatDate, getLocalDateString } from '../utils/dateUtils';
import { formatPaternoMaternoNombre } from '../utils/formatters';
import Pagination from './Pagination';
import ManualModal, { type ManualSection } from './ManualModal';

interface PacienteTabDocumentosProps {
    pacienteId: number;
    paciente?: any;
}

const PacienteTabDocumentos: React.FC<PacienteTabDocumentosProps> = ({ pacienteId, paciente: initialPaciente }) => {
    const [paciente, setPaciente] = useState<any>(initialPaciente || null);
    const [plantillas, setPlantillas] = useState<DocumentoGeneral[]>([]);
    const [documentosPaciente, setDocumentosPaciente] = useState<PacienteDocumento[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showManual, setShowManual] = useState(false);
    const limit = 10;

    // Modal state for uploading / editing patient document
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDoc, setEditingDoc] = useState<PacienteDocumento | null>(null);
    const [docTitulo, setDocTitulo] = useState('');
    const [docDescripcion, setDocDescripcion] = useState('');
    const [docFecha, setDocFecha] = useState(getLocalDateString());
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Gestión de Documentos Word',
            content: 'Este módulo permite descargar plantillas Word oficiales de la clínica, completarlas o modificarlas en su computadora con los datos del paciente y volverlas a subir para archivarlas de forma organizada en el expediente médico digital.'
        },
        {
            title: 'Descarga y Edición de Plantillas',
            content: 'En la sección "Plantillas Word Disponibles", haga clic en "Descargar Word" sobre la plantilla deseada. El archivo se guardará en su equipo para que pueda abrirlo y editarlo libremente en Microsoft Word.'
        },
        {
            title: 'Subir Documento al Expediente',
            content: 'Haga clic en el botón verde "Subir Documento". Ingrese el título del documento, la fecha correspondiente, observaciones opcionales y adjunte el archivo Word (.docx, .doc) o PDF modificado.'
        },
        {
            title: 'Historial y Acciones',
            content: 'En "Documentos Guardados en el Expediente" se encuentra el listado paginado (de 10 en 10) de todos los documentos archivados para este paciente. Desde la columna "Acciones" podrá descargar el archivo en cualquier momento, editar su título/descripción o eliminarlo si fuera necesario.'
        }
    ];

    useEffect(() => {
        loadData();
    }, [pacienteId]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [pacRes, plantillasRes, docPacRes] = await Promise.all([
                api.get(`/pacientes/${pacienteId}`),
                api.get('/documentos-generales?page=1&limit=1000&estado=activo'),
                api.get(`/paciente-documentos?pacienteId=${pacienteId}`),
            ]);

            setPaciente(pacRes.data);
            setPlantillas(plantillasRes.data?.data || plantillasRes.data || []);
            setDocumentosPaciente(Array.isArray(docPacRes.data) ? docPacRes.data : []);
        } catch (error) {
            console.error('Error cargando documentos del paciente:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadPlantilla = (plantilla: DocumentoGeneral) => {
        const baseUrl = api.defaults.baseURL || '';
        const url = `${baseUrl}/documentos-generales/${plantilla.id}/download`;
        window.open(url, '_blank');
    };

    const handleDownloadPacienteDoc = (doc: PacienteDocumento) => {
        const baseUrl = api.defaults.baseURL || '';
        const url = `${baseUrl}/paciente-documentos/${doc.id}/download`;
        window.open(url, '_blank');
    };

    const openNewModal = (defaultPlantilla?: DocumentoGeneral) => {
        setEditingDoc(null);
        setDocTitulo(defaultPlantilla ? `${defaultPlantilla.nombre} - ${paciente?.nombre || ''} ${paciente?.paterno || ''}`.trim() : '');
        setDocDescripcion(defaultPlantilla?.descripcion || '');
        setDocFecha(getLocalDateString());
        setFileToUpload(null);
        setIsModalOpen(true);
    };

    const openEditModal = (doc: PacienteDocumento) => {
        setEditingDoc(doc);
        setDocTitulo(doc.titulo);
        setDocDescripcion(doc.descripcion || '');
        setDocFecha(doc.fecha ? getLocalDateString(doc.fecha) : getLocalDateString());
        setFileToUpload(null);
        setIsModalOpen(true);
    };

    const handleSubmitModal = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!docTitulo.trim()) {
            Swal.fire('Atención', 'Ingrese el título del documento', 'warning');
            return;
        }

        if (!editingDoc && !fileToUpload) {
            Swal.fire('Atención', 'Debe seleccionar el archivo Word o documento modificado', 'warning');
            return;
        }

        try {
            setIsSaving(true);
            const formData = new FormData();
            formData.append('pacienteId', pacienteId.toString());
            formData.append('titulo', docTitulo.trim());
            formData.append('descripcion', docDescripcion.trim());
            formData.append('fecha', docFecha);
            if (fileToUpload) {
                formData.append('file', fileToUpload);
            }

            if (editingDoc) {
                await api.patch(`/paciente-documentos/${editingDoc.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                await Swal.fire({
                    icon: 'success',
                    title: 'Documento Actualizado',
                    timer: 1500,
                    showConfirmButton: false,
                });
            } else {
                await api.post('/paciente-documentos', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                await Swal.fire({
                    icon: 'success',
                    title: 'Documento Subido',
                    text: 'El documento fue guardado en el expediente del paciente.',
                    timer: 1500,
                    showConfirmButton: false,
                });
            }

            setIsModalOpen(false);
            loadData();
        } catch (error: any) {
            console.error('Error guardando documento:', error);
            const msg = error.response?.data?.message || 'Error al guardar el documento';
            Swal.fire('Error', Array.isArray(msg) ? msg.join(', ') : msg, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteDoc = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Eliminar documento del paciente?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/paciente-documentos/${id}`);
                await Swal.fire({
                    icon: 'success',
                    title: '¡Eliminado!',
                    showConfirmButton: false,
                    timer: 1500,
                });
                loadData();
            } catch (error) {
                console.error('Error eliminando documento:', error);
                Swal.fire('Error', 'No se pudo eliminar el documento', 'error');
            }
        }
    };

    const filteredDocs = documentosPaciente.filter(d => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
            (d.titulo && d.titulo.toLowerCase().includes(q)) ||
            (d.descripcion && d.descripcion.toLowerCase().includes(q)) ||
            (d.archivo_original && d.archivo_original.toLowerCase().includes(q)) ||
            (d.documentoGeneral?.nombre && d.documentoGeneral.nombre.toLowerCase().includes(q))
        );
    });

    const totalPages = Math.ceil(filteredDocs.length / limit) || 1;
    const paginatedDocs = filteredDocs.slice((currentPage - 1) * limit, currentPage * limit);
    const nombrePaciente = paciente ? formatPaternoMaternoNombre(paciente) : 'Paciente';

    return (
        <div className="space-y-6">
            {/* Header del Tab */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-200 dark:border-gray-700 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <FileText className="text-blue-500" size={24} />
                        <span>Documentos Generales del Paciente</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                        Descargue plantillas Word, edítelas con los datos del paciente y suba los documentos finales para {nombrePaciente}
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
                        onClick={() => openNewModal()}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap"
                    >
                        <Plus size={18} />
                        <span>Subir Documento</span>
                    </button>
                </div>
            </div>

            {/* Sección 1: Plantillas Generales Disponibles para Descargar */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-800 dark:text-white text-base flex items-center gap-2">
                        <span>📥</span>
                        <span>Plantillas Word Disponibles ({plantillas.length})</span>
                    </h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        Descarga inmediata para edición
                    </span>
                </div>

                {plantillas.length === 0 ? (
                    <div className="py-6 text-center text-sm text-gray-400 italic bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                        No hay plantillas generales registradas en el sistema. Puede agregarlas desde <strong>Configuración &gt; Documentos Generales</strong>.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {plantillas.map(plantilla => (
                            <div
                                key={plantilla.id}
                                className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 bg-gray-50/50 dark:bg-gray-700/40 transition-all flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-start gap-2 mb-1.5">
                                        <span className="text-xl">📄</span>
                                        <div className="min-w-0 flex-1">
                                            <h5 className="font-bold text-gray-800 dark:text-white text-sm truncate" title={plantilla.nombre}>
                                                {plantilla.nombre}
                                            </h5>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5" title={plantilla.descripcion}>
                                                {plantilla.descripcion || 'Plantilla Word de la clínica.'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-2 truncate">
                                        Archivo: {plantilla.archivo_original}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-2 border-t border-gray-200/60 dark:border-gray-600/60">
                                    <button
                                        onClick={() => handleDownloadPlantilla(plantilla)}
                                        className="flex-1 py-1.5 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-sm"
                                        title="Descargar para editar en Word"
                                    >
                                        <Download size={13} />
                                        <span>Descargar Word</span>
                                    </button>
                                    <button
                                        onClick={() => openNewModal(plantilla)}
                                        className="py-1.5 px-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer whitespace-nowrap shadow-sm"
                                        title="Subir documento basado en esta plantilla"
                                    >
                                        <Upload size={13} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Sección 2: Historial de Documentos Guardados del Paciente */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h4 className="font-bold text-gray-800 dark:text-white text-base">
                        Documentos Guardados en el Expediente ({documentosPaciente.length})
                    </h4>

                    {/* Buscador */}
                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Buscar documento..."
                            value={searchTerm}
                            onChange={e => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-9 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xl text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <Search size={14} className="text-gray-400 absolute left-3 top-2.5" />
                    </div>
                </div>

                {/* Tabla de documentos */}
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Título del Documento</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Archivo</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                        Cargando documentos...
                                    </td>
                                </tr>
                            ) : paginatedDocs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400 italic">
                                        {searchTerm ? 'No se encontraron documentos que coincidan con la búsqueda.' : 'No se han subido documentos para este paciente aún.'}
                                    </td>
                                </tr>
                            ) : (
                                paginatedDocs.map((doc, idx) => (
                                    <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-500 dark:text-gray-400">
                                            {(currentPage - 1) * limit + idx + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-medium">
                                            {formatDate(doc.fecha)}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="font-semibold text-gray-900 dark:text-white">
                                                {doc.titulo}
                                            </div>
                                            {doc.descripcion && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                                                    {doc.descripcion}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                            <div className="font-medium truncate max-w-[220px]" title={doc.archivo_original}>
                                                {doc.archivo_original || 'Documento adjunto'}
                                            </div>
                                            {doc.tamano ? (
                                                <div className="text-xs text-gray-400 dark:text-gray-500">
                                                    {(doc.tamano / 1024).toFixed(1)} KB
                                                </div>
                                            ) : null}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => handleDownloadPacienteDoc(doc)}
                                                    className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-sm"
                                                    title="Descargar archivo"
                                                >
                                                    <Download size={14} />
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(doc)}
                                                    className="p-1.5 bg-amber-400 hover:bg-amber-500 text-white rounded-lg transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-sm"
                                                    title="Editar título / observaciones"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteDoc(doc.id)}
                                                    className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-sm"
                                                    title="Eliminar del expediente"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                {filteredDocs.length > limit && (
                    <div className="flex justify-center pt-2">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>

            {/* Modal para Subir / Editar Documento del Paciente */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000] p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-[520px] max-w-[95%] max-h-[90vh] overflow-y-auto shadow-2xl text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-700 pb-3">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2.5">
                                <span className="p-2 bg-blue-100 dark:bg-blue-900/60 rounded-xl text-blue-600 dark:text-blue-300">
                                    <Upload size={18} />
                                </span>
                                <div>
                                    <div>{editingDoc ? 'Editar Documento del Paciente' : 'Subir Documento al Expediente'}</div>
                                    <div className="text-xs text-gray-500 font-normal mt-0.5">Paciente: {nombrePaciente}</div>
                                </div>
                            </h2>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-red-500 p-1.5 rounded-full transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmitModal} className="space-y-4">
                            {/* Título */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Título / Asunto del Documento: *
                                </label>
                                <input
                                    type="text"
                                    value={docTitulo}
                                    onChange={e => setDocTitulo(e.target.value)}
                                    placeholder="Ej: Certificado Médico de Reposo, Contrato Especial..."
                                    required
                                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                            </div>

                            {/* Fecha */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Fecha del Documento: *
                                </label>
                                <input
                                    type="date"
                                    value={docFecha}
                                    onChange={e => setDocFecha(e.target.value)}
                                    required
                                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                            </div>

                            {/* Descripción */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Descripción / Observaciones:
                                </label>
                                <textarea
                                    value={docDescripcion}
                                    onChange={e => setDocDescripcion(e.target.value)}
                                    rows={2}
                                    placeholder="Detalles sobre el contenido del documento, modificaciones realizadas, etc."
                                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                            </div>

                            {/* Selector de Archivo */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Archivo Modificado (.docx, .doc, .pdf): {editingDoc ? '(Opcional para actualizar)' : '*'}
                                </label>
                                {editingDoc && !fileToUpload && (
                                    <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-xs text-blue-700 dark:text-blue-300 flex items-center justify-between border border-blue-200 dark:border-blue-800">
                                        <span className="truncate">Actual: <strong>{editingDoc.archivo_original}</strong></span>
                                        <span className="text-[11px] text-gray-500">Suba otro para reemplazar</span>
                                    </div>
                                )}
                                <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center hover:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-700/50">
                                    <input
                                        type="file"
                                        accept=".doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
                                        onChange={e => {
                                            if (e.target.files && e.target.files[0]) {
                                                setFileToUpload(e.target.files[0]);
                                            }
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        required={!editingDoc}
                                    />
                                    <div className="flex flex-col items-center justify-center">
                                        <span className="text-2xl mb-1">📎</span>
                                        {fileToUpload ? (
                                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                                Seleccionado: {fileToUpload.name} ({(fileToUpload.size / 1024).toFixed(1)} KB)
                                            </p>
                                        ) : (
                                            <>
                                                <p className="text-xs font-medium text-gray-700 dark:text-gray-200">
                                                    Haga clic o arrastre su archivo modificado aquí
                                                </p>
                                                <p className="text-[11px] text-gray-400 mt-0.5">
                                                    Soporta Word (.docx, .doc) y PDF (máx. 50 MB)
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Botones con efecto de rebote e iconos */}
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-start items-center gap-3 mt-6">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    <Save size={18} />
                                    <span>{isSaving ? 'Guardando...' : editingDoc ? 'Actualizar' : 'Guardar'}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2.5 px-5 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm flex items-center gap-2 cursor-pointer"
                                >
                                    <X size={18} />
                                    <span>Cancelar</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manual Modal */}
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Documentos Generales del Paciente"
                sections={manualSections}
            />
        </div>
    );
};

export default PacienteTabDocumentos;
