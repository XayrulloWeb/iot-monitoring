// src/components/provisioning/AddDeviceModal.jsx
import { useEffect, useState } from 'react';
import { useProvisionStore } from '../../store/provisionStore';
import { Modal } from '../ui/Modal';
import { Zap, Smartphone, Loader2, CheckCircle, Wifi, Cpu, ArrowRight, Copy } from 'lucide-react';
import { clsx } from 'clsx';

export function AddDeviceModal({ isOpen, onClose }) {
    const {
        step, pairingCode, expiresIn, error,
        startProvisioning, stopProvisioning, saveSensorDetails, reset
    } = useProvisionStore();

    // Форма сохранения
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');

    // При открытии - сброс, при закрытии - стоп
    useEffect(() => {
        if (isOpen) {
            reset();
        } else {
            stopProvisioning();
        }
    }, [isOpen]);

    // Обработчик сохранения
    const handleSave = async (e) => {
        e.preventDefault();
        const success = await saveSensorDetails(name, location);
        if (success) onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="SYSTEM UNIT PROVISIONING">
            <div className="min-h-[300px] flex flex-col">

                {/* --- ERROR DISPLAY --- */}
                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-mono">
                        ERROR: {error}
                    </div>
                )}

                {/* --- STEP 0: IDLE (START) --- */}
                {step === 'idle' && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-fadeIn">
                        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center relative">
                            <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
                            <Zap size={40} className="text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white mb-2">Initiate Pairing Protocol</h3>
                            <p className="text-slate-400 text-sm max-w-xs mx-auto">
                                Ensure the device is connected to the Engineer's PC via USB and the Agent software is running.
                            </p>
                        </div>
                        <button
                            onClick={startProvisioning}
                            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            <Wifi size={18} /> GENERATE UPLINK CODE
                        </button>
                    </div>
                )}

                {/* --- STEP 1: REQUESTING --- */}
                {step === 'requesting' && (
                    <div className="flex-1 flex flex-col items-center justify-center animate-fadeIn">
                        <Loader2 size={48} className="text-indigo-500 animate-spin mb-4" />
                        <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">Generating Secure Key...</p>
                    </div>
                )}

                {/* --- STEP 2: PAIRING CODE --- */}
                {step === 'pairing' && (
                    <div className="flex-1 flex flex-col items-center animate-fadeIn">
                        <div className="text-center mb-6">
                            <p className="text-slate-400 text-xs uppercase tracking-widest mb-4">Enter this code in Agent App</p>

                            {/* CODE DISPLAY */}
                            <div
                                className="group relative bg-[#02040a] border border-blue-500/30 rounded-2xl px-8 py-6 mb-2 cursor-pointer hover:border-blue-500/60 transition-colors"
                                onClick={() => navigator.clipboard.writeText(pairingCode)}
                            >
                                <div className="text-5xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 tracking-[0.5em] pl-4 drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]">
                                    {String(pairingCode).slice(0, 6)}
                                </div>
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500">
                                    <Copy size={14} />
                                </div>
                            </div>

                            {/* TIMER BAR */}
                            <div className="w-full max-w-[200px] h-1 bg-slate-800 rounded-full overflow-hidden mx-auto mt-6">
                                <div
                                    className="h-full bg-cyan-500 shadow-[0_0_10px_#06b6d4]"
                                    style={{
                                        width: '100%',
                                        transition: `width ${expiresIn}s linear`
                                    }}
                                    onTransitionEnd={(e) => {
                                        // В реальности здесь можно триггерить перезапрос кода
                                        e.target.style.width = '0%';
                                    }}
                                    ref={(el) => {
                                        // Hack to trigger animation on mount
                                        if (el) setTimeout(() => el.style.width = '0%', 100);
                                    }}
                                ></div>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2 font-mono">Code expires in {expiresIn}s</p>
                        </div>

                        <div className="flex items-center gap-2 text-amber-400 text-xs bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20 animate-pulse">
                            <Loader2 size={14} className="animate-spin" />
                            <span>Waiting for Agent Connection...</span>
                        </div>
                    </div>
                )}

                {/* --- STEP 3: FLASHING (AGENT CONNECTED) --- */}
                {step === 'flashing' && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center animate-fadeIn">
                        <div className="relative mb-6">
                            <div className="w-24 h-24 rounded-full border-4 border-slate-700 border-t-cyan-500 animate-spin"></div>
                            <Cpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-400" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Flashing Firmware</h3>
                        <p className="text-slate-400 text-sm">
                            Agent connected. Uploading configuration and binaries.<br/>
                            <span className="text-red-400">Do not disconnect the device.</span>
                        </p>

                        <div className="w-full max-w-xs bg-slate-800 h-2 rounded-full mt-6 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 w-2/3 animate-[shimmer_1s_infinite_linear]"
                                 style={{ backgroundSize: '200% 100%' }}></div>
                        </div>
                    </div>
                )}

                {/* --- STEP 4: SUCCESS & FORM --- */}
                {step === 'success' || step === 'saving' ? (
                    <form onSubmit={handleSave} className="flex-1 flex flex-col animate-fadeIn">
                        <div className="flex items-center gap-4 mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 shadow-[0_0_15px_#10b981]">
                                <CheckCircle className="text-white" size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Device Paired Successfully!</h3>
                                <p className="text-xs text-emerald-400 font-mono">UUID: {useProvisionStore.getState().newSensorData?.uuid}</p>
                            </div>
                        </div>

                        <div className="space-y-4 flex-1">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Unit Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Boiler Room 1"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-indigo-500 focus:outline-none transition-colors"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Location / Description</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Building A, Basement"
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-indigo-500 focus:outline-none transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="submit"
                                disabled={step === 'saving'}
                                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/50 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {step === 'saving' ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle size={18} />}
                                COMPLETE SETUP
                            </button>
                        </div>
                    </form>
                ) : null}

                {/* --- FOOTER: CANCEL BUTTON (Visible everywhere except success) --- */}
                {step !== 'idle' && step !== 'success' && step !== 'saving' && (
                    <div className="mt-6 pt-4 border-t border-white/5 flex justify-center">
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-xs text-red-400 hover:text-red-300 font-mono uppercase tracking-wider hover:underline"
                        >
                            Cancel Provisioning
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
}