// src/components/ui/LoadingScreen.jsx
import { Loader2 } from 'lucide-react';

export default function LoadingScreen({ message = 'Загрузка...' }) {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#02040a]">
            <div className="text-center">
                <div className="flex justify-center mb-6">
                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                </div>
                <p className="text-slate-400 font-mono text-sm">{message}</p>
            </div>
        </div>
    );
}
