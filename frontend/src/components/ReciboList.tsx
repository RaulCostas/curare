import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';
import type { ReciboItem } from '../types';
import ManualModal, { type ManualSection } from './ManualModal';
import ReciboForm from './ReciboForm';
import Pagination from './Pagination';
import Swal from 'sweetalert2';
import { formatDate } from '../utils/dateUtils';
import { formatCurrency } from '../utils/formatters';
import { FileText, Printer } from 'lucide-react';

interface PaginatedResponse {
    data: ReciboItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const ReciboList: React.FC = () => {
    const navigate = useNavigate();
    const [recibos, setRecibos] = useState<ReciboItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [showManual, setShowManual] = useState(false);

    // Modal state for ReciboForm
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedReciboId, setSelectedReciboId] = useState<number | null>(null);

    const limit = 10;

    const manualSections: ManualSection[] = [
        {
            title: 'Gestión de Recibos',
            content: 'Consulte, cree, edite e imprima recibos de ingresos y pagos generales de la clínica.'
        },
        {
            title: 'Acciones Disponibles',
            content: (
                <ul className="list-disc pl-5 space-y-1">
                    <li>🖨️ <strong>Imprimir:</strong> Genera e imprime la versión oficial del Recibo.</li>
                    <li>✏️ <strong>Editar:</strong> Modifica los datos del recibo existente.</li>
                    <li>🗑️ <strong>Eliminar:</strong> Cancela y elimina el recibo del sistema.</li>
                </ul>
            )
        }
    ];

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    useEffect(() => {
        fetchRecibos();
    }, [currentPage, debouncedSearch]);

