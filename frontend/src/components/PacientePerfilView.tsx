import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api, { getMediaUrl } from '../services/api';
import type { Paciente } from '../types';
import FichaMedicaTab from './FichaMedicaTab';
import PacienteCitasTab from './PacienteCitasTab';
import PresupuestoList from './PresupuestoList';
import HistoriaClinica from './HistoriaClinica';
import PacientePagosTab from './PacientePagosTab';
import PacienteImagenesTab from './PacienteImagenesTab';
import PropuestasList from './PropuestasList';
import PacienteRecetarioTab from './PacienteRecetarioTab';
import PacienteTabInformes from './PacienteTabInformes';
import PacienteTabConsentimientos from './PacienteTabConsentimientos';
import { formatCurrency } from '../utils/formatters';
import {
    User, Calendar, FileText, CreditCard, Image as ImageIcon, ClipboardList,
    ArrowLeft, Edit, Activity, Heart, CheckCircle, PlusSquare, FileCheck
} from 'lucide-react';

type TabType = 'ficha-medica' | 'citas' | 'presupuestos' | 'historia-clinica' | 'pagos' | 'imagenes' | 'propuestas' | 'recetario' | 'informes' | 'consentimientos';

const PacientePerfilView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const [paciente, setPaciente] = useState<Paciente | null>(null);
    const [loading, setLoading] = useState(true);
    const [prefMusica, setPrefMusica] = useState<string[]>([]);
    const [prefTv, setPrefTv] = useState<string[]>([]);
    
    const [stats, setStats] = useState({
        totalCitas: 0,
        totalPlanes: 0,
        totalPagos: 0,
        totalPagado: 0
    });

    // Determine initial tab from pathname or default to 'ficha-medica'
    const getInitialTab = (): TabType => {
        const path = location.pathname.toLowerCase();
        if (path.includes('/citas')) return 'citas';
        if (path.includes('/presupuestos')) return 'presupuestos';
        if (path.includes('/historia-clinica')) return 'historia-clinica';
        if (path.includes('/pagos')) return 'pagos';
        if (path.includes('/imagenes')) return 'imagenes';
        if (path.includes('/propuestas')) return 'propuestas';
        if (path.includes('/recetario')) return 'recetario';
        if (path.includes('/informes')) return 'informes';
        if (path.includes('/consentimientos')) return 'consentimientos';
        if (path.includes('/ficha-medica')) return 'ficha-medica';
        return 'ficha-medica';
    };

    const [activeTab, setActiveTab] = useState<TabType>(getInitialTab());

    useEffect(() => {
        setActiveTab(getInitialTab());
    }, [location.pathname]);

    useEffect(() => {
        if (id) {
            fetchPaciente();
            fetchStats();
            fetchPreferences();
        }
    }, [id]);

    const fetchPreferences = async () => {
        try {
            const [musicaListRes, tvListRes, pMusicaRes, pTvRes] = await Promise.allSettled([
                api.get('/musica'),
                api.get('/television'),
                api.get(`/pacientes/${id}/musica`),
                api.get(`/pacientes/${id}/television`)
            ]);

            const allMusica = musicaListRes.status === 'fulfilled' ? musicaListRes.value.data : [];
            const allTv = tvListRes.status === 'fulfilled' ? tvListRes.value.data : [];
            const userMusicaIds: number[] = pMusicaRes.status === 'fulfilled' ? pMusicaRes.value.data : [];
            const userTvIds: number[] = pTvRes.status === 'fulfilled' ? pTvRes.value.data : [];

            const musicaNames = allMusica
                .filter((m: any) => userMusicaIds.includes(m.id))
                .map((m: any) => m.musica);

            const tvNames = allTv
                .filter((t: any) => userTvIds.includes(t.id))
                .map((t: any) => t.television);

            setPrefMusica(musicaNames);
            setPrefTv(tvNames);
        } catch (err) {
            console.error('Error fetching patient preferences:', err);
        }
    };

    const fetchPaciente = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/pacientes/${id}`);
            setPaciente(response.data);
        } catch (error) {
            console.error('Error fetching paciente header:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const [proformasRes, pagosRes, citasRes] = await Promise.allSettled([
                api.get(`/proformas/paciente/${id}`),
                api.get(`/pagos/paciente/${id}`),
                api.get(`/agenda/paciente/${id}`)
            ]);

            let proformasCount = 0;
            if (proformasRes.status === 'fulfilled') {
                proformasCount = Array.isArray(proformasRes.value.data) ? proformasRes.value.data.length : 0;
            }

            let pagosCount = 0;
            let pagadoMonto = 0;
            if (pagosRes.status === 'fulfilled') {
                const pagosList = Array.isArray(pagosRes.value.data) ? pagosRes.value.data : [];
                pagosCount = pagosList.length;
                pagadoMonto = pagosList.reduce((acc: number, curr: any) => acc + Number(curr.monto || 0), 0);
            }

            let citasCount = 0;
            if (citasRes.status === 'fulfilled') {
                const citasList = Array.isArray(citasRes.value.data) ? citasRes.value.data : [];
                citasCount = citasList.length;
            }

            setStats({
                totalCitas: citasCount,
                totalPlanes: proformasCount,
                totalPagos: pagosCount,
                totalPagado: pagadoMonto
            });
        } catch (error) {
            console.error('Error fetching patient stats:', error);
        }
    };

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        navigate(`/pacientes/${id}/${tab}`);
    };

    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
        { id: 'ficha-medica', label: 'FICHA MÉDICA', icon: <Heart size={15} /> },
        { id: 'citas', label: 'CITAS', icon: <Calendar size={15} /> },
        { id: 'presupuestos', label: 'PLANES DE TRATAMIENTO', icon: <CreditCard size={15} /> },
        { id: 'historia-clinica', label: 'HISTORIA CLÍNICA', icon: <Activity size={15} /> },
        { id: 'pagos', label: 'PAGOS', icon: <FileText size={15} /> },
        { id: 'imagenes', label: 'IMÁGENES', icon: <ImageIcon size={15} /> },
        { id: 'propuestas', label: 'PROPUESTAS', icon: <ClipboardList size={15} /> },
        { id: 'recetario', label: 'RECETAS', icon: <PlusSquare size={15} /> },
        { id: 'informes', label: 'INFORMES', icon: <FileText size={15} /> },
        { id: 'consentimientos', label: 'CONSENTIMIENTOS', icon: <FileCheck size={15} /> },
    ];

    const calcularEdad = (fechaNac?: string) => {
        if (!fechaNac) return 'N/A';
        const birthDate = new Date(fechaNac);
        const age = new Date().getFullYear() - birthDate.getFullYear();
        return `${age} años`;
    };

    const formatCelularWithCode = (celular?: string) => {
        if (!celular) return 'N/A';
        const clean = celular.replace(/[\s\(\)\+]/g, '');
        if (!clean) return 'N/A';
        if (clean.startsWith('591')) {
            return `(+591) ${clean.substring(3)}`;
        }
        return `(+591) ${clean}`;
    };

    const pacienteIdNum = Number(id);

    return (
        <div className="flex flex-col min-h-full">
            {/* ── Navigation bar ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-4 px-1">
                <button
                    onClick={() => navigate('/pacientes')}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 text-sm"
                >
                    <ArrowLeft size={16} /> Volver a Pacientes
                </button>
                {paciente && (
                <button
                    onClick={() => navigate(`/pacientes/edit/${id}`)}
                    className="bg-amber-400 hover:bg-amber-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 text-sm"
                >
                    <Edit size={16} /> Editar Paciente
                </button>
                )}
            </div>

            {/* ── Patient Header ──────────────────────────────────────────────── */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-900 dark:to-slate-900 rounded-2xl p-5 mb-4 text-white shadow-lg">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner flex-shrink-0 overflow-hidden">
                            {paciente?.foto ? (
                                <img src={getMediaUrl(`pacientes/foto/file/${paciente.foto.replace(/^\/+/, '')}`)} alt="Foto" className="w-full h-full object-cover" />
                            ) : (
                                <User size={28} className="text-white" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight leading-tight">
                                {loading ? 'Cargando...' : paciente ? `${paciente.paterno} ${paciente.materno} ${paciente.nombre}` : `Paciente #${id}`}
                            </h1>
                            {paciente && (
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1.5 text-blue-100 text-xs">
                                {paciente.fecha_nacimiento && <span>🎂 {calcularEdad(paciente.fecha_nacimiento)}</span>}
                                {paciente.celular && <span>📱 {formatCelularWithCode(paciente.celular)}</span>}
                                {paciente.email && <span>✉️ {paciente.email}</span>}
                                
                                {prefMusica.length > 0 && (
                                    <span className="bg-white/20 text-white px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 shadow-sm">
                                        🎵 <span>Música: <strong className="text-yellow-300">{prefMusica.join(', ')}</strong></span>
                                    </span>
                                )}

                                {prefTv.length > 0 && (
                                    <span className="bg-white/20 text-white px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 shadow-sm">
                                        📺 <span>TV: <strong className="text-cyan-300">{prefTv.join(', ')}</strong></span>
                                    </span>
                                )}

                                {paciente.categoria && (
                                    <span className="px-2 py-0.5 bg-white/20 rounded-full font-bold">
                                        🏷️ {paciente.categoria.descripcion || paciente.categoria.sigla}
                                    </span>
                                )}
                                <span className={`px-2 py-0.5 rounded-full font-bold ${
                                    paciente.estado === 'activo' ? 'bg-emerald-500/30 text-emerald-300' : 'bg-red-500/30 text-red-300'
                                }`}>
                                    {paciente.estado === 'activo' ? '● Activo' : '● Inactivo'}
                                </span>
                            </div>
                            )}
                        </div>
                    </div>
                    {paciente && paciente.categoria && (
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-center">
                            <div className="text-[9px] text-blue-200 uppercase tracking-widest mb-0.5">Clasificación</div>
                            <div className="text-3xl font-black drop-shadow text-yellow-300">
                                {paciente.categoria.sigla}
                            </div>
                        </div>
                    </div>
                    )}
                </div>

                {/* Quick stats row */}
                <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/20">
                    {[
                        { label: 'Citas', value: stats.totalCitas, Icon: Calendar },
                        { label: 'Planes', value: stats.totalPlanes, Icon: CreditCard },
                        { label: 'Pagos', value: stats.totalPagos, Icon: FileText },
                        { label: 'Total Pagado', value: `Bs. ${formatCurrency(stats.totalPagado)}`, Icon: CheckCircle },
                    ].map(({ label, value, Icon }) => (
                        <div key={label} className="bg-white/10 rounded-xl p-2 text-center hover:bg-white/20 transition-colors">
                            <Icon size={14} className="mx-auto mb-0.5 text-blue-200" />
                            <div className="text-base font-black leading-tight">{value}</div>
                            <div className="text-[9px] text-blue-200 uppercase tracking-wider">{label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Tab Bar ─────────────────────────────────────────────────────── */}
            <div
                className="flex gap-1 p-1.5 bg-gray-100 dark:bg-gray-700 rounded-2xl border border-gray-200 dark:border-gray-600 mb-4 overflow-x-auto custom-tab-scrollbar pb-2"
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(156, 163, 175, 0.6) transparent'
                }}
            >
                <style>{`
                    .custom-tab-scrollbar::-webkit-scrollbar {
                        height: 6px;
                    }
                    .custom-tab-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-tab-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(156, 163, 175, 0.5);
                        border-radius: 9999px;
                    }
                    .custom-tab-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: rgba(107, 114, 128, 0.8);
                    }
                `}</style>
                {tabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`flex-shrink-0 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${
                                isActive
                                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-gray-200 dark:ring-gray-600'
                                    : 'bg-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Active Tab Content Area */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm min-h-[400px]">
                {activeTab === 'ficha-medica' && (
                    <FichaMedicaTab pacienteId={pacienteIdNum} onUpdateSuccess={fetchPaciente} />
                )}
                {activeTab === 'citas' && (
                    <PacienteCitasTab pacienteId={pacienteIdNum} paciente={paciente} />
                )}
                {activeTab === 'presupuestos' && (
                    <PresupuestoList />
                )}
                {activeTab === 'historia-clinica' && (
                    <HistoriaClinica />
                )}
                {activeTab === 'pagos' && (
                    <PacientePagosTab pacienteId={pacienteIdNum} />
                )}
                {activeTab === 'imagenes' && (
                    <PacienteImagenesTab pacienteId={pacienteIdNum} />
                )}
                {activeTab === 'propuestas' && (
                    <PropuestasList />
                )}
                {activeTab === 'recetario' && (
                    <PacienteRecetarioTab pacienteId={pacienteIdNum} />
                )}
                {activeTab === 'informes' && (
                    <PacienteTabInformes pacienteId={pacienteIdNum} paciente={paciente} />
                )}
                {activeTab === 'consentimientos' && (
                    <PacienteTabConsentimientos pacienteId={pacienteIdNum} paciente={paciente || undefined} />
                )}
            </div>

        </div>
    );
};

export default PacientePerfilView;
