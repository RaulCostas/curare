import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import type { TrabajoLaboratorio, FormaPago } from '../types';
import { getLocalDateString } from '../utils/dateUtils';
import ManualModal, { type ManualSection } from './ManualModal';
import SearchableSelect, { type Option } from './SearchableSelect';
import FormaPagoForm from './FormaPagoForm';

interface PagosLaboratoriosFormProps {
    isOpen: boolean;
    onClose: () => void;
    id?: number | null;
    initialWorkId?: number | null;
    onSaveSuccess: () => void;
}

const PagosLaboratoriosForm: React.FC<PagosLaboratoriosFormProps> = ({ isOpen, onClose, id, initialWorkId, onSaveSuccess }) => {
    const isEdit = Boolean(id);

    const [fecha, setFecha] = useState(() => getLocalDateString());
    const [moneda, setMoneda] = useState('Bolivianos');
    const [tc, setTc] = useState<number | string>(6.96);
    const [idFormaPago, setIdFormaPago] = useState<number | ''>('');

    const tcNum = parseFloat(String(tc).replace(',', '.')) || 6.96;

    const [selectedLabId, setSelectedLabId] = useState<number | ''>('');
    const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('');
    const [idTrabajosLaboratorios, setIdTrabajosLaboratorios] = useState<number | ''>('');

    const [allUnpaidWorks, setAllUnpaidWorks] = useState<TrabajoLaboratorio[]>([]);
    const [formasPago, setFormasPago] = useState<FormaPago[]>([]);
    const [showManual, setShowManual] = useState(false);
    const [isFormaPagoModalOpen, setIsFormaPagoModalOpen] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Pagos a Laboratorios',
            content: 'Registre pagos a laboratorios externos por trabajos realizados. Seleccione el laboratorio, paciente y trabajo específico para registrar el pago.'
        },
        {
            title: 'Moneda y Tipo de Cambio',
            content: 'Seleccione la moneda del pago (Bolivianos o Dólares). El tipo de cambio se usa para conversiones y reportes.'
        },
        {
            title: 'Forma de Pago',
            content: 'Seleccione el método de pago utilizado. El sistema actualiza automáticamente el estado del trabajo a "Pagado".'
        }
    ];

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
            if (!id) {
                setFecha(getLocalDateString());
                setMoneda('Bolivianos');
                setTc(6.96);
                setIdFormaPago('');
                setSelectedLabId('');
                setSelectedPatientId('');
                setIdTrabajosLaboratorios(initialWorkId || '');
            }
        }
    }, [isOpen, id, initialWorkId]);

    const fetchInitialData = async () => {
        try {
            const [trabajosRes, formasPagoRes] = await Promise.all([
                api.get('/trabajos-laboratorios?pagado=no&limit=1000'),
                api.get('/forma-pago?limit=1000')
            ]);

            const activeFormasPago = (formasPagoRes.data.data || []).filter((fp: any) => fp.estado === 'activo');
            setFormasPago(activeFormasPago);

            let allTrabajos: TrabajoLaboratorio[] = [];
            if (Array.isArray(trabajosRes.data)) {
                if (trabajosRes.data.length === 2 && Array.isArray(trabajosRes.data[0]) && typeof trabajosRes.data[1] === 'number') {
                    allTrabajos = trabajosRes.data[0];
                } else {
                    allTrabajos = trabajosRes.data;
                }
            } else if (trabajosRes.data?.data && Array.isArray(trabajosRes.data.data)) {
                allTrabajos = trabajosRes.data.data;
            }

            let currentPaymentWorkId: number | null = initialWorkId || null;

            if (isEdit && id) {
                try {
                    const pagoRes = await api.get(`/pagos-laboratorios/${id}`);
                    const pago = pagoRes.data;

                    if (pago) {
                        if (pago.fecha) {
                            const dateStr = typeof pago.fecha === 'string' ? pago.fecha.split('T')[0] : new Date(pago.fecha).toISOString().split('T')[0];
                            setFecha(dateStr);
                        }

                        let normalizedMoneda = 'Bolivianos';
                        if (pago.moneda === 'Bs') normalizedMoneda = 'Bolivianos';
                        else if (pago.moneda === '$us' || pago.moneda === 'Sus') normalizedMoneda = 'Dólares';
                        else normalizedMoneda = pago.moneda || 'Bolivianos';

                        setMoneda(normalizedMoneda);
                        setTc(Number(pago.tc) || 6.96);

                        if (pago.idforma_pago) setIdFormaPago(pago.idforma_pago);

                        if (pago.trabajoLaboratorio) {
                            currentPaymentWorkId = pago.trabajoLaboratorio.id;
                            setSelectedLabId(pago.trabajoLaboratorio.idLaboratorio || pago.trabajoLaboratorio.laboratorio?.id || '');
                            setSelectedPatientId(pago.trabajoLaboratorio.idPaciente || pago.trabajoLaboratorio.paciente?.id || '');
                            setIdTrabajosLaboratorios(pago.trabajoLaboratorio.id);
                        }
                    }
                } catch (err) {
                    console.error('Error loading single payment:', err);
                }
            }

            if (currentPaymentWorkId) {
                try {
                    const singleWorkRes = await api.get(`/trabajos-laboratorios/${currentPaymentWorkId}`);
                    if (singleWorkRes.data) {
                        const exists = allTrabajos.some(w => w.id === singleWorkRes.data.id);
                        if (!exists) {
                            allTrabajos.push(singleWorkRes.data);
                        }
                        const work = singleWorkRes.data;
                        setSelectedLabId(work.idLaboratorio || work.laboratorio?.id || '');
                        setSelectedPatientId(work.idPaciente || work.paciente?.id || '');
                        setIdTrabajosLaboratorios(work.id);
                    }
                } catch (err) {
                    console.error('Error loading current payment work:', err);
                }
            }

            setAllUnpaidWorks(allTrabajos);
        } catch (error) {
            console.error('Error fetching initial data:', error);
            Swal.fire('Error', 'Error al cargar los datos iniciales', 'error');
        }
    };

    const getWorkLabId = (w: any): number | null => {
        if (!w) return null;
        const val = w.idLaboratorio ?? w.idlaboratorio ?? w.laboratorio?.id;
        return val !== undefined && val !== null ? Number(val) : null;
    };

    const getWorkPatientId = (w: any): number | null => {
        if (!w) return null;
        const val = w.idPaciente ?? w.idpaciente ?? w.paciente?.id;
        return val !== undefined && val !== null ? Number(val) : null;
    };

    const availableWorks = useMemo(() => {
        return allUnpaidWorks.filter(work => {
            const workLabId = getWorkLabId(work);
            const workPatId = getWorkPatientId(work);
            if (selectedLabId && workLabId !== Number(selectedLabId)) return false;
            if (selectedPatientId && workPatId !== Number(selectedPatientId)) return false;
            return (work.estado === 'terminado' && work.pagado !== 'si') || (isEdit && work.id === idTrabajosLaboratorios) || (initialWorkId && work.id === initialWorkId);
        });
    }, [allUnpaidWorks, selectedLabId, selectedPatientId, isEdit, idTrabajosLaboratorios, initialWorkId]);

    const labOptions = useMemo(() => {
        const uniqueLabsMap = new Map<number, string>();
        allUnpaidWorks.forEach(w => {
            const labId = getWorkLabId(w);
            const labName = w.laboratorio?.laboratorio;
            if (labId && labName && !uniqueLabsMap.has(labId)) {
                uniqueLabsMap.set(labId, labName);
            }
        });
        const opts: { id: number; name: string }[] = [];
        uniqueLabsMap.forEach((name, id) => {
            opts.push({ id, name });
        });
        return opts;
    }, [allUnpaidWorks]);

    const patientOptions: Option[] = useMemo(() => {
        const filteredByLab = allUnpaidWorks.filter(w => {
            if (selectedLabId) {
                const workLabId = getWorkLabId(w);
                return workLabId === Number(selectedLabId);
            }
            return true;
        });

        const uniquePatientsMap = new Map<number, { fullName: string; ci?: string }>();
        filteredByLab.forEach(w => {
            const pat = w.paciente;
            const patId = getWorkPatientId(w);
            if (patId && !uniquePatientsMap.has(patId)) {
                const fullName = pat ? `${pat.paterno || ''} ${pat.materno || ''} ${pat.nombre || ''}`.trim() : `Paciente #${patId}`;
                uniquePatientsMap.set(patId, { fullName: fullName || `Paciente #${patId}`, ci: pat?.ci });
            }
        });

        const opts: Option[] = [
            { id: '', label: '-- Todos los Pacientes --' }
        ];

        uniquePatientsMap.forEach((info, patId) => {
            opts.push({
                id: patId,
                label: info.fullName,
                subLabel: info.ci ? `CI: ${info.ci}` : undefined
            });
        });

        return opts;
    }, [allUnpaidWorks, selectedLabId]);

    const handleLabChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value ? Number(e.target.value) : '';
        setSelectedLabId(val);
        setSelectedPatientId('');
        setIdTrabajosLaboratorios('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!idTrabajosLaboratorios || !idFormaPago) {
            Swal.fire('Error', 'Por favor complete todos los campos requeridos', 'error');
            return;
        }

        const selectedWork = availableWorks.find(w => w.id === Number(idTrabajosLaboratorios));
        const amountInBs = selectedWork ? Number(selectedWork.total) : 0;
        const finalMonto = moneda === 'Dólares' && tcNum > 0 ? Number((amountInBs / tcNum).toFixed(2)) : amountInBs;

        const payload = {
            fecha,
            idTrabajos_Laboratorios: Number(idTrabajosLaboratorios),
            monto: finalMonto,
            moneda,
            tc: moneda === 'Dólares' ? tcNum : 0,
            idforma_pago: Number(idFormaPago)
        };

        try {
            if (isEdit) {
                await api.patch(`/pagos-laboratorios/${id}`, payload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Pago Actualizado',
                    text: 'El pago se ha actualizado correctamente',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                await api.post('/pagos-laboratorios', payload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Pago Registrado',
                    text: 'El pago se ha guardado correctamente',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
            onSaveSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving pago:', error);
            const errorMessage = error.response?.data?.message || 'Error al guardar el pago';
            Swal.fire('Error', Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage, 'error');
        }
    };

    const selectedWork = availableWorks.find(w => w.id === idTrabajosLaboratorios);
    const amountInBs = selectedWork ? Number(selectedWork.total) : 0;
    const amountToPay = moneda === 'Dólares' && tcNum > 0 ? amountInBs / tcNum : amountInBs;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000] p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-[600px] max-w-[95%] max-h-[90vh] overflow-y-auto shadow-2xl text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-700 pb-3">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <span className="p-2.5 bg-green-100 dark:bg-green-900/60 rounded-xl text-green-600 dark:text-green-300 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </span>
                        {isEdit ? 'Editar Pago' : 'Nuevo Pago a Laboratorio'}
                    </h2>
                    <button
                        type="button"
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Fecha del Pago:</label>
                        <input
                            type="date"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            required
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 font-medium"
                        />
                    </div>

                    {/* Fila 1: Laboratorio */}
                    <div>
                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Laboratorio:</label>
                        <select
                            value={selectedLabId}
                            onChange={handleLabChange}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 font-medium cursor-pointer"
                        >
                            <option value="">-- Todos los laboratorios --</option>
                            {labOptions.map((lab) => (
                                <option key={lab.id} value={lab.id}>
                                    {lab.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Fila 2: Paciente (SearchableSelect) */}
                    <div>
                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Paciente:</label>
                        <SearchableSelect
                            options={patientOptions}
                            value={selectedPatientId}
                            onChange={(val) => {
                                setSelectedPatientId(val ? Number(val) : '');
                                setIdTrabajosLaboratorios('');
                            }}
                            placeholder="-- Todos los Pacientes --"
                            searchPlaceholder="Buscar paciente por nombre o CI..."
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                            }
                        />
                    </div>

                    {/* Fila 3: Trabajo de Laboratorio */}
                    <div>
                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Trabajo de Laboratorio Peticionado:</label>
                        <select
                            value={idTrabajosLaboratorios}
                            onChange={(e) => setIdTrabajosLaboratorios(Number(e.target.value) || '')}
                            required
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 font-medium cursor-pointer"
                        >
                            <option value="">-- Seleccione un Trabajo Pendiente --</option>
                            {availableWorks.map((work) => {
                                const descripcion = work.precioLaboratorio?.detalle || work.observacion || 'Trabajo de laboratorio';
                                const totalBs = Number(work.total).toFixed(2);
                                return (
                                    <option key={work.id} value={work.id}>
                                        {descripcion} - Bs. {totalBs}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Moneda:</label>
                            <select
                                value={moneda}
                                onChange={(e) => setMoneda(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 font-medium cursor-pointer"
                            >
                                <option value="Bolivianos">Bolivianos</option>
                                <option value="Dólares">Dólares</option>
                            </select>
                        </div>

                        {moneda === 'Dólares' && (
                            <div>
                                <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Tipo de Cambio:</label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={tc}
                                    onChange={(e) => setTc(e.target.value)}
                                    placeholder="Ej: 6.96 o 6,96"
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 font-medium"
                                />
                            </div>
                        )}
                    </div>

                    {/* Forma de Pago con Botón de agregar "+" */}
                    <div>
                        <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Forma de Pago:</label>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-grow">
                                <select
                                    value={idFormaPago}
                                    onChange={(e) => setIdFormaPago(Number(e.target.value) || '')}
                                    required
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 font-medium cursor-pointer"
                                >
                                    <option value="">Seleccione Forma de Pago...</option>
                                    {formasPago.map((fp) => (
                                        <option key={fp.id} value={fp.id}>
                                            {fp.forma_pago}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsFormaPagoModalOpen(true)}
                                className="py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center text-lg shrink-0 border border-orange-500 hover:border-orange-600 cursor-pointer"
                                title="Agregar Nueva Forma de Pago"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {selectedWork && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-4 text-right">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mr-2">Monto Base:</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200">Bs. {amountInBs.toFixed(2)}</span>
                            <div className="mt-1 text-lg font-extrabold text-gray-900 dark:text-white">
                                Total a Pagar: <span className="text-green-600 dark:text-green-400">
                                    {moneda === 'Dólares' ? '$us ' : 'Bs. '} {amountToPay.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-start items-center gap-3 mt-6">
                        <button
                            type="submit"
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm flex items-center gap-2 cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                <polyline points="7 3 7 8 15 8"></polyline>
                            </svg>
                            <span>{isEdit ? 'Actualizar' : 'Guardar'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2.5 px-5 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm flex items-center gap-2 cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                            <span>Cancelar</span>
                        </button>
                    </div>
                </form>
            </div>
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual - Pagos a Laboratorios"
                sections={manualSections}
            />

            {/* Modal para agregar Forma de Pago */}
            <FormaPagoForm
                isOpen={isFormaPagoModalOpen}
                onClose={() => setIsFormaPagoModalOpen(false)}
                onSaveSuccess={async () => {
                    try {
                        const formasPagoRes = await api.get('/forma-pago?limit=1000');
                        const activeFormasPago = (formasPagoRes.data.data || []).filter((fp: any) => fp.estado === 'activo');
                        setFormasPago(activeFormasPago);
                    } catch (err) {
                        console.error('Error refreshing formas de pago:', err);
                    }
                }}
            />
        </div>
    );
};

export default PagosLaboratoriosForm;
