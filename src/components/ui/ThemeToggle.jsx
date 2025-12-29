// src/components/ui/ThemeToggle.jsx
import { Sun, Moon } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

export function ThemeToggle() {
    // --- ИСПРАВЛЕНИЕ ---
    // Выбираем каждое значение из стора по отдельности.
    // Это гарантирует, что компонент будет перерисовываться только
    // если изменится именно `theme`.
    const theme = useUIStore(state => state.theme);
    const toggleTheme = useUIStore(state => state.toggleTheme);
    // --- КОНЕЦ ИСПРАВЛЕНИЯ ---

    return (
        <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center gap-3 mt-4 p-3 rounded-lg text-[--text-muted] hover:bg-[--surface-hover] hover:text-[--text-main] transition-colors"
        >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            <span className="font-medium">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>
    );
}