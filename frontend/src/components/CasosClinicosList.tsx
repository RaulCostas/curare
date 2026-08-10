import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';
import type { CasoClinico, CasoClinicoFoto } from '../types';
import ManualModal, { type ManualSection } from './ManualModal';
import Pagination from './Pagination';
import CasoClinicoFormModal from './CasoClinicoFormModal';
import Swal from 'sweetalert2';
import { FolderGit2, Play, Image, ChevronLeft, ChevronRight, X } from 'lucide-react';

// Zoom & rotation reset on index change is handled inside the lightbox section

interface PaginatedResponse {
    data: CasoClinico[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const CasosClinicosList: React.FC = () => {
    const navigate = useNavigate();
    const [casos, setCasos] = useState<CasoClinico[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [showManual, setShowManual] = useState(false);

    // Form Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    // Video Player Modal State
    const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
    const [activeVideoTitle, setActiveVideoTitle] = useState<string>('');

    // Photo Gallery Lightbox State
    const [activeGalleryFotos, setActiveGalleryFotos] = useState<CasoClinicoFoto[]>([]);
    const [activeGalleryIndex, setActiveGalleryIndex] = useState<number>(0);
    const [activeGalleryTitle, setActiveGalleryTitle] = useState<string>('');
    const [galleryZoom, setGalleryZoom] = useState<number>(1);
    const [galleryRotation, setGalleryRotation] = useState<number>(0);

    const limit = 10;

    const manualSections: ManualSection[] = [
        {
            title: 'Módulo de Casos Clínicos',
            content: 'Este módulo permite registrar y organizar casos clínicos con fotos de antes/después y videos para demostración explicativa a los pacientes.'
        },
        {
            title: 'Crear un Caso Clínico',
            content: 'Haga clic en el botón "+ Nuevo Caso Clínico", asigne el nombre del tratamiento, la especialidad correspondiente, y adjunte fotos y/o video demostrativo.'
        }
    ];

    useEffect(() => {
        fetchCasos();
    }, [currentPage, searchTerm]);

    const fetchCasos = async () => {
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: limit.toString(),
            });

            if (searchTerm) {
                params.append('search', searchTerm);
            }

            const response = await api.get<PaginatedResponse>(`/casos-clinicos?${params}`);
            setCasos(response.data.data || []);
            setTotalPages(response.data.totalPages || 1);
            setTotal(response.data.total || 0);
        } catch (error) {
            console.error('Error fetching casos clínicos:', error);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Dar de baja caso clínico?',
            text: 'El caso clínico pasará a estado Inactivo.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, dar de baja',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.patch(`/casos-clinicos/${id}`, { estado: 'inactivo' });
                await Swal.fire({ icon: 'success', title: '¡Caso clínico dado de baja!', showConfirmButton: false, timer: 1500 });
                fetchCasos();
            } catch (error) {
                console.error('Error:', error);
                Swal.fire('Error', 'No se pudo dar de baja', 'error');
            }
        }
    };

    const handleReactivate = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Reactivar caso clínico?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, reactivar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.patch(`/casos-clinicos/${id}`, { estado: 'activo' });
                await Swal.fire({ icon: 'success', title: '¡Caso clínico reactivado!', showConfirmButton: false, timer: 1500 });
                fetchCasos();
            } catch (error) {
                console.error('Error:', error);
                Swal.fire('Error', 'No se pudo reactivar', 'error');
            }
        }
    };

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(
            casos.map(c => ({
                ID: c.id,
                Nombre: c.nombre,
                Especialidad: c.especialidad?.especialidad || 'General',
                Fotos: c.fotos?.length || 0,
                Video: c.video ? 'Sí' : 'No',
                Estado: c.estado || 'activo'
            }))
        );
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'CasosClinicos');
        XLSX.writeFile(workbook, `CasosClinicos_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            doc.text('Lista de Casos Clínicos', 14, 15);
            const tableData = casos.map(c => [
                c.id.toString(),
                c.nombre,
                c.especialidad?.especialidad || 'General',
                (c.fotos?.length || 0).toString(),
                c.estado || 'activo'
            ]);
            autoTable(doc, {
                startY: 20,
                head: [['ID', 'Nombre del Caso', 'Especialidad', 'Fotos', 'Estado']],
                body: tableData,
            });
            doc.save(`CasosClinicos_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error(err);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const openGallery = (fotos: CasoClinicoFoto[], title: string, initialIndex = 0) => {
        if (!fotos || fotos.length === 0) return;
        setActiveGalleryFotos(fotos);
        setActiveGalleryIndex(initialIndex);
        setActiveGalleryTitle(title);
        setGalleryZoom(1);
        setGalleryRotation(0);
    };

    const handleGalleryPrev = () => {
        setActiveGalleryIndex(prev => (prev > 0 ? prev - 1 : activeGalleryFotos.length - 1));
        setGalleryZoom(1);
        setGalleryRotation(0);
    };

    const handleGalleryNext = () => {
        setActiveGalleryIndex(prev => (prev < activeGalleryFotos.length - 1 ? prev + 1 : 0));
        setGalleryZoom(1);
        setGalleryRotation(0);
    };

    return (
        <div className="content-card">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 no-print gap-4">
                <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                    <button
                        onClick={() => navigate('/configuration')}
                        className="p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 shadow-sm transition-all transform hover:-translate-y-0.5 no-print flex items-center justify-center w-10 h-10"
                        title="Volver a Configuración"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div className="p-3 bg-teal-100 dark:bg-teal-900/40 rounded-2xl shadow-sm">
                        <FolderGit2 className="h-8 w-8 text-teal-600 dark:text-teal-300" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                            Casos Clínicos
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Gestión de casos clínicos con fotos y videos explicativos
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    <button
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>
                    <button
                        onClick={exportToExcel}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 text-sm"
                        title="Exportar a Excel"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg> Excel
                    </button>
                    <button
                        onClick={exportToPDF}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 text-sm"
                        title="Exportar a PDF"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg> PDF
                    </button>
                    <button
                        onClick={handlePrint}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 text-sm"
                        title="Imprimir"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg> Imprimir
                    </button>
                    <button
                        onClick={() => { setSelectedId(null); setIsModalOpen(true); }}
                        className="bg-[#3498db] hover:bg-blue-600 text-white hover:text-white font-semibold py-2 px-6 rounded-lg flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 text-sm"
                    >
                        <span className="text-xl">+</span> Nuevo Caso Clínico
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 no-print">
                <div className="flex items-center gap-2 max-w-md w-full">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Buscar por caso o especialidad..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-300 text-sm"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
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
                Mostrando {total === 0 ? 0 : (currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, total)} de {total} registros
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider border-b border-gray-100 dark:border-gray-700">
                            <th className="py-4 px-6 font-semibold">#</th>
                            <th className="py-4 px-6 font-semibold">Nombre del Caso</th>
                            <th className="py-4 px-6 font-semibold">Especialidad</th>
                            <th className="py-4 px-6 font-semibold">Fotos</th>
                            <th className="py-4 px-6 font-semibold">Video</th>
                            <th className="py-4 px-6 font-semibold">Estado</th>
                            <th className="py-4 px-6 font-semibold text-center no-print">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50 text-sm">
                        {casos.length > 0 ? (
                            casos.map((c, index) => (
                                <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-all text-gray-800 dark:text-gray-200">
                                    <td className="py-4 px-6 font-bold text-gray-500">{(currentPage - 1) * limit + index + 1}</td>
                                    <td className="py-4 px-6 font-semibold">{c.nombre}</td>
                                    <td className="py-4 px-6 font-medium text-teal-600 dark:text-teal-400">{c.especialidad?.especialidad || 'General'}</td>
                                    <td className="py-4 px-6">
                                        {c.fotos && c.fotos.length > 0 ? (
                                            <button
                                                onClick={() => openGallery(c.fotos!, c.nombre)}
                                                className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-200 transition-all"
                                            >
                                                <Image size={14} /> {c.fotos.length} foto(s)
                                            </button>
                                        ) : (
                                            <span className="text-gray-400 text-xs italic">Sin fotos</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-6">
                                        {c.video ? (
                                            <button
                                                onClick={() => { setActiveVideoUrl(c.video!); setActiveVideoTitle(c.nombre); }}
                                                className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full font-bold text-xs flex items-center gap-1.5 hover:bg-blue-200 transition-all"
                                            >
                                                <Play size={14} /> Ver Video
                                            </button>
                                        ) : (
                                            <span className="text-gray-400 text-xs italic">Sin video</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                                            c.estado === 'activo'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                        }`}>
                                            {c.estado || 'activo'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-center no-print">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => { setSelectedId(c.id); setIsModalOpen(true); }}
                                                className="bg-[#ffc107] hover:bg-yellow-600 text-white p-2 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
                                                title="Editar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                </svg>
                                            </button>
                                            {c.estado === 'activo' ? (
                                                <button
                                                    onClick={() => handleDelete(c.id)}
                                                    className="bg-[#dc3545] hover:bg-red-700 text-white p-2 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
                                                    title="Dar de Baja"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleReactivate(c.id)}
                                                    className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
                                                    title="Reactivar"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="py-8 text-center text-gray-400 italic">
                                    No se encontraron casos clínicos registrados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {total > limit && (
                <div className="mt-6 flex justify-center">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            {/* Modal Form */}
            <CasoClinicoFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchCasos}
                casoId={selectedId}
            />

            {/* Lightbox Photo Gallery Modal - Pantalla Completa con Zoom/Rotación */}
            {activeGalleryFotos.length > 0 && (
                <div
                    className="fixed inset-0 bg-black/95 backdrop-blur-md z-[10000] flex flex-col justify-between items-center p-4 sm:p-6 select-none"
                    onClick={() => setActiveGalleryFotos([])}
                >
                    {/* Header del Lightbox */}
                    <div className="w-full flex justify-between items-center text-white z-20 px-2 sm:px-6 py-2" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3">
                            <span className="bg-blue-600/80 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                                {activeGalleryIndex + 1} / {activeGalleryFotos.length}
                            </span>
                            <span className="text-xs sm:text-sm text-gray-300 font-medium hidden sm:inline">
                                {activeGalleryTitle}
                            </span>
                        </div>

                        {/* Toolbar de Zoom & Rotación */}
                        <div className="flex items-center gap-2 bg-gray-900/80 px-3 py-1.5 rounded-full border border-gray-700/80 shadow-lg" onClick={e => e.stopPropagation()}>
                            <button
                                type="button"
                                onClick={() => setGalleryZoom(prev => Math.max(0.5, prev - 0.25))}
                                className="w-7 h-7 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-full font-bold text-sm text-white transition-colors cursor-pointer"
                                title="Alejar (-)"
                            >-</button>
                            <button
                                type="button"
                                onClick={() => { setGalleryZoom(1); setGalleryRotation(0); }}
                                className="px-2.5 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 rounded-full text-white transition-colors cursor-pointer"
                                title="Restablecer"
                            >{Math.round(galleryZoom * 100)}%</button>
                            <button
                                type="button"
                                onClick={() => setGalleryZoom(prev => Math.min(3, prev + 0.25))}
                                className="w-7 h-7 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-full font-bold text-sm text-white transition-colors cursor-pointer"
                                title="Acercar (+)"
                            >+</button>
                            <div className="h-4 w-px bg-gray-700 mx-1"></div>
                            <button
                                type="button"
                                onClick={() => setGalleryRotation(prev => (prev + 90) % 360)}
                                className="px-2.5 py-1 text-xs font-bold bg-gray-800 hover:bg-gray-700 rounded-full text-gray-200 transition-colors cursor-pointer"
                                title="Rotar 90°"
                            >🔄 Rotar</button>
                        </div>

                        <button
                            onClick={() => setActiveGalleryFotos([])}
                            className="bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-full p-2 flex items-center justify-center transition-all cursor-pointer shadow-lg"
                            title="Cerrar (Esc)"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Botón Anterior */}
                    {activeGalleryFotos.length > 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleGalleryPrev(); }}
                            className="fixed left-3 sm:left-6 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-white/20 text-white rounded-full p-3 sm:p-4 transition-all duration-200 cursor-pointer backdrop-blur-md shadow-2xl z-20 border border-white/10 hover:scale-110 active:scale-95"
                        >
                            <ChevronLeft size={32} />
                        </button>
                    )}

                    {/* Imagen Central */}
                    <div
                        className="flex-1 flex flex-col items-center justify-center w-full my-auto max-h-[82vh] relative z-10 px-12 overflow-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <img
                            src={activeGalleryFotos[activeGalleryIndex]?.foto}
                            alt={activeGalleryFotos[activeGalleryIndex]?.descripcion || `Foto ${activeGalleryIndex + 1}`}
                            style={{
                                transform: `scale(${galleryZoom}) rotate(${galleryRotation}deg)`,
                                transition: 'transform 0.2s ease-out'
                            }}
                            className="max-h-[78vh] max-w-[92vw] rounded-xl object-contain shadow-2xl border border-gray-800 cursor-zoom-in"
                            onDoubleClick={() => setGalleryZoom(prev => (prev === 1 ? 1.75 : 1))}
                        />
                        {activeGalleryFotos[activeGalleryIndex]?.descripcion && (
                            <div className="mt-3 max-w-2xl text-center px-5 py-2.5 bg-gray-900/90 text-white text-xs sm:text-sm font-medium rounded-xl border border-gray-700/80 shadow-2xl backdrop-blur-md">
                                {activeGalleryFotos[activeGalleryIndex].descripcion}
                            </div>
                        )}
                    </div>

                    {/* Botón Siguiente */}
                    {activeGalleryFotos.length > 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleGalleryNext(); }}
                            className="fixed right-3 sm:right-6 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-white/20 text-white rounded-full p-3 sm:p-4 transition-all duration-200 cursor-pointer backdrop-blur-md shadow-2xl z-20 border border-white/10 hover:scale-110 active:scale-95"
                        >
                            <ChevronRight size={32} />
                        </button>
                    )}
                </div>
            )}

            {/* Video Player Modal */}
            {activeVideoUrl && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
                    <div className="relative max-w-3xl w-full bg-gray-900 rounded-2xl overflow-hidden shadow-2xl p-4">
                        <div className="flex justify-between items-center mb-3 px-2">
                            <h3 className="text-white font-bold">{activeVideoTitle}</h3>
                            <button
                                onClick={() => setActiveVideoUrl(null)}
                                className="text-gray-400 hover:text-white"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <video src={activeVideoUrl} controls autoPlay className="w-full max-h-[70vh] rounded-xl bg-black" />
                    </div>
                </div>
            )}

            {/* Manual Modal */}
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Casos Clínicos"
                sections={manualSections}
            />
        </div>
    );
};

export default CasosClinicosList;
