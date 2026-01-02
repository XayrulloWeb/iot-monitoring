// src/pages/MapPage.jsx
import { useRef, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Map, Popup, Marker } from "maplibre-gl";
import maplibre from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useUIStore } from "../store/uiStore";
import { useSensorStore } from "../store/sensorStore";
import { Flame, AlertTriangle, WifiOff, MapPin, Activity, ArrowRight } from 'lucide-react';

const MAP_API_KEY = import.meta.env.VITE_MAP_API_KEY || "GWgqgaHGL6LiYlf1JeDi";

// ---- HUD POPUP (Всплывающее окно) ----
function BoilerPopup({ sensor }) {
    const isDanger = sensor.status === 'danger';
    const isOffline = sensor.status === 'offline';

    const tempOutGradient = isDanger
        ? "text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-600"
        : "text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500";

    const tempInGradient = "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500";

    return (
        <div className="w-80 glass-panel p-0 overflow-hidden shadow-2xl backdrop-blur-xl border border-white/10 rounded-2xl font-sans select-none">
            {/* ШАПКА ПОПАПА */}
            <div className={`px-5 py-3 border-b border-white/5 flex justify-between items-center
                ${isDanger ? 'bg-red-500/10' : 'bg-blue-500/5'}`}>

                <div>
                    <h3 className="font-bold text-white text-sm tracking-wide">{sensor.name}</h3>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                        <MapPin size={10} /> {sensor.address}
                    </div>
                </div>

                <div className={`p-1.5 rounded-lg ${isDanger ? 'bg-red-500 text-white' : isOffline ? 'bg-slate-700 text-slate-300' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {isDanger ? <AlertTriangle size={14}/> : isOffline ? <WifiOff size={14}/> : <Activity size={14}/>}
                </div>
            </div>

            {/* ТЕЛО ПОПАПА */}
            <div className="p-5">
                <div className="flex justify-between items-center gap-4 mb-4">
                    {/* ПОДАЧА */}
                    <div className="text-center flex-1 p-2 rounded-xl bg-white/5 border border-white/5">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Feed (Out)</div>
                        <div className={`text-2xl font-bold font-mono ${tempOutGradient}`}>
                            {isOffline ? '--' : parseFloat(sensor.telemetry.t_out || 0).toFixed(1)}°
                        </div>
                    </div>

                    {/* РАЗДЕЛИТЕЛЬ */}
                    <div className="h-8 w-[1px] bg-white/10"></div>

                    {/* ОБРАТКА */}
                    <div className="text-center flex-1 p-2 rounded-xl bg-white/5 border border-white/5">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Return (In)</div>
                        <div className={`text-2xl font-bold font-mono ${tempInGradient}`}>
                            {isOffline ? '--' : parseFloat(sensor.telemetry.t_in || 0).toFixed(1)}°
                        </div>
                    </div>
                </div>

                {/* НИЖНЯЯ ПАНЕЛЬ С КНОПКОЙ */}
                <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                    <div className="text-[10px] text-slate-500 font-mono">
                        UPD: {new Date(sensor.lastUpdate).toLocaleTimeString()}
                    </div>

                    {/* КНОПКА ПЕРЕХОДА (Обычная ссылка, так как мы вне роутера) */}
                    <a
                        href={`/devices/${sensor.id}`}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white
                                  text-xs font-bold rounded-lg transition-all group border border-indigo-500/20 hover:border-indigo-500 cursor-pointer"
                    >
                        FULL DETAILS
                        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform"/>
                    </a>
                </div>
            </div>

            {/* ЦВЕТНАЯ ПОЛОСКА СНИЗУ */}
            <div className={`h-1 w-full ${isDanger ? 'bg-red-500' : isOffline ? 'bg-slate-600' : 'bg-emerald-500'}`}></div>
        </div>
    );
}

// ---- МАРКЕР (ИКОНКА НА КАРТЕ) ----
function BoilerMarker({ sensor }) {
    const isDanger = sensor.status === 'danger';
    const isOffline = sensor.status === 'offline';

    // Цвета
    const glowColor = isDanger ? 'shadow-[0_0_20px_#ef4444]' : isOffline ? 'shadow-none' : 'shadow-[0_0_15px_#10b981]';
    const bgColor = isDanger ? 'bg-red-600' : isOffline ? 'bg-slate-600' : 'bg-emerald-500';

    return (
        // Добавили !cursor-pointer и pointer-events-auto для надежности
        <div className="relative group cursor-pointer pointer-events-auto hover:z-50" style={{ cursor: 'pointer' }}>
            {/* Пульсирующая волна для аварий */}
            {isDanger && (
                <div className="absolute -inset-6 bg-red-500/30 rounded-full animate-ping opacity-75 pointer-events-none"></div>
            )}

            {/* Сам маркер - увеличиваем зону клика */}
            <div className={`relative w-10 h-10 rounded-full flex items-center justify-center 
                             border-2 border-white ${bgColor} ${glowColor} 
                             transition-all duration-200 hover:scale-110 z-10`}>
                {isDanger ? <Flame size={18} className="text-white animate-pulse"/> :
                    isOffline ? <WifiOff size={18} className="text-white/50"/> :
                        <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_5px_white]"></div>}
            </div>

            {/* Ножка маркера */}
            <div className="absolute top-9 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-gradient-to-b from-white/50 to-transparent pointer-events-none"></div>
            <div className="absolute top-12 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-black/50 blur-[2px] rounded-full pointer-events-none"></div>

            {/* Тултип (Название) */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5
                            bg-slate-900/90 backdrop-blur border border-white/10 rounded-lg whitespace-nowrap
                            opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none
                            text-xs text-white font-medium shadow-xl translate-y-2 group-hover:translate-y-0 z-20">
                {sensor.name}
            </div>
        </div>
    );
}

export default function MapPage() {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const boilerMarkers = useRef([]);
    const [isMapLoaded, setIsMapLoaded] = useState(false);

    const sensors = useSensorStore((s) => s.sensors);
    const fetchSensors = useSensorStore((s) => s.fetchSensors);
    const selectedCity = useSensorStore((s) => s.selectedCity || 'all');
    const selectedDistrict = useSensorStore((s) => s.selectedDistrict || 'all');

    // Загружаем данные при монтировании, если их еще нет
    useEffect(() => {
        if (sensors.length === 0) {
            fetchSensors();
        }
    }, [sensors.length, fetchSensors]);

    useEffect(() => {
        if (map.current || !mapContainer.current) return;

        const newMap = new Map({
            container: mapContainer.current,
            style: `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${MAP_API_KEY}`,
            center: [69.2401, 41.2995],
            zoom: 11,
            pitch: 60,
            bearing: -15,
            antialias: true,
            attributionControl: false,
        });

        map.current = newMap;

        newMap.on("load", () => {
            // --- 3D ЗДАНИЯ ---
            if (!newMap.getSource("openmaptiles")) {
                newMap.addSource("openmaptiles", {
                    url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${MAP_API_KEY}`,
                    type: "vector",
                });
            }

            const layers = newMap.getStyle().layers;
            const labelLayerId = layers.find((l) => l.type === "symbol" && l.layout["text-field"])?.id;

            if (!newMap.getLayer("3d-buildings")) {
                newMap.addLayer({
                    id: "3d-buildings",
                    source: "openmaptiles",
                    "source-layer": "building",
                    type: "fill-extrusion",
                    minzoom: 13,
                    paint: {
                        "fill-extrusion-color": "#1e293b",
                        "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 13, 0, 16, ["get", "render_height"]],
                        "fill-extrusion-base": ["get", "render_min_height"],
                        "fill-extrusion-opacity": 0.8,
                    },
                }, labelLayerId);
            }

            setIsMapLoaded(true);
        });

        return () => {
            // Очищаем все маркеры перед удалением карты
            boilerMarkers.current.forEach(({ marker, root }) => {
                try {
                    if (marker._popup) {
                        marker._popup.remove();
                        if (marker._popupRoot) {
                            marker._popupRoot.unmount();
                        }
                    }
                    marker.remove();
                    if (root) {
                        root.unmount();
                    }
                } catch (err) {
                    // Игнорируем ошибки при очистке
                }
            });
            boilerMarkers.current = [];
            
            map.current?.remove();
            map.current = null;
            setIsMapLoaded(false);
        };
    }, []);

    // Обновление маркеров
    useEffect(() => {
        if (!isMapLoaded || !map.current) return;

        // Удаляем старые маркеры и их React roots
        boilerMarkers.current.forEach(({ marker, root }) => {
            try {
                // Закрываем попап если есть и очищаем его React root
                if (marker._popup) {
                    marker._popup.remove();
                    if (marker._popupRoot) {
                        marker._popupRoot.unmount();
                    }
                    marker._popup = null;
                    marker._popupRoot = null;
                }
                // Удаляем маркер
                marker.remove();
                // Очищаем React root маркера
                if (root) {
                    root.unmount();
                }
            } catch (err) {
                console.warn("Error removing marker:", err);
            }
        });
        boilerMarkers.current = [];

        // Фильтруем и проверяем координаты
        const filteredSensors = sensors.filter(s => {
            // Проверяем координаты - они должны быть валидными
            if (!s.coords || !Array.isArray(s.coords) || s.coords.length !== 2) {
                console.warn(`Sensor ${s.id} has invalid coordinates:`, s.coords);
                return false;
            }
            const [lng, lat] = s.coords;
            if (isNaN(lng) || isNaN(lat) || lng === 0 || lat === 0) {
                console.warn(`Sensor ${s.id} has invalid coordinates:`, s.coords);
                return false;
            }
            
            // Фильтруем по региону и району
            return (
                (selectedCity === 'all' || String(s.cityId) === String(selectedCity)) &&
                (selectedDistrict === 'all' || String(s.districtId) === String(selectedDistrict))
            );
        });

        // Логируем только для отладки (можно убрать в продакшене)
        if (filteredSensors.length === 0 && sensors.length > 0) {
            console.warn(`MapPage: No sensors to display. Filters: city=${selectedCity}, district=${selectedDistrict}`);
        }

        // Создаем новые маркеры
        filteredSensors.forEach((sensor) => {
            try {
                const el = document.createElement("div");
                el.style.cursor = "pointer";
                el.style.width = "40px";
                el.style.height = "40px";

                // Рендерим React-компонент в DOM-элемент
                const root = createRoot(el);
                root.render(<BoilerMarker sensor={sensor} />);

                const marker = new Marker({ 
                    element: el,
                    anchor: 'bottom'
                })
                    .setLngLat(sensor.coords)
                    .addTo(map.current);

                // ОБРАБОТЧИК КЛИКА
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();

                    // Закрываем все существующие попапы и очищаем их React roots
                    boilerMarkers.current.forEach(({ marker: m }) => {
                        if (m._popup) {
                            m._popup.remove();
                            if (m._popupRoot) {
                                m._popupRoot.unmount();
                            }
                            m._popup = null;
                            m._popupRoot = null;
                        }
                    });

                    // Создаем контейнер для попапа
                    const popupNode = document.createElement("div");
                    const popupRoot = createRoot(popupNode);
                    popupRoot.render(<BoilerPopup sensor={sensor} />);

                    const popup = new Popup({
                        className: "custom-popup",
                        closeButton: false,
                        maxWidth: 'none',
                        offset: 35,
                        closeOnClick: true
                    })
                        .setLngLat(sensor.coords)
                        .setDOMContent(popupNode)
                        .addTo(map.current);

                    // Сохраняем ссылку на попап для очистки
                    marker._popup = popup;
                    marker._popupRoot = popupRoot;
                });

                boilerMarkers.current.push({ marker, root });
            } catch (err) {
                console.error(`Failed to create marker for sensor ${sensor.id}:`, err);
            }
        });

        // Автозум убран - пользователь сам управляет картой

    }, [isMapLoaded, sensors, selectedCity, selectedDistrict]);

    return (
        <div className="w-full h-full p-6 relative flex flex-col">
            <div className="mb-4 flex items-end justify-between shrink-0">
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                    <MapPin className="text-indigo-500" /> GEOSPATIAL VIEW
                </h2>
                <div className="text-xs text-slate-500 font-mono">
                    LIVE SATELLITE FEED • <span className="text-emerald-500">CONNECTED</span>
                </div>
            </div>

            <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0b0f19]">
                <div ref={mapContainer} className="w-full h-full" />

                {!isMapLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#030712] z-50">
                        <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                        <span className="text-indigo-400 font-mono text-sm tracking-widest animate-pulse">
                            INITIALIZING SATELLITE LINK...
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}