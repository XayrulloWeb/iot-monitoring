import { create } from 'zustand';
import { generateMockSensors } from '../lib/sensorData';

export const useSensorStore = create((set, get) => ({
    sensors: [],
    isLoading: false,

    // Фильтры
    selectedCity: 'all',
    selectedDistrict: 'all',

    // =====================
    // INIT
    // =====================
    fetchSensors: async () => {
        set({ isLoading: true });

        const data = generateMockSensors();

        // 🔧 FIX: приводим координаты к [lng, lat]
        const fixedData = data.map(s => ({
            ...s,
            coords: [s.coords[1], s.coords[0]],
        }));

        set({ sensors: fixedData, isLoading: false });
    },

    // =====================
    // STATIC UPDATE (NO RANDOM)
    // =====================
    updateSensorsFake: () => {
        set(state => {
            const newSensors = state.sensors.map(s => {
                if (s.status === 'offline') return s;

                // фиксированное изменение (детерминированно)
                const step = 0.1;

                return {
                    ...s,
                    telemetry: {
                        ...s.telemetry,
                        t_out: +(s.telemetry.t_out + step).toFixed(1),
                        t_in: +(s.telemetry.t_in + step).toFixed(1),
                    },
                    lastUpdate: Date.now(),
                };
            });

            return { sensors: newSensors };
        });
    },

    // =====================
    // FILTERS
    // =====================
    setCityFilter: cityId =>
        set({ selectedCity: cityId, selectedDistrict: 'all' }),

    setDistrictFilter: distId =>
        set({ selectedDistrict: distId }),

    // =====================
    // POLLING
    // =====================
    startPolling: () => {
        const { fetchSensors, updateSensorsFake } = get();

        if (get().sensors.length === 0) fetchSensors();

        const interval = setInterval(updateSensorsFake, 2000);
        return () => clearInterval(interval);
    },
}));
