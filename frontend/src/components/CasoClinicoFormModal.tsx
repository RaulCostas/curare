import React, { useState, useEffect } from 'react';
import api from '../services/api';
import type { Especialidad, CasoClinicoFoto } from '../types';
import Swal from 'sweetalert2';
import { Upload, Trash2, Video, Image, Plus, FileText, Stethoscope, FolderGit2 } from 'lucide-react';

interface CasoClinicoFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    casoId: number | null;
}

const CasoClinicoFormModal: React.FC<CasoClinicoFormModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    casoId,
}) => {
    const isEditing = !!casoId;
    const [nombre, setNombre] = useState('');
    const [especialidadId, setEspecialidadId] = useState<number | ''>('');
    const [video, setVideo] = useState<string>('');
    const [fotos, setFotos] = useState<{ foto: string; descripcion: string }[]>([]);
    const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchEspecialidades();
            if (casoId) {
                fetchCaso(casoId);
            } else {
                resetForm();
            }
        }
    }, [isOpen, casoId]);

    const resetForm = () => {
        setNombre('');
        setEspecialidadId('');
        setVideo('');
        setFotos([]);
    };

    const fetchEspecialidades = async () => {
        try {
            const response = await api.get('/especialidad?page=1&limit=9999');
            const data = response.data.data || response.data || [];
            setEspecialidades(data.filter((e: Especialidad) => e.estado === 'activo'));
        } catch (error) {
            console.error('Error fetching especialidades:', error);
        }
    };

    const fetchCaso = async (id: number) => {
        setLoading(true);
        try {
            const response = await api.get(`/casos-clinicos/${id}`);
            const data = response.data;
            setNombre(data.nombre || '');
            setEspecialidadId(data.especialidadId || '');
            setVideo(data.video || '');
            setFotos(data.fotos ? data.fotos.map((f: CasoClinicoFoto) => ({
                foto: f.foto,
                descripcion: f.descripcion || ''
            })) : []);
        } catch (error) {
            console.error('Error fetching caso clínico:', error);
            Swal.fire('Error', 'No se pudo cargar el caso clínico', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 50 * 1024 * 1024) { // 50MB warning
                Swal.fire('Atención', 'El archivo de video es grande. Se recomienda usar videos optimizados.', 'warning');
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setVideo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFotosUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const fileList = Array.from(files);
            fileList.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFotos(prev => [...prev, { foto: reader.result as string, descripcion: '' }]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const handleRemoveFoto = (index: number) => {
        setFotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleFotoDescripcionChange = (index: number, text: string) => {
        setFotos(prev => prev.map((item, i) => i === index ? { ...item, descripcion: text } : item));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre.trim()) {
            Swal.fire('Atención', 'Por favor ingrese el nombre del caso clínico', 'warning');
            return;
        }
        if (!especialidadId) {
            Swal.fire('Atención', 'Por favor seleccione una especialidad', 'warning');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                nombre: nombre.trim(),
                especialidadId: Number(especialidadId),
                video: video || undefined,
                fotos: fotos.map(f => ({ foto: f.foto, descripcion: f.descripcion })),
            };

            if (isEditing) {
                await api.patch(`/casos-clinicos/${casoId}`, payload);
                await Swal.fire({ icon: 'success', title: '¡Caso clínico actualizado!', timer: 1500, showConfirmButton: false });
            } else {
                await api.post('/casos-clinicos', payload);
                await Swal.fire({ icon: 'success', title: '¡Caso clínico creado!', timer: 1500, showConfirmButton: false });
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving caso clínico:', error);
            Swal.fire('Error', error.response?.data?.message || 'Error al guardar el caso clínico', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-50 transition-opacity">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] my-8">
                {/* Header matching standard modals */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <span className="p-2 bg-purple-100 dark:bg-purple-900 rounded-xl text-purple-600 dark:text-purple-300">
                            <FolderGit2 className="h-5 w-5" />
                        </span>
                        {isEditing ? 'Editar Caso Clínico' : 'Nuevo Caso Clínico'}
                    </h2>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                        Cargando información del caso...
                    </div>
                ) : (
                    <div className="p-5 overflow-y-auto">
                        <form onSubmit={handleSubmit} id="caso-clinico-form" className="space-y-5">
                            {/* Nombre del caso */}
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Nombre del Caso Clínico: <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <FileText size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        required
                                        placeholder="Ej: Diseño de Sonrisa y Carillas de Porcelana"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition duration-200"
                                    />
                                </div>
                            </div>

                            {/* Especialidad */}
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Especialidad: <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Stethoscope size={18} />
                                    </div>
                                    <select
                                        value={especialidadId}
                                        onChange={(e) => setEspecialidadId(Number(e.target.value))}
                                        required
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none transition duration-200"
                                    >
                                        <option value="">-- Seleccionar Especialidad --</option>
                                        {especialidades.map(e => (
                                            <option key={e.id} value={e.id}>{e.especialidad}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Video */}
                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                                    <Video size={18} className="text-purple-600 dark:text-purple-400" />
                                    Video Demostrativo (Opcional)
                                </label>
                                {video ? (
                                    <div className="space-y-3">
                                        <video src={video} controls className="w-full max-h-56 rounded-xl bg-black shadow-md object-contain" />
                                        <button
                                            type="button"
                                            onClick={() => setVideo('')}
                                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                        >
                                            <Trash2 size={14} /> Eliminar Video
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 transition-colors cursor-pointer bg-white dark:bg-gray-700 text-center">
                                        <Upload size={32} className="text-purple-600 dark:text-purple-400 mb-2" />
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Haga clic para subir un video</span>
                                        <span className="text-xs text-gray-400 mt-1">Formatos soportados: MP4, WebM, MOV</span>
                                        <input
                                            type="file"
                                            accept="video/*"
                                            onChange={handleVideoUpload}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>

                            {/* Fotos */}
                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                        <Image size={18} className="text-purple-600 dark:text-purple-400" />
                                        Fotos del Caso Clínico ({fotos.length})
                                    </label>
                                    <label className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-sm transition-colors">
                                        <Plus size={14} /> Subir Foto(s)
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleFotosUpload}
                                            className="hidden"
                                        />
                                    </label>
                                </div>

                                {fotos.length === 0 ? (
                                    <div className="text-center py-6 text-xs text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
                                        No hay fotos subidas. Presione "+ Subir Foto(s)" para agregar imágenes de antes/después o del procedimiento.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {fotos.map((item, index) => (
                                            <div key={index} className="relative group bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col gap-2">
                                                <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black">
                                                    <img src={item.foto} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveFoto(index)}
                                                        className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full shadow transition-all"
                                                        title="Eliminar foto"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={item.descripcion}
                                                    onChange={(e) => handleFotoDescripcionChange(index, e.target.value)}
                                                    placeholder="Ej: Foto Inicial / Antes"
                                                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-md outline-none"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>
                )}

                {/* Footer matching standard modules: Guardar (Green) + Cancelar (Gray) left-aligned */}
                <div className="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-start gap-3 rounded-b-xl">
                    <button
                        type="submit"
                        form="caso-clinico-form"
                        disabled={submitting}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-xl flex items-center gap-2 transform hover:-translate-y-0.5 transition-all shadow-md disabled:opacity-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        {submitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar')}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
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

export default CasoClinicoFormModal;
