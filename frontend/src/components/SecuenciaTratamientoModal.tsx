import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import type { Paciente, Proforma } from '../types';

interface SecuenciaTratamientoModalProps {
    isOpen: boolean;
    onClose: () => void;
    pacienteId: number;
    selectedProformaId?: number;
    onSuccess: () => void;
    onOmitir?: () => void;
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
    { name: 'odontopediatria', label: 'Odontopediatría' }
];

const SecuenciaTratamientoModal: React.FC<SecuenciaTratamientoModalProps> = ({
    isOpen,
    onClose,
    pacienteId,
    selectedProformaId = 0,
    onSuccess,
    onOmitir
}) => {
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

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            resetForm();
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                pacienteId,
                proformaId: selectedProformaId > 0 ? selectedProformaId : undefined
            };

            await api.post('/secuencia-tratamiento', payload);
            
            await Swal.fire({
                icon: 'success',
                title: 'Registro Guardado',
                text: 'Secuencia de tratamiento guardada correctamente',
                timer: 1500,
                showConfirmButton: false,
                customClass: { container: '!z-[9999]' }
            });

            onSuccess();
            handleClose();
        } catch (error) {
            console.error('Error saving secuencia:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al guardar la secuencia de tratamiento',
                customClass: { container: '!z-[9999]' }
            });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
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
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1100] p-3 sm:p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto border border-gray-100 dark:border-gray-700">
                <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-2xl flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg sm:text-xl font-bold">
                        Paso 3: Registrar Secuencia de Tratamiento
                    </h3>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {/* Fecha */}
                        <div className="col-span-1 md:col-span-2 lg:col-span-3 mb-2">
                            <label className="block mb-2 font-bold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">Fecha</label>
                            <div className="relative w-full md:w-1/3">
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
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                        </div>

                        {/* Campos dinámicos */}
                        {fields.map(field => (
                            <div key={field.name} className="flex flex-col">
                                <label className="block mb-1.5 font-bold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider">{field.label}</label>
                                <div className="relative">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                    <input
                                        type="text"
                                        name={field.name}
                                        value={formData[field.name]}
                                        onChange={handleInputChange}
                                        placeholder={`${field.label}...`}
                                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Disable button if all fields are empty */}
                    {(() => {
                        const hasContent = fields.some(field => formData[field.name]?.trim() !== '');
                        return (
                            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 justify-start">
                                <button
                                    type="submit"
                                    disabled={loading || !hasContent}
                                    className="px-5 py-2.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-xl font-bold shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                        <polyline points="7 3 7 8 15 8"></polyline>
                                    </svg>
                                    {loading ? 'Guardando...' : 'Guardar Secuencia'}
                                </button>
                                {onOmitir && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onOmitir();
                                            handleClose();
                                        }}
                                        disabled={loading}
                                        className="px-5 py-2.5 bg-gray-500 hover:bg-gray-600 active:scale-95 text-white rounded-xl font-bold shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                        </svg>
                                        Omitir
                                    </button>
                                )}
                            </div>
                        );
                    })()}
                </form>
            </div>
        </div>
    );
};

export default SecuenciaTratamientoModal;