    const fetchRecibos = async () => {
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: limit.toString(),
            });

            if (debouncedSearch) {
                params.append('search', debouncedSearch);
            }

            const response = await api.get<PaginatedResponse>(`/recibo?${params}`);
            setRecibos(response.data.data || []);
            setTotalPages(response.data.totalPages || 1);
            setTotal(response.data.total || 0);
        } catch (error) {
            console.error('Error fetching recibos:', error);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Eliminar recibo?',
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
                await api.delete(`/recibo/${id}`);
                Swal.fire({
                    icon: 'success',
                    title: '¡Eliminado!',
                    text: 'Recibo eliminado correctamente',
                    timer: 1500,
                    showConfirmButton: false,
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
                fetchRecibos();
            } catch (error) {
                console.error('Error deleting recibo:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo eliminar el recibo',
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
            }
        }
    };

    const handlePrintRecibo = (item: ReciboItem) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const isDolares = item.moneda?.toUpperCase() === 'DOLARES';
        const simbolo = isDolares ? '$us' : 'Bs.';
        const montoFormatted = formatCurrency(item.monto);
        const fechaStr = formatDate(item.fecha);

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Recibo N° ${item.accessId || item.id}</title>
                <style>
                    @page { size: A4 portrait; margin: 15mm; }
                    body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; color: #1e293b; }
                    
                    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 3px solid #3498db; }
                    .header-left { display: flex; align-items: center; gap: 20px; }
                    .header img { height: 60px; object-fit: contain; }
                    .header h1 { color: #2c3e50; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; }
                    
                    .recibo-box { margin-bottom: 25px; padding: 20px 24px; background-color: #f8f9fa; border-left: 6px solid #3498db; border-radius: 4px; }
                    .info-row { margin-bottom: 14px; font-size: 14px; font-family: Arial, sans-serif; display: flex; align-items: baseline; }
                    .info-row:last-child { margin-bottom: 0; }
                    .info-label { font-weight: bold; color: #1e293b; min-width: 140px; text-transform: uppercase; }
                    .info-value { color: #1e293b; letter-spacing: 0.3px; flex: 1; border-bottom: 1px dotted #cbd5e1; padding-bottom: 3px; }

                    .signature-area { margin-top: 100px; display: flex; justify-content: space-around; text-align: center; }
                    .signature-line { width: 220px; margin: 0 auto 8px auto; border-top: 1px solid #334155; }
                    .signature-name { font-weight: bold; font-size: 13px; color: #1e293b; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="header-left">
                        <img src="/logo-curare.png" alt="Curare Centro Dental">
                        <h1>RECIBO</h1>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 18px; font-weight: bold; color: #dc2626;">N° ${item.accessId || item.id}</div>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Fecha: ${fechaStr}</div>
                    </div>
                </div>

                <div class="recibo-box">
                    <div class="info-row">
                        <span class="info-label">NOMBRE:</span>
                        <span class="info-value" style="font-weight: bold; font-size: 16px;">${item.nombre || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">CONCEPTO:</span>
                        <span class="info-value">${item.concepto || 'Sin concepto'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">MONTO:</span>
                        <span class="info-value" style="font-weight: bold; font-size: 18px; color: #1e3a8a;">${simbolo} ${montoFormatted}</span>
                    </div>
                </div>

                <div class="signature-area">
                    <div>
                        <div class="signature-line"></div>
                        <div class="signature-name">Firma Conforme</div>
                    </div>
                    <div>
                        <div class="signature-line"></div>
                        <div class="signature-name">Entregué Conforme</div>
                    </div>
                </div>

                <script>
                    window.onload = function() {
                        setTimeout(function() { window.print(); }, 500);
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const exportToExcel = () => {
        try {
            const excelData = recibos.map(r => ({
                'N° / Access ID': r.accessId || r.id,
                'Fecha': formatDate(r.fecha),
                'Nombre': r.nombre,
                'Concepto': r.concepto || '-',
                'Moneda': r.moneda || 'BOLIVIANOS',
                'Monto': r.monto
            }));
            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Recibos');
            XLSX.writeFile(wb, `Recibos_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (err) {
            console.error(err);
        }
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            doc.text('Reporte General de Recibos', 14, 15);
            const tableData = recibos.map(r => [
                (r.accessId || r.id).toString(),
                formatDate(r.fecha),
                r.nombre,
                r.concepto || '-',
                r.moneda || 'BOLIVIANOS',
                r.moneda?.toUpperCase() === 'DOLARES' ? `$us ${formatCurrency(r.monto)}` : `Bs. ${formatCurrency(r.monto)}`
            ]);
            autoTable(doc, {
                startY: 20,
                head: [['N°', 'Fecha', 'Nombre', 'Concepto', 'Moneda', 'Monto']],
                body: tableData,
            });
            doc.save(`Recibos_${new Date().toISOString().split('T')[0]}.pdf`);
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
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-2xl shadow-sm">
                        <FileText className="h-8 w-8 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                            Módulo de Recibos
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Gestión, consulta e impresión de recibos de caja generales
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
                            setSelectedReciboId(null);
                            setIsFormOpen(true);
                        }}
                        className="bg-[#3498db] hover:bg-blue-600 text-white font-semibold py-2 px-5 rounded-xl flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 text-sm cursor-pointer"
                    >
                        <span className="text-xl">+</span> Nuevo Recibo
                    </button>
                </div>
            </div>

            {/* Filter / Search Bar */}
            <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 no-print">
                <div className="flex items-center gap-2 max-w-md w-full">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Buscar por nombre, concepto o N°..."
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
                Mostrando {recibos.length === 0 ? 0 : (currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, total)} de {total} registros
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden mb-6">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">N° Recibo</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Fecha</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Nombre / Beneficiario</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Concepto</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Moneda</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Monto</th>
                                <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-300">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {recibos.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                        No se encontraron recibos registrados.
                                    </td>
                                </tr>
                            ) : (
                                recibos.map((item) => {
                                    const isDolares = item.moneda?.toUpperCase() === 'DOLARES';
                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                                            <td className="px-4 py-3 text-blue-600 dark:text-blue-400 font-bold whitespace-nowrap">
                                                {item.accessId || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                                {formatDate(item.fecha)}
                                            </td>
                                            <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                                                {item.nombre}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs max-w-xs truncate">
                                                {item.concepto || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-xs font-semibold whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded-full ${isDolares ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'}`}>
                                                    {item.moneda || 'BOLIVIANOS'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                                {isDolares ? `$us ${formatCurrency(item.monto)}` : `Bs. ${formatCurrency(item.monto)}`}
                                            </td>
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                <div className="flex gap-2 justify-center">
                                                    {/* Botón Imprimir Recibo */}
                                                    <button
                                                        onClick={() => handlePrintRecibo(item)}
                                                        className="p-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 inline-flex items-center justify-center cursor-pointer"
                                                        title="Imprimir Recibo de Caja"
                                                    >
                                                        <Printer size={18} />
                                                    </button>
                                                    {/* Botón Editar */}
                                                    <button
                                                        onClick={() => {
                                                            setSelectedReciboId(item.id);
                                                            setIsFormOpen(true);
                                                        }}
                                                        className="p-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 inline-flex items-center justify-center cursor-pointer"
                                                        title="Editar Recibo"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                        </svg>
                                                    </button>
                                                    {/* Botón Eliminar */}
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 inline-flex items-center justify-center cursor-pointer"
                                                        title="Eliminar Recibo"
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
            <ReciboForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                id={selectedReciboId}
                onSaveSuccess={() => {
                    fetchRecibos();
                    setIsFormOpen(false);
                }}
            />

            {/* Manual Modal */}
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Recibos"
                sections={manualSections}
            />
        </div>
    );
};

export default ReciboList;
