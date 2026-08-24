import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface ConsentimientosPlantillaFormProps {
    isOpen: boolean;
    id: number | null;
    onClose: () => void;
    onSaved: () => void;
}

const quillModules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['clean']
    ],
};

const ConsentimientosPlantillaForm: React.FC<ConsentimientosPlantillaFormProps> = ({ isOpen, id, onClose, onSaved }) => {
    const [titulo, setTitulo] = useState('');
    const [especialidadId, setEspecialidadId] = useState<number | ''>('');
    const [contenido, setContenido] = useState('');
    const [loading, setLoading] = useState(false);
    const [especialidadesList, setEspecialidadesList] = useState<any[]>([]);

    const fetchEspecialidades = async () => {
        try {
            const response = await api.get('/especialidad', { params: { limit: 100 } });
            setEspecialidadesList(response.data.data || response.data || []);
        } catch (error) {
            console.error('Error fetching especialidades:', error);
        }
    };

    useEffect(() => {
        fetchEspecialidades();
    }, []);

    useEffect(() => {
        if (isOpen) {
            if (id) {
                fetchPlantilla();
            } else {
                setTitulo('');
                setEspecialidadId('');
                setContenido('');
            }
        }
    }, [id, isOpen]);

    const fetchPlantilla = async () => {
        try {
            const response = await api.get(`/consentimientos-plantillas/${id}`);
            setTitulo(response.data.titulo);
            setEspecialidadId(response.data.especialidadId || response.data.especialidad?.id || '');
            setContenido(response.data.contenido);
        } catch (error) {
            console.error('Error fetching plantilla:', error);
            Swal.fire('Error', 'No se pudo cargar la plantilla', 'error');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const data = { titulo, especialidadId: especialidadId === '' ? null : Number(especialidadId), contenido };

        try {
            if (id) {
                await api.patch(`/consentimientos-plantillas/${id}`, data);
                await Swal.fire({ icon: 'success', title: 'Consentimiento Actualizado', text: 'Consentimiento informado actualizado exitosamente', timer: 1500, showConfirmButton: false });
            } else {
                await api.post('/consentimientos-plantillas', data);
                await Swal.fire({ icon: 'success', title: 'Consentimiento Creado', text: 'Consentimiento informado creado exitosamente', timer: 1500, showConfirmButton: false });
            }
            onSaved();
            onClose();
        } catch (error) {
            console.error('Error:', error);
            Swal.fire('Error', 'No se pudo guardar la plantilla', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 transition-opacity">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <span className="p-2 bg-purple-100 dark:bg-purple-900 rounded-xl text-purple-600 dark:text-purple-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </span>
                        {id ? 'Editar Consentimiento Informado' : 'Nuevo Consentimiento Informado'}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 bg-transparent hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full transition-all"
                        title="Cerrar"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-5 overflow-y-auto flex-1">
                    <style>{`
                        .consent-editor .ql-editor {
                            min-height: 280px;
                            font-size: 14px;
                            line-height: 1.6;
                        }
                        .consent-editor .ql-toolbar.ql-snow {
                            border-radius: 0.5rem 0.5rem 0 0;
                            background: #f8fafc;
                        }
                        .dark .consent-editor .ql-toolbar.ql-snow {
                            background: #1f2937;
                            border-color: #374151;
                        }
                        .dark .consent-editor .ql-container.ql-snow {
                            border-color: #374151;
                        }
                        .dark .consent-editor .ql-editor {
                            color: #f9fafb;
                        }
                        .dark .consent-editor .ql-editor.ql-blank::before {
                            color: #9ca3af;
                            font-style: italic;
                        }
                        .dark .consent-editor .ql-stroke {
                            stroke: #d1d5db;
                        }
                        .dark .consent-editor .ql-fill {
                            fill: #d1d5db;
                        }
                        .dark .consent-editor .ql-picker-label {
                            color: #d1d5db;
                        }
                    `}</style>

                    <form onSubmit={handleSubmit} id="plantilla-form" className="space-y-4">
                        {/* Título */}
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                Título: <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={titulo}
                                    onChange={(e) => setTitulo(e.target.value)}
                                    placeholder="Ej: Consentimiento para Cirugía..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition duration-200"
                                />
                            </div>
                        </div>

                        {/* Especialidad */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Especialidad (Opcional)
                            </label>
                            <select
                                value={especialidadId}
                                onChange={(e) => setEspecialidadId(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition duration-200"
                            >
                                <option value="">General / Ninguna</option>
                                {especialidadesList.map((esp) => (
                                    <option key={esp.id} value={esp.id}>{esp.especialidad}</option>
                                ))}
                            </select>
                        </div>

                        {/* Contenido con ReactQuill */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Contenido: <span className="text-red-500">*</span>
                                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 font-normal">
                                    Variables disponibles: {'{{NOMBRE_PACIENTE}}'}, {'{{CI_PACIENTE}}'}, {'{{FECHA_ACTUAL}}'}
                                </span>
                            </label>
                            <div className="consent-editor bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600">
                                <ReactQuill
                                    theme="snow"
                                    value={contenido}
                                    onChange={setContenido}
                                    modules={quillModules}
                                    className="h-72 mb-12 dark:text-white"
                                    placeholder="Redacte aquí el texto legal de la plantilla..."
                                />
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-start gap-3 rounded-b-xl">
                    <button
                        type="submit"
                        form="plantilla-form"
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-xl flex items-center gap-2 transform hover:-translate-y-0.5 transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                <polyline points="7 3 7 8 15 8"></polyline>
                            </svg>
                        )}
                        {loading ? 'Guardando...' : (id ? 'Actualizar' : 'Guardar')}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConsentimientosPlantillaForm;
