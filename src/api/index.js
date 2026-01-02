// src/api/index.js
import axios from 'axios';
import { useUIStore } from '../store/uiStore'; // Импорт стора

const api = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        // !!! ВАЖНО: Достаем токен прямо из состояния !!!
        const state = useUIStore.getState();
        const token = state.token;

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Не выкидываем, если это была попытка входа
            if (!error.config.url.includes('/login')) {
                console.error("401 Unauthorized - Logging out");
                useUIStore.getState().logout();
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;