import React, { useState, useMemo, useEffect } from 'react';
import type { HistoriaClinica, Proforma } from '../types';
import SearchableSelect, { type Option } from './SearchableSelect';
import { ArrowRightLeft, X, AlertCircle } from 'lucide-react';
import { formatDateUTC } from '../utils/formatters';
import api from '../services/api';
import Swal from 'sweetalert2';

interface CambiarPresupuestoModalProps {
    isOpen: boolean;
    onClose: () => void;
    historia: HistoriaClinica | null;
    proformas: Proforma[];
    onSuccess: () => void;
}

const CambiarPresupuestoModal: React.FC<CambiarPresupuestoModalProps> = ({
    isOpen,
    onClose,
    historia,
    proformas,
    onSuccess
}) => {
    const [selectedProformaId, setSelectedProformaId] = useState<number | string>(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && historia) {
            setSelectedProformaId(historia.proformaId || 0);
        }
    }, [isOpen, historia]);

    const proformaOptions: Option[] = useMemo(() => {
        return [...proformas]
            .sort((a, b) => (Number(a.numero) || 0) - (Number(b.numero) || 0))
            .map(p => {
                const isCurrent = historia ? p.id === historia.proformaId : false;
                const subParts: string[] = [];
                subParts.push(`Fecha: ${formatDateUTC(p.fecha)}`);
                if (p.nota) subParts.push(`Nota: ${p.nota}`);
                if (isCurrent) subParts.push('★ Presupuesto Actual');

                return {
                    id: p.id,
                    label: `Plan #${p.numero || p.id} ${isCurrent ? '(Actual)' : ''}`,
                    subLabel: subParts.join(' | '),
                    searchString: `${p.numero || p.id} ${formatDateUTC(p.fecha)} ${p.nota || ''}`
                };
            });
    }, [proformas, historia]);

    if (!isOpen || !historia) return null;

    const currentProforma = proformas.find(p => p.id === historia.proformaId);
    const isSameAsCurrent = Number(selectedProformaId) === Number(historia.proformaId);
    const isValidSelection = Number(selectedProformaId) > 0 && !isSameAsCurrent;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValidSelection || loading) return;

        setLoading(true);
        try {
            const newProformaId = Number(selectedProformaId);
            const targetProforma = proformas.find(p => p.id === newProformaId);

            // Match detalle in target budget if exists
            let newProformaDetalleId: number | null = null;
            if (targetProforma?.detalles) {
                const match = targetProforma.detalles.find((d: any) =>
                    (historia.arancelId && d.arancelId === historia.arancelId) ||
                    (historia.tratamiento && d.arancel?.detalle && d.arancel.detalle.toLowerCase() === historia.tratamiento.toLowerCase())
                );
                if (match) {
                    newProformaDetalleId = match.id;
                }
            }

            await api.patch(`/historia-clinica/${historia.id}`, {
                proformaId: newProformaId,
                proformaDetalleId: newProformaDetalleId
            });

            await Swal.fire({
                icon: 'success',
                title: '¡Presupuesto Movido!',
                text: `El tratamiento fue movido al Plan #${targetProforma?.numero || newProformaId} exitosamente.`,
                timer: 1600,
                showConfirmButton: false,
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error al mover presupuesto:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo mover el tratamiento al presupuesto seleccionado.',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200 dark:border-gray-700 min-h-[560px] flex flex-col justify-between transform transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 rounded-xl">
                            <ArrowRightLeft size={22} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-800 dark:text-white">
                                Mover a otro Presupuesto
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Reasignar tratamiento entre presupuestos del paciente
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        title="Cerrar"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                        {/* Info Card */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-200 dark:border-gray-600/70 space-y-2 text-xs">
                            <div className="flex justify-between items-start gap-2">
                                <span className="text-gray-500 dark:text-gray-400 font-medium">Tratamiento:</span>
                                <span className="text-gray-900 dark:text-gray-100 font-bold text-right text-sm">
                                    {historia.tratamiento || '-'}
                                </span>
                            </div>
                            {historia.pieza && (
                                <div className="flex justify-between items-center gap-2">
                                    <span className="text-gray-500 dark:text-gray-400 font-medium">Elemento Dental:</span>
                                    <span className="font-semibold text-gray-800 dark:text-gray-200 font-mono">
                                        {historia.pieza}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-600/50">
                                <span className="text-gray-500 dark:text-gray-400 font-medium">Presupuesto Actual:</span>
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                                    {currentProforma ? `Plan #${currentProforma.numero || currentProforma.id}` : (historia.proformaId ? `Plan #${historia.proformaId}` : 'Sin Presupuesto')}
                                </span>
                            </div>
                        </div>

                        {/* Selector */}
                        <div className="relative">
                            <label className="block mb-1.5 text-xs font-bold text-gray-700 dark:text-gray-300">
                                Seleccionar Presupuesto de Destino:
                            </label>
                            <SearchableSelect
                                options={proformaOptions}
                                value={selectedProformaId}
                                onChange={(val) => setSelectedProformaId(Number(val))}
                                placeholder="-- Seleccione un presupuesto --"
                                searchPlaceholder="Buscar por # de plan o fecha..."
                                className="text-sm"
                            />
                        </div>

                        {/* Notice if same */}
                        {isSameAsCurrent && (
                            <div className="flex items-center gap-2 p-2.5 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/60 rounded-xl text-amber-800 dark:text-amber-200 text-xs">
                                <AlertCircle size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
                                <span>El tratamiento ya está en este presupuesto. Elige uno diferente.</span>
                            </div>
                        )}
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={!isValidSelection || loading}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            <ArrowRightLeft size={14} />
                            <span>{loading ? 'Moviendo...' : 'Mover Presupuesto'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CambiarPresupuestoModal;
