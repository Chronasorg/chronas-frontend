import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';
// Mapbox GL CSS for map rendering (required by react-map-gl)
import 'mapbox-gl/dist/mapbox-gl.css';
// i18n initialization (must be imported before App)
import './i18n/i18n';
import { useUIStore } from './stores/uiStore';
import { useMapStore } from './stores/mapStore';
import { DETAIL_LEVEL_PRESETS, detectDetailLevel } from './utils/detailLevelUtils';

declare const __BUILD_TIMESTAMP__: string;
console.log(`%cChronas build: ${__BUILD_TIMESTAMP__}`, 'color: #888; font-size: 10px;');

// Apply the persisted detail-level preset synchronously before React mounts
// so MapView's initial marker fetch honors the user's chosen tier (Issue #8).
(() => {
  const ui = useUIStore.getState();
  const level = ui.detailLevel ?? detectDetailLevel();
  if (ui.detailLevel === null) ui.setDetailLevel(level);
  const preset = DETAIL_LEVEL_PRESETS[level];
  const map = useMapStore.getState();
  map.setMarkerLimit(preset.markerLimit);
  map.setClusterMarkers(preset.clusterMarkers);
})();

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    'Root element not found. Make sure there is a <div id="root"></div> in your HTML.'
  );
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
