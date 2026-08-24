import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';
import { formatDate, getLocalDateString } from '../utils/dateUtils';
import { formatCurrency } from '../utils/formatters';
import ManualModal, { type ManualSection } from './ManualModal';
import FormaPagoForm from './FormaPagoForm';
import { Save, X, Plus } from 'lucide-react';

interface Doctor {
    id: number;
    paterno: string;
    materno: string;
    nombre: string;
}

interface FormaPago {
    id: number;
    forma_pago: string;
}

interface HistoriaClinica {
    id: number;
    fecha: string;
    paciente: {
        paterno: string;
        materno: string;
        nombre: string;
    };
    tratamiento: string;
    precio: number;
    pagado: string;
    pieza?: string;
    cantidad?: number;
    proformaId?: number;
    proformaDetalle?: {
        descuento: number;
    };
    ultimoPagoPaciente?: {
        fecha: string;
        forma_pago: string;
        monto: number;
        moneda: string;
    } | null;
}

interface RowDetail {
    costoLaboratorio: number | string;
    descuento: number | string;
}

const getDetailNum = (val: number | string | undefined): number => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const normalized = String(val).replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
};

interface PagosDoctoresFormProps {
    isOpen: boolean;
    onClose: () => void;
    id?: number | null;
    onSaveSuccess: () => void;
}

