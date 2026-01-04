export function Temperature({ value, className = "" }) {
    if (value === undefined || value === null) return <span className="text-slate-600">--</span>;
    // Централизованная проверка на ошибку датчика
    if (value <= -127) return <span className="text-red-500 font-bold">ERR</span>;

    return <span className={`font-mono font-bold ${className}`}>{value.toFixed(1)}°</span>;
}