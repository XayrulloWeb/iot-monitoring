// src/store/sensorStore.js
import { create } from 'zustand';
import api from '../api';

export const useSensorStore = create((set, get) => ({
    sensors: [],
    isLoading: false,
    error: null,

    // Фильтры
    selectedCity: 'all',
    selectedDistrict: 'all',

    // --- ГЛАВНАЯ ФУНКЦИЯ: ЗАГРУЗКА ДАННЫХ ---
    fetchSensors: async () => {
        // Не ставим isLoading: true каждый раз, чтобы не мигало при поллинге
        if (get().sensors.length === 0) set({ isLoading: true, error: null });

        try {
            const response = await api.get('/sensors');
            const rawData = response.data.data || response.data || [];

            // АДАПТЕР: Превращаем ответ сервера в наш формат
            const adaptedSensors = rawData.map(s => {
                // Парсим location если это объект
                const location = s.location || {};
                const coords = location.coordinates || [location.longitude, location.latitude] || [69.2401, 41.2995];
                
                // Определяем статус
                let status = 'offline';
                if (s.status === 'active' || s.status === 'online') {
                    status = 'active';
                } else if (s.status === 'danger' || s.status === 'critical') {
                    status = 'danger';
                }

                return {
                    id: s.uuid || s.id,
                    name: s.name || 'Unnamed Sensor',
                    description: s.description || '',
                    serialNumber: s.serial_number || s.serialNumber || `SN-${s.id}`,

                    // География из district
                    cityId: s.district?.region_id ? String(s.district.region_id) : 'unknown',
                    cityName: s.district?.region?.name || 'Unknown Region',
                    districtId: s.district?.id ? String(s.district.id) : 'unknown',
                    districtName: s.district?.name || 'Unknown District',
                    address: location.address || s.address || 'No address',

                    // Координаты (longitude, latitude для MapLibre)
                    coords: [parseFloat(coords[0]) || 69.2401, parseFloat(coords[1]) || 41.2995],

                    // Статус и время
                    status: status,
                    lastUpdate: s.last_seen_at ? new Date(s.last_seen_at).getTime() : Date.now(),

                    // Телеметрия (из location или напрямую)
                    // Поддерживаем разные форматы API:
                    // - in_temp/out_temp (новый формат live API)
                    // - temperature_in/temperature_out (старый формат)
                    // - t_in/t_out (сокращенный формат)
                    telemetry: {
                        t_out: parseFloat(s.out_temp || s.temperature_out || s.t_out || location.out_temp || location.temperature_out || 0),
                        t_in: parseFloat(s.in_temp || s.temperature_in || s.t_in || location.in_temp || location.temperature_in || 0),
                        pressure: parseFloat(s.pressure || location.pressure || 0),
                        flow: parseFloat(s.flow || location.flow || 0)
                    },

                    // История будет загружаться отдельно
                    history: s.history || []
                };
            });

            set({ sensors: adaptedSensors, isLoading: false, error: null });

        } catch (err) {
            console.error("Failed to fetch sensors:", err);
            const errorMessage = err.response?.data?.message || 'Failed to load sensors';
            set({ isLoading: false, error: errorMessage });
            
            // Показываем уведомление только если это не первый запрос
            if (get().sensors.length > 0) {
                // Динамический импорт для избежания циклических зависимостей
                import('./notificationStore').then(({ useNotificationStore }) => {
                    useNotificationStore.getState().addNotification(
                        'error',
                        errorMessage,
                        'Connection Error'
                    );
                });
            }
        }
    },

    // Загрузка данных конкретного сенсора в реальном времени
    fetchSensorLive: async (sensorId) => {
        try {
            const response = await api.get(`/sensors/${sensorId}/live`);
            const data = response.data.data || response.data;
            
            // Обновляем сенсор в списке
            set((state) => ({
                sensors: state.sensors.map(s => {
                    if (s.id === sensorId) {
                        // API возвращает in_temp и out_temp для live данных
                        const outTemp = parseFloat(data.out_temp || data.temperature_out || data.t_out || s.telemetry.t_out);
                        const inTemp = parseFloat(data.in_temp || data.temperature_in || data.t_in || s.telemetry.t_in);
                        
                        return {
                            ...s,
                            telemetry: {
                                t_out: outTemp,
                                t_in: inTemp,
                                pressure: parseFloat(data.pressure || s.telemetry.pressure),
                                flow: parseFloat(data.flow || s.telemetry.flow)
                            },
                            lastUpdate: Date.now(),
                            // Добавляем в историю
                            history: [
                                {
                                    time: new Date().toISOString(),
                                    t_out: outTemp,
                                    t_in: inTemp
                                },
                                ...(s.history || []).slice(0, 19) // Храним последние 20 записей
                            ]
                        };
                    }
                    return s;
                })
            }));
            
            return data;
        } catch (err) {
            console.error(`Failed to fetch live data for sensor ${sensorId}:`, err);
            throw err;
        }
    },

    // Синхронизация всех сенсоров
    syncAllSensors: async () => {
        try {
            await api.post('/sensors/sync');
            // После синхронизации загружаем обновленные данные
            await get().fetchSensors();
            const { useNotificationStore } = await import('./notificationStore');
            useNotificationStore.getState().addNotification(
                'success',
                'All sensors synchronized successfully',
                'Sync Complete'
            );
        } catch (err) {
            console.error("Failed to sync sensors:", err);
            const { useNotificationStore } = await import('./notificationStore');
            useNotificationStore.getState().addNotification(
                'error',
                err.response?.data?.message || 'Failed to sync sensors',
                'Sync Error'
            );
        }
    },

    // Синхронизация одного сенсора
    syncSensor: async (sensorId) => {
        try {
            await api.post(`/sensors/${sensorId}/sync`);
            // После синхронизации загружаем live данные
            await get().fetchSensorLive(sensorId);
            const { useNotificationStore } = await import('./notificationStore');
            useNotificationStore.getState().addNotification(
                'success',
                'Sensor synchronized successfully',
                'Sync Complete'
            );
        } catch (err) {
            console.error(`Failed to sync sensor ${sensorId}:`, err);
            const { useNotificationStore } = await import('./notificationStore');
            useNotificationStore.getState().addNotification(
                'error',
                err.response?.data?.message || 'Failed to sync sensor',
                'Sync Error'
            );
        }
    },

    // Методы фильтрации (оставляем)
    setCityFilter: (cityId) => set({ selectedCity: cityId, selectedDistrict: 'all' }),
    setDistrictFilter: (distId) => set({ selectedDistrict: distId }),

    // Поллинг (автообновление)
    // Интервал можно настроить: 600000 = 10 минут, 5000 = 5 секунд
    startPolling: (intervalMs = 600000) => { // По умолчанию 10 минут
        const { fetchSensors } = get();
        fetchSensors(); // Первый вызов сразу
        
        const interval = setInterval(() => {
            fetchSensors();
            
            // Также обновляем live данные для активных сенсоров (только если интервал <= 30 сек)
            if (intervalMs <= 30000) {
                const currentSensors = get().sensors; // Получаем актуальное состояние
                const activeSensors = currentSensors.filter(s => s.status === 'active');
                activeSensors.forEach(sensor => {
                    get().fetchSensorLive(sensor.id).catch(() => {
                        // Игнорируем ошибки для отдельных сенсоров
                    });
                });
            }
        }, intervalMs);
        
        return () => clearInterval(interval);
    }
}));