import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import type { Paciente, Arancel } from '../types';
import ManualModal, { type ManualSection } from './ManualModal';
import SearchableSelect from './SearchableSelect';
import { formatCurrency } from '../utils/formatters';

interface DetalleItem {
    id?: number;
    letra: string; // Added Letra for Detail
    arancelId: number;
    codigo: string;
    tratamiento: string;
    precioUnitario: number;
    tc: number;
    piezas: string;
    cantidad: number;
    subTotal: number;
    descuento: number;
    total: number;
    posible: boolean;
}

interface PropuestasFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    pacienteId: number;
    propuestaId?: number;
    readOnly?: boolean;
}

const PropuestasForm: React.FC<PropuestasFormProps> = ({
    isOpen,
    onClose,
    onSuccess,
    pacienteId,
    propuestaId,
    readOnly = false
}) => {
    const isReadOnly = readOnly;

    const [paciente, setPaciente] = useState<Paciente | null>(null);
    const [aranceles, setAranceles] = useState<Arancel[]>([]);
    const [detalles, setDetalles] = useState<DetalleItem[]>([]);
    const [nota, setNota] = useState('');
    const [letraHeader, setLetraHeader] = useState(''); // Optional header label
    const [fecha, setFecha] = useState(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });
    const [numero, setNumero] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState('A'); // Default tab

    // Form state for new item
    const [selectedArancelId, setSelectedArancelId] = useState<number>(0);
    const [precioType, setPrecioType] = useState<'precio1' | 'precio2'>('precio1');
    const [customPrecioUnitario, setCustomPrecioUnitario] = useState<number | ''>('');
    const [piezas, setPiezas] = useState('');
    const [cantidad, setCantidad] = useState(1);
    const [descuento, setDescuento] = useState(0);
    const [posible, setPosible] = useState(false);
    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Propuestas de Tratamiento',
            content: 'Las propuestas permiten crear múltiples opciones de tratamiento (A-F) para que el paciente elija. Cada opción puede tener diferentes tratamientos y precios.'
        },
        {
            title: 'Pestañas A-F',
            content: 'Use las pestañas para organizar hasta 6 propuestas diferentes. Agregue tratamientos a cada pestaña según las opciones que desea ofrecer al paciente.'
        },
        {
            title: 'Pasar a Presupuesto',
            content: 'Una vez que el paciente elija una propuesta, puede convertirla en presupuesto oficial usando el botón "Pasar a Presupuesto".'
        }
    ];

    // State for editing an item
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const tabs = ['A', 'B', 'C', 'D', 'E', 'F'];

    useEffect(() => {
        if (!isOpen) return;

        if (pacienteId) {
            fetchPaciente(pacienteId);
            fetchAranceles();
        }
        if (propuestaId) {
            fetchPropuesta(propuestaId);
        } else {
            setNota('');
            setLetraHeader('');
            setNumero(null);
            setDetalles([]);
            setActiveTab('A');
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            setFecha(`${year}-${month}-${day}`);
        }
    }, [isOpen, pacienteId, propuestaId]);

    const fetchPropuesta = async (propuestaId: number) => {
        try {
            const response = await api.get(`/propuestas/${propuestaId}`);
            const data = response.data;
            setNota(data.nota);
            setLetraHeader(data.letra || '');
            setFecha(data.fecha.split('T')[0]);
            setNumero(data.numero);

            if (data.detalles) {
                const mappedDetalles = data.detalles.map((d: any) => ({
                    id: d.id,
                    letra: d.letra || 'A', // Default to A if missing
                    arancelId: d.arancel.id,
                    codigo: d.arancel.id.toString(),
                    tratamiento: d.arancel.detalle,
                    precioUnitario: Number(d.precioUnitario),
                    tc: Number(d.tc),
                    piezas: d.piezas,
                    cantidad: Number(d.cantidad),
                    subTotal: Number(d.subTotal),
                    descuento: Number(d.descuento),
                    total: Number(d.total),
                    posible: d.posible
                }));
                setDetalles(mappedDetalles);
            }
        } catch (error) {
            console.error('Error fetching propuesta:', error);
            Swal.fire({
                title: 'Error',
                text: 'No se pudo cargar la propuesta',
                icon: 'error',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
        }
    };

    const fetchPaciente = async (pacienteId: number) => {
        try {
            const response = await api.get(`/pacientes/${pacienteId}`);
            setPaciente(response.data);
        } catch (error) {
            console.error('Error fetching paciente:', error);
        }
    };

    const fetchAranceles = async () => {
        try {
            const response = await api.get('/arancel?limit=1000');
            setAranceles(response.data.data);
        } catch (error) {
            console.error('Error fetching aranceles:', error);
        }
    };

    const handleSelectArancel = (arId: number) => {
        setSelectedArancelId(arId);
        const arancel = aranceles.find(a => a.id === arId);
        if (arancel) {
            setPrecioType('precio1');
            setCustomPrecioUnitario(Number(arancel.precio1 || 0));
        } else {
            setCustomPrecioUnitario('');
        }
    };

    const handlePrecioTypeChange = (type: 'precio1' | 'precio2') => {
        setPrecioType(type);
        const arancel = aranceles.find(a => a.id === Number(selectedArancelId));
        if (arancel) {
            const newPrice = type === 'precio1' ? Number(arancel.precio1 || 0) : Number(arancel.precio2 || 0);
            setCustomPrecioUnitario(newPrice);
        }
    };

    const handleAddItem = () => {
        if (!selectedArancelId) return;

        const arancel = aranceles.find(a => a.id === Number(selectedArancelId));
        if (!arancel) return;

        const parsedCustom = parseFloat(String(customPrecioUnitario).replace(',', '.'));
        const parsedDesc = parseFloat(String(descuento).replace(',', '.'));

        const precio = customPrecioUnitario !== '' && !isNaN(parsedCustom)
            ? parsedCustom
            : (precioType === 'precio1' ? Number(arancel.precio1) : Number(arancel.precio2));

        const descNum = isNaN(parsedDesc) ? 0 : parsedDesc;

        const subTotal = precio * cantidad;
        const descuentoAmount = (subTotal * descNum) / 100;
        const total = subTotal - descuentoAmount;

        const newItem: DetalleItem = {
            id: editingIndex !== null ? detalles[editingIndex].id : undefined,
            letra: activeTab, // Use current tab
            arancelId: arancel.id,
            codigo: arancel.id.toString(),
            tratamiento: arancel.detalle,
            precioUnitario: precio,
            tc: Number(arancel.tc),
            piezas,
            cantidad,
            subTotal,
            descuento: descNum,
            total,
            posible
        };

        if (editingIndex !== null) {
            const updatedDetalles = [...detalles];
            updatedDetalles[editingIndex] = newItem;
            setDetalles(updatedDetalles);
            setEditingIndex(null);
        } else {
            setDetalles([...detalles, newItem]);
        }

        // Reset form
        setSelectedArancelId(0);
        setCustomPrecioUnitario('');
        setPiezas('');
        setCantidad(1);
        setDescuento(0);
        setPosible(false);
    };

    const handleRemoveItem = (index: number) => {
        const newDetalles = [...detalles];
        newDetalles.splice(index, 1);
        setDetalles(newDetalles);

        if (editingIndex === index) {
            cancelEdit();
        } else if (editingIndex !== null && index < editingIndex) {
            setEditingIndex(editingIndex - 1);
        }
    };

    const handleEditItem = (index: number) => {
        const itemToEdit = detalles[index];
        if (!itemToEdit) return;

        setEditingIndex(index);
        setSelectedArancelId(itemToEdit.arancelId);

        // Find arancel to determine if price matches precio1 or precio2
        const arancel = aranceles.find(a => a.id === itemToEdit.arancelId);
        if (arancel) {
            if (Number(arancel.precio2) === itemToEdit.precioUnitario) {
                setPrecioType('precio2');
            } else {
                setPrecioType('precio1');
            }
        }
        setCustomPrecioUnitario(itemToEdit.precioUnitario);
        setPiezas(itemToEdit.piezas || '');
        setCantidad(itemToEdit.cantidad);
        setDescuento(itemToEdit.descuento);
        setPosible(itemToEdit.posible);
    };

    const cancelEdit = () => {
        setEditingIndex(null);
        setSelectedArancelId(0);
        setCustomPrecioUnitario('');
        setPiezas('');
        setCantidad(1);
        setDescuento(0);
        setPosible(false);
    };

    const calculateTabTotal = () => {
        return detalles
            .filter(d => d.letra === activeTab)
            .reduce((sum, item) => sum + item.total, 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (detalles.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Atención',
                text: 'Debe agregar al menos un tratamiento a la propuesta',
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
            return;
        }

        try {
            const userStr = localStorage.getItem('user');
            const currentUser = userStr ? JSON.parse(userStr) : null;
            const usuarioId = currentUser?.id || 1;

            const payload = {
                pacienteId: pacienteId,
                usuarioId: usuarioId,
                nota,
                letra: letraHeader || activeTab,
                fecha,
                detalles: detalles.map(d => ({
                    letra: d.letra,
                    arancelId: d.arancelId,
                    precioUnitario: d.precioUnitario,
                    tc: d.tc,
                    piezas: d.piezas,
                    cantidad: d.cantidad,
                    subTotal: d.subTotal,
                    descuento: d.descuento,
                    total: d.total,
                    posible: d.posible
                }))
            };

            if (propuestaId) {
                await api.patch(`/propuestas/${propuestaId}`, payload);
                Swal.fire({
                    icon: 'success',
                    title: 'Propuesta Actualizada',
                    text: 'Propuesta actualizada exitosamente',
                    timer: 1500,
                    showConfirmButton: false,
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
            } else {
                await api.post('/propuestas', payload);
                Swal.fire({
                    icon: 'success',
                    title: 'Propuesta Guardada',
                    text: 'Propuesta guardada exitosamente',
                    timer: 1500,
                    showConfirmButton: false,
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
            }

            setTimeout(() => {
                onSuccess();
            }, 1500);
        } catch (error: any) {
            console.error('Error saving propuesta:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
            Swal.fire({
                icon: 'error',
                title: 'Error al Guardar',
                text: errorMessage,
                background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
            });
        }
    };

    const handleConvertToBudget = async () => {
        if (!propuestaId) return;

        const result = await Swal.fire({
            title: `¿Pasar Propuesta ${activeTab} a Presupuesto?`,
            text: `Se creará un nuevo Presupuesto oficial con los tratamientos de la Opción ${activeTab}.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#9333ea',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, Convertir a Presupuesto',
            cancelButtonText: 'Cancelar',
            background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
            color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
        });

        if (result.isConfirmed) {
            try {
                const userStr = localStorage.getItem('user');
                const currentUser = userStr ? JSON.parse(userStr) : null;
                const usuarioId = currentUser?.id || 1;

                // API Call to convert
                const response = await api.post(`/propuestas/${propuestaId}/convert-to-budget`, {
                    letra: activeTab,
                    usuarioId: usuarioId
                });

                const newProformaId = response.data.id;

                await Swal.fire({
                    icon: 'success',
                    title: '¡Presupuesto Creado!',
                    text: `Se ha generado exitosamente el Presupuesto #${response.data.numero || newProformaId}`,
                    timer: 2000,
                    showConfirmButton: false,
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });

                // Close and refresh the list
                onSuccess();
                onClose();
            } catch (error: any) {
                console.error('Error converting propuesta to budget:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response?.data?.message || 'No se pudo convertir la propuesta a presupuesto',
                    background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
                    color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#000',
                });
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-y-auto border border-gray-100 dark:border-gray-700 relative">
                <div className="p-6">
                    {/* Header Title & Ayuda */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                    <span className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-xl text-purple-600 dark:text-purple-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </span>
                    {propuestaId ? (isReadOnly ? `Ver Propuesta #${numero}` : `Editar Propuesta #${numero}`) : 'Nueva Propuesta'}
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[34px] h-[34px] text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shadow-sm cursor-pointer"
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


            {/* Header Card: Patient Info & Date matching PresupuestoForm */}
            <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-2xl mb-6 shadow-inner border border-gray-100 dark:border-gray-600">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Paciente</label>
                        <div className="text-xl font-bold text-gray-800 dark:text-white">
                            {paciente ? `${paciente.paterno} ${paciente.materno} ${paciente.nombre}` : 'Cargando...'}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Fecha</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <input
                                type="date"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                disabled={isReadOnly}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 outline-none transition-all shadow-sm disabled:bg-gray-100 dark:disabled:bg-gray-900"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation matching standard model */}
            <div className="no-print flex flex-wrap border-b border-gray-200 dark:border-gray-700 mb-6 gap-2">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => {
                            if (!isReadOnly) {
                                cancelEdit(); // Cancel edit if switching tabs
                            }
                            setActiveTab(tab);
                        }}
                        className={`px-6 py-3 text-sm font-bold rounded-t-xl transition-all duration-200 flex items-center gap-2 cursor-pointer
                            ${activeTab === tab
                                ? 'bg-white dark:bg-gray-800 border-b-2 border-purple-500 text-purple-600 dark:text-purple-300 shadow-sm'
                                : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:text-purple-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Propuesta {tab}
                    </button>
                ))}
            </div>

            {/* Item Entry Form - Matching PresupuestoForm input styles and layout */}
            {!isReadOnly && (
                <div className={`p-6 rounded-2xl mb-8 border transition-all duration-300 ${editingIndex !== null ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600'}`}>
                    <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        {editingIndex !== null ? (
                            <>
                                <span className="p-1 bg-blue-100 dark:bg-blue-800 rounded-lg text-blue-600 dark:text-blue-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                                </span>
                                Editar Item en Propuesta {activeTab}:
                            </>
                        ) : (
                            <>
                                <span className="p-1 bg-green-100 dark:bg-green-800 rounded-lg text-green-600 dark:text-green-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                </span>
                                Agregar Item a Propuesta {activeTab}:
                            </>
                        )}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        {/* SearchableSelect para Tratamiento igual a PresupuestoForm */}
                        <div className="md:col-span-3">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Tratamiento</label>
                            <SearchableSelect
                                options={aranceles.map(a => ({ id: a.id, label: a.detalle }))}
                                value={selectedArancelId}
                                onChange={(val) => handleSelectArancel(Number(val))}
                                placeholder="-- Seleccione Tratamiento --"
                                searchPlaceholder="Buscar tratamiento..."
                                icon={
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.172a4 4 0 005.656 0L13.293 3.707a1 1 0 00-1.414-1.414L11 3.172a2 2 0 01-2.828 0L7.707 2.707A1 1 0 007 2zm10 2a1 1 0 011 1v11.586l-2-2a2 2 0 00-2.828 0l-2 2V6a1 1 0 00-2 0v12.586l-2-2a2 2 0 00-2.828 0l-2 2V5a1 1 0 011-1h12z" clipRule="evenodd" />
                                    </svg>
                                }
                            />

                            {/* Opciones de Radio Precio 1 / Precio 2 con estilo de PresupuestoForm */}
                            <div className="mt-4 flex items-center gap-6">
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase">Precio:</span>
                                <label className="inline-flex items-center cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input
                                            type="radio"
                                            name="precioType"
                                            value="precio1"
                                            checked={precioType === 'precio1'}
                                            onChange={() => handlePrecioTypeChange('precio1')}
                                            className="peer sr-only"
                                        />
                                        <div className={`w-5 h-5 border-2 border-gray-400 rounded-full group-hover:border-purple-500 transition-colors ${precioType === 'precio1' ? 'border-purple-600 bg-white' : ''}`}>
                                            {precioType === 'precio1' && <div className="w-2.5 h-2.5 bg-purple-600 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />}
                                        </div>
                                    </div>
                                    <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-purple-600 transition-colors">
                                        Precio 1{selectedArancelId && aranceles.find(a => a.id === Number(selectedArancelId))?.precio1 ? ` (Bs. ${formatCurrency(aranceles.find(a => a.id === Number(selectedArancelId))!.precio1)})` : ''}
                                    </span>
                                </label>
                                <label className="inline-flex items-center cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input
                                            type="radio"
                                            name="precioType"
                                            value="precio2"
                                            checked={precioType === 'precio2'}
                                            onChange={() => handlePrecioTypeChange('precio2')}
                                            className="peer sr-only"
                                        />
                                        <div className={`w-5 h-5 border-2 border-gray-400 rounded-full group-hover:border-purple-500 transition-colors ${precioType === 'precio2' ? 'border-purple-600 bg-white' : ''}`}>
                                            {precioType === 'precio2' && <div className="w-2.5 h-2.5 bg-purple-600 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />}
                                        </div>
                                    </div>
                                    <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-purple-600 transition-colors">
                                        Precio 2{selectedArancelId && aranceles.find(a => a.id === Number(selectedArancelId))?.precio2 ? ` (Bs. ${formatCurrency(aranceles.find(a => a.id === Number(selectedArancelId))!.precio2)})` : ''}
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Costo Unitario Editable - Oculto como en presupuestos */}
                        <div className="hidden">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Costo Uni. (Bs.)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-400 font-bold">Bs.</span>
                                </div>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={customPrecioUnitario}
                                    onChange={(e) => setCustomPrecioUnitario(e.target.value as any)}
                                    placeholder="0.00"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Fila única: Pieza | Cantidad | Descuento | Posible */}
                        <div className="md:col-span-3 flex flex-wrap md:flex-nowrap items-end gap-3">
                            {/* Nº Pieza(s) */}
                            <div className="w-96">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Nº Pieza(s)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 00-1.219-1.343L8.88 4.5c-.832-.086-1.55.534-1.611 1.343l-.128 1.7a1 1 0 001.218 1.343l5.109-.432c.831-.087 1.55-.534 1.611-1.343l.132-1.7z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        value={piezas}
                                        onChange={(e) => setPiezas(e.target.value)}
                                        placeholder="Ej: 18, 24"
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            {/* Cantidad */}
                            <div className="w-28">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Cantidad</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-400 font-bold">#</span>
                                    </div>
                                    <input
                                        type="number"
                                        min="1"
                                        value={cantidad}
                                        onChange={(e) => setCantidad(Number(e.target.value))}
                                        className="w-full pl-8 pr-2 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            {/* Descuento (%) */}
                            <div className="w-28">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Desc. (%)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" />
                                            <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={descuento}
                                        onChange={(e) => setDescuento(e.target.value as any)}
                                        placeholder="0"
                                        className="w-full pl-10 pr-2 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-medium transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            {/* Posible Tratamiento Toggle Checkbox */}
                            <div className="flex items-center pb-2.5">
                                <label className="flex items-center cursor-pointer text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors gap-3 whitespace-nowrap">
                                    <div className="relative flex-shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={posible}
                                            onChange={(e) => setPosible(e.target.checked)}
                                            className="sr-only"
                                        />
                                        <div className={`w-10 h-5 bg-gray-300 dark:bg-gray-600 rounded-full shadow-inner transition-colors ${posible ? 'bg-orange-400' : ''}`}></div>
                                        <div className={`dot absolute w-5 h-5 bg-white rounded-full shadow -left-1 -top-0 transition-transform ${posible ? 'transform translate-x-full bg-blue-500' : ''}`}></div>
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider select-none">POSIBLE TRATAMIENTO</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleAddItem}
                            className={`px-5 py-2.5 rounded-xl shadow-md font-bold text-white text-sm transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer flex items-center gap-2
                                ${editingIndex !== null
                                    ? 'bg-blue-600 hover:bg-blue-700'
                                    : 'bg-orange-500 hover:bg-orange-600'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            {editingIndex !== null ? 'Actualizar Tratamiento' : 'Agregar Tratamiento'}
                        </button>
                        {editingIndex !== null && (
                            <button
                                type="button"
                                onClick={cancelEdit}
                                className="px-5 py-2.5 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                Cancelar Edición
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Items Table for Active Tab */}
            <div className="mb-8 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="bg-gray-100 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" />
                        </svg>
                        Tratamientos de Propuesta {activeTab}
                    </h4>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nº</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tratamiento</th>
                                <th className="px-4 py-3 text-center font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Piezas</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">P.U.</th>
                                <th className="px-4 py-3 text-center font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cant.</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                                <th className="px-4 py-3 text-center font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Desc %</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Neto</th>
                                <th className="px-4 py-3 text-center font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Posible</th>
                                {!isReadOnly && <th className="px-4 py-3 text-center font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acción</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {detalles.map((item, index) => {
                                // Only render items for the active tab
                                if (item.letra !== activeTab) return null;

                                return (
                                    <tr key={index} className={`
                                        ${editingIndex === index
                                            ? 'bg-blue-50 dark:bg-blue-900/30'
                                            : item.posible
                                                ? 'bg-yellow-50 dark:bg-yellow-900/10'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                        } transition-colors
                                    `}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center font-medium">{index + 1}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium">{item.tratamiento}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center font-medium">{item.piezas || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right font-medium">{formatCurrency(item.precioUnitario)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center font-medium">{item.cantidad}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right font-medium">{formatCurrency(item.subTotal)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center font-medium">{item.descuento}%</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white text-right">{formatCurrency(item.total)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                            <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-bold rounded-full ${item.posible ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                {item.posible ? 'SÍ' : 'NO'}
                                            </span>
                                        </td>
                                        {!isReadOnly && (
                                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEditItem(index)}
                                                        className="p-1.5 bg-transparent text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded transition-colors"
                                                        title="Editar"
                                                        disabled={editingIndex !== null && editingIndex !== index}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(index)}
                                                        className="p-1.5 bg-transparent text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 rounded transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {detalles.filter(d => d.letra === activeTab).length === 0 && (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            No hay items registrados en esta propuesta.
                        </div>
                    )}
                </div>
            </div>

            {/* Footer: Total and Note matching PresupuestoForm layout */}
            <div className="flex flex-col lg:flex-row justify-between items-start bg-gray-50 dark:bg-gray-700/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-600">
                <div className="flex-1 w-full lg:w-auto lg:mr-8 mb-6 lg:mb-0">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Nota / Observaciones</label>
                    <textarea
                        value={nota}
                        onChange={(e) => setNota(e.target.value)}
                        disabled={isReadOnly}
                        required
                        className="w-full h-32 p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed resize-none transition-all shadow-inner font-medium"
                        placeholder="Ingrese una nota o comentario general para la propuesta..."
                    />
                </div>

                <div className="w-full lg:w-1/3 min-w-[300px]">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow border border-gray-200 dark:border-gray-700">
                        <div className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Total Propuesta {activeTab}
                        </div>
                        <div className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                            Bs. {formatCurrency(calculateTabTotal())}
                        </div>

                        <div className="mt-8 flex flex-col gap-3">
                            {!isReadOnly && (
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 transform hover:-translate-y-0.5 transition-all shadow-md cursor-pointer active:scale-95"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                        <polyline points="7 3 7 8 15 8"></polyline>
                                    </svg>
                                    {propuestaId ? 'Actualizar' : 'Guardar'}
                                </button>
                            )}

                            {propuestaId && (
                                <button
                                    type="button"
                                    onClick={handleConvertToBudget}
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 transform hover:-translate-y-0.5 transition-all shadow-md cursor-pointer active:scale-95"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Pasar a Presupuesto
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={onClose}
                                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 transform hover:-translate-y-0.5 transition-all shadow-md cursor-pointer active:scale-95"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                {isReadOnly ? 'Volver' : 'Cancelar'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual - Propuestas"
                sections={manualSections}
            />
                </div>
            </div>
        </div>
    );
};

export default PropuestasForm;
