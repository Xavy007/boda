import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: {
    port: 5173,
    // Accesible desde otros dispositivos de la misma red (celular)
    host: true,
    // En desarrollo, el frontend y la API comparten origen gracias al proxy (cookies sin CORS)
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: false },
      '/fotos': { target: 'http://localhost:4000', changeOrigin: false },
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
        },
      },
    },
  },
});
