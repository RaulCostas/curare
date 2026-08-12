import React, { useState, useEffect, useRef } from 'react';
import api, { getMediaUrl } from '../services/api';
import Swal from 'sweetalert2';
import { formatDateLocal } from '../utils/dateUtils';
import { Image as ImageIcon, Upload, ArrowLeft, Trash2, MessageSquare, ChevronLeft, ChevronRight, X } from 'lucide-react';
import ManualModal, { type ManualSection } from './ManualModal';

interface PacienteImagenesTabProps {
    pacienteId: number;
}

interface Image {
    id: number;
    nombre_archivo: string;
    ruta: string;
    descripcion?: string;
    fecha_creacion: string;
}

interface Proforma {
    id: number;
    numero: number;
    fecha: string;
    total: number;
}

const PacienteImagenesTab: React.FC<PacienteImagenesTabProps> = ({ pacienteId }) => {
    const [proformas, setProformas] = useState<Proforma[]>([]);
    const [selectedProforma, setSelectedProforma] = useState<Proforma | null>(null);
    const [images, setImages] = useState<Image[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Lightbox modal index (null if closed)
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [zoomLevel, setZoomLevel] = useState<number>(1);
    const [rotation, setRotation] = useState<number>(0);

    // Reset zoom and rotation when changing active image
    useEffect(() => {
        setZoomLevel(1);
        setRotation(0);
    }, [selectedIndex]);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [showManual, setShowManual] = useState(false);
    const [imgDescriptions, setImgDescriptions] = useState<{ [key: number]: string }>({});

    const manualSections: ManualSection[] = [
        {
            title: 'Galería de Imágenes & Radiografías',
            content: 'Almacene y consulte fotografías clínicas, radiografías periapicales, panorámicas y estudios diagnósticos del paciente organizados por Plan de Tratamiento.'
        },
        {
            title: 'Asociación por Plan',
            content: 'Seleccione un Plan de Tratamiento existente para visualizar las imágenes vinculadas o subir nuevos archivos.'
        },
        {
            title: 'Subir Imágenes',
            content: 'Haga clic en "+ Subir Imágenes" para adjuntar una o múltiples fotografías/radiografías desde su equipo.'
        },
        {
            title: 'Descripciones & Notas',
            content: 'Cada imagen cuenta con una caja de texto inferior para escribir notas clínicas o descripciones (ej: "Radiografía Periapical Pieza 21 pre-tratamiento"). Las notas se guardan automáticamente.'
        },
        {
            title: 'Visor Pantalla Completa & Navegación',
            content: 'Haga clic en cualquier imagen para abrir el visor en pantalla completa. Use los botones lateral izquierdo/derecho (o las teclas de flecha en su teclado) para navegar entre fotos.'
        }
    ];

    useEffect(() => {
        if (pacienteId) {
            fetchProformas();
        }
    }, [pacienteId]);

    // Keyboard navigation for Lightbox
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedIndex === null) return;
            if (e.key === 'ArrowLeft') {
                handlePrevImage();
            } else if (e.key === 'ArrowRight') {
                handleNextImage();
            } else if (e.key === 'Escape') {
                setSelectedIndex(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIndex, images]);

    const fetchProformas = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/proformas/paciente/${pacienteId}`);
            setProformas(response.data || []);
        } catch (error) {
            console.error('Error fetching proformas:', error);
            setProformas([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectProforma = async (proforma: Proforma) => {
        setSelectedProforma(proforma);
        setLoading(true);
        try {
            const response = await api.get(`/proformas/${proforma.id}/imagenes`);
            const loadedImages: Image[] = response.data || [];
            setImages(loadedImages);
            // Initialize descriptions
            const descMap: { [key: number]: string } = {};
            loadedImages.forEach(img => {
                descMap[img.id] = img.descripcion || '';
            });
            setImgDescriptions(descMap);
        } catch (error) {
            console.error('Error fetching images:', error);
            setImages([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !selectedProforma) return;

        const files = Array.from(e.target.files);
        setUploading(true);

        Swal.fire({
            title: 'Subiendo imágenes...',
            text: 'Por favor espere',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
            background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
            color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
        });

        let successCount = 0;
        for (const file of files) {
            const fd = new FormData();
            fd.append('file', file);
            try {
                await api.post(`/proformas/${selectedProforma.id}/imagenes`, fd, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                successCount++;
            } catch (error) {
                console.error('Error uploading file:', file.name, error);
            }
        }

        Swal.close();
        setUploading(false);

        if (successCount > 0) {
            Swal.fire({
                title: 'Éxito',
                text: `${successCount} imagen(es) subida(s) correctamente`,
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
            handleSelectProforma(selectedProforma);
        }
    };

    const handleSaveDescription = async (imageId: number, newDesc: string) => {
        try {
            await api.patch(`/proformas/imagenes/${imageId}/descripcion`, { descripcion: newDesc });
            setImages(prev => prev.map(img => img.id === imageId ? { ...img, descripcion: newDesc } : img));
        } catch (error) {
            console.error('Error saving image description:', error);
        }
    };

    const handleDeleteImage = async (imageId: number) => {
        const result = await Swal.fire({
            title: '¿Eliminar imagen?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
            color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/proformas/imagenes/${imageId}`);
                Swal.fire({
                    title: 'Eliminada',
                    text: 'La imagen ha sido eliminada',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
                if (selectedProforma) handleSelectProforma(selectedProforma);
            } catch (error) {
                console.error('Error deleting image:', error);
            }
        }
    };

    const handlePrevImage = () => {
        setSelectedIndex(prev => (prev !== null ? (prev === 0 ? images.length - 1 : prev - 1) : null));
    };

    const handleNextImage = () => {
        setSelectedIndex(prev => (prev !== null ? (prev === images.length - 1 ? 0 : prev + 1) : null));
    };

    const currentImg = selectedIndex !== null && images[selectedIndex] ? images[selectedIndex] : null;

    return (
        <div className="space-y-4">
            {/* Header del Tab */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-200 dark:border-gray-700 gap-4 mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <ImageIcon className="text-blue-500" size={22} />
                        <span>Galería de Imágenes & Radiografías</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                        Fotografías clínicas, radiografías y archivos de diagnóstico del paciente.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[34px] h-[34px] text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shadow-sm cursor-pointer"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>

                    {selectedProforma && (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-bold shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 text-sm cursor-pointer disabled:opacity-50"
                        >
                            <Upload size={18} />
                            <span>Subir Imágenes</span>
                        </button>
                    )}
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                multiple
                accept="image/*"
                className="hidden"
            />

            {!selectedProforma ? (
                <div>
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                        Seleccione un Plan de Tratamiento:
                    </h4>
                    {proformas.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
                            No hay planes de tratamiento registrados para asociar imágenes.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {proformas.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => handleSelectProforma(p)}
                                    className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-left hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
                                >
                                    <div className="font-bold text-gray-800 dark:text-white mb-1">
                                        Plan de Tratamiento #{p.numero || p.id}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Fecha: {formatDateLocal(p.fecha)}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Banner de Selección con Botón "Cambiar Plan" estilizado */}
                    <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-3.5 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm">
                        <span className="text-sm font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                            <ImageIcon size={18} className="text-blue-600 dark:text-blue-400" />
                            Viendo imágenes del Plan #{selectedProforma.numero || selectedProforma.id}
                        </span>
                        <button
                            type="button"
                            onClick={() => setSelectedProforma(null)}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl text-xs shadow-sm transition-all transform hover:-translate-y-0.5 flex items-center gap-1.5 cursor-pointer"
                        >
                            <ArrowLeft size={14} />
                            <span>Cambiar Plan</span>
                        </button>
                    </div>

                    {images.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
                            No hay imágenes en este plan de tratamiento. Haga clic en "Subir Imágenes" para agregar la primera radiografía o foto.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {images.map((img, idx) => {
                                const fullUrl = getMediaUrl(`uploads/proformas/${img.nombre_archivo}`);
                                return (
                                    <div key={img.id} className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                                        <div>
                                            <div className="relative overflow-hidden bg-gray-100 dark:bg-gray-900 cursor-pointer" onClick={() => setSelectedIndex(idx)}>
                                                <img
                                                    src={fullUrl}
                                                    alt={img.nombre_archivo}
                                                    className="w-full h-44 object-cover group-hover:scale-105 transition-all duration-300"
                                                />
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteImage(img.id);
                                                    }}
                                                    className="absolute top-2 right-2 p-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10 cursor-pointer"
                                                    title="Eliminar imagen"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            
                                            <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                                                <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mb-1.5 font-medium">
                                                    <span>{formatDateLocal(img.fecha_creacion)}</span>
                                                    <MessageSquare size={13} className="text-blue-500" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={imgDescriptions[img.id] !== undefined ? imgDescriptions[img.id] : (img.descripcion || '')}
                                                    onChange={(e) => setImgDescriptions({ ...imgDescriptions, [img.id]: e.target.value })}
                                                    onBlur={() => handleSaveDescription(img.id, imgDescriptions[img.id] ?? img.descripcion ?? '')}
                                                    placeholder="Añadir descripción..."
                                                    className="w-full text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium outline-none transition-all placeholder-gray-400"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Modal Lightbox Pantalla Completa con Navegación Izquierda / Derecha */}
            {selectedIndex !== null && currentImg && (
                <div 
                    className="fixed inset-0 bg-black/95 backdrop-blur-md z-[10000] flex flex-col justify-between items-center p-4 sm:p-6 select-none animate-fadeIn"
                    onClick={() => setSelectedIndex(null)}
                >
                    {/* Header del Lightbox */}
                    <div className="w-full flex justify-between items-center text-white z-20 px-2 sm:px-6 py-2" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3">
                            <span className="bg-blue-600/80 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                                {selectedIndex + 1} / {images.length}
                            </span>
                            <span className="text-xs sm:text-sm text-gray-300 font-medium hidden sm:inline">
                                {formatDateLocal(currentImg.fecha_creacion)}
                            </span>
                        </div>

                        {/* Toolbar de Zoom & Rotación */}
                        <div className="flex items-center gap-2 bg-gray-900/80 px-3 py-1.5 rounded-full border border-gray-700/80 shadow-lg">
                            <button
                                type="button"
                                onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                                className="w-7 h-7 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-full font-bold text-sm text-white transition-colors cursor-pointer"
                                title="Alejar (-)"
                            >
                                -
                            </button>
                            <button
                                type="button"
                                onClick={() => { setZoomLevel(1); setRotation(0); }}
                                className="px-2.5 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 rounded-full text-white transition-colors cursor-pointer"
                                title="Restablecer a tamaño normal (100%)"
                            >
                                {Math.round(zoomLevel * 100)}%
                            </button>
                            <button
                                type="button"
                                onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                                className="w-7 h-7 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-full font-bold text-sm text-white transition-colors cursor-pointer"
                                title="Acercar (+)"
                            >
                                +
                            </button>
                            <div className="h-4 w-px bg-gray-700 mx-1"></div>
                            <button
                                type="button"
                                onClick={() => setRotation(prev => (prev + 90) % 360)}
                                className="px-2.5 py-1 text-xs font-bold bg-gray-800 hover:bg-gray-700 rounded-full text-gray-200 transition-colors cursor-pointer"
                                title="Rotar 90 grados"
                            >
                                🔄 Rotar
                            </button>
                        </div>

                        <button
                            onClick={() => setSelectedIndex(null)}
                            className="bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-full p-2 flex items-center justify-center transition-all cursor-pointer shadow-lg"
                            title="Cerrar (Esc)"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Botón de Navegación Izquierda */}
                    {images.length > 1 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handlePrevImage();
                            }}
                            className="fixed left-3 sm:left-6 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-white/20 text-white rounded-full p-3 sm:p-4 transition-all duration-200 cursor-pointer backdrop-blur-md shadow-2xl z-20 border border-white/10 hover:scale-110 active:scale-95"
                            title="Imagen Anterior (Flecha Izquierda)"
                        >
                            <ChevronLeft size={32} />
                        </button>
                    )}

                    {/* Área de Imagen Central que Ocupa la Pantalla Completa */}
                    <div 
                        className="flex-1 flex flex-col items-center justify-center w-full my-auto max-h-[82vh] relative z-10 px-12 overflow-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <img
                            src={getMediaUrl(`uploads/proformas/${currentImg.nombre_archivo}`)}
                            alt={currentImg.nombre_archivo}
                            style={{
                                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                                transition: 'transform 0.2s ease-out'
                            }}
                            className="max-h-[78vh] max-w-[92vw] rounded-xl object-contain shadow-2xl border border-gray-800 cursor-zoom-in"
                            onDoubleClick={() => setZoomLevel(prev => (prev === 1 ? 1.75 : 1))}
                            title="Haga doble clic para ampliar/restablecer"
                        />
                        {currentImg.descripcion && (
                            <div className="mt-3 max-w-2xl text-center px-5 py-2.5 bg-gray-900/90 text-white text-xs sm:text-sm font-medium rounded-xl border border-gray-700/80 shadow-2xl backdrop-blur-md z-20">
                                {currentImg.descripcion}
                            </div>
                        )}
                    </div>

                    {/* Botón de Navegación Derecha */}
                    {images.length > 1 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleNextImage();
                            }}
                            className="fixed right-3 sm:right-6 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-white/20 text-white rounded-full p-3 sm:p-4 transition-all duration-200 cursor-pointer backdrop-blur-md shadow-2xl z-20 border border-white/10 hover:scale-110 active:scale-95"
                            title="Siguiente Imagen (Flecha Derecha)"
                        >
                            <ChevronRight size={32} />
                        </button>
                    )}
                </div>
            )}

            {/* Modal de Manual / Ayuda */}
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Galería de Imágenes & Radiografías"
                sections={manualSections}
            />
        </div>
    );
};

export default PacienteImagenesTab;
