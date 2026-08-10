import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';
import type { RepuestoItem } from '../types';
import ManualModal, { type ManualSection } from './ManualModal';
import MantenimientoConsultorioForm from './MantenimientoConsultorioForm';
import Pagination from './Pagination';
import Swal from 'sweetalert2';
import { formatDate } from '../utils/dateUtils';
import { formatCurrency } from '../utils/formatters';
import { Wrench } from 'lucide-react';

interface PaginatedResponse {
    data: RepuestoItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const MantenimientoConsultorioList: React.FC = () => {
    const navigate = useNavigate();
    const [repuestos, setRepuestos] = useState<RepuestoItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [showManual, setShowManual] = useState(false);

    // Modal state for MantenimientoConsultorioForm
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedRepuestoId, setSelectedRepuestoId] = useState<number | null>(null);

    const limit = 10;

    const manualSections: ManualSection[] = [
        {
            title: 'Mantenimiento de Consultorios & Repuestos',
            content: 'Consulte, registre y gestione los mantenimientos preventivos/correctivos, cambio de repuestos y piezas de mano en los consultorios dentales.'
        },
        {
            title: 'Acciones Disponibles',
            content: (
                <ul className="list-disc pl-5 space-y-1">
                    <li>✏️ <strong>Editar:</strong> Modifica la información del mantenimiento registrado.</li>
                    <li>🗑️ <strong>Eliminar:</strong> Borra el registro de mantenimiento del historial.</li>
                </ul>
            )
        }
    ];

    useEffect(() => {
        fetchRepuestos();
    }, [currentPage, searchTerm]);

