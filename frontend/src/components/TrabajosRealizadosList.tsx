import React, { useEffect, useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';
import type { Doctor } from '../types';
import ManualModal, { type ManualSection } from './ManualModal';
import Pagination from './Pagination';
import SearchableSelect, { type Option } from './SearchableSelect';
import { formatCurrency } from '../utils/formatters';

interface TrabajosNoPagadosResponse {
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    sumTotal: number;
}

interface TrabajosPagadosResponse {
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    sumTotalNeto: number;
    sumCostoLab: number;
    sumSubTotal: number;
}

const TrabajosRealizadosList: React.FC = () => {
    // Current user info for doctor linking
    const userStr = localStorage.getItem('user');
    const currentUser = useMemo(() => {
        try {
            return userStr ? JSON.parse(userStr) : null;
        } catch {
            return null;
        }
    }, [userStr]);
    const isDoctorLocked = Boolean(currentUser?.doctorId);

    // Doctor selection
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState<number>(0);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

    // Tabs: 'no-pagados' | 'pagados'
    const [activeTab, setActiveTab] = useState<'no-pagados' | 'pagados'>('no-pagados');

    // Data lists
    const [noPagados, setNoPagados] = useState<any[]>([]);
    const [pagados, setPagados] = useState<any[]>([]);

    // Totals & Pagination
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalRecords, setTotalRecords] = useState<number>(0);
    const [sumTotalNoPagados, setSumTotalNoPagados] = useState<number>(0);
    const [sumTotalNetoPagados, setSumTotalNetoPagados] = useState<number>(0);
    const [sumCostoLabPagados, setSumCostoLabPagados] = useState<number>(0);
    const [sumSubTotalPagados, setSumSubTotalPagados] = useState<number>(0);

    // Search and loading
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [showManual, setShowManual] = useState<boolean>(false);

    const limit = 10;

    const manualSections: ManualSection[] = [
        {
            title: 'Módulo de Trabajos Realizados',
            content: 'Este módulo permite a los doctores y administradores consultar el registro detallado de los tratamientos clínicos realizados por doctor, clasificados según su estado de pago.'
        },
        {
            title: 'Vinculación y Privacidad',
            content: 'Si su cuenta de usuario está vinculada a un doctor, únicamente podrá consultar sus propios tratamientos clínicos y honorarios. Los administradores pueden consultar el registro de cualquier doctor.'
        },
        {
            title: 'Pestaña: Trabajos No Pagados',
            content: 'Muestra los tratamientos clínicos registrados en la historia clínica que aún están pendientes de liquidación (pagado = NO).\nColumnas: Fecha Cita, Paciente, Tratamiento, Pieza(s), Cantidad y Total Bs.'
        },
        {
            title: 'Pestaña: Trabajos Pagados',
            content: 'Muestra el historial de tratamientos que ya han sido liquidados o cancelados al doctor (pagado = SI).\nColumnas: Fecha Pago, Paciente, Tratamiento, Pieza(s), Cantidad, Total Neto, Descuento, Costo Laboratorio y Sub Total.'
        }
    ];

    // Cargar lista de doctores al montar
    useEffect(() => {
        fetchDoctors();
    }, []);

    // Cargar datos cuando cambia el doctor, la pestaña, la página o el término de búsqueda
    useEffect(() => {
        if (selectedDoctorId > 0) {
            if (activeTab === 'no-pagados') {
                fetchNoPagados();
            } else {
                fetchPagados();
            }
        } else {
            setNoPagados([]);
            setPagados([]);
            setTotalPages(1);
            setTotalRecords(0);
            setSumTotalNoPagados(0);
            setSumTotalNetoPagados(0);
            setSumCostoLabPagados(0);
            setSumSubTotalPagados(0);
        }
    }, [selectedDoctorId, activeTab, currentPage, searchTerm]);

    const fetchDoctors = async () => {
        try {
            const response = await api.get('/doctors?limit=1000');
            const list = Array.isArray(response.data?.data)
                ? response.data.data
                : (Array.isArray(response.data) ? response.data : []);
            const active = list.filter((d: any) => !d.estado || d.estado.toLowerCase() === 'activo');
            active.sort((a: any, b: any) => {
                const pA = (a.paterno || '').trim().toLowerCase();
                const pB = (b.paterno || '').trim().toLowerCase();
                if (pA !== pB) return pA.localeCompare(pB, 'es', { sensitivity: 'base' });
                return (a.nombre || '').localeCompare(b.nombre || '', 'es', { sensitivity: 'base' });
            });
            setDoctors(active);

            // Si el usuario tiene doctorId vinculado, fijamos ese doctor obligatoriamente
            if (currentUser?.doctorId) {
                const myDoc = active.find((d: any) => d.id === Number(currentUser.doctorId));
                if (myDoc) {
                    setSelectedDoctorId(myDoc.id);
                    setSelectedDoctor(myDoc);
                    return;
                }
            }

            // Si no tiene doctor vinculado (Administrador/Recepción), dejamos el selector vacío
            setSelectedDoctorId(0);
            setSelectedDoctor(null);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    const handleDoctorChange = (idVal: number | string) => {
        if (isDoctorLocked) return; // Bloqueado para doctores
        const idNum = Number(idVal) || 0;
        setSelectedDoctorId(idNum);
        const doc = doctors.find(d => d.id === idNum) || null;
        setSelectedDoctor(doc);
        setCurrentPage(1);
    };

    const fetchNoPagados = async () => {
        if (!selectedDoctorId) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({
                doctorId: selectedDoctorId.toString(),
                page: currentPage.toString(),
                limit: limit.toString()
            });
            if (searchTerm.trim()) params.append('search', searchTerm.trim());

            const response = await api.get<TrabajosNoPagadosResponse>(`/historia-clinica/trabajos-realizados/no-pagados?${params}`);
            setNoPagados(response.data.data || []);
            setTotalPages(response.data.totalPages || 1);
            setTotalRecords(response.data.total || 0);
            setSumTotalNoPagados(response.data.sumTotal || 0);
        } catch (error) {
            console.error('Error fetching trabajos no pagados:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPagados = async () => {
        if (!selectedDoctorId) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({
                doctorId: selectedDoctorId.toString(),
                page: currentPage.toString(),
                limit: limit.toString()
            });
            if (searchTerm.trim()) params.append('search', searchTerm.trim());

            const response = await api.get<TrabajosPagadosResponse>(`/historia-clinica/trabajos-realizados/pagados?${params}`);
            setPagados(response.data.data || []);
            setTotalPages(response.data.totalPages || 1);
            setTotalRecords(response.data.total || 0);
            setSumTotalNetoPagados(response.data.sumTotalNeto || 0);
            setSumCostoLabPagados(response.data.sumCostoLab || 0);
            setSumSubTotalPagados(response.data.sumSubTotal || 0);
        } catch (error) {
            console.error('Error fetching trabajos pagados:', error);
        } finally {
            setLoading(false);
        }
    };

    const doctorOptions: Option[] = useMemo(() => {
        return doctors.map(d => ({
            id: d.id,
            label: `Dr(a). ${d.paterno || ''} ${d.materno || ''} ${d.nombre || ''}`.trim(),
            subLabel: d.especialidad?.especialidad ? `Esp: ${d.especialidad.especialidad}` : undefined,
            searchString: `${d.nombre || ''} ${d.paterno || ''} ${d.materno || ''} ${d.especialidad?.especialidad || ''}`
        }));
    }, [doctors]);

    const formatPatientName = (p: any) => {
        if (!p) return 'N/A';
        return `${p.paterno || ''} ${p.materno || ''} ${p.nombre || ''}`.trim() || 'N/A';
    };

    const formatDateDisplay = (dateStr: string | Date | null | undefined) => {
        if (!dateStr) return '-';
        const str = String(dateStr).split('T')[0];
        const [y, m, d] = str.split('-');
        if (!y || !m || !d) return str;
        return `${d}/${m}/${y}`;
    };

    const exportToExcel = () => {
        if (!selectedDoctorId) return;
        try {
            const docName = selectedDoctor ? `${selectedDoctor.paterno}_${selectedDoctor.nombre}` : 'Doctor';
            let excelData: any[] = [];
            let fileName = '';

            if (activeTab === 'no-pagados') {
                fileName = `Trabajos_No_Pagados_${docName}_${new Date().toISOString().split('T')[0]}.xlsx`;
                excelData = noPagados.map((item, idx) => ({
                    '#': (currentPage - 1) * limit + idx + 1,
                    'Fecha Cita': formatDateDisplay(item.fecha),
                    'Paciente': formatPatientName(item.paciente),
                    'Tratamiento': item.tratamiento || item.proformaDetalle?.arancel?.detalle || 'N/A',
                    'Pieza(s)': item.pieza || '-',
                    'Cant': item.cantidad || 1,
                    'Total Bs': Number(item.precio) || 0
                }));
            } else {
                fileName = `Trabajos_Pagados_${docName}_${new Date().toISOString().split('T')[0]}.xlsx`;
                excelData = pagados.map((item, idx) => ({
                    '#': (currentPage - 1) * limit + idx + 1,
                    'Fecha Pago': formatDateDisplay(item.fechaPago),
                    'Paciente': formatPatientName(item.paciente),
                    'Tratamiento': item.tratamiento,
                    'Pieza(s)': item.pieza || '-',
                    'Cant': item.cantidad || 1,
                    'Total Neto Bs': item.totalNeto,
                    'Desc. %': item.descuento,
                    'Costo Lab Bs': item.costoLab,
                    'Sub Total Bs': item.subTotal
                }));
            }

            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, activeTab === 'no-pagados' ? 'No Pagados' : 'Pagados');
            XLSX.writeFile(wb, fileName);
        } catch (err) {
            console.error('Error exporting to Excel:', err);
        }
    };

    const exportToPDF = () => {
        if (!selectedDoctorId) return;
        try {
            const doc = new jsPDF('landscape');
            const docName = selectedDoctor ? `Dr(a). ${selectedDoctor.paterno} ${selectedDoctor.nombre}` : '';
            const title = activeTab === 'no-pagados' ? 'Trabajos No Pagados' : 'Trabajos Pagados';

            doc.setFontSize(16);
            doc.text(`${title} - ${docName}`, 14, 15);
            doc.setFontSize(10);
            doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 14, 22);

            if (activeTab === 'no-pagados') {
                const tableData = noPagados.map((item, idx) => [
                    ((currentPage - 1) * limit + idx + 1).toString(),
                    formatDateDisplay(item.fecha),
                    formatPatientName(item.paciente),
                    item.tratamiento || item.proformaDetalle?.arancel?.detalle || 'N/A',
                    item.pieza || '-',
                    (item.cantidad || 1).toString(),
                    `Bs ${formatCurrency(item.precio)}`
                ]);

                autoTable(doc, {
                    startY: 28,
                    head: [['#', 'Fecha Cita', 'Paciente', 'Tratamiento', 'Pieza(s)', 'Cant', 'Total Bs']],
                    body: tableData,
                });
            } else {
                const tableData = pagados.map((item, idx) => [
                    ((currentPage - 1) * limit + idx + 1).toString(),
                    formatDateDisplay(item.fechaPago),
                    formatPatientName(item.paciente),
                    item.tratamiento,
                    item.pieza || '-',
                    (item.cantidad || 1).toString(),
                    `Bs ${formatCurrency(item.totalNeto)}`,
                    item.descuento ? `${item.descuento}%` : '-',
                    item.costoLab > 0 ? `Bs ${formatCurrency(item.costoLab)}` : '-',
                    `Bs ${formatCurrency(item.subTotal)}`
                ]);

                autoTable(doc, {
                    startY: 28,
                    head: [['#', 'Fecha Pago', 'Paciente', 'Tratamiento', 'Pieza(s)', 'Cant', 'Total Neto', 'Desc.', 'Costo Lab', 'Sub Total']],
                    body: tableData,
                });
            }

            doc.save(`Trabajos_${activeTab}_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error('Error exporting to PDF:', err);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <div className="content-card">
            {/* Header exactamente igual a EspecialidadList.tsx */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 no-print gap-4">
                <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                            Trab. Realizados
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Consulta y control de tratamientos clínicos pagados y pendientes por doctor
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
                </div>
            </div>

            {/* Tabs idénticas al módulo de Pacientes Deudores */}
            <div className="no-print flex flex-wrap border-b border-gray-200 dark:border-gray-600 mb-5 bg-white dark:bg-gray-800 rounded-t-lg pt-2 px-2 transition-colors">
                <div
                    onClick={() => {
                        setActiveTab('no-pagados');
                        setCurrentPage(1);
                    }}
                    className={`px-5 py-2.5 cursor-pointer border-b-4 flex items-center gap-2 transition-all duration-200 text-base ${activeTab === 'no-pagados'
                        ? 'border-blue-500 text-blue-500 font-bold dark:border-blue-400 dark:text-blue-400'
                        : 'border-transparent text-gray-600 dark:text-gray-400 font-normal hover:text-blue-500 dark:hover:text-blue-300'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    Trabajos No Pagados
                </div>
                <div
                    onClick={() => {
                        setActiveTab('pagados');
                        setCurrentPage(1);
                    }}
                    className={`px-5 py-2.5 cursor-pointer border-b-4 flex items-center gap-2 transition-all duration-200 text-base ${activeTab === 'pagados'
                        ? 'border-blue-500 text-blue-500 font-bold dark:border-blue-400 dark:text-blue-400'
                        : 'border-transparent text-gray-600 dark:text-gray-400 font-normal hover:text-blue-500 dark:hover:text-blue-300'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Trabajos Pagados
                </div>
            </div>

            {/* Barra de Filtros: Doctor Selector y Search Bar al estilo EspecialidadList.tsx */}
            <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 no-print">
                <div className="flex items-center gap-4 flex-wrap md:flex-nowrap w-full">
                    <div className="w-full md:w-80 flex-shrink-0">
                        {isDoctorLocked && selectedDoctor ? (
                            <div className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-center justify-between">
                                <span className="font-semibold text-gray-800 dark:text-white text-sm truncate">
                                    Dr(a). {selectedDoctor.paterno} {selectedDoctor.nombre}
                                </span>
                                <span className="text-[10px] uppercase font-bold bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded-full">
                                    Exclusivo
                                </span>
                            </div>
                        ) : (
                            <SearchableSelect
                                options={doctorOptions}
                                value={selectedDoctorId}
                                onChange={handleDoctorChange}
                                placeholder="-- Seleccione Doctor --"
                                searchPlaceholder="Buscar doctor..."
                                className="text-sm"
                            />
                        )}
                    </div>

                    <div className="flex items-center gap-2 flex-grow max-w-md w-full">
                        <div className="relative flex-grow">
                            <input
                                type="text"
                                placeholder="Buscar por paciente o tratamiento..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-sm"
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
            </div>

            {/* Mensaje de conteo exacto a EspecialidadList.tsx */}
            <div className="mb-2 text-gray-600 dark:text-gray-400 text-sm">
                Mostrando {totalRecords === 0 ? 0 : (currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, totalRecords)} de {totalRecords} registros
            </div>

            {/* TABLA 1: TRABAJOS NO PAGADOS */}
            {activeTab === 'no-pagados' && (
                <>
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider text-center w-12">#</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha Cita</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Paciente</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tratamiento</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider text-center">Pieza(s)</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider text-center">Cant.</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider text-right">Total Bs</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                            <div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                                            <p>Cargando trabajos no pagados...</p>
                                        </td>
                                    </tr>
                                ) : (
                                    noPagados.map((item, idx) => (
                                         <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                             <td className="p-3 text-center text-gray-700 dark:text-gray-300">
                                                 {(currentPage - 1) * limit + idx + 1}
                                             </td>
                                             <td className="p-3 text-gray-700 dark:text-gray-300 whitespace-nowrap font-medium">
                                                 {formatDateDisplay(item.fecha)}
                                             </td>
                                             <td className="p-3 text-gray-700 dark:text-gray-300 font-semibold">
                                                 {formatPatientName(item.paciente)}
                                             </td>
                                             <td className="p-3 text-gray-700 dark:text-gray-300 font-medium">
                                                 {item.tratamiento || item.proformaDetalle?.arancel?.detalle || 'Sin tratamiento'}
                                             </td>
                                             <td className="p-3 text-center text-gray-700 dark:text-gray-300 font-mono">
                                                 {item.pieza || '-'}
                                             </td>
                                             <td className="p-3 text-center text-gray-700 dark:text-gray-300 font-semibold">
                                                 {item.cantidad || 1}
                                             </td>
                                             <td className="p-3 text-right font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                                                 Bs {formatCurrency(item.precio)}
                                             </td>
                                         </tr>
                                     ))
                                 )}
                            </tbody>
                            {noPagados.length > 0 && !loading && (
                                <tfoot>
                                    <tr className="bg-indigo-50/70 dark:bg-indigo-950/40 border-t-2 border-indigo-200 dark:border-indigo-800 font-bold">
                                        <td colSpan={6} className="p-3 text-right text-gray-800 dark:text-gray-200 text-sm">
                                            Total Pendiente de Pago:
                                        </td>
                                        <td className="p-3 text-right text-indigo-700 dark:text-indigo-300 text-base font-extrabold whitespace-nowrap">
                                            Bs {formatCurrency(sumTotalNoPagados)}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>

                    {noPagados.length === 0 && !loading && (
                        <p className="text-center mt-5 text-gray-500 dark:text-gray-400">
                            {searchTerm 
                                ? 'No se encontraron resultados' 
                                : (selectedDoctorId ? 'No hay trabajos pendientes de pago para el doctor seleccionado' : 'Por favor, seleccione un doctor para consultar sus trabajos realizados')}
                        </p>
                    )}
                </>
            )}

            {/* TABLA 2: TRABAJOS PAGADOS */}
            {activeTab === 'pagados' && (
                <>
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider text-center w-12">#</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha Pago</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Paciente</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tratamiento</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider text-center">Pieza(s)</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider text-center">Cant.</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider text-right">Total Neto</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider text-center">Desc.</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider text-right">Costo Lab</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider text-right">Sub Total</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={10} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                            <div className="inline-block w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                                            <p>Cargando trabajos pagados...</p>
                                        </td>
                                    </tr>
                                ) : (
                                    pagados.map((item, idx) => (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="p-3 text-center text-gray-700 dark:text-gray-300">
                                                {(currentPage - 1) * limit + idx + 1}
                                            </td>
                                            <td className="p-3 text-gray-700 dark:text-gray-300 whitespace-nowrap font-medium">
                                                {formatDateDisplay(item.fechaPago)}
                                            </td>
                                            <td className="p-3 text-gray-700 dark:text-gray-300 font-semibold">
                                                {formatPatientName(item.paciente)}
                                            </td>
                                            <td className="p-3 text-gray-700 dark:text-gray-300 font-medium">
                                                {item.tratamiento}
                                            </td>
                                            <td className="p-3 text-center text-gray-700 dark:text-gray-300 font-mono">
                                                {item.pieza || '-'}
                                            </td>
                                            <td className="p-3 text-center text-gray-700 dark:text-gray-300 font-semibold">
                                                {item.cantidad || 1}
                                            </td>
                                            <td className="p-3 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap font-medium">
                                                Bs {formatCurrency(item.totalNeto)}
                                            </td>
                                            <td className="p-3 text-center text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                                {item.descuento ? `${item.descuento}%` : '-'}
                                            </td>
                                            <td className="p-3 text-right text-red-500 dark:text-red-400 whitespace-nowrap font-medium">
                                                {item.costoLab > 0 ? `Bs ${formatCurrency(item.costoLab)}` : '-'}
                                            </td>
                                            <td className="p-3 text-right font-bold text-green-600 dark:text-green-400 whitespace-nowrap">
                                                Bs {formatCurrency(item.subTotal)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {pagados.length > 0 && !loading && (
                                <tfoot>
                                    <tr className="bg-green-50/70 dark:bg-green-950/40 border-t-2 border-green-200 dark:border-green-800 font-bold text-sm">
                                        <td colSpan={6} className="p-3 text-right text-gray-800 dark:text-gray-200">
                                            Totales Liquidados:
                                        </td>
                                        <td className="p-3 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                            Bs {formatCurrency(sumTotalNetoPagados)}
                                        </td>
                                        <td></td>
                                        <td className="p-3 text-right text-red-600 dark:text-red-400 whitespace-nowrap">
                                            Bs {formatCurrency(sumCostoLabPagados)}
                                        </td>
                                        <td className="p-3 text-right text-green-700 dark:text-green-300 text-base font-extrabold whitespace-nowrap">
                                            Bs {formatCurrency(sumSubTotalPagados)}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>

                    {pagados.length === 0 && !loading && (
                        <p className="text-center mt-5 text-gray-500 dark:text-gray-400">
                            {searchTerm 
                                ? 'No se encontraron resultados' 
                                : (selectedDoctorId ? 'No hay registros de trabajos pagados para el doctor seleccionado' : 'Por favor, seleccione un doctor para consultar sus trabajos realizados')}
                        </p>
                    )}
                </>
            )}

            {/* Paginación idéntica a EspecialidadList.tsx */}
            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            )}

            {/* Manual Modal */}
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                sections={manualSections}
                title="Manual de Usuario - Trabajos Realizados"
            />
        </div>
    );
};

export default TrabajosRealizadosList;
