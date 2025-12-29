// src/components/layout/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, Server, LogOut, Flame } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

const navItems = [
    { href: '/', icon: LayoutDashboard, label: 'COMMAND CENTER' },
    { href: '/devices', icon: Server, label: 'SYSTEM UNITS' },
    { href: '/map', icon: Map, label: 'GEO SPATIAL' },
];

export function Sidebar() {
    const logout = useUIStore(state => state.logout);

    return (
        // ИЗМЕНЕНИЕ: bg-[#02040a] вместо bg-[var(--bg-app)]/90 - жесткий черный цвет
        <aside className="w-64 h-screen fixed left-0 top-0 z-50 flex flex-col border-r border-white/5 bg-[#02040a] text-slate-300">
            {/* Логотип */}
            <div className="h-20 flex items-center px-6 border-b border-white/5 relative overflow-hidden">
                {/* Декор на фоне лого */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 blur-2xl rounded-full pointer-events-none"></div>

                <div className="flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                        <Flame className="text-white" size={24} fill="currentColor" />
                    </div>
                    <div>
                        <h1 className="font-mono font-bold text-xl tracking-wider text-white">HEAT<span className="text-orange-500">OS</span></h1>
                        <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase">Control System</p>
                    </div>
                </div>
            </div>

            {/* Навигация */}
            <nav className="flex-1 py-6 px-3 space-y-2">
                {navItems.map(item => (
                    <NavLink
                        key={item.href}
                        to={item.href}
                        className={({ isActive }) =>
                            `flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 group relative
                         ${isActive
                                ? 'bg-blue-500/10 text-cyan-400 border border-blue-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'}`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon size={20} className={`transition-colors ${isActive ? 'text-cyan-400' : 'group-hover:text-white'}`} />
                                <span className="font-mono text-sm font-bold tracking-wide">{item.label}</span>
                                {isActive && <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_currentColor]"></div>}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Футер */}
            <div className="p-4 border-t border-white/5 bg-black/20">
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-red-900/30 text-red-500 hover:bg-red-500/10 hover:border-red-500/50 transition-all group"
                >
                    <LogOut size={18} className="group-hover:-translate-x-1 transition-transform"/>
                    <span className="font-mono text-xs font-bold uppercase">Terminate</span>
                </button>
            </div>
        </aside>
    );
}