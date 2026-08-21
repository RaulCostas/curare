import React, { useEffect, useState } from 'react';
import api from '../services/api';
import type { Arancel } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Pagination from './Pagination';
import ManualModal, { type ManualSection } from './ManualModal';
import ArancelForm from './ArancelForm';
import Swal from 'sweetalert2';

interface PaginatedResponse {
    data: Arancel[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const ArancelList: React.FC = () => {
    const [aranceles, setAranceles] = useState<Arancel[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    // Modal state for ArancelForm
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedArancelId, setSelectedArancelId] = useState<number | null>(null);

    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    // Modal State
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [especialidades, setEspecialidades] = useState<any[]>([]);
    const [updateData, setUpdateData] = useState({
        especialidadId: 0,
        tipoPrecio: 'precio1', // 'precio1', 'precio2', 'ambos'
        porcentaje: 0
    });

    const [showUpdateTcModal, setShowUpdateTcModal] = useState(false);
    const [updateTcData, setUpdateTcData] = useState({
        especialidadId: 0,
        tipoPrecio: 'ambos',
        tc: 6.96
    });

    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Gestión de Aranceles',
            content: 'Aquí puede administrar la lista de precios y tratamientos.'
        },
        {
            title: 'Actualización Masiva',
            content: 'Utilice el botón "Actualizar Precios" para aplicar incrementos porcentuales a múltiples aranceles por especialidad.'
        },
        {
            title: 'Dar de Baja y Reactivar',
            content: 'Para aranceles activos, el botón rojo (papelera) cambia el estado a "Inactivo". Para aranceles inactivos, aparece un botón verde (check) que permite reactivarlos a estado "Activo".'
        },
        {
            title: 'Acciones',
            content: 'Puede exportar la lista a Excel o PDF, e imprimir el reporte actual.'
        }
    ];

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        fetchAranceles();
        fetchEspecialidades();
    }, [currentPage, debouncedSearchTerm]);

    const formatCurrency = (val: number | string | undefined) => {
        if (val === undefined || val === null) return '0,00';
        const num = typeof val === 'string' ? parseFloat(val) : val;
        if (isNaN(num)) return '0,00';
        return new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
    };

    const fetchEspecialidades = async () => {
        try {
            const response = await api.get('/arancel/used-specialties');
            setEspecialidades(response.data);
        } catch (error) {
            console.error('Error fetching especialidades:', error);
        }
    };

    const fetchAranceles = async () => {
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: limit.toString(),
            });

            if (debouncedSearchTerm) {
                params.append('search', debouncedSearchTerm);
            }

            const response = await api.get<PaginatedResponse>(`/arancel?${params}`);
            setAranceles(response.data.data);
            setTotalPages(response.data.totalPages);
            setTotal(response.data.total);
        } catch (error) {
            console.error('Error fetching aranceles:', error);
            alert('Error al cargar los aranceles');
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Dar de baja arancel?',
            text: 'El arancel pasará a estado Inactivo sin eliminar el registro de la base de datos.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, dar de baja',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.patch(`/arancel/${id}`, { estado: 'inactivo' });
                await Swal.fire({
                    icon: 'success',
                    title: '¡Arancel dado de baja!',
                    text: 'El estado del arancel ha sido cambiado a Inactivo.',
                    showConfirmButton: false,
                    timer: 1500
                });
                fetchAranceles();
            } catch (error) {
                console.error('Error al dar de baja arancel:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo dar de baja el arancel'
                });
            }
        }
    };

    const handleReactivate = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Reactivar arancel?',
            text: 'El arancel volverá a estado Activo.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, reactivar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.patch(`/arancel/${id}`, { estado: 'activo' });
                await Swal.fire({
                    icon: 'success',
                    title: '¡Arancel reactivado!',
                    text: 'El estado del arancel ha sido cambiado a Activo.',
                    showConfirmButton: false,
                    timer: 1500
                });
                fetchAranceles();
            } catch (error) {
                console.error('Error al reactivar arancel:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo reactivar el arancel'
                });
            }
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleUpdatePrices = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...updateData,
                especialidadId: Number(updateData.especialidadId),
                porcentaje: Number(updateData.porcentaje)
            };
            await api.post('/arancel/update-prices', payload);
            alert('Precios actualizados exitosamente');
            setShowUpdateModal(false);
            fetchAranceles();
        } catch (error) {
            console.error('Error updating prices:', error);
            alert('Error al actualizar precios');
        }
    };

    const handleUpdateTc = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...updateTcData,
                especialidadId: Number(updateTcData.especialidadId),
                tc: Number(updateTcData.tc)
            };
            await api.post('/arancel/update-tc', payload);
            alert('T.C. actualizado exitosamente');
            setShowUpdateTcModal(false);
            fetchAranceles();
        } catch (error) {
            console.error('Error updating TC:', error);
            alert('Error al actualizar T.C.');
        }
    };

    const exportToExcel = () => {
        try {
            const excelData = aranceles.map(a => ({
                'ID': a.id,
                'Detalle': a.detalle,
                'Especialidad': a.especialidad?.especialidad || 'N/A',
                'Precio 1': a.precio1,
                'Precio 2': a.precio2,
                'TC': a.tc,
                'Estado': a.estado
            }));

            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Aranceles');

            const date = new Date().toISOString().split('T')[0];
            const filename = `aranceles_${date}.xlsx`;
            XLSX.writeFile(wb, filename);
        } catch (error) {
            console.error('Error al exportar a Excel:', error);
            alert('Error al exportar a Excel');
        }
    };

    const exportToPDF = async () => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            // Add logo
            const logoPath = '/logo-curare.png';
            try {
                const img = new Image();
                img.src = logoPath;
                await new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });

                if (img.complete && img.naturalHeight !== 0) {
                    doc.addImage(img, 'PNG', 14, 10, 30, 15);
                }
            } catch (error) {
                console.log('Logo no disponible, continuando sin logo');
            }

            // Add title next to logo
            doc.setFontSize(18);
            doc.setTextColor(44, 62, 80);
            doc.text('Lista de Aranceles', 50, 20);

            // Add blue line separator
            doc.setDrawColor(52, 152, 219);
            doc.setLineWidth(0.5);
            doc.line(14, 28, pageWidth - 14, 28);

            // Prepare table data
            const tableData = aranceles.map((a, index) => [
                index + 1,
                a.detalle,
                a.especialidad?.especialidad || 'N/A',
                a.precio1,
                a.precio2,
                a.tc,
                a.estado.charAt(0).toUpperCase() + a.estado.slice(1)
            ]);

            // Add table
            autoTable(doc, {
                head: [['#', 'Detalle', 'Especialidad', 'Precio 1', 'Precio 2', 'TC', 'Estado']],
                body: tableData,
                startY: 35,
                styles: {
                    fontSize: 9,
                    cellPadding: 3
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
                didDrawPage: function () {
                    // Footer
                    const footerY = pageHeight - 15;

                    // Footer line
                    doc.setDrawColor(51, 51, 51);
                    doc.setLineWidth(0.3);
                    doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);

                    // Footer text
                    doc.setFontSize(8);
                    doc.setTextColor(102, 102, 102);

                    const date = new Date().toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });

                    doc.text(`Fecha de impresión: ${date}`, pageWidth - 14, footerY, { align: 'right' });
                }
            });

            const filename = `aranceles_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(filename);
        } catch (error) {
            console.error('Error al exportar a PDF:', error);
            alert('Error al exportar a PDF');
        }
    };

    const handlePrint = async () => {
        try {
            // Fetch ALL records for printing
            const response = await api.get<PaginatedResponse>(`/arancel?page=1&limit=9999${debouncedSearchTerm ? `&search=${debouncedSearchTerm}` : ''}`);
            const allAranceles = response.data.data;

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
                    <title>Lista de Aranceles</title>
                    <style>
                        @page {
                            size: A4;
                            margin: 2cm 1.5cm 3cm 1.5cm;
                        }
                        
                        body {
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 0;
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
                            padding: 10px 6px;
                            text-align: left;
                            font-weight: bold;
                            border: 1px solid #2980b9;
                        }
                        
                        td {
                            padding: 6px;
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
                            padding: 10px 0;
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
                        <h1>Lista de Aranceles</h1>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Detalle</th>
                                <th>Especialidad</th>
                                <th>Precio 1</th>
                                <th>Precio 2</th>
                                <th>TC</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${allAranceles.map((a: Arancel, index: number) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${a.detalle}</td>
                                    <td>${a.especialidad?.especialidad || 'N/A'}</td>
                                    <td>${a.precio1}</td>
                                    <td>${a.precio2}</td>
                                    <td>${a.tc}</td>
                                    <td class="${a.estado === 'activo' ? 'status-active' : 'status-inactive'}">
                                        ${a.estado.charAt(0).toUpperCase() + a.estado.slice(1)}
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
        <div className="content-card">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 no-print gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
                            Lista de Aranceles
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                            Catálogo general de servicios odontológicos, precios y tarifas de la clínica
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
                        className="bg-[#28a745] hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center shadow-md transition-all transform hover:-translate-y-0.5 gap-2 text-sm"
                        title="Exportar a Excel"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg> Excel
                    </button>
                    <button
                        onClick={exportToPDF}
                        className="bg-[#dc3545] hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center shadow-md transition-all transform hover:-translate-y-0.5 gap-2 text-sm"
                        title="Exportar a PDF"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg> PDF
                    </button>
                    <button
                        onClick={handlePrint}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center shadow-md transition-all transform hover:-translate-y-0.5 gap-2 text-sm"
                        title="Imprimir"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg> Imprimir
                    </button>
                    <button
                        onClick={() => {
                            setSelectedArancelId(null);
                            setIsFormOpen(true);
                        }}
                        className="bg-[#3498db] hover:bg-blue-600 text-white font-semibold py-2 px-5 rounded-xl flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 text-sm"
                    >
                        <span className="text-xl">+</span> Nuevo Arancel
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 no-print">
                <div className="flex items-center gap-2 flex-grow max-w-md">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Buscar arancel..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
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
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            <span>Limpiar</span>
                        </button>
                    )}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowUpdateTcModal(true)}
                        className="bg-[#3498db] hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        Cambiar T.C.
                    </button>
                    <button
                        onClick={() => setShowUpdateModal(true)}
                        className="bg-[#1abc9c] hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 12a11.05 11.05 0 0 0-22 0zm-5 7a3 3 0 0 1-6 0v-7"></path>
                            <line x1="12" y1="20" x2="12" y2="4"></line>
                        </svg>
                        Actualizar Precios
                    </button>
                </div>
            </div>

            {/* Update Prices Modal */}
            {showUpdateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-xl transform transition-all">
                        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Actualizar Precios Masivamente</h3>
                        <form onSubmit={handleUpdatePrices}>
                            <div className="mb-4 relative">
                                <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">Especialidad</label>
                                <div className="relative">
                                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                                    </svg>
                                    <select
                                        className="w-full border border-gray-300 dark:border-gray-600 p-2 pl-10 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={updateData.especialidadId}
                                        onChange={(e) => setUpdateData({ ...updateData, especialidadId: Number(e.target.value) })}
                                    >
                                        {especialidades.map(esp => (
                                            <option key={esp.id} value={esp.id}>{esp.especialidad}</option>
                                        ))}
                                        <option value={0}>TODAS</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-4 relative">
                                <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">Precio a Actualizar</label>
                                <div className="relative">
                                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 011 12V7a4 4 0 014-4z"></path>
                                    </svg>
                                    <select
                                        className="w-full border border-gray-300 dark:border-gray-600 p-2 pl-10 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={updateData.tipoPrecio}
                                        onChange={(e) => setUpdateData({ ...updateData, tipoPrecio: e.target.value })}
                                    >
                                        <option value="precio1">Precio 1</option>
                                        <option value="precio2">Precio 2</option>
                                        <option value="ambos">Ambos</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-6 relative">
                                <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">Porcentaje de Incremento (%)</label>
                                <div className="relative">
                                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path>
                                    </svg>
                                    <input
                                        type="number"
                                        className="w-full border border-gray-300 dark:border-gray-600 p-2 pl-10 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={updateData.porcentaje}
                                        onChange={(e) => setUpdateData({ ...updateData, porcentaje: Number(e.target.value) })}
                                        required
                                        min="0"
                                    />
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ej: 10 para aumentar un 10%</p>
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowUpdateModal(false)}
                                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"

                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#1abc9c] text-white rounded hover:bg-teal-600 font-bold transition-colors"
                                >
                                    Aceptar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Update T.C. Modal */}
            {showUpdateTcModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-xl transform transition-all">
                        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Cambiar T.C. Masivamente</h3>
                        <form onSubmit={handleUpdateTc}>
                            <div className="mb-4 relative">
                                <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">Especialidad</label>
                                <div className="relative">
                                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                                    </svg>
                                    <select
                                        className="w-full border border-gray-300 dark:border-gray-600 p-2 pl-10 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={updateTcData.especialidadId}
                                        onChange={(e) => setUpdateTcData({ ...updateTcData, especialidadId: Number(e.target.value) })}
                                    >
                                        {especialidades.map(esp => (
                                            <option key={esp.id} value={esp.id}>{esp.especialidad}</option>
                                        ))}
                                        <option value={0}>TODAS</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-4 relative hidden">
                                <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">Precio</label>
                                <div className="relative">
                                    <select
                                        className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={updateTcData.tipoPrecio}
                                        onChange={(e) => setUpdateTcData({ ...updateTcData, tipoPrecio: e.target.value })}
                                    >
                                        <option value="ambos">Ambos (Para T.C. aplica en toda la fila)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-6 relative">
                                <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">Nuevo Tipo de Cambio (T.C.)</label>
                                <div className="relative">
                                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                    </svg>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full border border-gray-300 dark:border-gray-600 p-2 pl-10 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={updateTcData.tc}
                                        onChange={(e) => setUpdateTcData({ ...updateTcData, tc: Number(e.target.value) })}
                                        required
                                        min="0"
                                    />
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ej: 6.96</p>
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowUpdateTcModal(false)}
                                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#3498db] text-white rounded hover:bg-blue-600 font-bold transition-colors"
                                >
                                    Aceptar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="mb-2 text-gray-600 dark:text-gray-400 text-sm">
                Mostrando {total === 0 ? 0 : (currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, total)} de {total} registros
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Detalle</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Especialidad</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Precio 1</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Precio 2</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">TC</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {aranceles.map((a, index) => (
                            <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="p-3 text-gray-700 dark:text-gray-300">{(currentPage - 1) * limit + index + 1}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300 font-medium">{a.detalle}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">{a.especialidad?.especialidad || 'N/A'}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300 font-semibold">
                                    {formatCurrency(a.precio1)}
                                    <span className="block text-xs text-green-600 dark:text-green-400 mt-1 font-bold">
                                        $us {formatCurrency(Number(a.precio1) / (Number(a.tc) || 1))}
                                    </span>
                                </td>
                                <td className="p-3 text-gray-700 dark:text-gray-300 font-semibold">
                                    {formatCurrency(a.precio2)}
                                    <span className="block text-xs text-green-600 dark:text-green-400 mt-1 font-bold">
                                        $us {formatCurrency(Number(a.precio2) / (Number(a.tc) || 1))}
                                    </span>
                                </td>
                                <td className="p-3 text-gray-700 dark:text-gray-300 font-medium">{formatCurrency(a.tc)}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-sm font-medium ${a.estado === 'activo' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                                        {a.estado.charAt(0).toUpperCase() + a.estado.slice(1)}
                                    </span>
                                </td>
                                <td className="p-3 flex gap-2">
                                    <button
                                        onClick={() => {
                                            setSelectedArancelId(a.id);
                                            setIsFormOpen(true);
                                        }}
                                        className="bg-[#ffc107] hover:bg-yellow-600 text-white p-2.5 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
                                        title="Editar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                    </button>
                                    {a.estado === 'activo' ? (
                                        <button
                                            onClick={() => handleDelete(a.id)}
                                            className="bg-[#dc3545] hover:bg-red-700 text-white p-2.5 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
                                            title="Dar de baja"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleReactivate(a.id)}
                                            className="bg-green-600 hover:bg-green-700 text-white p-2.5 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
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

            {aranceles.length === 0 && (
                <p className="text-center mt-5 text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'No se encontraron resultados' : 'No hay aranceles registrados'}
                </p>
            )}

            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            )}

            {/* ArancelForm Modal */}
            <ArancelForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                id={selectedArancelId}
                onSaveSuccess={() => {
                    fetchAranceles();
                    setIsFormOpen(false);
                }}
            />

            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Aranceles"
                sections={manualSections}
            />
        </div>
    );
};

export default ArancelList;
