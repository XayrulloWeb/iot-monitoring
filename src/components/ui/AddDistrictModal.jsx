// src/components/ui/AddDistrictModal.jsx
import { useState, useEffect } from 'react';
import { MapPin, Loader2, ChevronDown } from 'lucide-react';
import { Modal } from './Modal';
import { useRegionStore } from '../../store/regionStore';

export function AddDistrictModal({ isOpen, onClose, preselectedRegionId = null }) {
    const [name, setName] = useState('');
    const [regionId, setRegionId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    const regions = useRegionStore(state => state.regions);
    const createDistrict = useRegionStore(state => state.createDistrict);

    // Обновляем regionId при открытии модального окна или изменении preselectedRegionId
    useEffect(() => {
        if (isOpen && preselectedRegionId) {
            setRegionId(String(preselectedRegionId));
        } else if (isOpen && !preselectedRegionId) {
            setRegionId('');
        }
    }, [isOpen, preselectedRegionId]);

    // Сбрасываем форму при закрытии
    useEffect(() => {
        if (!isOpen) {
            setName('');
            setRegionId('');
            setError('');
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!name.trim()) {
            setError('District name is required');
            return;
        }

        if (!regionId) {
            setError('Please select a region');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await createDistrict(name.trim(), regionId);
            setName('');
            setRegionId('');
            onClose();
        } catch (err) {
            // Ошибка уже обработана в store
            setError(err.response?.data?.message || 'Failed to create district');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New District">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Select Region
                    </label>
                    <div className="relative">
                        <select
                            value={regionId}
                            onChange={(e) => {
                                setRegionId(e.target.value);
                                setError('');
                            }}
                            className="w-full pl-4 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all font-mono appearance-none cursor-pointer"
                            disabled={isLoading || !regions || regions.length === 0}
                        >
                            <option value="" className="bg-[#02040a]">Select a region...</option>
                            {regions && Array.isArray(regions) && regions.map(region => (
                                <option key={region.id} value={region.id} className="bg-[#02040a]">
                                    {region.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                        District Name
                    </label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError('');
                            }}
                            placeholder="Enter district name..."
                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all font-mono"
                            disabled={isLoading}
                            autoFocus
                        />
                    </div>
                    {error && (
                        <p className="mt-2 text-sm text-red-400">{error}</p>
                    )}
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl transition-all border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || !name.trim() || !regionId}
                        className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Creating...
                            </>
                        ) : (
                            'Create District'
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

