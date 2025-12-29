// src/pages/MapPage.jsx

import { useRef, useEffect, useCallback, useState } from "react";
import { createRoot } from "react-dom/client";
import { Map, Popup, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useUIStore } from "../store/uiStore";
import { useSensorStore } from "../store/sensorStore";
import { ASSETS } from "../lib/sensorData";

const MAP_API_KEY = "GWgqgaHGL6LiYlf1JeDi";

// ---- Рендер попапа ----
function SensorPopup({ sensor }) {
    return (
        <div className="p-4 w-72 text-[--text-main]">
            <h3 className="font-bold text-lg mb-1">{sensor.locationName}</h3>
            <p className="text-xs text-[--text-muted] font-mono mb-3">ID: {sensor.id}</p>

            <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                <div>
                    <div className="text-xs text-[--text-muted]">Температура</div>
                    <div className="text-2xl font-bold text-brand-blue">{sensor.data.temp}°C</div>
                </div>
                <div>
                    <div className="text-xs text-[--text-muted]">Влажность</div>
                    <div className="text-2xl font-bold text-brand-green">{sensor.data.hum}%</div>
                </div>
            </div>
        </div>
    );
}

export default function MapPage() {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const assetMarkers = useRef([]);
    const lastCamera = useRef(null);
    const [isMapLoaded, setIsMapLoaded] = useState(false);

    // Стор
    const sensors = useSensorStore((s) => s.sensors);
    const theme = useUIStore((s) => s.theme);
    const selectedAssetId = useUIStore((s) => s.selectedAssetId);
    const selectAsset = useUIStore((s) => s.selectAsset);

    // --- Конвертация сенсоров в GeoJSON ---
    const sensorsToGeoJSON = useCallback(
        (sensorsData) => ({
            type: "FeatureCollection",
            features: sensorsData.map((sensor) => ({
                type: "Feature",
                properties: { properties: JSON.stringify(sensor) },
                geometry: { type: "Point", coordinates: sensor.coords },
            })),
        }),
        []
    );

    // === 1. ИНИЦИАЛИЗАЦИЯ КАРТЫ ===
    useEffect(() => {
        if (map.current || !mapContainer.current) return;

        const initialTheme = theme === "light" ? "streets-v2" : "dataviz-dark";

        const newMap = new Map({
            container: mapContainer.current,
            style: `https://api.maptiler.com/maps/${initialTheme}/style.json?key=${MAP_API_KEY}`,
            center: [60.64, 41.56],
            zoom: 13.2,
            pitch: 50,           // чуть больше наклон
            bearing: -14,        // легкий поворот
            antialias: true,
            attributionControl: false,
        });

        map.current = newMap;

        newMap.on("load", () => {
            // ---- 3D здания ----
            if (!newMap.getSource("openmaptiles")) {
                newMap.addSource("openmaptiles", {
                    url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${MAP_API_KEY}`,
                    type: "vector",
                });
            }

            const layers = newMap.getStyle().layers;
            const labelLayerId = layers.find(
                (l) => l.type === "symbol" && l.layout["text-field"]
            )?.id;

            newMap.addLayer(
                {
                    id: "3d-buildings",
                    source: "openmaptiles",
                    "source-layer": "building",
                    type: "fill-extrusion",
                    minzoom: 13,
                    paint: {
                        "fill-extrusion-color":
                            theme === "light" ? "#b8b8b8" : "#334155",
                        "fill-extrusion-height": [
                            "interpolate",
                            ["linear"],
                            ["zoom"],
                            13,
                            0,
                            16,
                            ["get", "render_height"],
                        ],
                        "fill-extrusion-base": ["get", "render_min_height"],
                        "fill-extrusion-opacity": 0.9,
                    },
                },
                labelLayerId
            );

            // ---- Сенсоры ----
            newMap.addSource("sensors", {
                type: "geojson",
                data: { type: "FeatureCollection", features: [] },
            });

            newMap.addLayer({
                id: "sensors-points",
                type: "circle",
                source: "sensors",
                layout: { visibility: "none" },
                paint: {
                    "circle-color": "#00ff87",
                    "circle-radius": 6,
                    "circle-stroke-width": 2,
                    "circle-stroke-color": "#ffffff",
                    "circle-opacity": 0.9,
                },
            });

            // ---- Попапы ----
            newMap.on("click", "sensors-points", (e) => {
                const feature = e.features?.[0];
                if (!feature) return;

                const sensor = JSON.parse(feature.properties.properties);
                const popupNode = document.createElement("div");
                createRoot(popupNode).render(<SensorPopup sensor={sensor} />);

                new Popup({ className: "glass-popup", closeButton: false })
                    .setLngLat(feature.geometry.coordinates)
                    .setDOMContent(popupNode)
                    .addTo(newMap);
            });

            newMap.on("mouseenter", "sensors-points", () => {
                newMap.getCanvas().style.cursor = "pointer";
            });
            newMap.on("mouseleave", () => {
                newMap.getCanvas().style.cursor = "";
            });

            setIsMapLoaded(true);
        });

        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, []);

    // === 2. КОНТЕНТ БЕЗ "ПРЫЖКОВ" КАМЕРЫ ===
    useEffect(() => {
        if (!isMapLoaded || !map.current) return;

        const m = map.current;

        // Удаляем старые маркеры
        assetMarkers.current.forEach((m) => m.remove());
        assetMarkers.current = [];

        const sensorSource = m.getSource("sensors");
        if (!sensorSource) return;

        if (selectedAssetId) {
            // ---- ФОКУС НА ОБЪЕКТ ----
            const filtered = sensors.filter((s) => s.assetId === selectedAssetId);
            sensorSource.setData(sensorsToGeoJSON(filtered));
            m.setLayoutProperty("sensors-points", "visibility", "visible");

            const asset = ASSETS.find((a) => a.id === selectedAssetId);
            if (asset) {
                m.easeTo({
                    center: asset.coords,
                    zoom: 17.5,
                    pitch: 65,
                    bearing: -14,
                    duration: 800,
                });
            }
        } else {
            // ---- ОБЩИЙ РЕЖИМ — БЕЗ АВТОКАМЕРЫ! ----
            sensorSource.setData({ type: "FeatureCollection", features: [] });
            m.setLayoutProperty("sensors-points", "visibility", "none");

            ASSETS.forEach((asset) => {
                const el = document.createElement("div");
                el.className = "marker";
                el.style.cssText = `
                    width: 38px;
                    height: 38px;
                    background:#00aaff;
                    border-radius:50%;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    color:white;
                    cursor:pointer;
                    box-shadow:0 0 20px rgba(0,170,255,0.6);
                    transition:transform .2s;
                `;
                el.innerHTML =
                    '<svg width="20" height="20" stroke="currentColor" fill="none" stroke-width="2"><path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-4h8v4"/></svg>';

                el.onclick = () => selectAsset(asset.id);

                const marker = new Marker({ element: el })
                    .setLngLat(asset.coords)
                    .addTo(m);

                assetMarkers.current.push(marker);
            });
        }
    }, [selectedAssetId, isMapLoaded, sensors, sensorsToGeoJSON]);

    // === 3. СМЕНА ТЕМЫ БЕЗ ОТСКОКА ===
    useEffect(() => {
        if (!isMapLoaded || !map.current) return;

        const m = map.current;

        lastCamera.current = {
            center: m.getCenter(),
            zoom: m.getZoom(),
            pitch: m.getPitch(),
            bearing: m.getBearing(),
        };

        const styleTheme = theme === "light" ? "streets-v2" : "dataviz-dark";

        m.setStyle(
            `https://api.maptiler.com/maps/${styleTheme}/style.json?key=${MAP_API_KEY}`
        );

        m.once("styledata", () => {
            if (!m.getSource("openmaptiles")) {
                m.addSource("openmaptiles", {
                    url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${MAP_API_KEY}`,
                    type: "vector",
                });
            }

            m.addLayer({
                id: "3d-buildings",
                source: "openmaptiles",
                "source-layer": "building",
                type: "fill-extrusion",
                minzoom: 13,
                paint: {
                    "fill-extrusion-color":
                        theme === "light" ? "#bbb" : "#334155",
                    "fill-extrusion-height": ["get", "render_height"],
                    "fill-extrusion-base": ["get", "render_min_height"],
                    "fill-extrusion-opacity": 0.9,
                },
            });

            m.jumpTo({
                center: lastCamera.current.center,
                zoom: lastCamera.current.zoom,
                pitch: lastCamera.current.pitch,
                bearing: lastCamera.current.bearing,
            });
        });
    }, [theme]);

    return (
        <div className="w-full h-full p-6 relative">
            <div
                ref={mapContainer}
                className="w-full h-full rounded-2xl overflow-hidden shadow-2xl relative"
            />

            {!isMapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-[--bg-app] z-50">
                    <span className="text-brand-blue font-mono animate-pulse">
                        Загрузка карты...
                    </span>
                </div>
            )}
        </div>
    );
}
