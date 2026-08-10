import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import type { Laboratorio } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Pagination from './Pagination';
import ManualModal, { type ManualSection } from './ManualModal';
import LaboratorioForm from './LaboratorioForm';
import Swal from 'sweetalert2';
import { FlaskConical, X } from 'lucide-react';

interface PaginatedResponse {
    data: Laboratorio[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const LaboratorioList: React.FC = () => {
    const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [showManual, setShowManual] = useState(false);

    // Modal state for LaboratorioForm
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedLaboratorioId, setSelectedLaboratorioId] = useState<number | null>(null);

    const limit = 10;

    const manualSections: ManualSection[] = [
        {
            title: 'Gestión de Laboratorios',
            content: 'Registro de los laboratorios dentales con los que trabaja la clínica.'
        },
        {
            title: 'Agregar Laboratorio',
            content: 'Use el botón azul "+ Nuevo Laboratorio" para registrar un nuevo proveedor. Ingrese los datos de contacto y detalles bancarios.'
        },
        {
            title: 'Dar de Baja y Reactivar',
            content: 'Para laboratorios activos, el botón rojo (papelera) cambia el estado a "Inactivo" sin eliminar el registro. Para laboratorios inactivos, aparece un botón verde (check) que permite reactivarlos a estado "Activo".'
        },
        {
            title: 'Búsqueda y Reportes',
            content: 'La barra de búsqueda permite filtrar por nombre. Use los botones Excel/PDF para exportar la lista de contactos.'
        }
    ];

    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        fetchLaboratorios();
    }, [currentPage, debouncedSearchTerm]);

    const fetchLaboratorios = async () => {
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: limit.toString(),
            });

            if (debouncedSearchTerm) {
                params.append('search', debouncedSearchTerm);
            }

            const response = await api.get<PaginatedResponse>(`/laboratorios?${params}`);
            setLaboratorios(response.data.data);
            setTotalPages(response.data.totalPages);
            setTotal(response.data.total);
        } catch (error) {
            console.error('Error fetching laboratorios:', error);
            alert('Error al cargar los laboratorios');
        }
    };

    const fetchAllLaboratorios = async (): Promise<Laboratorio[]> => {
        try {
            const response = await api.get<PaginatedResponse>(`/laboratorios?page=1&limit=10000`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching all laboratorios:', error);
            return [];
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Dar de baja laboratorio?',
            text: 'El laboratorio pasará a estado Inactivo sin eliminar el registro de la base de datos.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, dar de baja',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.patch(`/laboratorios/${id}`, { estado: 'inactivo' });
                await Swal.fire({
                    icon: 'success',
                    title: '¡Laboratorio dado de baja!',
                    text: 'El estado del laboratorio ha sido cambiado a Inactivo.',
                    showConfirmButton: false,
                    timer: 1500
                });
                fetchLaboratorios();
            } catch (error) {
                console.error('Error al dar de baja laboratorio:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo dar de baja el laboratorio'
                });
            }
        }
    };

    const handleReactivate = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Reactivar laboratorio?',
            text: 'El laboratorio volverá a estado Activo.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, reactivar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.patch(`/laboratorios/${id}`, { estado: 'activo' });
                await Swal.fire({
                    icon: 'success',
                    title: '¡Laboratorio reactivado!',
                    text: 'El estado del laboratorio ha sido cambiado a Activo.',
                    showConfirmButton: false,
                    timer: 1500
                });
                fetchLaboratorios();
            } catch (error) {
                console.error('Error al reactivar laboratorio:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo reactivar el laboratorio'
                });
            }
        }
    };



    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const exportToExcel = async () => {
        try {
            // Fetch all laboratorios
            const allLaboratorios = await fetchAllLaboratorios();

            if (allLaboratorios.length === 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Sin datos',
                    text: 'No hay laboratorios para exportar'
                });
                return;
            }

            const excelData = allLaboratorios.map(lab => ({
                'Laboratorio': lab.laboratorio,
                'Celular': lab.celular,
                'Teléfono': lab.telefono || 'N/A',
                'Dirección': lab.direccion || 'N/A',
                'Email': lab.email || 'N/A',
                'Banco': lab.banco || 'N/A',
                'Cuenta': lab.numero_cuenta || 'N/A',
                'Estado': lab.estado.charAt(0).toUpperCase() + lab.estado.slice(1)
            }));

            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Laboratorios');
            XLSX.writeFile(wb, `laboratorios_${new Date().toISOString().split('T')[0]}.xlsx`);

            Swal.fire({
                icon: 'success',
                title: '¡Exportado!',
                text: `Se exportaron ${allLaboratorios.length} laboratorios exitosamente`,
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al exportar a Excel'
            });
        }
    };

    const exportToPDF = async () => {
        try {
            // Fetch all laboratorios
            const allLaboratorios = await fetchAllLaboratorios();

            if (allLaboratorios.length === 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Sin datos',
                    text: 'No hay laboratorios para exportar'
                });
                return;
            }

            const doc = new jsPDF();

            // Load Logo
            const logoUrl = '/logo-curare.png';
            const logoImg = new Image();
            logoImg.src = logoUrl;

            await new Promise((resolve) => {
                logoImg.onload = resolve;
                logoImg.onerror = resolve;
            });

            // Add Header
            if (logoImg.complete && logoImg.naturalWidth > 0) {
                doc.addImage(logoImg, 'PNG', 14, 10, 30, 15);
            }

            doc.setFontSize(20);
            doc.setTextColor(44, 62, 80);
            doc.text('Lista de Laboratorios', 50, 20);

            // Blue separator line
            doc.setDrawColor(52, 152, 219);
            doc.setLineWidth(0.5);
            doc.line(14, 28, 196, 28);

            // Table
            const tableData = allLaboratorios.map(lab => [
                lab.laboratorio,
                lab.celular,
                lab.telefono || 'N/A',
                lab.direccion || 'N/A',
                lab.email || 'N/A',
                lab.banco || 'N/A',
                lab.numero_cuenta || 'N/A',
                lab.estado.charAt(0).toUpperCase() + lab.estado.slice(1)
            ]);

            autoTable(doc, {
                head: [['Laboratorio', 'Celular', 'Teléfono', 'Dirección', 'Email', 'Banco', 'Cuenta', 'Estado']],
                body: tableData,
                startY: 35,
                styles: {
                    fontSize: 8,
                    cellPadding: 2
                },
                headStyles: {
                    fillColor: [52, 152, 219],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [248, 249, 250]
                },
                margin: { bottom: 25 },
                didDrawPage: function (data) {
                    // Footer
                    const footerY = doc.internal.pageSize.getHeight() - 10;

                    doc.setDrawColor(51, 51, 51);
                    doc.setLineWidth(0.3);
                    doc.line(14, footerY - 5, 196, footerY - 5);

                    doc.setFontSize(8);
                    doc.setTextColor(102, 102, 102);
                    const date = new Date().toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    doc.text(`Fecha de impresión: ${date}`, 196, footerY, { align: 'right' });
                }
            });

            // Save
            doc.save(`laboratorios_${new Date().toISOString().split('T')[0]}.pdf`);

        } catch (error) {
            console.error('Error al exportar a PDF:', error);
            Swal.fire('Error', 'No se pudo exportar a PDF', 'error');
        }
    };

    const handlePrint = async () => {
        const allLaboratorios = await fetchAllLaboratorios();

        if (allLaboratorios.length === 0) {
            Swal.fire('Atención', 'No hay laboratorios para imprimir', 'warning');
            return;
        }

        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (!doc) {
            document.body.removeChild(iframe);
            return;
        }

        const date = new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric' // Fixed date format in print
        });

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Lista de Laboratorios</title>
                <style>
                    @page {
                        size: A4 landscape;
                        margin: 1cm;
                    }
                    
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 20px;
                        color: #333;
                    }
                    
                    .header {
                        display: flex;
                        align-items: center;
                        margin-bottom: 20px;
                        padding-bottom: 15px;
                        border-bottom: 2px solid #3498db;
                    }
                    
                    .header img {
                        height: 60px;
                        margin-right: 20px;
                    }
                    
                    h1 {
                        color: #2c3e50;
                        margin: 0;
                        font-size: 24px;
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                        font-size: 10px;
                    }
                    
                    th {
                        background-color: #3498db;
                        color: white;
                        padding: 8px;
                        text-align: left;
                        font-weight: bold;
                        border: 1px solid #2980b9;
                    }
                    
                    td {
                        padding: 6px;
                        border: 1px solid #ddd;
                        vertical-align: top;
                    }
                    
                    tr:nth-child(even) {
                        background-color: #f8f9fa;
                    }
                    
                    .status-active { color: #27ae60; font-weight: bold; }
                    .status-inactive { color: #e74c3c; font-weight: bold; }
                    
                    .footer {
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        padding: 10px;
                        background: white;
                    }
                    
                    .footer-line {
                        border-top: 1px solid #333;
                        margin-bottom: 10px;
                    }
                    
                    .footer-content {
                        display: flex;
                        justify-content: flex-end;
                        font-size: 10px;
                        color: #666;
                    }
                    
                    @media print {
                        th {
                            background-color: #3498db !important;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        tr:nth-child(even) {
                            background-color: #f8f9fa !important;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        .footer {
                            position: fixed;
                            bottom: 0;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="/logo-curare.png" alt="Curare Centro Dental">
                    <h1>Lista de Laboratorios</h1>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Laboratorio</th>
                            <th>Celular</th>
                            <th>Teléfono</th>
                            <th>Dirección</th>
                            <th>Email</th>
                            <th>Banco</th>
                            <th>Cuenta</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allLaboratorios.map(lab => `
                            <tr>
                                <td>${lab.laboratorio}</td>
                                <td>${lab.celular}</td>
                                <td>${lab.telefono || '-'}</td>
                                <td>${lab.direccion || '-'}</td>
                                <td>${lab.email || '-'}</td>
                                <td>${lab.banco || '-'}</td>
                                <td>${lab.numero_cuenta || '-'}</td>
                                <td class="${lab.estado === 'activo' ? 'status-active' : 'status-inactive'}">
                                    ${lab.estado.charAt(0).toUpperCase() + lab.estado.slice(1)}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="footer">
                    <div class="footer-line"></div>
                    <div class="footer-content">
                        <div>Fecha de impresión: ${date}</div>
                    </div>
                </div>
            </body>
            </html>
        `;

        doc.open();
        doc.write(printContent);
        doc.close();

        const logo = doc.querySelector('img');
        const doPrint = () => {
            try {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
            } catch (e) {
                console.error('Print error:', e);
            } finally {
                setTimeout(() => {
                    if (document.body.contains(iframe)) {
                        document.body.removeChild(iframe);
                    }
                }, 2000);
            }
        };

        if (logo) {
            if (logo.complete) {
                doPrint();
            } else {
                logo.onload = doPrint;
                logo.onerror = doPrint;
            }
        } else {
            doPrint();
        }
    };

    return (
        <div className="content-card">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 no-print gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl shadow-sm">
                        <FlaskConical className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
                            Lista de Laboratorios
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                            Gestión y registro de laboratorios dentales externos, prótesis y contactos
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>
                    <button
                        onClick={exportToExcel}
                        className="bg-[#28a745] hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all transform hover:-translate-y-0.5"
                        title="Exportar a Excel"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg> Excel
                    </button>
                    <button
                        onClick={exportToPDF}
                        className="bg-[#dc3545] hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all transform hover:-translate-y-0.5"
                        title="Exportar a PDF"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg> PDF
                    </button>
                    <button
                        onClick={handlePrint}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all transform hover:-translate-y-0.5"
                        title="Imprimir"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg> Imprimir
                    </button>
                    <button
                        onClick={() => {
                            setSelectedLaboratorioId(null);
                            setIsFormOpen(true);
                        }}
                        className="bg-[#3498db] hover:bg-blue-600 text-white font-semibold py-2 px-5 rounded-xl flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 text-sm"
                    >
                        <span className="text-xl">+</span> Nuevo Laboratorio
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 no-print flex justify-between items-center">
                <div className="flex items-center gap-2 flex-grow max-w-md">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Buscar laboratorio..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-300"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                            className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg shadow-sm transition-all text-xs flex items-center gap-1 shrink-0"
                        >
                            <X size={14} />
                            <span>Limpiar</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                Mostrando {total === 0 ? 0 : (currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, total)} de {total} registros
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Laboratorio</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Celular</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Teléfono</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dirección</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Banco</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cuenta</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {laboratorios.map((lab, index) => (
                            <tr key={lab.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="p-3 text-gray-700 dark:text-gray-300">{(currentPage - 1) * limit + index + 1}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">{lab.laboratorio}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">{lab.celular}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">{lab.telefono}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">{lab.direccion}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">{lab.email}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">{lab.banco}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">{lab.numero_cuenta}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-sm font-medium ${lab.estado === 'activo'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                        }`}>
                                        {lab.estado}
                                    </span>
                                </td>
                                <td className="p-3 flex gap-2">
                                    <button
                                        onClick={() => {
                                            setSelectedLaboratorioId(lab.id);
                                            setIsFormOpen(true);
                                        }}
                                        className="p-2 bg-amber-400 hover:bg-amber-500 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                        title="Editar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                    </button>
                                    {lab.estado === 'activo' ? (
                                        <button
                                            onClick={() => handleDelete(lab.id)}
                                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                            title="Dar de baja"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleReactivate(lab.id)}
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

            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            )}

            {/* Manual Modal */}
            {/* LaboratorioForm Modal */}
            <LaboratorioForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                id={selectedLaboratorioId}
                onSaveSuccess={() => {
                    fetchLaboratorios();
                    setIsFormOpen(false);
                }}
            />

            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Laboratorios"
                sections={manualSections}
            />
        </div>
    );
};

export default LaboratorioList;
