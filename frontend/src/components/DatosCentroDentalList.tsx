import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';
import type { DatosCentroDental } from '../types';
import ManualModal, { type ManualSection } from './ManualModal';
import Pagination from './Pagination';
import DatosCentroDentalForm from './DatosCentroDentalForm';
import Swal from 'sweetalert2';
import { Building2 } from 'lucide-react';

const DatosCentroDentalList: React.FC = () => {
    const navigate = useNavigate();
    const [datos, setDatos] = useState<DatosCentroDental[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [showManual, setShowManual] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const limit = 10;

    const manualSections: ManualSection[] = [
        {
            title: 'Datos del Centro Dental',
            content: 'Aquí se administra la información de contacto e institucional del consultorio (nombre, dirección, teléfonos de atención, emergencias y horarios).'
        }
    ];

    useEffect(() => {
        fetchDatos();
    }, [currentPage, searchTerm]);

    const fetchDatos = async () => {
        try {
            const response = await api.get<DatosCentroDental[]>(`/datos-centro-dental`);
            let filteredData = response.data || [];
            
            if (searchTerm) {
                const lowerSearch = searchTerm.toLowerCase();
                filteredData = filteredData.filter(d => 
                    (d.nombre_centro || (d as any).nombre || '').toLowerCase().includes(lowerSearch) || 
                    d.direccion?.toLowerCase().includes(lowerSearch)
                );
            }

            const startIndex = (currentPage - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedData = filteredData.slice(startIndex, endIndex);

            setDatos(paginatedData);
            setTotalPages(Math.ceil(filteredData.length / limit) || 1);
            setTotal(filteredData.length);
        } catch (error) {
            console.error('Error fetching datos centro:', error);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Dar de baja registro?',
            text: 'El registro pasará a estado Inactivo.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, dar de baja',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.patch(`/datos-centro-dental/${id}`, { estado: 'inactivo' });
                await Swal.fire({ icon: 'success', title: '¡Registro dado de baja!', showConfirmButton: false, timer: 1500 });
                fetchDatos();
            } catch (error) {
                console.error('Error:', error);
                Swal.fire('Error', 'No se pudo dar de baja', 'error');
            }
        }
    };

    const handleReactivate = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Reactivar registro?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, reactivar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.patch(`/datos-centro-dental/${id}`, { estado: 'activo' });
                await Swal.fire({ icon: 'success', title: '¡Registro reactivado!', showConfirmButton: false, timer: 1500 });
                fetchDatos();
            } catch (error) {
                console.error('Error:', error);
                Swal.fire('Error', 'No se pudo reactivar', 'error');
            }
        }
    };

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(
            datos.map(d => ({
                ID: d.id,
                Nombre: d.nombre_centro || (d as any).nombre,
                Dirección: d.direccion,
                Teléfono: d.telefono,
                Celular: d.celular,
                Emergencias: d.emergencias,
                Email: d.email,
                Estado: d.estado || 'activo'
            }))
        );
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'DatosCentro');
        XLSX.writeFile(workbook, `DatosCentroDental_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            doc.text('Datos del Centro Dental', 14, 15);
            const tableData = datos.map(d => [
                d.id.toString(),
                d.nombre_centro || (d as any).nombre || '',
                d.direccion || '',
                d.telefono || d.celular || '',
                d.email || ''
            ]);
            autoTable(doc, {
                startY: 20,
                head: [['ID', 'Nombre', 'Dirección', 'Teléfono', 'Email']],
                body: tableData,
            });
            doc.save(`DatosCentroDental_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error(err);
        }
    };

    const handlePrint = () => {
        window.print();
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
                        <Building2 className="h-8 w-8 text-teal-600 dark:text-teal-300" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                            Datos del Centro Dental
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Administrar información pública, teléfonos e información institucional
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
                        <span className="text-xl">+</span> Nuevo Registro
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 no-print">
                <div className="flex items-center gap-2 max-w-md w-full">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Buscar por nombre o dirección..."
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
                Mostrando {datos.length === 0 ? 0 : (currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, datos.length)} de {datos.length} registros
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider border-b border-gray-100 dark:border-gray-700">
                            <th className="py-4 px-6 font-semibold">Nombre del Centro</th>
                            <th className="py-4 px-6 font-semibold">Dirección</th>
                            <th className="py-4 px-6 font-semibold">Contacto / Celular</th>
                            <th className="py-4 px-6 font-semibold">Emergencias</th>
                            <th className="py-4 px-6 font-semibold">Estado</th>
                            <th className="py-4 px-6 font-semibold text-center no-print">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50 text-sm">
                        {datos.length > 0 ? (
                            datos.map(d => (
                                <tr key={d.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-all text-gray-800 dark:text-gray-200">
                                    <td className="py-4 px-6 font-bold text-gray-800 dark:text-white">
                                        {d.nombre_centro || (d as any).nombre}
                                    </td>
                                    <td className="py-4 px-6 font-medium text-gray-600 dark:text-gray-300">
                                        {d.direccion || '-'}
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="text-xs space-y-1">
                                            {d.celular && <div className="text-gray-800 dark:text-gray-200">{d.celular}</div>}
                                            {d.telefono && <div className="text-gray-800 dark:text-gray-200">{d.telefono}</div>}
                                            {d.email && <div className="text-gray-600 dark:text-gray-400">{d.email}</div>}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 font-medium text-gray-800 dark:text-gray-200">
                                        {d.emergencias || '-'}
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                                            d.estado === 'activo'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                        }`}>
                                            {d.estado || 'activo'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-center no-print">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => { setSelectedId(d.id); setIsModalOpen(true); }}
                                                className="bg-[#ffc107] hover:bg-yellow-600 text-white p-2 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
                                                title="Editar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                </svg>
                                            </button>
                                            {d.estado === 'activo' ? (
                                                <button
                                                    onClick={() => handleDelete(d.id)}
                                                    className="bg-[#dc3545] hover:bg-red-700 text-white p-2 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
                                                    title="Dar de Baja"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleReactivate(d.id)}
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
                                <td colSpan={6} className="py-8 text-center text-gray-400 italic">
                                    No se encontraron datos registrados.
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
            <DatosCentroDentalForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaveSuccess={fetchDatos}
                id={selectedId}
            />

            {/* Manual Modal */}
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Datos del Centro Dental"
                sections={manualSections}
            />
        </div>
    );
};

export default DatosCentroDentalList;
