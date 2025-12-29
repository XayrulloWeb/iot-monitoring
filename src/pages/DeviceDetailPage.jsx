// src/pages/DeviceDetailPage.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useSensorStore } from '../store/sensorStore';
import { ArrowLeft, MapPin, Clock, AlertTriangle, CheckCircle, WifiOff, List, Download, Hash } from 'lucide-react';
import { BoilerSchema } from '../components/schema/BoilerSchema';
import { format } from 'date-fns';
import {WeatherWidget} from "../components/ui/WeatherWidget.jsx";
import * as XLSX from 'xlsx'; // <-- Добавь это в импорты
export default function DeviceDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const sensors = useSensorStore(state => state.sensors);
    const sensor = sensors.find(s => s.id === id);

    if (!sensor) {
        return (
            <div className="p-10 text-center text-slate-500 flex flex-col items-center h-full justify-center">
                <h2 className="text-xl font-mono mb-4">UNIT NOT FOUND: {id}</h2>
                <button onClick={() => navigate('/devices')} className="px-4 py-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500 transition-colors">Return to List</button>
            </div>
        );
    }

    const isDanger = sensor.status === 'danger';
    const isOffline = sensor.status === 'offline';

    const getLogStatus = (t_out) => {
        if (t_out < 60) return { label: 'LOW TEMP', color: 'text-red-400 bg-red-500/10 border-red-500/20' };
        return { label: 'NORMAL', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    };
// Функция экспорта в настоящий Excel (.xlsx)
    const handleExport = () => {
        if (!sensor || !sensor.history.length) return;

        // 1. Подготовка данных
        const data = sensor.history.map(log => {
            const delta = (log.t_out - log.t_in).toFixed(1);
            const status = log.t_out < 60 ? 'CRITICAL' : 'NORMAL';

            return {
                "Timestamp": format(new Date(log.time), 'yyyy-MM-dd HH:mm:ss'),
                "Feed Temp (°C)": log.t_out,
                "Return Temp (°C)": log.t_in,
                "Delta T": parseFloat(delta),
                "Status": status
            };
        });

        // 2. Создаем рабочий лист (Worksheet)
        const worksheet = XLSX.utils.json_to_sheet(data);

        // (Опционально) Настройка ширины колонок
        worksheet['!cols'] = [
            { wch: 20 }, // Timestamp
            { wch: 15 }, // Feed
            { wch: 15 }, // Return
            { wch: 10 }, // Delta
            { wch: 12 }  // Status
        ];

        // 3. Создаем книгу (Workbook)
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "History Log");

        // 4. Скачиваем файл
        XLSX.writeFile(workbook, `${sensor.name}_Report.xlsx`);
    };
    return (
        <div className="p-6 h-full overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/5">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white font-mono tracking-tight flex items-center gap-3">
                        {sensor.name}
                        {isDanger && <span className="text-xs bg-red-500/20 text-red-500 border border-red-500/50 px-2 py-0.5 rounded animate-pulse">CRITICAL ERROR</span>}
                        {isOffline && <span className="text-xs bg-slate-700 text-slate-300 border border-slate-600 px-2 py-0.5 rounded">OFFLINE</span>}
                    </h1>

                    {/* СЕРИЙНЫЙ НОМЕР ПОД НАЗВАНИЕМ */}
                    <div className="mt-1 mb-2">
                        <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 flex items-center gap-1 w-fit">
                            <Hash size={10} /> UZ: {sensor.serialNumber}
                        </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                        <span className="flex items-center gap-1"><MapPin size={12}/> {sensor.cityName}, {sensor.address}</span>
                        <span className="w-[1px] h-3 bg-white/10"></span>
                        <span className="flex items-center gap-1"><Clock size={12}/> Last Upd: {format(new Date(sensor.lastUpdate), 'HH:mm:ss')}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Виджет погоды для ЭТОГО города */}
                    <WeatherWidget lat={sensor.coords[0]} lng={sensor.coords[1]} cityName={sensor.cityName} />

                    <button
                        onClick={handleExport} // <-- ДОБАВЛЕНО
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-indigo-900/20"
                    >
                        <Download size={14} /> EXPORT LOGS
                    </button>
                </div>


            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-panel p-1 rounded-2xl relative">
                        <div className="absolute top-4 left-4 z-20 text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-black/50 px-2 py-1 rounded border border-white/5">
                            Live Schematic View
                        </div>
                        <BoilerSchema sensor={sensor} />
                    </div>

                    <div className="glass-panel flex flex-col rounded-2xl overflow-hidden h-[400px]">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#0b1121]">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <List size={16} className="text-indigo-500"/>
                                Telemetry History Log
                            </h3>
                            <span className="text-[10px] text-slate-500 font-mono">LAST 20 RECORDS</span>
                        </div>
                        <div className="grid grid-cols-5 bg-white/5 text-[10px] font-mono text-slate-500 uppercase tracking-wider py-2 px-4 border-b border-white/5">
                            <div>Timestamp</div>
                            <div className="text-right">Feed (Out)</div>
                            <div className="text-right">Return (In)</div>
                            <div className="text-right">Delta</div>
                            <div className="text-right">Status</div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <table className="w-full">
                                <tbody>
                                {sensor.history.map((log, index) => {
                                    const status = getLogStatus(log.t_out);
                                    const delta = (log.t_out - log.t_in).toFixed(1);
                                    return (
                                        <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors font-mono text-sm group">
                                            <td className="py-3 px-4 text-slate-400">
                                                {format(new Date(log.time), 'HH:mm:ss')}
                                                <span className="text-[10px] text-slate-600 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {format(new Date(log.time), 'dd.MM')}
                                                    </span>
                                            </td>
                                            <td className="py-3 px-4 text-right font-bold text-amber-400">{log.t_out.toFixed(1)}°</td>
                                            <td className="py-3 px-4 text-right font-bold text-blue-400">{log.t_in.toFixed(1)}°</td>
                                            <td className="py-3 px-4 text-right text-slate-300">{delta}°</td>
                                            <td className="py-3 px-4 text-right">
                                                <span className={`text-[10px] px-2 py-0.5 rounded border ${status.color} font-bold`}>{status.label}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className={`glass-panel p-6 rounded-2xl border-l-4 ${isDanger ? 'border-l-red-500' : 'border-l-emerald-500'}`}>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Unit Status</h3>
                        <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-full ${isDanger ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                {isDanger ? <AlertTriangle size={32} /> : isOffline ? <WifiOff size={32}/> : <CheckCircle size={32} />}
                            </div>
                            <div>
                                <div className={`text-xl font-bold font-mono ${isDanger ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {isDanger ? 'MALFUNCTION' : isOffline ? 'NO SIGNAL' : 'OPERATIONAL'}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                    {isDanger ? 'Check pump pressure and fuel supply.' : 'System running within normal parameters.'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Telemetry Data</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                <div className="text-[10px] text-slate-500 uppercase">Pressure</div>
                                <div className="text-lg font-mono font-bold text-white">{sensor.telemetry.pressure} bar</div>
                            </div>
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                <div className="text-[10px] text-slate-500 uppercase">Flow Rate</div>
                                <div className="text-lg font-mono font-bold text-white">{sensor.telemetry.flow} m³/h</div>
                            </div>
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                <div className="text-[10px] text-slate-500 uppercase">Efficiency</div>
                                <div className="text-lg font-mono font-bold text-emerald-400">94.2%</div>
                            </div>
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                <div className="text-[10px] text-slate-500 uppercase">Power</div>
                                <div className="text-lg font-mono font-bold text-amber-400">240 V</div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Remote Control</h3>
                        <div className="space-y-3">
                            <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all text-sm shadow-lg shadow-indigo-900/50 hover:shadow-indigo-900/80 active:scale-95">RESTART SYSTEM</button>
                            <button className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl transition-all text-sm border border-white/10 hover:border-white/20 active:scale-95">RUN DIAGNOSTICS</button>
                            <button className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl transition-all text-sm border border-red-500/20 hover:border-red-500/40 active:scale-95">EMERGENCY STOP</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}