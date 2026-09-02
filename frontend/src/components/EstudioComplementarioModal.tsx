import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import type { EstudioComplementario } from '../types';
import { getLocalDateString } from '../utils/dateUtils';
import Swal from 'sweetalert2';
import {
    Save,
    X,
    Calendar,
    Activity,
    AlignLeft,
    FileText,
    Paperclip,
    CheckCircle2,
    Trash2
} from 'lucide-react';

interface EstudioComplementarioModalProps {
    isOpen: boolean;
    onClose: () => void;
    pacienteId: number;
    estudioToEdit?: EstudioComplementario | null;
    onSaveSuccess: () => void;
}

const EstudioComplementarioModal: React.FC<EstudioComplementarioModalProps> = ({
    isOpen,
    onClose,
    pacienteId,
    estudioToEdit,
    onSaveSuccess,
}) => {
    const [fecha, setFecha] = useState(getLocalDateString());
    const [tipoEstudio, setTipoEstudio] = useState('');
    const [observaciones, setObservaciones] = useState('');
    
    // Archivos seleccionados nuevos
    const [ordenFile, setOrdenFile] = useState<File | null>(null);
    const [archivoFile, setArchivoFile] = useState<File | null>(null);

    // Archivos existentes (en modo edición)
    const [existingOrdenUrl, setExistingOrdenUrl] = useState<string | null>(null);
    const [existingArchivoUrl, setExistingArchivoUrl] = useState<string | null>(null);

    // Flags para indicar si se eliminó el archivo existente
    const [removeExistingOrden, setRemoveExistingOrden] = useState(false);
    const [removeExistingArchivo, setRemoveExistingArchivo] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const ordenInputRef = useRef<HTMLInputElement>(null);
    const archivoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            if (estudioToEdit) {
                setFecha(estudioToEdit.fecha ? getLocalDateString(estudioToEdit.fecha) : getLocalDateString());
                setTipoEstudio(estudioToEdit.tipo_estudio || '');
                setObservaciones(estudioToEdit.observaciones || '');
                setExistingOrdenUrl(estudioToEdit.orden_estudio_url || null);
                setExistingArchivoUrl(estudioToEdit.archivo_url || null);
            } else {
                setFecha(getLocalDateString());
                setTipoEstudio('');
                setObservaciones('');
                setExistingOrdenUrl(null);
                setExistingArchivoUrl(null);
            }
            setOrdenFile(null);
            setArchivoFile(null);
            setRemoveExistingOrden(false);
            setRemoveExistingArchivo(false);
        }
    }, [isOpen, estudioToEdit]);

    if (!isOpen) return null;

    const handleOrdenFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setOrdenFile(e.target.files[0]);
            setRemoveExistingOrden(false);
        }
    };

    const handleArchivoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setArchivoFile(e.target.files[0]);
            setRemoveExistingArchivo(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!fecha) {
            Swal.fire({
                icon: 'warning',
                title: 'Campo obligatorio',
                text: 'Por favor ingrese la fecha del estudio.',
            });
            return;
        }

        if (!tipoEstudio.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Campo obligatorio',
                text: 'Por favor ingrese el tipo de estudio (Ej. Radiografía Panorámica).',
            });
            return;
        }

        setIsSubmitting(true);

        try {
            // Obtener ID del usuario logueado
            const userStr = localStorage.getItem('user');
            let currentUserId: number | undefined;
            if (userStr) {
                try {
                    const u = JSON.parse(userStr);
                    if (u?.id) currentUserId = Number(u.id);
                } catch {
                    // Ignore parse error
                }
            }

            const formData = new FormData();
            formData.append('pacienteId', String(pacienteId));
            formData.append('fecha', fecha);
            formData.append('tipo_estudio', tipoEstudio.trim());
            formData.append('observaciones', observaciones.trim() || '');
            if (currentUserId) {
                formData.append('usuarioId', String(currentUserId));
            }

            if (ordenFile) {
                formData.append('orden_estudio', ordenFile);
            } else if (removeExistingOrden) {
                formData.append('orden_estudio_url', '');
            }

            if (archivoFile) {
                formData.append('archivo', archivoFile);
            } else if (removeExistingArchivo) {
                formData.append('archivo_url', '');
            }

            if (estudioToEdit) {
                await api.patch(`/estudios-complementarios/${estudioToEdit.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                Swal.fire({
                    icon: 'success',
                    title: '¡Actualizado!',
                    text: 'El estudio complementario fue actualizado exitosamente.',
                    timer: 1800,
                    showConfirmButton: false,
                });
            } else {
                await api.post('/estudios-complementarios', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                Swal.fire({
                    icon: 'success',
                    title: '¡Guardado!',
                    text: 'El estudio complementario fue registrado exitosamente.',
                    timer: 1800,
                    showConfirmButton: false,
                });
            }

            onSaveSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error al guardar estudio complementario:', error);
            const msg = error.response?.data?.message || 'Ocurrió un error al guardar el estudio complementario.';
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: Array.isArray(msg) ? msg.join(', ') : msg,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getCleanFileName = (pathOrUrl?: string | null) => {
        if (!pathOrUrl) return '';
        return pathOrUrl.split('/').pop()?.replace(/^estudio-\d+-\d+/, '') || pathOrUrl;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
            <div className="relative w-full max-w-xl bg-[#131927] border border-[#263147] text-white rounded-3xl shadow-2xl overflow-hidden my-auto transition-all">
                
                {/* ── Modal Header ────────────────────────────────────────────── */}
                <div className="px-6 py-5 border-b border-[#212c40] flex items-center justify-between">
                    <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-2.5">
                        <Activity className="text-blue-400" size={22} />
                        <span>{estudioToEdit ? 'Editar Estudio Complementario' : 'Nuevo Estudio Complementario'}</span>
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 bg-transparent hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full transition-all cursor-pointer"
                        title="Cerrar"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* ── Modal Body / Form ────────────────────────────────────────── */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 text-sm">
                    
                    {/* Fecha */}
                    <div>
                        <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-2">
                            Fecha <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                <Calendar size={18} />
                            </div>
                            <input
                                type="date"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                required
                                className="w-full pl-11 pr-4 py-3 bg-[#1d263a] border border-[#2e3c5a] rounded-xl text-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Tipo de Estudio */}
                    <div>
                        <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-2">
                            Tipo de Estudio <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                <Activity size={18} />
                            </div>
                            <input
                                type="text"
                                value={tipoEstudio}
                                onChange={(e) => setTipoEstudio(e.target.value)}
                                placeholder="Ej. Radiografía Panorámica, Tomografía CBCT"
                                required
                                className="w-full pl-11 pr-4 py-3 bg-[#1d263a] border border-[#2e3c5a] rounded-xl text-white font-medium placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Observaciones */}
                    <div>
                        <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-2">
                            Observaciones
                        </label>
                        <div className="relative">
                            <div className="absolute top-3.5 left-3.5 pointer-events-none text-gray-400">
                                <AlignLeft size={18} />
                            </div>
                            <textarea
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                                rows={3}
                                placeholder="Detalles adicionales o indicación médica..."
                                className="w-full pl-11 pr-4 py-3 bg-[#1d263a] border border-[#2e3c5a] rounded-xl text-white font-medium placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                            />
                        </div>
                    </div>

                    {/* Caja: Orden de Estudio */}
                    <div className="bg-[#182133] border border-[#263552] rounded-2xl p-4 transition-all">
                        <div className="flex items-center gap-2 text-indigo-300 font-bold mb-2.5 text-xs uppercase tracking-wider">
                            <FileText size={16} className="text-indigo-400" />
                            <span>Orden de Estudio (Imagen o PDF de la Orden)</span>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-[#1d263a] border border-[#2e3c5a] rounded-xl p-2.5">
                            <input
                                ref={ordenInputRef}
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={handleOrdenFileChange}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => ordenInputRef.current?.click()}
                                className="flex items-center gap-2 bg-[#2d3a56] hover:bg-[#39496c] text-white px-4 py-2 rounded-lg font-bold text-xs shadow transition-colors cursor-pointer flex-shrink-0"
                            >
                                <Paperclip size={14} />
                                <span>Elegir archivo</span>
                            </button>

                            <div className="text-xs text-gray-300 font-medium truncate flex-1 flex items-center justify-between gap-2 overflow-hidden w-full">
                                {ordenFile ? (
                                    <div className="flex items-center gap-1.5 truncate">
                                        <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                                        <span className="text-emerald-300 font-bold truncate">{ordenFile.name}</span>
                                    </div>
                                ) : existingOrdenUrl && !removeExistingOrden ? (
                                    <div className="flex items-center gap-1.5 truncate">
                                        <CheckCircle2 size={16} className="text-blue-400 flex-shrink-0" />
                                        <span className="text-blue-300 font-medium truncate">Actual: {getCleanFileName(existingOrdenUrl)}</span>
                                    </div>
                                ) : (
                                    <span className="text-gray-400 italic">No se ha seleccionado ningún archivo</span>
                                )}

                                {/* Botón rojo de eliminar */}
                                {(ordenFile || (existingOrdenUrl && !removeExistingOrden)) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (ordenFile) {
                                                setOrdenFile(null);
                                                if (ordenInputRef.current) ordenInputRef.current.value = '';
                                            } else {
                                                setRemoveExistingOrden(true);
                                            }
                                        }}
                                        className="p-1.5 bg-red-500/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 rounded-lg transition-all flex items-center justify-center flex-shrink-0 cursor-pointer shadow-sm ml-2"
                                        title="Eliminar archivo"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <p className="text-[11px] text-gray-400 mt-2 font-normal">
                            Adjunte la orden médica para que quede grabada como constancia y poder enviarla por WhatsApp.
                        </p>
                    </div>

                    {/* Caja: Archivo Resultado del Estudio */}
                    <div className="bg-[#182133] border border-[#263552] rounded-2xl p-4 transition-all">
                        <div className="flex items-center gap-2 text-cyan-300 font-bold mb-2.5 text-xs uppercase tracking-wider">
                            <Paperclip size={16} className="text-cyan-400" />
                            <span>Archivo Resultado del Estudio (Imagen o PDF)</span>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-[#1d263a] border border-[#2e3c5a] rounded-xl p-2.5">
                            <input
                                ref={archivoInputRef}
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={handleArchivoFileChange}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => archivoInputRef.current?.click()}
                                className="flex items-center gap-2 bg-[#2d3a56] hover:bg-[#39496c] text-white px-4 py-2 rounded-lg font-bold text-xs shadow transition-colors cursor-pointer flex-shrink-0"
                            >
                                <Paperclip size={14} />
                                <span>Elegir archivo</span>
                            </button>

                            <div className="text-xs text-gray-300 font-medium truncate flex-1 flex items-center justify-between gap-2 overflow-hidden w-full">
                                {archivoFile ? (
                                    <div className="flex items-center gap-1.5 truncate">
                                        <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                                        <span className="text-emerald-300 font-bold truncate">{archivoFile.name}</span>
                                    </div>
                                ) : existingArchivoUrl && !removeExistingArchivo ? (
                                    <div className="flex items-center gap-1.5 truncate">
                                        <CheckCircle2 size={16} className="text-blue-400 flex-shrink-0" />
                                        <span className="text-blue-300 font-medium truncate">Actual: {getCleanFileName(existingArchivoUrl)}</span>
                                    </div>
                                ) : (
                                    <span className="text-gray-400 italic">No se ha seleccionado ningún archivo</span>
                                )}

                                {/* Botón rojo de eliminar */}
                                {(archivoFile || (existingArchivoUrl && !removeExistingArchivo)) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (archivoFile) {
                                                setArchivoFile(null);
                                                if (archivoInputRef.current) archivoInputRef.current.value = '';
                                            } else {
                                                setRemoveExistingArchivo(true);
                                            }
                                        }}
                                        className="p-1.5 bg-red-500/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 rounded-lg transition-all flex items-center justify-center flex-shrink-0 cursor-pointer shadow-sm ml-2"
                                        title="Eliminar archivo"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <p className="text-[11px] text-gray-400 mt-2 font-normal">
                            Adjunte el resultado entregado por el laboratorio o centro radiológico.
                        </p>
                    </div>

                    {/* ── Modal Footer Buttons ─────────────────────────────────── */}
                    <div className="pt-3 flex flex-wrap items-center gap-3">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-green-900/30 transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                        >
                            <Save size={18} />
                            <span>{isSubmitting ? 'Guardando...' : 'Guardar Estudio'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#475569] hover:bg-[#334155] text-white px-6 py-3 rounded-xl font-bold text-sm shadow transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                        >
                            <X size={18} />
                            <span>Cancelar</span>
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default EstudioComplementarioModal;
