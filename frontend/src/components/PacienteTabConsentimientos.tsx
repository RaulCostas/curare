import React, { useEffect, useState } from 'react';
import api from '../services/api';
import type { Paciente, ConsentimientoPlantilla, ConsentimientoPaciente } from '../types';
import Swal from 'sweetalert2';
import { FileText, Printer, Trash2, CheckCircle2 } from 'lucide-react';
import { formatPaternoMaternoNombre } from '../utils/formatters';



interface PacienteTabConsentimientosProps {
    pacienteId: number;
    paciente?: Paciente;
}

const PacienteTabConsentimientos: React.FC<PacienteTabConsentimientosProps> = ({ pacienteId, paciente: initialPaciente }) => {
    const [paciente, setPaciente] = useState<Paciente | null>(initialPaciente || null);
    const [plantillas, setPlantillas] = useState<ConsentimientoPlantilla[]>([]);
    const [historial, setHistorial] = useState<ConsentimientoPaciente[]>([]);

    // Form state
    const [selectedPlantillaId, setSelectedPlantillaId] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (pacienteId) {
            fetchData();
        }
    }, [pacienteId]);

    const fetchData = async () => {
        try {
            const [pacRes, plantillasRes, historialRes] = await Promise.all([
                api.get(`/pacientes/${pacienteId}`),
                api.get('/consentimientos-plantillas?page=1&limit=9999'),
                api.get(`/consentimientos-pacientes?pacienteId=${pacienteId}`)
            ]);
            setPaciente(pacRes.data);
            const plantillasData = plantillasRes.data?.data || plantillasRes.data || [];
            setPlantillas(plantillasData);
            setHistorial(historialRes.data || []);
        } catch (error) {
            console.error('Error fetching consentimientos data:', error);
        }
    };

    const printConsentimiento = async (titulo: string, contenidoHTML: string) => {
        let centroDental: any = null;
        try {
            const resCentro = await api.get('/datos-centro');
            if (resCentro.data && resCentro.data.length > 0) {
                centroDental = resCentro.data[0];
            }
        } catch (error) {
            console.error('Error fetching centro dental data:', error);
        }

        const footerParts: string[] = [];
        if (centroDental?.nombre_centro) footerParts.push(centroDental.nombre_centro);
        if (centroDental?.direccion) footerParts.push(`Dirección: ${centroDental.direccion}`);
        if (centroDental?.telefono) footerParts.push(`Tel: ${centroDental.telefono}`);
        if (centroDental?.celular) footerParts.push(`Cel: ${centroDental.celular}`);
        if (centroDental?.emergencias) footerParts.push(`Emergencias: ${centroDental.emergencias}`);
        const footerString = footerParts.join(' | ');

        const printWindow = window.open('', '_blank', 'width=850,height=1100');
        if (!printWindow) return;

        printWindow.document.write(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <title>${titulo}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: Arial, sans-serif;
            font-size: 11pt;
            color: #000;
            padding: 20mm 18mm 28mm 18mm;
            line-height: 1.6;
        }
        h1 {
            text-align: center;
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 18px;
            text-transform: uppercase;
        }
        .content p {
            text-align: justify;
            margin-bottom: 8px;
        }
        .content ul, .content ol {
            margin: 6px 0 10px 24px;
        }
        .content li {
            margin-bottom: 4px;
        }
        .signatures {
            margin-top: 50px;
            display: flex;
            justify-content: space-around;
            flex-wrap: wrap;
            gap: 20px;
        }
        .sig-block {
            text-align: center;
            min-width: 180px;
        }
        .sig-line {
            border-top: 1px solid #000;
            width: 200px;
            margin: 0 auto 6px auto;
        }
        .sig-label {
            font-size: 9pt;
            font-weight: bold;
            text-transform: uppercase;
        }
        .sig-bottom {
            margin-top: 40px;
            text-align: center;
        }
        .footer {
            position: fixed;
            bottom: 8mm;
            left: 18mm;
            right: 18mm;
            border-top: 1px solid #ccc;
            padding-top: 4px;
            text-align: center;
            font-size: 8pt;
            color: #555;
        }
        @media print {
            body { padding: 0; }
            .footer { position: fixed; bottom: 5mm; }
        }
    </style>
</head>
<body>
    <h1>${titulo}</h1>
    <div class="content">${contenidoHTML}</div>
    <div class="signatures">
        <div class="sig-block">
            <div class="sig-line"></div>
            <div class="sig-label">Firma del Paciente</div>
        </div>
        <div class="sig-block">
            <div class="sig-line"></div>
            <div class="sig-label">Firma del Testigo / Tutor</div>
        </div>
    </div>
    <div class="sig-bottom">
        <div class="sig-line" style="width:220px"></div>
        <div class="sig-label">Firma del Profesional Tratante</div>
    </div>
    ${footerString ? `<div class="footer">${footerString}</div>` : ''}
    <script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>
        `);
        printWindow.document.close();
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPlantillaId || !paciente) return;

        const plantilla = plantillas.find(p => p.id === Number(selectedPlantillaId));
        if (!plantilla) return;

        setLoading(true);

        const fechaActual = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        let texto = plantilla.contenido;

        const nombreCompleto = formatPaternoMaternoNombre(paciente);
        texto = texto.replace(/{{NOMBRE_PACIENTE}}/g, nombreCompleto || '_____________');
        texto = texto.replace(/{{CI_PACIENTE}}/g, paciente.ci || '_____________');
        texto = texto.replace(/{{FECHA_ACTUAL}}/g, fechaActual);

        try {
            const dataToSave = {
                pacienteId: Number(pacienteId),
                titulo: plantilla.titulo,
                contenido_generado: texto
            };

            await api.post('/consentimientos-pacientes', dataToSave);
            await printConsentimiento(plantilla.titulo, texto);

            await Swal.fire({ icon: 'success', title: '¡Consentimiento Generado!', showConfirmButton: false, timer: 1500 });
            setSelectedPlantillaId('');
            
            const historialRes = await api.get(`/consentimientos-pacientes?pacienteId=${pacienteId}`);
            setHistorial(historialRes.data || []);
        } catch (error) {
            console.error('Error:', error);
            Swal.fire('Error', 'Ocurrió un error al generar el consentimiento', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (conId: number) => {
        const result = await Swal.fire({
            title: '¿Eliminar del historial?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/consentimientos-pacientes/${conId}`);
                await Swal.fire({ icon: 'success', title: '¡Eliminado!', showConfirmButton: false, timer: 1500 });
                const historialRes = await api.get(`/consentimientos-pacientes?pacienteId=${pacienteId}`);
                setHistorial(historialRes.data || []);
            } catch (error) {
                console.error('Error:', error);
                Swal.fire('Error', 'No se pudo eliminar el consentimiento', 'error');
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Header del Tab */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-200 dark:border-gray-700 gap-4 mb-2">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <FileText className="text-blue-500" size={22} />
                        <span>Consentimientos Informados</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                        Generación y registro de consentimientos informados firmados por el paciente
                    </p>
                </div>
            </div>

            {/* Formulario de generación */}
            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">
                            Seleccionar Plantilla de Consentimiento <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedPlantillaId}
                            onChange={e => setSelectedPlantillaId(e.target.value ? Number(e.target.value) : '')}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition duration-200 text-sm"
                            required
                        >
                            <option value="">-- Seleccionar Plantilla --</option>
                            {plantillas.map(p => (
                                <option key={p.id} value={p.id}>{p.titulo}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !selectedPlantillaId}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-xl flex items-center gap-2 transform hover:-translate-y-0.5 transition-all shadow-md disabled:opacity-50 text-sm"
                    >
                        <CheckCircle2 size={18} /> {loading ? 'Generando...' : 'Generar y Descargar PDF'}
                    </button>
                </form>
            </div>

            {/* History Table */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <h4 className="font-bold text-gray-800 dark:text-white text-base mb-4 flex items-center gap-2">
                    <Printer size={18} className="text-purple-600" />
                    Historial de Consentimientos Informados Emitidos
                </h4>

                <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider border-b border-gray-100 dark:border-gray-700">
                                <th className="py-4 px-6 font-semibold">Fecha de Emisión</th>
                                <th className="py-4 px-6 font-semibold">Título del Documento</th>
                                <th className="py-4 px-6 font-semibold text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50 text-sm">
                            {historial.length > 0 ? (
                                historial.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-all text-gray-800 dark:text-gray-200">
                                        <td className="py-4 px-6 text-gray-700 dark:text-gray-300">
                                            {item.fecha ? new Date(item.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
                                        </td>
                                        <td className="py-4 px-6 font-semibold">{item.titulo}</td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => printConsentimiento(item.titulo, item.contenido_generado || '')}
                                                    className="p-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 inline-flex items-center justify-center cursor-pointer"
                                                    title="Imprimir Consentimiento"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="bg-[#dc3545] hover:bg-red-700 text-white p-2 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
                                                    title="Eliminar"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="py-8 text-center text-gray-400 italic">
                                        No se han emitido consentimientos para este paciente aún.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PacienteTabConsentimientos;
