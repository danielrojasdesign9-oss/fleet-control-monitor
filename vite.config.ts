import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const TRACCAR_TARGET = process.env.VITE_TRACCAR_PROXY_TARGET ?? 'https://simulator.traccar.org';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/traccar': {
        target: TRACCAR_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/traccar/, '/api'),
      },
      '/demo4': {
        target: 'https://demo4.traccar.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/demo4/, '/api'),
      },
    },
  },
});
