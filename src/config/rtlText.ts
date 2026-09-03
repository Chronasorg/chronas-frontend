/**
 * Right-to-left text shaping for map labels.
 *
 * MapLibre (like Mapbox GL JS) cannot shape Arabic or Hebrew on its own — it
 * needs an out-of-band plugin that runs inside the tile worker. Without it,
 * Arabic labels render as isolated, unjoined, left-to-right glyphs. Chronas has
 * an `ar` locale and never registered the plugin, so this fixes an existing gap
 * rather than compensating for the MapLibre migration.
 *
 * The plugin ships as a same-origin static asset (`public/vendor/`) rather than
 * being pulled from unpkg as MapLibre's docs suggest: a third-party CDN on the
 * critical path is both a runtime dependency we don't need and a cross-origin
 * failure mode. It is vendored rather than imported from npm because
 * `@mapbox/mapbox-gl-rtl-text`'s `exports` field only publishes the ES-module
 * source, while the worker loads the plugin with `importScripts`, which needs
 * the classic-script `dist` build.
 *
 * Provenance: @mapbox/mapbox-gl-rtl-text@0.4.0,
 * `dist/mapbox-gl-rtl-text.js`, BSD-2-Clause (licence copied alongside it).
 */
import { setRTLTextPlugin, getRTLTextPluginStatus } from 'maplibre-gl';

/** Same-origin URL of the vendored plugin, honouring Vite's configured base. */
export const RTL_TEXT_PLUGIN_URL = `${import.meta.env.BASE_URL}vendor/mapbox-gl-rtl-text.js`;

/**
 * Registers the RTL text plugin exactly once.
 *
 * `setRTLTextPlugin` throws if called when the plugin is already loaded, and
 * the status guard keeps React strict-mode double-invocation and hot reloads
 * from tripping that.
 *
 * Loaded lazily: the plugin only downloads once a tile actually contains RTL
 * text, so users of other locales never pay for it.
 */
export function registerRTLTextPlugin(): void {
  if (getRTLTextPluginStatus() !== 'unavailable') return;

  void setRTLTextPlugin(RTL_TEXT_PLUGIN_URL, true).catch((error: unknown) => {
    // Non-fatal: the map still renders, Arabic labels just stay unshaped.
    console.warn('[map] Failed to load RTL text plugin:', error);
  });
}
