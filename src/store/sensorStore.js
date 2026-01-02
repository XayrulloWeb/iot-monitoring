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

    // --- 1. СПИСОК СЕНСОРОВ ---
    fetchSensors: async () => {
        if (get().sensors.length === 0) set({ isLoading: true, error: null });

        try {
            const response = await api.get('/sensors');
            const rawData = response.data.data || [];

            const adaptedSensors = rawData.map(s => {
                const loc = s.location || {};
                let longitude = 69.2401;
                let latitude = 41.2995;
                if (Array.isArray(loc.coordinates) && loc.coordinates.length === 2) {
                    longitude = parseFloat(loc.coordinates[0]);
                    latitude = parseFloat(loc.coordinates[1]);
                } else if (loc.longitude && loc.latitude) {
                    longitude = parseFloat(loc.longitude);
                    latitude = parseFloat(loc.latitude);
                }

                return {
                    id: s.uuid || s.id,
                    name: s.name || 'Unnamed Unit',
                    serialNumber: s.serial_number || s.serialNumber || 'N/A',
                    cityId: s.district?.region_id ? String(s.district.region_id) : 'unknown',
                    cityName: s.district?.region?.name || 'Unknown Region',
                    districtId: s.district?.id ? String(s.district.id) : 'unknown',
                    districtName: s.district?.name || 'Unknown District',
                    address: loc.address || s.address || 'No address',
                    coords: [longitude, latitude],
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

            // Подписываемся на обновления для всех полученных сенсоров
            get().subscribeToAllSensors();
        } catch (err) {
            console.error("Fetch sensors failed:", err);
            set({ isLoading: false, error: getUserFriendlyErrorMessage(err) });
        }
    },

    // --- 2. ИСТОРИЯ (С ОБНОВЛЕНИЕМ ТЕЛЕМЕТРИИ) ---
    fetchSensorHistory: async (uuid, page = 1, limit = 50) => {
        set({ isHistoryLoading: true });
        try {
            const response = await api.get(`/sensors/${uuid}/history`, {
                params: { page, limit }
            });

            const responseData = response.data;
            const historyList = responseData.data || [];
            const meta = responseData.meta || {};

            // API возвращает данные в формате: { in_temp: "23.80", out_temp: "21.30", pressure: "759.20" }
            // Температуры и давление приходят как строки, нужно парсить
            // Timestamp не приходит, генерируем на основе индекса (самые свежие первыми)
            const formattedHistory = historyList.map((item, index) => {
                // Пытаемся найти реальный timestamp в данных
                let itemTime = item.created_at || item.timestamp || item.date || item.time;

                // Если времени нет, генерируем fallback на основе индекса
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

            // !!! ВАЖНОЕ ИЗМЕНЕНИЕ !!!
            // Если мы на первой странице, берем самую свежую запись из истории
            // и обновляем ею текущие показатели (telemetry).
            // Это спасет ситуацию, если Live (504) не работает.
            let latestTelemetry = null;
            if (page === 1 && formattedHistory.length > 0) {
                latestTelemetry = formattedHistory[0];
            }

            set(state => ({
                sensors: state.sensors.map(s => {
                    if (s.id === uuid) {
                        // Если есть свежие данные из истории, обновляем telemetry
                        const updatedTelemetry = latestTelemetry ? {
                            ...s.telemetry,
                            t_out: latestTelemetry.t_out,
                            t_in: latestTelemetry.t_in,
                            pressure: latestTelemetry.pressure
                        } : s.telemetry;

                        return {
                            ...s,
                            history: formattedHistory,
                            telemetry: updatedTelemetry // <-- Обновляем показатели
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
            const data = response.data.data;

            set((state) => ({
                sensors: state.sensors.map(s => {
                    if (s.id === uuid) {
                        return {
                            ...s,
                            status: 'active',
                            lastUpdate: Date.now(),
                            telemetry: {
                                ...s.telemetry,
                                t_out: parseFloat(data.out_temp || s.telemetry.t_out),
                                t_in: parseFloat(data.in_temp || s.telemetry.t_in),
                                pressure: parseFloat(data.pressure || s.telemetry.pressure),
                            }
                        };
                    }
                    return s;
                })
            }));
            return data;
        } catch (err) {
            // 504 Gateway Timeout - это нормально, сенсор может не отвечать в течение 5 секунд
            // Не логируем в консоль, чтобы не засорять её
            if (err.response?.status !== 504) {
                // Логируем только другие ошибки
                console.warn(`Live data fetch failed for ${uuid}:`, err.response?.status || err.message);
            }
            return null;
        }
    },

    // --- 4. СИНХРОНИЗАЦИЯ ---
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
            // Если предыдущий запрос еще не завершен, пропускаем
            if (isPolling) {
                console.warn('Previous poll is still running, skipping...');
                return;
            }

            isPolling = true;
            try {
                await fetchSensors();
            } catch (err) {
                console.error('Polling error:', err);
            } finally {
                isPolling = false;
            }
        };

        // Первый запрос сразу
        poll();

        // Повторяющиеся запросы каждые intervalMs
        const interval = setInterval(poll, intervalMs);

        // Возвращаем функцию очистки
        return () => {
            clearInterval(interval);
            isPolling = false;
        };
    },

    disconnectSocket: () => {
        const { socket } = get();
        if (socket) {
            socket.disconnect();
            set({ socket: null, isSocketConnected: false });
        }
    },

    // --- 5. Websocket Logic ---
    subscribeToAllSensors: () => {
        const { socket, isSocketConnected, sensors } = get();
        if (!socket || !isSocketConnected) return;

        console.log(`📡 Subscribing to ${sensors.length} sensors...`);
        sensors.forEach(sensor => {
            // Подписываемся на обновления конкретного сенсора
            socket.emit('join_sensor', sensor.id);
        });
    },

    handleSensorUpdate: (data) => {
        // data пример: { in_temp: 22, out_temp: 15, pressure: 760 }
        // Проблема: в примере пользователя в data нет ID сенсора. 
        // Если сервер не присылает ID, мы не знаем кого обновлять.
        // Пытаемся найти ID в data (uuid, id, sensor_id)
        const sensorId = data.uuid || data.id || data.sensor_id;

        if (!sensorId) {
            console.warn('Received sensor_update without ID:', data);
            return;
        }

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
            try {
                const url = new URL(apiUrl);
                socketUrl = url.origin;
            } catch (e) {
                socketUrl = apiUrl;
            }
        }

        console.log('Connecting to Socket.IO at:', socketUrl);

        // Используем токен из uiStore, так как он там актуален и в localStorage может лежать в JSON
        const token = useUIStore.getState().token;
        if (!token) {
            console.warn('Socket connection skipped: no token');
            return;
        }

        const newSocket = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            path: '/socket.io'
        });

        newSocket.on('connect', () => {
            console.log('✅ Socket connected:', newSocket.id);
            set({ isSocketConnected: true });
            get().fetchSensors(); // Это запустит fetch, который запустит subscribeToAllSensors
        });

        newSocket.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason);
            set({ isSocketConnected: false });
        });

        newSocket.on('connect_error', (err) => {
            set({ isSocketConnected: false });
        });

        // Слушаем событие обновления (как в примере пользователя)
        newSocket.on('sensor_update', (data) => {
            // console.log('📩 Real-time update:', data);
            get().handleSensorUpdate(data);
        });

        // Debug
        newSocket.onAny((eventName, ...args) => {
            if (import.meta.env.DEV && eventName !== 'sensor_update') {
                console.log(`📩 Socket Event [${eventName}]:`, args);
            }
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