// src/components/layout/AssetPanel.jsx

import { X, MapPin, Building, Thermometer, Droplets } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useSensorStore } from '../../store/sensorStore';
import { ASSETS } from '../../lib/sensorData';

// Компонент для отображения отдельного датчика в списке
function SensorListItem({ sensor }) {
    return (
        <div className="flex items-center p-3 bg-[--surface-hover] rounded-lg">
            <div className="w-10 h-10 rounded-full bg-brand-blue/20 flex items-center justify-center mr-4">
                <Thermometer className="text-brand-blue" size={20}/>
            </div>
            <div className="flex-1">
                <p className="font-semibold text-sm">{sensor.id}</p>
                <p className="text-xs text-[--text-muted]">{sensor.locationName}</p>
            </div>
            <div className="text-right">
                <p className="font-mono font-bold">{sensor.data.temp}°C</p>
                <p className="text-xs text-[--text-muted] flex items-center justify-end gap-1">
                    <Droplets size={12}/> {sensor.data.hum}%
                </p>
            </div>
        </div>
    );
}

export function AssetPanel() {
    // --- ИСПРАВЛЕНИЕ ОШИБКИ БЕСКОНЕЧНОГО ЦИКЛА ---
    // Мы берем каждое значение ОТДЕЛЬНО. Это критически важно.
    // Нельзя писать useUIStore(state => ({ ... })), это ломает React.
    const selectedAssetId = useUIStore(state => state.selectedAssetId);
    const clearSelectedAsset = useUIStore(state => state.clearSelectedAsset);
    // ---------------------------------------------

    // Ищем объект по ID
    const asset = ASSETS.find(a => a.id === selectedAssetId);

    // Получаем датчики. Здесь фильтрация возвращает новый массив,
    // но Zustand достаточно умен, если массив sensors в сторе не меняется.
    const sensors = useSensorStore(state => state.sensors);
    const assetSensors = sensors.filter(s => s.assetId === selectedAssetId);

    // Панель видима только если мы нашли объект
    const isVisible = !!asset;

    return (
        <aside
            className={`w-96 h-screen glass-panel p-6 fixed top-0 right-0 z-10 
                       flex flex-col transform transition-transform duration-300 ease-in-out
                       ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}
        >
            {/* Если объект не выбран (asset === undefined), рендерим null, чтобы не было ошибок */}
            {!asset ? null : (
                <>
                    {/* Шапка */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-[--border]">
                        <div className="flex items-center gap-3">
                            <Building size={20} className="text-brand-blue"/>
                            <h2 className="text-xl font-bold">{asset.name}</h2>
                        </div>
                        <button
                            onClick={clearSelectedAsset}
                            className="p-2 rounded-full hover:bg-[--surface-hover] transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Контент */}
                    <div className="flex-1 overflow-y-auto space-y-6">
                        {/* Адрес */}
                        <div>
                            <p className="text-sm font-semibold mb-2">Адрес</p>
                            <div className="flex items-start gap-3 text-[--text-muted]">
                                <MapPin size={16} className="mt-0.5"/>
                                <span className="text-sm">{asset.address}</span>
                            </div>
                        </div>

                        {/* Список датчиков */}
                        <div>
                            <p className="text-sm font-semibold mb-3">Датчики ({assetSensors.length} шт.)</p>
                            <div className="space-y-2">
                                {assetSensors.map(sensor => (
                                    <SensorListItem key={sensor.id} sensor={sensor} />
                                ))}
                                {assetSensors.length === 0 && (
                                    <p className="text-sm text-[--text-muted]">Нет активных датчиков</p>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </aside>
    );
}