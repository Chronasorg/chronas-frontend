import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';
// Mapbox GL CSS for map rendering (required by react-map-gl)
import 'mapbox-gl/dist/mapbox-gl.css';
// i18n initialization (must be imported before App)
import './i18n/i18n';

declare const __BUILD_TIMESTAMP__: string;
console.log(`%cChronas build: ${__BUILD_TIMESTAMP__}`, 'color: #888; font-size: 10px;');

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
