// src/store/sensorStore.js
import { create } from 'zustand';

// URL нашего локального бэкенда
const API_URL = 'http://54.193.157.109:3001/api/sensors';

let intervalId = null;

export const useSensorStore = create((set, get) => ({
    sensors: [],
    isLoading: false,
    error: null,

    // Новая функция: Запрос к серверу
    fetchSensors: async () => {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Ошибка сети');

            const data = await response.json();

            // Если сервер вернул пустой массив (данных еще нет),
            // не обновляем состояние, чтобы не ломать UI, или обновляем на пустое.
            // Тут мы просто обновляем состояние.
            set({ sensors: data, error: null });
        } catch (err) {
            console.error("Ошибка получения данных:", err);
            set({ error: err.message });
        }
    },

    // Инициализация: теперь это просто запуск таймера опроса сервера
    initializeSensors: () => {
        const { fetchSensors } = get();

        // 1. Делаем первый запрос сразу
        fetchSensors();

        // 2. Запускаем интервал (опрос каждые 2 секунды)
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(fetchSensors, 2000);
    },

    stopSensorUpdates: () => {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    },
}));