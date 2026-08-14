import PacienteFoto from './PacienteFoto';
import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Mail, Briefcase, Calendar, Shield, Activity, FileText, Clipboard } from 'lucide-react';

import { useNavigate, useParams, useLocation } from 'react-router-dom';
import MusicaTelevisionTab from './MusicaTelevisionTab';
import api from '../services/api';
import Swal from 'sweetalert2';
import ManualModal, { type ManualSection } from './ManualModal';
import SignatureModal from './SignatureModal';

import { getLocalDateString } from '../utils/dateUtils';



const RegistroPacienteView: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;
    const [showManual, setShowManual] = useState(false);
    const [showSignatureModal, setShowSignatureModal] = useState(false);

    const calculateAge = (birthDate: string) => {
        if (!birthDate) return 0;
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    useEffect(() => {
        if (location.state?.openSignature) {
            setShowSignatureModal(true);
            // Clear state so it doesn't reopen on manual refresh
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const manualSections: ManualSection[] = [
        {
            title: 'Registro de Pacientes',
            content: 'Complete los datos personales, de contacto y médicos del paciente. Use las pestañas para organizar la información. El formulario cuenta con 2 pestañas: Datos Personales y Ficha Médica.'
        },
        {
            title: 'Ficha Médica',
            content: 'Registre el historial médico del paciente, incluyendo alergias, enfermedades crónicas y medicamentos. Esta información es crucial para la atención odontológica segura.'
        },

        {
            title: 'Guardado de Datos',
            content: 'Use el botón "Guardar" al final del formulario para guardar los datos personales y la ficha médica. Puede cancelar en cualquier momento con el botón "Cancelar".'
        },
        {
            title: 'Novedades y Atajos',
            content: '• En la tabla principal (pantalla anterior) ahora tiene botones de atajo para ver e imprimir directamente el listado de pacientes.\n• Ahora los campos con listas desplegables irán actualizándose progresivamente para permitirle crear opciones nuevas sin salir de este formulario (botón +).'
        }
    ];

        const [formData, setFormData] = useState({
        fecha: getLocalDateString(),
        paterno: '',
        materno: '',
        nombre: '',
        direccion: '',
        telefono: '',
        celular: '',
        email: '',
        casilla: '',
        profesion: '',
        estado_civil: '',
        direccion_oficina: '',
        telefono_oficina: '',
        fecha_nacimiento: '',
        sexo: '',
        seguro_medico: '',
        seguro_codigo: '',
        poliza: '',
        fecha_vencimiento: '',
        responsable: '',
        parentesco: '',
        direccion_responsable: '',
        telefono_responsable: '',
        estado: 'activo',
        foto: '',
        nomenclatura: '',
        tipo_paciente: 'NORMAL',
        motivo: '',
        recomendado: '',
        idCategoria: 0,
        fax: '',
        casilla_postal: '',
        forma_pago: '',
        // Ficha Medica CURARE
        fichaMedica: {
            alergia_anestesicos: false,
            alergias_drogas: false,
            hepatitis: false,
            asma: false,
            diabetes: false,
            dolencia_cardiaca: false,
            hipertension: false,
            fiebre_reumatica: false,
            diatesis_hemorragia: false,
            sinusitis: false,
            ulcera_gastroduodenal: false,
            enfermedades_tiroides: false,
            observaciones: '',
            medico_cabecera: '',
            enfermedad_actual: '',
            toma_medicamentos: false,
            medicamentos_detalle: '',
            tratamiento: '',
            ultima_consulta: '',
            frecuencia_cepillado: '',
            usa_cepillo: false,
            usa_hilo_dental: false,
            usa_enjuague: false,
            mal_aliento: false,
            causa_mal_aliento: '',
            sangra_encias: false,
            dolor_cara: false,
            comentarios: ''
        }
    });

    const [countryCode, setCountryCode] = useState('+591');
    const [localCelular, setLocalCelular] = useState('');
    const [categorias, setCategorias] = useState<any[]>([]);

    const [currentStep, setCurrentStep] = useState<'form' | 'signature' | 'success'>('form');
    const [newPatientId, setNewPatientId] = useState<number | null>(null);
    const [isEnglish, setIsEnglish] = useState(false);
    const t = (es: string, en: string) => isEnglish ? en : es;
    const [selectedMusicas, setSelectedMusicas] = useState<number[]>([]);
    const [selectedTelevisiones, setSelectedTelevisiones] = useState<number[]>([]);
    const [selectedFotoFile, setSelectedFotoFile] = useState<File | Blob | null>(null);

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
        if (isEditing) {
            fetchPaciente();
        }
        fetchCategorias();
    }, [id]);

    const fetchCategorias = async () => {
        try {
            const response = await api.get('/categoria-paciente?page=1&limit=9999');
            if (response.data && Array.isArray(response.data.data)) {
                setCategorias(response.data.data.filter((c: any) => c.estado === 'activo'));
            }
        } catch (error) {
            console.error('Error fetching categorias', error);
        }
    };

    const fetchPaciente = async () => {
        try {
            const response = await api.get(`/pacientes/${id}`);
            const data = response.data;
            console.log('Fetched paciente data:', data);

            if (!data.fichaMedica) {
                data.fichaMedica = { ...formData.fichaMedica };
            }

            // Safety fallback for classification to prevent crash
            if (!data.clasificacion) {
                data.clasificacion = 'A0';
            }

            setFormData(data);

            // Handle splitting celular into code and number
            if (data.celular) {
                // Check if it starts with any known code
                const foundCode = countryCodes.find(c => data.celular.startsWith(c.code));
                if (foundCode && foundCode.code !== '+0') {
                    setCountryCode(foundCode.code);
                    setLocalCelular(data.celular.substring(foundCode.code.length));
                } else {
                    // Try to guess or just set generic
                    if (data.celular.startsWith('+')) {
                        // It has a code but maybe not in our list, or is custom
                        setCountryCode('+0');
                        setLocalCelular(data.celular);
                    } else {
                        // Assuming default or old data without code
                        setCountryCode('+591');
                        setLocalCelular(data.celular);
                    }
                }
            } else {
                setCountryCode('+591');
                setLocalCelular('');
            }
        } catch (error) {
            console.error('Error fetching paciente:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al cargar el paciente'
            });
        }
    };

    // const [categorias, setCategorias] = useState<any[]>([]);

    // useEffect(() => {
    //     fetchCategorias();
    // }, []);

    // const fetchCategorias = async () => {
    //     try {
    //         const response = await api.get('/categoria-paciente?limit=100');
    //         const activeCategorias = (response.data.data || []).filter((cat: any) => cat.estado === 'activo');
    //         setCategorias(activeCategorias);
    //     } catch (error) {
    //         console.error('Error fetching categorias:', error);
    //     }
    // };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, foto: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (name.startsWith('fichaMedica.')) {
            const field = name.split('.')[1];
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({
                ...prev,
                fichaMedica: {
                    ...prev.fichaMedica,
                    [field]: type === 'checkbox' ? checked : value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };
    const handleSaveAndSign = async () => {
        try {
            
            const finalCelular = countryCode === '+0' ? localCelular : `${countryCode}${localCelular}`;
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const payload = { 
                ...formData, 
                celular: finalCelular,
                usuarioId: user.id,
                fichaMedica: {
                    ...formData.fichaMedica,
                    usuarioId: user.id
                }
            };

            if (isEditing) {
                await api.patch(`/pacientes/${id}`, payload);
                setShowSignatureModal(true);
            } else {
                const response = await api.post('/pacientes', payload);
                const newId = response.data.id;

                await Swal.fire({
                    icon: 'success',
                    title: 'Paciente Guardado',
                    text: 'Se procedrerá con la firma de la ficha.',
                    timer: 1500,
                    showConfirmButton: false
                });

                // Navigate to edit mode and signal to open signature
                navigate(`/pacientes/edit/${newId}`, { state: { openSignature: true }, replace: true });
            }
        } catch (error: any) {
            console.error('Error saving before signature:', error);
            const errorMessage = error.response?.data?.message || 'Error al guardar el paciente';
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage
            });
        }
    };

    
    const uploadFotoReq = async (pId: number | string) => {
        if (selectedFotoFile) {
            const formData = new FormData();
            formData.append('file', selectedFotoFile, 'foto.jpg');
            await api.post(`/pacientes/${pId}/foto`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const finalCelular = countryCode === '+0' ? localCelular : `${countryCode}${localCelular}`;

            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const payload = {
                ...formData,
                idCategoria: formData.idCategoria === 0 ? null : formData.idCategoria,
                celular: finalCelular,
                usuarioId: user.id,
                fichaMedica: {
                    ...formData.fichaMedica,
                    usuarioId: user.id
                }
            };
            console.log('Submitting payload:', payload);

            if (isEditing) {
                await api.patch(`/pacientes/${id}`, payload);
                if (selectedMusicas.length >= 0) {
                    await api.post(`/pacientes/${id}/musica`, { musicaIds: selectedMusicas });
                }
                if (selectedTelevisiones.length >= 0) {
                    await api.post(`/pacientes/${id}/television`, { televisionIds: selectedTelevisiones });
                }
                await uploadFotoReq(id)

                await Swal.fire({
                    icon: 'success',
                    title: 'Paciente Actualizado',
                    text: 'Paciente actualizado exitosamente',
                    timer: 1500,
                    showConfirmButton: false
                });
                navigate('/pacientes');
            } else {
                const response = await api.post('/pacientes', payload);
                const newId = response.data.id || response.data.paciente?.id || response.data.data?.id;
                
                await uploadFotoReq(newId);
                
                setNewPatientId(newId);
                setCurrentStep('signature');
            }
        } catch (error: any) {
            console.error('Error saving paciente:', error);
            const errorMessage = error.response?.data?.message || 'Error al guardar el paciente';
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage
            });
        }
    };

    if (currentStep === 'signature') {
        return (
            <div className="dark min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 dark:text-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center">
                    <SignatureModal 
                        isOpen={true} 
                        onClose={() => setCurrentStep('success')} 
                        onSuccess={() => {
                            Swal.fire({
                                icon: 'success',
                                title: t('¡Registro Exitoso!', 'Registration Successful!'),
                                text: t('El paciente ha sido registrado correctamente.', 'The patient has been successfully registered.'),
                                confirmButtonColor: '#3085d6',
                            }).then(() => {
                                setCurrentStep('success');
                            });
                        }} 
                        documentoId={newPatientId || 0}
                        tipoDocumento="paciente"
                        rolFirmante="paciente"
                    />
                </div>
            </div>
        );
    }

    if (currentStep === 'success') {
        return (
            <div className="dark min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 dark:text-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center space-y-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="text-3xl font-black text-gray-800">{t('¡Gracias por registrarte!', 'Thank you for registering!')}</h2>
                    <p className="text-gray-600 text-lg">
                        {t('Tus datos han sido enviados correctamente a CURARE Centro Dental. Nuestro equipo te contactará pronto si es necesario.', 'Your data has been successfully sent to CURARE Centro Dental. Our team will contact you soon if necessary.')}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="dark min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 w-full flex items-center justify-center">
            <div className="max-w-4xl w-full mx-auto space-y-4 bg-white dark:bg-gray-800 dark:text-white p-4 md:p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 relative">
            <button 
                onClick={(e) => { e.preventDefault(); setIsEnglish(!isEnglish); }}
                className="absolute right-4 top-4 flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full shadow-sm border border-gray-300 dark:border-gray-600 transition-colors z-10"
                title="Change Language"
            >
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    {isEnglish ? 'EN' : 'ES'}
                </span>
            </button>
            <div className="flex flex-col items-center justify-center gap-2 py-4 w-full text-center mb-6">
                <h2 className="text-3xl font-black text-gray-800 dark:text-white uppercase tracking-tight mt-4">
                    CURARE CENTRO DENTAL
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                    {t('Registro de Nuevo Paciente', 'New Patient Registration')}
                </p>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed italic bg-blue-50/30 dark:bg-blue-900/10 p-4 rounded-lg">
                {t("Toda la información proporcionada en este documento es confidencial y de uso exclusivo de CURARE para fines terapéuticos.", "All information provided in this document is confidential and for the exclusive use of CURARE for therapeutic purposes.")}
            </p>

            <form onSubmit={handleSubmit} className="grid gap-5">
                {/* Datos Personales - Estructura Reorganizada */}
                <fieldset className="border border-gray-300 dark:border-gray-700 p-4 rounded-lg">
                    <legend className="font-bold px-2 text-gray-700 dark:text-gray-300">Datos Personales</legend>
                    
                    {/* Foto */}
                    <div className="flex justify-center mb-6 w-full max-w-sm mx-auto">
                        <PacienteFoto 
                            foto={formData.foto} 
                            onPhotoSelected={(file) => setSelectedFotoFile(file)} 
                        />
                    </div>

                    <div className="grid gap-4">
                        {/* Row 1: Paterno & Materno */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Ape. Paterno <span className="text-red-500">*</span>:</label>
                                <div className="relative flex-1 w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <input type="text" name="paterno" value={formData.paterno} onChange={handleChange} required placeholder="Ej: Pérez" className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Ape. Materno <span className="text-red-500">*</span>:</label>
                                <div className="relative flex-1 w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <input type="text" name="materno" value={formData.materno} onChange={handleChange} required placeholder="Ej: Cordova" className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500" />
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Nombres & Celular */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">{t('Nombres', 'First Name')} <span className="text-red-500">*</span>:</label>
                                <div className="relative flex-1 w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required placeholder="Ej: Carlos" className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">{t('Celular', 'Phone Number')} <span className="text-red-500">*</span>:</label>
                                <div className="flex gap-2">
                                    <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="w-[80px] px-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        {countryCodes.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                                    </select>
                                    <input type="text" value={localCelular} onChange={(e) => setLocalCelular(e.target.value)} required placeholder="Ej: 71234567" className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500" />
                                </div>
                            </div>
                        </div>

                        {/* Row 3: Domicilio, Telf. Domicilio */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-8">
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">{t('Domicilio', 'Address')}:</label>
                                <div className="relative flex-1 w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <MapPin className="h-4 w-4" />
                                    </div>
                                    <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} placeholder="Ej: Av. 6 de Agosto #123" className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500" />
                                </div>
                            </div>
                            <div className="md:col-span-4">
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">{t('Telf. Domicilio', 'Home Phone')}:</label>
                                <div className="relative flex-1 w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Phone className="h-4 w-4" />
                                    </div>
                                    <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="Ej: 4-440000" className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500" />
                                </div>
                            </div>
                        </div>

                        {/* Row 4: Casilla, Email */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-3">
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">{t('Casilla', 'PO Box')}:</label>
                                <div className="relative flex-1 w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Clipboard className="h-4 w-4" />
                                    </div>
                                    <input type="text" name="casilla" value={(formData as any).casilla || ''} onChange={handleChange} placeholder="Ej: 1234" className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500" />
                                </div>
                            </div>
                            <div className="md:col-span-9">
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">{t('Email', 'Email')}:</label>
                                <div className="relative flex-1 w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Mail className="h-4 w-4" />
                                    </div>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Ej: correo@ejemplo.com" className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500" />
                                </div>
                            </div>
                        </div>

                        {/* Row 5: Profesión, Estado Civil */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-8">
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">{t('Profesión u ocupación', 'Profession or Occupation')}:</label>
                                <div className="relative flex-1 w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Briefcase className="h-4 w-4" />
                                    </div>
                                    <input type="text" name="profesion" value={formData.profesion} onChange={handleChange} placeholder="Ej: Arquitecto" className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500" />
                                </div>
                            </div>
                            <div className="md:col-span-4">
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">{t('Estado Civil', 'Marital Status')}:</label>
                                <select name="estado_civil" value={formData.estado_civil} onChange={handleChange} className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500">
                                    <option value="">-- Seleccione --</option>
                                    <option value="Soltero/a">Soltero/a</option>
                                    <option value="Casado/a">Casado/a</option>
                                    <option value="Divorciado/a">Divorciado/a</option>
                                    <option value="Viudo/a">Viudo/a</option>
                                </select>
                            </div>
                        </div>

                        <hr className="my-2 border-gray-200 dark:border-gray-700" />

                        {/* Row 6: Dirección de Oficina, Telf. Oficina */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">{t('Dirección de Oficina', 'Office Address')}:</label>
                                <div className="relative flex-1 w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <MapPin className="h-4 w-4" />
                                    </div>
                                    <input type="text" name="direccion_oficina" value={(formData as any).direccion_oficina || ''} onChange={handleChange} placeholder="Ej: Edificio Empresarial, Piso 3" className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">{t('Telf. Oficina', 'Office Phone')}:</label>
                                <div className="relative flex-1 w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Phone className="h-4 w-4" />
                                    </div>
                                    <input type="text" name="telefono_oficina" value={(formData as any).telefono_oficina || ''} onChange={handleChange} placeholder="Ej: 2112233" className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500" />
                                </div>
                            </div>
                        </div>

                        {/* Row 7: Fax, Casilla Postal */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">{t('Fax', 'Fax')}:</label>
                                <div className="relative flex-1 w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Phone className="h-4 w-4" />
                                    </div>
                                    <input type="text" name="fax" value={(formData as any).fax || ''} onChange={handleChange} placeholder="Ej: 2112234" className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">{t('Casilla Postal', 'Postal Box')}:</label>
                                <div className="relative flex-1 w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Clipboard className="h-4 w-4" />
                                    </div>
                                    <input type="text" name="casilla_postal" value={(formData as any).casilla_postal || ''} onChange={handleChange} placeholder="Ej: 4321" className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500" />
                                </div>
                            </div>
                        </div>

                        {/* Row 8: Fecha Nacimiento, Edad, Sexo */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            <div className="md:col-span-5">
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">{t('Fecha Nacimiento', 'Date of Birth')} <span className="text-red-500">*</span>:</label>
                                <div className="relative flex-1 w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Calendar className="h-4 w-4" />
                                    </div>
                                    <input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} required placeholder="Fecha nacimiento..." className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500" />
                                </div>
                            </div>
                            <div className="md:col-span-3">
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">{t('Edad', 'Age')}:</label>
                                <div className="flex items-center gap-2">
                                    <input type="text" readOnly value={calculateAge(formData.fecha_nacimiento) || ''} className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg cursor-not-allowed" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Años</span>
                                </div>
                            </div>
                            <div className="md:col-span-4">
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">{t('Sexo', 'Gender')}:</label>
                                <div className="flex items-center gap-4 h-[38px]">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="sexo" value="Masculino" checked={formData.sexo?.toLowerCase() === 'masculino' || formData.sexo?.toLowerCase() === 'm'} onChange={handleChange} className="text-blue-600 focus:ring-blue-500" />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Masculino</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="sexo" value="Femenino" checked={formData.sexo?.toLowerCase() === 'femenino' || formData.sexo?.toLowerCase() === 'f'} onChange={handleChange} className="text-blue-600 focus:ring-blue-500" />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Femenino</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <hr className="my-2 border-gray-200 dark:border-gray-700" />

                        {/* Row 9: Seguro Médico, Póliza */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300 uppercase">{t('Seguro Médico', 'Health Insurance')}:</label>
                                <div className="relative flex-1 w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Shield className="h-4 w-4" />
                                    </div>
                                    <input type="text" name="seguro_medico" value={(formData as any).seguro_medico || ''} onChange={handleChange} placeholder="Ej: Caja Petrolera" className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">{t('Póliza No.', 'Policy No.')}:</label>
                                <div className="relative flex-1 w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <input type="text" name="poliza" value={(formData as any).poliza || ''} onChange={handleChange} placeholder="Ej: POL-987654" className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500" />
                                </div>
                            </div>
                        </div>

                        <hr className="my-2 border-gray-200 dark:border-gray-700" />

                        {/* Row 10: Recomendado por */}
                        <div>
                            <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">{t('Recomendado por', 'Recommended by')}:</label>
                            <div className="relative flex-1 w-full">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <User className="h-4 w-4" />
                                </div>
                                <input type="text" name="recomendado" value={formData.recomendado} onChange={handleChange} placeholder="Ej: Dr. Pérez" className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500" />
                            </div>
                        </div>

                        {/* Row 11: Responsable, Parentesco */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div>
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">{t('Responsable familia', 'Family Guardian')}<span className="text-xs text-gray-500 font-normal">(Si es menor de edad)</span>:</label>
                                <div className="relative flex-1 w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <input type="text" name="responsable" value={formData.responsable} onChange={handleChange} placeholder="Ej: Juan Pérez" className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">{t('Parentesco', 'Relationship')}:</label>
                                <div className="relative flex-1 w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <input type="text" name="parentesco" value={formData.parentesco} onChange={handleChange} placeholder="Ej: Padre" className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500" />
                                </div>
                            </div>
                        </div>

                        {/* Row 12: Dirección Responsable, Teléfono Responsable */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Dirección (Resp.):</label>
                                <div className="relative flex-1 w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <MapPin className="h-4 w-4" />
                                    </div>
                                    <input type="text" name="direccion_responsable" value={formData.direccion_responsable} onChange={handleChange} placeholder="Ej: Av. Arce" className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Teléfonos (Resp.):</label>
                                <div className="relative flex-1 w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Phone className="h-4 w-4" />
                                    </div>
                                    <input type="text" name="telefono_responsable" value={formData.telefono_responsable} onChange={handleChange} placeholder="Ej: 71122333" className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-500" />
                                </div>
                            </div>
                        </div>

                        <hr className="my-2 border-gray-200 dark:border-gray-700" />

                        </div>
                </fieldset>

                <fieldset className="border border-gray-300 dark:border-gray-700 p-4 rounded-lg mt-4 bg-gray-50 dark:bg-gray-800">
                    <legend className="font-bold px-2 text-gray-700 dark:text-gray-300">{t('Ficha Médica', 'Medical Form')}</legend>
                    <div className="flex flex-col gap-6">
                        
                        {/* LEFT COLUMN */}
                        <div className="flex flex-col gap-4">
                            
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3 mb-2">
                                {[
                                    { key: 'alergia_anestesicos', label: 'ALERGIA A ANESTÉSICOS' },
                                    { key: 'alergias_drogas', label: 'ALERGIAS A DROGAS' },
                                    { key: 'hepatitis', label: 'HEPATITIS' },
                                    { key: 'asma', label: 'ASMA' },
                                    { key: 'diabetes', label: 'DIABETES' },
                                    { key: 'dolencia_cardiaca', label: 'DOLENCIA CARDÍACA' },
                                    { key: 'hipertension', label: 'HIPERTENSIÓN' },
                                    { key: 'fiebre_reumatica', label: 'FIEBRE REUMÁTICA' },
                                    { key: 'diatesis_hemorragia', label: 'DIÁTESIS HEMORRAGIA' },
                                    { key: 'sinusitis', label: 'SINUSITIS' },
                                    { key: 'ulcera_gastroduodenal', label: 'ÚLCERA GASTRODUODENAL' },
                                    { key: 'enfermedades_tiroides', label: 'ENFERMEDADES DE TIROIDES' },
                                ].map((item) => (
                                    <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" name={`fichaMedica.${item.key}`} checked={(formData.fichaMedica as any)[item.key]} onChange={(e) => setFormData({ ...formData, fichaMedica: { ...formData.fichaMedica, [item.key]: e.target.checked } })} className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded-lg border-gray-300" />
                                        <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase">{item.label}</span>
                                    </label>
                                ))}
                            </div>

                            <div className="flex flex-col gap-1 items-start">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">{t('Observaciones', 'Observations')}:</label>
                                <div className="relative flex-1 w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Activity className="h-4 w-4" />
                                    </div>
                                    <textarea name="fichaMedica.observaciones" value={formData.fichaMedica.observaciones} onChange={handleChange} placeholder="Ej: Paciente presenta dolor al masticar..." className="w-full pl-9 pr-3 py-2 bg-white text-gray-900 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2}></textarea>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1 items-start">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">{t('Nombre del Médico de Cabecera', 'Primary Care Physician Name')}:</label>
                                <div className="relative flex-1 w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <input type="text" name="fichaMedica.medico_cabecera" value={formData.fichaMedica.medico_cabecera} onChange={handleChange} placeholder="Ej: Dr. Fernández" className="w-full pl-9 pr-3 py-2 bg-white text-gray-900 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('Indique si sufre actualmente de alguna enfermedad', 'Indicate if you currently suffer from any disease')}:</label>
                                <div className="relative flex-1 w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Activity className="h-4 w-4" />
                                    </div>
                                    <input type="text" name="fichaMedica.enfermedad_actual" value={formData.fichaMedica.enfermedad_actual} onChange={handleChange} placeholder="Ej: Ninguna" className="w-full pl-9 pr-3 py-2 bg-white text-gray-900 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1 items-start">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">¿Toma actualmente algún medicamento?</label>
                                <div className="flex gap-3">
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input type="radio" name="fichaMedica.toma_medicamentos" checked={formData.fichaMedica.toma_medicamentos === true} onChange={() => setFormData({ ...formData, fichaMedica: { ...formData.fichaMedica, toma_medicamentos: true } })} className="w-4 h-4" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Si</span>
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input type="radio" name="fichaMedica.toma_medicamentos" checked={formData.fichaMedica.toma_medicamentos === false} onChange={() => setFormData({ ...formData, fichaMedica: { ...formData.fichaMedica, toma_medicamentos: false } })} className="w-4 h-4" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">No</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1 items-start">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">¿Cuál?</label>
                                <div className="relative flex-1 w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Activity className="h-4 w-4" />
                                    </div>
                                    <input type="text" name="fichaMedica.medicamentos_detalle" value={formData.fichaMedica.medicamentos_detalle} onChange={handleChange} placeholder="Ej: Paracetamol 500mg" className="w-full pl-9 pr-3 py-2 bg-white text-gray-900 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1 items-start">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">Tratamiento :</label>
                                <div className="relative flex-1 w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Activity className="h-4 w-4" />
                                    </div>
                                    <input type="text" name="fichaMedica.tratamiento" value={formData.fichaMedica.tratamiento} onChange={handleChange} placeholder="Ej: Ortodoncia" className="w-full pl-9 pr-3 py-2 bg-white text-gray-900 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>

                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="flex flex-col gap-5 pt-4 border-t border-gray-300 dark:border-gray-600">
                            
                            <div className="flex flex-col sm:flex-row gap-4 sm:justify-between items-start">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase shrink-0">FECHA DE SU ÚLTIMA CONSULTA ODONTOLÓGICA</label>
                                <div className="flex flex-col gap-1.5 border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 rounded min-w-[160px]">
                                    {['6 meses a un año', 'mas de 1 año', 'mas de 3 año'].map((val) => (
                                        <label key={val} className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="fichaMedica.ultima_consulta" value={val} checked={formData.fichaMedica.ultima_consulta === val} onChange={handleChange} className="w-4 h-4" />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">{val}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 sm:justify-between items-start">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase shrink-0">¿CUÁNTAS VECES AL DÍA SE CEPILLA LOS DIENTES?</label>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 rounded min-w-[160px]">
                                    {['Una', 'Dos', 'Tres', 'Mas'].map((val) => (
                                        <label key={val} className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="fichaMedica.frecuencia_cepillado" value={val} checked={formData.fichaMedica.frecuencia_cepillado === val} onChange={handleChange} className="w-4 h-4" />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">{val}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 sm:justify-between items-start">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase shrink-0">¿QUÉ ELEMENTOS USA PARA SU HIGIENE DENTAL?</label>
                                <div className="flex flex-col gap-1.5 min-w-[160px]">
                                    {[
                                        { key: 'usa_cepillo', label: 'Cepillo dental' },
                                        { key: 'usa_hilo_dental', label: 'Elementos interdentales' },
                                        { key: 'usa_enjuague', label: 'Enjuague bucal' }
                                    ].map((item) => (
                                        <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={(formData.fichaMedica as any)[item.key]} onChange={(e) => setFormData({ ...formData, fichaMedica: { ...formData.fichaMedica, [item.key]: e.target.checked } })} className="w-4 h-4 rounded-lg text-blue-600 focus:ring-blue-500" />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center items-start bg-gray-100 dark:bg-gray-700/50 p-2 rounded">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase shrink-0">¿SUFRE DE MAL ALIENTO? (HALITOSIS)</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input type="radio" checked={formData.fichaMedica.mal_aliento === true} onChange={() => setFormData({ ...formData, fichaMedica: { ...formData.fichaMedica, mal_aliento: true } })} className="w-4 h-4" />
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Si</span>
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input type="radio" checked={formData.fichaMedica.mal_aliento === false} onChange={() => setFormData({ ...formData, fichaMedica: { ...formData.fichaMedica, mal_aliento: false } })} className="w-4 h-4" />
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">No</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1 items-start">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase shrink-0">¿CONOCE LA CAUSA?</label>
                                <div className="relative flex-1 w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Activity className="h-4 w-4" />
                                    </div>
                                    <input type="text" name="fichaMedica.causa_mal_aliento" value={formData.fichaMedica.causa_mal_aliento} onChange={handleChange} placeholder="Ej: Placa bacteriana" className="w-full pl-9 pr-3 py-2 bg-white text-gray-900 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>

                            <div className="flex gap-4 justify-between items-center bg-gray-100 dark:bg-gray-700/50 p-2 rounded">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase shrink-0">¿LE SANGRA LAS ENCÍAS AL CEPILLARSE?</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input type="radio" checked={formData.fichaMedica.sangra_encias === true} onChange={() => setFormData({ ...formData, fichaMedica: { ...formData.fichaMedica, sangra_encias: true } })} className="w-4 h-4" />
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Si</span>
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input type="radio" checked={formData.fichaMedica.sangra_encias === false} onChange={() => setFormData({ ...formData, fichaMedica: { ...formData.fichaMedica, sangra_encias: false } })} className="w-4 h-4" />
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">No</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-4 justify-between items-center bg-gray-100 dark:bg-gray-700/50 p-2 rounded">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase leading-tight max-w-2xl">¿SIENTE CANSANCIO O ALGÚN DOLOR EN LA CARA DESPUÉS DE MASTICAR O DE ALGUNA CONVERSACIÓN PROLONGADA?</label>
                                <div className="flex gap-4 shrink-0">
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input type="radio" checked={formData.fichaMedica.dolor_cara === true} onChange={() => setFormData({ ...formData, fichaMedica: { ...formData.fichaMedica, dolor_cara: true } })} className="w-4 h-4" />
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Si</span>
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input type="radio" checked={formData.fichaMedica.dolor_cara === false} onChange={() => setFormData({ ...formData, fichaMedica: { ...formData.fichaMedica, dolor_cara: false } })} className="w-4 h-4" />
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">No</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1 items-start">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase shrink-0">COMENTARIOS :</label>
                                <div className="relative flex-1 w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Clipboard className="h-4 w-4" />
                                    </div>
                                    <input type="text" name="fichaMedica.comentarios" value={formData.fichaMedica.comentarios} onChange={handleChange} placeholder="Ej: Ninguno" className="w-full pl-9 pr-3 py-2 bg-white text-gray-900 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>

                        </div>
                    </div>
                </fieldset>

                <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4">Preferencias (Música y Televisión)</h3>
                    <MusicaTelevisionTab
                        pacienteId={id ? Number(id) : null}
                        selectedMusicas={selectedMusicas}
                        setSelectedMusicas={setSelectedMusicas}
                        selectedTelevisiones={selectedTelevisiones}
                        setSelectedTelevisiones={setSelectedTelevisiones}
                    />
                </div>

                


                {/* Footer Buttons */}
                <div className="flex justify-center mt-8 p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl -mx-6 -mb-6">
                    <button
                        type="submit"
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-12 text-xl rounded-lg flex items-center gap-3 transform hover:-translate-y-0.5 transition-all shadow-lg w-full md:w-auto justify-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        {t('Guardar', 'Save')}
                    </button>
                </div>
            </form>

            {/* Signature Modal */}
            {showSignatureModal && id && (
                <SignatureModal
                    isOpen={showSignatureModal}
                    onClose={() => setShowSignatureModal(false)}
                    tipoDocumento="paciente"
                    documentoId={parseInt(id || '0')}
                    rolFirmante="paciente"
                    hideHistory={true}
                    closeOnSuccess={true}
                    onSuccess={() => navigate('/pacientes')}
                />
            )}
        </div>
        </div>
    );
};

export default RegistroPacienteView;
