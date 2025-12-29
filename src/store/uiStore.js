// src/store/uiStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create(
    persist(
        (set, get) => ({
            theme: 'dark', // ВСЕГДА DARK
            isLoggedIn: false,
            user: null,

            login: (username) => set({ isLoggedIn: true, user: { name: username } }),
            logout: () => set({ isLoggedIn: false, user: null }),

            // Убираем переключение, оставляем пустышку, чтобы не ломать компоненты
            toggleTheme: () => {
                console.log("Theme is locked to Cyberpunk Dark");
            },
            initializeTheme: () => {
                document.documentElement.classList.add('dark');
                document.documentElement.style.colorScheme = 'dark';
            },
        }),
        {
            name: 'ui-storage',
            partialize: (state) => ({ isLoggedIn: state.isLoggedIn, user: state.user }), // Не сохраняем тему, она всегда dark
        }
    )
);