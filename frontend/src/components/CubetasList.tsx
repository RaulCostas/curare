import React, { useState, useEffect } from 'react';
import api from '../services/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';
import Pagination from './Pagination';
import ManualModal, { type ManualSection } from './ManualModal';
import CubetasForm from './CubetasForm';

interface Cubeta {
    id: number;
    codigo: string;
    descripcion: string;
    dentro_fuera: string;
    estado: string;
}

const CubetasList: React.FC = () => {
    const [cubetas, setCubetas] = useState<Cubeta[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalRecords, setTotalRecords] = useState(0);
    const limit = 10;
    const [showManual, setShowManual] = useState(false);

    // Modal state for CubetasForm
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedCubetaId, setSelectedCubetaId] = useState<number | null>(null);

    const manualSections: ManualSection[] = [
        {
            title: 'Gestión de Cubetas',
            content: 'Aquí puede administrar el inventario de cubetas dentales.'
        },
        {
            title: 'Estado y Ubicación',
            content: 'Puede ver si una cubeta está "DENTRO" o "FUERA" y su estado operativo.'
        },
        {
            title: 'Dar de Baja y Reactivar',
            content: 'Para cubetas activas, el botón rojo (papelera) cambia el estado a "Inactivo". Para cubetas inactivas, aparece un botón verde (check) que permite reactivarlas a estado "Activo".'
        }
    ];

    useEffect(() => {
        fetchCubetas();
    }, [searchTerm, currentPage]);

    const fetchCubetas = async () => {
        try {
            const response = await api.get(`/cubetas?page=${currentPage}&limit=${limit}&search=${searchTerm}`);
            setCubetas(Array.isArray(response.data.data) ? response.data.data : []);
            setTotalPages(response.data.totalPages || 0);
            setTotalRecords(response.data.total || 0);
        } catch (error) {
            console.error('Error fetching cubetas:', error);
            setCubetas([]);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Dar de baja cubeta?',
            text: 'La cubeta pasará a estado Inactivo sin eliminar el registro de la base de datos.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, dar de baja',
            cancelButtonText: 'Cancelar',
            background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
            color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
        });

        if (result.isConfirmed) {
            try {
                await api.patch(`/cubetas/${id}`, { estado: 'inactivo' });
                Swal.fire({
                    title: '¡Cubeta dada de baja!',
                    text: 'El estado de la cubeta ha sido cambiado a Inactivo.',
                    icon: 'success',
                    showConfirmButton: false,
                    timer: 1500,
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
                fetchCubetas();
            } catch (error) {
                console.error('Error al dar de baja cubeta:', error);
                Swal.fire({
                    title: 'Error!',
                    text: 'Hubo un problema al dar de baja la cubeta.',
                    icon: 'error',
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
            }
        }
    };

    const handleReactivate = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Reactivar cubeta?',
            text: 'La cubeta volverá a estado Activo.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, reactivar',
            cancelButtonText: 'Cancelar',
            background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
            color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
        });

        if (result.isConfirmed) {
            try {
                await api.patch(`/cubetas/${id}`, { estado: 'activo' });
                Swal.fire({
                    title: '¡Cubeta reactivada!',
                    text: 'El estado de la cubeta ha sido cambiado a Activo.',
                    icon: 'success',
                    showConfirmButton: false,
                    timer: 1500,
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
                fetchCubetas();
            } catch (error) {
                console.error('Error al reactivar cubeta:', error);
                Swal.fire({
                    title: 'Error!',
                    text: 'Hubo un problema al reactivar la cubeta.',
                    icon: 'error',
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
            }
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        setCurrentPage(1);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const exportToExcel = () => {
        const dataToExport = cubetas.map(c => ({
            ID: c.id,
            Codigo: c.codigo,
            Descripcion: c.descripcion,
            Ubicacion: c.dentro_fuera,
            Estado: c.estado
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Cubetas");
        XLSX.writeFile(wb, "cubetas.xlsx");
    };

    const exportToPDF = async () => {
        try {
            // Load Logo
            const logoUrl = '/logo-curare.png';
            let logoDataUrl: string | null = null;
            try {
                logoDataUrl = await new Promise((resolve) => {
                    const img = new Image();
                    img.src = logoUrl;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(img, 0, 0);
                            resolve(canvas.toDataURL('image/png'));
                        } else {
                            resolve(null);
                        }
                    };
                    img.onerror = () => resolve(null);
                });
            } catch (e) {
                console.warn('Logo load failed', e);
            }

            // Fetch Data
            const params = new URLSearchParams({
                page: '1',
                limit: '9999'
            });
            if (searchTerm) {
                params.append('search', searchTerm);
            }
            const response = await api.get(`/cubetas?${params}`);
            const allCubetas = Array.isArray(response.data.data) ? response.data.data : [];

            // Generate PDF
            const doc = new jsPDF();

            // Header
            if (logoDataUrl) {
                doc.addImage(logoDataUrl, 'PNG', 14, 10, 30, 30);
            }

            doc.setFontSize(22);
            doc.setTextColor(44, 62, 80); // #2c3e50
            doc.text("Lista de Cubetas", 50, 28);

            // Blue Line
            doc.setDrawColor(52, 152, 219); // #3498db
            doc.setLineWidth(1.5);
            doc.line(14, 45, 196, 45);

            const tableRows = allCubetas.map((c: any, index: number) => [
                index + 1,
                c.codigo || '',
                c.descripcion || '',
                c.dentro_fuera || '',
                c.estado ? c.estado.charAt(0).toUpperCase() + c.estado.slice(1) : ''
            ]);

            autoTable(doc, {
                head: [['#', 'Código', 'Descripción', 'Ubicación', 'Estado']],
                body: tableRows,
                startY: 50,
                styles: { fontSize: 10, cellPadding: 3 },
                headStyles: {
                    fillColor: [52, 152, 219], // #3498db
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [248, 249, 250] // #f8f9fa
                },
                columnStyles: {
                    0: { cellWidth: 15 },
                },
                margin: { top: 50, bottom: 20 }
            });

            // Footer
            const pageCount = (doc as any).internal.getNumberOfPages();
            const dateStr = new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(9);
                doc.setTextColor(100);

                const footerY = doc.internal.pageSize.height - 10;
                doc.setDrawColor(51, 51, 51);
                doc.setLineWidth(0.5);
                doc.line(14, footerY - 5, 196, footerY - 5);

                doc.text(`Fecha de impresión: ${dateStr}`, 196, footerY, { align: 'right' });
            }

            doc.save("cubetas.pdf");
        } catch (error: any) {
            console.error('Error exporting PDF:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: `No se pudo generar el PDF: ${error?.message || error}`,
                footer: 'Por favor revise la consola para más detalles'
            });
        }
    };

    const handlePrint = async () => {
        try {
            // Fetch ALL records for printing
            const params = new URLSearchParams({
                page: '1',
                limit: '9999'
            });
            if (searchTerm) {
                params.append('search', searchTerm);
            }
            const response = await api.get(`/cubetas?${params}`);
            const allCubetas = Array.isArray(response.data.data) ? response.data.data : [];

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

            const printDate = new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Lista de Cubetas</title>
                    <style>
                        @page {
                            size: A4;
                            margin: 2cm 1.5cm 3cm 1.5cm;
                        }
                        
                        body {
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 0;
                            padding-bottom: 60px;
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
                            font-size: 11px;
                        }
                        
                        th {
                            background-color: #3498db;
                            color: white;
                            padding: 10px 8px;
                            text-align: left;
                            font-weight: bold;
                            border: 1px solid #2980b9;
                        }
                        
                        td {
                            padding: 8px;
                            border: 1px solid #ddd;
                        }
                        
                        tr:nth-child(even) {
                            background-color: #f8f9fa;
                        }
                        
                        .status-active {
                            color: #27ae60;
                            font-weight: bold;
                        }
                        
                        .status-inactive {
                            color: #e74c3c;
                            font-weight: bold;
                        }
                        
                        .footer {
                            position: fixed;
                            bottom: 0;
                            left: 0;
                            right: 0;
                            padding: 10px 1.5cm;
                            background: white;
                        }
                        
                        .footer-line {
                            border-top: 1px solid #333;
                            margin-bottom: 10px;
                        }
                        
                        .footer-content {
                            display: flex;
                            justify-content: flex-end;
                            font-size: 9px;
                            color: #666;
                        }
                        
                        .footer-info {
                            text-align: right;
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
                        <h1>Lista de Cubetas</h1>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Código</th>
                                <th>Descripción</th>
                                <th>Ubicación</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${allCubetas.map((c: any, index: number) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${c.codigo || ''}</td>
                                    <td>${c.descripcion || ''}</td>
                                    <td>${c.dentro_fuera || ''}</td>
                                    <td class="${c.estado === 'activo' ? 'status-active' : 'status-inactive'}">
                                        ${c.estado ? c.estado.charAt(0).toUpperCase() + c.estado.slice(1) : ''}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="footer">
                        <div class="footer-line"></div>
                        <div class="footer-content">
                            <div class="footer-info">
                                <div>Fecha de impresión: ${printDate}</div>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;

            doc.open();
            doc.write(printContent);
            doc.close();

            // Wait for images to load (like logo) before printing
            const logo = doc.querySelector('img');

            const doPrint = () => {
                try {
                    iframe.contentWindow?.focus();
                    iframe.contentWindow?.print();
                } catch (e) {
                    console.error('Print error:', e);
                } finally {
                    // Remove iframe after sufficient time
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
        } catch (error) {
            console.error('Error al imprimir:', error);
            alert('Error al generar el documento de impresión');
        }
    };

    return (
        <div className="content-card bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 transition-colors duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 no-print gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
                            Lista de Cubetas
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                            Control y seguimiento de ubicación de cubetas de impresión dental
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 justify-center md:justify-end">
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Excel
                    </button>
                    <button
                        onClick={exportToPDF}
                        className="bg-[#dc3545] hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all transform hover:-translate-y-0.5"
                        title="Exportar a PDF"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        PDF
                    </button>
                    <button
                        onClick={handlePrint}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all transform hover:-translate-y-0.5"
                        title="Imprimir"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Imprimir
                    </button>
                    <button
                        onClick={() => {
                            setSelectedCubetaId(null);
                            setIsFormOpen(true);
                        }}
                        className="bg-[#3498db] hover:bg-blue-600 text-white font-semibold py-2 px-5 rounded-xl flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nueva Cubeta
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl shadow-inner border border-gray-100 dark:border-gray-600 no-print">
                <div className="flex items-center gap-2 flex-grow max-w-md">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Buscar por código o descripción..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={handleClearSearch}
                            className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg shadow-sm transition-all text-xs flex items-center gap-1 shrink-0"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            <span>Limpiar</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Mostrando {totalRecords === 0 ? 0 : (currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, totalRecords)} de {totalRecords} registros
            </div>

            <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Código</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Descripción</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ubicación</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider no-print">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {Array.isArray(cubetas) && cubetas.map((cubeta, index) => (
                            <tr key={cubeta.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="p-3 text-gray-700 dark:text-gray-300">
                                    {(currentPage - 1) * limit + index + 1}
                                </td>
                                <td className="p-3 text-gray-700 dark:text-gray-300 font-medium">
                                    {cubeta.codigo}
                                </td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">
                                    {cubeta.descripcion}
                                </td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-sm font-medium ${cubeta.dentro_fuera === 'DENTRO'
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                        : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                        }`}>
                                        {cubeta.dentro_fuera}
                                    </span>
                                </td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-sm font-medium ${cubeta.estado === 'activo'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                        }`}>
                                        {cubeta.estado}
                                    </span>
                                </td>
                                <td className="p-3 flex gap-2 no-print">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedCubetaId(cubeta.id);
                                                setIsFormOpen(true);
                                            }}
                                            className="p-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 shadow-md transition-all transform hover:-translate-y-0.5"
                                            title="Editar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                            </svg>
                                        </button>
                                        {cubeta.estado === 'activo' ? (
                                            <button
                                                onClick={() => handleDelete(cubeta.id)}
                                                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-md transition-all transform hover:-translate-y-0.5"
                                                title="Dar de baja"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleReactivate(cubeta.id)}
                                                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md transition-all transform hover:-translate-y-0.5"
                                                title="Reactivar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {(!cubetas || cubetas.length === 0) && (
                            <tr>
                                <td colSpan={6} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                                    <div className="flex flex-col items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p>No hay cubetas registradas</p>
                                    </div>
                                </td>
                            </tr>
                        )}
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

            {/* CubetasForm Modal */}
            <CubetasForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                id={selectedCubetaId}
                onSaveSuccess={() => {
                    fetchCubetas();
                    setIsFormOpen(false);
                }}
            />

            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Cubetas"
                sections={manualSections}
            />
        </div>
    );
};

export default CubetasList;
