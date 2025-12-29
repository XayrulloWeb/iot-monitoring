import { Thermometer, Zap, AlertTriangle } from 'lucide-react';

const statusClasses = {
    good: 'text-brand-green',
    warning: 'text-brand-yellow',
    danger: 'text-brand-red',
    offline: 'text-[--text-muted]',
};

export function SensorMarker({ sensor }) {
    return (
        <div className="relative group cursor-pointer transform transition-transform hover:-translate-y-2 hover:scale-110">
            {sensor.status === 'danger' && <div className="absolute -inset-2 bg-brand-red rounded-full opacity-75 animate-ping"></div>}
            <div className="relative drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
                <svg viewBox="0 0 24 24" fill="currentColor" className={`w-10 h-10 ${statusClasses[sensor.status]}`}>
                    <path d="M12 2C7.58 2 4 5.58 4 10C4 14.42 12 22 12 22C12 22 20 14.42 20 10C20 5.58 16.42 2 12 2Z" />
                </svg>
                <div className="absolute top-2.5 left-1/2 transform -translate-x-1/2 text-black dark:text-[--bg-app]">
                    {sensor.type === 'DHT22' && <Thermometer size={12} />}
                    {sensor.type === 'MQ-4' && <Zap size={12} />}
                    {sensor.type === 'GM-5' && <AlertTriangle size={12} />}
                </div>
            </div>
        </div>
    );
}