    const fetchRepuestos = async () => {
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: limit.toString(),
            });

            if (searchTerm) {
                params.append('search', searchTerm);
            }

            const response = await api.get<PaginatedResponse>(`/repuesto?${params}`);
            setRepuestos(response.data.data || []);
            setTotalPages(response.data.totalPages || 1);
            setTotal(response.data.total || 0);
        } catch (error) {
            console.error('Error fetching repuestos:', error);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Eliminar mantenimiento?',
            text: 'No podrá revertir esta acción',
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
                await api.delete(`/repuesto/${id}`);
                Swal.fire({
                    icon: 'success',
                    title: '¡Eliminado!',
                    text: 'Mantenimiento eliminado correctamente',
                    timer: 1500,
                    showConfirmButton: false,
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
                fetchRepuestos();
            } catch (error) {
                console.error('Error deleting repuesto:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo eliminar el registro',
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
            }
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const exportToExcel = () => {
        try {
            const excelData = repuestos.map(r => ({
                'N°': r.id,
                'Fecha': formatDate(r.fecha),
                'Consultorio': r.consultorio || '-',
                'Descripción': r.descripcion,
                'Motivo': r.motivo || '-',
                'Observaciones': r.observaciones || '-',
                'Costo Repuesto (Bs)': r.costo,
                'Mano de Obra (Bs)': r.manoObra,
                'Total (Bs)': (r.costo || 0) + (r.manoObra || 0)
            }));
            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Mantenimientos');
            XLSX.writeFile(wb, `Mantenimientos_Consultorios_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (err) {
            console.error(err);
        }
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            doc.text('Reporte de Mantenimiento de Consultorios y Repuestos', 14, 15);
            const tableData = repuestos.map(r => [
                r.id.toString(),
                formatDate(r.fecha),
                r.consultorio || '-',
                r.descripcion,
                formatCurrency(r.costo),
                formatCurrency(r.manoObra),
                formatCurrency((r.costo || 0) + (r.manoObra || 0))
            ]);
            autoTable(doc, {
                startY: 20,
                head: [['N°', 'Fecha', 'Consultorio', 'Descripción', 'Costo Rep.', 'Mano Obra', 'Total (Bs)']],
                body: tableData,
            });
            doc.save(`Mantenimientos_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="content-card">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 no-print gap-4">
                <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                    <button
                        onClick={() => navigate('/otros')}
                        className="p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 shadow-sm transition-all transform hover:-translate-y-0.5 no-print flex items-center justify-center w-10 h-10 cursor-pointer"
                        title="Volver a Otros"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-2xl shadow-sm">
                        <Wrench className="h-8 w-8 text-green-600 dark:text-green-300" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                            Mantenimiento de Consultorios
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Registro de mantenimientos, cambio de repuestos y equipos por consultorio
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    <button
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center w-10 h-10 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shadow-sm no-print cursor-pointer"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>
                    <button
                        onClick={exportToExcel}
                        className="bg-[#28a745] hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm cursor-pointer"
                        title="Exportar a Excel"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg> Excel
                    </button>
                    <button
                        onClick={exportToPDF}
                        className="bg-[#dc3545] hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm cursor-pointer"
                        title="Exportar a PDF"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg> PDF
                    </button>
                    <button
                        onClick={() => {
                            setSelectedRepuestoId(null);
                            setIsFormOpen(true);
                        }}
                        className="bg-[#3498db] hover:bg-blue-600 text-white font-semibold py-2 px-5 rounded-xl flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 text-sm cursor-pointer"
                    >
                        <span className="text-xl">+</span> Nuevo Mantenimiento
                    </button>
                </div>
            </div>

            {/* Filter / Search Bar */}
            <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 no-print">
                <div className="flex items-center gap-2 max-w-md w-full">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Buscar por consultorio, descripción, motivo..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                    {searchTerm && (
                        <button
                            onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                            className="px-3.5 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-medium rounded-xl text-sm transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap cursor-pointer"
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

            {/* Contador Mostrando x - y de z registros */}
            <div className="mb-4 text-gray-600 dark:text-gray-400 text-sm font-medium">
                Mostrando {repuestos.length === 0 ? 0 : (currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, total)} de {total} registros
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden mb-6">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">#</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Fecha</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Consultorio</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Descripción Trabajo / Repuesto</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Motivo / Notas</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Costo Repuesto</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Mano Obra</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Total (Bs)</th>
                                <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-300">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {repuestos.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                        No se encontraron registros de mantenimiento.
                                    </td>
                                </tr>
                            ) : (
                                repuestos.map((item) => {
                                    const totalTrabajo = (Number(item.costo) || 0) + (Number(item.manoObra) || 0);
                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-bold whitespace-nowrap">
                                                {item.id}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                                {formatDate(item.fecha)}
                                            </td>
                                            <td className="px-4 py-3 text-gray-900 dark:text-white font-bold whitespace-nowrap">
                                                {item.consultorio ? `Consultorio ${item.consultorio}` : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-800 dark:text-gray-200 font-medium max-w-xs">
                                                {item.descripcion}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs max-w-xs truncate">
                                                {item.motivo || item.observaciones || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap font-medium">
                                                Bs. {formatCurrency(item.costo)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap font-medium">
                                                Bs. {formatCurrency(item.manoObra)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-green-600 dark:text-green-400 whitespace-nowrap">
                                                Bs. {formatCurrency(totalTrabajo)}
                                            </td>
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                <div className="flex gap-2 justify-center">
                                                    {/* Botón Editar */}
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRepuestoId(item.id);
                                                            setIsFormOpen(true);
                                                        }}
                                                        className="p-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 inline-flex items-center justify-center cursor-pointer"
                                                        title="Editar Mantenimiento"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                        </svg>
                                                    </button>
                                                    {/* Botón Eliminar */}
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 inline-flex items-center justify-center cursor-pointer"
                                                        title="Eliminar Mantenimiento"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            )}

            {/* Form Modal */}
            <MantenimientoConsultorioForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                id={selectedRepuestoId}
                onSaveSuccess={() => {
                    fetchRepuestos();
                    setIsFormOpen(false);
                }}
            />

            {/* Manual Modal */}
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Mantenimiento de Consultorios"
                sections={manualSections}
            />
        </div>
    );
};

export default MantenimientoConsultorioList;
