// src/pages/DevicesPage.jsx
import { useState, useMemo, useEffect } from 'react';
import {
    Search, Filter, ChevronDown, WifiOff, ArrowUpDown, Server, MapPin, Hash, RefreshCw, Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useSensorStore } from '../store/sensorStore';
import { useRegionStore } from '../store/regionStore';
import { AddRegionModal } from '../components/ui/AddRegionModal';
import { AddDistrictModal } from '../components/ui/AddDistrictModal';

// --- НОВАЯ БИБЛИОТЕКА (Современная и без ошибок) ---
import { Virtuoso } from 'react-virtuoso';

// Компонент бейджа статуса
const StatusBadge = ({ status }) => {
    if (status === 'danger') {
        return (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border border-red-500/30 bg-red-500/10 text-red-500 whitespace-nowrap w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                CRITICAL
            </div>
        );
    }
    if (status === 'offline') {
        return (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border border-gray-600 bg-gray-500/10 text-gray-500 whitespace-nowrap w-fit">
                <WifiOff size={10} />
                OFFLINE
            </div>
        );
    }
    return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border border-[var(--color-success)]/30 bg-[rgba(0,255,157,0.1)] text-[var(--color-success)] whitespace-nowrap w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]"></span>
            ACTIVE
        </div>
    );
};

