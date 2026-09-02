import React, { useState, useEffect } from 'react';
import api, { getMediaUrl } from '../services/api';
import type { EstudioComplementario, Paciente } from '../types';
import { formatDate } from '../utils/dateUtils';
import Swal from 'sweetalert2';
import EstudioComplementarioModal from './EstudioComplementarioModal';
import ManualModal, { type ManualSection } from './ManualModal';
import Pagination from './Pagination';
import {
    Activity,
    Plus,
    Search,
    FileText,
    Edit,
    Trash2,
    Printer,
    ExternalLink,
    X,
    Image as ImageIcon
} from 'lucide-react';

interface PacienteEstudiosComplementariosTabProps {
    pacienteId: number;
    paciente?: Paciente | null;
}

const PacienteEstudiosComplementariosTab: React.FC<PacienteEstudiosComplementariosTabProps> = ({
    pacienteId,
    paciente: initialPaciente,
}) => {
    const [paciente, setPaciente] = useState<Paciente | null>(initialPaciente || null);
    const [estudios, setEstudios] = useState<EstudioComplementario[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [estudioToEdit, setEstudioToEdit] = useState<EstudioComplementario | null>(null);
    const [showManual, setShowManual] = useState(false);

    // Preview state
    const [previewFile, setPreviewFile] = useState<{
        url: string;
        title: string;
        isPdf: boolean;
    } | null>(null);

    const manualSections: ManualSection[] = [
        {
            title: 'Estudios Complementarios',
            content: 'Este módulo permite registrar, gestionar y consultar los estudios de diagnóstico complementarios del paciente, tales como Radiografías Panorámicas, Periapicales, Tomografías CBCT, Telerradiografías o Análisis de Laboratorio.'
        },
        {
            title: 'Subida de Archivos',
            content: 'Puede adjuntar tanto la "Orden de Estudio Médica" emitida como el "Archivo Resultado" final entregado por el centro radiológico o laboratorio en formato de Imagen (JPG, PNG, WEBP) o Documento PDF.'
        },
        {
            title: 'Acciones Disponibles',
            content: (
                <ul className="list-disc pl-5 space-y-1">
                    <li>👁️ <strong>Previsualizar:</strong> Permite ver en pantalla completa el archivo de la orden médica o el resultado.</li>
                    <li>📱 <strong>WhatsApp:</strong> Envía el comprobante y detalle del estudio al número de celular del paciente.</li>
                    <li>🖨️ <strong>Imprimir:</strong> Genera la ficha del estudio complementario con membrete, logo oficial y las imágenes adjuntas.</li>
                    <li>✏️ <strong>Editar:</strong> Modifica la fecha, tipo de estudio, observaciones o sustituye los archivos adjuntos.</li>
                    <li>🗑️ <strong>Eliminar:</strong> Borra de forma permanente el registro del estudio y sus archivos asociados.</li>
                </ul>
            )
        }
    ];

    useEffect(() => {
        if (pacienteId) {
            fetchEstudios();
            if (!paciente) {
                fetchPaciente();
            }
        }
    }, [pacienteId]);

    const fetchPaciente = async () => {
        try {
            const res = await api.get(`/pacientes/${pacienteId}`);
            setPaciente(res.data);
        } catch (error) {
            console.error('Error al cargar datos del paciente:', error);
        }
    };

    const fetchEstudios = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/estudios-complementarios?pacienteId=${pacienteId}`);
            const data = Array.isArray(response.data) ? response.data : [];
            setEstudios(data);
        } catch (error) {
            console.error('Error al obtener estudios complementarios:', error);
            setEstudios([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Está seguro de eliminar?',
            text: 'Esta acción eliminará el estudio complementario y los archivos adjuntos. No se podrá revertir.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
            color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/estudios-complementarios/${id}`);
                Swal.fire({
                    icon: 'success',
                    title: 'Eliminado',
                    text: 'Estudio complementario eliminado correctamente.',
                    timer: 1500,
                    showConfirmButton: false,
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
                fetchEstudios();
            } catch (error) {
                console.error('Error al eliminar estudio:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo eliminar el estudio complementario.',
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
            }
        }
    };

    const resolveFileUrl = (pathOrUrl?: string) => {
        if (!pathOrUrl) return '';
        if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://') || pathOrUrl.startsWith('data:')) {
            return pathOrUrl;
        }
        const clean = pathOrUrl.replace(/^\/+/, '');
        return getMediaUrl(`uploads/${clean}`);
    };

    const isPdfFile = (pathOrUrl?: string) => {
        if (!pathOrUrl) return false;
        return /\.pdf($|\?)/i.test(pathOrUrl);
    };

    const handleOpenPreview = (fileUrl: string, title: string) => {
        const fullUrl = resolveFileUrl(fileUrl);
        setPreviewFile({
            url: fullUrl,
            title,
            isPdf: isPdfFile(fileUrl),
        });
    };

    const handleWhatsApp = async (estudio: EstudioComplementario) => {
        const celular = paciente?.celular;
        if (!celular) {
            Swal.fire({
                icon: 'warning',
                title: 'Atención',
                text: 'El paciente no tiene un número de celular registrado.',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
            return;
        }

        const patientName = paciente
            ? `${paciente.paterno || ''} ${paciente.materno || ''} ${paciente.nombre || ''}`.trim()
            : 'Estimado paciente';

        let ordenUrl = estudio.orden_estudio_url ? resolveFileUrl(estudio.orden_estudio_url) : '';
        let resultadoUrl = estudio.archivo_url ? resolveFileUrl(estudio.archivo_url) : '';

        let mensaje = `Hola *${patientName}*, le compartimos la constancia de su *Estudio Complementario* en CURARE Centro Dental:\n\n`;
        mensaje += `📅 *Fecha:* ${formatDate(estudio.fecha)}\n`;
        mensaje += `🔬 *Tipo de Estudio:* ${estudio.tipo_estudio}\n`;
        if (estudio.observaciones) {
            mensaje += `📝 *Observaciones:* ${estudio.observaciones}\n`;
        }
        if (ordenUrl) {
            mensaje += `\n📄 *Orden de Estudio:* ${ordenUrl}\n`;
        }
        if (resultadoUrl) {
            mensaje += `\n📊 *Resultado:* ${resultadoUrl}\n`;
        }
        mensaje += `\n¡Quedamos atentos a su consulta!`;

        const cleanCel = celular.replace(/[^0-9]/g, '');
        const targetCel = cleanCel.startsWith('591') ? cleanCel : `591${cleanCel}`;
        const waLink = `https://wa.me/${targetCel}?text=${encodeURIComponent(mensaje)}`;
        window.open(waLink, '_blank');
    };

    // Imprimir Ficha del Estudio Complementario mostrando las imágenes y membrete oficial
    const handlePrint = (estudio: EstudioComplementario) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const patientName = paciente
            ? `${paciente.paterno || ''} ${paciente.materno || ''} ${paciente.nombre || ''}`.trim().toUpperCase()
            : 'N/A';

        const fechaFormateada = formatDate(estudio.fecha);
        const ordenUrl = estudio.orden_estudio_url ? resolveFileUrl(estudio.orden_estudio_url) : '';
        const resultadoUrl = estudio.archivo_url ? resolveFileUrl(estudio.archivo_url) : '';

        const hasOrdenImage = ordenUrl && !isPdfFile(ordenUrl);
        const hasResultadoImage = resultadoUrl && !isPdfFile(resultadoUrl);
        const hasOrdenPdf = ordenUrl && isPdfFile(ordenUrl);
        const hasResultadoPdf = resultadoUrl && isPdfFile(resultadoUrl);

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Estudio Complementario - ${patientName}</title>
                <style>
                    @page { size: A4 portrait; margin: 12mm 15mm; }
                    body {
                        font-family: Arial, Helvetica, sans-serif;
                        margin: 0;
                        padding: 0;
                        color: #1e293b;
                        background: #fff;
                    }
                    .header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin-bottom: 12px;
                        padding-bottom: 12px;
                    }
                    .header img {
                        height: 52px;
                        object-fit: contain;
                    }
                    .header-title {
                        text-align: center;
                        flex: 1;
                        font-size: 20px;
                        font-weight: bold;
                        color: #2c3e50;
                        letter-spacing: 0.5px;
                        text-transform: uppercase;
                    }
                    .divider-line {
                        height: 2.5px;
                        background-color: #3498db;
                        width: 100%;
                        margin-bottom: 16px;
                    }
                    .info-box {
                        background-color: #f8f9fa;
                        border-left: 5px solid #3498db;
                        padding: 12px 16px;
                        border-radius: 2px;
                        margin-bottom: 18px;
                    }
                    .info-row {
                        margin-bottom: 6px;
                        font-size: 13px;
                    }
                    .info-row:last-child {
                        margin-bottom: 0;
                    }
                    .info-label {
                        font-weight: bold;
                        width: 160px;
                        display: inline-block;
                        color: #1e293b;
                    }
                    .info-value {
                        color: #1e293b;
                    }
                    .section-title {
                        font-weight: bold;
                        font-size: 13px;
                        color: #2c3e50;
                        margin-top: 18px;
                        margin-bottom: 8px;
                        text-transform: uppercase;
                    }
                    .obs-box {
                        background: #fff;
                        border: 1px solid #cbd5e1;
                        padding: 12px 14px;
                        border-radius: 4px;
                        font-size: 12.5px;
                        line-height: 1.5;
                        color: #334155;
                        margin-bottom: 16px;
                    }
                    .images-container {
                        display: flex;
                        flex-direction: column;
                        gap: 20px;
                        margin-top: 14px;
                    }
                    .image-card {
                        border: 1px solid #e2e8f0;
                        border-radius: 6px;
                        padding: 10px;
                        text-align: center;
                        background: #f8fafc;
                        page-break-inside: avoid;
                    }
                    .image-card-title {
                        font-size: 12px;
                        font-weight: bold;
                        color: #1e3a8a;
                        margin-bottom: 8px;
                        text-transform: uppercase;
                        letter-spacing: 0.3px;
                    }
                    .image-card img {
                        max-width: 100%;
                        max-height: 480px;
                        object-fit: contain;
                        border-radius: 4px;
                        border: 1px solid #cbd5e1;
                        background: #fff;
                    }
                    .pdf-badge {
                        display: inline-block;
                        padding: 10px 16px;
                        background-color: #fee2e2;
                        border: 1px solid #fca5a5;
                        color: #991b1b;
                        border-radius: 6px;
                        font-size: 12px;
                        font-weight: bold;
                    }
                    .signature-area {
                        margin-top: 50px;
                        text-align: center;
                        page-break-inside: avoid;
                    }
                    .signature-line {
                        width: 220px;
                        margin: 0 auto 8px auto;
                        border-top: 1px solid #334155;
                    }
                    .signature-title {
                        font-size: 12px;
                        font-weight: bold;
                        color: #1e293b;
                    }
                    .footer-date {
                        margin-top: 25px;
                        text-align: right;
                        font-size: 11px;
                        color: #64748b;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="/logo-curare.png" alt="Curare Centro Dental" />
                    <div class="header-title">ESTUDIO COMPLEMENTARIO</div>
                    <div style="width: 52px;"></div>
                </div>

                <div class="divider-line"></div>

                <div class="info-box">
                    <div class="info-row">
                        <span class="info-label">PACIENTE:</span>
                        <span class="info-value" style="font-weight: bold; font-size: 14px;">${patientName}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">FECHA DE EMISIÓN:</span>
                        <span class="info-value">${fechaFormateada}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">TIPO DE ESTUDIO:</span>
                        <span class="info-value" style="font-weight: bold; color: #2563eb;">${estudio.tipo_estudio}</span>
                    </div>
                </div>

                ${estudio.observaciones ? `
                    <div class="section-title">Observaciones / Indicaciones Médicas</div>
                    <div class="obs-box">
                        ${estudio.observaciones.replace(/\n/g, '<br>')}
                    </div>
                ` : ''}

                <div class="images-container">
                    ${hasOrdenImage ? `
                        <div class="image-card">
                            <div class="image-card-title">📄 Orden de Estudio Médica</div>
                            <img src="${ordenUrl}" alt="Orden de Estudio" />
                        </div>
                    ` : hasOrdenPdf ? `
                        <div class="image-card">
                            <div class="image-card-title">📄 Orden de Estudio Médica</div>
                            <div class="pdf-badge">Documento PDF Adjunto: ${ordenUrl.split('/').pop()}</div>
                        </div>
                    ` : ''}

                    ${hasResultadoImage ? `
                        <div class="image-card">
                            <div class="image-card-title">📊 Archivo Resultado del Estudio</div>
                            <img src="${resultadoUrl}" alt="Resultado del Estudio" />
                        </div>
                    ` : hasResultadoPdf ? `
                        <div class="image-card">
                            <div class="image-card-title">📊 Archivo Resultado del Estudio</div>
                            <div class="pdf-badge">Documento PDF Adjunto: ${resultadoUrl.split('/').pop()}</div>
                        </div>
                    ` : ''}
                </div>

                <div class="signature-area">
                    <div class="signature-line"></div>
                    <div class="signature-title">Firma y Sello Odontológico</div>
                </div>

                <div class="footer-date">
                    Fecha de impresión: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </div>

                <script>
                    window.onload = function() {
                        setTimeout(function() { window.print(); }, 450);
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    // Filter studies
    const filteredEstudios = estudios.filter((e) => {
        const matchSearch =
            (e.tipo_estudio && e.tipo_estudio.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (e.observaciones && e.observaciones.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (e.fecha && e.fecha.includes(searchTerm));
        return matchSearch;
    });

    const totalPages = Math.ceil(filteredEstudios.length / pageSize) || 1;
    const paginatedEstudios = filteredEstudios.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="space-y-4 animate-fadeIn">
            
            {/* ── Tab Header ───────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-200 dark:border-gray-700 gap-4 mb-4">
                <div>
                    <h3 className="text-xl font-black text-gray-800 dark:text-white flex items-center gap-2.5">
                        <Activity className="text-blue-500 dark:text-blue-400" size={24} />
                        <span>Estudios Complementarios</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                        Registro y consulta de radiografías, tomografías, análisis de laboratorio y órdenes médicas.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[34px] h-[34px] text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shadow-sm cursor-pointer"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>

                    <button
                        onClick={() => {
                            setEstudioToEdit(null);
                            setIsModalOpen(true);
                        }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 text-sm cursor-pointer"
                    >
                        <Plus size={18} />
                        <span>Nuevo Estudio</span>
                    </button>
                </div>
            </div>

            {/* ── Standard Search Bar ──────────────────────────────────────────── */}
            <div className="mb-4 flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-gray-800 p-3.5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 no-print">
                <div className="flex items-center gap-2 max-w-md w-full">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Buscar por tipo de estudio u observaciones..."
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-800 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-300 text-sm"
                        />
                        <Search size={18} className="text-gray-400 absolute left-3 top-2.5" />
                    </div>
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                            className="px-3.5 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-medium rounded-xl text-sm transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap cursor-pointer"
                            title="Limpiar búsqueda"
                        >
                            <X size={16} />
                            Limpiar
                        </button>
                    )}
                </div>
            </div>

            {/* ── Contador: Mostrando x - y de z registros ─────────────────────── */}
            <div className="mb-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                Mostrando {filteredEstudios.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredEstudios.length)} de {filteredEstudios.length} registros
            </div>

            {/* ── Table / Grid Area ────────────────────────────────────────────── */}
            {loading ? (
                <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-3"></div>
                    Cargando estudios complementarios...
                </div>
            ) : filteredEstudios.length === 0 ? (
                <div className="bg-gray-50 dark:bg-gray-800/60 p-10 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
                    <Activity size={36} className="mx-auto text-gray-400 mb-2 opacity-60" />
                    <p className="text-base font-bold text-gray-700 dark:text-gray-300 mb-1">
                        {searchTerm ? 'No se encontraron estudios coincidentes' : 'No hay estudios complementarios registrados'}
                    </p>
                    <p className="text-xs max-w-md mx-auto">
                        {searchTerm
                            ? 'Intente modificar los términos de búsqueda.'
                            : 'Haga clic en "+ Nuevo Estudio" para registrar una orden o resultado de radiografía, tomografía o laboratorio.'}
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tipo de Estudio</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Observaciones</th>
                                    <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Orden Médica</th>
                                    <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Resultado</th>
                                    <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider no-print">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {paginatedEstudios.map((estudio) => {
                                    const hasOrden = Boolean(estudio.orden_estudio_url);
                                    const hasArchivo = Boolean(estudio.archivo_url);

                                    return (
                                        <tr key={estudio.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            
                                            {/* Fecha Normal */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {formatDate(estudio.fecha)}
                                            </td>

                                            {/* Tipo de Estudio (Sin punto azul) */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                {estudio.tipo_estudio}
                                            </td>

                                            {/* Observaciones */}
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                                {estudio.observaciones || '-'}
                                            </td>

                                            {/* Orden Médica */}
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                {hasOrden ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenPreview(estudio.orden_estudio_url!, `Orden de Estudio - ${estudio.tipo_estudio}`)}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer shadow-sm"
                                                        title="Ver Orden de Estudio"
                                                    >
                                                        {isPdfFile(estudio.orden_estudio_url) ? (
                                                            <FileText size={14} className="text-red-500" />
                                                        ) : (
                                                            <ImageIcon size={14} className="text-indigo-500" />
                                                        )}
                                                        <span>Ver Orden</span>
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">No adjuntado</span>
                                                )}
                                            </td>

                                            {/* Archivo Resultado */}
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                {hasArchivo ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenPreview(estudio.archivo_url!, `Resultado - ${estudio.tipo_estudio}`)}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer shadow-sm"
                                                        title="Ver Archivo de Resultado"
                                                    >
                                                        {isPdfFile(estudio.archivo_url) ? (
                                                            <FileText size={14} className="text-red-500" />
                                                        ) : (
                                                            <ImageIcon size={14} className="text-emerald-500" />
                                                        )}
                                                        <span>Ver Resultado</span>
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">No adjuntado</span>
                                                )}
                                            </td>

                                            {/* Acciones */}
                                            <td className="px-6 py-4 text-center whitespace-nowrap no-print">
                                                <div className="flex items-center justify-center gap-2">
                                                    {/* Imprimir Ficha del Estudio con Imágenes */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handlePrint(estudio)}
                                                        className="p-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                                                        title="Imprimir Ficha de Estudio"
                                                    >
                                                        <Printer size={16} />
                                                    </button>

                                                    {/* Editar */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEstudioToEdit(estudio);
                                                            setIsModalOpen(true);
                                                        }}
                                                        className="p-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                                                        title="Editar Estudio"
                                                    >
                                                        <Edit size={16} />
                                                    </button>

                                                    {/* Eliminar */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(estudio.id)}
                                                        className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                                                        title="Eliminar Estudio"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>

                                                </div>
                                            </td>

                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination (10 en 10) */}
                    {totalPages > 1 && (
                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-center">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={(page) => setCurrentPage(page)}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* ── Modal de Registro / Edición ──────────────────────────────────── */}
            <EstudioComplementarioModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                pacienteId={pacienteId}
                estudioToEdit={estudioToEdit}
                onSaveSuccess={fetchEstudios}
            />

            {/* ── Modal de Ayuda / Manual ──────────────────────────────────────── */}
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Estudios Complementarios"
                sections={manualSections}
            />

            {/* ── Modal Visor / Preview ────────────────────────────────────────── */}
            {previewFile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
                    <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#131927] border border-[#263147] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                        
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-[#212c40] flex items-center justify-between bg-[#182133]">
                            <div className="flex items-center gap-2 text-white font-bold text-sm truncate">
                                {previewFile.isPdf ? (
                                    <FileText size={18} className="text-red-400 flex-shrink-0" />
                                ) : (
                                    <ImageIcon size={18} className="text-blue-400 flex-shrink-0" />
                                )}
                                <span className="truncate">{previewFile.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={previewFile.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    download
                                    className="p-2 text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold px-3 cursor-pointer shadow-sm"
                                    title="Abrir en pestaña nueva / Descargar"
                                >
                                    <ExternalLink size={14} className="text-white" />
                                    <span>Abrir</span>
                                </a>
                                <button
                                    type="button"
                                    onClick={() => setPreviewFile(null)}
                                    className="text-gray-400 bg-transparent hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full transition-all cursor-pointer"
                                    title="Cerrar"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[#0d121d] min-h-[400px]">
                            {previewFile.isPdf ? (
                                <iframe
                                    src={previewFile.url}
                                    title={previewFile.title}
                                    className="w-full h-[75vh] rounded-xl border border-gray-800"
                                />
                            ) : (
                                <img
                                    src={previewFile.url}
                                    alt={previewFile.title}
                                    className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-lg"
                                />
                            )}
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
};

export default PacienteEstudiosComplementariosTab;
