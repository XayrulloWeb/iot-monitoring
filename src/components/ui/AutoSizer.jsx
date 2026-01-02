// src/components/ui/AutoSizer.jsx
import { useEffect, useRef, useState } from 'react';

export default function AutoSizer({ children }) {
    const parentRef = useRef(null);
    const [size, setSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (!parentRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                // Используем contentRect для точных размеров контента
                const { width, height } = entry.contentRect;
                // Округляем, чтобы избежать субпиксельных проблем в react-window
                setSize({ width: Math.floor(width), height: Math.floor(height) });
            }
        });

        resizeObserver.observe(parentRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    return (
        <div ref={parentRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            {/* Рендерим детей только когда размер известен, чтобы избежать мелькания */}
            {size.width > 0 && size.height > 0 && children(size)}
        </div>
    );
}