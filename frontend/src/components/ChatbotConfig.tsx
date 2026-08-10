import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';

import ChatbotIntentosConfig from './ChatbotIntentosConfig';
import ManualModal, { type ManualSection } from './ManualModal';

const ChatbotConfig: React.FC = () => {
    const navigate = useNavigate();
    
    const [status, setStatus] = useState<string>('disconnected');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [connectingStartTime, setConnectingStartTime] = useState<number | null>(null);
    const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

    const [activeTab, setActiveTab] = useState<'status' | 'intents'>('status');
    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Chatbot WhatsApp',
            content: 'Conecte su número de WhatsApp para automatizar respuestas. Escanee el código QR para vincular el dispositivo.'
        },
        {
            title: 'Estados de Conexión',
            content: 'El bot puede estar: Conectado (funcionando), Desconectado (inactivo) o Esperando QR (listo para vincular).'
        },
        {
            title: 'Respuestas Automáticas',
            content: 'En la pestaña "Respuestas Automáticas" puede definir palabras clave y las respuestas que el bot enviará.'
        }];

    const fetchStatus = async () => {
        try {
            const response = await api.get(`/chatbot/status?t=${Date.now()}`);
            setStatus(response.data.status);
            setQrCode(response.data.qr);

            if (response.data.status === 'connecting') {
                if (!connectingStartTime) {
                    setConnectingStartTime(Date.now());
                } else {
                    const elapsed = Date.now() - connectingStartTime;
                    if (elapsed > 45000) {
                        setShowTimeoutWarning(true);
                    }
                }
            } else {
                setConnectingStartTime(null);
                setShowTimeoutWarning(false);
            }
        } catch (error) {
            console.error('Error fetching status:', error);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleInitialize = async () => {
        setLoading(true);
        setShowTimeoutWarning(false);
        setConnectingStartTime(null);
        try {
            const response = await api.post(`/chatbot/initialize`);
            if (response.data.error) {
                throw new Error(response.data.error);
            }
            fetchStatus();
        } catch (error: any) {
            console.error('Error initializing:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al iniciar el bot: ' + (error.response?.data?.error || error.response?.data?.message || error.message)
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async (skipConfirm = false) => {
        let shouldDisconnect = skipConfirm;
        if (!skipConfirm) {
            const result = await Swal.fire({
                title: '¿Está seguro de desconectar el bot?',
                text: "Se cerrará la sesión actual.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, desconectar',
                cancelButtonText: 'Cancelar'
            });
            shouldDisconnect = result.isConfirmed;
        }

        if (shouldDisconnect) {
            setLoading(true);
            try {
                await api.post(`/chatbot/disconnect`);
                fetchStatus();
                if (!skipConfirm) Swal.fire('Desconectado', 'El bot ha sido desconectado.', 'success');
            } catch (error) {
                console.error('Error disconnecting:', error);
                Swal.fire('Error', 'No se pudo desconectar.', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/configuration')}
                    className="group flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 !p-0 shadow-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
                    title="Volver a Configuración"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-600 dark:text-gray-400"
                    >
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Chatbot WhatsApp (Nativo)</h2>
                <button
                    onClick={() => setShowManual(true)}
                    style={{
                        backgroundColor: '#f1f1f1',
                        border: '1px solid #ddd',
                        padding: '6px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '30px',
                        height: '30px',
                        fontSize: '14px',
                        color: '#555'
                    }}
                    title="Ayuda / Manual"
                    className="no-print"
                >
                    ?
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-600 mb-6 bg-gray-50 dark:bg-gray-700/50 rounded-t-lg px-2 pt-2">
                <button
                    onClick={() => setActiveTab('status')}
                    className={`flex items-center gap-2 px-5 py-3 text-base font-medium transition-colors border-b-4 rounded-t-lg outline-none focus:outline-none ${activeTab === 'status'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800'
                        : 'border-transparent text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-500'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                        <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                        <line x1="12" y1="20" x2="12.01" y2="20"></line>
                    </svg>
                    Estado y Conexión
                </button>
                <button
                    onClick={() => setActiveTab('intents')}
                    className={`flex items-center gap-2 px-5 py-3 text-base font-medium transition-colors border-b-4 rounded-t-lg outline-none focus:outline-none ${activeTab === 'intents'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800'
                        : 'border-transparent text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-500'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Respuestas Automáticas
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md min-h-[400px]">
                {activeTab === 'status' ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        {status === 'connected' ? (
                            <div className="text-center text-green-600 dark:text-green-400 animate-in fade-in zoom-in duration-300">
                                <div className="text-xs text-gray-400 mb-2">Estado: {status}</div>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h3 className="text-2xl font-bold mb-2">¡Bot Conectado!</h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-8">El sistema está respondiendo automáticamente.</p>

                                <button
                                    onClick={() => handleDisconnect(false)}
                                    disabled={loading}
                                    className="px-6 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 font-semibold disabled:opacity-50 disabled:transform-none"
                                >
                                    {loading ? 'Desconectando...' : 'Desconectar Sesión'}
                                </button>
                            </div>
                        ) : status === 'qr' && qrCode ? (
                            <div className="text-center">
                                <div className="text-xs text-gray-400 mb-2">Estado: {status} (QR Len: {qrCode?.length})</div>
                                <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Escanee el código QR</h3>
                                <div className="p-4 bg-white border-4 border-gray-100 rounded-lg shadow-sm inline-block">
                                    <img
                                        src={qrCode}
                                        alt="WhatsApp QR Code"
                                        className="w-64 h-64 mx-auto"
                                    />
                                </div>
                                <p className="mt-6 text-gray-600 dark:text-gray-400 animate-pulse">
                                    Abra WhatsApp {'>'} Dispositivos vinculados {'>'} Vincular dispositivo
                                </p>

                                <button
                                    onClick={() => handleDisconnect(true)}
                                    disabled={loading}
                                    className="mt-6 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold shadow-md transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                                >
                                    Cancelar
                                </button>
                            </div>
                        ) : status === 'connecting' ? (
                            <div className="text-center">
                                <div className="text-xs text-gray-400 mb-2">Estado: {status}</div>
                                <div className="text-blue-500 mb-4 animate-spin inline-block">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Iniciando Servicio...</h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md">Esperando generación del código QR. Esto puede demorar unos segundos.</p>

                                {showTimeoutWarning && (
                                    <div className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-600 rounded-lg max-w-md mx-auto">
                                        <p className="text-yellow-800 dark:text-yellow-300 text-sm mb-2">
                                            ⚠️ La conexión está tomando más tiempo de lo esperado.
                                        </p>
                                        <button
                                            onClick={async () => {
                                                await api.post(`/chatbot/disconnect`);
                                                setShowTimeoutWarning(false);
                                                setConnectingStartTime(null);
                                                await new Promise(resolve => setTimeout(resolve, 1000));
                                                handleInitialize();
                                            }}
                                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold text-sm shadow-md transition-all"
                                        >
                                            Reintentar Conexión
                                        </button>
                                    </div>
                                )}

                                <button
                                    onClick={async () => {
                                        const result = await Swal.fire({
                                            title: '¿Detener conexión?',
                                            text: "¿Desea detener el intento de conexión?",
                                            icon: 'warning',
                                            showCancelButton: true,
                                            confirmButtonColor: '#d33',
                                            cancelButtonColor: '#3085d6',
                                            confirmButtonText: 'Sí, detener'
                                        });

                                        if (result.isConfirmed) {
                                            await api.post(`/chatbot/disconnect`);
                                            setShowTimeoutWarning(false);
                                            setConnectingStartTime(null);
                                            fetchStatus();
                                            Swal.fire('Detenido', 'La conexión ha sido detenida.', 'success');
                                        }
                                    }}
                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold shadow-md transition-all transform hover:-translate-y-0.5"
                                >
                                    Cancelar / Detener
                                </button>
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="text-xs text-gray-400 mb-2">Estado: {status}</div>
                                <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-full inline-flex mb-6 text-gray-400 dark:text-gray-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Bot Desconectado</h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">Inicie el servicio para generar un código QR y vincular el WhatsApp de la clínica.</p>

                                <button
                                    onClick={handleInitialize}
                                    disabled={loading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all transform hover:-translate-y-1 mb-4 disabled:opacity-50 disabled:transform-none"
                                >
                                    {loading ? 'Iniciando...' : 'Iniciar Bot'}
                                </button>

                                <div>
                                    <button
                                        onClick={async () => {
                                            const result = await Swal.fire({
                                                title: '¿Reiniciar sesión?',
                                                text: "Esto eliminará la sesión actual para generar un nuevo QR. ¿Continuar?",
                                                icon: 'warning',
                                                showCancelButton: true,
                                                confirmButtonColor: '#d33',
                                                cancelButtonColor: '#3085d6',
                                                confirmButtonText: 'Sí, reiniciar'
                                            });

                                            if (result.isConfirmed) {
                                                setLoading(true);
                                                try {
                                                    await api.post(`/chatbot/reset`);
                                                    await Swal.fire('Sesión reiniciada', 'Intente iniciar el bot nuevamente.', 'success');
                                                    fetchStatus();
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }
                                        }}
                                        className="mt-2 text-white bg-red-500 hover:bg-red-600 font-medium py-2 px-4 rounded-lg text-sm shadow-md transition-all transform hover:-translate-y-0.5"
                                    >
                                        ¿Problemas? Reiniciar Sesión
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <ChatbotIntentosConfig />
                )}
            </div>

            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Chatbot"
                sections={manualSections}
            />
        </div>
    );
};

export default ChatbotConfig;
