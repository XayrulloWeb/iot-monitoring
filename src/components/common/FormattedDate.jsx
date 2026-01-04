// src/components/common/FormattedDate.jsx
import { format, isValid } from 'date-fns';

export function FormattedDate({ date, formatStr = 'HH:mm:ss', className = "" }) {
    if (!date) return <span className="text-slate-600">--</span>;

    const d = new Date(date);
    if (!isValid(d)) return <span className="text-red-500/50">Inv. Date</span>;

    return (
        <span className={`font-mono ${className}`}>
            {format(d, formatStr)}
        </span>
    );
}