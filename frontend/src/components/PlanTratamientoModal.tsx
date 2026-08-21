import React from 'react';
import type { Proforma, HistoriaClinica } from '../types';
import { formatDateUTC, formatCurrency } from '../utils/formatters';

interface PlanTratamientoModalProps {
    isOpen: boolean;
    onClose: () => void;
    proforma: Proforma | null;
    historia?: HistoriaClinica[];
}

const PlanTratamientoModal: React.FC<PlanTratamientoModalProps> = ({ isOpen, onClose, proforma, historia = [] }) => {
    if (!isOpen || !proforma) return null;

    const totalGeneral = proforma.detalles && proforma.detalles.length > 0
        ? proforma.detalles.reduce((acc, item) => {
            const itemTot = item.total !== undefined && item.total !== null
                ? Number(item.total)
                : (Number(item.cantidad || 1) * Number(item.precioUnitario || 0));
            return acc + (item.posible ? 0 : (isNaN(itemTot) ? 0 : itemTot));
        }, 0)
        : Number(proforma.total) || 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full transform transition-all border border-gray-200 dark:border-gray-700 max-h-[90vh] flex flex-col">
                {/* Header Modal */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 rounded-t-2xl">
                    <div>
                        <h3 className="text-xl font-extrabold text-gray-800 dark:text-white flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                            Detalle de Plan de Tratamiento #{proforma.numero || proforma.id}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                            Vista de lectura completa del presupuesto registrado.
                        </p>
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-6 overflow-y-auto flex-grow space-y-6">
                    {/* Metadata Header Box */}
                    <div className="bg-blue-50/80 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div>
                            <span className="text-gray-500 dark:text-gray-400 font-medium block">Fecha del Plan:</span>
                            <span className="font-bold text-gray-800 dark:text-white text-sm">{formatDateUTC(proforma.fecha)}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400 font-medium block">Registrado Por:</span>
                            <span className="font-bold text-gray-800 dark:text-white text-sm">{proforma.usuario?.name || 'Sistema'}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400 font-medium block">Estado Aprobado:</span>
                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${proforma.aprobado ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}`}>
                                {proforma.aprobado ? 'Aprobado' : 'Pendiente'}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400 font-medium block">Total General:</span>
                            <span className="font-black text-blue-600 dark:text-blue-400 text-sm">Bs. {formatCurrency(totalGeneral)}</span>
                        </div>
                    </div>

                    {proforma.nota && (
                        <div className="text-xs bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                            <strong className="text-gray-700 dark:text-gray-300">Nota / Observaciones: </strong>
                            <span className="text-gray-600 dark:text-gray-400">{proforma.nota}</span>
                        </div>
                    )}

                    {/* Detalles Table */}
                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs">
                            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wider text-[11px]">
                                <tr>
                                    <th className="px-4 py-3 text-left">Tratamiento</th>
                                    <th className="px-4 py-3 text-left">Pieza(s)</th>
                                    <th className="px-4 py-3 text-center">Cant.</th>
                                    <th className="px-4 py-3 text-right">P.U. (Bs.)</th>
                                    <th className="px-4 py-3 text-center">DESC.</th>
                                    <th className="px-4 py-3 text-right">Total (Bs.)</th>
                                    <th className="px-4 py-3 text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {(proforma.detalles || []).map((detalle) => {
                                    let isCompleted = false;
                                    let completedPieces: string[] = [];
                                    let allPieces: string[] = [];

                                    const parsePieces = (str?: string | null): string[] => {
                                        if (!str) return [];
                                        return str.split(/[/,\-\s]+/).map(p => p.trim()).filter(Boolean);
                                    };

                                    const normalizeTreatment = (str?: string | null): string => {
                                        if (!str) return '';
                                        return str
                                            .toLowerCase()
                                            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                                            .replace(/\bperno\b/g, 'poste')
                                            .replace(/\bpernos\b/g, 'postes')
                                            .replace(/[^a-z0-9]/g, ' ')
                                            .replace(/\s+/g, ' ')
                                            .trim();
                                    };

                                    const arancelDetalleNorm = normalizeTreatment(detalle.arancel?.detalle);
                                    const detallePieces = parsePieces(detalle.piezas);

                                    const matchingHistoria = historia.filter(h => {
                                        if (h.estadoTratamiento !== 'terminado') return false;

                                        // 1. Direct ID match
                                        if (h.proformaDetalleId && Number(h.proformaDetalleId) === Number(detalle.id)) {
                                            return true;
                                        }

                                        // 2. Proforma ID match + Treatment Name match (normalized with synonyms)
                                        const isSameProforma = h.proformaId === proforma.id;
                                        const hNorm = normalizeTreatment(h.tratamiento);
                                        const isSameTreatment = arancelDetalleNorm && (hNorm === arancelDetalleNorm || (hNorm.includes(arancelDetalleNorm) || arancelDetalleNorm.includes(hNorm)));

                                        if (isSameProforma && isSameTreatment) {
                                            if (detallePieces.length > 0 && h.pieza) {
                                                const hPieces = parsePieces(h.pieza);
                                                return hPieces.some(p => detallePieces.includes(p));
                                            }
                                            return true;
                                        }

                                        // 3. Same proforma + piece overlap fallback if proformaDetalleId matches or treatment name overlaps
                                        if (isSameProforma && detallePieces.length > 0 && h.pieza) {
                                            const hPieces = parsePieces(h.pieza);
                                            const hasPieceOverlap = hPieces.some(p => detallePieces.includes(p));
                                            if (hasPieceOverlap && hNorm && arancelDetalleNorm) {
                                                const mainH = hNorm.split(' ')[0];
                                                const mainD = arancelDetalleNorm.split(' ')[0];
                                                if (mainH === mainD) return true;
                                            }
                                        }

                                        return false;
                                    });

                                    if (detalle.piezas) {
                                        allPieces = detallePieces;
                                        matchingHistoria.forEach(h => {
                                            if (h.pieza) {
                                                const hPieces = parsePieces(h.pieza);
                                                completedPieces.push(...hPieces);
                                            } else {
                                                completedPieces.push(...allPieces);
                                            }
                                        });
                                        const completedSet = new Set(completedPieces);
                                        isCompleted = allPieces.length > 0 && allPieces.every(p => completedSet.has(p));
                                    } else {
                                        isCompleted = matchingHistoria.length > 0;
                                    }

                                    const pu = Number(detalle.precioUnitario) || 0;
                                    const cant = Number(detalle.cantidad) || 1;
                                    const desc = Number(detalle.descuento) || 0;
                                    const tot = Number(detalle.total) || (pu * cant * (1 - desc / 100));

                                    return (
                                        <tr key={detalle.id} className={isCompleted ? 'bg-green-50/60 dark:bg-green-950/20' : ''}>
                                            <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                                                <div>{detalle.arancel?.detalle || 'Tratamiento'}</div>
                                                {detalle.posible && (
                                                    <div className="text-xs text-orange-500 dark:text-orange-400 mt-0.5 font-normal uppercase">
                                                        Posible tratamiento
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                {detalle.piezas ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {allPieces.map((pieza, idx) => {
                                                            const isPieceDone = completedPieces.includes(pieza);
                                                            return (
                                                                <span
                                                                    key={idx}
                                                                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isPieceDone
                                                                        ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800'
                                                                        : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                                                                        }`}
                                                                >
                                                                    {pieza} {isPieceDone && '✓'}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                ) : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300 font-semibold">
                                                {cant}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 font-medium">
                                                {formatCurrency(pu)}
                                            </td>
                                            <td className="px-4 py-3 text-center font-bold text-amber-600 dark:text-amber-400">
                                                {desc > 0 ? `${desc}%` : '0%'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                                                {formatCurrency(detalle.posible ? 0 : tot)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {isCompleted ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 border border-green-300 dark:border-green-800">
                                                        Terminado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                                        Pendiente
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Modal */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-b-2xl flex justify-end items-center">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold shadow transition-all transform hover:-translate-y-0.5 text-xs"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlanTratamientoModal;
