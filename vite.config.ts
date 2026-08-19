import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
    },
  },
  optimizeDeps: {
    // maplibre-gl must NOT be pre-bundled. It resolves its tile worker with
    // `new URL('./maplibre-gl-worker.mjs', import.meta.url)`, and esbuild copies
    // only the entry chunk into `node_modules/.vite/deps/` — so that URL 404s
    // and the worker never boots. The failure mode is nearly silent: raster
    // relief and sprites still render, but every vector/GeoJSON source stays
    // stuck with `_isUpdatingWorker === true`, `isStyleLoaded()` never turns
    // true, `load` never fires, and MapView shows "Loading map..." forever.
    exclude: ['maplibre-gl'],
  },
  server: {
    port: 5173,
    strictPort: true,
    open: false,
  },
  preview: {
    port: 4173,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('react-dom') || id.includes('react-router')) {
            return 'vendor';
          }
          if (id.includes('zustand')) {
            return 'state';
          }
        },
      },
    },
  },
  css: {
    devSourcemap: true,
  },
});
