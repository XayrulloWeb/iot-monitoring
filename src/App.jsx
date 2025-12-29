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
import { Toaster } from './components/ui/Toaster'; // Импорт

const ProtectedRoute = () => {
    const isLoggedIn = useUIStore(state => state.isLoggedIn);
    return isLoggedIn ? <Layout /> : <Navigate to="/login" replace />;
};

const router = createBrowserRouter([
    {
        path: '/login',
        element: <LoginPage />,
    },
    {
        path: '/',
        element: <ProtectedRoute />,
        children: [
            { index: true, element: <DashboardPage /> },
            { path: 'map', element: <MapPage /> },
            { path: 'devices', element: <DevicesPage /> },
            { path: 'devices/:id', element: <DeviceDetailPage /> },
        ],
    },
]);

function App() {
    useEffect(() => {
        // При старте приложения запускаем поллинг данных
        const stopPolling = useSensorStore.getState().startPolling();
        return () => stopPolling();
    }, []);

    // ВАЖНО: Toaster должен быть частью возвращаемого JSX, но вне RouterProvider
    return (
        <>
            <Toaster /> {/* <-- Вот здесь он должен быть */}
            <RouterProvider router={router} />
        </>
    );
}

export default App;