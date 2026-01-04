import { Search, Filter, ChevronDown, RefreshCw, Plus, Radio } from 'lucide-react';
import { useRegionStore } from '../../store/regionStore';

export function DeviceFilterBar({
                                    search, onSearchChange,
                                    cityId, onCityChange,
                                    districtId, onDistrictChange,
                                    status, onStatusChange,
                                    onSync, isSyncing,
                                    onAddDevice, onAddRegion, onAddDistrict
                                }) {
    const regions = useRegionStore(state => state.regions);

    // Вычисляем доступные районы
    const availableDistricts = cityId !== 'all'
        ? regions.find(r => String(r.id) === String(cityId))?.districts || []
        : [];

    return (
        <div className="flex flex-wrap items-center gap-3 bg-[var(--bg-panel)] p-1.5 rounded-xl border border-[var(--border-color)]">

            {/* BUTTONS */}
            <button onClick={onAddDevice} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-indigo-500/20">
                <Radio size={14} /> NEW UNIT
            </button>

            <button onClick={onSync} disabled={isSyncing} className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50">
                <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                {isSyncing ? "SYNCING..." : "SYNC ALL"}
            </button>

            <div className="w-[1px] h-6 bg-[var(--border-color)]"></div>

            {/* SEARCH */}
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                <input
                    type="text"
                    placeholder="Search SN, ID..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-transparent border-none focus:outline-none text-sm w-48 text-white placeholder:text-slate-600"
                />
            </div>

            <div className="w-[1px] h-6 bg-[var(--border-color)]"></div>

            {/* REGION SELECT */}
            <div className="relative flex items-center gap-1">
                <select value={cityId} onChange={(e) => onCityChange(e.target.value)} className="pl-3 pr-8 py-2 bg-transparent text-sm font-bold focus:outline-none appearance-none cursor-pointer text-white hover:text-emerald-400 max-w-[150px]">
                    <option value="all" className="bg-[#02040a]">ALL REGIONS</option>
                    {regions.map(r => (
                        <option key={r.id} value={r.id} className="bg-[#02040a]">{r.name}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={12} />
                <button onClick={onAddRegion} className="p-1.5 rounded hover:bg-white/10 text-slate-500 hover:text-white"><Plus size={14}/></button>
            </div>

            {/* DISTRICT SELECT (Conditional) */}
            {cityId !== 'all' && (
                <>
                    <div className="w-[1px] h-6 bg-[var(--border-color)]"></div>
                    <div className="relative flex items-center gap-1 animate-fadeIn">
                        <select value={districtId} onChange={(e) => onDistrictChange(e.target.value)} className="pl-3 pr-8 py-2 bg-transparent text-sm font-bold focus:outline-none appearance-none cursor-pointer text-white hover:text-emerald-400 max-w-[150px]">
                            <option value="all" className="bg-[#02040a]">ALL DISTRICTS</option>
                            {availableDistricts.map(d => (
                                <option key={d.id} value={d.id} className="bg-[#02040a]">{d.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={12} />
                        <button onClick={onAddDistrict} className="p-1.5 rounded hover:bg-white/10 text-slate-500 hover:text-white"><Plus size={14}/></button>
                    </div>
                </>
            )}

            <div className="w-[1px] h-6 bg-[var(--border-color)]"></div>

            {/* STATUS SELECT */}
            <div className="relative">
                <select value={status} onChange={(e) => onStatusChange(e.target.value)} className="pl-3 pr-8 py-2 bg-transparent text-sm font-bold focus:outline-none appearance-none cursor-pointer text-white hover:text-emerald-400">
                    <option value="all" className="bg-[#02040a]">ALL STATUS</option>
                    <option value="active" className="bg-[#02040a]">ACTIVE</option>
                    <option value="danger" className="bg-[#02040a]">CRITICAL</option>
                    <option value="offline" className="bg-[#02040a]">OFFLINE</option>
                </select>
                <Filter className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={12} />
            </div>
        </div>
    );
}