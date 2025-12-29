// src/components/layout/Layout.jsx
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export default function Layout() {
    const location = useLocation();

    return (
        <div className="w-screen h-screen flex overflow-hidden bg-[#02040a]">
            <Sidebar />

            <main className="flex-1 h-screen overflow-hidden relative ml-64">
                {/* Анимированный контейнер для контента */}
                <div
                    key={location.pathname}
                    className="w-full h-full animate-fadeIn"
                >
                    <Outlet />
                </div>
            </main>
        </div>
    );
}