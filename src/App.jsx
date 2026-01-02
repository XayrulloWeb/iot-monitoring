// src/App.jsx
import { useEffect } from 'react';
import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import MapPage from './pages/MapPage';
import DevicesPage from './pages/DevicesPage';
import LoginPage from './pages/LoginPage';
import DeviceDetailPage from './pages/DeviceDetailPage';
import { useUIStore } from './store/uiStore';
import { useSensorStore } from './store/sensorStore';
import { useRegionStore } from './store/regionStore';
import { Toaster } from './components/ui/Toaster';

// Защищенный маршрут: если нет входа — на логин
const ProtectedRoute = () => {
    const isLoggedIn = useUIStore(state => state.isLoggedIn);
    return isLoggedIn ? <Layout /> : <Navigate to="/login" replace />;
};

// Конфигурация роутера
const router = createBrowserRouter([
    {
        path: '/login',
        element: <LoginPage />,
    },
    {
        path: '/',
        element: <ProtectedRoute />, // Внутри Layout будут вложенные роуты
        children: [
            { index: true, element: <DashboardPage /> },
            { path: 'map', element: <MapPage /> },
            { path: 'devices', element: <DevicesPage /> },
            { path: 'devices/:id', element: <DeviceDetailPage /> },
        ],
    },
]);

function App() {
    // Получаем состояние авторизации из стора
    const isLoggedIn = useUIStore(state => state.isLoggedIn);
    const token = useUIStore(state => state.token);

    useEffect(() => {
        // Инициализация темы (темная/светлая)
        useUIStore.getState().initializeTheme();

        // Проверяем токен при загрузке приложения
        const initAuth = async () => {
            const currentToken = useUIStore.getState().token;
            if (currentToken) {
                const isValid = await useUIStore.getState().validateToken();
                if (!isValid) {
                    return; // Токен невалиден, выходим
                }
            }
        };

        initAuth();
    }, [token]); // Зависимость от token для перепроверки при изменении

    useEffect(() => {
        // Если пользователь залогинен — начинаем грузить данные
        if (isLoggedIn) {
            console.log("User is logged in. Starting data polling...");

            // 1. Загружаем регионы (один раз)
            useRegionStore.getState().fetchRegions();

            // 2. Запускаем опрос датчиков (каждые N секунд)
            const stopPolling = useSensorStore.getState().startPolling();

            // При размонтировании (или выходе) останавливаем опрос
            return () => stopPolling();
        }
    }, [isLoggedIn]); // Перезапускаем эффект, если статус входа изменился

    return (
        <>
            <Toaster /> {/* Глобальные уведомления */}
            <RouterProvider router={router} />
        </>
    );
}

export default App;