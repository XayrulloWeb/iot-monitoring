import { useEffect, useState } from 'react';
import { Server } from 'lucide-react';
import { useSensorStore } from '../store/sensorStore';
import { useRegionStore } from '../store/regionStore';
import { useDeviceFilters } from '../hooks/useDeviceFilters';

// Components
import { DeviceFilterBar } from '../components/devices/DeviceFilterBar';
import { DeviceListTable } from '../components/devices/DeviceListTable';
import { AddDeviceModal } from '../components/provisioning/AddDeviceModal';
import { AddRegionModal } from '../components/ui/AddRegionModal';
import { AddDistrictModal } from '../components/ui/AddDistrictModal';

export default function DevicesPage() {
    // 1. Data Store
    const sensors = useSensorStore(state => state.sensors);
    const fetchSensors = useSensorStore(state => state.fetchSensors);
    const syncAllSensors = useSensorStore(state => state.syncAllSensors);

    const regions = useRegionStore(state => state.regions);
    const fetchRegions = useRegionStore(state => state.fetchRegions);

    // 2. Logic Hook (Filtering & Sorting)
    const filters = useDeviceFilters(sensors);

    // 3. UI State
    const [isSyncing, setIsSyncing] = useState(false);
    const [isProvisionOpen, setProvisionOpen] = useState(false);
    const [isRegionOpen, setRegionOpen] = useState(false);
    const [isDistrictOpen, setDistrictOpen] = useState(false);

    // Initial Load
    useEffect(() => {
        if (sensors.length === 0) fetchSensors();
        if (regions.length === 0) fetchRegions();
    }, []);

    const handleSync = async () => {
        setIsSyncing(true);
        await syncAllSensors();
        setIsSyncing(false);
    };

    return (
        <div className="p-6 h-full flex flex-col overflow-hidden">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-6 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold font-mono text-white mb-2 flex items-center gap-3">
                        <Server className="text-[var(--color-cool)]" /> SYSTEM UNITS
                    </h1>
                    <div className="text-sm text-[var(--text-muted)] font-mono flex gap-4">
                        <span>TOTAL: <b className="text-white">{sensors.length}</b></span>
                        <span className="text-[var(--color-success)]">ONLINE: <b>{sensors.filter(s => s.status === 'active').length}</b></span>
                        <span className="text-[var(--color-danger)]">ERRORS: <b>{sensors.filter(s => s.status === 'danger').length}</b></span>
                    </div>
                </div>

                {/* FILTERS & ACTIONS */}
                <DeviceFilterBar
                    search={filters.searchQuery}
                    onSearchChange={filters.setSearchQuery}
                    cityId={filters.cityId}
                    onCityChange={(val) => { filters.setCityId(val); filters.setDistrictId('all'); }}
                    districtId={filters.districtId}
                    onDistrictChange={filters.setDistrictId}
                    status={filters.statusFilter}
                    onStatusChange={filters.setStatusFilter}
                    onSync={handleSync}
                    isSyncing={isSyncing}
                    onAddDevice={() => setProvisionOpen(true)}
                    onAddRegion={() => setRegionOpen(true)}
                    onAddDistrict={() => setDistrictOpen(true)}
                />
            </div>

            {/* TABLE */}
            <DeviceListTable
                sensors={filters.filteredSensors}
                onSort={filters.handleSort}
            />

            {/* MODALS */}
            <AddDeviceModal isOpen={isProvisionOpen} onClose={() => setProvisionOpen(false)} />
            <AddRegionModal isOpen={isRegionOpen} onClose={() => setRegionOpen(false)} />
            <AddDistrictModal
                isOpen={isDistrictOpen}
                onClose={() => setDistrictOpen(false)}
                preselectedRegionId={filters.cityId !== 'all' ? filters.cityId : null}
            />
        </div>
    );
}