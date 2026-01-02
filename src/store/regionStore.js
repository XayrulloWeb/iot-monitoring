// src/store/regionStore.js
import { create } from 'zustand';
import api from '../api';

export const useRegionStore = create((set, get) => ({
    regions: [],
    districts: [], // Все дистрикты отдельно
    isLoading: false,
    error: null,

    fetchRegions: async () => {
        set({ isLoading: true, error: null });
        try {
            // GET /regions возвращает массив вилоятов
            const response = await api.get('/regions');
            let regions = response.data.data || response.data || [];
            
            // Загружаем дистрикты отдельно и группируем их по регионам
            try {
                const districtsResponse = await api.get('/districts');
                const allDistricts = districtsResponse.data.data || districtsResponse.data || [];
                
                console.log("Loaded districts:", allDistricts);
                console.log("Regions before grouping:", regions);
                
                // Группируем дистрикты по region_id (приводим к числу для надежности)
                regions = regions.map(region => {
                    const regionDistricts = allDistricts.filter(d => Number(d.region_id) === Number(region.id));
                    console.log(`Region ${region.id} (${region.name}) has ${regionDistricts.length} districts:`, regionDistricts);
                    return {
                        ...region,
                        districts: regionDistricts
                    };
                });
                
                console.log("Regions after grouping:", regions);
                
                set({ districts: allDistricts });
            } catch (districtsErr) {
                console.warn("Failed to fetch districts, using regions with nested districts:", districtsErr);
                // Если не удалось загрузить дистрикты отдельно, используем вложенные из регионов
                // Убеждаемся, что у каждого региона есть массив districts (даже пустой)
                regions = regions.map(region => ({
                    ...region,
                    districts: region.districts || []
                }));
            }
            
            set({ regions, isLoading: false, error: null });
        } catch (err) {
            console.error("Failed to fetch regions:", err);
            const errorMessage = err.response?.data?.message || 'Failed to load regions';
            set({ isLoading: false, error: errorMessage });
            
            // Динамический импорт для избежания циклических зависимостей
            import('./notificationStore').then(({ useNotificationStore }) => {
                useNotificationStore.getState().addNotification(
                    'error',
                    errorMessage,
                    'Regions Error'
                );
            });
        }
    },

    // Создание нового региона
    createRegion: async (name) => {
        try {
            const response = await api.post('/regions', { name });
            const newRegion = response.data.data || response.data;
            
            // Обновляем список регионов
            await get().fetchRegions();
            
            // Уведомление об успехе
            const { useNotificationStore } = await import('./notificationStore');
            useNotificationStore.getState().addNotification(
                'success',
                response.data.message || 'Region created successfully',
                'Success'
            );
            
            return newRegion;
        } catch (err) {
            console.error("Failed to create region:", err);
            const errorMessage = err.response?.data?.message || 'Failed to create region';
            
            // Уведомление об ошибке
            const { useNotificationStore } = await import('./notificationStore');
            useNotificationStore.getState().addNotification(
                'error',
                errorMessage,
                'Error'
            );
            
            throw err;
        }
    },

    // Создание нового дистрикта
    createDistrict: async (name, regionId) => {
        try {
            const response = await api.post('/districts', { 
                name, 
                region_id: parseInt(regionId) 
            });
            const newDistrict = response.data.data || response.data;
            
            // Обновляем список регионов (чтобы получить обновленные дистрикты)
            await get().fetchRegions();
            
            // Уведомление об успехе
            const { useNotificationStore } = await import('./notificationStore');
            useNotificationStore.getState().addNotification(
                'success',
                response.data.message || 'District created successfully',
                'Success'
            );
            
            return newDistrict;
        } catch (err) {
            console.error("Failed to create district:", err);
            const errorMessage = err.response?.data?.message || 'Failed to create district';
            
            // Уведомление об ошибке
            const { useNotificationStore } = await import('./notificationStore');
            useNotificationStore.getState().addNotification(
                'error',
                errorMessage,
                'Error'
            );
            
            throw err;
        }
    }
}));
