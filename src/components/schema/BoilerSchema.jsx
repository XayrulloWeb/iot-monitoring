// src/components/schema/BoilerSchema.jsx
import { Fan, Flame, Activity, Gauge } from 'lucide-react';

export function BoilerSchema({ sensor }) {
    const isActive = sensor.status === 'active' || sensor.status === 'danger';
    const isDanger = sensor.status === 'danger';

    const feedColor = isDanger ? '#ef4444' : '#f59e0b'; // Red / Amber
    const returnColor = '#3b82f6'; // Blue

    return (
        <div className="relative w-full h-[400px] bg-[#0b1121] rounded-2xl border border-white/10 overflow-hidden shadow-inner flex items-center justify-center select-none group">

            {/* Сетка на фоне */}
            <div className="absolute inset-0 opacity-20 pointer-events-none"
                 style={{backgroundImage: 'radial-gradient(#374151 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
            </div>

            {/* Контейнер схемы */}
            <div className="relative w-[600px] h-[300px]">

                {/* SVG СЛОЙ (ТРУБЫ) */}
                <svg width="600" height="300" viewBox="0 0 600 300" className="absolute top-0 left-0 z-10 drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                    <defs>
                        <filter id="glow-feed" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {/* 1. ОБРАТКА (Снизу, Синяя) */}
                    {/* Путь: Вход слева -> Насос -> В котел */}
                    <path d="M 50 220 L 220 220 L 220 180" fill="none" stroke="#1e293b" strokeWidth="12" strokeLinecap="round" /> {/* Подложка */}
                    <path d="M 50 220 L 220 220 L 220 180" fill="none" stroke={returnColor} strokeWidth="6" strokeLinecap="round" opacity="0.8" />

                    {isActive && (
                        <path d="M 50 220 L 220 220 L 220 180" fill="none" stroke="white" strokeWidth="2" strokeDasharray="8 16" strokeLinecap="round" className="animate-flow-slow opacity-60" />
                    )}

                    {/* 2. ПОДАЧА (Сверху, Оранжевая) */}
                    {/* Путь: Из котла -> Выход направо */}
                    <path d="M 380 120 L 550 120" fill="none" stroke="#1e293b" strokeWidth="12" strokeLinecap="round" /> {/* Подложка */}
                    <path d="M 380 120 L 550 120" fill="none" stroke={feedColor} strokeWidth="6" strokeLinecap="round" filter="url(#glow-feed)" />

                    {isActive && (
                        <path d="M 380 120 L 550 120" fill="none" stroke="white" strokeWidth="2" strokeDasharray="8 16" strokeLinecap="round" className="animate-flow-fast opacity-90" />
                    )}

                    {/* Точки соединения (Фланцы) */}
                    <circle cx="220" cy="220" r="28" fill="#0f172a" stroke={returnColor} strokeWidth="2" /> {/* Корпус насоса */}
                    <circle cx="50" cy="220" r="6" fill="#1e293b" stroke="white" strokeWidth="2" />
                    <circle cx="550" cy="120" r="6" fill="#1e293b" stroke="white" strokeWidth="2" />
                </svg>

                {/* HTML СЛОЙ (КОМПОНЕНТЫ) */}

                {/* НАСОС (Внутри синего круга) */}
                <div className="absolute top-[208px] left-[208px] z-20 text-blue-400">
                    <Fan size={24} className={isActive ? "animate-spin-slow" : "opacity-50"} />
                </div>

                {/* КОТЕЛ (Главный блок по центру) */}
                <div className={`absolute top-[80px] left-[200px] w-[200px] h-[140px] bg-[#1e293b] rounded-xl border-2 z-10 flex flex-col items-center justify-center transition-colors
                                ${isDanger ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'border-slate-600 shadow-xl'}`}>

                    {/* Окошко огня */}
                    <div className="w-16 h-16 rounded-full bg-black/60 border border-white/10 flex items-center justify-center mb-2 shadow-inner">
                        <Flame size={32} className={isActive ? "text-orange-500 animate-pulse drop-shadow-[0_0_10px_orange]" : "text-slate-700"} fill={isActive ? "currentColor" : "none"} />
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono tracking-widest">BOILER UNIT</div>
                </div>

                {/* ДАТЧИК ПОДАЧИ (Над трубой) */}
                <div className="absolute top-[40px] left-[400px] z-30">
                    <div className="bg-black/80 backdrop-blur border border-orange-500/50 p-2 rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.2)] min-w-[100px] text-center transform transition-transform hover:scale-110">
                        <div className="text-[9px] text-orange-400 uppercase font-bold mb-1 tracking-wider">Feed Temp</div>
                        <div className="text-2xl font-mono font-bold text-white flex items-center justify-center gap-1">
                            {parseFloat(sensor.telemetry.t_out || 0).toFixed(1)}°
                            <Activity size={14} className="text-orange-500"/>
                        </div>
                    </div>
                    {/* Линия к трубе */}
                    <div className="w-[1px] h-[30px] bg-orange-500/50 absolute left-1/2 top-full"></div>
                    <div className="w-2 h-2 rounded-full bg-orange-500 absolute left-1/2 top-[calc(100%+28px)] -translate-x-1/2"></div>
                </div>

                {/* ДАТЧИК ОБРАТКИ (Под трубой) */}
                <div className="absolute top-[140px] left-[80px] z-30">
                    <div className="bg-black/80 backdrop-blur border border-blue-500/50 p-2 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.2)] min-w-[100px] text-center transform transition-transform hover:scale-110">
                        <div className="text-[9px] text-blue-400 uppercase font-bold mb-1 tracking-wider">Return Temp</div>
                        <div className="text-xl font-mono font-bold text-white">
                            {parseFloat(sensor.telemetry.t_in || 0).toFixed(1)}°
                        </div>
                    </div>
                    {/* Линия к трубе */}
                    <div className="w-[1px] h-[30px] bg-blue-500/50 absolute left-1/2 top-full"></div>
                    <div className="w-2 h-2 rounded-full bg-blue-500 absolute left-1/2 top-[calc(100%+28px)] -translate-x-1/2"></div>
                </div>

                {/* МАНОМЕТР (Давление) */}
                <div className="absolute top-[230px] left-[280px] z-30">
                    <div className="flex items-center gap-2 text-slate-300 bg-black/60 px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/10 transition-colors cursor-help">
                        <Gauge size={14} className="text-emerald-400" />
                        <span className="font-mono text-xs font-bold">{sensor.telemetry.pressure} Bar</span>
                    </div>
                </div>

            </div>
        </div>
    );
}