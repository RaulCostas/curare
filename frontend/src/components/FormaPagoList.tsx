import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';
import Pagination from './Pagination';
import ManualModal, { type ManualSection } from './ManualModal';
import FormaPagoForm from './FormaPagoForm';
import Swal from 'sweetalert2';

interface FormaPago {
    id: number;
    forma_pago: string;
    estado: string;
}

interface PaginatedResponse {
    data: FormaPago[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const FormaPagoList: React.FC = () => {
    const navigate = useNavigate();
    const [formasPago, setFormasPago] = useState<FormaPago[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [showManual, setShowManual] = useState(false);

    // Modal state for FormaPagoForm
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedFormaPagoId, setSelectedFormaPagoId] = useState<number | null>(null);

    const limit = 10;

    const manualSections: ManualSection[] = [
        {
            title: 'Gestión de Formas de Pago',
            content: 'Aquí puede configurar los métodos de pago aceptados (ej. Efectivo, Tarjeta, Transferencia). Use "+ Nueva Forma de Pago" para añadir una.'
        },
        {
            title: 'Dar de Baja y Reactivar',
            content: 'Para formas de pago activas, el botón rojo cambia el estado a "Inactivo". Para formas inactivas, aparece un botón verde que permite reactivarlas.'
        }
    ];

    useEffect(() => {
        fetchFormasPago();
    }, [currentPage, searchTerm]);

    const fetchFormasPago = async () => {
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: limit.toString(),
            });

            if (searchTerm) {
                params.append('search', searchTerm);
            }

            const response = await api.get<PaginatedResponse>(`/forma-pago?${params}`);
            setFormasPago(response.data.data || []);
            setTotalPages(response.data.totalPages || 1);
            setTotal(response.data.total || 0);
        } catch (error) {
            console.error('Error fetching payment methods:', error);
            setFormasPago([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Dar de baja forma de pago?',
            text: 'La forma de pago pasará a estado Inactivo.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, dar de baja',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.patch(`/forma-pago/${id}`, { estado: 'inactivo' });
                await Swal.fire({ icon: 'success', title: '¡Forma de pago dada de baja!', showConfirmButton: false, timer: 1500 });
                fetchFormasPago();
            } catch (error) {
                console.error('Error:', error);
                Swal.fire('Error', 'No se pudo dar de baja', 'error');
            }
        }
    };

    const handleReactivate = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Reactivar forma de pago?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, reactivar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.patch(`/forma-pago/${id}`, { estado: 'activo' });
                await Swal.fire({ icon: 'success', title: '¡Forma de pago reactivada!', showConfirmButton: false, timer: 1500 });
                fetchFormasPago();
            } catch (error) {
                console.error('Error:', error);
                Swal.fire('Error', 'No se pudo reactivar', 'error');
            }
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const exportToExcel = () => {
        try {
            const excelData = formasPago.map(fp => ({
                'ID': fp.id,
                'Forma de Pago': fp.forma_pago,
                'Estado': fp.estado || 'activo'
            }));
            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'FormasPago');
            XLSX.writeFile(wb, `FormasPago_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (err) {
            console.error(err);
        }
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            doc.text('Lista de Formas de Pago', 14, 15);
            const tableData = formasPago.map(fp => [
                fp.id.toString(),
                fp.forma_pago,
                fp.estado || 'activo'
            ]);
            autoTable(doc, {
                startY: 20,
                head: [['ID', 'Forma de Pago', 'Estado']],
                body: tableData,
            });
            doc.save(`FormasPago_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error(err);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return <div className="text-center p-4">Cargando...</div>;
    }

    return (
        <div className="content-card p-6">
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
                    <div className="p-3 bg-cyan-100 dark:bg-cyan-900/40 rounded-2xl shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-600 dark:text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                            Formas de Pago
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Configurar métodos de pago aceptados en la clínica
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    <button
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center w-10 h-10 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shadow-sm no-print"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>
                    <button
                        onClick={exportToExcel}
                        className="bg-[#28a745] hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm"
                        title="Exportar a Excel"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg> Excel
                    </button>
                    <button
                        onClick={exportToPDF}
                        className="bg-[#dc3545] hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm"
                        title="Exportar a PDF"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg> PDF
                    </button>
                    <button
                        onClick={handlePrint}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm"
                        title="Imprimir"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg> Imprimir
                    </button>
                    <button
                        onClick={() => {
                            setSelectedFormaPagoId(null);
                            setIsFormOpen(true);
                        }}
                        className="bg-[#3498db] hover:bg-blue-600 text-white font-semibold py-2 px-5 rounded-xl flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 text-sm"
                    >
                        <span className="text-xl">+</span> Nueva Forma de Pago
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 max-w-md w-full">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Buscar forma de pago..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 text-sm"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                    {searchTerm && (
                        <button
                            type="button"
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

            <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                Mostrando {total === 0 ? 0 : (currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, total)} de {total} registros
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Forma de Pago</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {formasPago.map((fp, index) => (
                            <tr key={fp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="p-3 text-gray-700 dark:text-gray-300">{(currentPage - 1) * limit + index + 1}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300 font-medium">{fp.forma_pago}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-sm font-medium ${fp.estado?.toLowerCase() === 'activo' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                                        {fp.estado}
                                    </span>
                                </td>
                                <td className="p-3 flex gap-2">
                                    <button
                                        onClick={() => {
                                            setSelectedFormaPagoId(fp.id);
                                            setIsFormOpen(true);
                                        }}
                                        className="p-2 bg-amber-400 hover:bg-amber-500 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                        title="Editar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                    </button>
                                    {fp.estado?.toLowerCase() === 'activo' ? (
                                        <button
                                            onClick={() => handleDelete(fp.id)}
                                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                            title="Dar de baja"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                                            </svg>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleReactivate(fp.id)}
                                            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                            title="Reactivar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {formasPago.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                    {searchTerm ? 'No se encontraron resultados' : 'No hay formas de pago registradas.'}
                </div>
            )}

            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            )}

            {/* Modal Form */}
            <FormaPagoForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                id={selectedFormaPagoId}
                onSaveSuccess={() => {
                    fetchFormasPago();
                    setIsFormOpen(false);
                }}
            />

            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Formas de Pago"
                sections={manualSections}
            />
        </div>
    );
};

export default FormaPagoList;
