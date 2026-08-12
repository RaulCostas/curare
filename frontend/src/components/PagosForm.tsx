import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import type { Paciente, Proforma, Pago, ComisionTarjeta } from '../types';
import ManualModal, { type ManualSection } from './ManualModal';
import FormaPagoForm from './FormaPagoForm';
import { getLocalDateString } from '../utils/dateUtils';
import { Calendar, DollarSign, CreditCard, Hash, FileText, MessageSquare, User } from 'lucide-react';

interface PagosFormProps {
    isOpen: boolean;
    onClose: () => void;
    id?: number | null;
    defaultPacienteId?: number;
    defaultProformaId?: number;
    hidePacienteProforma?: boolean;
    onSaveSuccess: () => void;
}

const PagosForm: React.FC<PagosFormProps> = ({ isOpen, onClose, id, defaultPacienteId, defaultProformaId, hidePacienteProforma, onSaveSuccess }) => {
    const [pacientes, setPacientes] = useState<Paciente[]>([]);
    const [proformas, setProformas] = useState<Proforma[]>([]);
    const [filteredProformas, setFilteredProformas] = useState<Proforma[]>([]);
    const [comisiones, setComisiones] = useState<ComisionTarjeta[]>([]);
    const [formasPago, setFormasPago] = useState<any[]>([]);

    const initialFormData = {
        pacienteId: 0,
        fecha: getLocalDateString(),
        proformaId: 0,
        monto: '',
        moneda: 'Bolivianos',
        tc: '6.96',
        recibo: '',
        factura: '',
        formaPagoId: undefined as number | undefined,
        comisionTarjetaId: undefined as number | undefined,
        observaciones: ''
    };

    const [formData, setFormData] = useState(initialFormData);
    const [isFormaPagoModalOpen, setIsFormaPagoModalOpen] = useState(false);
    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Registro de Pagos',
            content: 'Utilice este formulario para registrar abonos o pagos totales de pacientes. Puede vincular el pago a una proforma específica o registrarlo como un pago general.'
        },
        {
            title: 'Moneda y Tipo de Cambio',
            content: 'Si selecciona Dólares, especifique el tipo de cambio aplicado. El sistema convertirá internamente para los reportes cuando sea necesario.'
        },
        {
            title: 'Formas de Pago y Comisión por Tarjeta',
            content: 'Seleccione la forma de pago (Efectivo, Tarjeta, Transferencia, QR, etc.). Si selecciona Tarjeta, se desplegará la opción para elegir la red de tarjeta y aplicar la comisión correspondiente.'
        }
    ];

    useEffect(() => {
        if (isOpen) {
            fetchPacientes();
            fetchProformas();
            fetchComisiones();
            fetchFormasPago();
            if (id) {
                fetchPago(id);
            } else {
                setFormData({
                    ...initialFormData,
                    fecha: getLocalDateString(),
                    pacienteId: defaultPacienteId || 0,
                    proformaId: defaultProformaId || 0
                });
            }
        }
    }, [isOpen, id, defaultPacienteId, defaultProformaId]);

    useEffect(() => {
        if (formData.pacienteId) {
            const filtered = proformas.filter(p => p.pacienteId === Number(formData.pacienteId));
            setFilteredProformas(filtered);
        } else {
            setFilteredProformas([]);
        }
    }, [formData.pacienteId, proformas]);

    const fetchPacientes = async () => {
        try {
            const response = await api.get('/pacientes?limit=1000');
            const rawData = response.data?.data || response.data || [];
            const data = Array.isArray(rawData) ? rawData : [];
            const activePacientes = data.filter((p: any) => !p.estado || String(p.estado).toLowerCase() === 'activo');
            setPacientes(activePacientes);
        } catch (error) {
            console.error('Error fetching pacientes:', error);
        }
    };

    const fetchProformas = async () => {
        try {
            const response = await api.get('/proformas?limit=1000');
            const rawData = response.data?.data || response.data || [];
            const data = Array.isArray(rawData) ? rawData : [];
            setProformas(data);
        } catch (error) {
            console.error('Error fetching proformas:', error);
        }
    };

    const fetchComisiones = async () => {
        try {
            const response = await api.get('/comision-tarjeta?limit=1000');
            const rawData = response.data?.data || response.data || [];
            const data = Array.isArray(rawData) ? rawData : [];
            const activeComisiones = data.filter((c: any) => !c.estado || String(c.estado).toLowerCase() === 'activo');
            setComisiones(activeComisiones);
        } catch (error) {
            console.error('Error fetching comisiones:', error);
        }
    };

    const fetchFormasPago = async () => {
        try {
            const response = await api.get('/forma-pago?limit=1000');
            const rawData = response.data?.data || response.data || [];
            const data = Array.isArray(rawData) ? rawData : [];
            const activeFormas = data.filter((fp: any) => !fp.estado || String(fp.estado).toLowerCase() === 'activo');
            setFormasPago(activeFormas);
        } catch (error) {
            console.error('Error fetching formas de pago:', error);
        }
    };

    const fetchPago = async (pagoId: number) => {
        try {
            const response = await api.get(`/pagos/${pagoId}`);
            const data = response.data;
            setFormData({
                pacienteId: data.pacienteId || 0,
                fecha: data.fecha ? data.fecha.split('T')[0] : getLocalDateString(),
                proformaId: data.proformaId || 0,
                monto: data.monto ? data.monto.toString() : '',
                moneda: data.moneda || 'Bolivianos',
                tc: data.tc ? data.tc.toString() : '6.96',
                recibo: data.recibo || '',
                factura: data.factura || '',
                formaPagoId: data.formaPagoId || undefined,
                comisionTarjetaId: data.comisionTarjetaId || undefined,
                observaciones: data.observaciones || ''
            });
        } catch (error) {
            console.error('Error fetching pago:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'pacienteId' || name === 'proformaId' || name === 'comisionTarjetaId'
                ? Number(value)
                : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const pacienteIdToUse = formData.pacienteId || defaultPacienteId || 0;

        if (!pacienteIdToUse || pacienteIdToUse === 0) {
            Swal.fire('Atención', 'Debe seleccionar un paciente', 'warning');
            return;
        }

        if (!formData.monto || parseFloat(formData.monto) <= 0) {
            Swal.fire('Atención', 'Debe ingresar un monto válido', 'warning');
            return;
        }

        if (!formData.formaPagoId) {
            Swal.fire('Atención', 'Debe seleccionar una forma de pago', 'warning');
            return;
        }

        const selectedFormaPago = formasPago.find(fp => fp.id === formData.formaPagoId);
        const isTarjeta = selectedFormaPago && selectedFormaPago.forma_pago.toLowerCase() === 'tarjeta';

        if (isTarjeta && !formData.comisionTarjetaId) {
            Swal.fire('Atención', 'Debe seleccionar el tipo de tarjeta (comisión)', 'warning');
            return;
        }

        const hasRecibo = formData.recibo && formData.recibo.trim() !== '';
        const hasFactura = formData.factura && formData.factura.trim() !== '';

        if (!hasRecibo && !hasFactura) {
            Swal.fire('Atención', 'Debe registrar obligatoriamente al menos un número de Recibo o de Factura', 'warning');
            return;
        }

        const payload: any = {
            pacienteId: pacienteIdToUse,
            fecha: formData.fecha,
            monto: parseFloat(formData.monto.replace(',', '.')),
            moneda: formData.moneda,
            tc: parseFloat(formData.tc.replace(',', '.')) || 6.96,
            recibo: formData.recibo,
            factura: formData.factura,
            formaPagoId: formData.formaPagoId,
            observaciones: formData.observaciones
        };

        if (formData.proformaId && formData.proformaId !== 0) {
            payload.proformaId = formData.proformaId;
        }

        if (isTarjeta && formData.comisionTarjetaId) {
            payload.comisionTarjetaId = formData.comisionTarjetaId;
        }

        try {
            if (id) {
                await api.patch(`/pagos/${id}`, payload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Pago Actualizado',
                    text: 'El pago ha sido actualizado correctamente',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                await api.post('/pagos', payload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Pago Registrado',
                    text: 'El pago ha sido registrado correctamente',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
            onSaveSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving pago:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Error al guardar el pago';
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000] p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-[640px] max-w-[95%] max-h-[90vh] overflow-y-auto shadow-2xl text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-700 pb-3">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        {id ? 'Editar Pago' : 'Nuevo Pago de Paciente'}
                    </h2>
                    <button
                        type="button"
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!hidePacienteProforma && (
                        <>
                            <div>
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Paciente:</label>
                                <div className="relative flex-1 w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <select
                                        name="pacienteId"
                                        value={formData.pacienteId}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 cursor-pointer"
                                    >
                                        <option value={0}>-- Seleccione Paciente --</option>
                                        {pacientes.map(p => (
                                            <option key={p.id} value={p.id}>{p.paterno} {p.materno} {p.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Proforma (Opcional):</label>
                                <div className="relative flex-1 w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <select
                                        name="proformaId"
                                        value={formData.proformaId}
                                        onChange={handleChange}
                                        disabled={!formData.pacienteId}
                                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 cursor-pointer disabled:bg-gray-100 dark:disabled:bg-gray-800"
                                    >
                                        <option value={0}>-- Seleccione Proforma --</option>
                                        {filteredProformas.map(p => (
                                            <option key={p.id} value={p.id}>No. {p.numero} - Total: Bs {p.total}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Fecha:</label>
                            <div className="relative flex-1 w-full">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Calendar className="h-4 w-4" />
                                </div>
                                <input
                                    type="date"
                                    name="fecha"
                                    value={formData.fecha}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Monto:</label>
                            <div className="relative flex-1 w-full">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <DollarSign className="h-4 w-4" />
                                </div>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    name="monto"
                                    value={formData.monto}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ej: 150.00 o 150,00"
                                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Moneda:</label>
                            <div className="relative flex-1 w-full">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <DollarSign className="h-4 w-4" />
                                </div>
                                <select
                                    name="moneda"
                                    value={formData.moneda}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 cursor-pointer"
                                >
                                    <option value="Bolivianos">Bolivianos</option>
                                    <option value="Dólares">Dólares</option>
                                </select>
                            </div>
                        </div>

                        {formData.moneda === 'Dólares' && (
                            <div>
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Tipo de Cambio (TC):</label>
                                <div className="relative flex-1 w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <DollarSign className="h-4 w-4" />
                                    </div>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        name="tc"
                                        value={formData.tc}
                                        onChange={handleChange}
                                        required
                                        placeholder="Ej: 6.96 o 6,96"
                                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
                                No. Recibo <span className="text-red-500 font-bold text-xs">*</span>:
                            </label>
                            <div className="relative flex-1 w-full">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Hash className="h-4 w-4" />
                                </div>
                                <input
                                    type="text"
                                    name="recibo"
                                    value={formData.recibo}
                                    onChange={handleChange}
                                    placeholder="Ej: 12345"
                                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
                                No. Factura <span className="text-red-500 font-bold text-xs">*</span>:
                            </label>
                            <div className="relative flex-1 w-full">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <FileText className="h-4 w-4" />
                                </div>
                                <input
                                    type="text"
                                    name="factura"
                                    value={formData.factura}
                                    onChange={handleChange}
                                    placeholder="Ej: 98765"
                                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Forma de Pago:</label>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1 w-full">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <CreditCard className="h-4 w-4" />
                                </div>
                                <select
                                    name="formaPagoId"
                                    value={formData.formaPagoId || ''}
                                    onChange={(e) => {
                                        const selectedId = Number(e.target.value);
                                        setFormData(prev => ({ ...prev, formaPagoId: selectedId }));
                                    }}
                                    required
                                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 cursor-pointer"
                                >
                                    <option value="">-- Seleccione Forma de Pago --</option>
                                    {formasPago.map((fp: any) => (
                                        <option key={fp.id} value={fp.id}>{fp.forma_pago}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsFormaPagoModalOpen(true)}
                                className="py-2 px-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center text-lg shrink-0 border border-orange-500 hover:border-orange-600 cursor-pointer"
                                title="Agregar Nueva Forma de Pago"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {(() => {
                        const selectedFormaPago = formasPago.find(fp => fp.id === formData.formaPagoId);
                        const isTarjeta = selectedFormaPago && selectedFormaPago.forma_pago.toLowerCase() === 'tarjeta';

                        return isTarjeta && (
                            <div>
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Tipo de Tarjeta (Comisión):</label>
                                <div className="relative flex-1 w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <CreditCard className="h-4 w-4" />
                                    </div>
                                    <select
                                        name="comisionTarjetaId"
                                        value={formData.comisionTarjetaId || ''}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500 cursor-pointer"
                                    >
                                        <option value="">-- Seleccione Tarjeta --</option>
                                        {comisiones.filter(c => (c.estado || '').toLowerCase() === 'activo').map(comision => (
                                            <option key={comision.id} value={comision.id}>
                                                {comision.redBanco} - {comision.monto}%
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        );
                    })()}

                    <div>
                        <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Observaciones:</label>
                        <div className="relative flex-1 w-full">
                            <div className="absolute top-2.5 left-0 pl-3 flex items-start pointer-events-none text-gray-400">
                                <MessageSquare className="h-4 w-4" />
                            </div>
                            <textarea
                                name="observaciones"
                                value={formData.observaciones}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Ej: Pago parcial correspondiente a la primera sesión..."
                                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500"
                            />
                        </div>
                    </div>

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
                            <span>{id ? 'Actualizar' : 'Guardar'}</span>
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
                title="Manual - Pagos"
                sections={manualSections}
            />
        </div>
    );
};

export default PagosForm;
