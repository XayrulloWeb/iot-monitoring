// src/hooks/useDeviceFilters.js
import { useState, useMemo } from 'react';

export function useDeviceFilters(sensors) {
    const [searchQuery, setSearchQuery] = useState('');
    const [cityId, setCityId] = useState('all');
    const [districtId, setDistrictId] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'lastUpdate', direction: 'desc' });

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const filteredSensors = useMemo(() => {
        if (!sensors) return [];
        let result = sensors;

        // 1. Поиск
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(s =>
                (s.name && s.name.toLowerCase().includes(q)) ||
                (s.id && String(s.id).toLowerCase().includes(q)) ||
                (s.serialNumber && s.serialNumber.toLowerCase().includes(q))
            );
        }

        // 2. Регион
        if (cityId !== 'all') {
            result = result.filter(s => String(s.cityId) === String(cityId));
        }

        // 3. Район
        if (districtId !== 'all') {
            result = result.filter(s => String(s.districtId) === String(districtId));
        }

        // 4. Статус
        if (statusFilter !== 'all') {
            result = result.filter(s => s.status === statusFilter);
        }

        // 5. Сортировка
        result = [...result].sort((a, b) => {
            let valA, valB;
            switch (sortConfig.key) {
                case 'name': valA = a.name; valB = b.name; break;
                case 't_out': valA = a.telemetry.t_out; valB = b.telemetry.t_out; break;
                case 't_in': valA = a.telemetry.t_in; valB = b.telemetry.t_in; break;
                case 'lastUpdate': valA = a.lastUpdate; valB = b.lastUpdate; break;
                default: valA = a.id; valB = b.id;
            }
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [sensors, searchQuery, cityId, districtId, statusFilter, sortConfig]);

    return {
        searchQuery, setSearchQuery,
        cityId, setCityId,
        districtId, setDistrictId,
        statusFilter, setStatusFilter,
        handleSort,
        filteredSensors
    };
}