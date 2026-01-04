import { useNavigate } from 'react-router-dom';
import { ArrowUpDown, Hash, MapPin } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';
import { StatusBadge } from '../common/StatusBadge';
import { Temperature } from '../common/Temperature';
import { FormattedDate } from '../common/FormattedDate'; // <--- Импортируем

export function DeviceListTable({ sensors, onSort }) {
    const navigate = useNavigate();

    const RowContent = (index, sensor) => {
        const isError = sensor.telemetry.t_out <= -127 || sensor.telemetry.t_in <= -127;

        return (
            <div
                onClick={() => navigate(`/devices/${sensor.id}`)}
                className="flex items-center border-b border-[var(--border-color)]/50 hover:bg-white/5 transition-colors cursor-pointer group box-border h-[72px]"
            >
                {/* Status */}
                <div className="px-4 w-24 flex items-center shrink-0">
                    <StatusBadge status={sensor.status} isError={isError} />
                </div>

                {/* Serial */}
                <div className="px-4 w-32 shrink-0">
                    <div className="text-[11px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20 whitespace-nowrap w-fit flex items-center gap-1">
                        <Hash size={10} className="opacity-50"/> {sensor.serialNumber}
                    </div>
                </div>

                {/* Name */}
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
                    <div className="text-xl font-mono font-bold">
                        <Temperature value={sensor.status === 'offline' ? undefined : sensor.telemetry.t_out} className="text-[var(--color-heat)]" />
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase">Feed</div>
                </div>

                {/* Return Temp */}
                <div className="px-4 w-28 text-right shrink-0">
                    <div className="text-xl font-mono font-bold">
                        <Temperature value={sensor.status === 'offline' ? undefined : sensor.telemetry.t_in} className="text-[var(--color-cool)]" />
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase">Return</div>
                </div>

                {/* Updated (ЗДЕСЬ ЮЗАЕМ НОВЫЙ КОМПОНЕНТ) */}
                <div className="px-4 w-32 text-right shrink-0">
                    <div className="text-sm text-[var(--text-main)]">
                        <FormattedDate date={sensor.lastUpdate} formatStr="HH:mm:ss" />
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">
                        <FormattedDate date={sensor.lastUpdate} formatStr="dd MMM" className="text-[var(--text-muted)]" />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] backdrop-blur-sm relative overflow-hidden flex flex-col">
            {/* Header */}
            <div className="h-12 bg-[#02040a]/80 border-b border-[var(--border-color)] flex items-center text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider z-10 shrink-0">
                <div className="px-4 w-24">Status</div>
                <div className="px-4 w-32">Serial No</div>
                <div className="px-4 flex-1 cursor-pointer hover:text-white flex items-center gap-1" onClick={() => onSort('name')}>
                    Unit Info <ArrowUpDown size={10} />
                </div>
                <div className="px-4 w-28 text-right cursor-pointer hover:text-white flex items-center justify-end gap-1" onClick={() => onSort('t_out')}>
                    Feed <ArrowUpDown size={10} />
                </div>
                <div className="px-4 w-28 text-right cursor-pointer hover:text-white flex items-center justify-end gap-1" onClick={() => onSort('t_in')}>
                    Return <ArrowUpDown size={10} />
                </div>
                <div className="px-4 w-32 text-right cursor-pointer hover:text-white flex items-center justify-end gap-1" onClick={() => onSort('lastUpdate')}>
                    Updated <ArrowUpDown size={10} />
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 bg-[#02040a]">
                {!sensors || sensors.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-[var(--text-muted)]">NO UNITS FOUND</div>
                ) : (
                    <Virtuoso
                        style={{ height: '100%' }}
                        data={sensors}
                        itemContent={RowContent}
                        overscan={200}
                    />
                )}
            </div>
        </div>
    );
}