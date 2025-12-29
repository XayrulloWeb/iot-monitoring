import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite' // Импортируем плагин для Vite

export default defineConfig({
    // Подключаем плагин Tailwind напрямую, а не через PostCSS
    plugins: [react(), tailwindcss()],
})