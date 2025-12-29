import { format } from 'date-fns';

export function PopupContent({ sensor }) {
    return (
        <div className="p-4 w-64">
            <h3 className="font-bold text-lg mb-1">{sensor.location}</h3>
            <p className="text-xs text-[--text-muted] font-mono mb-2">{sensor.id}</p>
            <div className="text-sm space-y-1">
                {sensor.data.temp !== undefined && <div>Temp: <strong>{sensor.data.temp}°C</strong></div>}
                {sensor.data.hum !== undefined && <div>Humidity: <strong>{sensor.data.hum}%</strong></div>}
                {sensor.data.gas !== undefined && <div>Gas: <strong>{sensor.data.gas} ppm</strong></div>}
                {sensor.data.rad !== undefined && <div>Radiation: <strong>{sensor.data.rad} µSv/h</strong></div>}
            </div>
            <div className="border-t border-[--border] mt-3 pt-2 text-xs text-[--text-muted]">
                Last update: {format(sensor.lastUpdate, 'HH:mm:ss')}
            </div>
        </div>
    );
}