// src/components/ui/SkeletonCard.jsx
export default function SkeletonCard() {
    return (
        <div className="glass-panel p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
                <div className="h-3 bg-slate-700 rounded w-24"></div>
                <div className="h-8 w-8 bg-slate-700 rounded-lg"></div>
            </div>
            <div className="h-10 bg-slate-700 rounded w-20 mb-2"></div>
        </div>
    );
}
