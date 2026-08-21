import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import type { SecuenciaTratamiento, Paciente } from '../types';
import { formatDateUTC } from '../utils/formatters';
import ManualModal, { type ManualSection } from './ManualModal';
import Pagination from './Pagination';

interface Props {
    pacienteId: number;
    paciente: Paciente | null;
    selectedProformaId: number;
}

const getLocalDateString = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const fields = [
    { name: 'periodoncia', label: 'Periodoncia' },
    { name: 'cirugia', label: 'Cirugía' },
    { name: 'endodoncia', label: 'Endodoncia' },
    { name: 'operatoria', label: 'Operatoria' },
    { name: 'protesis', label: 'Prótesis' },
    { name: 'implantes', label: 'Implantes' },
    { name: 'ortodoncia', label: 'Ortodoncia' },
    { name: 'odontopediatria', label: 'Odontopediatría' },
];

const SecuenciaTratamientoManager: React.FC<Props> = ({ pacienteId, paciente, selectedProformaId }) => {
    const [secuencias, setSecuencias] = useState<SecuenciaTratamiento[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Secuencia de Tratamiento',
            content: 'Registro cronológico y detallado de los procedimientos realizados en cada especialidad.'
        },
        {
            title: 'Especialidades',
            content: 'Puede registrar avances específicos en áreas como Periodoncia, Cirugía, Endodoncia, Operatoria, Prótesis, Implantes, Ortodoncia y Odontopediatría.'
        },
        {
            title: 'Gestión',
            content: 'Use "Nueva Secuencia" para agregar un registro diario. Puede editar o eliminar registros existentes si es necesario. Use el botón de imprimir para generar un reporte físico.'
        }
    ];

    // Form State
    const [formData, setFormData] = useState<any>({
        fecha: getLocalDateString(),
        periodoncia: '',
        cirugia: '',
        endodoncia: '',
        operatoria: '',
        protesis: '',
        implantes: '',
        ortodoncia: '',
        odontopediatria: ''
    });
    const [editingId, setEditingId] = useState<number | null>(null);

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        if (selectedProformaId) {
            fetchSecuencia();
        } else {
            setSecuencias([]);
        }
    }, [selectedProformaId]);

    const fetchSecuencia = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/secuencia-tratamiento/proforma/${selectedProformaId}`);
            setSecuencias(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching secuencia:', error);
            setSecuencias([]);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item: SecuenciaTratamiento) => {
        setEditingId(item.id);
        setFormData({
            fecha: item.fecha.split('T')[0],
            periodoncia: item.periodoncia || '',
            cirugia: item.cirugia || '',
            endodoncia: item.endodoncia || '',
            operatoria: item.operatoria || '',
            protesis: item.protesis || '',
            implantes: item.implantes || '',
            ortodoncia: item.ortodoncia || '',
            odontopediatria: item.odontopediatria || ''
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Está seguro?',
            text: "No podrá revertir esta acción",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return;

        try {
            await api.delete(`/secuencia-tratamiento/${id}`);
            fetchSecuencia();
            if (editingId === id) resetForm();
            Swal.fire({
                icon: 'success',
                title: '¡Eliminado!',
                text: 'El registro ha sido eliminado.',
                showConfirmButton: false,
                timer: 1500
            });
        } catch (error) {
            console.error('Error deleting secuencia:', error);
            Swal.fire(
                'Error',
                'Hubo un problema al eliminar el registro.',
                'error'
            );
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            fecha: getLocalDateString(),
            periodoncia: '',
            cirugia: '',
            endodoncia: '',
            operatoria: '',
            protesis: '',
            implantes: '',
            ortodoncia: '',
            odontopediatria: ''
        });
        setShowForm(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...formData,
                pacienteId,
                proformaId: selectedProformaId
            };

            if (editingId) {
                await api.patch(`/secuencia-tratamiento/${editingId}`, payload);
            } else {
                await api.post('/secuencia-tratamiento', payload);
            }

            await fetchSecuencia();
            resetForm();
        } catch (error) {
            console.error('Error saving secuencia:', error);
            alert('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const filteredSecuencias = useMemo(() => {
        if (!searchTerm) return secuencias;
        const term = searchTerm.toLowerCase();
        return secuencias.filter(item => {
            return fields.some(f => {
                const val = (item as any)[f.name];
                return val && val.toLowerCase().includes(term);
            }) || (item.fecha && item.fecha.includes(term));
        });
    }, [secuencias, searchTerm]);

    // Pagination
    const totalPages = Math.ceil(filteredSecuencias.length / itemsPerPage);
    const paginatedSecuencias = filteredSecuencias.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset to page 1 when search changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const date = new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Historial de Secuencia - Plan #${selectedProformaId}</title>
                <style>
                    @page {
                        size: A4 landscape;
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
                    
                    .plan-info {
                        margin: 20px 0;
                        padding: 10px;
                        background-color: #f8f9fa;
                        border-left: 4px solid #3498db;
                        font-size: 11px;
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 15px;
                    }
                    
                    th {
                        background-color: #ebf5fb;
                        color: #1e293b;
                        padding: 10px 6px;
                        text-align: left;
                        font-weight: bold;
                        border: 1px solid #cbd5e1;
                        font-size: 10px;
                    }
                    
                    td {
                        padding: 6px;
                        border: 1px solid #ddd;
                        font-size: 9px;
                    }
                    
                    tr:nth-child(even) {
                        background-color: #f8f9fa;
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
                        body {
                            margin: 0;
                        }
                        
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
                        
                        .plan-info {
                            background-color: #f8f9fa !important;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                    @page { size: A4 landscape; margin: 1.5cm; }
                    body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #333; }
                    .header { display: flex; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #3498db; }
                    .header img { height: 60px; margin-right: 20px; }
                    h1 { color: #2c3e50; margin: 0; font-size: 24px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background-color: #3498db; color: white; padding: 10px 6px; text-align: left; font-weight: bold; border: 1px solid #2980b9; font-size: 10px; }
                    td { padding: 6px; border: 1px solid #ddd; font-size: 9px; }
                    tr:nth-child(even) { background-color: #f8f9fa; }
                    .footer { position: fixed; bottom: 0; left: 0; right: 0; padding: 10px 0; }
                    .footer-line { border-top: 1px solid #333; margin-bottom: 10px; }
                    .footer-content { display: flex; justify-content: flex-end; font-size: 9px; color: #666; }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="/logo-curare.png" alt="Curare Centro Dental">
                    <h1>Secuencia de Tratamiento</h1>
                </div>
                
                <div style="margin-bottom: 20px; padding: 10px; background-color: #f8f9fa; border-left: 4px solid #3498db;">
                    <p style="margin: 0 0 5px 0;"><strong>PACIENTE:</strong> ${paciente ? `${paciente.paterno} ${paciente.materno || ''} ${paciente.nombre}`.toUpperCase() : `Paciente #${pacienteId}`}</p>
                    <p style="margin: 0;"><strong>PLAN DE TRATAMIENTO:</strong> Plan #${selectedProformaId}</p>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            ${fields.map(f => `<th>${f.label}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredSecuencias.map(item => `
                            <tr>
                                <td>${formatDateUTC(item.fecha)}</td>
                                ${fields.map(f => `<td>${(item as any)[f.name] || ''}</td>`).join('')}
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
                
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                            window.close();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `;
        printWindow.document.write(printContent);
        printWindow.document.close();
    };

    if (!selectedProformaId || selectedProformaId === 0) {
        return (
            <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm text-center text-gray-500 dark:text-gray-400">
                <div className="flex flex-col items-center justify-center py-6">
                    <span className="p-3.5 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-2xl mb-3 shadow-inner">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 022 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                    </span>
                    <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-1">Seleccione un Plan de Tratamiento</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                        Por favor, seleccione un Plan de Tratamiento en el desplegable superior para ver o registrar las secuencias de tratamiento correspondientes.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-colors duration-300">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <span className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 022 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                </span>
                <span>Historial de Secuencia de Tratamiento</span>
            </h3>

            {(showForm || editingId) && (
                <form onSubmit={handleSubmit} className="mb-8 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 animate-fade-in-down">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <div>
                            <label className="block mb-2 font-bold text-gray-700 dark:text-gray-300 text-sm">Fecha</label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                <input
                                    type="date"
                                    name="fecha"
                                    value={formData.fecha}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        {fields.map(field => (
                            <div key={field.name}>
                                <label className="block mb-2 font-bold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wide">{field.label}</label>
                                <div className="relative">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-3 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                    <textarea
                                        name={field.name}
                                        value={formData[field.name]}
                                        onChange={handleChange}
                                        rows={2}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-y min-h-[50px]"
                                        placeholder={`${field.label}...`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className={`px-6 py-2 rounded-lg font-bold text-white shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 ${editingId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-600 hover:bg-green-700'
                                } ${saving ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            {saving ? 'Guardando...' : (editingId ? 'Actualizar Registro' : 'Guardar Registro')}
                        </button>
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {/* Search Bar & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 border-b border-gray-200 dark:border-gray-700 pb-6">
                <div className="flex items-center gap-2 w-full md:max-w-md">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Buscar en el historial..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-300 text-sm"
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

                <div className="flex gap-3">
                    <button
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>
                    {!showForm && !editingId && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            Nueva Secuencia
                        </button>
                    )}
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-bold shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 cursor-pointer"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <polyline points="6 9 6 2 18 2 18 9"></polyline>
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                            <rect x="6" y="14" width="12" height="8"></rect>
                        </svg>
                        Imprimir
                    </button>
                </div>
            </div>

            <div className="flex justify-between items-center mb-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">
                    Mostrando <span className="text-gray-800 dark:text-gray-200">{filteredSecuencias.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredSecuencias.length)}</span> de <span>{filteredSecuencias.length}</span> registros
                </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[100px]">Fecha</th>
                            {fields.map(f => (
                                <th key={f.name} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[140px]">{f.label}</th>
                            ))}
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[100px]">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedSecuencias.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-medium">{formatDateUTC(item.fecha)}</td>
                                {fields.map(f => (
                                    <td key={f.name} className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{(item as any)[f.name] || '-'}</td>
                                ))}
                                <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="p-1.5 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                            title="Editar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                            title="Eliminar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {paginatedSecuencias.length === 0 && (
                            <tr>
                                <td colSpan={fields.length + 2} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                                    <div className="flex flex-col items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-lg font-medium">{searchTerm ? 'No se encontraron resultados.' : 'No hay secuencia de tratamiento registrada.'}</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Secuencia de Tratamiento"
                sections={manualSections}
            />
        </div >
    );
};

export default SecuenciaTratamientoManager;
