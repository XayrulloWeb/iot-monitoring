// src/store/uiStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create(
    persist(
        (set, get) => ({
            theme: 'dark',
            selectedAssetId: null,

            // --- НОВОЕ: АВТОРИЗАЦИЯ ---
            isLoggedIn: false, // По умолчанию false
            user: null,

            login: (username) => set({ isLoggedIn: true, user: { name: username } }),
            logout: () => set({ isLoggedIn: false, user: null, selectedAssetId: null }),
            // ---------------------------

            toggleTheme: () => {
                const newTheme = get().theme === 'light' ? 'dark' : 'light';
                document.documentElement.classList.remove('light', 'dark');
                document.documentElement.classList.add(newTheme);
                set({ theme: newTheme });
            },
            initializeTheme: () => {
                const theme = get().theme;
                document.documentElement.classList.add(theme);
            },
            selectAsset: (assetId) => set({ selectedAssetId: assetId }),
            clearSelectedAsset: () => set({ selectedAssetId: null }),
        }),
        {
            name: 'ui-storage',
            partialize: (state) => ({ theme: state.theme, isLoggedIn: state.isLoggedIn, user: state.user }), // Сохраняем вход
        }
    )
);