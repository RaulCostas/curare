import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';
import type { ConsentimientoPlantilla } from '../types';
import ManualModal, { type ManualSection } from './ManualModal';
import Pagination from './Pagination';
import Swal from 'sweetalert2';
import ConsentimientosPlantillaForm from './ConsentimientosPlantillaForm';
import { FileText } from 'lucide-react';

const ConsentimientosPlantillasList: React.FC = () => {
    const navigate = useNavigate();
    const [plantillas, setPlantillas] = useState<ConsentimientoPlantilla[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showManual, setShowManual] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    // View Consentimiento Modal State
    const [viewPlantilla, setViewPlantilla] = useState<ConsentimientoPlantilla | null>(null);

    const limit = 10;

    // Strip HTML tags to show plain text preview
    const stripHtml = (html: string): string => {
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html || '';
        return tmp.textContent || tmp.innerText || '';
    };

    const manualSections: ManualSection[] = [
        {
            title: 'Plantillas de Consentimientos Informados',
            content: 'Aquí puede administrar las plantillas de Consentimiento Informado redactadas para los pacientes.'
        },
        {
            title: 'Variables Automáticas',
            content: 'Use etiquetas como {{NOMBRE_PACIENTE}} o {{CI_PACIENTE}} en el texto. Estas serán reemplazadas por los datos del paciente automáticamente.'
        }
    ];

    useEffect(() => {
        fetchPlantillas();
    }, [searchTerm]);

    const fetchPlantillas = async () => {
        try {
            const response = await api.get<ConsentimientoPlantilla[]>(`/consentimientos-plantillas?search=${encodeURIComponent(searchTerm)}`);
            setPlantillas(response.data || []);
        } catch (error) {
            console.error('Error fetching plantillas:', error);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Eliminar plantilla?',
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
                await api.delete(`/consentimientos-plantillas/${id}`);
                await Swal.fire({ icon: 'success', title: '¡Plantilla eliminada!', showConfirmButton: false, timer: 1500 });
                fetchPlantillas();
            } catch (error) {
                console.error('Error:', error);
                Swal.fire('Error', 'No se pudo eliminar', 'error');
            }
        }
    };

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(
            plantillas.map(p => ({
                ID: p.id,
                Título: p.titulo,
                Especialidad: (p as any).especialidad?.especialidad || 'General',
                Estado: p.activo ? 'Activo' : 'Inactivo'
            }))
        );
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Consentimientos');
        XLSX.writeFile(workbook, `ConsentimientosPlantillas_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            doc.text('Lista de Plantillas de Consentimiento', 14, 15);
            const tableData = plantillas.map(p => [
                p.id.toString(),
                p.titulo,
                (p as any).especialidad?.especialidad || 'General',
                p.activo ? 'Activo' : 'Inactivo'
            ]);
            autoTable(doc, {
                startY: 20,
                head: [['ID', 'Título', 'Especialidad', 'Estado']],
                body: tableData,
            });
            doc.save(`ConsentimientosPlantillas_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error(err);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const totalPages = Math.ceil(plantillas.length / limit) || 1;
    const paginatedPlantillas = plantillas.slice((currentPage - 1) * limit, currentPage * limit);

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
                        <FileText className="h-8 w-8 text-teal-600 dark:text-teal-300" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                            Plantillas de Consentimientos
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Administrar plantillas de consentimientos informados para pacientes
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
                        <span className="text-xl">+</span> Nueva Plantilla
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 no-print">
                <div className="flex items-center gap-2 max-w-md w-full">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Buscar plantilla..."
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
                Mostrando {plantillas.length === 0 ? 0 : (currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, plantillas.length)} de {plantillas.length} registros
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider border-b border-gray-100 dark:border-gray-700">
                            <th className="py-4 px-6 font-semibold">#</th>
                            <th className="py-4 px-6 font-semibold">Título del Consentimiento</th>
                            <th className="py-4 px-6 font-semibold">Especialidad</th>
                            <th className="py-4 px-6 font-semibold">Resumen</th>
                            <th className="py-4 px-6 font-semibold text-center no-print">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50 text-sm">
                        {paginatedPlantillas.length > 0 ? (
                            paginatedPlantillas.map((p, index) => (
                                <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-all text-gray-800 dark:text-gray-200">
                                    <td className="py-4 px-6 font-bold text-gray-500">{(currentPage - 1) * limit + index + 1}</td>
                                    <td className="py-4 px-6 font-bold text-gray-800 dark:text-white">
                                        {p.titulo}
                                    </td>
                                    <td className="py-4 px-6 font-medium text-teal-600 dark:text-teal-400">
                                        {(p as any).especialidad?.especialidad || 'General'}
                                    </td>
                                    <td className="py-4 px-6 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                        {stripHtml(p.contenido || '').slice(0, 100) || '—'}
                                    </td>
                                    <td className="py-4 px-6 text-center no-print">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => setViewPlantilla(p)}
                                                className="bg-teal-600 hover:bg-teal-700 text-white p-2 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
                                                title="Ver Consentimiento"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => { setSelectedId(p.id); setIsModalOpen(true); }}
                                                className="p-2 bg-amber-400 hover:bg-amber-500 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                                title="Editar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(p.id)}
                                                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                                title="Eliminar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-gray-400 italic">
                                    No se encontraron plantillas registradas.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {plantillas.length > limit && (
                <div className="mt-6 flex justify-center">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            {/* Modal Form */}
            <ConsentimientosPlantillaForm
                isOpen={isModalOpen}
                id={selectedId}
                onClose={() => setIsModalOpen(false)}
                onSaved={fetchPlantillas}
            />

            {/* Modal Ver Consentimiento (solo lectura) */}
            {viewPlantilla && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full border border-gray-200 dark:border-gray-700 max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center bg-gray-50 dark:bg-gray-700/50 rounded-t-2xl">
                            <div>
                                <h3 className="text-xl font-extrabold text-gray-800 dark:text-white flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    {viewPlantilla.titulo}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                                    Vista de lectura del consentimiento informado
                                </p>
                            </div>
                        </div>
                        {/* Body */}
                        <div className="p-6 overflow-y-auto flex-grow">
                            <div
                                className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: viewPlantilla.contenido || '<p class="text-gray-400 italic">Sin contenido</p>' }}
                            />
                        </div>
                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 rounded-b-2xl flex justify-end">
                            <button
                                onClick={() => setViewPlantilla(null)}
                                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-semibold py-2 px-6 rounded-lg flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 text-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
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
                title="Manual de Plantillas de Consentimiento"
                sections={manualSections}
            />
        </div>
    );
};

export default ConsentimientosPlantillasList;
