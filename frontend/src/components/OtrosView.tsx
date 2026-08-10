import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ManualModal, { type ManualSection } from './ManualModal';
import { FileText, Wrench, FolderPlus } from 'lucide-react';

const OtrosView: React.FC = () => {
    const navigate = useNavigate();
    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Módulo de Otros',
            content: 'Panel centralizado para administrar Recibos de caja e Ingresos/Egresos Generales, así como el Mantenimiento y Repuestos de Consultorios Dental.'
        },
        {
            title: 'Navegación por Tarjetas',
            content: 'Haga clic en cualquiera de las tarjetas para acceder a la gestión detallada de Recibos o Mantenimiento de Consultorios.'
        }
    ];

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

    const otrosItems = [
        {
            id: 'otros-recibos',
            title: 'Recibos',
            desc: 'Emisión, registro y consulta de recibos de ingresos y pagos de la clínica',
            path: '/otros/recibos',
            color: 'blue',
            icon: <FileText className="h-8 w-8 text-blue-600 dark:text-blue-300" />
        },
        {
            id: 'otros-mantenimiento',
            title: 'Mantenimiento de Consultorios',
            desc: 'Registro de repuestos, piezas de mano y mantenimientos preventivos y correctivos por consultorio',
            path: '/otros/mantenimiento',
            color: 'green',
            icon: <Wrench className="h-8 w-8 text-green-600 dark:text-green-300" />
        }
    ];

    const getBgColorClass = (color: string) => {
        switch (color) {
            case 'blue': return 'bg-blue-50 dark:bg-blue-900/30 hover:border-blue-500';
            case 'green': return 'bg-green-50 dark:bg-green-900/30 hover:border-green-500';
            default: return 'bg-gray-100 dark:bg-gray-700 hover:border-blue-500';
        }
    };

    return (
        <div className="content-card p-6 bg-gray-50 dark:bg-gray-800 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 no-print gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-2xl shadow-sm">
                        <FolderPlus className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Otros Módulos
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Gestión de recibos independientes y mantenimiento de equipos de consultorio
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowManual(true)}
                    className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[34px] h-[34px] text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                    title="Ayuda / Manual"
                >
                    ?
                </button>
            </div>

            {/* Grid of Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-4xl">
                {otrosItems.map(item => {
                    if (!hasAccess(item.id)) return null;
                    return (
                        <div
                            key={item.id}
                            onClick={() => navigate(item.path)}
                            className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer border-2 border-transparent ${getBgColorClass(item.color)} transform hover:-translate-y-1`}
                        >
                            <div className="flex items-center gap-4 mb-3">
                                <div className={`p-3 rounded-xl ${getBgColorClass(item.color).split(' ')[0]}`}>
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
                title="Manual de Usuario - Módulo Otros"
                sections={manualSections}
            />
        </div>
    );
};

export default OtrosView;
