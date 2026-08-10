import React, { useState, useEffect } from 'react';
import api from '../services/api';
import type { Musica, Television } from '../types';

interface MusicaTelevisionTabProps {
    pacienteId: number | null;
    selectedMusicas: number[];
    setSelectedMusicas: (ids: number[]) => void;
    selectedTelevisiones: number[];
    setSelectedTelevisiones: (ids: number[]) => void;
}

const MusicaTelevisionTab: React.FC<MusicaTelevisionTabProps> = ({
    pacienteId,
    selectedMusicas,
    setSelectedMusicas,
    selectedTelevisiones,
    setSelectedTelevisiones
}) => {
    const [musicas, setMusicas] = useState<Musica[]>([]);
    const [televisiones, setTelevisiones] = useState<Television[]>([]);

    useEffect(() => {
        fetchListas();
        if (pacienteId) {
            fetchSelecciones();
        }
    }, [pacienteId]);

    const fetchListas = async () => {
        try {
            const [musicasRes, televisionesRes] = await Promise.all([
                api.get('/musica?limit=100'),
                api.get('/television?limit=100')
            ]);
            const musicasData = musicasRes.data.data || musicasRes.data;
            const televisionesData = televisionesRes.data.data || televisionesRes.data;

            setMusicas(Array.isArray(musicasData) ? musicasData.filter((m: Musica) => m.estado === 'activo') : []);
            setTelevisiones(Array.isArray(televisionesData) ? televisionesData.filter((t: Television) => t.estado === 'activo') : []);
        } catch (error) {
            console.error('Error fetching listas:', error);
        }
    };

    const fetchSelecciones = async () => {
        if (!pacienteId) return;
        try {
            const [musicasRes, televisionesRes] = await Promise.all([
                api.get(`/pacientes/${pacienteId}/musica`),
                api.get(`/pacientes/${pacienteId}/television`)
            ]);
            setSelectedMusicas(musicasRes.data || []);
            setSelectedTelevisiones(televisionesRes.data || []);
        } catch (error) {
            console.error('Error fetching selecciones:', error);
        }
    };

    const handleMusicaChange = async (musicaId: number) => {
        const newSelection = selectedMusicas.includes(musicaId)
            ? selectedMusicas.filter(id => id !== musicaId)
            : [...selectedMusicas, musicaId];

        setSelectedMusicas(newSelection);

        // Auto-save only if editing
        if (pacienteId) {
            try {
                await api.post(`/pacientes/${pacienteId}/musica`, { musicaIds: newSelection });
            } catch (error) {
                console.error('Error guardando música:', error);
            }
        }
    };

    const handleTelevisionChange = async (televisionId: number) => {
        const newSelection = selectedTelevisiones.includes(televisionId)
            ? selectedTelevisiones.filter(id => id !== televisionId)
            : [...selectedTelevisiones, televisionId];

        setSelectedTelevisiones(newSelection);

        // Auto-save only if editing
        if (pacienteId) {
            try {
                await api.post(`/pacientes/${pacienteId}/television`, { televisionIds: newSelection });
            } catch (error) {
                console.error('Error guardando televisión:', error);
            }
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Sección Música */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                        <path d="M9 18V5l12-2v13"></path>
                        <circle cx="6" cy="18" r="3"></circle>
                        <circle cx="18" cy="16" r="3"></circle>
                    </svg>
                    Música
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {musicas.map(musica => (
                        <label
                            key={musica.id}
                            className="flex items-center gap-2 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        >
                            <input
                                type="checkbox"
                                checked={selectedMusicas.includes(musica.id)}
                                onChange={() => handleMusicaChange(musica.id)}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span className="text-gray-700 dark:text-gray-300">{musica.musica}</span>
                        </label>
                    ))}
                </div>
                {musicas.length === 0 && (
                    <p className="text-gray-500 dark:text-gray-400 italic">No hay opciones de música disponibles</p>
                )}
            </div>

            {/* Sección Televisión */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
                        <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
                        <polyline points="17 2 12 7 7 2"></polyline>
                    </svg>
                    Televisión
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {televisiones.map(television => (
                        <label
                            key={television.id}
                            className="flex items-center gap-2 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        >
                            <input
                                type="checkbox"
                                checked={selectedTelevisiones.includes(television.id)}
                                onChange={() => handleTelevisionChange(television.id)}
                                className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span className="text-gray-700 dark:text-gray-300">{television.television}</span>
                        </label>
                    ))}
                </div>
                {televisiones.length === 0 && (
                    <p className="text-gray-500 dark:text-gray-400 italic">No hay opciones de televisión disponibles</p>
                )}
            </div>
        </div>
    );
};

export default MusicaTelevisionTab;
