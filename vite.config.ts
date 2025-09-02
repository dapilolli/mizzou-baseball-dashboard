import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    server: {
        proxy: {
            '/team': 'http://localhost:8000',
            '/pdp': 'http://localhost:8000',
            '/reports': 'http://localhost:8000',
            '/gameday': 'http://localhost:8000',
            '/api': 'http://localhost:8000',
        },
    },
})
