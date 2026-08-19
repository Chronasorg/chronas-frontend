/**
 * MapView Component
 *
 * Main container component that renders the interactive historical map
 * using react-map-gl with MapLibre GL JS.
 *
 * Requirements: 1.1, 1.3, 1.4, 2.3, 2.8, 3.1, 3.4, 3.6, 6.1, 7.1, 7.2, 7.3, 7.4, 7.6, 12.5, 12.6, 13.2, 13.3, 15.1, 15.2, 15.3
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.3 (Province data visualization)
 * Requirements: 9.5, 11.2 (Performance optimizations - debouncing and request cancellation)
 * Requirements: 1.2, 1.3, 1.4 (Basemap style switching - production-parity-fixes)
 * Requirements: 2.2, 2.3, 2.4 (Province borders toggle - production-parity-fixes)
 * Requirements: 3.2, 3.3, 3.4 (Population opacity toggle - production-parity-fixes)
 */

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import Map, { type MapRef, type ViewStateChangeEvent, type MapMouseEvent, Source, Layer, Popup } from 'react-map-gl/maplibre';
import type { GeoJSONSource, Map as MapLibreMap, StyleSpecification } from 'maplibre-gl';
import type { FeatureCollection, Feature, Point, Polygon, MultiPolygon } from 'geojson';
import { useMapStore, FALLBACK_COLOR, BASEMAP_STYLES, type LabelFeatureCollection, type LabelLineFeatureCollection } from '../../../stores/mapStore';
import { useUIStore } from '../../../stores/uiStore';
import { useTimelineStore } from '../../../stores/timelineStore';
import { useNavigationStore } from '../../../stores/navigationStore';
import { getThemeConfig, AREA_LABEL_CONFIG, getAreaLabelFonts, LOCAL_FONT_NAMES, DEFAULT_FONT, DEFAULT_BOLD_FONT } from '../../../config/mapTheme';
import { updatePositionInURL, updateYearInURL } from '../../../utils/mapUtils';
import { updateURLState } from '../../../utils/urlStateUtils';
import type { Marker } from '../../../api/types';
import { ProvinceTooltip } from '../ProvinceTooltip/ProvinceTooltip';
import type { ProvinceFeatureProperties } from '../ProvinceTooltip/ProvinceTooltip.utils';
import styles from './MapView.module.css';
import {
  type MapExpression,
  type HoverInfo,
  YEAR_CHANGE_DEBOUNCE_MS,
  SIDEBAR_WIDTH_OPEN,
  SIDEBAR_WIDTH_CLOSED,
  RIGHT_DRAWER_WIDTH_PERCENT,
  POPULATION_FILL_COLOR,
  POPULATION_OPACITY_MIN,
  POPULATION_OPACITY_MAX,
  MAX_POPULATION_FOR_OPACITY,
  DEFAULT_FILL_OPACITY,
  ATTRIBUTION_OPTIONS,
  OWN_SOURCE_IDS,
} from './MapView.constants';
import {
  useDebounce,
  buildColorMatchExpression,
  buildPopulationOpacityExpression,
  calculateMaxPopulation,
  checkWebGLSupport,
  markersToGeoJSON,
  normalizeFeatureProperties,
  textFieldReferencesName,
  buildLocalizedNameExpression,
  resolveLocalGlyphUrl,
} from './MapView.utils';

/** Icon dimensions from production properties.js */
const ICON_WIDTH = 135;
const ICON_HEIGHT = 127;

/** Icon positions in `/images/themed-atlas.png`, from production iconMapping['them'] */
const ICON_CONFIGS: Record<string, { x: number; y: number }> = {
  'marker-cp': { x: 3 * ICON_WIDTH, y: 3 * ICON_HEIGHT },  // Capital
  'marker-c0': { x: ICON_WIDTH, y: 4 * ICON_HEIGHT },      // Capital outline
  'marker-c': { x: 0, y: 5 * ICON_HEIGHT },                // City
  'marker-ca': { x: 0, y: 4 * ICON_HEIGHT },               // Castle
  'marker-b': { x: ICON_WIDTH, y: 3 * ICON_HEIGHT },       // Battle
  'marker-si': { x: 2 * ICON_WIDTH, y: 3 * ICON_HEIGHT },  // Siege
  'marker-l': { x: 2 * ICON_WIDTH, y: 4 * ICON_HEIGHT },   // Landmark
  'marker-m': { x: 2 * ICON_WIDTH, y: 2 * ICON_HEIGHT },   // Military
  'marker-p': { x: 2 * ICON_WIDTH, y: 0 },                 // Politician/Person
  'marker-e': { x: 3 * ICON_WIDTH, y: 0 },                 // Explorer
  'marker-s': { x: 2 * ICON_WIDTH, y: ICON_HEIGHT },       // Scientist
  'marker-a': { x: 0, y: ICON_HEIGHT },                    // Artist
  'marker-r': { x: ICON_WIDTH, y: 0 },                     // Religious
  'marker-at': { x: ICON_WIDTH, y: 2 * ICON_HEIGHT },      // Athlete
  'marker-op': { x: 3 * ICON_WIDTH, y: ICON_HEIGHT },      // Unclassified
  'marker-o': { x: 3 * ICON_WIDTH, y: 4 * ICON_HEIGHT },   // Unknown
  'marker-ar': { x: 0, y: 3 * ICON_HEIGHT },               // Artifact
  'marker-ai': { x: 2 * ICON_WIDTH, y: 4 * ICON_HEIGHT },  // Architecture (same as landmark)
  'marker-h': { x: 2 * ICON_WIDTH, y: 0 },                 // Historical figure (same as person)
};

/**
 * Wires up the custom `marker-*` icons, which are cut out of a single sprite
 * atlas rather than taken from the basemap's sprite.
 *
 * Must be called as soon as the MapLibre instance exists — *not* from `onLoad`.
 * `load` only fires after the first visually complete render, which is already
 * past the first symbol placement, so a resolver registered there arrives too
 * late for the initial marker icons.
 *
 * MapLibre v6 replaced the old `styleimagemissing` workaround with an awaited
 * resolver: a `styleimagemissing` *listener* explicitly cannot resolve the image
 * for the request that fired it, so the previous handler logged
 * `Image "marker-p" could not be loaded` and dropped the icon for that render
 * pass whenever a symbol was placed before the atlas finished downloading.
 * MapLibre awaits this callback, so the race is gone. It also survives a
 * basemap swap, which clears the style's image registry but not the resolver.
 */
