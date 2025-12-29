import { createContext, useState, useEffect, useContext } from 'react';

// --- ИМИТАЦИЯ ДАННЫХ ---
// Создадим 30 датчиков, распределенных по 3 локациям
const generateInitialSensors = () => {
    const sensors = [];
    const locations = [
        { name: 'Склад №1 (Холодильники)', coords: [60.6333, 41.5514], tempRange: [2, 5] },
        { name: 'Тепличный комплекс "Агро"', coords: [60.6510, 41.5600], tempRange: [22, 26] },
        { name: 'Серверная комната', coords: [60.6200, 41.5350], tempRange: [18, 22] },
    ];

    let idCounter = 1;
    locations.forEach(loc => {
        for (let i = 0; i < 10; i++) {
            const baseTemp = loc.tempRange[0] + Math.random() * (loc.tempRange[1] - loc.tempRange[0]);
            sensors.push({
                id: `a1tech_${String(idCounter++).padStart(2, '0')}`,
                locationName: loc.name,
                type: 'DHT22',
                coords: [
                    loc.coords[0] + (Math.random() - 0.5) * 0.0005, // Небольшой разброс координат
                    loc.coords[1] + (Math.random() - 0.5) * 0.0005,
                ],
                data: {
                    temp: parseFloat(baseTemp.toFixed(1)),
                    hum: parseFloat((40 + Math.random() * 15).toFixed(1)),
                },
                status: 'good',
                // История показаний: { timestamp, value }
                history: [{ timestamp: Date.now(), value: parseFloat(baseTemp.toFixed(1)) }],
                lastUpdate: Date.now(),
            });
        }
    });
    return sensors;
};

const SensorContext = createContext();
export const useSensors = () => useContext(SensorContext);

export const SensorProvider = ({ children }) => {
    const [sensors, setSensors] = useState(generateInitialSensors());

    useEffect(() => {
        const interval = setInterval(() => {
            setSensors(prevSensors => prevSensors.map(s => {
                // Имитация небольших колебаний температуры
                const tempChange = (Math.random() - 0.5) * 0.2;
                const newTemp = parseFloat((s.data.temp + tempChange).toFixed(1));

                // Добавляем новую запись в историю, сохраняя последние 20 записей
                const newHistory = [{ timestamp: Date.now(), value: newTemp }, ...s.history].slice(0, 20);

                return {
                    ...s,
                    data: { ...s.data, temp: newTemp },
                    history: newHistory,
                    lastUpdate: Date.now(),
                };
            }));
        }, 5000); // Обновляем каждые 5 секунд

        return () => clearInterval(interval);
    }, []);

    return <SensorContext.Provider value={{ sensors }}>{children}</SensorContext.Provider>;
};