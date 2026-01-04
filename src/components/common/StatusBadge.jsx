import { WifiOff } from 'lucide-react';

export function StatusBadge({ status, isError }) {
    if (isError) {
        return (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border border-red-500/30 bg-red-500/10 text-red-500 whitespace-nowrap w-fit animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                SENSOR FAIL
            </div>
        );
    }
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
}