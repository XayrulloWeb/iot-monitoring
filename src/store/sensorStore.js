// src/store/sensorStore.js
import { create } from 'zustand';
import api from '../api';
import { io } from 'socket.io-client';
import { getUserFriendlyErrorMessage } from '../utils/errorMessages';
import { useUIStore } from './uiStore';

export const useSensorStore = create((set, get) => ({
    sensors: [],
    isLoading: false,
    error: null,

    // Фильтры для карты
    selectedCity: 'all',
    selectedDistrict: 'all',

    // Состояние для истории
    isHistoryLoading: false,

    // WebSocket state
    socket: null,
    isSocketConnected: false,
    historyMeta: {
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 50
    },

    // --- 1. СПИСОК СЕНСОРОВ (LOAD ALL) ---
    fetchSensors: async () => {
        if (get().sensors.length === 0) set({ isLoading: true, error: null });

        try {
            // ВАЖНО: limit=1000, чтобы получить ВСЕ сенсоры одной пачкой
            const response = await api.get('/sensors', {
                params: { page: 1, limit: 1000 }
            });

            const rawData = response.data.data || [];

            const adaptedSensors = rawData.map(s => {
                // Безопасное чтение вложенных объектов
                const district = s.district || {};
                const region = district.region || {};
                const loc = s.location || {};

                return {
                    id: s.uuid, // UUID - главный ключ
                    dbId: s.id, // Числовой ID про запас
                    name: s.name || 'Unnamed Unit',
                    serialNumber: s.serial_number || 'N/A',

                    // --- МАППИНГ РЕГИОНОВ ---
                    cityId: region.id ? String(region.id) : 'unknown',
                    cityName: region.name || 'Unknown Region',

                    districtId: district.id ? String(district.id) : 'unknown',
                    districtName: district.name || 'Unknown District',
                    // ------------------------

                    address: s.description || 'No description',

                    coords: [
                        parseFloat(loc.long || loc.longitude || 69.2401),
                        parseFloat(loc.lat || loc.latitude || 41.2995)
                    ],

                    status: mapApiStatusToUi(s.status),
                    lastUpdate: s.last_seen_at ? new Date(s.last_seen_at).getTime() : Date.now(),

                    telemetry: {
                        t_out: parseFloat(s.out_temp || s.temperature_out || 0),
                        t_in: parseFloat(s.in_temp || s.temperature_in || 0),
                        pressure: parseFloat(s.pressure || 0),
                        flow: parseFloat(s.flow || 0)
                    },
                    history: []
                };
            });

            set({ sensors: adaptedSensors, isLoading: false, error: null });

            // Подписываемся на обновления
            get().subscribeToAllSensors();

            // Запускаем подтягивание последних данных, если в списке пришли нули
            get().hydrateFromHistory();

        } catch (err) {
            console.error("Fetch sensors failed:", err);
            set({ isLoading: false, error: getUserFriendlyErrorMessage(err) });
        }
    },

    // Эта функция ищет сенсоры с "нулевой" температурой и делает запрос к истории,
    // чтобы показать хоть какие-то последние данные вместо 0.0
    hydrateFromHistory: async () => {
        const { sensors } = get();
        // Ищем сенсоры, у которых t_out == 0 (значит API списка не вернуло телеметрию)
        const emptySensors = sensors.filter(s => s.telemetry.t_out === 0);

        if (emptySensors.length === 0) return;

        // Чтобы не спамить, берем только первые 10 (или можно убрать slice, если нужно для всех)
        const sensorsToUpdate = emptySensors.slice(0, 10);

        sensorsToUpdate.forEach(async (sensor) => {
            try {
                // Берем только 1 последнюю запись
                const res = await api.get(`/sensors/${sensor.id}/history`, {
                    params: { page: 1, limit: 1 }
                });

                const historyData = res.data.data;
                if (historyData && historyData.length > 0) {
                    const lastRecord = historyData[0];

                    set(state => ({
                        sensors: state.sensors.map(s => {
                            if (s.id === sensor.id) {
                                return {
                                    ...s,
                                    telemetry: {
                                        ...s.telemetry,
                                        t_out: parseFloat(lastRecord.out_temp || lastRecord.temperature_out || s.telemetry.t_out),
                                        t_in: parseFloat(lastRecord.in_temp || lastRecord.temperature_in || s.telemetry.t_in),
                                        pressure: parseFloat(lastRecord.pressure || s.telemetry.pressure)
                                    }
                                };
                            }
                            return s;
                        })
                    }));
                }
            } catch (err) {
                // Тихо игнорируем, если истории нет
            }
        });
    },

    // --- 2. ИСТОРИЯ ---
    fetchSensorHistory: async (uuid, page = 1, limit = 50) => {
        set({ isHistoryLoading: true });
        try {
            const response = await api.get(`/sensors/${uuid}/history`, {
                params: { page, limit }
            });

            const responseData = response.data;
            const historyList = responseData.data || [];
            const meta = responseData.meta || {};

            const formattedHistory = historyList.map((item, index) => {
                let itemTime = item.created_at || item.timestamp || item.date || item.time;
                if (!itemTime) {
                    const timeOffset = index * 5 * 60 * 1000;
                    itemTime = new Date(Date.now() - timeOffset).toISOString();
                }

                return {
                    time: itemTime,
                    t_out: parseFloat(item.out_temp || item.temperature_out || 0),
                    t_in: parseFloat(item.in_temp || item.temperature_in || 0),
                    pressure: parseFloat(item.pressure || 0)
                };
            });

            // Если открыли первую страницу истории, обновляем текущий статус сенсора
            let latestTelemetry = null;
            if (page === 1 && formattedHistory.length > 0) {
                latestTelemetry = formattedHistory[0];
            }

            set(state => ({
                sensors: state.sensors.map(s => {
                    if (s.id === uuid) {
                        const updatedTelemetry = latestTelemetry ? {
                            ...s.telemetry,
                            t_out: latestTelemetry.t_out,
                            t_in: latestTelemetry.t_in,
                            pressure: latestTelemetry.pressure
                        } : s.telemetry;

                        return {
                            ...s,
                            history: formattedHistory,
                            telemetry: updatedTelemetry
                        };
                    }
                    return s;
                }),
                historyMeta: {
                    current_page: meta.page || page,
                    last_page: meta.pages || 1,
                    total: meta.total || 0,
                    per_page: meta.limit || limit
                },
                isHistoryLoading: false
            }));

        } catch (err) {
            console.error(`Fetch history failed for ${uuid}:`, err);
            set({ isHistoryLoading: false });
        }
    },

    // --- 3. LIVE DATA ---
    fetchSensorLive: async (uuid) => {
        try {
            const response = await api.get(`/sensors/${uuid}/live`);
            const data = response.data.data; // Объект данных

            set((state) => ({
                sensors: state.sensors.map(s => {
                    if (s.id === uuid) {
                        return {
                            ...s,
                            status: 'active',
                            lastUpdate: Date.now(),
                            telemetry: {
                                ...s.telemetry,
                                t_out: data.out_temp !== undefined ? parseFloat(data.out_temp) : s.telemetry.t_out,
                                t_in: data.in_temp !== undefined ? parseFloat(data.in_temp) : s.telemetry.t_in,
                                pressure: data.pressure !== undefined ? parseFloat(data.pressure) : s.telemetry.pressure,
                            }
                        };
                    }
                    return s;
                })
            }));
            return data;
        } catch (err) {
            if (err.response?.status !== 504) {
                console.warn(`Live data fetch failed for ${uuid}:`, err.response?.status || err.message);
            }
            return null;
        }
    },

    syncAllSensors: async () => {
        try {
            await api.post('/sensors/sync');
            setTimeout(() => { get().fetchSensors(); }, 2000);
        } catch (err) { console.error(err); }
    },

    syncSensor: async (uuid) => {
        try {
            await api.post(`/sensors/${uuid}/sync`);
            setTimeout(() => { get().fetchSensorLive(uuid); }, 1500);
        } catch (err) { console.error(err); }
    },

    setCityFilter: (cityId) => set({ selectedCity: cityId, selectedDistrict: 'all' }),
    setDistrictFilter: (distId) => set({ selectedDistrict: distId }),

    startPolling: (intervalMs = 60000) => {
        let isPolling = false;
        const { fetchSensors } = get();
        const poll = async () => {
            if (isPolling) return;
            isPolling = true;
            try { await fetchSensors(); } catch (err) { console.error(err); } finally { isPolling = false; }
        };
        poll();
        const interval = setInterval(poll, intervalMs);
        return () => { clearInterval(interval); isPolling = false; };
    },

    disconnectSocket: () => {
        const { socket } = get();
        if (socket) {
            socket.disconnect();
            set({ socket: null, isSocketConnected: false });
        }
    },

    subscribeToAllSensors: () => {
        const { socket, isSocketConnected, sensors } = get();
        if (!socket || !isSocketConnected) return;
        sensors.forEach(sensor => {
            socket.emit('join_sensor', sensor.id);
        });
    },

    handleSensorUpdate: (data) => {
        const sensorId = data.uuid || data.id || data.sensor_id;
        if (!sensorId) return;

        set(state => ({
            sensors: state.sensors.map(s => {
                if (s.id === sensorId) {
                    return {
                        ...s,
                        lastUpdate: Date.now(),
                        telemetry: {
                            ...s.telemetry,
                            t_out: data.out_temp !== undefined ? parseFloat(data.out_temp) : s.telemetry.t_out,
                            t_in: data.in_temp !== undefined ? parseFloat(data.in_temp) : s.telemetry.t_in,
                            pressure: data.pressure !== undefined ? parseFloat(data.pressure) : s.telemetry.pressure,
                        }
                    };
                }
                return s;
            })
        }));
    },

    connectSocket: () => {
        const { socket, isSocketConnected } = get();
        if (socket && isSocketConnected) return;

        let socketUrl = import.meta.env.VITE_SOCKET_URL;
        if (!socketUrl) {
            const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
            try { socketUrl = new URL(apiUrl).origin; } catch (e) { socketUrl = apiUrl; }
        }

        const token = useUIStore.getState().token;
        if (!token) return;

        const newSocket = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            path: '/socket.io'
        });

        newSocket.on('connect', () => {
            set({ isSocketConnected: true });
            get().fetchSensors();
        });

        newSocket.on('disconnect', () => set({ isSocketConnected: false }));
        newSocket.on('connect_error', () => set({ isSocketConnected: false }));

        newSocket.on('sensor_update', (data) => {
            get().handleSensorUpdate(data);
        });

        set({ socket: newSocket });
    }
}));

function mapApiStatusToUi(apiStatus) {
    if (!apiStatus) return 'offline';
    const s = String(apiStatus).toLowerCase();
    if (s === 'active' || s === 'online' || s === 'ok') return 'active';
    if (s === 'danger' || s === 'critical' || s === 'error') return 'danger';
    return 'offline';
}