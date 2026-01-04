// src/store/provisionStore.js
import { create } from 'zustand';
import { useSensorStore } from './sensorStore';
import api from '../api';

export const useProvisionStore = create((set, get) => ({
    // Состояния: 'idle', 'requesting', 'pairing', 'flashing', 'success', 'saving'
    step: 'idle',
    pairingCode: null,
    expiresIn: 0,
    newSensorData: null, // { uuid, ... }
    error: null,

    // Сброс состояния
    reset: () => set({ step: 'idle', pairingCode: null, expiresIn: 0, newSensorData: null, error: null }),

    // 1. Начало процесса
    startProvisioning: () => {
        const socket = useSensorStore.getState().socket;
        if (!socket) {
            set({ error: "No connection to HQ (Socket Disconnected)" });
            return;
        }
        set({ step: 'requesting', error: null });
        get().attachListeners(socket);
        socket.emit('start_provisioning');
    },

    // 2. Отмена / Закрытие
    stopProvisioning: () => {
        const socket = useSensorStore.getState().socket;
        if (socket) {
            socket.emit('stop_provisioning');
            get().detachListeners(socket);
        }
        get().reset();
    },

    // 3. Сохранение (FIXED FOR API)
    saveSensorDetails: async (name, location) => {
        const { newSensorData } = get();
        if (!newSensorData?.uuid) return;

        set({ step: 'saving' });
        try {
            // API требует обязательные поля.
            // При быстрой регистрации мы ставим заглушки.
            await api.put(`/sensors/${newSensorData.uuid}`, {
                name: name,
                description: location, // Используем description для адреса
                status: 'active',

                // Обязательные поля (заглушки)
                district_id: 0, // Не выбран район
                latitude: 0,
                longitude: 0
            });

            // Обновляем список, чтобы новый сенсор появился
            await useSensorStore.getState().fetchSensors();

            get().stopProvisioning();
            return true;
        } catch (err) {
            console.error("Save failed:", err);
            set({ step: 'success', error: err.response?.data?.message || "Failed to save details" });
            return false;
        }
    },

    // --- SOCKET LISTENERS ---

    attachListeners: (socket) => {
        get().detachListeners(socket);

        socket.on('pairing_code', (data) => {
            set({ step: 'pairing', pairingCode: data.code, expiresIn: data.expiresIn || 120 });
        });

        socket.on('agent_connected', (data) => {
            set({ step: 'flashing' });
        });

        socket.on('provision_success', (data) => {
            set({ step: 'success', newSensorData: data });
        });
    },

    detachListeners: (socket) => {
        if (!socket) return;
        socket.off('pairing_code');
        socket.off('agent_connected');
        socket.off('provision_success');
    }
}));