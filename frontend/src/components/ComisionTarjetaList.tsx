import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ManualModal, { type ManualSection } from './ManualModal';
import ComisionTarjetaForm from './ComisionTarjetaForm';
import api from '../services/api';
import type { ComisionTarjeta } from '../types';
import Swal from 'sweetalert2';
import Pagination from './Pagination';

const ComisionTarjetaList: React.FC = () => {
    const navigate = useNavigate();
    const [comisiones, setComisiones] = useState<ComisionTarjeta[]>([]);
    const [showManual, setShowManual] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Modal state for ComisionTarjetaForm
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedComisionId, setSelectedComisionId] = useState<number | null>(null);

    const manualSections: ManualSection[] = [
        {
            title: 'Gestión de Comisiones',
            content: 'Administre las comisiones por uso de tarjeta (Red Banco). Puede crear nuevas reglas de comisión con el botón "+ Nueva Red Banco".'
        },
        {
            title: 'Dar de Baja y Reactivar',
            content: 'Para comisiones activas, el botón rojo cambia el estado a "Inactivo". Para comisiones inactivas, aparece un botón verde que permite reactivarlas.'
        }
    ];

    useEffect(() => {
        fetchComisiones();
    }, []);

    const fetchComisiones = async () => {
        try {
            const response = await api.get('/comision-tarjeta');
            setComisiones(response.data || []);
        } catch (error) {
            console.error('Error fetching comisiones:', error);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Dar de baja comisión?',
            text: 'La comisión pasará a estado Inactivo.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, dar de baja',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.patch(`/comision-tarjeta/${id}`, { estado: 'inactivo' });
                await Swal.fire({ icon: 'success', title: '¡Comisión dada de baja!', showConfirmButton: false, timer: 1500 });
                fetchComisiones();
            } catch (error) {
                console.error('Error:', error);
                Swal.fire('Error', 'No se pudo dar de baja', 'error');
            }
        }
    };

    const handleReactivate = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Reactivar comisión?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, reactivar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.patch(`/comision-tarjeta/${id}`, { estado: 'activo' });
                await Swal.fire({ icon: 'success', title: '¡Comisión reactivada!', showConfirmButton: false, timer: 1500 });
                fetchComisiones();
            } catch (error) {
                console.error('Error:', error);
                Swal.fire('Error', 'No se pudo reactivar', 'error');
            }
        }
    };

    const exportToExcel = () => {
        try {
            const excelData = comisiones.map(c => ({
                'ID': c.id,
                'Red Banco': c.redBanco,
                'Monto (%)': c.monto,
                'Estado': c.estado || 'activo'
            }));
            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'ComisionTarjeta');
            XLSX.writeFile(wb, `ComisionTarjeta_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (err) {
            console.error(err);
        }
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            doc.text('Lista de Comisiones de Tarjeta', 14, 15);
            const tableData = comisiones.map(c => [
                c.id.toString(),
                c.redBanco,
                `${c.monto}%`,
                c.estado || 'activo'
            ]);
            autoTable(doc, {
                startY: 20,
                head: [['ID', 'Red Banco', 'Monto (%)', 'Estado']],
                body: tableData,
            });
            doc.save(`ComisionTarjeta_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error(err);
        }
    };

    const handlePrint = () => {
        try {
            const printDate = new Date().toLocaleString('es-ES');
            const filteredData = comisiones;

            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            const doc = iframe.contentWindow?.document;
            if (!doc) return;

            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Comisiones de Tarjeta</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; }
                        .header img { height: 50px; }
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
                        <h1>Lista de Comisiones de Tarjeta</h1>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Red Banco</th>
                                <th>Monto</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredData.map((comision: ComisionTarjeta, index: number) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${comision.redBanco}</td>
                                    <td>Bs. ${Number(comision.monto).toFixed(2)}</td>
                                    <td class="${comision.estado === 'activo' ? 'status-active' : 'status-inactive'}">
                                        ${comision.estado.charAt(0).toUpperCase() + comision.estado.slice(1)}
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

    // Filter comisiones based on search term
    const filteredComisiones = comisiones.filter(comision => {
        const term = searchTerm.toLowerCase();
        return comision.redBanco.toLowerCase().includes(term) ||
            comision.monto.toString().includes(term);
    });

    // Pagination
    const totalPages = Math.ceil(filteredComisiones.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredComisiones.slice(indexOfFirstItem, indexOfLastItem);

    // Reset to page 1 when search changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    return (
        <div className="content-card p-6 bg-gray-50 dark:bg-gray-800 min-h-screen">
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
                    <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-2xl shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600 dark:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                            Comisión Tarjeta
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Gestionar porcentajes y comisiones bancarias por cobro con tarjeta
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
                            setSelectedComisionId(null);
                            setIsFormOpen(true);
                        }}
                        className="bg-[#3498db] hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 text-sm"
                    >
                        <span>+</span> Nueva Red Banco
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 no-print">
                <div className="flex items-center gap-2 max-w-md w-full">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Buscar por Red Banco o Monto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-300 text-sm"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
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

            {/* Results Count */}
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 no-print">
                Mostrando {filteredComisiones.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredComisiones.length)} de {filteredComisiones.length} registros
            </div>

            <div className="overflow-x-auto shadow-sm rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Red Banco</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monto</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {currentItems.map((comision, index) => (
                            <tr key={comision.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{indexOfFirstItem + index + 1}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{comision.redBanco}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{Number(comision.monto).toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 py-1 rounded text-sm ${comision.estado === 'activo' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                                        {comision.estado}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-2 justify-center">
                                    <button
                                        onClick={() => {
                                            setSelectedComisionId(comision.id);
                                            setIsFormOpen(true);
                                        }}
                                        className="p-2.5 bg-amber-400 hover:bg-amber-500 text-white rounded-lg inline-flex items-center justify-center shadow-md transition-all transform hover:-translate-y-0.5"
                                        title="Editar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                    </button>
                                    {comision.estado === 'activo' ? (
                                        <button
                                            onClick={() => handleDelete(comision.id)}
                                            className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg inline-flex items-center justify-center shadow-md transition-all transform hover:-translate-y-0.5"
                                            title="Dar de baja"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleReactivate(comision.id)}
                                            className="p-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg inline-flex items-center justify-center shadow-md transition-all transform hover:-translate-y-0.5"
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
                        {currentItems.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-5 text-center text-gray-500 dark:text-gray-400">
                                    {searchTerm ? 'No se encontraron resultados.' : 'No hay comisiones registradas.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-6">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            {/* ComisionTarjetaForm Modal */}
            <ComisionTarjetaForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                id={selectedComisionId}
                onSaveSuccess={() => {
                    fetchComisiones();
                    setIsFormOpen(false);
                }}
            />

            {/* Manual Modal */}
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Comisiones Tarjeta"
                sections={manualSections}
            />
        </div>
    );
};

export default ComisionTarjetaList;
