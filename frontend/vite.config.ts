import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    // Set base URL for GitHub Pages (repo name)
    base: '/ecfr-analyzer/',
    server: {
        port: 5173
    },
    build: {
        outDir: 'dist',
        // Generate clean URLs for SPA routing
        rollupOptions: {
            output: {
                manualChunks: undefined
            }
        }
    }
})
