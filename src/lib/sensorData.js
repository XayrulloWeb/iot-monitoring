// src/store/sensorStore.js
import { create } from 'zustand';

// Твой сервер (локальный или боевой)
// Если запускаешь локально - оставь localhost.
// Если деплоишь - поменяй на IP сервера.
const API_URL = 'http://localhost:3001/api/sensors';

let intervalId = null;
// src/lib/sensorData.js

// Обязательно слово export перед const!
export const ASSETS = [
    {
        id: 'tatu-university',
        name: 'Tatu',
        address: 'улица Ай-Хорезми 110, 220100 Ургенчский район, Узбекистан',
        coords: [60.6318, 41.5605],
        floors: ['Этаж 1', 'Этаж 2', 'Серверная', 'Аудитория 101'],
    },
    {
        id: 'agroprom-complex',
        name: 'Тепличный комплекс "Агро"',
        address: 'промзона "Восток", строение 5',
        coords: [60.6510, 41.5700],
        floors: ['Теплица А', 'Теплица Б'],
    },
    {
        id: 'warehouse-1',
        name: 'Склад №1 (Холодильники)',
        address: 'ул. Промышленная, 12',
        coords: [60.6390, 41.5450],
        floors: ['Зона заморозки', 'Приемка'],
    },
];
export const useSensorStore = create((set, get) => ({
    sensors: [], // Изначально пусто!
    isLoading: false,
    error: null,

    // Запрос к серверу
    fetchSensors: async () => {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                // Если сервер не отвечает, не ломаем приложение, просто пишем ошибку
                console.warn('Сервер недоступен');
                return;
            }

            const data = await response.json();

            // Обновляем данные. Если пришел пустой массив [], значит датчиков нет.
            set({ sensors: data, error: null });
        } catch (err) {
            console.error("Ошибка получения данных:", err);
            // Не устанавливаем error глобально, чтобы не пугать юзера красными экранами,
            // просто данные не обновятся.
        }
    },

    // Инициализация
    initializeSensors: () => {
        const { fetchSensors } = get();

        // 1. Пробуем получить данные сразу
        fetchSensors();

        // 2. Запускаем опрос каждые 2 секунды
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