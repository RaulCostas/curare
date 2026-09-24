import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Check, X, Sparkles, AlertCircle, Trash2, Volume2, HelpCircle } from 'lucide-react';
import type { Arancel } from '../types';
import api from '../services/api';
import { parsePresupuestoVoice, type ParsedVoicePresupuestoItem } from '../utils/speechPresupuestoParser';
import { formatCurrency } from '../utils/formatters';

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message?: string;
}

interface IWindow extends Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
}

interface PresupuestoVoiceAssistantProps {
    aranceles: Arancel[];
    onAddItem: (item: ParsedVoicePresupuestoItem) => void;
    onRemoveLastItem?: () => void;
    disabled?: boolean;
}

export const PresupuestoVoiceAssistant: React.FC<PresupuestoVoiceAssistantProps> = ({
    aranceles,
    onAddItem,
    onRemoveLastItem,
    disabled = false
}) => {
    const [localAranceles, setLocalAranceles] = useState<Arancel[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [lastParsedItem, setLastParsedItem] = useState<ParsedVoicePresupuestoItem | null>(null);
    const [parsedHistory, setParsedHistory] = useState<ParsedVoicePresupuestoItem[]>([]);
    const [autoAdd, setAutoAdd] = useState(false);
    const [showTips, setShowTips] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null);
    const restartTimerRef = useRef<any>(null);
    const silenceTimerRef = useRef<any>(null);
    const latestInterimRef = useRef<string>('');

    const effectiveAranceles = aranceles && aranceles.length > 0 ? aranceles : localAranceles;

    // Refs para evitar stale closures en los callbacks de SpeechRecognition
    const autoAddRef = useRef(autoAdd);
    const arancelesRef = useRef(effectiveAranceles);
    const onAddItemRef = useRef(onAddItem);
    const onRemoveLastItemRef = useRef(onRemoveLastItem);

    useEffect(() => {
        autoAddRef.current = autoAdd;
    }, [autoAdd]);

    useEffect(() => {
        arancelesRef.current = effectiveAranceles;
    }, [effectiveAranceles]);

    useEffect(() => {
        onAddItemRef.current = onAddItem;
    }, [onAddItem]);

    useEffect(() => {
        onRemoveLastItemRef.current = onRemoveLastItem;
    }, [onRemoveLastItem]);

    useEffect(() => {
        if (!aranceles || aranceles.length === 0) {
            api.get<any>('/arancel?limit=2000').then(res => {
                const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                setLocalAranceles(list);
            }).catch(err => console.error('Error fetching voice assistant aranceles:', err));
        }
    }, [aranceles]);

    const processVoicePhrase = (phrase: string) => {
        const lower = phrase.toLowerCase().trim();

        // Control commands
        if (lower === 'agregar' || lower === 'confirmar' || lower === 'anadir') {
            setLastParsedItem(prev => {
                if (prev) {
                    onAddItemRef.current(prev);
                    setParsedHistory(h => [prev, ...h.slice(0, 4)]);
                }
                return null;
            });
            setTranscript('');
            return;
        }

        if (lower === 'cancelar' || lower === 'limpiar' || lower === 'descartar') {
            setLastParsedItem(null);
            setTranscript('');
            return;
        }

        if (lower === 'borrar ultimo' || lower === 'eliminar ultimo') {
            if (onRemoveLastItemRef.current) onRemoveLastItemRef.current();
            return;
        }

        // Parse dental treatment
        const currentAranceles = arancelesRef.current;
        if (!currentAranceles || currentAranceles.length === 0) {
            setErrorMessage('Cargando catálogo de aranceles... Por favor intenta en unos segundos.');
            return;
        }

        const parsed = parsePresupuestoVoice(phrase, currentAranceles);
        if (parsed) {
            if (autoAddRef.current) {
                onAddItemRef.current(parsed);
                setParsedHistory(prev => [parsed, ...prev.slice(0, 4)]);
                setLastParsedItem(null);
                setErrorMessage(null);
            } else {
                setLastParsedItem(parsed);
                setErrorMessage(null);
            }
        } else {
            setErrorMessage(`No se encontró coincidencia para: "${phrase}". Intenta nombrar el tratamiento o arancel.`);
        }
    };

    useEffect(() => {
        const win = window as unknown as IWindow;
        const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

        if (!SpeechRecognitionClass) {
            setIsSupported(false);
            return;
        }

        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'es-BO';

        recognition.onstart = () => {
            setIsListening(true);
            setErrorMessage(null);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let finalStr = '';
            let interimStr = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcriptText = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalStr += transcriptText;
                } else {
                    interimStr += transcriptText;
                }
            }

            if (interimStr) {
                setInterimTranscript(interimStr);
                latestInterimRef.current = interimStr;

                // Pausa de 1.2 segundos para procesar automáticamente
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = setTimeout(() => {
                    if (latestInterimRef.current.trim()) {
                        const phrase = latestInterimRef.current.trim();
                        latestInterimRef.current = '';
                        setTranscript(phrase);
                        setInterimTranscript('');
                        processVoicePhrase(phrase);
                    }
                }, 1200);
            }

            if (finalStr.trim()) {
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                latestInterimRef.current = '';
                const phrase = finalStr.trim();
                setTranscript(phrase);
                setInterimTranscript('');
                processVoicePhrase(phrase);
            }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.warn('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                setErrorMessage('Permiso de micrófono denegado. Por favor activa el acceso al micrófono en tu navegador.');
                setIsListening(false);
            } else if (event.error === 'no-speech') {
                // Ignore silent timeouts
            } else {
                setErrorMessage(`Error de reconocimiento: ${event.error}`);
            }
        };

        recognition.onend = () => {
            if (isListening) {
                restartTimerRef.current = setTimeout(() => {
                    try {
                        recognition.start();
                    } catch (e) {
                        setIsListening(false);
                    }
                }, 300);
            } else {
                setIsListening(false);
            }
        };

        recognitionRef.current = recognition;

        return () => {
            if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch (e) {
                    // Ignore
                }
            }
        };
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) return;
        setErrorMessage(null);

        if (isListening) {
            setIsListening(false);
            try {
                recognitionRef.current.stop();
            } catch (e) {
                // Ignore
            }
        } else {
            try {
                setTranscript('');
                setInterimTranscript('');
                setLastParsedItem(null);
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                console.error('Error starting speech recognition:', e);
            }
        }
    };

    const handleConfirmItem = (item: ParsedVoicePresupuestoItem) => {
        onAddItem(item);
        setParsedHistory(prev => [item, ...prev.slice(0, 4)]);
        setLastParsedItem(null);
        setTranscript('');
    };

    if (!isSupported) {
        return (
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 p-3 rounded-xl text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>Tu navegador no soporta reconocimiento de voz nativo (Web Speech API). Usa Google Chrome o Microsoft Edge.</span>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50/40 to-blue-50 dark:from-gray-800/90 dark:via-gray-800/60 dark:to-gray-800/90 border border-blue-200/80 dark:border-blue-900/50 rounded-2xl p-4 sm:p-5 shadow-sm transition-all mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100 dark:border-gray-700/80 pb-3 mb-3">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20">
                        <Sparkles size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            Asistente de Presupuesto por Voz
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                IA / Voz
                            </span>
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Dicta tratamientos con piezas dentales, cantidades y descuentos
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Auto add toggle */}
                    <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-200 cursor-pointer bg-white dark:bg-gray-700 px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-600 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                        <input
                            type="checkbox"
                            checked={autoAdd}
                            onChange={(e) => setAutoAdd(e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                        />
                        <span>Agregar automático</span>
                    </label>

                    {/* Help button */}
                    <button
                        type="button"
                        onClick={() => setShowTips(!showTips)}
                        className="bg-white hover:bg-blue-50 dark:bg-gray-700 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 p-1.5 rounded-xl flex items-center justify-center w-8 h-8 shadow-sm transition-all cursor-pointer"
                        title="Ver ejemplos de dictado"
                    >
                        <HelpCircle size={16} />
                    </button>

                    {/* Main Mic Button */}
                    <button
                        type="button"
                        onClick={toggleListening}
                        disabled={disabled}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
                            isListening
                                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-red-500/30'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isListening ? (
                            <>
                                <MicOff size={15} />
                                <span>Detener Micrófono</span>
                            </>
                        ) : (
                            <>
                                <Mic size={15} />
                                <span>Activar Micrófono</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={15} className="shrink-0" />
                        <span>{errorMessage}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setErrorMessage(null)}
                        className="p-1 rounded-lg text-red-600 hover:text-red-800 bg-red-100 hover:bg-red-200 dark:bg-red-800/40 dark:hover:bg-red-800 dark:text-red-300 transition-colors cursor-pointer flex items-center justify-center shadow-sm"
                        title="Cerrar mensaje"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Tips / Examples Accordion */}
            {showTips && (
                <div className="bg-white dark:bg-gray-700/80 p-3.5 rounded-xl border border-blue-100 dark:border-gray-600 text-xs text-gray-700 dark:text-gray-200 mb-3 animate-fade-in shadow-inner">
                    <div className="font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-1.5">
                        <Volume2 size={14} /> Ejemplos con tratamientos reales de tu arancel:
                    </div>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 list-disc list-inside text-gray-600 dark:text-gray-300">
                        <li><span className="font-semibold text-gray-800 dark:text-white">"Obturación de resina compuesta en piezas 16 y 17"</span></li>
                        <li><span className="font-semibold text-gray-800 dark:text-white">"Limpieza dental cantidad 1"</span></li>
                        <li><span className="font-semibold text-gray-800 dark:text-white">"Corona de resina en pieza 24 con 10% de descuento"</span></li>
                        <li><span className="font-semibold text-gray-800 dark:text-white">"Extracción dentaria 3er molar superior pieza 18 posible"</span></li>
                        <li><span className="font-semibold text-gray-800 dark:text-white">"Carilla directa de resina estetica pieza 21 precio 2"</span></li>
                        <li><span className="font-semibold text-gray-800 dark:text-white">"Tratamiento de conductos unirradicular vital en pieza 11"</span></li>
                        <li><span className="font-semibold text-gray-800 dark:text-white">"Corona porcelana pura en pieza 22 con 15% de descuento"</span></li>
                        <li><span className="font-semibold text-gray-800 dark:text-white">"Incrustación de porcelana pieza 46 posible"</span></li>
                    </ul>
                </div>
            )}

            {/* Listening Live Display */}
            {isListening && (
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-3 rounded-xl border border-blue-200 dark:border-blue-800 flex items-center justify-between gap-3 mb-3 shadow-inner">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="flex items-center gap-1 shrink-0">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                            <span className="w-1.5 h-4 bg-red-500 rounded-full animate-pulse"></span>
                            <span className="w-1.5 h-6 bg-red-600 rounded-full animate-pulse delay-75"></span>
                            <span className="w-1.5 h-3 bg-red-500 rounded-full animate-pulse delay-150"></span>
                        </div>
                        <div className="text-xs truncate">
                            {interimTranscript ? (
                                <span className="text-blue-600 dark:text-blue-400 italic">"{interimTranscript}..."</span>
                            ) : transcript ? (
                                <span className="text-gray-800 dark:text-gray-200 font-medium">"{transcript}"</span>
                            ) : (
                                <span className="text-gray-400 italic">Escuchando... Di un tratamiento dental</span>
                            )}
                        </div>
                    </div>
                    <span className="text-[11px] font-semibold text-red-500 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-900 shrink-0">
                        En vivo
                    </span>
                </div>
            )}

            {/* Last Parsed Item Confirmation Card */}
            {lastParsedItem && !autoAdd && (
                <div className="bg-white dark:bg-gray-800 border-2 border-green-500/80 dark:border-green-500 rounded-xl p-3.5 shadow-md animate-fade-in mb-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/60 px-2 py-0.5 rounded-md">
                                Tratamiento Reconocido ({lastParsedItem.confidence}% coincidencia)
                            </span>
                            <h5 className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                                {lastParsedItem.arancel.detalle}
                            </h5>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-400">Total</div>
                            <div className="text-sm font-black text-blue-600 dark:text-blue-400">
                                Bs. {formatCurrency(lastParsedItem.total)}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-gray-50 dark:bg-gray-700/50 p-2.5 rounded-lg mb-3">
                        <div>
                            <span className="text-gray-500 dark:text-gray-400 block text-[10px]">Pieza(s):</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{lastParsedItem.piezas || 'General / Ninguna'}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400 block text-[10px]">Cantidad:</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{lastParsedItem.cantidad}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400 block text-[10px]">Precio Unit. ({lastParsedItem.precioType}):</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200">Bs. {formatCurrency(lastParsedItem.precioUnitario)}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400 block text-[10px]">Descuento / Posible:</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200">
                                {lastParsedItem.descuento > 0 ? `${lastParsedItem.descuento}% desc.` : '0%'}
                                {lastParsedItem.posible && <span className="ml-1 text-orange-500 font-bold">(Posible)</span>}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={() => setLastParsedItem(null)}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/40 dark:hover:text-red-300 border border-gray-300 dark:border-gray-600 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                        >
                            <X size={15} className="text-red-500" /> 
                            <span>Descartar</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleConfirmItem(lastParsedItem)}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                            <Check size={15} /> 
                            <span>Agregar al Presupuesto (o di "Agregar")</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Recent Voice Added Items History */}
            {parsedHistory.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/60">
                    <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mb-1.5">
                        <span>Últimos agregados por voz:</span>
                        {onRemoveLastItem && (
                            <button
                                type="button"
                                onClick={() => {
                                    onRemoveLastItem();
                                    setParsedHistory(prev => prev.slice(1));
                                }}
                                className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300 px-2 py-0.5 rounded-md border border-red-200 dark:border-red-800 flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer"
                                title="Deshacer último agregado"
                            >
                                <Trash2 size={12} /> Deshacer último
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {parsedHistory.map((h, idx) => (
                            <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 shadow-sm"
                            >
                                <Check size={11} className="text-green-500" />
                                <strong className="max-w-[150px] truncate">{h.arancel.detalle}</strong>
                                {h.piezas && <span className="text-blue-600 dark:text-blue-400">({h.piezas})</span>}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PresupuestoVoiceAssistant;
