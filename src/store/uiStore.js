// src/store/uiStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api';

export const useUIStore = create(
    persist(
        (set, get) => ({
            theme: 'dark',
            isLoggedIn: false,
            user: null,
            token: null,

            // Функция входа
            login: (data) => {
                console.log("LOGIN DATA FROM SERVER:", JSON.stringify(data, null, 2));
                set({
                    isLoggedIn: true,
                    user: data.user || data.data?.user,
                    token: data.token || data.data?.token
                });
            },

            // Функция выхода
            logout: () => {
                set({
                    isLoggedIn: false,
                    user: null,
                    token: null
                });
            },

            // Проверка токена через /auth/me
            validateToken: async () => {
                const { token } = get();
                if (!token) {
                    get().logout();
                    return false;
                }

                try {
                    const response = await api.get('/auth/me');
                    const userData = response.data.data || response.data;
                    
                    set({
                        isLoggedIn: true,
                        user: userData
                    });
                    return true;
                } catch (err) {
                    console.error("Token validation failed:", err);
                    // Токен невалиден, выходим
                    get().logout();
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                    return false;
                }
            },

            // Загрузка данных текущего пользователя
            fetchCurrentUser: async () => {
                try {
                    const response = await api.get('/auth/me');
                    const userData = response.data.data || response.data;
                    set({ user: userData });
                    return userData;
                } catch (err) {
                    console.error("Failed to fetch current user:", err);
                    throw err;
                }
            },

            initializeTheme: () => {
                document.documentElement.classList.add('dark');
                document.documentElement.style.colorScheme = 'dark';
            },
        }),
        {
            name: 'ui-storage',
            // Сохраняем токен в localStorage
            partialize: (state) => ({ isLoggedIn: state.isLoggedIn, user: state.user, token: state.token }),
        }
    )
);