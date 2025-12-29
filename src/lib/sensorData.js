// src/lib/sensorData.js

export const CITIES = [
    {
        id: 'tashkent',
        name: 'Tashkent',
        coords: [41.2995, 69.2401],
        districts: [
            { id: 'yunusabad', name: 'Yunusabad', latOffset: 0.05, lngOffset: -0.01 },
            { id: 'chilanzar', name: 'Chilanzar', latOffset: -0.03, lngOffset: -0.04 },
            { id: 'sergeli', name: 'Sergeli', latOffset: -0.06, lngOffset: 0.01 },
            { id: 'mirzo', name: 'M. Ulugbek', latOffset: 0.02, lngOffset: 0.03 },
        ],
    },
    {
        id: 'samarkand',
        name: 'Samarkand',
        coords: [39.6542, 66.9597],
        districts: [
            { id: 'registan', name: 'Registan', latOffset: 0.005, lngOffset: 0.005 },
            { id: 'siyob', name: 'Siyob', latOffset: 0.02, lngOffset: 0.02 },
        ],
    },
    {
        id: 'bukhara',
        name: 'Bukhara',
        coords: [39.7681, 64.4556],
        districts: [
            { id: 'oldcity', name: 'Old City', latOffset: 0.0, lngOffset: 0.0 },
            { id: 'kagan', name: 'Kagan', latOffset: -0.05, lngOffset: 0.03 },
        ],
    },
];

// =======================
// STATIC GENERATOR
// =======================

export const generateMockSensors = () => {
    const createHistory = (baseOut, baseIn) => {
        const now = Date.now();
        return Array.from({ length: 20 }, (_, i) => ({
            time: new Date(now - (19 - i) * 5 * 60000).toISOString(),
            t_out: parseFloat((baseOut + Math.sin(i) * 2).toFixed(1)),
            t_in: parseFloat((baseIn + Math.cos(i)).toFixed(1))
        }));
    };

    return [
        {
            id: 'KOT-101',
            name: 'Boiler-TASH-1',
            serialNumber: '84920-11029', // Новый формат
            cityId: 'tashkent',
            cityName: 'Tashkent',
            districtId: 'yunusabad',
            districtName: 'Yunusabad',
            address: 'Yunusabad, st. 12',
            coords: [41.3495, 69.2301],
            status: 'active',
            lastUpdate: Date.now(),
            telemetry: { t_out: 82.5, t_in: 63.0, pressure: 5.2, flow: 180.0 },
            history: createHistory(82, 63),
        },
        {
            id: 'KOT-102',
            name: 'Boiler-TASH-2',
            serialNumber: '11234-55821', // Новый формат
            cityId: 'tashkent',
            cityName: 'Tashkent',
            districtId: 'chilanzar',
            districtName: 'Chilanzar',
            address: 'Chilanzar, st. 45',
            coords: [41.2695, 69.2001],
            status: 'active',
            lastUpdate: Date.now(),
            telemetry: { t_out: 68.0, t_in: 52.0, pressure: 4.9, flow: 165.0 },
            history: createHistory(68, 52),
        },
        {
            id: 'KOT-103',
            name: 'Boiler-SAM-1',
            serialNumber: '99881-00293', // Новый формат
            cityId: 'samarkand',
            cityName: 'Samarkand',
            districtId: 'registan',
            districtName: 'Registan',
            address: 'Registan sq.',
            coords: [39.6592, 66.9647],
            status: 'danger',
            lastUpdate: Date.now(),
            telemetry: { t_out: 45.0, t_in: 40.0, pressure: 3.2, flow: 110.0 },
            history: createHistory(45, 40),
        },
        {
            id: 'KOT-104',
            name: 'Boiler-BUK-1',
            serialNumber: '00000-11111', // Новый формат
            cityId: 'bukhara',
            cityName: 'Bukhara',
            districtId: 'oldcity',
            districtName: 'Old City',
            address: 'Old City, Lyabi-Hauz',
            coords: [39.7681, 64.4556],
            status: 'offline',
            lastUpdate: Date.now() - 1000 * 60 * 240,
            telemetry: { t_out: 0, t_in: 0, pressure: 0, flow: 0 },
            history: [],
        },
        {
            id: 'KOT-105',
            name: 'Boiler-TASH-3',
            serialNumber: '77331-22991', // Новый формат
            cityId: 'tashkent',
            cityName: 'Tashkent',
            districtId: 'sergeli',
            districtName: 'Sergeli',
            address: 'Sergeli-8, building 14',
            coords: [41.2195, 69.2201],
            status: 'active',
            lastUpdate: Date.now(),
            telemetry: { t_out: 88.0, t_in: 65.0, pressure: 5.5, flow: 195.0 },
            history: createHistory(88, 65),
        },
        {
            id: 'KOT-106',
            name: 'Boiler-SAM-2',
            serialNumber: '22114-88442', // Новый формат
            cityId: 'samarkand',
            cityName: 'Samarkand',
            districtId: 'siyob',
            districtName: 'Siyob',
            address: 'Siyob bazaar area',
            coords: [39.6742, 66.9797],
            status: 'active',
            lastUpdate: Date.now(),
            telemetry: { t_out: 75.0, t_in: 58.0, pressure: 5.0, flow: 150.0 },
            history: createHistory(75, 58),
        },
    ];
};