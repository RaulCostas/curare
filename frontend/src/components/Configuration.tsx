import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ManualModal, { type ManualSection } from './ManualModal';

const Configuration: React.FC = () => {
    const navigate = useNavigate();
    const [showManual, setShowManual] = useState(false);

    const hasAccess = (moduleId: string) => {
        const userStr = localStorage.getItem('user');
        if (!userStr) return true;
        try {
            const user = JSON.parse(userStr);
            const permisos = user.permisos || [];
            return !permisos.includes(moduleId);
        } catch {
            return true;
        }
    };

    const manualSections: ManualSection[] = [
        {
            title: 'Configuración del Sistema',
            content: 'Panel centralizado para administrar ajustes generales, respaldos, catálogos administrativos y seguridad.'
        },
        {
            title: 'Navegación por Tarjetas',
            content: 'Haga clic en cualquiera de las tarjetas para ingresar directamente al módulo de configuración seleccionado.'
        }
    ];

    const configItems = [
        {
            id: 'personal_tipo',
            title: 'Área del Personal',
            desc: 'Configurar los tipos y áreas de personal del consultorio/clínica',
            path: '/personal-tipo',
            color: 'orange',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-600 dark:text-orange-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.282-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.282.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            )
        },
        {
            id: 'backup',
            title: 'Backup de BD',
            desc: 'Crear, restaurar y gestionar copias de seguridad de la base de datos',
            path: '/backup',
            color: 'blue',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
            )
        },
        {
            id: 'cambiar-password',
            title: 'Cambiar Contraseña',
            desc: 'Actualizar la contraseña de seguridad de su cuenta personal',
            path: '/cambiar-password',
            color: 'yellow',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-600 dark:text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            )
        },
        {
            id: 'casos-clinicos',
            title: 'Casos Clínicos',
            desc: 'Gestión de casos clínicos con galerías de fotos (antes/después) y videos',
            path: '/casos-clinicos',
            color: 'blue',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            )
        },
        {
            id: 'config-categorias',
            title: 'Categorías Paciente',
            desc: 'Administrar categorías y listas de precios preferenciales para pacientes',
            path: '/categoria-paciente',
            color: 'indigo',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
            )
        },
        {
            id: 'config-chatbot',
            title: 'Chatbot (WhatsApp)',
            desc: 'Configurar el chatbot automático de respuesta e intentos',
            path: '/configuration/chatbot',
            color: 'green',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
            )
        },
        {
            id: 'config-comision',
            title: 'Comisión Tarjeta',
            desc: 'Gestionar porcentajes y comisiones bancarias por cobro con tarjeta',
            path: '/comision-tarjeta',
            color: 'red',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600 dark:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            )
        },
        {
            id: 'datos-centro',
            title: 'Datos Centro Dental',
            desc: 'Información institucional del centro, dirección, teléfonos y horarios',
            path: '/datos-centro',
            color: 'teal',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-600 dark:text-teal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            )
        },
        {
            id: 'config-especialidad',
            title: 'Especialidades',
            desc: 'Administrar las especialidades clínicas disponibles en el sistema',
            path: '/especialidad',
            color: 'teal',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-600 dark:text-teal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            )
        },
        {
            id: 'config-forma-pago',
            title: 'Formas de Pago',
            desc: 'Configurar métodos de pago (Efectivo, QR, Transferencia, Tarjeta)',
            path: '/forma-pago',
            color: 'cyan',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-600 dark:text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            )
        },
        {
            id: 'config-grupos',
            title: 'Grupos Inventario',
            desc: 'Asignar categorías y agrupaciones de insumos / productos',
            path: '/grupo-inventario',
            color: 'pink',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-pink-600 dark:text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
            )
        },
        {
            id: 'config-musica-television',
            title: 'Música / Televisión',
            desc: 'Gestionar enlaces de entretenimiento para la sala de espera',
            path: '/musica-television',
            color: 'purple',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600 dark:text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
            )
        },
        {
            id: 'consentimientos-plantillas',
            title: 'Plantillas Consentimientos',
            desc: 'Modelos de consentimiento informado redactados para firma de pacientes',
            path: '/consentimientos-plantillas',
            color: 'purple',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600 dark:text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            )
        },
        {
            id: 'recetas-predisenadas',
            title: 'Recetas Prediseñadas',
            desc: 'Plantillas preconfiguradas de medicamentos para prescripción rápida',
            path: '/recetas-predisenadas',
            color: 'indigo',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )
        },
        {
            id: 'usuarios',
            title: 'Usuarios',
            desc: 'Gestionar usuarios del sistema, credenciales y sus permisos',
            path: '/users',
            color: 'emerald',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600 dark:text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            )
        }
    ];

    const getBgColorClass = (color: string) => {
        switch (color) {
            case 'orange': return 'bg-orange-100 dark:bg-orange-900/40 hover:border-orange-500';
            case 'blue': return 'bg-blue-100 dark:bg-blue-900/40 hover:border-blue-500';
            case 'yellow': return 'bg-yellow-100 dark:bg-yellow-900/40 hover:border-yellow-500';
            case 'indigo': return 'bg-indigo-100 dark:bg-indigo-900/40 hover:border-indigo-500';
            case 'green': return 'bg-green-100 dark:bg-green-900/40 hover:border-green-500';
            case 'red': return 'bg-red-100 dark:bg-red-900/40 hover:border-red-500';
            case 'teal': return 'bg-teal-100 dark:bg-teal-900/40 hover:border-teal-500';
            case 'cyan': return 'bg-cyan-100 dark:bg-cyan-900/40 hover:border-cyan-500';
            case 'pink': return 'bg-pink-100 dark:bg-pink-900/40 hover:border-pink-500';
            case 'purple': return 'bg-purple-100 dark:bg-purple-900/40 hover:border-purple-500';
            case 'emerald': return 'bg-emerald-100 dark:bg-emerald-900/40 hover:border-emerald-500';
            default: return 'bg-gray-100 dark:bg-gray-700 hover:border-blue-500';
        }
    };

    return (
        <div className="content-card p-6 bg-gray-50 dark:bg-gray-800 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 no-print gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Configuración del Sistema
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Ajustes generales, parámetros administrativos y catálogos
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowManual(true)}
                    className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="Ayuda / Manual"
                >
                    ?
                </button>
            </div>

            {/* Grid of Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...configItems].sort((a, b) => a.title.localeCompare(b.title, 'es')).map(item => {
                    if (!hasAccess(item.id)) return null;
                    return (
                        <div
                            key={item.id}
                            onClick={() => navigate(item.path)}
                            className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer border-2 border-transparent ${getBgColorClass(item.color)} transform hover:-translate-y-1`}
                        >
                            <div className="flex items-center gap-4 mb-3">
                                <div className={`p-3 rounded-xl ${getBgColorClass(item.color).split(' ')[0]} ${getBgColorClass(item.color).split(' ')[1]}`}>
                                    {item.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                    {item.title}
                                </h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {item.desc}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Manual Modal */}
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Configuración"
                sections={manualSections}
            />
        </div>
    );
};

export default Configuration;
