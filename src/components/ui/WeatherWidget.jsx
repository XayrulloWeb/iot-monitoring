// src/components/ui/WeatherWidget.jsx
import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind, Droplets, Loader2 } from 'lucide-react';

export function WeatherWidget({ lat = 41.2995, lng = 69.2401, cityName = "Tashkent" }) {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                // Используем Open-Meteo API (не требует ключа)
                const res = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`
                );
                const data = await res.json();

                setWeather({
                    temp: data.current.temperature_2m,
                    humidity: data.current.relative_humidity_2m,
                    wind: data.current.wind_speed_10m,
                    code: data.current.weather_code
                });
            } catch (err) {
                console.error("Weather fetch failed", err);
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
        // Обновляем раз в 10 минут
        const interval = setInterval(fetchWeather, 600000);
        return () => clearInterval(interval);
    }, [lat, lng]);

    if (loading) {
        return (
            <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-4 border border-white/5 h-[60px] w-[200px] justify-center">
                <Loader2 className="animate-spin text-slate-500" size={20} />
            </div>
        );
    }

    // Интерпретация WMO кодов погоды
    const isRain = weather.code >= 51 && weather.code <= 67;
    const isCloudy = weather.code > 3;
    const Icon = isRain ? CloudRain : isCloudy ? Cloud : Sun;
    const iconColor = isRain ? 'text-blue-400' : isCloudy ? 'text-slate-300' : 'text-amber-400';

    return (
        <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-4 border border-white/5">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-white/5 ${iconColor}`}>
                    <Icon size={20} />
                </div>
                <div>
                    <div className="text-xl font-bold font-mono text-white leading-none">
                        {weather.temp}°C
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold tracking-wider uppercase truncate max-w-[80px]">
                        {cityName}
                    </div>
                </div>
            </div>

            <div className="w-[1px] h-8 bg-white/10"></div>

            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <Wind size={10} />
                    <span className="font-mono">{weather.wind} km/h</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <Droplets size={10} />
                    <span className="font-mono">{weather.humidity}%</span>
                </div>
            </div>
        </div>
    );
}