const PagosDoctoresForm: React.FC<PagosDoctoresFormProps> = ({ isOpen, onClose, id, onSaveSuccess }) => {
    const isEditMode = Boolean(id);

    const [doctores, setDoctores] = useState<Doctor[]>([]);
    const [formasPago, setFormasPago] = useState<FormaPago[]>([]);
    const [pendientes, setPendientes] = useState<HistoriaClinica[]>([]);
    const [showManual, setShowManual] = useState(false);
    const [isFormaPagoModalOpen, setIsFormaPagoModalOpen] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Pagos a Doctores',
            content: 'Registro y gestión de pagos a doctores por los tratamientos realizados.'
        },
        {
            title: 'Selección de Doctor y Tratamientos',
            content: 'Seleccione un doctor para ver su lista de tratamientos pendientes. Marque los tratamientos que desea incluir en este pago.'
        },
        {
            title: 'Ajustes y Descuentos',
            content: 'Puede ingresar el Costo de Laboratorio y el porcentaje de Descuento para cada tratamiento seleccionado. El subtotal se actualizará automáticamente.'
        },
        {
            title: 'Datos del Pago',
            content: 'En la parte inferior, configure la fecha, forma de pago, moneda y comisión (si aplica). Verifique el "Total a Pagar" antes de guardar.'
        }
    ];

    const [idDoctor, setIdDoctor] = useState<string>('');
    const [fecha, setFecha] = useState(getLocalDateString());
    const [moneda, setMoneda] = useState('Bolivianos');
    const [tc, setTc] = useState<number>(6.96);
    const [idForma_pago, setIdFormaPago] = useState<string>('');
    const [banco, setBanco] = useState<string>('');
    const [comisionInput, setComisionInput] = useState<string>('0');

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [rowDetails, setRowDetails] = useState<Record<number, RowDetail>>({});
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchDoctores();
            fetchFormasPago();
            if (isEditMode && id) {
                fetchPagoData(id);
            } else {
                setIdDoctor('');
                setFecha(getLocalDateString());
                setMoneda('Bolivianos');
                setTc(6.96);
                setIdFormaPago('');
                setBanco('');
                setComisionInput('0');
                setSelectedIds([]);
                setRowDetails({});
                setPendientes([]);
            }
        }
    }, [isOpen, id, isEditMode]);

    useEffect(() => {
        if (idDoctor && !isEditMode && isOpen) {
            fetchPendientes(Number(idDoctor));
        }
    }, [idDoctor, isEditMode, isOpen]);

    const fetchPagoData = async (paymentId: number) => {
        try {
            const response = await api.get(`/pagos-doctores/${paymentId}`);
            const pago = response.data;
            if (pago.doctor?.id) {
                setIdDoctor(String(pago.doctor.id));
            }
            setFecha(pago.fecha ? pago.fecha.split('T')[0] : new Date().toISOString().split('T')[0]);

            let normalizedMoneda = 'Bolivianos';
            if (pago.moneda === 'Bs') normalizedMoneda = 'Bolivianos';
            else if (pago.moneda === '$us' || pago.moneda === 'Sus') normalizedMoneda = 'Dólares';
            else normalizedMoneda = pago.moneda || 'Bolivianos';

            setMoneda(normalizedMoneda);
            setTc(Number(pago.tc) || 6.96);
            setIdFormaPago(String(pago.formaPago?.id || ''));
            setBanco(pago.banco || '');
            setComisionInput(String(pago.comision ?? 0));

            let loadedItems: HistoriaClinica[] = [];
            const detailsMap: Record<number, RowDetail> = {};

            if (pago.detalles && Array.isArray(pago.detalles)) {
                pago.detalles.forEach((d: any) => {
                    if (d.historiaClinica) {
                        loadedItems.push(d.historiaClinica);
                        detailsMap[d.historiaClinica.id] = {
                            costoLaboratorio: Number(d.costo_laboratorio) || 0,
                            descuento: Number(d.descuento) || 0
                        };
                    }
                });
            }

            let pendingItems: HistoriaClinica[] = [];
            if (pago.doctor?.id) {
                try {
                    const pendingRes = await api.get(`/historia-clinica/pendientes/${pago.doctor.id}`);
                    pendingItems = Array.isArray(pendingRes.data) ? pendingRes.data : [];
                } catch (err) {
                    console.error('Error fetching additional pending items:', err);
                }
            }

            const loadedIds = new Set(loadedItems.map(i => i.id));
            const filteredPending = pendingItems.filter(p => !loadedIds.has(p.id));

            filteredPending.forEach(p => {
                detailsMap[p.id] = {
                    costoLaboratorio: 0,
                    descuento: p.proformaDetalle?.descuento || 0
                };
            });

            setPendientes([...loadedItems, ...filteredPending]);
            setSelectedIds(Array.from(loadedIds));
            setRowDetails(detailsMap);

        } catch (error) {
            console.error('Error fetching payment:', error);
        }
    };

    const fetchDoctores = async () => {
        try {
            const response = await api.get('/doctors?limit=1000');
            const data = response.data.data || response.data || [];
            const sortedDocs = (Array.isArray(data) ? data : [])
                .filter((d: any) => d.estado === undefined || String(d.estado).toLowerCase() === 'activo')
                .sort((a: any, b: any) => {
                    const nameA = `${a.paterno || ''} ${a.materno || ''} ${a.nombre || ''}`.trim().toLowerCase();
                    const nameB = `${b.paterno || ''} ${b.materno || ''} ${b.nombre || ''}`.trim().toLowerCase();
                    return nameA.localeCompare(nameB);
                });
            setDoctores(sortedDocs);
        } catch (error) {
            console.error('Error fetching doctores:', error);
        }
    };

    const fetchFormasPago = async () => {
        try {
            const response = await api.get('/forma-pago?limit=1000');
            const raw = response.data?.data || response.data || [];
            const dataList = Array.isArray(raw) ? raw : [];
            const activeFormas = dataList.filter((f: any) => f.estado === undefined || String(f.estado).toLowerCase() === 'activo');
            setFormasPago(activeFormas);
        } catch (error) {
            console.error('Error fetching formas pago:', error);
        }
    };

    const fetchPendientes = async (doctorId: number) => {
        try {
            const response = await api.get(`/historia-clinica/pendientes/${doctorId}`);
            setPendientes(response.data);
            setSelectedIds([]);
            setRowDetails({});
        } catch (error) {
            console.error('Error fetching pendientes:', error);
        }
    };

    const selectedFormaPago = formasPago.find(f => String(f.id) === String(idForma_pago));
    const isTransferencia = Boolean(selectedFormaPago && (
        selectedFormaPago.forma_pago.toLowerCase().includes('transferencia') ||
        selectedFormaPago.forma_pago.toLowerCase().includes('deposito') ||
        selectedFormaPago.forma_pago.toLowerCase().includes('banco')
    ));

    const calculateRowTotal = (item: HistoriaClinica) => {
        const details = rowDetails[item.id] || { costoLaboratorio: 0, descuento: 0 };
        const base = Number(item.precio) || 0;

        const descNum = getDetailNum(details.descuento);
        const labNum = getDetailNum(details.costoLaboratorio);

        const discountAmount = (base * descNum) / 100;
        const afterDiscount = base - discountAmount;

        return Math.max(0, afterDiscount - labNum);
    };

    const comisionNum = getDetailNum(comisionInput);

    const subTotal = pendientes
        .filter(p => selectedIds.includes(p.id))
        .reduce((sum, p) => sum + calculateRowTotal(p), 0);

    const amountAfterCommission = comisionNum > 0
        ? (subTotal * comisionNum) / 100
        : subTotal;

    const totalToPay = moneda === 'Dólares' && tc > 0
        ? amountAfterCommission / tc
        : amountAfterCommission;

    const filteredPendientes = pendientes.filter(item => {
        const term = searchTerm.toLowerCase();
        const pacienteName = `${item.paciente?.paterno} ${item.paciente?.materno} ${item.paciente?.nombre}`.toLowerCase();
        const tratamiento = item.tratamiento?.toLowerCase() || '';
        return pacienteName.includes(term) || tratamiento.includes(term);
    });

    const handleCheckboxChange = (id: number) => {
        setSelectedIds(prev => {
            const isSelected = prev.includes(id);
            if (!isSelected) {
                if (!rowDetails[id]) {
                    const item = pendientes.find(p => p.id === id);
                    const defaultDiscount = item?.proformaDetalle?.descuento || 0;

                    setRowDetails(curr => ({
                        ...curr,
                        [id]: { costoLaboratorio: 0, descuento: defaultDiscount }
                    }));
                }
                return [...prev, id];
            } else {
                return prev.filter(pid => pid !== id);
            }
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const allIds = filteredPendientes.map(p => p.id);
            const uniqueIds = Array.from(new Set([...selectedIds, ...allIds]));

            setSelectedIds(uniqueIds);

            const newDetails = { ...rowDetails };
            filteredPendientes.forEach(p => {
                if (!newDetails[p.id]) {
                    const defaultDiscount = p.proformaDetalle?.descuento || 0;
                    newDetails[p.id] = { costoLaboratorio: 0, descuento: defaultDiscount };
                }
            });
            setRowDetails(newDetails);
        } else {
            const visibleIds = filteredPendientes.map(p => p.id);
            setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
        }
    };

    const handleDetailChange = (id: number, field: keyof RowDetail, value: string | number) => {
        setRowDetails(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!idDoctor || !idForma_pago || selectedIds.length === 0) {
            Swal.fire('Atención', 'Seleccione un doctor, forma de pago y al menos un tratamiento', 'warning');
            return;
        }

        const detalles = pendientes
            .filter(p => selectedIds.includes(p.id))
            .map(p => {
                const rd = rowDetails[p.id] || { costoLaboratorio: 0, descuento: 0 };
                const rowTotal = calculateRowTotal(p);
                return {
                    idhistoria_clinica: p.id,
                    total: rowTotal,
                    costo_laboratorio: getDetailNum(rd.costoLaboratorio),
                    fecha_pago_paciente: p.ultimoPagoPaciente?.fecha || null,
                    forma_pago_paciente: p.ultimoPagoPaciente?.forma_pago || null,
                    descuento: getDetailNum(rd.descuento)
                };
            });

        const payload = {
            idDoctor: Number(idDoctor),
            fecha,
            comision: comisionNum,
            total: totalToPay,
            moneda,
            tc: moneda === 'Dólares' ? tc : 0,
            idForma_pago: Number(idForma_pago),
            banco: isTransferencia ? banco : '',
            detalles
        };

        try {
            if (isEditMode && id) {
                await api.patch(`/pagos-doctores/${id}`, payload);
                await Swal.fire({ icon: 'success', title: 'Pago Actualizado', text: 'El pago se ha actualizado correctamente', timer: 1500, showConfirmButton: false });
            } else {
                await api.post('/pagos-doctores', payload);
                await Swal.fire({ icon: 'success', title: 'Pago Registrado', text: 'El pago se ha guardado correctamente', timer: 1500, showConfirmButton: false });
            }
            onSaveSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving pago:', error);
            const errorMessage = error.response?.data?.message || 'No se pudo guardar el pago';
            Swal.fire('Error', Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage, 'error');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="fixed inset-0 bg-black/50 transition-opacity duration-300 opacity-100" onClick={onClose} />
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-4xl bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-0 flex flex-col">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <span className="p-2.5 bg-blue-100 dark:bg-blue-900/60 rounded-xl text-blue-600 dark:text-blue-300 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </span>
                        {isEditMode ? 'Editar Pago a Doctor' : 'Nuevo Pago a Doctor'}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowManual(true)}
                            className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            title="Ayuda / Manual"
                        >
                            ?
                        </button>
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
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col justify-between space-y-4">
                    <div className="space-y-4">
                        <div>
                            <label className="block mb-1 font-bold text-sm text-gray-700 dark:text-gray-300">Doctor:</label>
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <select
                                    value={idDoctor}
                                    onChange={(e) => setIdDoctor(e.target.value)}
                                    required
                                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 font-medium cursor-pointer"
                                >
                                    <option value="">-- Seleccione Doctor --</option>
                                    {doctores.map(d => (
                                        <option key={d.id} value={d.id}>
                                            {`${d.paterno} ${d.materno} ${d.nombre}`.trim()}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Search bar above table */}
                        <div className="flex items-center gap-2 max-w-md">
                            <div className="relative flex-grow">
                                <input
                                    type="text"
                                    placeholder="Buscar por paciente o tratamiento..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm shadow-sm"
                                />
                                <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                </svg>
                            </div>
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm('')}
                                    className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-xl shadow-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                                    title="Limpiar búsqueda"
                                >
                                    <X size={14} />
                                    <span>Limpiar</span>
                                </button>
                            )}
                        </div>

                        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 gap-4">
                                <h3 className="font-bold text-sm text-gray-700 dark:text-gray-200">Tratamientos Pendientes</h3>
                            </div>

                            <div className="overflow-x-auto max-h-60">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead className="sticky top-0 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase">
                                        <tr>
                                            <th className="p-2 w-8 text-center">
                                                <input
                                                    type="checkbox"
                                                    onChange={handleSelectAll}
                                                    checked={filteredPendientes.length > 0 && filteredPendientes.every(p => selectedIds.includes(p.id))}
                                                />
                                            </th>
                                            <th className="p-2">Fecha</th>
                                            <th className="p-2">Paciente</th>
                                            <th className="p-2">Tratamiento</th>
                                            <th className="p-2 text-right">Precio</th>
                                            <th className="p-2 w-28">Costo Lab.</th>
                                            <th className="p-2 w-20">Desc (%)</th>
                                            <th className="p-2 text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {filteredPendientes.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="p-6 text-center text-gray-400 dark:text-gray-500">
                                                    {idDoctor ? 'No hay tratamientos pendientes' : 'Seleccione un doctor para ver sus pendientes'}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredPendientes.map(p => {
                                                const isSelected = selectedIds.includes(p.id);
                                                const details = rowDetails[p.id] || { costoLaboratorio: 0, descuento: 0 };
                                                const rowTotal = calculateRowTotal(p);

                                                return (
                                                    <tr key={p.id} className={isSelected ? 'bg-blue-50/60 dark:bg-blue-900/20' : ''}>
                                                        <td className="p-2 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => handleCheckboxChange(p.id)}
                                                            />
                                                        </td>
                                                        <td className="p-2">{formatDate(p.fecha)}</td>
                                                        <td className="p-2 font-medium">{`${p.paciente?.paterno || ''} ${p.paciente?.materno || ''} ${p.paciente?.nombre || ''}`.trim()}</td>
                                                        <td className="p-2">{p.tratamiento}</td>
                                                        <td className="p-2 text-right font-bold">Bs {Number(p.precio).toFixed(2)}</td>
                                                        <td className="p-1">
                                                            {isSelected && (
                                                                <input
                                                                    type="text"
                                                                    inputMode="decimal"
                                                                    value={details.costoLaboratorio ?? ''}
                                                                    onChange={(e) => handleDetailChange(p.id, 'costoLaboratorio', e.target.value)}
                                                                    className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xl text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm"
                                                                />
                                                            )}
                                                        </td>
                                                        <td className="p-1">
                                                            {isSelected && (
                                                                <input
                                                                    type="text"
                                                                    inputMode="decimal"
                                                                    value={details.descuento ?? ''}
                                                                    onChange={(e) => handleDetailChange(p.id, 'descuento', e.target.value)}
                                                                    className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xl text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm"
                                                                />
                                                            )}
                                                        </td>
                                                        <td className="p-2 text-right font-bold text-green-600 dark:text-green-400">
                                                            {isSelected ? `Bs ${formatCurrency(rowTotal)}` : '-'}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                    <tfoot className="sticky bottom-0 bg-gray-100 dark:bg-gray-700 font-bold border-t-2 border-gray-300 dark:border-gray-600 shadow-sm">
                                        <tr>
                                            <td colSpan={7} className="p-2.5 text-right text-gray-700 dark:text-gray-200 font-bold uppercase text-xs">
                                                Subtotal ({selectedIds.length} {selectedIds.length === 1 ? 'tratamiento' : 'tratamientos'}):
                                            </td>
                                            <td className="p-2.5 text-right font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                                                Bs {formatCurrency(subTotal)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* Payment controls */}
                        <div className={`grid grid-cols-1 ${isTransferencia ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-4 items-end bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 transition-all`}>
                            <div>
                                <label className="block mb-1 font-bold text-xs text-gray-600 dark:text-gray-400">Fecha Pago:</label>
                                <div className="relative">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <input
                                        type="date"
                                        value={fecha}
                                        onChange={(e) => setFecha(e.target.value)}
                                        required
                                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block mb-1 font-bold text-xs text-gray-600 dark:text-gray-400">Forma de Pago:</label>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-grow">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        <select
                                            value={idForma_pago}
                                            onChange={(e) => setIdFormaPago(e.target.value)}
                                            required
                                            className="w-full pl-8 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                        >
                                            <option value="">Seleccionar</option>
                                            {formasPago.map(f => (
                                                <option key={f.id} value={f.id}>{f.forma_pago}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsFormaPagoModalOpen(true)}
                                        className="py-2 px-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center text-sm shrink-0 border border-orange-500 cursor-pointer"
                                        title="Agregar Nueva Forma de Pago"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {isTransferencia && (
                                <div>
                                    <label className="block mb-1 font-bold text-xs text-gray-600 dark:text-gray-400">Banco <span className="text-red-500">*</span>:</label>
                                    <div className="relative">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m12 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h5m-5 0V9m0 0l-3 3m3-3l3 3" />
                                        </svg>
                                        <input
                                            type="text"
                                            value={banco}
                                            onChange={(e) => setBanco(e.target.value)}
                                            placeholder="Ej: BNB, Mercantil, BCP..."
                                            required={isTransferencia}
                                            className="w-full pl-8 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block mb-1 font-bold text-xs text-gray-600 dark:text-gray-400">Moneda:</label>
                                <div className="relative">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <select
                                        value={moneda}
                                        onChange={(e) => setMoneda(e.target.value)}
                                        className="w-full pl-8 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                    >
                                        <option value="Bolivianos">Bolivianos</option>
                                        <option value="Dólares">Dólares</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block mb-1 font-bold text-xs text-gray-600 dark:text-gray-400">Comisión (%):</label>
                                <div className="relative">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={comisionInput}
                                        onChange={(e) => setComisionInput(e.target.value)}
                                        placeholder="Ej: 2.5 o 2,5"
                                        className="w-full pl-8 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-100 dark:bg-gray-700/80 p-4 rounded-xl flex justify-between items-center border border-gray-200 dark:border-gray-600">
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                                    Subtotal Tratamientos: Bs {formatCurrency(subTotal)} {comisionNum > 0 ? `| Comisión Doctor: ${comisionNum}%` : ''}
                                </span>
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">TOTAL A PAGAR:</span>
                            </div>
                            <span className="text-xl font-extrabold text-green-600 dark:text-green-400">
                                {moneda === 'Dólares' ? '$us ' : 'Bs '} {formatCurrency(totalToPay)}
                            </span>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-start items-center gap-3 mt-6">
                        <button
                            type="submit"
                            disabled={selectedIds.length === 0}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                            <Save className="w-4 h-4" />
                            <span>{isEditMode ? 'Actualizar Pago' : 'Guardar Pago'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2.5 px-5 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm flex items-center gap-2 cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                            <span>Cancelar</span>
                        </button>
                    </div>
                </form>
            </div>
            <FormaPagoForm
                isOpen={isFormaPagoModalOpen}
                onClose={() => setIsFormaPagoModalOpen(false)}
                onSaveSuccess={() => {
                    fetchFormasPago();
                    setIsFormaPagoModalOpen(false);
                }}
            />
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Pagos a Doctores"
                sections={manualSections}
            />
        </div>
    );
};

export default PagosDoctoresForm;
