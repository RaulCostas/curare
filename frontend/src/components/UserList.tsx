import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';
import PermisosModal from './PermisosModal';
import UserForm from './UserForm';
import type { User } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Pagination from './Pagination';
import ManualModal, { type ManualSection } from './ManualModal';


const UserList: React.FC = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [showPermisosModal, setShowPermisosModal] = useState(false);
    const [selectedUserForPermisos, setSelectedUserForPermisos] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [showManual, setShowManual] = useState(false);
    
    // Modal state for UserForm
    const [isUserFormOpen, setIsUserFormOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

    const limit = 10;

    const manualSections: ManualSection[] = [
        {
            title: 'Gestión de Usuarios',
            content: 'Control de acceso al sistema. Cree usuarios para Doctores, Recepcionistas o Administradores.'
        },
        {
            title: 'Agregar Usuario',
            content: 'Use el botón azul "+ Nuevo Usuario". Puede asignar si es Recepcionista (vista limitada) o asignar un Código Proforma.'
        },
        {
            title: 'Permisos y Restricciones',
            content: 'El botón gris con candado permite configurar detalladamente a qué módulos tiene acceso cada usuario.'
        },
        {
            title: 'Estado',
            content: 'Haga clic en la etiqueta "Activo/Inactivo" en la tabla para cambiar rápidamente el acceso del usuario sin eliminarlo.'
        }
    ];

    useEffect(() => {
        fetchUsers();
    }, [currentPage, searchTerm]);

    const fetchUsers = async () => {
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: limit.toString(),
            });
            if (searchTerm) {
                params.append('search', searchTerm);
            }
            const response = await api.get(`/users?${params}`);
            if (response.data && Array.isArray(response.data.data)) {
                setUsers(response.data.data);
                setTotalPages(response.data.totalPages || 1);
                setTotal(response.data.total || response.data.data.length);
            } else if (Array.isArray(response.data)) {
                let allUsers: User[] = response.data;
                if (searchTerm.trim()) {
                    const term = searchTerm.toLowerCase();
                    allUsers = allUsers.filter(u =>
                        (u.name && u.name.toLowerCase().includes(term)) ||
                        (u.email && u.email.toLowerCase().includes(term)) ||
                        (u.codigo_proforma && u.codigo_proforma.toString().includes(term))
                    );
                }
                const totalRecs = allUsers.length;
                const pages = Math.ceil(totalRecs / limit) || 1;
                const startIndex = (currentPage - 1) * limit;
                const paginated = allUsers.slice(startIndex, startIndex + limit);

                setUsers(paginated);
                setTotalPages(pages);
                setTotal(totalRecs);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleStatusChange = async (user: User) => {
        const newStatus = user.estado?.toLowerCase() === 'activo' ? 'inactivo' : 'activo';
        try {
            await api.patch(`/users/${user.id}`, { estado: newStatus });
            fetchUsers();
        } catch (error) {
            console.error('Error changing user status:', error);
            Swal.fire('Error', 'No se pudo cambiar el estado del usuario', 'error');
        }
    };

    const handleDelete = async (user: User) => {
        const result = await Swal.fire({
            title: '¿Dar de baja a este usuario?',
            text: `El usuario ${user.name} cambiará su estado a inactivo.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, dar de baja',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.patch(`/users/${user.id}`, { estado: 'inactivo' });
                await Swal.fire({
                    icon: 'success',
                    title: '¡Usuario dado de baja!',
                    showConfirmButton: false,
                    timer: 1500
                });
                fetchUsers();
            } catch (error) {
                console.error('Error updating user status:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo dar de baja el usuario'
                });
            }
        }
    };

    const handleReactivate = async (user: User) => {
        const result = await Swal.fire({
            title: '¿Reactivar usuario?',
            text: `El usuario ${user.name} volverá a estar activo.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, reactivar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.patch(`/users/${user.id}`, { estado: 'activo' });
                await Swal.fire({
                    icon: 'success',
                    title: '¡Usuario reactivado!',
                    showConfirmButton: false,
                    timer: 1500
                });
                fetchUsers();
            } catch (error) {
                console.error('Error reactivating user:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo reactivar el usuario'
                });
            }
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const exportToExcel = () => {
        try {
            const excelData = users.map(user => ({
                'ID': user.id,
                'Nombre': user.name,
                'Email': user.email,
                'Estado': user.estado,
                'Recepcionista': user.recepcionista ? 'Si' : 'No',
                'Código Proforma': user.codigo_proforma || ''
            }));

            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');

            const date = new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `usuarios_${date}.xlsx`);
        } catch (error) {
            alert('Error al exportar a Excel');
        }
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text('Lista de Usuarios', 14, 22);

            const date = new Date().toLocaleDateString('es-ES');
            doc.setFontSize(10);
            doc.text(`Fecha: ${date}`, 14, 30);

            const tableData = users.map(user => [
                user.id,
                user.name,
                user.email,
                user.estado,
                user.recepcionista ? 'Sí' : 'No',
                user.codigo_proforma || ''
            ]);

            autoTable(doc, {
                head: [['ID', 'Nombre', 'Email', 'Estado', 'Recep.', 'Cod. Prof.']],
                body: tableData,
                startY: 35,
            });

            doc.save(`usuarios_${date}.pdf`);
        } catch (error) {
            alert('Error al exportar a PDF');
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
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600 dark:text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                            Usuarios
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Gestionar usuarios del sistema, credenciales y sus permisos
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
                            setSelectedUserId(null);
                            setIsUserFormOpen(true);
                        }}
                        className="bg-[#3498db] hover:bg-blue-600 text-white font-semibold py-2 px-5 rounded-xl flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 text-sm"
                    >
                        <span className="text-xl">+</span> Nuevo Usuario
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 no-print">
                <div className="flex items-center gap-2 max-w-md w-full">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Buscar por nombre o email..."
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
                Mostrando {total === 0 ? 0 : (currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, total)} de {total} registros
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Foto</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {Array.isArray(users) && users.map((user, index) => (
                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="p-3 text-gray-700 dark:text-gray-300">{(currentPage - 1) * limit + index + 1}</td>
                                <td className="p-3">
                                    {user.foto ? (
                                        <img src={user.foto} alt={user.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-white font-bold">
                                            {user.name.charAt(0)}
                                        </div>
                                    )}
                                </td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">{user.name}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">{user.email}</td>
                                <td className="p-3 text-gray-700 dark:text-gray-300">
                                    <span
                                        onClick={() => handleStatusChange(user)}
                                        className={`px-2 py-1 rounded text-sm font-medium cursor-pointer ${user.estado?.toLowerCase() === 'activo'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                            }`}
                                    >
                                        {user.estado}
                                    </span>
                                </td>
                                <td className="p-3 flex gap-2">
                                    <button
                                        onClick={() => {
                                            setSelectedUserForPermisos(user);
                                            setShowPermisosModal(true);
                                        }}
                                        className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                        title="Restricciones de Acceso"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedUserId(user.id);
                                            setIsUserFormOpen(true);
                                        }}
                                        className="p-2 bg-amber-400 hover:bg-amber-500 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                        title="Editar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                    </button>
                                    {user.estado?.toLowerCase() === 'activo' ? (
                                        <button
                                            onClick={() => handleDelete(user)}
                                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                                            title="Dar de baja"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleReactivate(user)}
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

            {users.length === 0 && (
                <p className="text-center mt-5 text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'No se encontraron resultados' : 'No hay usuarios registrados'}
                </p>
            )}

            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            )}

            {/* Modal Form for Users */}
            <UserForm
                isOpen={isUserFormOpen}
                onClose={() => setIsUserFormOpen(false)}
                id={selectedUserId}
                onSaveSuccess={() => {
                    fetchUsers();
                    setIsUserFormOpen(false);
                }}
            />

            {showPermisosModal && selectedUserForPermisos && (
                <PermisosModal
                    user={selectedUserForPermisos}
                    isOpen={showPermisosModal}
                    onClose={() => setShowPermisosModal(false)}
                    onSave={() => {
                        fetchUsers();
                    }}
                />
            )}

            {/* Manual Modal */}
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Usuarios"
                sections={manualSections}
            />
        </div>
    );
};

export default UserList;
