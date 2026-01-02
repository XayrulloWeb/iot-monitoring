// src/pages/DashboardPage.jsx
import { useMemo, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, AlertTriangle, WifiOff, Thermometer, Zap, Layers } from 'lucide-react';
import { useSensorStore } from '../store/sensorStore';
import { format } from 'date-fns';

import { WeatherWidget } from '../components/ui/WeatherWidget';

// --- HUD CARD ---
const HUDCard = ({ title, value, subValue, icon: Icon, colorClass, borderClass }) => {
    const isHeat = colorClass.includes('color-heat') || colorClass.includes('orange');
    const isDanger = colorClass.includes('color-danger') || colorClass.includes('red');

    let valueGradient = "text-white";
    if (isHeat) valueGradient = "text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500";
    if (isDanger) valueGradient = "text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-600";
    if (title === "Total Units") valueGradient = "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500";

    return (
        <div className="glass-panel p-6 relative overflow-hidden group">
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
                    <div className={`p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors ${colorClass}`}>
                        <Icon size={18} />
                    </div>
                </div>

                <div className="flex items-baseline gap-2">
                    <span className={`text-4xl font-bold font-sans tracking-tight ${valueGradient}`}>
                        {value}
                    </span>
                    {subValue && <span className="text-sm font-medium text-slate-500">{subValue}</span>}
                </div>
            </div>

            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${
                isDanger ? 'from-red-500/0 via-red-500/50 to-red-500/0' :
                    isHeat ? 'from-orange-500/0 via-orange-500/50 to-orange-500/0' :
                        'from-blue-500/0 via-blue-500/50 to-blue-500/0'
            } opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
        </div>
    );
};

