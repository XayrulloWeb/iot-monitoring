// src/pages/DeviceDetailPage.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSensorStore } from '../store/sensorStore';
import { ArrowLeft, MapPin, AlertTriangle, CheckCircle, WifiOff, List, Download, Hash, RefreshCw, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { BoilerSchema } from '../components/schema/BoilerSchema';
import { format, isValid } from 'date-fns'; // Импортируем isValid
import { WeatherWidget } from "../components/ui/WeatherWidget.jsx";
import * as XLSX from 'xlsx';

export default function DeviceDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const sensors = useSensorStore(state => state.sensors);
    const fetchSensorLive = useSensorStore(state => state.fetchSensorLive);
    const fetchSensorHistory = useSensorStore(state => state.fetchSensorHistory);
    const syncSensor = useSensorStore(state => state.syncSensor);

    const isHistoryLoading = useSensorStore(state => state.isHistoryLoading);
    const historyMeta = useSensorStore(state => state.historyMeta);

    const sensor = sensors.find(s => s.id === id);

    const [isSyncing, setIsSyncing] = useState(false);
    const [page, setPage] = useState(1);

    // 1. Live Data (Poll every 30s)
    // 504 ошибки игнорируем - это нормально, если сенсор не отвечает быстро
    useEffect(() => {
        if (!id) return;
        fetchSensorLive(id).catch(() => {}); // Первый запрос сразу
        const interval = setInterval(() => {
            fetchSensorLive(id).catch(() => {}); // Затем каждые 30 секунд
        }, 60000);
        return () => clearInterval(interval);
    }, [id, fetchSensorLive]);

    // 2. History Data
    useEffect(() => {
        if (id) {
            fetchSensorHistory(id, page, 50);
        }
    }, [id, page, fetchSensorHistory]);

    if (!sensor) {
        return (
            <div className="p-10 text-center text-slate-500 flex flex-col items-center h-full justify-center">
                <Loader2 className="animate-spin mb-4" size={32} />
                <h2 className="text-xl font-mono mb-4">LOADING UNIT DATA...</h2>
                <button onClick={() => navigate('/devices')} className="px-4 py-2 bg-white/5 rounded-lg text-white hover:bg-white/10 transition-colors">Back to List</button>
            </div>
        );
    }

    const isDanger = sensor.status === 'danger';
    const isOffline = sensor.status === 'offline';

    const handleSync = async () => {
        setIsSyncing(true);
        await syncSensor(sensor.id);
        setIsSyncing(false);
    };

    const handleExport = () => {
        if (!sensor.history || sensor.history.length === 0) return;
        const data = sensor.history.map((log, index) => ({
            // Проверка даты перед экспортом
            "Timestamp": log.time ? format(new Date(log.time), 'yyyy-MM-dd HH:mm:ss') : `Record ${index + 1}`,
            "Feed Temp (°C)": parseFloat(log.t_out) || 0,
            "Return Temp (°C)": parseFloat(log.t_in) || 0,
            "Delta T (°C)": (parseFloat(log.t_out) - parseFloat(log.t_in)).toFixed(1),
            "Pressure": parseFloat(log.pressure) || 0
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        worksheet['!cols'] = [
            { wch: 20 }, // Timestamp
            { wch: 15 }, // Feed Temp
            { wch: 15 }, // Return Temp
            { wch: 12 }, // Delta T
            { wch: 12 }  // Pressure
        ];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "History Log");
        XLSX.writeFile(workbook, `${sensor.name}_History_Page_${page}.xlsx`);
    };

    // Функция безопасного форматирования даты
    const renderDate = (dateString) => {
        if (!dateString) return <span className="text-red-500/50">N/A</span>;
        const date = new Date(dateString);
        if (!isValid(date)) return <span className="text-red-500/50">Invalid Date</span>;
        return (
            <>
                {format(date, 'dd.MM')} <span className="text-slate-500 ml-1">{format(date, 'HH:mm:ss')}</span>
            </>
        );
    };

    return (
        <div className="p-6 h-full overflow-y-auto custom-scrollbar flex flex-col">
            {/* HEADER */}
            <div className="flex items-center gap-4 mb-6 shrink-0">
                <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/5">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white font-mono tracking-tight flex items-center gap-3">
                        {sensor.name}
                        {isDanger && <span className="text-xs bg-red-500/20 text-red-500 border border-red-500/50 px-2 py-0.5 rounded animate-pulse">CRITICAL ERROR</span>}
                        {isOffline && <span className="text-xs bg-slate-700 text-slate-300 border border-slate-600 px-2 py-0.5 rounded">OFFLINE</span>}
                    </h1>
                    <div className="mt-1 flex items-center gap-4 text-xs text-slate-400 font-mono">
                         <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 flex items-center gap-1">
                            <Hash size={10} /> {sensor.serialNumber}
                        </span>
                        <span className="flex items-center gap-1"><MapPin size={12}/> {sensor.cityName}, {sensor.districtName}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <WeatherWidget lat={sensor.coords[1]} lng={sensor.coords[0]} cityName={sensor.cityName} />
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                        {isSyncing ? "SYNCING..." : "SYNC"}
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={!sensor.history?.length}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                    >
                        <Download size={14} /> EXPORT
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">

                {/* LEFT: SCHEMATIC + HISTORY */}
                <div className="lg:col-span-2 space-y-6 flex flex-col">
                    <div className="glass-panel p-1 rounded-2xl relative shrink-0">
                        <BoilerSchema sensor={sensor} />
                    </div>

                    {/* HISTORY TABLE */}
                    <div className="glass-panel flex flex-col rounded-2xl overflow-hidden flex-1 min-h-[300px]">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#0b1121]">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <List size={16} className="text-indigo-500"/>
                                History Logs
                            </h3>
                            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                                <span>Page {historyMeta.current_page} of {historyMeta.last_page}</span>
                                <div className="flex gap-1 ml-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1 || isHistoryLoading}
                                        className="p-1 rounded hover:bg-white/10 disabled:opacity-30 transition-colors"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={page >= historyMeta.last_page || isHistoryLoading}
                                        className="p-1 rounded hover:bg-white/10 disabled:opacity-30 transition-colors"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-5 bg-white/5 text-[10px] font-mono text-slate-500 uppercase tracking-wider py-2 px-4 border-b border-white/5">
                            <div>Timestamp</div>
                            <div className="text-right">Feed (Out)</div>
                            <div className="text-right">Return (In)</div>
                            <div className="text-right">Delta</div>
                            <div className="text-right">Status</div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                            {isHistoryLoading && (
                                <div className="absolute inset-0 bg-[#02040a]/80 backdrop-blur-sm flex items-center justify-center z-10">
                                    <Loader2 className="animate-spin text-indigo-500" size={32} />
                                </div>
                            )}

                            {(!sensor.history || sensor.history.length === 0) && !isHistoryLoading ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                    <p className="font-mono text-sm">NO HISTORY FOUND</p>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <tbody>
                                    {sensor.history.map((log, index) => {
                                        const tOut = parseFloat(log.t_out) || 0;
                                        const tIn = parseFloat(log.t_in) || 0;
                                        const delta = (tOut - tIn).toFixed(1);
                                        const isLow = tOut < 60;
                                        return (
                                            <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors font-mono text-sm group">
                                                <td className="py-3 px-4 text-slate-400">
                                                    {log.time ? renderDate(log.time) : <span className="text-slate-500">#{index + 1}</span>}
                                                </td>
                                                <td className="py-3 px-4 text-right font-bold text-amber-400">{tOut.toFixed(1)}°</td>
                                                <td className="py-3 px-4 text-right font-bold text-blue-400">{tIn.toFixed(1)}°</td>
                                                <td className="py-3 px-4 text-right text-slate-300">{delta}°</td>
                                                <td className="py-3 px-4 text-right">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                                                        isLow ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                                    }`}>
                                                        {isLow ? 'LOW TEMP' : 'NORMAL'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT: INFO */}
                <div className="space-y-6">
                    <div className={`glass-panel p-6 rounded-2xl border-l-4 ${isDanger ? 'border-l-red-500' : 'border-l-emerald-500'}`}>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Live Status</h3>
                        <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-full ${isDanger ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                {isDanger ? <AlertTriangle size={32} /> : isOffline ? <WifiOff size={32}/> : <CheckCircle size={32} />}
                            </div>
                            <div>
                                <div className={`text-xl font-bold font-mono ${isDanger ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {isDanger ? 'WARNING' : isOffline ? 'OFFLINE' : 'OPERATIONAL'}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                    Last Update: {format(new Date(sensor.lastUpdate), 'dd.MM.yyyy HH:mm:ss')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Telemetry</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                <div className="text-[10px] text-slate-500 uppercase">Pressure</div>
                                <div className="text-lg font-mono font-bold text-white">{sensor.telemetry.pressure} bar</div>
                            </div>
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                <div className="text-[10px] text-slate-500 uppercase">Flow Rate</div>
                                <div className="text-lg font-mono font-bold text-white">{sensor.telemetry.flow} m³/h</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}