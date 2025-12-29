// src/pages/DevicesPage.jsx

import { useState, Fragment } from 'react'; // <-- ДОБАВИЛ Fragment
import {
    Search, Filter, Wifi, WifiOff,
    Thermometer, Droplets, Battery, ChevronDown, ChevronUp, Building, ArrowUpDown
} from 'lucide-react';
import { format } from 'date-fns';
import { useSensorStore } from '../store/sensorStore';
import { ASSETS } from '../lib/sensorData';

export default function DevicesPage() {
    const sensors = useSensorStore(state => state.sensors);

    // Состояние
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterAsset, setFilterAsset] = useState('all');
    const [expandedDeviceId, setExpandedDeviceId] = useState(null);

    // Сортировка
    const [sortConfig, setSortConfig] = useState({ key: 'lastUpdate', direction: 'desc' });

    const toggleRow = (id) => {
        if (expandedDeviceId === id) setExpandedDeviceId(null);
        else setExpandedDeviceId(id);
    };

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // --- ЛОГИКА ---
    let processedSensors = sensors.filter(sensor => {
        const isOffline = (Date.now() - new Date(sensor.lastUpdate).getTime()) > 30000;
        const isDanger = sensor.data.temp > 24;

        const matchesSearch =
            sensor.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sensor.locationName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = filterStatus === 'all'
            ? true
            : filterStatus === 'danger' ? isDanger && !isOffline
                : filterStatus === 'offline' ? isOffline
                    : !isDanger && !isOffline;

        const matchesAsset = filterAsset === 'all' || sensor.assetId === filterAsset;
        return matchesSearch && matchesStatus && matchesAsset;
    });

    processedSensors.sort((a, b) => {
        let valA, valB;
        if (sortConfig.key === 'id') { valA = a.id; valB = b.id; }
        else if (sortConfig.key === 'temp') { valA = a.data.temp; valB = b.data.temp; }
        else if (sortConfig.key === 'lastUpdate') { valA = new Date(a.lastUpdate).getTime(); valB = new Date(b.lastUpdate).getTime(); }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    return (
        <div className="p-8 h-full overflow-y-auto">

            {/* --- ЗАГОЛОВОК --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-brand-blue to-brand-green bg-clip-text text-transparent w-fit">
                        Устройства
                    </h1>
                    <div className="flex items-center gap-2 text-[--text-muted] text-sm">
                        <span className="flex h-2 w-2 rounded-full bg-brand-green animate-pulse"></span>
                        Активных систем: <span className="text-[--text-main] font-mono font-bold">{processedSensors.length}</span>
                    </div>
                </div>

                {/* --- ФИЛЬТРЫ --- */}
                <div className="flex flex-wrap items-center gap-3 bg-[--surface] p-2 rounded-xl border border-[--border] shadow-lg">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted] group-focus-within:text-brand-blue transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Поиск..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-transparent border-none focus:outline-none text-sm w-48 text-[--text-main]"
                        />
                    </div>
                    <div className="w-[1px] h-6 bg-[--border]"></div>
                    <div className="relative">
                        <select
                            value={filterAsset}
                            onChange={(e) => setFilterAsset(e.target.value)}
                            className="pl-3 pr-8 py-2 bg-transparent text-sm font-medium focus:outline-none appearance-none cursor-pointer text-[--text-main]"
                        >
                            <option value="all" className="bg-[--bg-app]">Все объекты</option>
                            {ASSETS.map(asset => (
                                <option key={asset.id} value={asset.id} className="bg-[--bg-app] text-[--text-main]">{asset.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-[--text-muted] pointer-events-none" size={14} />
                    </div>
                    <div className="w-[1px] h-6 bg-[--border]"></div>
                    <div className="relative">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="pl-3 pr-8 py-2 bg-transparent text-sm font-medium focus:outline-none appearance-none cursor-pointer text-[--text-main]"
                        >
                            <option value="all" className="bg-[--bg-app]">Все статусы</option>
                            <option value="good" className="bg-[--bg-app]">Норма</option>
                            <option value="danger" className="bg-[--bg-app]">Тревога</option>
                            <option value="offline" className="bg-[--bg-app]">Не активные</option>
                        </select>
                        <Filter className="absolute right-2 top-1/2 -translate-y-1/2 text-[--text-muted] pointer-events-none" size={12} />
                    </div>
                </div>
            </div>

            {/* --- ТАБЛИЦА --- */}
            <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl border border-[--border]">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="border-b border-[--border] bg-[--surface-hover]/30 text-[--text-muted] text-xs uppercase tracking-wider">
                        <th className="p-5 w-12"></th>
                        <th className="p-5 font-semibold cursor-pointer hover:text-[--text-main]" onClick={() => handleSort('id')}>
                            Статус <ArrowUpDown size={10} className="inline ml-1"/>
                        </th>
                        <th className="p-5 font-semibold cursor-pointer hover:text-[--text-main]" onClick={() => handleSort('id')}>
                            ID / Локация <ArrowUpDown size={10} className="inline ml-1"/>
                        </th>
                        <th className="p-5 font-semibold cursor-pointer hover:text-[--text-main]" onClick={() => handleSort('temp')}>
                            Телеметрия <ArrowUpDown size={10} className="inline ml-1"/>
                        </th>
                        <th className="p-5 font-semibold text-right cursor-pointer hover:text-[--text-main]" onClick={() => handleSort('lastUpdate')}>
                            Обновление <ArrowUpDown size={10} className="inline ml-1"/>
                        </th>
                    </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-[--border]">
                    {processedSensors.length === 0 ? (
                        <tr><td colSpan="5" className="p-12 text-center text-[--text-muted]">Устройства не найдены</td></tr>
                    ) : (
                        processedSensors.map((sensor) => {
                            // ПРОВЕРКА OFFLINE (30 секунд)
                            const isOffline = (Date.now() - new Date(sensor.lastUpdate).getTime()) > 30000;
                            const isDanger = sensor.data.temp > 24;
                            const isExpanded = expandedDeviceId === sensor.id;
                            const assetName = ASSETS.find(a => a.id === sensor.assetId)?.name || 'Unknown';

                            const batColor = sensor.data.battery < 20 ? 'text-red-500' : sensor.data.battery < 50 ? 'text-yellow-500' : 'text-green-500';

                            return (
                                // ВАЖНО: Используем Fragment с ключом здесь!
                                <Fragment key={sensor.id}>
                                    <tr
                                        onClick={() => toggleRow(sensor.id)}
                                        className={`
                                                cursor-pointer transition-all duration-200 
                                                ${isExpanded ? 'bg-[--surface-hover] shadow-inner' : 'hover:bg-[--surface-hover]/50'}
                                                ${isOffline ? 'opacity-60 grayscale' : ''} 
                                            `}
                                    >
                                        <td className="p-5 text-[--text-muted]">
                                            <ChevronDown size={16} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}/>
                                        </td>

                                        <td className="p-5">
                                            {isOffline ? (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide border bg-gray-500/10 text-gray-500 border-gray-500/20">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span> OFFLINE
                                                </div>
                                            ) : (
                                                <div className={`
                                                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide border
                                                        ${isDanger
                                                    ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                    : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}
                                                    `}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${isDanger ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                                                    {isDanger ? 'ТРЕВОГА' : 'АКТИВЕН'}
                                                </div>
                                            )}
                                        </td>

                                        <td className="p-5">
                                            <div className="font-mono font-bold text-[--text-main] text-base mb-1">{sensor.id}</div>
                                            <div className="flex items-center gap-1.5 text-xs text-[--text-muted]">
                                                <Building size={12}/>
                                                <span className="truncate max-w-[200px]">{assetName}</span>
                                                <span className="opacity-50">•</span>
                                                <span>{sensor.locationName}</span>
                                            </div>
                                        </td>

                                        <td className="p-5">
                                            <div className="flex gap-6">
                                                <div>
                                                    <div className="text-[10px] text-[--text-muted] uppercase mb-0.5">Темп.</div>
                                                    <div className="flex items-center gap-1 text-brand-blue font-bold font-mono text-lg">
                                                        <Thermometer size={16}/> {sensor.data.temp}°
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-[--text-muted] uppercase mb-0.5">Влаж.</div>
                                                    <div className="flex items-center gap-1 text-brand-green font-bold font-mono text-lg">
                                                        <Droplets size={16}/> {sensor.data.hum}%
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-[--text-muted] uppercase mb-0.5">Bat.</div>
                                                    <div className={`flex items-center gap-1 font-bold font-mono text-lg ${batColor}`}>
                                                        <Battery size={16} className={sensor.data.battery < 20 ? 'animate-pulse' : ''}/> {sensor.data.battery}%
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="p-5 text-right">
                                            <div className="font-mono text-sm text-[--text-main]">
                                                {format(new Date(sensor.lastUpdate), 'HH:mm:ss')}
                                            </div>
                                            <div className="text-[10px] text-[--text-muted]">
                                                {format(new Date(sensor.lastUpdate), 'dd.MM.yyyy')}
                                            </div>
                                            {isOffline && (
                                                <div className="text-[10px] text-red-500 font-bold mt-1">Нет связи</div>
                                            )}
                                        </td>
                                    </tr>

                                    {isExpanded && (
                                        <tr className="bg-[--surface-hover]/30 shadow-inner">
                                            <td colSpan="5" className="p-0">
                                                <div className="p-6 pl-20 flex gap-6 overflow-x-auto">
                                                    {sensor.history && sensor.history.length > 0 ? (
                                                        sensor.history.slice(0, 8).map((log, idx) => (
                                                            <div key={idx} className="min-w-[100px] p-3 rounded-lg bg-[--bg-app] border border-[--border] flex flex-col items-center">
                                                                    <span className="text-[10px] text-[--text-muted] mb-1">
                                                                        {format(new Date(log.timestamp), 'HH:mm:ss')}
                                                                    </span>
                                                                <span className="font-mono font-bold text-brand-blue">
                                                                        {log.value}°
                                                                    </span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-[--text-muted] text-sm p-4">Нет истории</div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            );
                        })
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}