// --- ALERT ROW ---
const AlertRow = ({ sensor }) => (
    <div className="flex items-center justify-between p-3 bg-red-500/5 border-l-2 border-red-500 mb-2 hover:bg-red-500/10 transition-colors cursor-pointer group rounded-r-lg">
        <div className="flex items-center gap-4">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-500 group-hover:animate-bounce">
                <AlertTriangle size={18} />
            </div>
            <div>
                <div className="font-bold text-sm text-white flex items-center gap-2">
                    {sensor.name}
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-400 font-mono">
                        {sensor.id}
                    </span>
                </div>
                <div className="text-xs text-slate-500">
                    {sensor.cityName} / {sensor.districtName}
                </div>
            </div>
        </div>
        <div className="text-right">
            <div className="text-xl font-mono font-bold text-red-400">
                {sensor.status === 'offline' ? 'NO DATA' : `${sensor.telemetry.t_out}°C`}
            </div>
            <div className="text-[10px] uppercase text-red-500/70 font-bold tracking-wide">
                {sensor.status === 'offline' ? 'CONNECTION LOST' : 'CRITICAL LOW TEMP'}
            </div>
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0f172a] border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
                <p className="text-[10px] text-slate-400 font-mono mb-2">{format(new Date(label), 'HH:mm:ss')}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-3 font-mono text-sm mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-slate-300 w-16">{entry.name}:</span>
                        <span className="font-bold" style={{ color: entry.color }}>{entry.value}°C</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function DashboardPage() {
    const sensors = useSensorStore(state => state.sensors);
    const fetchSensors = useSensorStore(state => state.fetchSensors);

    // Загружаем данные при монтировании, если их еще нет
    useEffect(() => {
        if (sensors.length === 0) {
            fetchSensors();
        }
    }, [sensors.length, fetchSensors]);

    const stats = useMemo(() => {
        const total = sensors.length;
        const offline = sensors.filter(s => s.status === 'offline').length;
        const danger = sensors.filter(s => s.status === 'danger').length;
        const active = total - offline - danger;
        const activeSensors = sensors.filter(s => s.status === 'active');
        const avgTempOut = activeSensors.length
            ? (activeSensors.reduce((acc, s) => acc + s.telemetry.t_out, 0) / activeSensors.length).toFixed(1)
            : 0;

        return { total, offline, danger, active, avgTempOut };
    }, [sensors]);

    const chartData = useMemo(() => {
        // Берем первый активный сенсор или любой доступный
        const sourceSensor = sensors.find(s => s.status === 'active') || sensors[0];
        if (!sourceSensor) return [];

        // Если есть история, используем её
        if (sourceSensor.history && sourceSensor.history.length > 0) {
            return sourceSensor.history.map(h => ({
                time: h.time || h.timestamp,
                avgOut: h.t_out || h.temperature_out || sourceSensor.telemetry.t_out,
                avgIn: h.t_in || h.temperature_in || sourceSensor.telemetry.t_in,
            }));
        }

        // Если истории нет, создаем временную из текущих данных всех активных сенсоров
        const activeSensors = sensors.filter(s => s.status === 'active');
        if (activeSensors.length === 0) return [];

        // Генерируем последние 20 точек на основе текущих данных
        const now = Date.now();
        return Array.from({ length: 20 }, (_, i) => {
            const time = new Date(now - (19 - i) * 5 * 60000).toISOString();
            // Агрегируем данные всех активных сенсоров
            const avgOut = activeSensors.reduce((sum, s) => sum + s.telemetry.t_out, 0) / activeSensors.length;
            const avgIn = activeSensors.reduce((sum, s) => sum + s.telemetry.t_in, 0) / activeSensors.length;
            
            // Добавляем небольшую вариацию для визуализации
            const variation = Math.sin(i * 0.3) * 2;
            
            return {
                time,
                avgOut: parseFloat((avgOut + variation).toFixed(1)),
                avgIn: parseFloat((avgIn + variation * 0.5).toFixed(1)),
            };
        });
    }, [sensors]);

    const alertsList = useMemo(() => {
        return sensors.filter(s => s.status !== 'active').slice(0, 5);
    }, [sensors]);

    return (
        <div className="p-6 h-full overflow-y-auto space-y-6">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h2 className="text-2xl font-bold font-mono tracking-tight text-white uppercase flex items-center gap-3">
                        System Overview
                    </h2>
                    <div className="h-0.5 w-20 bg-indigo-500 mt-2 shadow-[0_0_10px_#6366f1]"></div>
                </div>

                {/* ПРАВАЯ ЧАСТЬ: ПОГОДА + СТАТУС */}
                <div className="flex items-center gap-4">

                    {/* ВИДЖЕТ ПОГОДЫ */}
                    <WeatherWidget />

                    {/* СТАТУС СИСТЕМЫ (Оставим его тоже) */}
                    <div className="hidden md:flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20 h-[58px]">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span>SYSTEM<br/>ONLINE</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <HUDCard
                    title="Total Units"
                    value={stats.total}
                    subValue="UNITS"
                    icon={Layers}
                    colorClass="text-blue-400"
                    borderClass="border-blue-500/30"
                />
                <HUDCard
                    title="Avg. Feed Temp"
                    value={stats.avgTempOut}
                    subValue="°C"
                    icon={Thermometer}
                    colorClass="text-amber-400"
                    borderClass="border-amber-500/30"
                />
                <HUDCard
                    title="Critical Errors"
                    value={stats.danger}
                    subValue="ALERTS"
                    icon={AlertTriangle}
                    colorClass="text-red-500"
                    borderClass="border-red-500/50 shadow-[0_0_20px_rgba(255,42,42,0.2)]"
                />
                <HUDCard
                    title="Offline"
                    value={stats.offline}
                    subValue="DISCONNECTED"
                    icon={WifiOff}
                    colorClass="text-slate-400"
                    borderClass="border-gray-700"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ minHeight: '500px' }}>

                {/* ГРАФИК */}
                <div className="lg:col-span-2 glass-panel p-6 rounded-xl flex flex-col relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6 z-10 shrink-0">
                        <div className="flex items-center gap-3">
                            <Activity className="text-indigo-400" size={20}/>
                            <h3 className="font-mono font-bold text-lg tracking-wide text-white">HEAT EXCHANGE EFFICIENCY</h3>
                        </div>
                        <div className="flex gap-4 text-xs font-mono">
                            <div className="flex items-center gap-2 text-amber-400">
                                <span className="w-3 h-3 rounded-sm bg-amber-400"></span> FEED (OUT)
                            </div>
                            <div className="flex items-center gap-2 text-blue-400">
                                <span className="w-3 h-3 rounded-sm bg-blue-400"></span> RETURN (IN)
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full z-10" style={{ minHeight: '300px', aspectRatio: '16/9' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="gradOut" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.3}/>
                                        <stop offset="100%" stopColor="#fbbf24" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="gradIn" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="time"
                                    tickFormatter={(str) => format(new Date(str), 'HH:mm')}
                                    stroke="#64748b"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    minTickGap={30}
                                />
                                <YAxis
                                    stroke="#64748b"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={[0, 120]}
                                />
                                <Tooltip content={<CustomTooltip />} />

                                <Area
                                    type="monotone"
                                    dataKey="avgOut"
                                    name="Подача"
                                    stroke="#fbbf24"
                                    strokeWidth={3}
                                    fill="url(#gradOut)"
                                    animationDuration={1500}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="avgIn"
                                    name="Обратка"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fill="url(#gradIn)"
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ЛОГ */}
                <div className="glass-panel rounded-xl flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-white/5 bg-red-500/5 flex justify-between items-center">
                        <h3 className="font-mono font-bold text-red-400 flex items-center gap-2">
                            <Zap size={18}/> ACTIVE ALERTS
                        </h3>
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_#ef4444]">
                            {stats.danger + stats.offline}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                        {alertsList.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                                <Activity size={48} className="mb-4 text-emerald-500"/>
                                <p className="font-mono text-xs">NO ACTIVE ALERTS</p>
                                <p className="text-[10px]">SYSTEM RUNNING SMOOTHLY</p>
                            </div>
                        ) : (
                            alertsList.map(sensor => (
                                <AlertRow key={sensor.id} sensor={sensor} />
                            ))
                        )}
                    </div>

                    <div className="p-3 border-t border-white/5 bg-black/20">
                        <button className="w-full py-2 text-[10px] font-mono font-bold text-slate-400 hover:text-white hover:bg-white/5 border border-white/5 rounded transition-colors uppercase tracking-wider">
                            View All Incidents
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}