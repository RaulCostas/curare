import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import api from '../services/api';
import type { Paciente, Proforma } from '../types';
import SearchableSelect, { type Option } from './SearchableSelect';
import Swal from 'sweetalert2';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    sourcePacienteId: number;
    sourcePacienteNombre: string;
    sourceProformaId: number;
    maxAmount: number;
    onSuccess: () => void;
}

const TraspasoSaldoModal: React.FC<Props> = ({
    isOpen,
    onClose,
    sourcePacienteId,
    sourcePacienteNombre,
    sourceProformaId,
    maxAmount,
    onSuccess
}) => {
    const [transferType, setTransferType] = useState<'same' | 'other'>('same');

    // Paciente Destino - backend driven search results
    const [pacientes, setPacientes] = useState<Paciente[]>([]);
    const [loadingPacientes, setLoadingPacientes] = useState(false);
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [targetPacienteId, setTargetPacienteId] = useState<number>(0);
    const [targetProformaId, setTargetProformaId] = useState<number>(0);
    const [targetProformas, setTargetProformas] = useState<Proforma[]>([]);
    const [amount, setAmount] = useState<number | string>(maxAmount);
    const [loadingProformas, setLoadingProformas] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setAmount(maxAmount);
            setTransferType('same');
            setPacientes([]);
            setTargetPacienteId(0);
            setTargetProformaId(0);
            fetchTargetProformas(sourcePacienteId);
        }
    }, [isOpen, maxAmount, sourcePacienteId]);

    const searchPacientes = useCallback(async (term: string) => {
        if (!term.trim()) {
            setPacientes([]);
            return;
        }
        setLoadingPacientes(true);
        try {
            const res = await api.get(`/pacientes?search=${encodeURIComponent(term)}&limit=20`);
            const rawList = Array.isArray(res.data?.data)
                ? res.data.data
                : (Array.isArray(res.data) ? res.data : []);
            // Exclude source patient
            const filtered = rawList.filter((p: any) =>
                p.id !== sourcePacienteId &&
                (!p.estado || p.estado.toLowerCase() === 'activo')
            );
            setPacientes(filtered);
        } catch (err) {
            console.error('Error searching pacientes:', err);
            setPacientes([]);
        } finally {
            setLoadingPacientes(false);
        }
    }, [sourcePacienteId]);

    const handleSearchChange = (term: string) => {
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(() => {
            searchPacientes(term);
        }, 300);
    };

    const fetchTargetProformas = async (pacId: number) => {
        if (!pacId) {
            setTargetProformas([]);
            return;
        }
        setLoadingProformas(true);
        try {
            const res = await api.get(`/proformas/paciente/${pacId}`);
            setTargetProformas(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error fetching proformas for transfer:', err);
            setTargetProformas([]);
        } finally {
            setLoadingProformas(false);
        }
    };

    const handleTransferTypeChange = (type: 'same' | 'other') => {
        setTransferType(type);
        setTargetProformaId(0);
        setTargetPacienteId(0);
        setPacientes([]);
        if (type === 'same') {
            fetchTargetProformas(sourcePacienteId);
        } else {
            setTargetProformas([]);
        }
    };

    const handleTargetPacienteChange = (val: number | string) => {
        const id = Number(val);
        setTargetPacienteId(id);
        setTargetProformaId(0);
        if (id > 0) fetchTargetProformas(id);
        else setTargetProformas([]);
    };

    // Patient options built from backend search results
    const patientOptions: Option[] = useMemo(() => {
        return pacientes.map(p => ({
            id: p.id,
            label: [p.paterno, p.materno, p.nombre].filter(Boolean).join(' '),
            subLabel: p.ci ? `CI: ${p.ci}` : undefined,
        }));
    }, [pacientes]);

    const fireSwal = (options: any) => {
        return Swal.fire({
            ...options,
            customClass: {
                ...options.customClass,
                container: '!z-[9999]'
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const numAmount = parseFloat(String(amount).replace(',', '.'));

        if (isNaN(numAmount) || numAmount <= 0 || numAmount > maxAmount) {
            fireSwal({
                icon: 'error',
                title: 'Monto inválido',
                text: `El monto debe ser mayor a 0 y no puede superar el saldo disponible (Bs. ${maxAmount.toFixed(2)})`
            });
            return;
        }

        const effectiveTargetPacienteId = transferType === 'same' ? sourcePacienteId : targetPacienteId;

        if (transferType === 'other' && !effectiveTargetPacienteId) {
            fireSwal({
                icon: 'warning',
                title: 'Seleccione un Paciente',
                text: 'Debe seleccionar el paciente destino del traspaso.'
            });
            return;
        }

        if (!targetProformaId || targetProformaId === 0) {
            fireSwal({
                icon: 'warning',
                title: 'Seleccione un Plan Destino',
                text: 'Debe seleccionar obligatoriamente un plan de tratamiento destino para realizar el traspaso.'
            });
            return;
        }

        if (transferType === 'same' && targetProformaId === sourceProformaId) {
            fireSwal({
                icon: 'warning',
                title: 'Plan Destino Inválido',
                text: 'El plan destino debe ser distinto al plan origen.'
            });
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/pagos/transferir-saldo', {
                sourcePacienteId,
                sourceProformaId: sourceProformaId || undefined,
                targetPacienteId: effectiveTargetPacienteId,
                targetProformaId: targetProformaId || undefined,
                amount: numAmount
            });

            await fireSwal({
                icon: 'success',
                title: 'Traspaso Exitoso',
                text: 'El saldo a favor se ha traspasado correctamente.',
                timer: 2000,
                showConfirmButton: false
            });

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error al traspasar saldo:', err);
            fireSwal({
                icon: 'error',
                title: 'Error al Traspasar Saldo',
                text: err.response?.data?.message || 'Ocurrió un error al procesar el traspaso.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    // Available target proformas for "same" patient: exclude source proforma
    const availableProformas = transferType === 'same'
        ? targetProformas.filter(p => p.id !== sourceProformaId)
        : targetProformas;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 dark:border-gray-700" style={{ overflow: 'visible' }}>
                {/* Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white flex items-center gap-2 rounded-t-2xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <h3 className="text-lg font-bold">Traspasar Saldo a Favor</h3>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5" style={{ overflow: 'visible' }}>
                    {/* Resumen Origen */}
                    <div className="p-3.5 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 text-sm">
                        <div className="font-bold text-green-900 dark:text-green-300">Paciente Origen: <span className="font-normal">{sourcePacienteNombre}</span></div>
                        <div className="text-xs text-green-700 dark:text-green-400 mt-1">
                            Saldo Disponible: <span className="font-bold text-sm">Bs. {maxAmount.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Destino toggle */}
                    <div>
                        <label className="block mb-2 font-bold text-sm text-gray-700 dark:text-gray-300">Destino del Traspaso:</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => handleTransferTypeChange('same')}
                                className={`p-3 rounded-xl border font-bold text-xs transition-all text-center flex flex-col items-center gap-1 cursor-pointer transform hover:-translate-y-0.5 active:scale-95 ${transferType === 'same'
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 shadow-sm'
                                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <span>Al mismo paciente</span>
                                <span className="font-normal text-[10px] text-gray-500 dark:text-gray-400">(Otro Plan o General)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleTransferTypeChange('other')}
                                className={`p-3 rounded-xl border font-bold text-xs transition-all text-center flex flex-col items-center gap-1 cursor-pointer transform hover:-translate-y-0.5 active:scale-95 ${transferType === 'other'
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 shadow-sm'
                                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <span>A otro paciente</span>
                                <span className="font-normal text-[10px] text-gray-500 dark:text-gray-400">(Familiar / Tercero)</span>
                            </button>
                        </div>
                    </div>

                    {/* Paciente Destino - SearchableSelect con búsqueda backend */}
                    {transferType === 'other' && (
                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Paciente Destino:</label>
                            <SearchableSelect
                                options={patientOptions}
                                value={targetPacienteId}
                                onChange={handleTargetPacienteChange}
                                placeholder="-- Busque y seleccione un Paciente --"
                                searchPlaceholder="Escriba Apellido, Nombre o CI..."
                                onSearchChange={handleSearchChange}
                                loading={loadingPacientes}
                                required
                                icon={
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                }
                            />
                        </div>
                    )}

                    {/* Target Proforma Select */}
                    <div>
                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Plan de Tratamiento Destino:</label>
                        <div className="relative">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <select
                                value={targetProformaId}
                                onChange={(e) => setTargetProformaId(Number(e.target.value))}
                                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-green-500 font-medium cursor-pointer"
                                required
                            >
                                <option value={0}>-- {loadingProformas ? 'Cargando planes...' : 'Seleccione Plan de Tratamiento Destino'} --</option>
                                {availableProformas.map(p => (
                                    <option key={p.id} value={p.id}>
                                        Plan #{p.numero || p.id} - Total: Bs. {Number(p.total || 0).toFixed(2)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Monto */}
                    <div>
                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Monto a Traspasar (Bs.):</label>
                        <div className="relative">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder={`Max: ${maxAmount.toFixed(2)}`}
                                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-green-500 font-bold"
                                required
                            />
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-3 justify-start">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-xl font-bold shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {submitting ? 'Procesando...' : 'Confirmar Traspaso'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 bg-gray-500 hover:bg-gray-600 active:scale-95 text-white rounded-xl font-bold shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TraspasoSaldoModal;
