import axios from 'axios';

const getBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
        return '/api';
    }
    return 'http://localhost:3000';
};

const api = axios.create({
    baseURL: getBaseUrl(),
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const getMediaUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    const cleanPath = path.replace(/^\/+/, '');
    const apiBase = (api.defaults.baseURL || '/api').replace(/\/+$/, '');

    if (apiBase.startsWith('/')) {
        return `${apiBase}/${cleanPath}`;
    }

    const baseWithoutApi = apiBase.replace(/\/api$/, '');
    return `${baseWithoutApi}/${cleanPath}`;
};

export default api;
