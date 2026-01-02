import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        proxy: {
            // Все запросы, начинающиеся с /api, перенаправляем на реальный сервер
            '/api': {
                target: 'https://test.catelnium.unusual.uz',
                changeOrigin: true,
                secure: false,
            }
        }
    }
})