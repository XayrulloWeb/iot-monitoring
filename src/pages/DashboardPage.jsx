// src/pages/DashboardPage.jsx

import { useMemo } from 'react';
import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    Activity, Thermometer, Droplets, AlertTriangle,
    Server, Zap, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { format } from 'date-fns';
import { useSensorStore } from '../store/sensorStore';

// Компонент для маленькой карточки со статистикой
function StatCard({ title, value, unit, icon: Icon, trend, color }) {
    return (
        <div className="glass-panel p-6 rounded-xl relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
                <Icon size={64} />
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 text-[--text-muted]">
                    <Icon size={18} />
                    <span className="text-sm font-medium">{title}</span>
                </div>
                <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold font-mono">{value}</span>
                    <span className="text-sm font-medium mb-1 text-[--text-muted]">{unit}</span>
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend > 0 ? 'text-brand-red' : 'text-brand-green'}`}>
                        {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        <span>{Math.abs(trend)}% к прошлому часу</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// Кастомный тултип для графика
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass-panel p-3 border border-[--border] text-xs">
                <p className="font-mono mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2" style={{ color: entry.color }}>
                        <span className="font-bold">{entry.value}</span>
                        <span>{entry.name}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function DashboardPage() {
    const sensors = useSensorStore(state => state.sensors);

    // --- РАСЧЕТ СТАТИСТИКИ (MEMO) ---
    const stats = useMemo(() => {
        if (!sensors.length) return { avgTemp: 0, avgHum: 0, activeAlerts: 0 };

        const totalTemp = sensors.reduce((acc, s) => acc + s.data.temp, 0);
        const totalHum = sensors.reduce((acc, s) => acc + s.data.hum, 0);

        // Считаем "тревоги" (например, если темп > 24 градусов)
        const alerts = sensors.filter(s => s.data.temp > 24).length;

        return {
            avgTemp: (totalTemp / sensors.length).toFixed(1),
            avgHum: (totalHum / sensors.length).toFixed(1),
            activeAlerts: alerts,
        };
    }, [sensors]);

    // --- ПОДГОТОВКА ДАННЫХ ДЛЯ ГРАФИКА ---
    // Берем историю первого датчика для примера визуализации тренда
    // В реальности тут можно усреднять данные всех датчиков
    const chartData = sensors[0]?.history.map(h => ({
        time: format(h.timestamp, 'HH:mm:ss'),
        temp: h.value,
        hum: Math.round(h.value * 2 + 10), // Фейковая влажность для красоты графика
    })) || [];

    // --- ТОП САМЫХ ЖАРКИХ ДАТЧИКОВ ---
    const hotSensors = [...sensors].sort((a, b) => b.data.temp - a.data.temp).slice(0, 3);

    return (
        <div className="p-6 h-full overflow-y-auto space-y-6">

            {/* Заголовок */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold">Ситуационный центр</h1>
                    <p className="text-[--text-muted]">Обзор показателей в реальном времени</p>
                </div>
                <div className="text-right">
                    <div className="text-xs text-[--text-muted]">Статус системы</div>
                    <div className="flex items-center gap-2 text-brand-green font-bold">
                        <Activity size={16} />
                        <span>НОРМА</span>
                    </div>
                </div>
            </div>

            {/* Карточки KPI */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Всего устройств"
                    value={sensors.length}
                    unit="шт."
                    icon={Server}
                    color="text-brand-blue"
                />
                <StatCard
                    title="Средняя Темп."
                    value={stats.avgTemp}
                    unit="°C"
                    icon={Thermometer}
                    trend={1.2}
                    color="text-brand-red"
                />
                <StatCard
                    title="Средняя Влажн."
                    value={stats.avgHum}
                    unit="%"
                    icon={Droplets}
                    trend={-0.5}
                    color="text-brand-green"
                />
                <StatCard
                    title="Активные тревоги"
                    value={stats.activeAlerts}
                    unit="событий"
                    icon={AlertTriangle}
                    color={stats.activeAlerts > 0 ? "text-brand-red" : "text-[--text-muted]"}
                />
            </div>

            {/* Графики и списки */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">

                {/* Большой график */}
                <div className="lg:col-span-2 glass-panel p-6 rounded-xl flex flex-col">
                    <h3 className="font-bold mb-6 flex items-center gap-2">
                        <Activity size={18} className="text-brand-blue"/>
                        Динамика показателей (Live)
                    </h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00aaff" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#00aaff" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00ff87" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#00ff87" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="temp" name="Температура" stroke="#00aaff" fillOpacity={1} fill="url(#colorTemp)" strokeWidth={2} />
                                <Area type="monotone" dataKey="hum" name="Влажность" stroke="#00ff87" fillOpacity={1} fill="url(#colorHum)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Список горячих зон */}
                <div className="glass-panel p-6 rounded-xl flex flex-col">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <Zap size={18} className="text-brand-yellow"/>
                        Горячие зоны (Топ-3)
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-3">
                        {hotSensors.map(s => (
                            <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-[--surface-hover]">
                                <div>
                                    <div className="font-bold text-sm">{s.locationName}</div>
                                    <div className="text-xs text-[--text-muted] font-mono">{s.id}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-brand-red font-bold font-mono">{s.data.temp}°C</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-4 py-2 text-xs font-semibold text-center text-[--text-muted] hover:text-[--text-main] border border-[--border] rounded-lg hover:bg-[--surface-hover] transition-colors">
                        Посмотреть все отчеты
                    </button>
                </div>
            </div>
        </div>
    );
}