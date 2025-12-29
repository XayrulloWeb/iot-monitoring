// src/components/layout/Sidebar.jsx

import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, List, LogOut } from 'lucide-react'; // <-- Добавил LogOut
import { ThemeToggle } from '../ui/ThemeToggle';
import { useUIStore } from '../../store/uiStore'; // <-- Добавил импорт стора

const navItems = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/map', icon: Map, label: 'Geo View' },
    { href: '/devices', icon: List, label: 'Devices' },
];

export function Sidebar() {
    // --- ПОЛУЧАЕМ ФУНКЦИЮ LOGOUT ИЗ СТОРА ---
    const logout = useUIStore(state => state.logout);

    return (
        <aside className="w-64 h-screen glass-panel flex flex-col p-4 fixed left-0 top-0 z-50">
            <div className="text-2xl font-bold p-4 mb-8 flex items-center gap-2 font-mono text-[--text-main]">
                <span className="text-brand-blue">V-</span>GOLD
            </div>

            <nav className="flex flex-col gap-2 flex-1">
                {navItems.map(item => (
                    <NavLink key={item.href} to={item.href} className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-[--text-muted] hover:bg-[--surface-hover] hover:text-[--text-main] ${isActive ? '!bg-brand-blue !text-white' : ''}`
                    }>
                        <item.icon size={20} />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="mt-auto pt-4 border-t border-[--border] space-y-2">
                <ThemeToggle />

                {/* Кнопка ВЫХОД */}
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-3 p-3 rounded-lg text-brand-red hover:bg-brand-red/10 transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Выйти</span>
                </button>
            </div>
        </aside>
    );
}