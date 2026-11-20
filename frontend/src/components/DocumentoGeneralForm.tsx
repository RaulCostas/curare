import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import api from '../services/api';
import Swal from 'sweetalert2';
import type { DocumentoGeneral } from '../types';
import ManualModal, { type ManualSection } from './ManualModal';

interface DocumentoGeneralFormProps {
    isOpen: boolean;
    onClose: () => void;
    id?: number | null;
    onSaveSuccess: () => void;
}

const DocumentoGeneralForm: React.FC<DocumentoGeneralFormProps> = ({ isOpen, onClose, id, onSaveSuccess }) => {
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [estado, setEstado] = useState('activo');
    const [archivo, setArchivo] = useState<File | null>(null);
    const [currentArchivoOriginal, setCurrentArchivoOriginal] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Documentos Generales (Plantillas)',
            content: 'Aquí puede subir y gestionar documentos y plantillas en formato Word (.docx o .doc). Estos documentos servirán de base para generar o llenar información de pacientes u otros trámites.'
        },
        {
            title: 'Subida y Descarga',
            content: 'Adjunte el archivo Word correspondiente. Cuando lo necesite, podrá descargarlo directamente desde este módulo o desde el perfil del paciente para editarlo con sus datos.'
        }
    ];

    useEffect(() => {
        if (isOpen) {
            if (id) {
                api.get<DocumentoGeneral>(`/documentos-generales/${id}`)
                    .then(response => {
                        const doc = response.data;
                        setNombre(doc.nombre || '');
                        setDescripcion(doc.descripcion || '');
                        setEstado(doc.estado || 'activo');
                        setCurrentArchivoOriginal(doc.archivo_original || '');
                        setArchivo(null);
                    })
                    .catch(error => {
                        console.error('Error fetching documento general:', error);
                    });
            } else {
                setNombre('');
                setDescripcion('');
                setEstado('activo');
                setCurrentArchivoOriginal('');
                setArchivo(null);
            }
        }
    }, [isOpen, id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!nombre.trim()) {
            Swal.fire('Atención', 'Ingrese el nombre del documento', 'warning');
            return;
        }

        if (!id && !archivo) {
            Swal.fire('Atención', 'Debe seleccionar un archivo Word (.docx / .doc)', 'warning');
            return;
        }

        try {
            setIsSaving(true);
            const formData = new FormData();
            formData.append('nombre', nombre.trim());
            formData.append('descripcion', descripcion.trim());
            formData.append('estado', estado);
            if (archivo) {
                formData.append('file', archivo);
            }

            if (id) {
                await api.patch(`/documentos-generales/${id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                await Swal.fire({
                    icon: 'success',
                    title: 'Documento Actualizado',
                    text: 'El documento se actualizó exitosamente',
                    timer: 1500,
                    showConfirmButton: false,
                });
            } else {
                await api.post('/documentos-generales', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                await Swal.fire({
                    icon: 'success',
                    title: 'Documento Creado',
                    text: 'El documento se subió exitosamente',
                    timer: 1500,
                    showConfirmButton: false,
                });
            }
            onSaveSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving documento general:', error);
            const msg = error.response?.data?.message || 'Error al guardar el documento';
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: Array.isArray(msg) ? msg.join(', ') : msg,
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000] p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-[520px] max-w-[95%] max-h-[90vh] overflow-y-auto shadow-2xl text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-700 pb-3">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <span className="p-2.5 bg-blue-100 dark:bg-blue-900/60 rounded-xl text-blue-600 dark:text-blue-300 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </span>
                        {id ? 'Editar Documento General' : 'Nuevo Documento General'}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowManual(true)}
                            className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            title="Ayuda / Manual"
                        >
                            ?
                        </button>
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
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">
                            Nombre del Documento / Plantilla: *
                        </label>
                        <div className="relative">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>
                            <input
                                type="text"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                required
                                placeholder="Ej: Consentimiento Quirúrgico, Certificado Médico..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">
                            Descripción / Observaciones:
                        </label>
                        <textarea
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            rows={3}
                            placeholder="Detalle el propósito o uso de esta plantilla de Word..."
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm"
                        />
                    </div>

                    <div>
                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">
                            Archivo Word (.docx, .doc): {id ? '(Opcional si no desea cambiarlo)' : '*'}
                        </label>
                        {currentArchivoOriginal && !archivo && (
                            <div className="mb-2 p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 text-xs flex items-center justify-between">
                                <span className="font-medium text-blue-800 dark:text-blue-300 flex items-center gap-2 truncate">
                                    📄 Actual: <strong>{currentArchivoOriginal}</strong>
                                </span>
                                <span className="text-gray-500 text-[11px] shrink-0">Suba otro para reemplazar</span>
                            </div>
                        )}
                        <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center hover:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-700/50">
                            <input
                                type="file"
                                accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setArchivo(e.target.files[0]);
                                    }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                required={!id && !currentArchivoOriginal}
                            />
                            <div className="flex flex-col items-center justify-center">
                                <span className="text-3xl mb-1">📝</span>
                                {archivo ? (
                                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                        Seleccionado: {archivo.name} ({(archivo.size / 1024).toFixed(1)} KB)
                                    </p>
                                ) : (
                                    <>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                            Haga clic o arrastre su archivo Word aquí
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            Formatos permitidos: .docx, .doc (máx. 50 MB)
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Estado:</label>
                        <select
                            value={estado}
                            onChange={(e) => setEstado(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        >
                            <option value="activo">Activo</option>
                            <option value="inactivo">Inactivo</option>
                        </select>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-start items-center gap-3 mt-6">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            <Save size={18} />
                            <span>{isSaving ? 'Guardando...' : id ? 'Actualizar' : 'Guardar'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2.5 px-5 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm flex items-center gap-2 cursor-pointer"
                        >
                            <X size={18} />
                            <span>Cancelar</span>
                        </button>
                    </div>
                </form>
            </div>
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Documentos Generales"
                sections={manualSections}
            />
        </div>
    );
};

export default DocumentoGeneralForm;
