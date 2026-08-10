import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import { formatDate } from '../utils/dateUtils';

interface PacienteImagenesModalProps {
    isOpen: boolean;
    onClose: () => void;
    pacienteId: number | null;
}

interface Image {
    id: number;
    nombre_archivo: string;
    ruta: string;
    fecha_creacion: string;
}

interface Proforma {
    id: number;
    numero: number;
    fecha: string;
    total: number;
    // ... other fields
}

const PacienteImagenesModal: React.FC<PacienteImagenesModalProps> = ({ isOpen, onClose, pacienteId }) => {
    const [proformas, setProformas] = useState<Proforma[]>([]);
    const [selectedProforma, setSelectedProforma] = useState<Proforma | null>(null);
    const [images, setImages] = useState<Image[]>([]);
    const [viewingImages, setViewingImages] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeProformaIdForUpload, setActiveProformaIdForUpload] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen && pacienteId) {
            fetchProformas();
            setViewingImages(false);
            setImages([]);
            setSelectedProforma(null);
        }
    }, [isOpen, pacienteId]);

    const fetchProformas = async () => {
        if (!pacienteId) return;
        try {
            const response = await api.get(`/proformas/paciente/${pacienteId}`);
            setProformas(response.data);
        } catch (error) {
            console.error('Error fetching proformas:', error);
            Swal.fire({
                title: 'Error',
                text: 'No se pudieron cargar los presupuestos',
                icon: 'error',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !activeProformaIdForUpload) return;

        const files = Array.from(e.target.files);

        // We will upload one by one for simplicity and progress tracking, or all at once if supported.
        // The backend expects one file per request based on our controller implementation (`@UploadedFile()`).
        // So we loop.

        let successCount = 0;

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

        for (const file of files) {
            const fd = new FormData();
            fd.append('file', file);
            try {
                await api.post(`/proformas/${activeProformaIdForUpload}/imagenes`, fd, {
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
        if (successCount > 0) {
            Swal.fire({
                title: 'Éxito',
                text: `${successCount} imágenes subidas correctamente`,
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
            // If we are currently viewing this proforma's images, refresh them
            if (viewingImages && selectedProforma?.id === activeProformaIdForUpload) {
                fetchImages(activeProformaIdForUpload);
            }
        } else {
            Swal.fire({
                title: 'Error',
                text: 'No se pudieron subir las imágenes',
                icon: 'error',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
        }

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
        setActiveProformaIdForUpload(null);
    };

    const triggerUpload = (proformaId: number) => {
        setActiveProformaIdForUpload(proformaId);
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const fetchImages = async (proformaId: number) => {
        try {
            const response = await api.get(`/proformas/${proformaId}/imagenes`);
            setImages(response.data);
            setViewingImages(true);
        } catch (error) {
            console.error('Error fetching images:', error);
            Swal.fire({
                title: 'Error',
                text: 'No se pudieron cargar las imágenes',
                icon: 'error',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
        }
    };

    const handleViewImages = (proforma: Proforma) => {
        setSelectedProforma(proforma);
        fetchImages(proforma.id);
    };

    const handleBackToList = () => {
        setViewingImages(false);
        setImages([]);
        setSelectedProforma(null);
    };

    const handleDeleteImage = async (imageId: number) => {
        try {
            const result = await Swal.fire({
                title: '¿Estás seguro?',
                text: "No podrás revertir esto",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, eliminar',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });

            if (result.isConfirmed) {
                await api.delete(`/proformas/imagenes/${imageId}`);
                // Refresh list
                if (selectedProforma) {
                    fetchImages(selectedProforma.id);
                }
                Swal.fire({
                    title: 'Eliminado',
                    text: 'La imagen ha sido eliminada.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            Swal.fire({
                title: 'Error',
                text: 'No se pudo eliminar la imagen',
                icon: 'error',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
        }
    };

    const getImageUrl = (filename: string) => {
        // Construct URL based on backend static serving or controller endpoint
        // Using the controller endpoint we created: GET /proformas/imagenes/file/:filename
        return `${api.defaults.baseURL}/proformas/imagenes/file/${filename}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4 transition-all">
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto border border-gray-100 dark:border-gray-700 transition-colors duration-300">
                <div className="flex justify-between items-center mb-4 sm:mb-6 border-b border-gray-100 dark:border-gray-700 pb-3 sm:pb-4">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <span className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </span>
                        {viewingImages
                            ? `Imágenes del Presupuesto #${selectedProforma?.numero}`
                            : 'Gestión de Imágenes por Presupuesto'}
                    </h3>
                    <div className="flex gap-2 sm:gap-3">
                        {viewingImages && (
                            <button
                                onClick={handleBackToList}
                                className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-medium transition-colors border border-gray-200 dark:border-gray-600 shadow-sm"
                            >
                                Volver a lista
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>

                <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                    accept="image/*"
                />

                {!viewingImages ? (
                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"># Pres.</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {proformas.map((proforma, index) => (
                                    <tr key={proforma.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/30 dark:bg-gray-800/50'}`}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                            #{proforma.numero}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                            {formatDate(proforma.fecha)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 font-mono">
                                            {proforma.total}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-3">
                                                <button
                                                    onClick={() => triggerUpload(proforma.id)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                    </svg>
                                                    Subir
                                                </button>
                                                <button
                                                    onClick={() => handleViewImages(proforma)}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    Ver
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {proformas.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50">
                                            <div className="flex flex-col items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <span className="text-lg font-medium">No hay presupuestos registrados para este paciente.</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div>
                        {images.length === 0 ? (
                            <div className="text-center py-16 bg-gray-50 dark:bg-gray-700/30 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">No hay imágenes cargadas para este presupuesto.</p>
                                <button
                                    onClick={() => triggerUpload(selectedProforma!.id)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow-md transition-transform hover:-translate-y-0.5"
                                >
                                    Subir Imágenes Ahora
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {images.map((img) => (
                                    <div key={img.id} className="relative group bg-white dark:bg-gray-700 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 shadow-md transition-all hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-500">
                                        <div className="aspect-w-4 aspect-h-3 bg-gray-100 dark:bg-gray-800 cursor-pointer overflow-hidden" onClick={() => window.open(getImageUrl(img.nombre_archivo), '_blank')}>
                                            <img
                                                src={getImageUrl(img.nombre_archivo)}
                                                alt={img.nombre_archivo}
                                                className="object-cover w-full h-48 transition-transform duration-500 group-hover:scale-110"
                                            />
                                        </div>
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleDeleteImage(img.id)}
                                                className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg transition-colors transform hover:scale-110"
                                                title="Eliminar imagen"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Botón flotante para agregar más imágenes si ya hay algunas */}
                        {images.length > 0 && (
                            <div className="mt-8 flex justify-center">
                                <button
                                    onClick={() => triggerUpload(selectedProforma!.id)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-semibold shadow-lg transition-transform hover:-translate-y-1 flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Agregar más imágenes
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PacienteImagenesModal;
