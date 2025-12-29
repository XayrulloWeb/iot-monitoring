// src/components/ui/Toaster.jsx
import { useNotificationStore } from '../../store/notificationStore';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export function Toaster() {
    const { notifications, removeNotification } = useNotificationStore();

    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-80 pointer-events-none">
            {notifications.map((n) => (
                <div
                    key={n.id}
                    className="pointer-events-auto bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl flex items-start gap-3 animate-slideInRight"
                >
                    {/* Иконка */}
                    <div className={`mt-0.5 ${
                        n.type === 'error' ? 'text-red-500' :
                            n.type === 'success' ? 'text-emerald-500' : 'text-blue-400'
                    }`}>
                        {n.type === 'error' ? <AlertTriangle size={18} /> :
                            n.type === 'success' ? <CheckCircle size={18} /> : <Info size={18} />}
                    </div>

                    {/* Текст */}
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-white leading-none mb-1">{n.title}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">{n.message}</p>
                    </div>

                    {/* Кнопка закрытия */}
                    <button
                        onClick={() => removeNotification(n.id)}
                        className="text-slate-500 hover:text-white transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>
    );
}