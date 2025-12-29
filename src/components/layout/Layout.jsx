// src/components/layout/Layout.jsx
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AssetPanel } from './AssetPanel';
import { useUIStore } from '../../store/uiStore';

export default function Layout() {
    // Получаем ID выбранного объекта
    const selectedAssetId = useUIStore((state) => state.selectedAssetId);

    return (
        <div className="w-screen h-screen flex overflow-hidden bg-[--bg-app]">
            {/* Сайдбар (z-50) */}
            <Sidebar />

            {/*
               Основной контент.
               ml-64 -> отступ слева под Sidebar (256px)
               mr-0 / mr-96 -> отступ справа под AssetPanel (когда открыта)
            */}
            <main
                className={`flex-1 h-screen overflow-y-auto 
                           transition-all duration-300 ease-in-out
                           ml-64 
                           ${selectedAssetId ? 'mr-96' : 'mr-0'}`}
            >
                <Outlet />
            </main>

            {/* Правая панель (z-50 внутри компонента AssetPanel лучше тоже проверить) */}
            <AssetPanel />
        </div>
    );
}