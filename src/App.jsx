// src/App.jsx
import { useEffect } from 'react';
import { RouterProvider, createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import MapPage from './pages/MapPage';
import DevicesPage from './pages/DevicesPage';
import LoginPage from './pages/LoginPage'; // <-- Импортируем страницу входа

import { useUIStore } from './store/uiStore';
import { useSensorStore } from './store/sensorStore';

// --- ЗАЩИТНИК РОУТОВ ---
// Если не залогинен -> кидает на /login
const ProtectedRoute = () => {
    const isLoggedIn = useUIStore(state => state.isLoggedIn);
    return isLoggedIn ? <Layout /> : <Navigate to="/login" replace />;
};

const router = createBrowserRouter([
    {
        path: '/login',
        element: <LoginPage />, // Страница входа (открыта для всех)
    },
    {
        path: '/',
        element: <ProtectedRoute />, // Защищенная оболочка
        children: [
            { index: true, element: <DashboardPage /> },
            { path: 'map', element: <MapPage /> },
            { path: 'devices', element: <DevicesPage /> },
        ],
    },
]);

function App() {
    useEffect(() => {
        useUIStore.getState().initializeTheme();

        // Запускаем сенсоры только если пользователь вошел (опционально, но логично)
        // Но пока оставим запуск всегда, чтобы данные копились
        const initializeSensors = useSensorStore.getState().initializeSensors;
        initializeSensors();

        return () => {
            useSensorStore.getState().stopSensorUpdates();
        };
    }, []);

    return <RouterProvider router={router} />;
}

export default App;