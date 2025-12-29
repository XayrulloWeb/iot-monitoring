// src/pages/DevicesPage.jsx
import { useState, useMemo } from 'react';
import {
    Search, Filter, ChevronDown, WifiOff, ArrowUpDown, Server, MapPin, Hash
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useSensorStore } from '../store/sensorStore';
import { CITIES } from '../lib/sensorData';

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
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCityId, setSelectedCityId] = useState('all');
    const [selectedDistrictId, setSelectedDistrictId] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 't_out', direction: 'desc' });

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const processedSensors = useMemo(() => {
        let result = sensors;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || (s.serialNumber && s.serialNumber.toLowerCase().includes(q)));
        }
        if (selectedCityId !== 'all') result = result.filter(s => s.cityId === selectedCityId);
        if (selectedDistrictId !== 'all') result = result.filter(s => s.districtId === selectedDistrictId);
        if (statusFilter !== 'all') result = result.filter(s => s.status === statusFilter);

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

    const availableDistricts = useMemo(() => {
        if (selectedCityId === 'all') return [];
        const city = CITIES.find(c => c.id === selectedCityId);
        return city ? city.districts : [];
    }, [selectedCityId]);

    const handleCityChange = (e) => {
        setSelectedCityId(e.target.value);
        setSelectedDistrictId('all');
    };

    return (
        <div className="p-8 h-full overflow-hidden flex flex-col">
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

                <div className="flex flex-wrap items-center gap-3 bg-[var(--bg-panel)] p-1.5 rounded-xl border border-[var(--border-color)]">
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
                    <div className="relative">
                        <select value={selectedCityId} onChange={handleCityChange} className="pl-3 pr-8 py-2 bg-transparent text-sm font-bold focus:outline-none appearance-none cursor-pointer text-[var(--text-main)] hover:text-white">
                            <option value="all" className="bg-[#02040a]">ALL CITIES</option>
                            {CITIES.map(city => (<option key={city.id} value={city.id} className="bg-[#02040a]">{city.name.toUpperCase()}</option>))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" size={12} />
                    </div>
                    {selectedCityId !== 'all' && (
                        <>
                            <div className="w-[1px] h-6 bg-[var(--border-color)]"></div>
                            <div className="relative animate-fadeIn">
                                <select value={selectedDistrictId} onChange={(e) => setSelectedDistrictId(e.target.value)} className="pl-3 pr-8 py-2 bg-transparent text-sm font-bold focus:outline-none appearance-none cursor-pointer text-[var(--text-main)] hover:text-white">
                                    <option value="all" className="bg-[#02040a]">ALL DISTRICTS</option>
                                    {availableDistricts.map(d => (<option key={d.id} value={d.id} className="bg-[#02040a]">{d.name.toUpperCase()}</option>))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" size={12} />
                            </div>
                        </>
                    )}
                    <div className="w-[1px] h-6 bg-[var(--border-color)]"></div>
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

            <div className="flex-1 overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] backdrop-blur-sm relative">
                <div className="absolute top-0 left-0 right-0 h-12 bg-[#02040a]/80 border-b border-[var(--border-color)] flex items-center px-4 text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider z-10">
                    <div className="w-24">Status</div> {/* КОЛОНКА 1 */}
                    <div className="w-32">Serial No</div> {/* КОЛОНКА 2 */}
                    <div className="flex-1 cursor-pointer hover:text-white flex items-center gap-1" onClick={() => handleSort('name')}>
                        Unit Info / Location <ArrowUpDown size={10} />
                    </div>
                    <div className="w-32 text-right cursor-pointer hover:text-white flex items-center justify-end gap-1" onClick={() => handleSort('t_out')}>
                        Feed Temp <ArrowUpDown size={10} />
                    </div>
                    <div className="w-32 text-right cursor-pointer hover:text-white flex items-center justify-end gap-1" onClick={() => handleSort('t_in')}>
                        Return <ArrowUpDown size={10} />
                    </div>
                    <div className="w-32 text-right cursor-pointer hover:text-white flex items-center justify-end gap-1" onClick={() => handleSort('lastUpdate')}>
                        Updated <ArrowUpDown size={10} />
                    </div>
                </div>

                <div className="absolute top-12 left-0 right-0 bottom-0 overflow-y-auto custom-scrollbar">
                    {processedSensors.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-[var(--text-muted)]">NO UNITS FOUND</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <tbody>
                            {processedSensors.map((sensor) => (
                                <tr key={sensor.id} onClick={() => navigate(`/devices/${sensor.id}`)} className="border-b border-[var(--border-color)]/50 hover:bg-white/5 transition-colors group cursor-pointer">

                                    {/* КОЛОНКА 1: СТАТУС */}
                                    <td className="p-4 w-24 align-middle">
                                        <StatusBadge status={sensor.status} />
                                    </td>

                                    {/* КОЛОНКА 2: СЕРИЙНЫЙ НОМЕР */}
                                    <td className="p-4 w-32 align-middle">
                                        <div className="text-[11px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20 whitespace-nowrap w-fit flex items-center gap-1">
                                            <Hash size={10} className="opacity-50"/> {sensor.serialNumber}
                                        </div>
                                    </td>

                                    {/* КОЛОНКА 3: ИНФО */}
                                    <td className="p-4 align-middle">
                                        <div className="font-bold text-sm text-white group-hover:text-[var(--color-cool)] transition-colors mb-1">
                                            {sensor.name}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono">
                                            <span className="bg-white/5 px-1.5 rounded">{sensor.id}</span>
                                            <span className="text-[var(--text-muted)]/50">|</span>
                                            <MapPin size={10} />
                                            {sensor.cityName}, {sensor.districtName}
                                        </div>
                                    </td>

                                    {/* КОЛОНКА 4: ПОДАЧА */}
                                    <td className="p-4 text-right align-middle">
                                        <div className={`text-xl font-mono font-bold ${sensor.status === 'offline' ? 'text-[var(--text-muted)]' : 'text-[var(--color-heat)]'}`}>
                                            {sensor.status === 'offline' ? '--' : sensor.telemetry.t_out.toFixed(1)}°
                                        </div>
                                        <div className="text-[10px] text-[var(--text-muted)] uppercase">Feed</div>
                                    </td>

                                    {/* КОЛОНКА 5: ОБРАТКА */}
                                    <td className="p-4 text-right align-middle">
                                        <div className={`text-xl font-mono font-bold ${sensor.status === 'offline' ? 'text-[var(--text-muted)]' : 'text-[var(--color-cool)]'}`}>
                                            {sensor.status === 'offline' ? '--' : sensor.telemetry.t_in.toFixed(1)}°
                                        </div>
                                        <div className="text-[10px] text-[var(--text-muted)] uppercase">Return</div>
                                    </td>

                                    {/* КОЛОНКА 6: ВРЕМЯ */}
                                    <td className="p-4 text-right align-middle">
                                        <div className="text-sm font-mono text-[var(--text-main)]">
                                            {format(new Date(sensor.lastUpdate), 'HH:mm:ss')}
                                        </div>
                                        <div className="text-[10px] text-[var(--text-muted)]">
                                            {format(new Date(sensor.lastUpdate), 'dd MMM')}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}