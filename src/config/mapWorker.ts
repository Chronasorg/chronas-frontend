/**
 * Tile-worker URL for MapLibre GL JS.
 *
 * MapLibre does all vector-tile and GeoJSON parsing in a Web Worker, and it
 * locates that worker itself: `new URL('./maplibre-gl-worker.mjs',
 * import.meta.url)`, relative to whichever chunk `maplibre-gl` ended up in. It
 * never checks that the URL resolves.
 *
 * That guess is right in dev and wrong in the build:
 *
 * - **Dev** serves `maplibre-gl` unbundled out of `node_modules` (see
 *   `optimizeDeps.exclude` in `vite.config.ts`), so the worker and the
 *   `maplibre-gl-shared.mjs` it imports sit exactly where MapLibre looks.
 * - **The build** emits one hashed app chunk and copies neither file next to it,
 *   so the request lands on the SPA fallback, the browser gets `index.html` back
 *   with a 200, and the worker dies on a syntax error.
 *
 * The failure is close to silent and reads as slowness rather than breakage: the
 * canvas mounts and raster relief still draws, but every vector and GeoJSON
 * source stays pinned at `_isUpdatingWorker === true`, `isStyleLoaded()` never
 * turns true, `load` never fires, and MapView shows "Loading map..." forever.
 *
 * Vite's `?worker&url` fixes the build: it bundles the worker entry *including*
 * its `maplibre-gl-shared.mjs` import into a single hashed asset and hands back
 * the emitted URL. Left at Vite's default IIFE worker format, that asset loads
 * both as a module worker (what MapLibre asks for) and as a classic worker (its
 * fallback).
 *
 * Deliberately build-only. In dev the same override would route every worker
 * through Vite's on-demand worker-transform endpoint instead of plain static
 * file serving, which measurably slowed the Playwright suite (3.5min → 18min)
 * and intermittently left the style stuck loading. Since the dev path MapLibre
 * picks by itself is already correct, there is nothing to override there.
 *
 * `tests/e2e/deployment.spec.ts` guards the build path, because it is the only
 * suite that runs against a real bundle — a dev-server test cannot see this.
 */
import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

/**
 * Points MapLibre at the bundled worker asset, in built output only.
 *
 * Must run before the first `Map` is constructed: MapLibre reads the URL when it
 * spins up its worker pool and caches the resulting workers globally.
 */
export function registerMapWorker(): void {
  if (!import.meta.env.PROD) return;
  setWorkerUrl(workerUrl);
}
