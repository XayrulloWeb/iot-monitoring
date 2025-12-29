// src/store/notificationStore.js
import { create } from 'zustand';

export const useNotificationStore = create((set) => ({
    notifications: [],

    // Функция добавления уведомления
    addNotification: (type, message, title = 'System Alert') => {
        const id = Date.now();
        set((state) => ({
            notifications: [...state.notifications, { id, type, title, message }]
        }));

        // Автоудаление через 5 секунд
        setTimeout(() => {
            set((state) => ({
                notifications: state.notifications.filter((n) => n.id !== id)
            }));
        }, 5000);
    },

    // Функция ручного закрытия
    removeNotification: (id) => {
        set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id)
        }));
    }
}));