export default function DevicesPage() {
    const sensors = useSensorStore(state => state.sensors);
    const regions = useRegionStore(state => state.regions);
    const fetchSensors = useSensorStore(state => state.fetchSensors);
    const fetchRegions = useRegionStore(state => state.fetchRegions);
    const syncAllSensors = useSensorStore(state => state.syncAllSensors);
    const navigate = useNavigate();

    // Загружаем данные при монтировании
    useEffect(() => {
        if (sensors.length === 0) {
            fetchSensors();
        }
    }, [sensors.length, fetchSensors]);

    useEffect(() => {
        if (regions.length === 0) {
            fetchRegions();
        }
    }, [regions.length, fetchRegions]);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCityId, setSelectedCityId] = useState('all');
    const [selectedDistrictId, setSelectedDistrictId] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'lastUpdate', direction: 'desc' });
    const [isSyncing, setIsSyncing] = useState(false);
    const [isAddRegionOpen, setIsAddRegionOpen] = useState(false);
    const [isAddDistrictOpen, setIsAddDistrictOpen] = useState(false);

    const handleSyncAll = async () => {
        setIsSyncing(true);
        try {
            await syncAllSensors();
        } catch (err) {
            console.error("Sync failed:", err);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // ФИЛЬТРАЦИЯ И СОРТИРОВКА
    const processedSensors = useMemo(() => {
        if (!sensors || !Array.isArray(sensors)) return [];
        let result = sensors;

        // 1. Поиск
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(s =>
                (s.name && s.name.toLowerCase().includes(q)) ||
                (s.id && String(s.id).toLowerCase().includes(q)) ||
                (s.serialNumber && s.serialNumber.toLowerCase().includes(q))
            );
        }

        // 2. Регион
        if (selectedCityId !== 'all') {
            result = result.filter(s => String(s.cityId) === String(selectedCityId));
        }

        // 3. Район
        if (selectedDistrictId !== 'all') {
            result = result.filter(s => String(s.districtId) === String(selectedDistrictId));
        }

        // 4. Статус
        if (statusFilter !== 'all') {
            result = result.filter(s => s.status === statusFilter);
        }

        // 5. Сортировка
        result = [...result].sort((a, b) => {
            let valA, valB;
            switch (sortConfig.key) {
                case 'name': valA = a.name; valB = b.name; break;
                case 't_out': valA = a.telemetry.t_out; valB = b.telemetry.t_out; break;
                case 't_in': valA = a.telemetry.t_in; valB = b.telemetry.t_in; break;
                case 'lastUpdate': valA = a.lastUpdate; valB = b.lastUpdate; break;
                default: valA = a.id; valB = b.id;
            }
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return result;
    }, [sensors, searchQuery, selectedCityId, selectedDistrictId, statusFilter, sortConfig]);

    // Получаем список районов для выбранного региона
    const availableDistricts = useMemo(() => {
        if (selectedCityId === 'all' || !regions || !Array.isArray(regions)) return [];
        const region = regions.find(r => String(r.id) === String(selectedCityId));
        return region && region.districts ? region.districts : [];
    }, [selectedCityId, regions]);

    const handleCityChange = (e) => {
        setSelectedCityId(e.target.value);
        setSelectedDistrictId('all');
    };

    // --- РЕНДЕР СТРОКИ ---
    const RowContent = (index, sensor) => {
        return (
            <div
                onClick={() => navigate(`/devices/${sensor.id}`)}
                className="flex items-center border-b border-[var(--border-color)]/50 hover:bg-white/5 transition-colors cursor-pointer group box-border h-[72px]"
            >
                {/* Status */}
                <div className="px-4 w-24 flex items-center shrink-0">
                    <StatusBadge status={sensor.status} />
                </div>

                {/* Serial */}
                <div className="px-4 w-32 shrink-0">
                    <div className="text-[11px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20 whitespace-nowrap w-fit flex items-center gap-1">
                        <Hash size={10} className="opacity-50"/> {sensor.serialNumber}
                    </div>
                </div>

                {/* Name & Location (Flex-1) */}
                <div className="px-4 flex-1 min-w-0">
                    <div className="font-bold text-sm text-white group-hover:text-[var(--color-cool)] transition-colors mb-0.5 truncate">
                        {sensor.name}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono truncate">
                        <span className="bg-white/5 px-1.5 rounded shrink-0">{String(sensor.id).slice(0, 8)}...</span>
                        <span className="text-[var(--text-muted)]/50">|</span>
                        <MapPin size={10} className="shrink-0" />
                        <span className="truncate">{sensor.cityName}, {sensor.districtName}</span>
                    </div>
                </div>

                {/* Feed Temp */}
                <div className="px-4 w-28 text-right shrink-0">
                    <div className={`text-xl font-mono font-bold ${sensor.status === 'offline' ? 'text-[var(--text-muted)]' : 'text-[var(--color-heat)]'}`}>
                        {sensor.status === 'offline' ? '--' : sensor.telemetry.t_out.toFixed(1)}°
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase">Feed</div>
                </div>

                {/* Return Temp */}
                <div className="px-4 w-28 text-right shrink-0">
                    <div className={`text-xl font-mono font-bold ${sensor.status === 'offline' ? 'text-[var(--text-muted)]' : 'text-[var(--color-cool)]'}`}>
                        {sensor.status === 'offline' ? '--' : sensor.telemetry.t_in.toFixed(1)}°
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase">Return</div>
                </div>

                {/* Updated */}
                <div className="px-4 w-32 text-right shrink-0">
                    <div className="text-sm font-mono text-[var(--text-main)]">
                        {format(new Date(sensor.lastUpdate), 'HH:mm:ss')}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">
                        {format(new Date(sensor.lastUpdate), 'dd MMM')}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 h-full overflow-hidden flex flex-col box-border">
            {/* ШАПКА СТРАНИЦЫ */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-6 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold font-mono text-white mb-2 flex items-center gap-3">
                        <Server className="text-[var(--color-cool)]" /> SYSTEM UNITS
                    </h1>
                    <div className="text-sm text-[var(--text-muted)] font-mono flex gap-4">
                        <span>TOTAL: <b className="text-white">{sensors.length}</b></span>
                        <span className="text-[var(--color-success)]">ONLINE: <b>{sensors.filter(s => s.status === 'active').length}</b></span>
                        <span className="text-[var(--color-danger)]">ERRORS: <b>{sensors.filter(s => s.status === 'danger').length}</b></span>
                    </div>
                </div>

                {/* ПАНЕЛЬ ФИЛЬТРОВ */}
                <div className="flex flex-wrap items-center gap-3 bg-[var(--bg-panel)] p-1.5 rounded-xl border border-[var(--border-color)]">

                    <button
                        onClick={handleSyncAll}
                        disabled={isSyncing}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Sync All Sensors"
                    >
                        <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                        {isSyncing ? "SYNCING..." : "SYNC ALL"}
                    </button>

                    <div className="w-[1px] h-6 bg-[var(--border-color)]"></div>

                    {/* Search */}
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--color-cool)]" size={16} />
                        <input
                            type="text"
                            placeholder="Search SN, ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-transparent border-none focus:outline-none text-sm w-48 text-[var(--text-main)] placeholder:text-[var(--text-muted)]/50"
                        />
                    </div>

                    <div className="w-[1px] h-6 bg-[var(--border-color)]"></div>

                    {/* Region Filter */}
                    <div className="relative flex items-center gap-1">
                        <select value={selectedCityId} onChange={handleCityChange} className="pl-3 pr-8 py-2 bg-transparent text-sm font-bold focus:outline-none appearance-none cursor-pointer text-[var(--text-main)] hover:text-white max-w-[150px]">
                            <option value="all" className="bg-[#02040a]">ALL REGIONS</option>
                            {regions && Array.isArray(regions) && regions.map(region => (
                                <option key={region.id} value={region.id} className="bg-[#02040a]">
                                    {region.name?.toUpperCase() || 'UNKNOWN'}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" size={12} />
                        <button
                            onClick={() => setIsAddRegionOpen(true)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-emerald-400 transition-colors"
                            title="Add Region"
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    {/* District Filter */}
                    {selectedCityId !== 'all' && (
                        <>
                            <div className="w-[1px] h-6 bg-[var(--border-color)]"></div>
                            <div className="relative flex items-center gap-1 animate-fadeIn">
                                <select value={selectedDistrictId} onChange={(e) => setSelectedDistrictId(e.target.value)} className="pl-3 pr-8 py-2 bg-transparent text-sm font-bold focus:outline-none appearance-none cursor-pointer text-[var(--text-main)] hover:text-white max-w-[150px]">
                                    <option value="all" className="bg-[#02040a]">ALL DISTRICTS</option>
                                    {availableDistricts && Array.isArray(availableDistricts) && availableDistricts.map(d => (
                                        <option key={d.id} value={d.id} className="bg-[#02040a]">
                                            {d.name?.toUpperCase() || 'UNKNOWN'}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" size={12} />
                                <button
                                    onClick={() => setIsAddDistrictOpen(true)}
                                    className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-emerald-400 transition-colors"
                                    title="Add District"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        </>
                    )}

                    <div className="w-[1px] h-6 bg-[var(--border-color)]"></div>

                    {/* Status Filter */}
                    <div className="relative">
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="pl-3 pr-8 py-2 bg-transparent text-sm font-bold focus:outline-none appearance-none cursor-pointer text-[var(--text-main)] hover:text-white">
                            <option value="all" className="bg-[#02040a]">ALL STATUS</option>
                            <option value="active" className="bg-[#02040a]">ACTIVE</option>
                            <option value="danger" className="bg-[#02040a]">CRITICAL</option>
                            <option value="offline" className="bg-[#02040a]">OFFLINE</option>
                        </select>
                        <Filter className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" size={12} />
                    </div>
                </div>
            </div>

            {/* КОНТЕЙНЕР ТАБЛИЦЫ */}
            <div className="flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] backdrop-blur-sm relative overflow-hidden flex flex-col">

                {/* ЗАГОЛОВОК ТАБЛИЦЫ */}
                <div className="h-12 bg-[#02040a]/80 border-b border-[var(--border-color)] flex items-center text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider z-10 shrink-0">
                    <div className="px-4 w-24">Status</div>
                    <div className="px-4 w-32">Serial No</div>
                    <div className="px-4 flex-1 cursor-pointer hover:text-white flex items-center gap-1" onClick={() => handleSort('name')}>
                        Unit Info <ArrowUpDown size={10} />
                    </div>
                    <div className="px-4 w-28 text-right cursor-pointer hover:text-white flex items-center justify-end gap-1" onClick={() => handleSort('t_out')}>
                        Feed <ArrowUpDown size={10} />
                    </div>
                    <div className="px-4 w-28 text-right cursor-pointer hover:text-white flex items-center justify-end gap-1" onClick={() => handleSort('t_in')}>
                        Return <ArrowUpDown size={10} />
                    </div>
                    <div className="px-4 w-32 text-right cursor-pointer hover:text-white flex items-center justify-end gap-1" onClick={() => handleSort('lastUpdate')}>
                        Updated <ArrowUpDown size={10} />
                    </div>
                </div>

                {/* ТЕЛО ТАБЛИЦЫ (VIRTUOSO) */}
                <div className="flex-1 bg-[#02040a]">
                    {!processedSensors || processedSensors.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-[var(--text-muted)]">NO UNITS FOUND</div>
                    ) : (
                        <Virtuoso
                            style={{ height: '100%' }}
                            data={processedSensors}
                            itemContent={RowContent}
                            overscan={200} // Рендерить чуть больше вперед для плавности
                        />
                    )}
                </div>
            </div>

            {/* Модалки */}
            <AddRegionModal
                isOpen={isAddRegionOpen}
                onClose={() => setIsAddRegionOpen(false)}
            />
            <AddDistrictModal
                isOpen={isAddDistrictOpen}
                onClose={() => setIsAddDistrictOpen(false)}
                preselectedRegionId={selectedCityId !== 'all' ? selectedCityId : null}
            />
        </div>
    );
}