function installMarkerIcons(map: MapLibreMap): void {
  const atlasPromise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { resolve(img); };
    img.onerror = () => { reject(new Error('Failed to load /images/themed-atlas.png')); };
    img.src = '/images/themed-atlas.png';
  });

  const addIconFromAtlas = (id: string, img: HTMLImageElement) => {
    if (map.hasImage(id)) return;
    const config = ICON_CONFIGS[id];
    if (!config) return;

    const canvas = document.createElement('canvas');
    canvas.width = ICON_WIDTH;
    canvas.height = ICON_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, config.x, config.y, ICON_WIDTH, ICON_HEIGHT, 0, 0, ICON_WIDTH, ICON_HEIGHT);
      const imageData = ctx.getImageData(0, 0, ICON_WIDTH, ICON_HEIGHT);
      map.addImage(id, imageData, { sdf: false });
    }
  };

  map.setMissingStyleImageResolver(async (id: string) => {
    if (!ICON_CONFIGS[id]) return;
    try {
      addIconFromAtlas(id, await atlasPromise);
    } catch (err) {
      console.warn('[MapView] Failed to load themed-atlas.png:', err);
    }
  });

  // Also add every icon eagerly once the atlas arrives, so the steady state
  // needs no resolver round-trip at all.
  atlasPromise
    .then((img) => {
      Object.keys(ICON_CONFIGS).forEach((id) => { addIconFromAtlas(id, img); });
      console.log('[MapView] Custom marker icons loaded from themed-atlas.png');
    })
    .catch((err: unknown) => {
      console.warn('[MapView] Failed to load themed-atlas.png:', err);
    });
}

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
 * MapView Component
 *
 * Renders the interactive map using react-map-gl with MapLibre GL JS.
 * Connects to mapStore for viewport state and uiStore for theme.
 *
 * Requirements:
 * - 1.1: THE MapView SHALL render using react-map-gl with MapLibre GL JS
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
  const containerRef = useRef<HTMLDivElement>(null);
  const iconsInstalledRef = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);
  // Initialize WebGL support check eagerly to avoid a useEffect + setState cascade.
  // checkWebGLSupport() is synchronous and cheap (creates a temporary canvas).
  const [webGLSupported] = useState(() => checkWebGLSupport());
  
  // Hover state for province interactions
  // Requirement 7.3, 7.4: Province hover highlighting and info display
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  
  // Cursor position for tooltip positioning
  // Requirement 1.1: Tooltip appears at cursor position
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  
  // Track previous year to detect changes
  const prevYearRef = useRef<number | null>(null);
  
  // Track if initial data load has been done (after URL year is processed)
  // This prevents loading data before URL year is applied
  const initialLoadDoneRef = useRef(false);
  
  // Selected marker state for popup display
  // Requirement 5.4: WHEN a marker is clicked, THE MapView SHALL display marker details
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);
  
  // Hovered label state for label tooltip display
  const [hoveredLabel, setHoveredLabel] = useState<{ name: string; entityId: string } | null>(null);

  // Get state from stores
  const viewport = useMapStore((state) => state.viewport);
  const setViewport = useMapStore((state) => state.setViewport);
  const flyToTarget = useMapStore((state) => state.flyToTarget);
  const clearFlyTo = useMapStore((state) => state.clearFlyTo);
  const loadAreaData = useMapStore((state) => state.loadAreaData);
  const loadMarkers = useMapStore((state) => state.loadMarkers);
  const getFilteredMarkers = useMapStore((state) => state.getFilteredMarkers);
  const selectProvince = useMapStore((state) => state.selectProvince);
  const layerVisibility = useMapStore((state) => state.layerVisibility);
  const basemap = useMapStore((state) => state.basemap);
  // Province borders visibility state
  // Requirement 2.2, 2.3: Province border visibility toggle
  const showProvinceBorders = useMapStore((state) => state.showProvinceBorders);
  // Population opacity state
  // Requirement 3.2, 3.3, 3.4: Population-based opacity toggle
  const populationOpacity = useMapStore((state) => state.populationOpacity);
  // Marker clustering state
  // Requirement 5.2, 5.3, 5.4: Marker clustering toggle
  const clusterMarkers = useMapStore((state) => state.clusterMarkers);
  const metadata = useMapStore((state) => state.metadata);
  const provincesGeoJSON = useMapStore((state) => state.provincesGeoJSON);
  const markers = useMapStore((state) => state.markers);
  const markerFilters = useMapStore((state) => state.markerFilters);
  const labelData = useMapStore((state) => state.labelData);
  const labelLineData = useMapStore((state) => state.labelLineData);
  const labelNameMode = useMapStore((state) => state.labelNameMode);
  const calculateLabels = useMapStore((state) => state.calculateLabels);
  const activeColor = useMapStore((state) => state.activeColor);
  // Active label dimension for map labels (can be different from activeColor when unlocked)
  // Requirement 7.1: Labels display based on activeLabel dimension
  const activeLabel = useMapStore((state) => state.activeLabel);
  // Entity outline state for highlighting selected entity territory
  // Requirement 8.4, 8.5, 8.6: Entity outline display
  const entityOutline = useMapStore((state) => state.entityOutline);
  const entityOutlineColor = useMapStore((state) => state.entityOutlineColor);
  // Entity outline calculation
  // Requirement 8.1: Calculate entity outline for display
  const calculateEntityOutline = useMapStore((state) => state.calculateEntityOutline);
  // Note: fitToEntityOutline is available in mapStore but not used here.
  // Production behavior: clicking a province does NOT zoom to entity bounds.
  // Hovered province state for tooltip display
  // Requirement 1.1, 1.7: Province hover tooltip
  const hoveredProvinceId = useMapStore((state) => state.hoveredProvinceId);
  const setHoveredProvince = useMapStore((state) => state.setHoveredProvince);
  // Hovered marker state for marker highlight
  // Requirement 5.1, 5.2, 5.3: Marker hover highlight
  const hoveredMarkerId = useMapStore((state) => state.hoveredMarkerId);
  const setHoveredMarker = useMapStore((state) => state.setHoveredMarker);
  const getEntityWiki = useMapStore((state) => state.getEntityWiki);
  const theme = useUIStore((state) => state.theme);
  const locale = useUIStore((state) => state.locale);
  const openRightDrawer = useUIStore((state) => state.openRightDrawer);
  // Right drawer state for width adjustment
  // Requirement 2.2: WHEN the RightDrawer opens, THE MapView SHALL reduce its width by 25%
  const rightDrawerOpen = useUIStore((state) => state.rightDrawerOpen);
  // Track previous right drawer state to detect changes
  const prevRightDrawerOpenRef = useRef(rightDrawerOpen);
  const selectedYear = useTimelineStore((state) => state.selectedYear);

  // Menu drawer state for map left offset
  const drawerOpen = useNavigationStore((state) => state.drawerOpen);

  // Get cancel functions for request cancellation
  // Requirement 9.5, 11.2: Cancel in-flight requests on new year change
  const cancelAreaDataRequest = useMapStore((state) => state.cancelAreaDataRequest);
  const cancelMarkersRequest = useMapStore((state) => state.cancelMarkersRequest);

  // Get error state for error display
  // Requirement 12.1, 12.2, 12.3: Error handling UI
  const error = useMapStore((state) => state.error);
  const setError = useMapStore((state) => state.setError);
  const isLoadingAreaData = useMapStore((state) => state.isLoadingAreaData);
  const currentAreaData = useMapStore((state) => state.currentAreaData);

  // Get theme configuration
  const themeConfig = getThemeConfig(theme);

  // Debounce the selected year to prevent excessive API calls during rapid timeline navigation
  // Requirement 11.2: THE MapView SHALL debounce year change events (300ms)
  const debouncedYear = useDebounce(selectedYear, YEAR_CHANGE_DEBOUNCE_MS);

  // Debounce the marker limit so dragging the slider doesn't fire a request per px
  const markerLimit = useMapStore((state) => state.markerLimit);
  const debouncedMarkerLimit = useDebounce(markerLimit, YEAR_CHANGE_DEBOUNCE_MS);

  /**
   * Memoized color match expressions for each dimension.
   * Requirement 4.3: Data-driven styling with categorical stops
   */
  const colorExpressions = useMemo(() => {
    if (!metadata) {
      return {
        ruler: FALLBACK_COLOR,
        culture: FALLBACK_COLOR,
        religion: FALLBACK_COLOR,
        religionGeneral: FALLBACK_COLOR,
      };
    }

    // Build color maps from metadata
    const rulerColors: Record<string, string> = {};
    const cultureColors: Record<string, string> = {};
    const religionColors: Record<string, string> = {};
    const religionGeneralColors: Record<string, string> = {};

    for (const [id, entry] of Object.entries(metadata.ruler)) {
      if (entry.color) rulerColors[id] = entry.color;
    }
    for (const [id, entry] of Object.entries(metadata.culture)) {
      if (entry.color) cultureColors[id] = entry.color;
    }
    for (const [id, entry] of Object.entries(metadata.religion)) {
      if (entry.color) religionColors[id] = entry.color;
    }
    for (const [id, entry] of Object.entries(metadata.religionGeneral)) {
      if (entry.color) religionGeneralColors[id] = entry.color;
    }

    return {
      ruler: buildColorMatchExpression('r', rulerColors),
      culture: buildColorMatchExpression('c', cultureColors),
      religion: buildColorMatchExpression('e', religionColors),
      religionGeneral: buildColorMatchExpression('g', religionGeneralColors),
    };
  }, [metadata]);

  /**
   * Memoized max population for opacity interpolation.
   * Requirement 3.5: Calculate max population from area data
   */
  const maxPopulation = useMemo(() => {
    return calculateMaxPopulation(provincesGeoJSON);
  }, [provincesGeoJSON]);

  /**
   * Memoized population opacity expression.
   * Requirement 3.5: Population opacity interpolation [0.3, 1.0]
   */
  const populationOpacityExpr = useMemo(() => {
    return buildPopulationOpacityExpression(maxPopulation);
  }, [maxPopulation]);

  /**
   * Memoized conditional fill opacity expression for province fill layers.
   * Requirement 3.2: WHEN populationOpacity is true, THE MapView SHALL scale province fill opacity based on population values
   * Requirement 3.3: WHEN populationOpacity is false, THE MapView SHALL use uniform opacity for all province fills
   * Requirement 3.4: THE MapView SHALL normalize population values to an opacity range of 0.3 to 1.0
   */
  const fillOpacityExpr = useMemo((): MapExpression | number => {
    if (populationOpacity) {
      // When populationOpacity is enabled, use interpolate expression based on 'p' property (population)
      return [
        'interpolate',
        ['linear'],
        ['get', 'p'],
        0, POPULATION_OPACITY_MIN,
        MAX_POPULATION_FOR_OPACITY, POPULATION_OPACITY_MAX,
      ];
    }
    // When populationOpacity is disabled, use constant opacity
    return DEFAULT_FILL_OPACITY;
  }, [populationOpacity]);

  /**
   * Empty GeoJSON for provinces source when no data is available.
   */
  const emptyProvincesGeoJSON: FeatureCollection<Polygon | MultiPolygon> = useMemo(() => ({
    type: 'FeatureCollection',
    features: [],
  }), []);

  /**
   * Empty GeoJSON for labels source when no data is available.
   * Requirement 7.1: THE MapView SHALL display text labels for the currently active color dimension
   */
  const emptyLabelsGeoJSON: LabelFeatureCollection = useMemo(() => ({
    type: 'FeatureCollection',
    features: [],
  }), []);

  const emptyLabelLinesGeoJSON: LabelLineFeatureCollection = useMemo(() => ({
    type: 'FeatureCollection',
    features: [],
  }), []);

  /**
   * Empty GeoJSON for entity outline source when no outline is available.
   * Requirement 8.4, 8.5, 8.6: Entity outline display
   */
  const emptyOutlineGeoJSON: FeatureCollection<Polygon | MultiPolygon> = useMemo(() => ({
    type: 'FeatureCollection',
    features: [],
  }), []);

  /**
   * Memoized entity outline GeoJSON with color property.
   * Requirement 8.4: THE MapView SHALL display the entity outline as a highlighted border using the entity's metadata color
   * Requirement 8.5: WHEN the selected province changes, THE MapView SHALL update the entity outline accordingly
   * Requirement 8.6: WHEN no province is selected, THE MapView SHALL clear the entity outline
   */
  const outlineGeoJSON = useMemo((): FeatureCollection<Polygon | MultiPolygon> => {
    if (!entityOutline) return emptyOutlineGeoJSON;
    return {
      type: 'FeatureCollection',
      features: [{
        ...entityOutline,
        properties: {
          ...entityOutline.properties,
          color: entityOutlineColor ?? FALLBACK_COLOR,
        },
      }],
    };
  }, [entityOutline, entityOutlineColor, emptyOutlineGeoJSON]);

  /**
   * Memoized filtered markers as GeoJSON.
   * Requirement 5.2: THE MapView SHALL display markers as icons on the map using a GeoJSON point source
   * Requirement 6.4: WHEN markers are fetched, THE MapView SHALL apply the current filter
   */
  const markersGeoJSON = useMemo(() => {
    const filteredMarkers = getFilteredMarkers();
    const geojson = markersToGeoJSON(filteredMarkers);
    
    // Debug logging for marker visibility issues
    console.log('[MapView] Markers GeoJSON:', {
      totalMarkers: markers.length,
      filteredMarkers: filteredMarkers.length,
      featuresCount: geojson.features.length,
      sampleFeature: geojson.features[0] ?? null,
      markerFilters,
      clusterMarkers,
    });
    
    return geojson;
  }, [markers, markerFilters, getFilteredMarkers, clusterMarkers]);

  /**
   * Memoized tooltip feature properties from currentAreaData.
   * Requirement 1.2, 1.3, 1.4, 1.5, 1.6: Tooltip displays entity info from area data
   */
  const tooltipFeatureProps = useMemo((): ProvinceFeatureProperties | null => {
    if (!hoveredProvinceId || !currentAreaData) {
      return null;
    }
    
    const provinceData = currentAreaData[hoveredProvinceId];
    if (!provinceData) {
      return null;
    }
    
    // ProvinceData format: [ruler, culture, religion, capital, population]
    // Index 0: ruler ID, Index 1: culture ID, Index 2: religion ID, Index 3: capital, Index 4: population
    const [ruler, culture, religion, , population] = provinceData;
    
    // Get religionGeneral from metadata if available
    let religionGeneral = religion;
    const religionEntry = metadata?.religion[religion];
    if (religionEntry?.parent) {
      religionGeneral = religionEntry.parent;
    }
    
    return {
      id: hoveredProvinceId,
      r: ruler,
      c: culture,
      e: religion,
      g: religionGeneral,
      p: population,
    };
  }, [hoveredProvinceId, currentAreaData, metadata]);

  /**
   * Handles retry action for failed data loading.
   * Requirement 12.3: Add retry button
   */
  const handleRetry = useCallback(() => {
    // Clear the error state
    setError(null);
    
    // Cancel any in-flight requests
    cancelAreaDataRequest();
    cancelMarkersRequest();
    
    // Retry loading data for the current year
    void loadAreaData(debouncedYear);
    void loadMarkers(debouncedYear);
  }, [setError, cancelAreaDataRequest, cancelMarkersRequest, loadAreaData, loadMarkers, debouncedYear]);

  /**
   * Handles dismissing the error message.
   * Requirement 12.4: Error state should be clearable
   */
  const handleDismissError = useCallback(() => {
    setError(null);
  }, [setError]);

  /**
   * Determines if "no data available" message should be shown.
   * Requirement 12.2: Display "No data available" for missing years
   */
  const showNoDataMessage = useMemo(() => {
    // Show no data message if:
    // 1. Not loading
    // 2. No error
    // 3. No current area data
    // 4. Map is loaded
    return !isLoadingAreaData && !error && !currentAreaData && isLoaded;
  }, [isLoadingAreaData, error, currentAreaData, isLoaded]);

  /**
   * Gets a user-friendly error message.
   * Requirement 12.1: Display connection error message
   */
  const getErrorMessage = useCallback((err: Error): string => {
    const message = err.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }
    
    if (message.includes('timeout')) {
      return 'The request timed out. Please try again.';
    }
    
    if (message.includes('404') || message.includes('not found')) {
      return 'The requested data was not found. This year may not have historical data available.';
    }
    
    if (message.includes('500') || message.includes('server')) {
      return 'A server error occurred. Please try again later.';
    }
    
    return err.message || 'An unexpected error occurred. Please try again.';
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
      const sidebarWidth = drawerOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED;
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
  }, [drawerOpen, setViewport]);

  /**
   * Subscribe to selectedYear changes and trigger data fetch.
   * Requirement 3.1: WHEN the selectedYear changes in Timeline_Store,
   * THE MapView SHALL fetch new area data from the chronas-api
   * Requirement 3.4: THE MapStore SHALL subscribe to Timeline_Store selectedYear changes
   * Requirement 3.6: WHEN the year changes, THE MapView SHALL update the URL query parameter 'year'
   * Requirement 5.1: WHEN the selectedYear changes, THE MapView SHALL fetch markers
   * Requirement 9.5: Cancel in-flight requests on new year change
   * Requirement 11.2: THE MapView SHALL debounce year change events (300ms)
   */
  useEffect(() => {
    // Handle initial render - load data for the initial year
    // Note: selectedYear is now initialized from URL synchronously in timelineStore,
    // so debouncedYear will have the correct value from the start
    
    // Debug: Log the current state to help diagnose URL year issues
    console.log('[MapView] Initial render check:', {
      initialLoadDone: initialLoadDoneRef.current,
      debouncedYear,
      selectedYear,
      prevYear: prevYearRef.current,
      urlSearch: window.location.search,
      urlHash: window.location.hash,
    });
    
    if (!initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true;
      prevYearRef.current = debouncedYear;
      
      // Always ensure the URL has the year parameter
      // This handles the case where user navigates to the app without a year in URL
      updateYearInURL(debouncedYear);
      
      // Load initial data for the current year (already set from URL in store)
      console.log('[MapView] Loading initial data for year:', debouncedYear);
      void loadAreaData(debouncedYear);
      void loadMarkers(debouncedYear);
      return;
    }

    // Only trigger if debounced year actually changed
    if (prevYearRef.current !== debouncedYear) {
      // Cancel any in-flight requests before starting new ones
      // Requirement 9.5, 11.2: Cancel in-flight requests on new year change
      console.log('[MapView] Year changed from', prevYearRef.current, 'to', debouncedYear, '- canceling in-flight requests');
      cancelAreaDataRequest();
      cancelMarkersRequest();
      
      prevYearRef.current = debouncedYear;
      
      // Update URL year parameter
      updateYearInURL(debouncedYear);
      
      // Trigger area data fetch for the new year
      void loadAreaData(debouncedYear);
      
      // Trigger markers fetch for the new year
      // Requirement 5.1: WHEN the selectedYear changes, THE MapView SHALL fetch markers
      void loadMarkers(debouncedYear);
      
      // Clear selected marker when year changes
      setSelectedMarker(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- selectedYear is intentionally omitted; we use debouncedYear to avoid excessive API calls (Requirement 11.2).
  }, [debouncedYear, loadAreaData, loadMarkers, cancelAreaDataRequest, cancelMarkersRequest]);

  // Refetch markers when the user changes the marker limit slider.
  // Skip the first render (initial mount) — the year-change effect already
  // loads markers with the initial limit.
  const prevMarkerLimitRef = useRef<number | null>(null);
  useEffect(() => {
    if (prevMarkerLimitRef.current === null) {
      prevMarkerLimitRef.current = debouncedMarkerLimit;
      return;
    }
    if (prevMarkerLimitRef.current !== debouncedMarkerLimit) {
      prevMarkerLimitRef.current = debouncedMarkerLimit;
      cancelMarkersRequest();
      void loadMarkers(debouncedYear);
    }
  }, [debouncedMarkerLimit, debouncedYear, loadMarkers, cancelMarkersRequest]);

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
   * Update province properties when provincesGeoJSON becomes available after area data is loaded.
   * This handles the race condition where loadAreaData completes before loadMetadata.
   * Requirement 4.2: WHEN area data changes, THE MapView SHALL update the province feature properties
   */
  const updateProvinceProperties = useMapStore((state) => state.updateProvinceProperties);
  
  useEffect(() => {
    // If we have both provincesGeoJSON and currentAreaData, ensure properties are updated
    // This handles the case where loadAreaData completed before loadMetadata
    if (provincesGeoJSON && currentAreaData) {
      // Check if properties need to be updated by looking at the first feature
      const firstFeature = provincesGeoJSON.features[0];
      const hasProperties = firstFeature?.properties?.['r'] !== undefined;
      
      if (!hasProperties) {
        // Properties haven't been set yet, update them now
        updateProvinceProperties(currentAreaData);
      }
    }
  }, [provincesGeoJSON, currentAreaData, updateProvinceProperties]);

  /**
   * Recalculate labels when activeColor dimension changes or when required data becomes available.
   * Requirement 7.1: THE MapView SHALL display text labels for the currently active label dimension
   * Requirement 7.2, 7.3, 7.4: Labels for ruler, culture, religion at territory centroids
   * 
   * Note: calculateLabels requires provincesGeoJSON, currentAreaData, AND metadata to be available.
   * We include all three in the dependency array to ensure labels are recalculated when any of them
   * becomes available (e.g., after metadata loads or after province properties are updated).
   * 
   * Labels are calculated based on activeLabel (not activeColor) to allow independent control
   * of area coloring and label display when the lock is disabled.
   */
  useEffect(() => {
    if (provincesGeoJSON && currentAreaData && metadata && activeLabel !== 'population') {
      calculateLabels(activeLabel);
    } else if (activeLabel === 'population') {
      // Population dimension doesn't have entity labels - clear them
      calculateLabels(activeLabel);
    }
  }, [activeLabel, provincesGeoJSON, currentAreaData, metadata, calculateLabels]);

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
   *
   * Kept as a backstop alongside `handleStyleData`, which normally wins the race
   * by a wide margin. MapLibre's `load` waits for the *first visually complete
   * render*, i.e. for every initially visible tile to have settled — see
   * `handleStyleData` for why that is too late to gate the UI on.
   */
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  /**
   * Ref callback for `<Map>`, used instead of passing `mapRef` directly so the
   * marker-icon resolver can be installed the instant the MapLibre instance
   * exists. React invokes this during the commit in which react-map-gl
   * constructs the map — well before the first tile is parsed, and therefore
   * before the first symbol placement asks for a `marker-*` image.
   */
  const attachMap = useCallback((instance: MapRef | null) => {
    mapRef.current = instance;

    const map = instance?.getMap();
    if (!map || iconsInstalledRef.current) return;
    iconsInstalledRef.current = true;

    // Expose the MapLibre instance for end-to-end tests. MapLibre doesn't
    // attach its instance to the DOM, so style internals (layers, resolved
    // text-fields, queryRenderedFeatures) are otherwise unassertable from
    // Playwright. Dev/test only — never shipped to production.
    if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
      (window as unknown as { __chronasMap?: unknown }).__chronasMap = map;
    }

    installMarkerIcons(map);
  }, []);

  /**
   * Bumps on every `styledata` event so the label effects below re-run once a
   * swapped basemap style is actually ready.
   *
   * Switching `mapStyle` tears down and rebuilds the style. The label effects
   * are keyed on `basemap`, but React re-runs them immediately — before
   * MapLibre has parsed the new style — so `setLayoutProperty` throws on a
   * layer that doesn't exist yet and the swallowing `try/catch` leaves the new
   * basemap's labels unlocalized. Re-running on `styledata` fixes that.
   *
   * Both effects are idempotent (they skip writes when the value already
   * matches), which is what keeps this from looping: `setLayoutProperty` itself
   * fires `styledata`, so a non-idempotent effect would re-trigger itself
   * forever.
   */
  const [styleVersion, setStyleVersion] = useState(0);

  /**
   * Also the point at which the map is considered ready.
   *
   * `styledata` means the stylesheet is parsed, which is the *actual*
   * precondition for everything gated on `isLoaded`: `setLayoutProperty` on the
   * label layers below, and hiding the loading overlay. MapLibre's `load` event
   * is much stronger — it additionally waits for every initially visible tile,
   * and OpenFreeMap's z2 planet tiles are ~600 kB apiece on a free, unmetered
   * CDN whose throughput we do not control. Measured against it while it was
   * shaping us to ~5 kB/s: `styledata` arrived in 1.8s while `load` had still
   * not fired after 60s. Gating on `load` therefore meant a spinner over a blank
   * map for minutes and basemap labels stuck in the local language for just as
   * long, where gating on the parsed style reveals the map as soon as there is
   * something to draw and lets tiles paint in as they arrive — the normal
   * behaviour of every other map on the web.
   *
   * The layer-count check is load-bearing: MapLibre also fires `styledata` for
   * the initial *empty* style, well before the basemap JSON has been fetched.
   * Treating that as ready hid the overlay after 734ms and left the user looking
   * at a blank background for another 11s, which is worse than the spinner.
   */
  const handleStyleData = useCallback(() => {
    setStyleVersion((version) => version + 1);
    const map = mapRef.current?.getMap();
    // Annotated, because MapLibre types `getStyle()` as always returning a
    // style while `Style.serialize()` in fact bails out to `undefined` until
    // `_loaded` — exactly the state the first `styledata` fires in.
    const style: StyleSpecification | undefined = map?.getStyle();
    if ((style?.layers.length ?? 0) > 0) {
      setIsLoaded(true);
    }
  }, []);

  /**
   * Switch basemap label language when locale changes.
   *
   * OpenMapTiles (OpenFreeMap's schema) exposes localized names as `name:xx`,
   * not Mapbox Streets' `name_xx`. See `buildLocalizedNameExpression` and
   * `textFieldReferencesName` for why we match on the expression rather than
   * the layer id.
   */
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !isLoaded) return;

    const localizedName = buildLocalizedNameExpression(locale);
    const serializedTarget = JSON.stringify(localizedName);

    try {
      const style = map.getStyle();
      for (const layer of style.layers) {
        if (layer.type !== 'symbol') continue;
        if (OWN_SOURCE_IDS.has(layer.source)) continue;
        const textField = layer.layout?.['text-field'];
        if (!textFieldReferencesName(textField)) continue;
        // Idempotency guard — see `styleVersion` above.
        if (JSON.stringify(textField) === serializedTarget) continue;
        map.setLayoutProperty(layer.id, 'text-field', localizedName);
      }
    } catch {
      // Style may not be loaded yet — the styledata bump will retry.
    }
  }, [locale, isLoaded, basemap, styleVersion]);

  /**
   * Toggle basemap country/state labels based on labelNameMode.
   * In 'historical' mode, hide basemap labels so only custom area-labels are visible.
   * In 'modern' mode, show basemap labels and hide custom area-labels.
   * In 'both' mode, show both.
   */
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !isLoaded) return;

    const visibility = labelNameMode === 'historical' ? 'none' : 'visible';

    try {
      const style = map.getStyle();
      for (const layer of style.layers) {
        if (layer.type !== 'symbol') continue;
        if (OWN_SOURCE_IDS.has(layer.source)) continue;
        // OpenMapTiles ids are `label_country_1`, `label_state`; Mapbox Streets
        // used `country-label`, `state-label`. Both match on these substrings.
        // (The old filter also tested `continent`, which matches nothing in
        // either schema.)
        if (!layer.id.includes('label')) continue;
        if (!layer.id.includes('country') && !layer.id.includes('state')) continue;
        // Idempotency guard — `visibility` defaults to 'visible' when unset.
        if ((layer.layout?.visibility ?? 'visible') === visibility) continue;
        map.setLayoutProperty(layer.id, 'visibility', visibility);
      }
    } catch {
      // Style may not be loaded yet — the styledata bump will retry.
    }
  }, [labelNameMode, isLoaded, basemap, styleVersion]);

  /**
   * Handles flyTo animation completion and syncs viewport position to URL.
   */
  const handleMoveEnd = useCallback((evt: ViewStateChangeEvent) => {
    if (flyToTarget) {
      clearFlyTo();
    }
    updatePositionInURL({
      latitude: evt.viewState.latitude,
      longitude: evt.viewState.longitude,
      zoom: evt.viewState.zoom,
    });
  }, [flyToTarget, clearFlyTo]);

  /**
   * Resize map when right drawer opens/closes to recalibrate coordinate system.
   * This fixes the issue where hover detection returns wrong provinces after
   * the map container size changes due to the right drawer opening.
   */
  useEffect(() => {
    // Only trigger on actual state change, not initial render
    if (prevRightDrawerOpenRef.current !== rightDrawerOpen) {
      prevRightDrawerOpenRef.current = rightDrawerOpen;

      // Wait for the CSS transition to complete (300ms) then resize the map
      const timeoutId = setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.resize();
        }
      }, 350); // Slightly longer than the 300ms CSS transition

      return () => { clearTimeout(timeoutId); };
    }
    return undefined;
  }, [rightDrawerOpen]);

  /**
   * Resize map when left drawer (layers panel) opens/closes.
   * Without this, Mapbox GL's internal canvas bounding rect becomes stale
   * and hover/click detection is offset by the drawer width.
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    }, 350);
    return () => { clearTimeout(timeoutId); };
  }, [drawerOpen]);

  /**
   * Handles mouse hover over map features (provinces and markers).
   * Requirement 7.3: WHEN the user hovers over a province, THE MapView SHALL highlight the province
   * Requirement 7.4: WHEN the user hovers over a province, THE MapView SHALL update the area-hover source
   * Requirement 1.1: WHEN the user hovers over a province, THE Tooltip SHALL appear within 100ms at the cursor position
   * Requirement 5.1, 5.2, 5.3: Marker hover highlight with size increase and highlight stroke
   */
  const handleMouseMove = useCallback((event: MapMouseEvent) => {
    // Update cursor position for tooltip positioning
    // Use clientX/clientY for viewport-relative positioning with position: fixed
    // This ensures the tooltip follows the cursor regardless of container position changes
    setCursorPosition({ x: event.originalEvent.clientX, y: event.originalEvent.clientY });
    
    // Check if we have features under the cursor
    const features = event.features;
    
    if (features && features.length > 0) {
      const feature = features[0];
      if (!feature) {
        setHoverInfo(null);
        setHoveredProvince(null);
        setHoveredMarker(null);
        setHoveredLabel(null);
        return;
      }
      
      // MapLibre GL returns feature.properties as a null-prototype object.
      // Normalize to a plain-prototype object so downstream consumers (e.g.
      // react-map-gl's deepEqual, which calls `.hasOwnProperty` when diffing
      // the area-hover <Source> data) don't crash the map. See issue #38.
      const properties = normalizeFeatureProperties(feature.properties);
      const layerId = feature.layer.id;

      // Check if hovering over an area label (line or point)
      if (layerId === 'area-labels-layer' || layerId === 'area-labels-points') {
        const labelName = (properties['n'] as string | undefined) ?? (properties['name'] as string | undefined);
        const entityId = properties['entityId'] as string | undefined;
        if (labelName) {
          setHoveredLabel({ name: labelName, entityId: entityId ?? '' });
          // Clear other hover states when over label
          setHoveredMarker(null);
          setHoveredProvince(null);
          setHoverInfo(null);
          return;
        }
      }
      
      // Clear label hover when not over a label
      setHoveredLabel(null);
      
      // Check if hovering over a marker
      // Requirement 5.1, 5.2, 5.3: Marker hover highlight
      if (layerId === 'markers-layer') {
        const markerId = properties['id'] as string | undefined;
        if (markerId) {
          // Set hovered marker for highlight effect
          setHoveredMarker(markerId);
          // Clear province hover when over marker
          setHoveredProvince(null);
          setHoverInfo(null);
          // Requirement 5.3: Cursor changes to pointer on marker hover
          // Note: Cursor is handled via CSS and map's cursor property
          return;
        }
      }
      
      // Clear marker hover when not over a marker
      setHoveredMarker(null);
      
      // Extract province ID from feature properties
      // GeoJSON features use 'name' property which matches area data keys
      const provinceId = (properties['name'] as string | undefined) ??
                         (properties['id'] as string | undefined) ?? 
                         (properties['provinceId'] as string | undefined) ??
                         (feature.id !== undefined ? String(feature.id) : undefined);
      
      // Update hover info state
      setHoverInfo({
        lngLat: [event.lngLat.lng, event.lngLat.lat],
        feature: properties,
        provinceId: provinceId,
      });
      
      // Update hoveredProvinceId in mapStore for tooltip display
      // Requirement 1.1, 1.7: Province hover triggers tooltip
      setHoveredProvince(provinceId ?? null);
    } else {
      // No features under cursor, clear hover state
      setHoverInfo(null);
      setHoveredProvince(null);
      setHoveredMarker(null);
    }
  }, [setHoveredProvince, setHoveredMarker]);

  /**
   * Handles mouse leave from the map.
   * Requirement 7.6: WHEN the mouse leaves a province, THE MapView SHALL clear the area-hover source
   * Requirement 1.7: WHEN the user moves the cursor away from a province, THE Tooltip SHALL disappear within 50ms
   * Requirement 5.4, 5.5: WHEN the user moves the cursor away from a marker, THE Marker SHALL return to original state
   */
  const handleMouseLeave = useCallback(() => {
    setHoverInfo(null);
    setHoveredProvince(null);
    setHoveredMarker(null);
    setHoveredLabel(null);
  }, [setHoveredProvince, setHoveredMarker]);

  /**
   * Handles click on map features (provinces, markers, and clusters).
   * Requirement 7.1: WHEN the user clicks on a province, THE MapView SHALL select that province
   * Requirement 7.2: WHEN a province is selected, THE MapStore SHALL store the selected province ID
   * Requirement 5.4: WHEN a marker is clicked, THE MapView SHALL display marker details
   * Requirement 5.5: WHEN a cluster is clicked, THE MapView SHALL zoom to expand the cluster
   * Requirement 2.1: WHEN a province is clicked, THE RightDrawer SHALL open
   * Requirement 2.3: WHEN a province is clicked, THE System SHALL update the URL query parameters
   * Requirement 3.9: WHEN a province click opens the RightDrawer, THE System SHALL close any existing marker popup
   */
  const handleClick = useCallback((event: MapMouseEvent) => {
    // Check if we have features under the cursor
    const features = event.features;
    
    if (features && features.length > 0) {
      const feature = features[0];
      if (!feature) {
        return;
      }
      
      // Normalize null-prototype properties from MapLibre GL (see issue #38).
      const properties = normalizeFeatureProperties(feature.properties);
      const layerId = feature.layer.id;

      // Check if clicked on an area label (line or point)
      // When a label is clicked, open the right drawer with the entity's Wikipedia article
      if (layerId === 'area-labels-layer' || layerId === 'area-labels-points') {
        const labelName = (properties['n'] as string | undefined) ?? (properties['name'] as string | undefined);
        const entityId = properties['entityId'] as string | undefined;
        
        if (labelName && entityId) {
          // Get wiki URL from metadata for the entity
          const metadataWiki = getEntityWiki(entityId, activeLabel);
          
          // Build wiki URL: prefer metadata wiki, fallback to entity name
          const wikiUrl = metadataWiki 
            ? `https://en.wikipedia.org/wiki/${encodeURIComponent(metadataWiki.replace(/ /g, '_'))}`
            : `https://en.wikipedia.org/wiki/${encodeURIComponent(labelName.replace(/ /g, '_'))}`;
          
          // Open right drawer with entity content
          // Label click shows the entity (ruler/culture/religion), not a specific province
          // Use labelName as provinceName for display, entityId for outline calculation
          openRightDrawer({
            type: 'epic',
            epicId: entityId,
            epicName: labelName,
            wikiUrl,
          });
          
          // Update URL state
          updateURLState({ type: 'area', value: entityId });
          
          // Calculate entity outline for the clicked label's entity
          if (activeLabel !== 'population') {
            calculateEntityOutline(entityId, activeLabel);
          }
          
          return;
        }
      }
      
      // Check if clicked on a cluster
      // Requirement 5.5: WHEN a cluster is clicked, THE MapView SHALL zoom to expand the cluster
      if (layerId === 'clusters' && properties['cluster_id'] !== undefined) {
        const clusterId = properties['cluster_id'] as number;
        const map = mapRef.current;
        
        if (map) {
          // Get the markers source to access cluster expansion zoom
          const source = map.getSource<GeoJSONSource>('markers');

          if (source) {
            // MapLibre's GeoJSONSource returns a promise here; Mapbox GL JS took
            // an (err, zoom) callback. Passing a callback to the promise form
            // silently never zooms, so this must stay promise-based.
            void source
              .getClusterExpansionZoom(clusterId)
              .then((zoom) => {
                // Get cluster coordinates from the feature geometry
                const geometry = feature.geometry;
                if (geometry.type === 'Point') {
                  const [lng, lat] = geometry.coordinates as [number, number];

                  // Animate map to cluster center at expansion zoom
                  map.easeTo({
                    center: [lng, lat],
                    zoom,
                    duration: 500,
                  });
                }
              })
              .catch((err: unknown) => {
                console.error('Error getting cluster expansion zoom:', err);
              });
          }
        }
        return;
      }
      
      // Check if clicked on a marker
      // Requirement 5.4: WHEN a marker is clicked, THE MapView SHALL display marker details
      // Requirement 3.1: WHEN a marker is clicked, THE RightDrawer SHALL open with marker details
      // Requirement 3.2: WHEN a marker is clicked, THE System SHALL update the URL query parameters
      if (layerId === 'markers-layer') {
        const markerId = properties['id'] as string | undefined;
        if (markerId) {
          // Find the marker in the markers array
          const clickedMarker = markers.find((m) => m._id === markerId);
          if (clickedMarker) {
            // Close any existing marker popup
            setSelectedMarker(null);
            
            // Open right drawer with marker content
            openRightDrawer({
              type: 'marker',
              marker: clickedMarker,
            });
            
            // Update URL state with marker type and ID
            updateURLState({ type: 'marker', value: markerId });
            return;
          }
        }
      }
      
      // Extract province ID from feature properties
      // GeoJSON features use 'name' property which matches area data keys (e.g., "Croatia", "Finnmark")
      const provinceId = (properties['name'] as string | undefined) ??
                         (properties['id'] as string | undefined) ?? 
                         (properties['provinceId'] as string | undefined) ??
                         (feature.id !== undefined ? String(feature.id) : undefined);
      
      if (provinceId) {
        // Update selected province in store
        selectProvince(provinceId);
        
        // Requirement 3.9: Close any existing marker popup when province is clicked
        setSelectedMarker(null);
        
        // Get province data from currentAreaData for the drawer
        const provinceData = currentAreaData?.[provinceId];
        
        // Requirement 8.1: Calculate entity outline for the selected province's entity
        // Note: We calculate the outline for display but do NOT automatically zoom to it.
        // This matches production behavior where clicking a province shows the entity outline
        // but keeps the viewport at the user's current position.
        if (provinceData) {
          // Get the entity value based on active color dimension
          // For religionGeneral, we use index 2 (religion) because we need the religion ID
          // to look up its parent (religionGeneral ID) in the metadata
          const entityValue = provinceData[activeColor === 'ruler' ? 0 : 
                                           activeColor === 'culture' ? 1 : 
                                           activeColor === 'religion' ? 2 :
                                           activeColor === 'religionGeneral' ? 2 : 0];
          
          // Calculate entity outline for the current dimension (for display only, no zoom)
          if (entityValue && activeColor !== 'population') {
            calculateEntityOutline(entityValue, activeColor);
            // Note: We intentionally do NOT call fitToEntityOutline here.
            // Production behavior: clicking a province does not zoom to entity bounds.
            // The entity outline is displayed but the viewport stays where the user clicked.
          }
        }
        
        // Requirement 2.1: Open right drawer with province content
        // Requirement 2.3: Update URL with type=area&value={provinceName}
        if (provinceData) {
          // Get the entity value based on active color dimension
          // For religionGeneral, we use index 2 (religion) because we need the religion ID
          // to look up its parent (religionGeneral ID) in the metadata
          const entityValue = provinceData[activeColor === 'ruler' ? 0 : 
                                           activeColor === 'culture' ? 1 : 
                                           activeColor === 'religion' ? 2 :
                                           activeColor === 'religionGeneral' ? 2 : 0];
          
          // Get wiki URL from metadata for the active entity
          // Production uses metadata[dimension][entityValue][2] for wiki URL
          const metadataWiki = activeColor !== 'population' && entityValue 
            ? getEntityWiki(entityValue, activeColor)
            : undefined;
          
          // Build wiki URL: prefer metadata wiki, fallback to province name
          const wikiUrl = metadataWiki 
            ? `https://en.wikipedia.org/wiki/${encodeURIComponent(metadataWiki.replace(/ /g, '_'))}`
            : `https://en.wikipedia.org/wiki/${encodeURIComponent(provinceId.replace(/ /g, '_'))}`;
          
          openRightDrawer({
            type: 'area',
            provinceId,
            provinceName: provinceId,
            wikiUrl,
          });
          
          // Update URL state
          updateURLState({ type: 'area', value: provinceId });
        } else {
          // Even without province data, open drawer with basic info
          openRightDrawer({
            type: 'area',
            provinceId,
            provinceName: provinceId,
          });
          
          // Update URL state
          updateURLState({ type: 'area', value: provinceId });
        }
      }
    }
  }, [selectProvince, markers, currentAreaData, openRightDrawer, activeColor, activeLabel, calculateEntityOutline, getEntityWiki]);

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

  /**
   * Intercept glyph requests to serve locally-hosted fonts (Cinzel Regular,
   * Cairo, Noto Sans SC) that the basemap's glyph endpoint doesn't publish.
   * The PBF files live in public/fonts/{fontstack}/{range}.pbf.
   */
  const transformRequest = useCallback((url: string, resourceType?: string) => {
    if (resourceType === 'Glyphs') {
      const local = resolveLocalGlyphUrl(url, LOCAL_FONT_NAMES);
      if (local) {
        if (local.droppedFonts.length > 0 && import.meta.env.DEV) {
          // A self-hosted font can only be served on its own, so any other
          // fonts in the stack lose their glyph coverage. `getAreaLabelFonts`
          // emits single-font stacks precisely to avoid this.
          console.warn(
            `[MapView] Glyph stack collapsed to "${local.url}"; dropped: ${local.droppedFonts.join(', ')}`
          );
        }
        return { url: local.url };
      }
    }
    return { url };
  }, []);

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
   * Sidebar is always 50px. When the menu drawer is open, add its width.
   */
  const leftOffset = drawerOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED;

  /**
   * Calculate right offset for right drawer.
   * Requirement 2.2: WHEN the RightDrawer opens, THE MapView SHALL reduce its width by 25%
   * Requirement 2.8: WHEN the RightDrawer closes, THE MapView SHALL expand to full width
   */
  const rightOffset = rightDrawerOpen ? `${String(RIGHT_DRAWER_WIDTH_PERCENT)}%` : '0';

  return (
    <div
      ref={containerRef}
      className={containerClassName}
      data-testid="map-container"
      data-theme={theme}
      data-sidebar-open={drawerOpen}
      data-right-drawer-open={rightDrawerOpen}
      style={{
        left: `${String(leftOffset)}px`,
        right: rightOffset,
        // Requirement 15.4: THE MapView SHALL animate layout transitions
        transition: 'left 300ms cubic-bezier(0.4, 0, 0.2, 1), right 300ms cubic-bezier(0.4, 0, 0.2, 1), width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Loading indicator */}
      {!isLoaded && (
        <div className={styles['loading']}>
          <div className={styles['spinner']} />
          <p>Loading map...</p>
        </div>
      )}

      {/* Error display overlay */}
      {/* Requirement 12.1: Display connection error message */}
      {/* Requirement 12.2: Display "No data available" for missing years */}
      {/* Requirement 12.3: Add retry button */}
      {error && (
        <div className={styles['errorOverlay']} data-theme={theme}>
          <svg 
            className={styles['errorIcon']} 
            viewBox="0 0 24 24" 
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <h3 className={styles['errorTitle']}>Error Loading Data</h3>
          <p className={styles['errorMessage']}>{getErrorMessage(error)}</p>
          <div className={styles['errorActions']}>
            <button 
              className={styles['retryButton']} 
              onClick={handleRetry}
              disabled={isLoadingAreaData}
            >
              {isLoadingAreaData ? 'Retrying...' : 'Retry'}
            </button>
            <button 
              className={styles['dismissButton']} 
              onClick={handleDismissError}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* No data available message */}
      {/* Requirement 12.2: Display "No data available" for missing years */}
      {showNoDataMessage && (
        <div className={styles['noDataMessage']} data-theme={theme}>
          <svg 
            className={styles['noDataIcon']} 
            viewBox="0 0 24 24" 
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
          <h3 className={styles['noDataTitle']}>No Data Available</h3>
          <p className={styles['noDataText']}>
            Historical data is not available for year {debouncedYear}.
          </p>
        </div>
      )}

      {/* Map component */}
      {/* Requirement 1.2: WHEN the basemap state changes, THE MapView SHALL update the map style */}
      {/* Requirement 1.3: THE MapView SHALL support four basemap options: topographic, satellite, light, and none */}
      {/* Requirement 1.4: WHEN basemap is set to "none", THE MapView SHALL display only province fill layers */}
      <Map
        ref={attachMap}
        transformRequest={transformRequest}
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
        mapStyle={BASEMAP_STYLES[basemap]}
        onMove={handleMove}
        onLoad={handleLoad}
        onStyleData={handleStyleData}
        onMoveEnd={handleMoveEnd}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        interactiveLayerIds={['area-fill', 'provinces-fill', 'ruler-fill', 'culture-fill', 'religion-fill', 'religionGeneral-fill', 'population-fill', 'markers-layer', 'clusters', 'area-labels-layer', 'area-labels-points']}
        attributionControl={ATTRIBUTION_OPTIONS}
        reuseMaps
        // Requirement 5.3: WHEN the user hovers over a marker, THE Cursor SHALL change to a pointer
        {...(hoveredMarkerId ? { cursor: 'pointer' } : {})}
      >
        {/* Provinces GeoJSON source */}
        {/* Requirement 4.1: THE MapView SHALL maintain a 'provinces' GeoJSON source */}
        <Source 
          id="provinces" 
          type="geojson" 
          data={provincesGeoJSON ?? emptyProvincesGeoJSON}
        >
          {/* Ruler fill layer */}
          {/* Requirement 3.1: Color provinces using ruler metadata colors based on 'r' property */}
          <Layer
            id="ruler-fill"
            type="fill"
            layout={{
              visibility: layerVisibility.ruler ? 'visible' : 'none',
            }}
            paint={{
              'fill-color': colorExpressions.ruler,
              'fill-opacity': fillOpacityExpr,
            }}
          />

          {/* Culture fill layer */}
          {/* Requirement 3.2: Color provinces using culture metadata colors based on 'c' property */}
          <Layer
            id="culture-fill"
            type="fill"
            layout={{
              visibility: layerVisibility.culture ? 'visible' : 'none',
            }}
            paint={{
              'fill-color': colorExpressions.culture,
              'fill-opacity': fillOpacityExpr,
            }}
          />

          {/* Religion fill layer */}
          {/* Requirement 3.3: Color provinces using religion metadata colors based on 'e' property */}
          <Layer
            id="religion-fill"
            type="fill"
            layout={{
              visibility: layerVisibility.religion ? 'visible' : 'none',
            }}
            paint={{
              'fill-color': colorExpressions.religion,
              'fill-opacity': fillOpacityExpr,
            }}
          />

          {/* Religion General fill layer */}
          {/* Requirement 3.4: Color provinces using religionGeneral metadata colors based on 'g' property */}
          <Layer
            id="religionGeneral-fill"
            type="fill"
            layout={{
              visibility: layerVisibility.religionGeneral ? 'visible' : 'none',
            }}
            paint={{
              'fill-color': colorExpressions.religionGeneral,
              'fill-opacity': fillOpacityExpr,
            }}
          />

          {/* Population fill layer */}
          {/* Requirement 3.5: Color provinces using interpolated opacity based on 'p' property */}
          <Layer
            id="population-fill"
            type="fill"
            layout={{
              visibility: layerVisibility.population ? 'visible' : 'none',
            }}
            paint={{
              'fill-color': POPULATION_FILL_COLOR,
              'fill-opacity': populationOpacityExpr,
            }}
          />

          {/* Province borders layer */}
          {/* Requirement 2.2: WHEN showProvinceBorders is true, THE MapView SHALL display province border lines */}
          {/* Requirement 2.3: WHEN showProvinceBorders is false, THE MapView SHALL hide province border lines */}
          {/* Requirement 2.4: THE MapView SHALL use a distinct stroke color for province borders */}
          <Layer
            id="province-borders"
            type="line"
            paint={{
              'line-color': '#333333',
              'line-width': 0.5,
              'line-opacity': 0.8,
            }}
            layout={{
              visibility: showProvinceBorders ? 'visible' : 'none',
            }}
          />

          {/* Province outline layer for all dimensions */}
          <Layer
            id="provinces-outline"
            type="line"
            paint={{
              'line-color': themeConfig.foreColors[0],
              'line-width': 0.5,
              'line-opacity': 0.3,
            }}
          />
        </Source>

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

        {/* Markers GeoJSON source and layer */}
        {/* Requirement 5.2: THE MapView SHALL display markers as icons on the map using a GeoJSON point source */}
        {/* Requirement 5.3: THE MapView SHALL support marker types: battles, cities, capitals, people */}
        {/* Requirement 5.4: THE MapView SHALL use Mapbox GL clustering with a cluster radius of 50 pixels */}
        {/* Requirement 5.5: THE MapView SHALL use appropriate icons for each marker type */}
        {/* Requirement 5.1, 5.2: Marker hover highlight with size increase and highlight stroke */}
        <Source 
          id="markers" 
          type="geojson" 
          data={markersGeoJSON}
          cluster={clusterMarkers}
          clusterMaxZoom={14}
          clusterRadius={50}
        >
          {/* Cluster circles layer */}
          {/* Requirement 5.2: THE MapView SHALL group nearby markers into clusters */}
          {/* Cluster colors based on point_count: cyan (<10), yellow (10-50), pink (>50) */}
          <Layer
            id="clusters"
            type="circle"
            filter={['has', 'point_count']}
            paint={{
              'circle-color': [
                'step',
                ['get', 'point_count'],
                '#51bbd6', // cyan for < 10 points
                10,
                '#f1f075', // yellow for 10-50 points
                50,
                '#f28cb1', // pink for > 50 points
              ],
              'circle-radius': [
                'step',
                ['get', 'point_count'],
                15, // 15px radius for < 10 points
                10,
                20, // 20px radius for 10-50 points
                50,
                25, // 25px radius for > 50 points
              ],
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
            }}
          />

          {/* Cluster count label layer */}
          {/* Requirement 5.2: Display count labels on cluster circles */}
          <Layer
            id="cluster-count"
            type="symbol"
            filter={['has', 'point_count']}
            layout={{
              'text-field': ['get', 'point_count_abbreviated'],
              // Single-font stack: a glyph server resolves `[a, b]` as one
              // request for the comma-joined stack "a,b", and OpenFreeMap only
              // serves exact single-font names. The previous
              // ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'] was
              // Mapbox-only on both entries, so cluster counts would have had
              // no glyphs at all.
              'text-font': [DEFAULT_BOLD_FONT],
              'text-size': 12,
              'text-allow-overlap': true,
            }}
            paint={{
              'text-color': '#333333',
            }}
          />

          {/* Individual markers layer (unclustered points) */}
          {/* Requirement 5.3: THE MapView SHALL display all markers individually when clustering is disabled */}
          {/* Using custom icons from themed-atlas.png sprite sheet */}
          <Layer
            id="markers-layer"
            type="symbol"
            filter={['!', ['has', 'point_count']]}
            layout={{
              'icon-image': [
                'match',
                ['get', 'type'],
                // Map API marker types to custom icon IDs
                'cp', 'marker-cp',   // Capital
                'c', 'marker-c',     // City
                'ca', 'marker-ca',   // Castle
                'b', 'marker-b',     // Battle
                'si', 'marker-si',   // Siege
                'l', 'marker-l',     // Landmark
                'm', 'marker-m',     // Military
                'p', 'marker-p',     // Politician/Person
                'e', 'marker-e',     // Explorer
                's', 'marker-s',     // Scientist
                'a', 'marker-a',     // Artist
                'r', 'marker-r',     // Religious
                'at', 'marker-at',   // Athlete
                'op', 'marker-op',   // Unclassified
                'o', 'marker-o',     // Unknown
                'ar', 'marker-ar',   // Artifact
                'ai', 'marker-l',    // Architecture -> Landmark
                'h', 'marker-p',     // Historical figure -> Person
                'marker-o',          // Default fallback
              ],
              'icon-size': [
                'interpolate',
                ['linear'],
                ['zoom'],
                2, 0.08,  // At zoom 2, icons are 8% size (very small when fully zoomed out)
                4, 0.12,  // At zoom 4, icons are 12% size
                6, 0.18,  // At zoom 6, icons are 18% size
                8, 0.25,  // At zoom 8, icons are 25% size
                10, 0.35, // At zoom 10, icons are 35% size
                12, 0.5,  // At zoom 12, icons are 50% size
                14, 0.7,  // At zoom 14, icons are 70% size
                16, 1.0,  // At zoom 16+, icons are full size
              ],
              'icon-allow-overlap': true,
              'icon-ignore-placement': false,
              'icon-anchor': 'bottom',
            }}
            paint={{
              'icon-opacity': [
                'case',
                ['==', ['get', 'id'], hoveredMarkerId ?? ''],
                1.0,  // Full opacity on hover
                0.85, // Slightly transparent normally
              ],
            }}
          />
          {/* Marker label layer (unclustered points only) - only visible when zoomed in */}
          <Layer
            id="markers-label"
            type="symbol"
            filter={['!', ['has', 'point_count']]}
            minzoom={5}
            layout={{
              'text-field': ['get', 'name'],
              'text-size': [
                'interpolate',
                ['linear'],
                ['zoom'],
                5, 9,
                7, 11,
                9, 13,
                12, 14,
              ],
              'text-offset': [0, 1.2],
              'text-anchor': 'top',
              'text-optional': true,
              // Single-font stack — see the cluster-count layer above.
              // 'Arial Unicode MS Regular' only ever existed on Mapbox's glyph
              // endpoint, and its presence turned this into the unservable
              // stack "Noto Sans Regular,Arial Unicode MS Regular".
              'text-font': [DEFAULT_FONT],
              'text-max-width': 10,
            }}
            paint={{
              'text-color': '#333333',
              'text-halo-color': '#ffffff',
              'text-halo-width': 2,
            }}
          />
        </Source>

        {/* Area labels - bezier curve line labels (old Chronas-style) */}
        {/* Labels flow along bezier curves through territory using symbol-placement: line-center */}
        <Source id="area-label-lines" type="geojson" data={labelLineData ?? emptyLabelLinesGeoJSON}>
          <Layer
            id="area-labels-layer"
            type="symbol"
            layout={{
              visibility: labelNameMode === 'modern' ? 'none' : 'visible',
              'symbol-placement': AREA_LABEL_CONFIG.lineLayout.symbolPlacement,
              'text-field': ['get', 'n'],
              'text-font': getAreaLabelFonts(locale),
              'text-transform': AREA_LABEL_CONFIG.lineLayout.textTransform,
              'text-allow-overlap': AREA_LABEL_CONFIG.lineLayout.textAllowOverlap,
              'text-size': AREA_LABEL_CONFIG.lineLayout.textSize as MapExpression,
              'text-letter-spacing': AREA_LABEL_CONFIG.lineLayout.textLetterSpacing,
              'text-max-angle': AREA_LABEL_CONFIG.lineLayout.textMaxAngle,
              'text-padding': AREA_LABEL_CONFIG.lineLayout.textPadding,
              'symbol-sort-key': ['*', -1, ['get', 'd']],
            }}
            paint={{
              'text-color': AREA_LABEL_CONFIG.linePaint.textColor,
              'text-halo-width': AREA_LABEL_CONFIG.linePaint.textHaloWidth,
              'text-halo-blur': AREA_LABEL_CONFIG.linePaint.textHaloBlur,
              'text-halo-color': AREA_LABEL_CONFIG.linePaint.textHaloColor,
              'text-opacity': AREA_LABEL_CONFIG.lineTextOpacity as MapExpression,
            }}
          />
        </Source>

        {/* Area labels - point labels (fallback for small entities or when line labels don't render) */}
        <Source id="area-labels" type="geojson" data={labelData ?? emptyLabelsGeoJSON}>
          <Layer
            id="area-labels-points"
            type="symbol"
            layout={{
              visibility: labelNameMode === 'modern' ? 'none' : 'visible',
              'text-field': ['get', 'name'],
              'text-size': AREA_LABEL_CONFIG.pointLayout.textSize as MapExpression,
              'text-font': getAreaLabelFonts(locale),
              'text-anchor': AREA_LABEL_CONFIG.pointLayout.textAnchor,
              'text-allow-overlap': AREA_LABEL_CONFIG.pointLayout.textAllowOverlap,
              'text-ignore-placement': AREA_LABEL_CONFIG.pointLayout.textIgnorePlacement,
              'text-optional': AREA_LABEL_CONFIG.pointLayout.textOptional,
              'text-transform': AREA_LABEL_CONFIG.pointLayout.textTransform,
              'text-letter-spacing': AREA_LABEL_CONFIG.pointLayout.textLetterSpacing,
              'text-max-width': AREA_LABEL_CONFIG.pointLayout.textMaxWidth,
              'text-padding': AREA_LABEL_CONFIG.pointLayout.textPadding,
              'symbol-sort-key': ['*', -1, ['get', 'fontSize']],
            }}
            paint={{
              'text-color': AREA_LABEL_CONFIG.pointPaint.textColor,
              'text-halo-color': AREA_LABEL_CONFIG.pointPaint.textHaloColor,
              'text-halo-width': AREA_LABEL_CONFIG.pointPaint.textHaloWidth,
              'text-halo-blur': AREA_LABEL_CONFIG.pointPaint.textHaloBlur,
              'text-opacity': AREA_LABEL_CONFIG.pointTextOpacity as MapExpression,
            }}
          />
        </Source>

        {/* Entity outline GeoJSON source and layer */}
        {/* Requirement 8.4: THE MapView SHALL display the entity outline as a highlighted border using the entity's metadata color */}
        {/* Requirement 8.5: WHEN the selected province changes, THE MapView SHALL update the entity outline accordingly */}
        {/* Requirement 8.6: WHEN no province is selected, THE MapView SHALL clear the entity outline */}
        <Source id="entity-outline" type="geojson" data={outlineGeoJSON}>
          <Layer
            id="entity-outline-layer"
            type="line"
            paint={{
              'line-color': ['get', 'color'],
              'line-width': 3,
              'line-opacity': 0.8,
            }}
          />
        </Source>

        {/* Marker popup */}
        {/* Requirement 5.4: WHEN a marker is clicked, THE MapView SHALL display marker details */}
        {selectedMarker && (
          <Popup
            longitude={selectedMarker.coo[0]}
            latitude={selectedMarker.coo[1]}
            onClose={() => { setSelectedMarker(null); }}
            closeOnClick={false}
            anchor="bottom"
            className={styles['markerPopup'] ?? ''}
          >
            <div className={styles['markerPopupContent']}>
              <h3 className={styles['markerPopupTitle']}>{selectedMarker.name}</h3>
              <p className={styles['markerPopupType']}>
                <strong>Type:</strong> {selectedMarker.type}
              </p>
              <p className={styles['markerPopupYear']}>
                <strong>Year:</strong> {selectedMarker.year}
              </p>
              {selectedMarker.data?.description && (
                <p className={styles['markerPopupDescription']}>
                  {selectedMarker.data.description}
                </p>
              )}
              {selectedMarker.wiki && (
                <a
                  href={selectedMarker.wiki}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles['markerPopupLink']}
                >
                  Learn more
                </a>
              )}
            </div>
          </Popup>
        )}
      </Map>

      {/* Province hover tooltip */}
      {/* Requirement 1.1: WHEN the user hovers over a province, THE Tooltip SHALL appear within 100ms at the cursor position */}
      {/* Requirement 1.2, 1.3, 1.4, 1.5: Show entity info with color chips and icons */}
      {/* Requirement 1.6: Show province name and formatted population */}
      {/* Requirement 1.7: WHEN the user moves the cursor away, THE Tooltip SHALL disappear within 50ms */}
      {tooltipFeatureProps && metadata && (
        <ProvinceTooltip
          feature={tooltipFeatureProps}
          metadata={metadata}
          activeColor={activeColor}
          theme={theme}
          position={cursorPosition}
        />
      )}

      {/* Label hover tooltip */}
      {/* Shows the entity name when hovering over a map label */}
      {hoveredLabel && (
        <div
          className={styles['labelTooltip']}
          style={{
            position: 'fixed',
            left: cursorPosition.x + 12,
            top: cursorPosition.y + 12,
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        >
          <div className={styles['labelTooltipContent']}>
            {hoveredLabel.name}
          </div>
        </div>
      )}

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
