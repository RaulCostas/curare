import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import type { DatosCentroDental } from '../types';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Building2, MapPin, Phone, Smartphone, AlertTriangle, Mail, Trash2, Clock } from 'lucide-react';

// Fix leaflet marker icon issue in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
    position: [number, number];
    setPosition: (pos: [number, number]) => void;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ position, setPosition }) => {
    useMapEvents({
        click(e: any) {
            setPosition([e.latlng.lat, e.latlng.lng]);
        },
    });

    return <Marker position={position} />;
};

interface DatosCentroDentalFormProps {
    isOpen: boolean;
    onClose: () => void;
    id?: number | null;
    onSaveSuccess: () => void;
}

const DatosCentroDentalForm: React.FC<DatosCentroDentalFormProps> = ({ isOpen, onClose, id, onSaveSuccess }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        direccion: '',
        latitud: '',
        longitud: '',
        telefono: '',
        email: '',
        celular: '',
        emergencias: '',
        qr: '',
        estado: 'activo',
        horarios: ''
    });

    // Separated state for phone numbers
    const [celularCountryCode, setCelularCountryCode] = useState('+591');
    const [localCelular, setLocalCelular] = useState('');
    
    const [emergenciasCountryCode, setEmergenciasCountryCode] = useState('+591');
    const [localEmergencias, setLocalEmergencias] = useState('');

    const [mapPosition, setMapPosition] = useState<[number, number]>([-16.489689, -68.119293]); // Default La Paz, Bolivia
    const [qrFile, setQrFile] = useState<File | null>(null);
    const [qrPreview, setQrPreview] = useState<string | null>(null);
    const [qrRemoved, setQrRemoved] = useState<boolean>(false);

    const countryCodes = [
        { code: '+591', label: '🇧🇴 +591' },
        { code: '+54', label: '🇦🇷 +54' },
        { code: '+55', label: '🇧🇷 +55' },
        { code: '+56', label: '🇨🇱 +56' },
        { code: '+51', label: '🇵🇪 +51' },
        { code: '+595', label: '🇵🇾 +595' },
        { code: '+598', label: '🇺🇾 +598' },
        { code: '+57', label: '🇨🇴 +57' },
        { code: '+52', label: '🇲🇽 +52' },
        { code: '+34', label: '🇪🇸 +34' },
        { code: '+1', label: '🇺🇸 +1' },
    ];

    useEffect(() => {
        if (isOpen) {
            setQrFile(null);
            setQrPreview(null);
            setQrRemoved(false);
            if (id) {
                // Modo Edición: Cargar datos
                api.get<DatosCentroDental>(`/datos-centro-dental/${id}`)
                    .then(response => {
                        const data = response.data;
                        setFormData({
                            nombre: data.nombre || '',
                            direccion: data.direccion || '',
                            latitud: data.latitud || '',
                            longitud: data.longitud || '',
                            telefono: data.telefono || '',
                            email: data.email || '',
                            celular: data.celular || '',
                            emergencias: data.emergencias || '',
                            qr: data.qr || '',
                            estado: data.estado || 'activo',
                            horarios: data.horarios || ''
                        });

                        // Set celular parts
                        if (data.celular) {
                            const cel = data.celular;
                            const foundCode = countryCodes.find(c => cel.startsWith(c.code));
                            if (foundCode) {
                                setCelularCountryCode(foundCode.code);
                                setLocalCelular(cel.substring(foundCode.code.length).trim());
                            } else {
                                setLocalCelular(cel);
                            }
                        } else {
                            setLocalCelular('');
                        }

                        // Set emergencias parts
                        if (data.emergencias) {
                            const emg = data.emergencias;
                            const foundCode = countryCodes.find(c => emg.startsWith(c.code));
                            if (foundCode) {
                                setEmergenciasCountryCode(foundCode.code);
                                setLocalEmergencias(emg.substring(foundCode.code.length).trim());
                            } else {
                                setLocalEmergencias(emg);
                            }
                        } else {
                            setLocalEmergencias('');
                        }

                        if (data.latitud && data.longitud) {
                            setMapPosition([parseFloat(data.latitud), parseFloat(data.longitud)]);
                        }

                        if (data.qr) {
                            setQrPreview(`${api.defaults.baseURL?.replace('/api', '')}/uploads/${data.qr}`);
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching datos:', error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'Error al cargar los datos'
                        });
                    });
            } else {
                // Modo Creación: Limpiar formulario
                setFormData({
                    nombre: '',
                    direccion: '',
                    latitud: '',
                    longitud: '',
                    telefono: '',
                    email: '',
                    celular: '',
                    emergencias: '',
                    qr: '',
                    estado: 'activo',
                    horarios: ''
                });
                setCelularCountryCode('+591');
                setLocalCelular('');
                setEmergenciasCountryCode('+591');
                setLocalEmergencias('');
                setMapPosition([-16.489689, -68.119293]);
            }
        }
    }, [id, isOpen]);

    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            latitud: mapPosition[0].toString(),
            longitud: mapPosition[1].toString()
        }));
    }, [mapPosition]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setQrFile(file);
            setQrPreview(URL.createObjectURL(file));
            setQrRemoved(false);
        }
    };

    const handleRemoveQr = () => {
        setQrFile(null);
        setQrPreview(null);
        setQrRemoved(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const finalCelular = localCelular ? `${celularCountryCode}${localCelular}` : '';
            const finalEmergencias = localEmergencias ? `${emergenciasCountryCode}${localEmergencias}` : '';

            const dataToSubmit = {
                ...formData,
                celular: finalCelular,
                emergencias: finalEmergencias,
                ...(qrRemoved ? { qr: null } : {})
            };

            let savedId = id;
            if (id) {
                await api.patch(`/datos-centro-dental/${id}`, dataToSubmit);
            } else {
                const response = await api.post('/datos-centro-dental', dataToSubmit);
                savedId = response.data.id;
            }

            // Upload QR if selected
            if (qrFile && savedId) {
                const form = new FormData();
                form.append('file', qrFile);
                await api.post(`/datos-centro-dental/${savedId}/qr`, form, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
            }

            await Swal.fire({
                icon: 'success',
                title: id ? 'Datos Actualizados' : 'Datos Guardados',
                text: 'Configuración guardada exitosamente',
                timer: 1500,
                showConfirmButton: false
            });
            
            onSaveSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving datos:', error);
            const errorMessage = error.response?.data?.message || 'Error al guardar los datos';
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 transition-opacity">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <span className="p-2 bg-blue-100 dark:bg-blue-900 rounded-xl text-blue-600 dark:text-blue-300">
                            <Building2 className="h-5 w-5" />
                        </span>
                        {id ? 'Editar Datos del Centro' : 'Nuevos Datos del Centro'}
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
                <div className="p-5 overflow-y-auto">
                    <form onSubmit={handleSubmit} id="datos-form">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="mb-4">
                                <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Nombre del Centro Dental <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleChange}
                                        required
                                        placeholder="Ej: Centro Dental CURARE"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition duration-200"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">El nombre oficial que aparecerá en los reportes.</p>
                            </div>
                            
                            <div className="mb-4">
                                <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Dirección <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        name="direccion"
                                        value={formData.direccion}
                                        onChange={handleChange}
                                        required
                                        placeholder="Ej: Av. Principal #123"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition duration-200"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Dirección completa del consultorio.</p>
                            </div>
                            
                            <div className="mb-4 md:col-span-2">
                                <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Ubicación en Mapa
                                </label>
                                <p className="text-xs text-gray-500 mb-2">Haz clic en el mapa para marcar la ubicación exacta de tu Centro Dental.</p>
                                <div className="h-[250px] w-full rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600">
                                    <MapContainer center={mapPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        />
                                        <LocationPicker position={mapPosition} setPosition={setMapPosition} />
                                    </MapContainer>
                                </div>
                                <div className="flex gap-4 mt-2">
                                    <div className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">Lat: {formData.latitud}</div>
                                    <div className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">Lng: {formData.longitud}</div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Teléfono Fijo</label>
                                <div className="relative">
                                    <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        name="telefono"
                                        value={formData.telefono}
                                        onChange={handleChange}
                                        placeholder="Ej: 2123456"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition duration-200"
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Celular <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        value={celularCountryCode}
                                        onChange={(e) => setCelularCountryCode(e.target.value)}
                                        className="py-2 px-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-sans text-sm"
                                    >
                                        {countryCodes.map(c => (
                                            <option key={c.code} value={c.code}>{c.label}</option>
                                        ))}
                                    </select>
                                    <div className="relative flex-1">
                                        <Smartphone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        <input
                                            type="text"
                                            value={localCelular}
                                            onChange={(e) => setLocalCelular(e.target.value)}
                                            required
                                            placeholder="Ej: 71234567"
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition duration-200"
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Celular principal de contacto.</p>
                            </div>

                            <div className="mb-4">
                                <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Emergencias</label>
                                <div className="flex gap-2">
                                    <select
                                        value={emergenciasCountryCode}
                                        onChange={(e) => setEmergenciasCountryCode(e.target.value)}
                                        className="py-2 px-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-sans text-sm"
                                    >
                                        {countryCodes.map(c => (
                                            <option key={c.code} value={c.code}>{c.label}</option>
                                        ))}
                                    </select>
                                    <div className="relative flex-1">
                                        <AlertTriangle size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        <input
                                            type="text"
                                            value={localEmergencias}
                                            onChange={(e) => setLocalEmergencias(e.target.value)}
                                            placeholder="Ej: 71234567"
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition duration-200"
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Celular para casos de emergencias.</p>
                            </div>

                            <div className="mb-4">
                                <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Email</label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Ej: contacto@clinicadental.com"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition duration-200"
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Horarios de Atención</label>
                                <div className="relative">
                                    <Clock size={18} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
                                    <textarea
                                        name="horarios"
                                        value={formData.horarios}
                                        onChange={handleChange}
                                        placeholder="Ej: Lunes a Viernes: 08:00 - 19:00&#10;Sábados: 09:00 - 13:00"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition duration-200 min-h-[80px]"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Horarios de funcionamiento de la clínica.</p>
                            </div>

                            <div className="mb-4">
                                <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Estado</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                                            <line x1="12" y1="2" x2="12" y2="12"></line>
                                        </svg>
                                    </div>
                                    <select
                                        name="estado"
                                        value={formData.estado}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none transition duration-200"
                                        required
                                    >
                                        <option value="activo">Activo</option>
                                        <option value="inactivo">Inactivo</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-4 md:col-span-2">
                                <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Código QR (para cobros)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                                />
                                <p className="text-xs text-gray-500 mt-1">Sube la imagen de tu código QR bancario. Este código podrá ser mostrado a los pacientes.</p>
                                
                                {qrPreview && (
                                    <div className="mt-4 flex flex-col items-center">
                                        <div className="relative">
                                            <img src={qrPreview} alt="QR Preview" className="max-h-48 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm" />
                                            <button
                                                type="button"
                                                onClick={handleRemoveQr}
                                                className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-105"
                                                title="Eliminar QR"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-start gap-3 rounded-b-xl">
                    <button
                        type="submit"
                        form="datos-form"
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-xl flex items-center gap-2 transform hover:-translate-y-0.5 transition-all shadow-md"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        {id ? 'Actualizar' : 'Guardar'}
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

export default DatosCentroDentalForm;
