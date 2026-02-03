/**
 * MapView Component
 *
 * Main container component that renders the interactive historical map
 * using react-map-gl with Mapbox GL JS.
 *
 * Requirements: 1.1, 1.3, 1.4, 2.3, 2.8, 3.1, 3.4, 3.6, 6.1, 7.1, 7.2, 7.3, 7.4, 7.6, 12.5, 12.6, 13.2, 13.3, 15.1, 15.2, 15.3
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Map, { type MapRef, type ViewStateChangeEvent, type MapMouseEvent, Source, Layer } from 'react-map-gl/mapbox';
import type { FeatureCollection, Feature, Point } from 'geojson';
import { useMapStore } from '../../../stores/mapStore';
import { useUIStore } from '../../../stores/uiStore';
import { useTimelineStore } from '../../../stores/timelineStore';
import { getThemeConfig } from '../../../config/mapTheme';
import { updateYearInURL } from '../../../utils/mapUtils';
import styles from './MapView.module.css';

// Mapbox access token - should be set via environment variable
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

/**
 * Props for the MapView component
 */
export interface MapViewProps {
  /** Optional CSS class name */
  className?: string;
  /** Whether to apply blur filter (for non-interactive routes) */
  isBlurred?: boolean;
}

/**
 * Hover information for province interactions
 * Requirement 7.4: WHEN the user hovers over a province, THE MapView SHALL display hover info
 */
export interface HoverInfo {
  /** Longitude and latitude of hover position */
  lngLat: [number, number];
  /** Feature properties from the hovered layer */
  feature: Record<string, unknown>;
  /** Province ID if available */
  provinceId: string | undefined;
}

/**
 * Sidebar width constants for layout calculations
 * Requirement 15.1: WHEN the menu drawer opens, THE MapView SHALL adjust its left offset to 156px
 * Requirement 15.2: WHEN the menu drawer closes, THE MapView SHALL adjust its left offset to 56px
 */
export const SIDEBAR_WIDTH_OPEN = 156;
export const SIDEBAR_WIDTH_CLOSED = 56;

/**
 * Right drawer width for layout calculations
 * Requirement 15.3: WHEN the right drawer opens, THE MapView SHALL adjust its width
 */
export const RIGHT_DRAWER_WIDTH_PERCENT = 25;

/**
 * Checks if WebGL is supported in the current browser.
 * Requirement 13.2: THE MapView SHALL check for WebGL support on mount
 *
 * @returns true if WebGL is supported
 */
export function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl');
    return gl !== null;
  } catch {
    return false;
  }
}

/**
 * MapView Component
 *
 * Renders the interactive map using react-map-gl with Mapbox GL JS.
 * Connects to mapStore for viewport state and uiStore for theme.
 *
 * Requirements:
 * - 1.1: THE MapView SHALL render using react-map-gl v7 with Mapbox GL JS
 * - 1.3: THE MapView SHALL be the primary visual element on the home page
 * - 1.4: THE MapView SHALL display a loading indicator while initializing
 * - 2.3: WHEN the user pans or zooms the map, THE MapStore SHALL update the viewport state
 * - 3.1: WHEN the selectedYear changes in Timeline_Store, THE MapView SHALL fetch new area data
 * - 3.6: WHEN the year changes, THE MapView SHALL update the URL query parameter 'year'
 * - 6.1: WHEN the theme changes in UI_Store, THE MapView SHALL update its visual styling
 * - 15.1, 15.2, 15.3: THE MapView SHALL adjust layout based on sidebar state
 */
