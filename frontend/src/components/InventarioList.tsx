import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';
import Pagination from './Pagination';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import EgresoInventarioForm from './EgresoInventarioForm';
import HistorialEgresos from './HistorialEgresos';
import type { Inventario } from '../types';
import { formatDate } from '../utils/dateUtils';
import ManualModal, { type ManualSection } from './ManualModal';
import InventarioForm from './InventarioForm';

interface PaginatedResponse {
    data: Inventario[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const InventarioList: React.FC = () => {
    const [items, setItems] = useState<Inventario[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    const [showEgresoForm, setShowEgresoForm] = useState(false);
    const [selectedItemForEgreso, setSelectedItemForEgreso] = useState<Inventario | null>(null);
    const [showHistorial, setShowHistorial] = useState(false);
    const [selectedItemForHistorial, setSelectedItemForHistorial] = useState<Inventario | null>(null);
    const [showManual, setShowManual] = useState(false);

    // Modal state for InventarioForm
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedInventarioId, setSelectedInventarioId] = useState<number | null>(null);

    const manualSections: ManualSection[] = [
        {
            title: 'Gestión de Inventario',
            content: 'Control total de insumos y materiales. Puede filtrar por vencimiento usando los botones de colores superiores.'
        },
        {
            title: 'Agregar Item',
            content: 'Botón azul "+ Nuevo". Requiere definir Stock Mínimo para alertas.'
        },
        {
            title: 'Registrar Salida (Egreso)',
            content: 'Use el botón naranja con flecha para descontar stock cuando se utiliza un material.'
        },
        {
            title: 'Historial',
            content: 'Botón azul con reloj. Muestra todos los movimientos (entradas/salidas) de un ítem específico.'
        },
        {
            title: 'Dar de Baja y Reactivar',
            content: 'Para ítems activos, el botón rojo (papelera) cambia el estado a "Inactivo". Para ítems inactivos, aparece un botón verde (check) que permite reactivarlos a estado "Activo".'
        },
        {
            title: 'Alertas de Vencimiento',
            content: 'Los botones superiores (3 Meses, 6 Meses, Vencidos) filtran automáticamente los lotes próximos a caducar.'
        }
    ];

    // Expiration Modal States
    const [showExpirationModal, setShowExpirationModal] = useState(false);
    const [expirationItems, setExpirationItems] = useState<any[]>([]); // Using any for joined structure
    const [expirationLoading, setExpirationLoading] = useState(false);
    const [expirationTitle, setExpirationTitle] = useState('');

    // Print Modal States
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [modalMode, setModalMode] = useState<'print' | 'export'>('print');
    const [selectedGrupoId, setSelectedGrupoId] = useState<string>('');
    const [selectedEspecialidadId, setSelectedEspecialidadId] = useState<string>('');
    const [printGrupos, setPrintGrupos] = useState<any[]>([]);
    const [printEspecialidades, setPrintEspecialidades] = useState<any[]>([]);

    useEffect(() => {
        fetchInventario();
    }, [currentPage, searchTerm]);

    const fetchInventario = async () => {
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: limit.toString(),
            });

            if (searchTerm) {
                params.append('search', searchTerm);
            }

            const response = await api.get<PaginatedResponse>(`/inventario?${params}`);

            const data = response.data?.data || [];
            const totalPages = response.data?.totalPages || 1;
            const total = response.data?.total || 0;

            setItems(data);
            setTotalPages(totalPages);
            setTotal(total);
        } catch (error) {
            console.error('Error fetching inventario:', error);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Dar de baja ítem?',
            text: 'El ítem pasará a estado Inactivo sin eliminar el registro de la base de datos.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, dar de baja',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.patch(`/inventario/${id}`, { estado: 'Inactivo' });
                await Swal.fire({
                    title: '¡Ítem dado de baja!',
                    text: 'El estado del ítem ha sido cambiado a Inactivo.',
                    icon: 'success',
                    showConfirmButton: false,
                    timer: 1500
                });
                fetchInventario();
            } catch (error) {
                console.error('Error al dar de baja ítem:', error);
                Swal.fire(
                    'Error!',
                    'No se pudo dar de baja el ítem.',
                    'error'
                );
            }
        }
    };

    const handleReactivate = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Reactivar ítem?',
            text: 'El ítem volverá a estado Activo.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, reactivar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.patch(`/inventario/${id}`, { estado: 'Activo' });
                await Swal.fire({
                    title: '¡Ítem reactivado!',
                    text: 'El estado del ítem ha sido cambiado a Activo.',
                    icon: 'success',
                    showConfirmButton: false,
                    timer: 1500
                });
                fetchInventario();
            } catch (error) {
                console.error('Error al reactivar ítem:', error);
                Swal.fire(
                    'Error!',
                    'No se pudo reactivar el ítem.',
                    'error'
                );
            }
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleEgreso = (item: Inventario) => {
        setSelectedItemForEgreso(item);
        setShowEgresoForm(true);
    };

    const handleEgresoSuccess = () => {
        setShowEgresoForm(false);
        setSelectedItemForEgreso(null);
        fetchInventario();
    };

    const handleHistorial = (item: Inventario) => {
        setSelectedItemForHistorial(item);
        setShowHistorial(true);
    };

    const handleExpirationFilter = async (status: string, title: string) => {
        setExpirationTitle(title);
        setExpirationLoading(true);
        setShowExpirationModal(true);
        try {
            const response = await api.get<any[]>(`/inventario/expiration-details?status=${status}`);
            setExpirationItems(response.data || []);
        } catch (error) {
            console.error('Error fetching expiration items:', error);
            Swal.fire('Error', 'No se pudieron cargar los datos filtrados', 'error');
        } finally {
            setExpirationLoading(false);
        }
    };

    const handlePrintExpiration = () => {
        if (expirationItems.length === 0) {
            Swal.fire({
                icon: 'info',
                title: 'Sin datos',
                text: 'No hay items para imprimir',
                confirmButtonColor: '#3498db'
            });
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

        const printDate = new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${expirationTitle}</title>
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
                        font-size: 20px;
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
                        padding: 8px 6px;
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
                    <h1>${expirationTitle}</h1>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Descripción</th>
                            <th>Especialidad</th>
                            <th>Grupo</th>
                            <th>Fecha Vencimiento</th>
                            <th>Cantidad Lote</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${expirationItems.map((item: any) => `
                            <tr>
                                <td>${item.inventario?.descripcion || 'N/A'}</td>
                                <td>${item.inventario?.especialidad?.especialidad || 'N/A'}</td>
                                <td>${item.inventario?.grupoInventario?.grupo || 'N/A'}</td>
                                <td>${formatDate(item.fecha_vencimiento)}</td>
                                <td>${item.cantidad}</td>
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

    const fetchPrintGrupos = async () => {
        try {
            const response = await api.get('/inventario?page=1&limit=9999');
            const allInventario = Array.isArray(response.data.data) ? response.data.data : [];

            // Extract unique grupos
            const uniqueGruposMap = new Map();
            allInventario.forEach((item: any) => {
                if (item.grupoInventario && item.grupoInventario.id && item.grupoInventario.grupo) {
                    if (!uniqueGruposMap.has(item.grupoInventario.id)) {
                        uniqueGruposMap.set(item.grupoInventario.id, {
                            id: item.grupoInventario.id,
                            grupo: item.grupoInventario.grupo
                        });
                    }
                }
            });

            const uniqueGrupos = Array.from(uniqueGruposMap.values()).sort((a: any, b: any) =>
                a.grupo.localeCompare(b.grupo)
            );

            setPrintGrupos(uniqueGrupos);
        } catch (error) {
            console.error('Error fetching grupos:', error);
            setPrintGrupos([]);
        }
    };

    const fetchPrintEspecialidades = async (grupoId?: string) => {
        try {
            const response = await api.get('/inventario?page=1&limit=9999');
            let allInventario = Array.isArray(response.data.data) ? response.data.data : [];

            // Filter by grupo if specified
            if (grupoId && grupoId !== 'all') {
                const grupoIdNum = Number(grupoId);
                allInventario = allInventario.filter((item: any) => item.grupoInventario?.id === grupoIdNum);
            }

            // Extract unique especialidades
            const uniqueEspecialidadesMap = new Map();
            allInventario.forEach((item: any) => {
                if (item.especialidad && item.especialidad.id && item.especialidad.especialidad) {
                    if (!uniqueEspecialidadesMap.has(item.especialidad.id)) {
                        uniqueEspecialidadesMap.set(item.especialidad.id, {
                            id: item.especialidad.id,
                            especialidad: item.especialidad.especialidad
                        });
                    }
                }
            });

            const uniqueEspecialidades = Array.from(uniqueEspecialidadesMap.values()).sort((a: any, b: any) =>
                a.especialidad.localeCompare(b.especialidad)
            );

            setPrintEspecialidades(uniqueEspecialidades);
        } catch (error) {
            console.error('Error fetching especialidades:', error);
            setPrintEspecialidades([]);
        }
    };

    const handleOpenPrintModal = () => {
        setModalMode('print');
        setShowPrintModal(true);
        setSelectedGrupoId('');
        setSelectedEspecialidadId('');
        fetchPrintGrupos();
        fetchPrintEspecialidades(); // Fetch all especialidades initially
    };

    const handleOpenExportModal = () => {
        setModalMode('export');
        setShowPrintModal(true);
        setSelectedGrupoId('');
        setSelectedEspecialidadId('');
        fetchPrintGrupos();
        fetchPrintEspecialidades();
    };

    const handleGrupoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const grupoId = e.target.value;
        setSelectedGrupoId(grupoId);
        setSelectedEspecialidadId(''); // Reset especialidad when grupo changes
        if (grupoId) {
            fetchPrintEspecialidades(grupoId);
        } else {
            setPrintEspecialidades([]);
        }
    };

    const exportToExcel = () => {
        try {
            const excelData = items.map(i => ({
                'Descripción': i.descripcion,
                'Cantidad': i.cantidad_existente,
                'Stock Min.': i.stock_minimo,
                'Especialidad': i.especialidad?.especialidad || 'N/A',
                'Grupo': i.grupoInventario?.grupo || 'N/A',
                'Estado': i.estado
            }));
            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
            const date = new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `inventario_${date}.xlsx`);
        } catch (error) {
            console.error('Error export excel:', error);
        }
    };

    const handlePrint = async (grupoId?: string, especialidadId?: string) => {
        try {
            // Fetch ALL records for printing
            const params = new URLSearchParams({
                page: '1',
                limit: '9999'
            });
            if (searchTerm) {
                params.append('search', searchTerm);
            }
            const response = await api.get<PaginatedResponse>(`/inventario?${params}`);
            let allItems = Array.isArray(response.data.data) ? response.data.data : [];

            // Apply filters
            if (grupoId && grupoId !== 'all') {
                const grupoIdNum = Number(grupoId);
                allItems = allItems.filter((item: Inventario) => item.grupoInventario?.id === grupoIdNum);
            }

            if (especialidadId && especialidadId !== 'all') {
                const especialidadIdNum = Number(especialidadId);
                allItems = allItems.filter((item: Inventario) => item.especialidad?.id === especialidadIdNum);
            }

            if (allItems.length === 0) {
                Swal.fire({
                    icon: 'info',
                    title: 'Sin datos',
                    text: 'No hay items para imprimir con los filtros seleccionados',
                    confirmButtonColor: '#3498db'
                });
                return;
            }

            // Determine subtitle based on filters
            let filterSubtitle = '';
            if (grupoId && grupoId !== 'all') {
                const selectedGrupo = printGrupos.find(g => g.id.toString() === grupoId);
                if (selectedGrupo) {
                    filterSubtitle += `Grupo: ${selectedGrupo.grupo}`;
                }
            }
            if (especialidadId && especialidadId !== 'all') {
                const selectedEsp = printEspecialidades.find(e => e.id.toString() === especialidadId);
                if (selectedEsp) {
                    if (filterSubtitle) filterSubtitle += ' | ';
                    filterSubtitle += `Especialidad: ${selectedEsp.especialidad}`;
                }
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

            const printDate = new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Inventario</title>
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

                        .filter-subtitle {
                            margin-top: 10px;
                            padding: 8px 15px;
                            background-color: #ecf0f1;
                            border-left: 4px solid #3498db;
                            font-size: 12px;
                            font-weight: bold;
                            color: #2c3e50;
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
                            padding: 8px 6px;
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
                        <h1>Inventario</h1>
                    </div>
                    ${filterSubtitle ? `<div class="filter-subtitle">${filterSubtitle}</div>` : ''}
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Descripción</th>
                                <th>Cant.</th>
                                <th>Min.</th>
                                <th>Especialidad</th>
                                <th>Grupo</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${allItems.map((i: Inventario) => `
                                <tr>
                                    <td>${i.descripcion}</td>
                                    <td>${i.cantidad_existente}</td>
                                    <td>${i.stock_minimo}</td>
                                    <td>${i.especialidad?.especialidad || 'N/A'}</td>
                                    <td>${i.grupoInventario?.grupo || 'N/A'}</td>
                                    <td class="${i.estado === 'Activo' ? 'status-active' : 'status-inactive'}">
                                        ${i.estado}
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
            Swal.fire('Error', 'Error al generar el documento de impresión', 'error');
        }
    };

    const handleConfirmPrint = () => {
        if (!selectedGrupoId || !selectedEspecialidadId) {
            Swal.fire({
                icon: 'warning',
                title: 'Selección requerida',
                text: 'Por favor seleccione grupo y especialidad',
                confirmButtonColor: '#3498db'
            });
            return;
        }
        setShowPrintModal(false);
        handlePrint(selectedGrupoId, selectedEspecialidadId);
    };

    const handleConfirmExport = async () => {
        if (!selectedGrupoId || !selectedEspecialidadId) {
            Swal.fire({
                icon: 'warning',
                title: 'Selección requerida',
                text: 'Por favor seleccione grupo y especialidad',
                confirmButtonColor: '#3498db'
            });
            return;
        }

        try {
            // Fetch ALL records for export
            const params = new URLSearchParams({
                page: '1',
                limit: '9999'
            });
            const response = await api.get<PaginatedResponse>(`/inventario?${params}`);
            let allItems = Array.isArray(response.data.data) ? response.data.data : [];

            // Apply filters
            if (selectedGrupoId && selectedGrupoId !== 'all') {
                const grupoIdNum = Number(selectedGrupoId);
                allItems = allItems.filter((item: Inventario) => item.grupoInventario?.id === grupoIdNum);
            }

            if (selectedEspecialidadId && selectedEspecialidadId !== 'all') {
                const especialidadIdNum = Number(selectedEspecialidadId);
                allItems = allItems.filter((item: Inventario) => item.especialidad?.id === especialidadIdNum);
            }

            if (allItems.length === 0) {
                Swal.fire({
                    icon: 'info',
                    title: 'Sin datos',
                    text: 'No hay items para exportar con los filtros seleccionados',
                    confirmButtonColor: '#3498db'
                });
                return;
            }

            // Generate PDF
            const doc = new jsPDF();

            // Add logo
            try {
                const logo = await new Promise<HTMLImageElement>((resolve, reject) => {
                    const img = new Image();
                    img.src = '/logo-curare.png';
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                });
                doc.addImage(logo, 'PNG', 15, 10, 40, 16);
            } catch (error) {
                console.warn('Could not load logo', error);
            }

            const dateStr = new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const pageWidth = doc.internal.pageSize.width;

            // Title next to logo
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.setTextColor(44, 62, 80); // #2c3e50
            doc.text('INVENTARIO', 60, 20);

            // Blue line under header
            doc.setDrawColor(52, 152, 219); // #3498db
            doc.setLineWidth(0.5);
            doc.line(15, 28, pageWidth - 15, 28);

            let currentY = 35;

            // Filter subtitle box
            let filterSubtitle = '';
            if (selectedGrupoId && selectedGrupoId !== 'all') {
                const selectedGrupo = printGrupos.find(g => g.id.toString() === selectedGrupoId);
                if (selectedGrupo) {
                    filterSubtitle += `Grupo: ${selectedGrupo.grupo}`;
                }
            }
            if (selectedEspecialidadId && selectedEspecialidadId !== 'all') {
                const selectedEsp = printEspecialidades.find(e => e.id.toString() === selectedEspecialidadId);
                if (selectedEsp) {
                    if (filterSubtitle) filterSubtitle += ' | ';
                    filterSubtitle += `Especialidad: ${selectedEsp.especialidad}`;
                }
            }

            if (filterSubtitle) {
                doc.setFillColor(236, 240, 241); // #ecf0f1
                doc.rect(15, currentY, pageWidth - 30, 10, 'F');

                // Blue left border
                doc.setFillColor(52, 152, 219); // #3498db
                doc.rect(15, currentY, 1, 10, 'F');

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.setTextColor(44, 62, 80);
                doc.text(filterSubtitle, 20, currentY + 6.5);

                currentY += 15;
            }

            doc.setTextColor(0, 0, 0);

            // Table data
            const tableColumn = ["Descripción", "Cant.", "Min.", "Especialidad", "Grupo", "Estado"];
            const tableRows = allItems.map((i: Inventario) => [
                i.descripcion,
                i.cantidad_existente.toString(),
                i.stock_minimo.toString(),
                i.especialidad?.especialidad || 'N/A',
                i.grupoInventario?.grupo || 'N/A',
                i.estado
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: currentY,
                theme: 'plain',
                margin: { left: 15, right: 15 },
                styles: {
                    fontSize: 9,
                    cellPadding: 3,
                    lineColor: [221, 221, 221],
                    lineWidth: 0.1,
                },
                headStyles: {
                    fillColor: [52, 152, 219], // #3498db
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    halign: 'left',
                    lineWidth: 0.1,
                    lineColor: [41, 128, 185],
                },
                alternateRowStyles: {
                    fillColor: [248, 249, 250] // #f8f9fa
                },
                columnStyles: {
                    0: { cellWidth: 'auto' },
                    1: { cellWidth: 20, halign: 'center' },
                    2: { cellWidth: 20, halign: 'center' },
                    3: { cellWidth: 35 },
                    4: { cellWidth: 35 },
                    5: { cellWidth: 25, halign: 'center' }
                },
                didParseCell: function (data) {
                    // Style estado column
                    if (data.column.index === 5 && data.section === 'body') {
                        const estado = data.cell.raw as string;
                        if (estado && estado.toLowerCase().includes('activo')) {
                            data.cell.styles.textColor = [39, 174, 96]; // green
                            data.cell.styles.fontStyle = 'bold';
                        } else if (estado && estado.toLowerCase().includes('inactivo')) {
                            data.cell.styles.textColor = [231, 76, 60]; // red
                            data.cell.styles.fontStyle = 'bold';
                        }
                    }
                }
            });

            // Footer
            const pageHeight = doc.internal.pageSize.height;
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.1);
            doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);

            doc.setFontSize(8);
            doc.setTextColor(102, 102, 102);
            doc.text('Fecha de impresión: ' + dateStr, pageWidth / 2, pageHeight - 10, { align: 'center' });

            doc.save(`inventario_${new Date().toISOString().split('T')[0]}.pdf`);

            setShowPrintModal(false);

            Swal.fire({
                icon: 'success',
                title: 'PDF Exportado',
                text: 'El archivo PDF se ha descargado correctamente',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Error al exportar:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo generar el PDF'
            });
        }
    };

    if (loading) return <div className="text-center p-4">Cargando...</div>;

    return (
        <div className="content-card">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
                            Inventario de Productos
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                            Control de stock, insumos médicos y materiales odontológicos de la clínica
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
                    <button onClick={exportToExcel} className="bg-[#28a745] hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all transform hover:-translate-y-0.5" title="Exportar a Excel"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg> Excel</button>
                    <button onClick={handleOpenExportModal} className="bg-[#dc3545] hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all transform hover:-translate-y-0.5" title="Exportar a PDF"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg> PDF</button>
                    <button onClick={handleOpenPrintModal} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all transform hover:-translate-y-0.5" title="Imprimir"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg> Imprimir</button>
                    <button
                        onClick={() => {
                            setSelectedInventarioId(null);
                            setIsFormOpen(true);
                        }}
                        className="bg-[#3498db] hover:bg-blue-600 text-white font-semibold py-2 px-5 rounded-xl flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 text-sm"
                    >
                        + Nuevo Producto
                    </button>
                </div>
            </div>

            <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 no-print">
                <div className="flex items-center gap-2 flex-grow max-w-md">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Buscar por descripción..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
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

                <div className="flex gap-2 flex-wrap justify-center md:justify-end">
                    <button
                        onClick={() => handleExpirationFilter('3months', 'Productos que vencen en los próximos 3 meses')}
                        className="bg-[#f44336] text-white border-none rounded-lg px-4 py-2 cursor-pointer font-bold shadow-md transition-all transform hover:-translate-y-0.5 hover:opacity-90 flex items-center gap-1.5"
                        title="Vencen en 3 meses"
                    >
                        <span>📅</span> 3 Meses
                    </button>
                    <button
                        onClick={() => handleExpirationFilter('6months', 'Productos que vencen entre 3 y 6 meses')}
                        className="bg-[#ffeb3b] text-black border-none rounded-lg px-4 py-2 cursor-pointer font-bold shadow-md transition-all transform hover:-translate-y-0.5 hover:opacity-90 flex items-center gap-1.5"
                        title="Vencen en 6 meses"
                    >
                        <span>📅</span> 6 Meses
                    </button>
                    <button
                        onClick={() => handleExpirationFilter('9months', 'Productos que vencen entre 6 y 9 meses')}
                        className="bg-[#4caf50] text-white border-none rounded-lg px-4 py-2 cursor-pointer font-bold shadow-md transition-all transform hover:-translate-y-0.5 hover:opacity-90 flex items-center gap-1.5"
                        title="Vencen en 9 meses"
                    >
                        <span>📅</span> 9 Meses
                    </button>
                    <button
                        onClick={() => handleExpirationFilter('expired', 'Productos Vencidos')}
                        className="bg-[#c62828] text-white border-none rounded-lg px-4 py-2 cursor-pointer font-bold shadow-md transition-all transform hover:-translate-y-0.5 hover:opacity-90 flex items-center justify-center gap-1.5"
                        title="Vencidos"
                    >
                        <span>⚠️</span> Vencidos
                    </button>
                </div>
            </div>

            <div className="mb-2 text-gray-600 dark:text-gray-400 text-sm">
                Mostrando {total === 0 ? 0 : (currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, total)} de {total} registros
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Descripción</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cant. Exis.</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stock Min.</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Especialidad</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Grupo</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {items.map((item, index) => (
                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="p-3 text-gray-800 dark:text-gray-300 font-medium">{(currentPage - 1) * limit + index + 1}</td>
                                <td className="p-3 text-gray-800 dark:text-gray-300 font-medium">{item.descripcion}</td>
                                <td className="p-3 text-gray-800 dark:text-gray-300">{item.cantidad_existente}</td>
                                <td className="p-3 text-gray-800 dark:text-gray-300">{item.stock_minimo}</td>
                                <td className="p-3 text-gray-800 dark:text-gray-300">{item.especialidad?.especialidad}</td>
                                <td className="p-3 text-gray-800 dark:text-gray-300">{item.grupoInventario?.grupo}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-sm font-medium ${item.estado === 'Activo' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                                        {item.estado}
                                    </span>
                                </td>
                                <td className="p-3 flex gap-2">
                                    <button
                                        onClick={() => handleEgreso(item)}
                                        className="p-2.5 bg-[#e67e22] text-white rounded-lg hover:bg-orange-700 shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
                                        title="Salida / Egreso"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M5 12h14M12 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleHistorial(item)}
                                        className="p-2.5 bg-[#3498db] text-white rounded-lg hover:bg-blue-600 shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
                                        title="Historial de Egresos"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <polyline points="12 6 12 12 16 14"></polyline>
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedInventarioId(item.id);
                                            setIsFormOpen(true);
                                        }}
                                        className="p-2.5 bg-[#ffc107] text-white rounded-lg hover:bg-yellow-600 shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
                                        title="Editar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                    </button>
                                    {item.estado === 'Activo' ? (
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-2.5 bg-[#dc3545] text-white rounded-lg hover:bg-red-700 shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
                                            title="Dar de baja"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleReactivate(item.id)}
                                            className="p-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
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

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />

            {showEgresoForm && selectedItemForEgreso && (
                <EgresoInventarioForm
                    inventario={selectedItemForEgreso}
                    onClose={() => setShowEgresoForm(false)}
                    onSuccess={handleEgresoSuccess}
                />
            )}

            {showHistorial && selectedItemForHistorial && (
                <HistorialEgresos
                    inventario={selectedItemForHistorial}
                    onClose={() => {
                        setShowHistorial(false);
                        fetchInventario();
                    }}
                />
            )}

            {showExpirationModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-[90%] max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{expirationTitle}</h3>
                        </div>

                        {expirationLoading ? (
                            <div className="text-center p-4 text-gray-700 dark:text-gray-300">Cargando...</div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Descripción</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Especialidad</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Grupo</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha Vencimiento</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cantidad Lote</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {expirationItems.length > 0 ? (
                                        expirationItems.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="p-3 text-gray-800 dark:text-gray-300">{item.inventario?.descripcion}</td>
                                                <td className="p-3 text-gray-800 dark:text-gray-300">{item.inventario?.especialidad?.especialidad}</td>
                                                <td className="p-3 text-gray-800 dark:text-gray-300">{item.inventario?.grupoInventario?.grupo}</td>
                                                <td className="p-3 text-gray-800 dark:text-gray-300">{formatDate(item.fecha_vencimiento)}</td>
                                                <td className="p-3 font-bold text-gray-800 dark:text-gray-300">{item.cantidad}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="p-4 text-center text-gray-500 dark:text-gray-400">
                                                No se encontraron resultados.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                        <div className="mt-4 flex justify-end gap-3">
                            <button
                                onClick={handlePrintExpiration}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                                </svg>
                                Imprimir
                            </button>
                            <button
                                onClick={() => setShowExpirationModal(false)}
                                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Print Selection Modal */}
            {showPrintModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowPrintModal(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${modalMode === 'export' ? 'bg-red-100' : 'bg-blue-100'} sm:mx-0 sm:h-10 sm:w-10`}>
                                        <svg className={`h-6 w-6 ${modalMode === 'export' ? 'text-red-600' : 'text-blue-600'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            {modalMode === 'export' ? (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            ) : (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                            )}
                                        </svg>
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100" id="modal-title">
                                            {modalMode === 'print' ? 'Imprimir Inventario' : 'Exportar Inventario a PDF'}
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                                Seleccione el grupo y especialidad para filtrar el inventario a {modalMode === 'print' ? 'imprimir' : 'exportar'}.
                                            </p>

                                            {/* Grupo Selector */}
                                            <div className="mb-4">
                                                <label htmlFor="grupo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Grupo de Inventario
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                                        </svg>
                                                    </div>
                                                    <select
                                                        id="grupo"
                                                        value={selectedGrupoId}
                                                        onChange={handleGrupoChange}
                                                        className="block w-full pl-10 pr-10 py-2.5 text-base border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-shadow shadow-sm"
                                                    >
                                                        <option value="" className="text-gray-500">-- Seleccione un grupo --</option>
                                                        <option value="all">Todos los grupos</option>
                                                        {printGrupos.map((grupo) => (
                                                            <option key={grupo.id} value={grupo.id}>
                                                                {grupo.grupo}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Especialidad Selector */}
                                            <div className="mb-4">
                                                <label htmlFor="especialidad" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Especialidad
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <select
                                                        id="especialidad"
                                                        value={selectedEspecialidadId}
                                                        onChange={(e) => setSelectedEspecialidadId(e.target.value)}
                                                        className="block w-full pl-10 pr-10 py-2.5 text-base border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-shadow shadow-sm"
                                                        disabled={!selectedGrupoId}
                                                    >
                                                        <option value="" className="text-gray-500">-- Seleccione una especialidad --</option>
                                                        <option value="all">Todas las especialidades</option>
                                                        {printEspecialidades.map((esp) => (
                                                            <option key={esp.id} value={esp.id}>
                                                                {esp.especialidad}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${modalMode === 'export' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'} text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${!selectedGrupoId || !selectedEspecialidadId ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                    onClick={modalMode === 'print' ? handleConfirmPrint : handleConfirmExport}
                                    disabled={!selectedGrupoId || !selectedEspecialidadId}
                                >
                                    {modalMode === 'print' ? 'Imprimir' : 'Exportar PDF'}
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-gray-500 hover:bg-gray-600 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setShowPrintModal(false)}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* InventarioForm Modal */}
            <InventarioForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                id={selectedInventarioId}
                onSaveSuccess={() => {
                    fetchInventario();
                    setIsFormOpen(false);
                }}
            />

            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Inventario"
                sections={manualSections}
            />
        </div>
    );
};

export default InventarioList;
