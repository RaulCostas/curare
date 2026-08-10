import React, { useEffect, useState } from 'react';
import api from '../services/api';
import type { Doctor } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Pagination from './Pagination';
import ManualModal, { type ManualSection } from './ManualModal';
import DoctorForm from './DoctorForm';
import Swal from 'sweetalert2';
import { Stethoscope, X } from 'lucide-react';

interface PaginatedResponse {
    data: Doctor[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const DoctorList: React.FC = () => {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [showManual, setShowManual] = useState(false);
    
    // Modal State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);

    const limit = 10;

    const manualSections: ManualSection[] = [
        {
            title: 'Agregar Nuevo Doctor',
            content: 'Haga clic en el botón azul "+ Nuevo Doctor" en la parte superior derecha. Complete el formulario con los datos requeridos (nombre, apellidos, celular, dirección, especialidad) y guarde.'
        },
        {
            title: 'Editar Doctor',
            content: 'Localice al doctor en la lista y haga clic en el botón amarillo con el icono de lápiz. Modifique los datos necesarios y guarde los cambios.'
        },
        {
            title: 'Dar de Baja y Reactivar',
            content: 'Para doctores activos, el botón rojo (papelera) cambia el estado a "Inactivo" sin eliminar el registro. Para doctores inactivos, aparece un botón verde (check) que permite reactivarlos a estado "Activo".'
        },
        {
            title: 'Búsqueda',
            content: 'Utilice la barra de búsqueda superior para encontrar doctores por nombre o apellido. Escriba y la lista se filtrará automáticamente.'
        },
        {
            title: 'Exportar e Imprimir',
            content: 'Puede exportar la lista completa a Excel o PDF, o imprimirla directamente usando los botones correspondientes en la parte superior.'
        }
    ];

    const formatCelular = (celular: string) => {
        if (!celular) return '';
        const countryCodes = ['+591', '+54', '+55', '+56', '+51', '+595', '+598', '+57', '+52', '+34', '+1'];
        const code = countryCodes.find(c => celular.startsWith(c));
        if (code) {
            const number = celular.substring(code.length);
            return `(${code}) ${number}`;
        }
        return celular;
    };

    useEffect(() => {
        fetchDoctors();
    }, [currentPage, searchTerm]);

    const fetchDoctors = async () => {
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: limit.toString(),
            });

            if (searchTerm) {
                params.append('search', searchTerm);
            }

            const response = await api.get<PaginatedResponse>(`/doctors?${params}`);
            setDoctors(response.data.data || []);
            setTotalPages(response.data.totalPages || 1);
            setTotal(response.data.total || 0);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    const fetchAllDoctors = async (): Promise<Doctor[]> => {
        try {
            const params = new URLSearchParams({
                page: '1',
                limit: '10000',
            });
            if (searchTerm) params.append('search', searchTerm);

            const response = await api.get<PaginatedResponse>(`/doctors?${params}`);
            return response.data.data || [];
        } catch (error) {
            console.error('Error fetching all doctors:', error);
            return [];
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Dar de baja?',
            text: 'El doctor cambiará a estado Inactivo.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, dar de baja',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.patch(`/doctors/${id}`, { estado: 'inactivo' });
                await Swal.fire({
                    title: '¡Dado de baja!',
                    text: 'El doctor ha sido desactivado.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchDoctors();
            } catch (error) {
                console.error('Error deactivating doctor:', error);
                Swal.fire('Error', 'No se pudo desactivar el doctor', 'error');
            }
        }
    };

    const handleReactivate = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Reactivar doctor?',
            text: 'El doctor volverá a estar Activo.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, reactivar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.patch(`/doctors/${id}`, { estado: 'activo' });
                await Swal.fire({
                    title: '¡Reactivado!',
                    text: 'El doctor ha sido reactivado.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchDoctors();
            } catch (error) {
                console.error('Error reactivating doctor:', error);
                Swal.fire('Error', 'No se pudo reactivar el doctor', 'error');
            }
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const exportToExcel = async () => {
        try {
            const allDoctors = await fetchAllDoctors();
            const excelData = allDoctors.map((doctor, index) => ({
                'Nº': index + 1,
                'Nombres': doctor.nombre,
                'Apellido Paterno': doctor.paterno,
                'Apellido Materno': doctor.materno,
                'Celular': doctor.celular,
                'Dirección': doctor.direccion || 'N/A',
                'Especialidad': doctor.especialidad?.especialidad || 'N/A',
                'Estado': doctor.estado
            }));

            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Doctores');
            XLSX.writeFile(wb, `Doctores_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            Swal.fire('Error', 'Error al exportar a Excel', 'error');
        }
    };

    const exportToPDF = async () => {
        try {
            const allDoctors = await fetchAllDoctors();
            const doc = new jsPDF();

            doc.setFontSize(18);
            doc.text('Lista de Doctores', 14, 20);

            const tableData = allDoctors.map((doctor, index) => [
                (index + 1).toString(),
                `${doctor.nombre} ${doctor.paterno} ${doctor.materno}`,
                doctor.celular,
                doctor.direccion || 'N/A',
                doctor.especialidad?.especialidad || 'N/A',
                doctor.estado
            ]);

            autoTable(doc, {
                head: [['Nº', 'Nombre Completo', 'Celular', 'Dirección', 'Especialidad', 'Estado']],
                body: tableData,
                startY: 30,
            });

            doc.save(`Doctores_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            Swal.fire('Error', 'Error al exportar a PDF', 'error');
        }
    };

    return (
        <div className="content-card">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 no-print gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl shadow-sm">
                        <Stethoscope className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
                            Lista de Doctores
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                            Gestión de doctores odontólogos, especialidades y datos de contacto
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
                        className="bg-[#28a745] hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-xl flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 text-sm"
                        title="Exportar a Excel"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg> Excel
                    </button>
                    <button
                        onClick={exportToPDF}
                        className="bg-[#dc3545] hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-xl flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 text-sm"
                        title="Exportar a PDF"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg> PDF
                    </button>
                    <button
                        onClick={() => {
                            setSelectedDoctorId(null);
                            setIsDrawerOpen(true);
                        }}
                        className="bg-[#3498db] hover:bg-blue-600 text-white font-semibold py-2 px-5 rounded-xl flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 text-sm"
                    >
                        <span className="text-xl">+</span> Nuevo Doctor
                    </button>
                </div>
            </div>

            <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 no-print flex justify-between items-center">
                <div className="flex items-center gap-2 flex-grow max-w-md">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Buscar por nombre, paterno o materno..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-300 text-sm"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchTerm('');
                                setCurrentPage(1);
                            }}
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
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre Completo</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Celular</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dirección</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Especialidad</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {doctors.map((doctor, index) => (
                            <tr key={doctor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="p-3 text-gray-700 dark:text-gray-300">{(currentPage - 1) * limit + index + 1}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">{`${doctor.paterno || ''} ${doctor.materno || ''} ${doctor.nombre || ''}`}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">{formatCelular(doctor.celular)}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">{doctor.direccion || 'N/A'}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">{doctor.especialidad?.especialidad || 'N/A'}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-sm font-medium ${doctor.estado === 'activo'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                        }`}>
                                        {doctor.estado}
                                    </span>
                                </td>
                                <td className="p-3 flex gap-2">
                                    <button
                                        onClick={() => {
                                            setSelectedDoctorId(doctor.id);
                                            setIsDrawerOpen(true);
                                        }}
                                        className="p-2 bg-amber-400 hover:bg-amber-500 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                        title="Editar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                    </button>
                                    {doctor.estado === 'activo' ? (
                                        <button
                                            onClick={() => handleDelete(doctor.id)}
                                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                            title="Dar de baja"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleReactivate(doctor.id)}
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

            {doctors.length === 0 && (
                <p className="text-center mt-5 text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'No se encontraron resultados' : 'No hay doctores registrados'}
                </p>
            )}

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />

            {/* Doctor Form Drawer */}
            <DoctorForm
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                id={selectedDoctorId}
                onSaveSuccess={() => {
                    fetchDoctors();
                    setIsDrawerOpen(false);
                }}
            />

            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Doctores"
                sections={manualSections}
            />
        </div>
    );
};

export default DoctorList;