export function MapView({ className, isBlurred = false }: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [webGLSupported, setWebGLSupported] = useState(true);
  
  // Hover state for province interactions
  // Requirement 7.3, 7.4: Province hover highlighting and info display
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  
  // Track previous year to detect changes
  const prevYearRef = useRef<number | null>(null);

  // Get state from stores
  const viewport = useMapStore((state) => state.viewport);
  const setViewport = useMapStore((state) => state.setViewport);
  const flyToTarget = useMapStore((state) => state.flyToTarget);
  const clearFlyTo = useMapStore((state) => state.clearFlyTo);
  const loadAreaData = useMapStore((state) => state.loadAreaData);
  const selectProvince = useMapStore((state) => state.selectProvince);
  const theme = useUIStore((state) => state.theme);
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const selectedYear = useTimelineStore((state) => state.selectedYear);

  // Get theme configuration
  const themeConfig = getThemeConfig(theme);

  // Check WebGL support on mount
  // Requirement 13.2: THE MapView SHALL check for WebGL support on mount
  useEffect(() => {
    setWebGLSupported(checkWebGLSupport());
  }, []);

  /**
   * Handle window resize events.
   * Requirement 2.8: WHEN the window is resized, THE MapStore SHALL update viewport width and height
   * Requirement 12.5: THE MapView SHALL add a passive resize event listener on mount
   * Requirement 12.6: THE MapView SHALL clean up the resize listener on unmount
   */
  useEffect(() => {
    /**
     * Calculate viewport dimensions accounting for sidebar offsets.
     * The viewport width is reduced by the sidebar width.
     */
    const handleResize = () => {
      const sidebarWidth = sidebarOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED;
      const newWidth = window.innerWidth - sidebarWidth;
      const newHeight = window.innerHeight;

      setViewport({
        width: newWidth,
        height: newHeight,
      });
    };

    // Add passive resize listener on mount
    // Requirement 12.5: THE MapView SHALL add a passive resize event listener on mount
    window.addEventListener('resize', handleResize, { passive: true });

    // Set initial dimensions
    handleResize();

    // Clean up listener on unmount
    // Requirement 12.6: THE MapView SHALL clean up the resize listener on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [sidebarOpen, setViewport]);

  /**
   * Subscribe to selectedYear changes and trigger data fetch.
   * Requirement 3.1: WHEN the selectedYear changes in Timeline_Store,
   * THE MapView SHALL fetch new area data from the chronas-api
   * Requirement 3.4: THE MapStore SHALL subscribe to Timeline_Store selectedYear changes
   * Requirement 3.6: WHEN the year changes, THE MapView SHALL update the URL query parameter 'year'
   */
  useEffect(() => {
    // Skip initial render (prevYearRef is null)
    if (prevYearRef.current === null) {
      prevYearRef.current = selectedYear;
      // Update URL with initial year
      updateYearInURL(selectedYear);
      return;
    }

    // Only trigger if year actually changed
    if (prevYearRef.current !== selectedYear) {
      prevYearRef.current = selectedYear;
      
      // Update URL year parameter
      updateYearInURL(selectedYear);
      
      // Trigger area data fetch for the new year
      void loadAreaData(selectedYear);
    }
  }, [selectedYear, loadAreaData]);

  // Handle flyTo animations
  // Requirement 2.6: THE MapStore SHALL provide a flyTo action
  useEffect(() => {
    if (flyToTarget && mapRef.current) {
      const flyToOptions: {
        center: [number, number];
        zoom?: number;
        duration?: number;
        bearing?: number;
        pitch?: number;
      } = {
        center: [flyToTarget.longitude, flyToTarget.latitude],
        duration: flyToTarget.duration ?? 2000,
      };
      
      if (flyToTarget.zoom !== undefined) {
        flyToOptions.zoom = flyToTarget.zoom;
      }
      if (flyToTarget.bearing !== undefined) {
        flyToOptions.bearing = flyToTarget.bearing;
      }
      if (flyToTarget.pitch !== undefined) {
        flyToOptions.pitch = flyToTarget.pitch;
      }
      
      mapRef.current.flyTo(flyToOptions);
    }
  }, [flyToTarget]);

  /**
   * Handles viewport changes from user interaction.
   * Requirement 2.3: WHEN the user pans or zooms the map,
   * THE MapStore SHALL update the viewport state
   */
  const handleMove = useCallback(
    (evt: ViewStateChangeEvent) => {
      setViewport({
        latitude: evt.viewState.latitude,
        longitude: evt.viewState.longitude,
        zoom: evt.viewState.zoom,
        bearing: evt.viewState.bearing,
        pitch: evt.viewState.pitch,
      });
    },
    [setViewport]
  );

  /**
   * Handles map load completion.
   * Requirement 1.4: THE MapView SHALL display a loading indicator while initializing
   */
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  /**
   * Handles flyTo animation completion.
   */
  const handleMoveEnd = useCallback(() => {
    if (flyToTarget) {
      clearFlyTo();
    }
  }, [flyToTarget, clearFlyTo]);

  /**
   * Handles mouse hover over map features (provinces).
   * Requirement 7.3: WHEN the user hovers over a province, THE MapView SHALL highlight the province
   * Requirement 7.4: WHEN the user hovers over a province, THE MapView SHALL update the area-hover source
   */
  const handleMouseMove = useCallback((event: MapMouseEvent) => {
    // Check if we have features under the cursor
    const features = event.features;
    
    if (features && features.length > 0) {
      const feature = features[0];
      if (!feature) {
        setHoverInfo(null);
        return;
      }
      
      const properties = feature.properties ?? {};
      
      // Extract province ID from feature properties
      // Province ID is typically stored in 'id' or 'provinceId' property
      const provinceId = (properties['id'] as string | undefined) ?? 
                         (properties['provinceId'] as string | undefined) ??
                         (feature.id !== undefined ? String(feature.id) : undefined);
      
      // Update hover info state
      setHoverInfo({
        lngLat: [event.lngLat.lng, event.lngLat.lat],
        feature: properties as Record<string, unknown>,
        provinceId: provinceId,
      });
    } else {
      // No features under cursor, clear hover state
      setHoverInfo(null);
    }
  }, []);

  /**
   * Handles mouse leave from the map.
   * Requirement 7.6: WHEN the mouse leaves a province, THE MapView SHALL clear the area-hover source
   */
  const handleMouseLeave = useCallback(() => {
    setHoverInfo(null);
  }, []);

  /**
   * Handles click on map features (provinces).
   * Requirement 7.1: WHEN the user clicks on a province, THE MapView SHALL select that province
   * Requirement 7.2: WHEN a province is selected, THE MapStore SHALL store the selected province ID
   */
  const handleClick = useCallback((event: MapMouseEvent) => {
    // Check if we have features under the cursor
    const features = event.features;
    
    if (features && features.length > 0) {
      const feature = features[0];
      if (!feature) {
        return;
      }
      
      const properties = feature.properties ?? {};
      
      // Extract province ID from feature properties
      const provinceId = (properties['id'] as string | undefined) ?? 
                         (properties['provinceId'] as string | undefined) ??
                         (feature.id !== undefined ? String(feature.id) : undefined);
      
      if (provinceId) {
        // Update selected province in store
        selectProvince(provinceId);
      }
    }
  }, [selectProvince]);

  /**
   * Generate GeoJSON for the area-hover source based on hovered feature.
   * Requirement 7.4: THE MapView SHALL update the area-hover source with that province's geometry
   */
  const getHoverGeoJSON = useCallback((): FeatureCollection<Point> => {
    // Return empty feature collection if no hover info
    if (!hoverInfo) {
      return {
        type: 'FeatureCollection',
        features: [],
      };
    }
    
    // If we have feature geometry from the hover event, use it
    // For now, return a point at the hover location as a placeholder
    // The actual province geometry would come from the map's source data
    const pointFeature: Feature<Point> = {
      type: 'Feature',
      properties: hoverInfo.feature,
      geometry: {
        type: 'Point',
        coordinates: hoverInfo.lngLat,
      },
    };
    
    return {
      type: 'FeatureCollection',
      features: [pointFeature],
    };
  }, [hoverInfo]);

  // Render WebGL not supported fallback
  // Requirement 13.2: THE MapView SHALL display fallback UI if WebGL not supported
  if (!webGLSupported) {
    return (
      <div className={`${styles['container'] ?? ''} ${className ?? ''}`}>
        <div className={styles['webglError']}>
          <h2>WebGL Not Supported</h2>
          <p>Your browser does not support WebGL, which is required for the interactive map.</p>
          <p>Please try using a modern browser like Chrome, Firefox, or Edge.</p>
        </div>
      </div>
    );
  }

  // Render missing token warning
  if (!MAPBOX_TOKEN) {
    return (
      <div className={`${styles['container'] ?? ''} ${className ?? ''}`}>
        <div className={styles['tokenError']}>
          <h2>Mapbox Token Missing</h2>
          <p>The Mapbox access token is not configured.</p>
          <p>Please set the VITE_MAPBOX_TOKEN environment variable.</p>
        </div>
      </div>
    );
  }

  // Combine class names
  const containerClassName = [
    styles['container'] ?? '',
    isBlurred ? styles['blurred'] : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  /**
   * Calculate sidebar layout offsets.
   * Requirement 15.1: WHEN the menu drawer opens, THE MapView SHALL adjust its left offset to 156px
   * Requirement 15.2: WHEN the menu drawer closes, THE MapView SHALL adjust its left offset to 56px
   */
  const leftOffset = sidebarOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED;

  return (
    <div 
      className={containerClassName} 
      data-theme={theme}
      data-sidebar-open={sidebarOpen}
      style={{
        left: `${String(leftOffset)}px`,
        // Requirement 15.4: THE MapView SHALL animate layout transitions
        transition: 'left 300ms cubic-bezier(0.4, 0, 0.2, 1), width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Loading indicator */}
      {!isLoaded && (
        <div className={styles['loading']}>
          <div className={styles['spinner']} />
          <p>Loading map...</p>
        </div>
      )}

      {/* Map component */}
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          latitude: viewport.latitude,
          longitude: viewport.longitude,
          zoom: viewport.zoom,
          bearing: viewport.bearing,
          pitch: viewport.pitch,
        }}
        minZoom={viewport.minZoom}
        style={{
          width: '100%',
          height: '100%',
        }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        onMove={handleMove}
        onLoad={handleLoad}
        onMoveEnd={handleMoveEnd}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        interactiveLayerIds={['area-fill', 'provinces-fill']}
        attributionControl={false}
        reuseMaps
      >
        {/* Area hover highlight source and layer */}
        {/* Requirement 7.3, 7.4: Province hover highlighting */}
        <Source id="area-hover" type="geojson" data={getHoverGeoJSON()}>
          <Layer
            id="area-hover-highlight"
            type="circle"
            paint={{
              'circle-radius': 8,
              'circle-color': themeConfig.highlightColors[0],
              'circle-opacity': hoverInfo ? 0.8 : 0,
              'circle-stroke-width': 2,
              'circle-stroke-color': themeConfig.foreColors[0],
            }}
          />
        </Source>
      </Map>

      {/* Theme-based overlay for styling */}
      <div
        className={styles['themeOverlay']}
        style={{
          '--theme-fore-color': themeConfig.foreColors[0],
          '--theme-back-color': themeConfig.backColors[0],
          '--theme-highlight-color': themeConfig.highlightColors[0],
        } as React.CSSProperties}
      />
    </div>
  );
}

export default MapView;
