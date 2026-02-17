/**
 * Map Store
 *
 * Manages map state including viewport, active color dimension, and map interactions.
 * Uses Zustand for state management.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.6, 3.1, 3.2, 7.2, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 12.2, 13.1, 13.4
 */

import { create } from 'zustand';
import * as turf from '@turf/turf';
import type { Feature, Polygon, MultiPolygon, FeatureCollection, Point } from 'geojson';
import { apiClient } from '../api/client';
import { AREAS, METADATA, MARKERS } from '../api/endpoints';
import type { MapAreaData, Marker, MarkerFilterState, MarkerType } from '../api/types';

/**
 * Area data for a single province
 * Index 0: ruler ID
 * Index 1: culture ID
 * Index 2: religion ID
 * Index 3: capital ID (optional)
 * Index 4: population value
 *
 * Requirements: 12.2
 */
export type ProvinceData = [string, string, string, string | null, number];

/**
 * Area data dictionary keyed by province ID
 *
 * Requirements: 12.2
 */
export type AreaData = Record<string, ProvinceData>;

/**
 * Viewport state interface containing all map view properties.
 * Requirement 2.1: THE MapStore SHALL maintain viewport state including
 * longitude, latitude, zoom, pitch, bearing, width, height
 */
export interface ViewportState {
  /** Latitude coordinate (degrees) */
  latitude: number;
  /** Longitude coordinate (degrees) */
  longitude: number;
  /** Zoom level */
  zoom: number;
  /** Minimum zoom level allowed */
  minZoom: number;
  /** Bearing (rotation) in degrees */
  bearing: number;
  /** Pitch (tilt) in degrees */
  pitch: number;
  /** Viewport width in pixels */
  width: number;
  /** Viewport height in pixels */
  height: number;
}

/**
 * Area color dimension type for province coloring.
 * Provinces can be colored by ruler, religion, religionGeneral, culture, or population.
 */
export type AreaColorDimension = 'ruler' | 'religion' | 'religionGeneral' | 'culture' | 'population';

/**
 * Basemap type for map background style.
 * Requirement 1.3: THE MapView SHALL support three basemap options: topographic, watercolor, and none
 */
export type BasemapType = 'topographic' | 'watercolor' | 'none';

/**
 * Mapping of basemap types to Mapbox style URLs.
 * Requirement 1.2: WHEN the basemap state changes, THE MapView SHALL update the map style
 */
export const BASEMAP_STYLES: Record<BasemapType, string> = {
  topographic: 'mapbox://styles/mapbox/outdoors-v12',
  watercolor: 'mapbox://styles/stamen/cj3hzkdwfaw1v2sqmrlvmdqjf', // Stamen watercolor style
  none: 'mapbox://styles/mapbox/empty-v9', // Minimal style with no features
};

/**
 * Options for the flyTo animation action.
 * Requirement 2.6: THE MapStore SHALL provide a flyTo action that animates
 * the viewport to a target location
 */
export interface FlyToOptions {
  /** Target latitude */
  latitude: number;
  /** Target longitude */
  longitude: number;
  /** Target zoom level (optional) */
  zoom?: number | undefined;
  /** Animation duration in milliseconds (default: 2000) */
  duration?: number | undefined;
  /** Bearing at target (optional) */
  bearing?: number | undefined;
  /** Pitch at target (optional) */
  pitch?: number | undefined;
}

/**
 * Layer visibility state for area color dimensions.
 * Requirement 5.4: setActiveColor action toggles layer visibility
 */
export type LayerVisibility = Record<AreaColorDimension, boolean>;

/**
 * Map state interface
 */
export interface MapState {
  /** Current viewport state */
  viewport: ViewportState;
  /** Selected basemap style - Requirement 1.1 */
  basemap: BasemapType;
  /** Whether province borders are visible - Requirement 2.1 */
  showProvinceBorders: boolean;
  /** Whether population-based opacity is enabled - Requirement 3.1 */
  populationOpacity: boolean;
  /** Active color dimension for area coloring */
  activeColor: AreaColorDimension;
  /** Active label dimension for entity labels - Requirement 6.4, 6.5 */
  activeLabel: AreaColorDimension;
  /** Whether color and label dimensions are locked together - Requirement 6.4, 6.5 */
  colorLabelLocked: boolean;
  /** Previous active color dimension (for tracking changes) - Requirement 5.3 */
  previousActiveColor: AreaColorDimension | null;
  /** Layer visibility state for each color dimension - Requirement 5.4 */
  layerVisibility: LayerVisibility;
  /** Whether a flyTo animation is in progress */
  isFlying: boolean;
  /** Current flyTo target (null when not flying) */
  flyToTarget: FlyToOptions | null;
  /** Cached area data by year - Requirement 12.2 */
  areaDataCache: Map<number, AreaData>;
  /** Current area data for the selected year */
  currentAreaData: AreaData | null;
  /** Whether area data is currently being loaded */
  isLoadingAreaData: boolean;
  /** Selected province ID - Requirement 7.2 */
  selectedProvince: string | null;
  /** Selected province data - Requirement 7.2 */
  selectedProvinceData: ProvinceData | null;
  /** Hovered province ID for tooltip display - Requirement 5.1 */
  hoveredProvinceId: string | null;
  /** Hovered marker ID for highlight - Requirement 5.1 */
  hoveredMarkerId: string | null;
  /** Error state for display - Requirement 13.4 */
  error: Error | null;
  /** Entity outline polygon - Requirement 8.1, 8.2, 8.5 */
  entityOutline: Feature<Polygon | MultiPolygon> | null;
  /** Entity outline color - Requirement 8.4 */
  entityOutlineColor: string | null;
  /** Provinces GeoJSON for entity outline calculation */
  provincesGeoJSON: FeatureCollection<Polygon | MultiPolygon> | null;
  /** Metadata for entity colors - Requirement 2.2 */
  metadata: EntityMetadata | null;
  /** Whether metadata is currently being loaded - Requirement 2.1 */
  isLoadingMetadata: boolean;
  /** Historical markers for the current year - Requirement 5.1 */
  markers: Marker[];
  /** Whether markers are currently being loaded - Requirement 5.1 */
  isLoadingMarkers: boolean;
  /** Maximum markers to fetch from API - Requirement 4.1, 4.5 */
  markerLimit: number;
  /** Whether marker clustering is enabled - Requirement 5.1 */
  clusterMarkers: boolean;
  /** Marker filter state for toggling visibility by type - Requirement 6.3 */
  markerFilters: MarkerFilterState;
  /** Label data for entity labels on the map - Requirement 7.1 */
  labelData: LabelFeatureCollection | null;
  /** AbortController for cancelling in-flight area data requests - Requirement 9.5, 11.2 */
  areaDataAbortController: AbortController | null;
  /** AbortController for cancelling in-flight marker requests - Requirement 9.5, 11.2 */
  markersAbortController: AbortController | null;
}

/**
 * Entity metadata structure for colors
 * Requirement 8.4: THE MapView SHALL color the entity outline using the metadata color
 */
export interface EntityMetadata {
  ruler: Record<string, MetadataEntry>;
  culture: Record<string, MetadataEntry>;
  religion: Record<string, MetadataEntry>;
  religionGeneral: Record<string, MetadataEntry>;
}

/**
 * Metadata entry with name and color
 */
export interface MetadataEntry {
  /** Display name */
  name: string;
  /** Color value (rgba string) */
  color: string;
  /** Optional: Wikipedia URL for the entity */
  wiki?: string;
  /** Optional: parent category for religionGeneral mapping */
  parent?: string;
}

/**
 * Label feature properties for entity labels on the map.
 * Requirement 7.1, 7.5, 7.6: Labels display entity names at territory centroids
 */
export interface LabelFeatureProperties {
  /** Entity display name */
  name: string;
  /** Font size based on territory area */
  fontSize: number;
  /** Entity ID */
  entityId: string;
  /** Dimension type */
  dimension: AreaColorDimension;
}

/**
 * GeoJSON FeatureCollection for label data.
 * Requirement 7.1: THE MapView SHALL display text labels for the currently active color dimension
 */
export type LabelFeatureCollection = FeatureCollection<Point, LabelFeatureProperties>;

/**
 * Map actions interface
 */
export interface MapActions {
  /**
   * Updates the viewport state with partial values.
   * Requirement 2.3: WHEN the user pans or zooms the map,
   * THE MapStore SHALL update the viewport state
   *
   * @param viewport - Partial viewport state to merge
   */
  setViewport: (viewport: Partial<ViewportState>) => void;

  /**
   * Sets the basemap style for the map.
   * Requirement 1.1: WHEN the user selects a basemap option, THE MapStore SHALL update the basemap state
   *
   * @param basemap - The basemap style to set ('topographic', 'watercolor', or 'none')
   */
  setBasemap: (basemap: BasemapType) => void;

  /**
   * Sets whether province borders are visible.
   * Requirement 2.1: WHEN the user toggles the "Show Provinces" checkbox, THE MapStore SHALL update the showProvinceBorders state
   *
   * @param show - Whether province borders should be visible
   */
  setShowProvinceBorders: (show: boolean) => void;

  /**
   * Sets whether population-based opacity is enabled.
   * Requirement 3.1: WHEN the user toggles the "Opacity by Population" checkbox, THE MapStore SHALL update the populationOpacity state
   *
   * @param enabled - Whether population-based opacity should be enabled
   */
  setPopulationOpacity: (enabled: boolean) => void;

  /**
   * Sets the maximum number of markers to fetch from the API.
   * Requirement 4.1: WHEN the user adjusts the marker limit slider, THE MapStore SHALL update the markerLimit state
   * Requirement 4.5: THE MapStore SHALL default markerLimit to 5000
   *
   * @param limit - The maximum number of markers (clamped to [0, 10000])
   */
  setMarkerLimit: (limit: number) => void;

  /**
   * Sets whether marker clustering is enabled.
   * Requirement 5.1: WHEN the user toggles the "Cluster Markers" checkbox, THE MapStore SHALL update the clusterMarkers state
   *
   * @param enabled - Whether marker clustering should be enabled
   */
  setClusterMarkers: (enabled: boolean) => void;

  /**
   * Initiates a flyTo animation to a target location.
   * Requirement 2.6: THE MapStore SHALL provide a flyTo action that
   * animates the viewport to a target location
   *
   * The actual animation is handled by the MapView component using
   * react-map-gl's flyTo method. This action stores the target for
   * the component to consume.
   *
   * @param options - FlyTo options including target coordinates
   */
  flyTo: (options: FlyToOptions) => void;

  /**
   * Clears the flyTo target after animation completes.
   * Called by MapView when the animation finishes.
   */
  clearFlyTo: () => void;

  /**
   * Sets the active color dimension for area coloring.
   * Requirement 5.4: setActiveColor action updates activeColor state and toggles layer visibility.
   * Requirement 5.3: When active color dimension changes, update visible layer and hide previous.
   *
   * @param dimension - The color dimension to activate
   */
  setActiveColor: (dimension: AreaColorDimension) => void;

  /**
   * Gets the current layer visibility state.
   * Requirement 5.4: Layer visibility is managed based on active color dimension.
   *
   * @returns The current layer visibility state
   */
  getLayerVisibility: () => LayerVisibility;

  /**
   * Loads area data for a specific year with caching.
   * Requirement 12.2: THE MapStore SHALL cache area data by year
   * to avoid redundant API calls.
   *
   * If data for the year is already cached, returns cached data immediately.
   * Otherwise, sets isLoadingAreaData=true and prepares for API fetch.
   * The actual API call will be implemented in task 9.3.
   *
   * @param year - The year to load area data for
   * @returns Promise that resolves when data is loaded or retrieved from cache
   */
  loadAreaData: (year: number) => Promise<AreaData | null>;

  /**
   * Sets area data directly (used for testing and API response handling).
   *
   * @param year - The year the data is for
   * @param data - The area data to set
   */
  setAreaData: (year: number, data: AreaData) => void;

  /**
   * Clears the area data cache.
   * Useful for memory management or forcing fresh data.
   */
  clearAreaDataCache: () => void;

  /**
   * Selects a province and stores its data from currentAreaData.
   * Requirement 7.2: WHEN a province is selected, THE MapStore SHALL
   * store the selected province ID and its data.
   *
   * @param provinceId - The ID of the province to select
   */
  selectProvince: (provinceId: string) => void;

  /**
   * Clears the selected province.
   * Requirement 7.2: Allows clearing the selection state.
   */
  clearSelection: () => void;

  /**
   * Sets or clears the error state.
   * Requirement 13.4: WHEN an error occurs, THE MapStore SHALL
   * store the error state for display.
   *
   * @param error - The error to set, or null to clear
   */
  setError: (error: Error | null) => void;

  /**
   * Calculates the entity outline for all provinces with a matching value.
   * Requirement 8.1: WHEN a province is selected, THE MapView SHALL calculate
   * the entity outline for that province's ruler/culture/religion.
   * Requirement 8.2: THE MapView SHALL use turf.union to merge all provinces.
   * Requirement 8.5: THE MapView SHALL use turf.unkinkPolygon to handle self-intersecting polygons.
   *
   * @param value - The entity value to match (e.g., ruler ID)
   * @param dimension - The dimension to match against (ruler, culture, religion, religionGeneral)
   */
  calculateEntityOutline: (value: string, dimension: AreaColorDimension) => void;

  /**
   * Fits the viewport to the entity outline bounding box.
   * Requirement 8.3: THE MapView SHALL fit the viewport to the entity outline bounding box.
   * Requirement 8.6: THE MapView SHALL constrain the zoom level between 4.5 and (current zoom - 1).
   *
   * @param padding - Optional padding around the bounding box (default: 50)
   */
  fitToEntityOutline: (padding?: number) => void;

  /**
   * Clears the entity outline.
   */
  clearEntityOutline: () => void;

  /**
   * Sets the provinces GeoJSON for entity outline calculation.
   *
   * @param geojson - The provinces GeoJSON feature collection
   */
  setProvincesGeoJSON: (geojson: FeatureCollection<Polygon | MultiPolygon>) => void;

  /**
   * Sets the metadata for entity colors.
   *
   * @param metadata - The entity metadata
   */
  setMetadata: (metadata: EntityMetadata) => void;

  /**
   * Updates province feature properties from area data.
   * Requirement 1.3: WHEN area data is fetched, THE MapView SHALL update the provinces GeoJSON source
   * Requirement 4.2: WHEN area data changes, THE MapView SHALL update the province feature properties
   *
   * Updates properties:
   * - r: ruler ID (from area data index 0)
   * - c: culture ID (from area data index 1)
   * - e: religion ID (from area data index 2)
   * - g: religionGeneral ID (derived from religion using metadata)
   * - p: population value (from area data index 4)
   *
   * @param areaData - The area data dictionary keyed by province ID
   */
  updateProvinceProperties: (areaData: AreaData) => void;

  /**
   * Gets the religionGeneral ID for a given religion ID.
   * Uses metadata to look up the parent category.
   *
   * @param religionId - The religion ID
   * @returns The religionGeneral ID or the original religionId if not found
   */
  getReligionGeneral: (religionId: string) => string;

  /**
   * Loads metadata from the API.
   * Requirement 2.1: WHEN the application initializes, THE Map_Store SHALL fetch metadata
   * from the Chronas_API endpoint `/v1/metadata`.
   * Requirement 2.2: WHEN metadata is loaded, THE Map_Store SHALL store color mappings.
   *
   * @returns Promise that resolves with the metadata or null on error
   */
  loadMetadata: () => Promise<EntityMetadata | null>;

  /**
   * Gets the color for an entity value from metadata.
   * Requirement 8.4: THE MapView SHALL color the entity outline using the metadata color.
   * Requirement 2.5: IF metadata loading fails, THEN THE MapView SHALL use default fallback colors.
   *
   * @param value - The entity value
   * @param dimension - The dimension (ruler, culture, religion, religionGeneral)
   * @returns The color string or fallback color if not found
   */
  getEntityColor: (value: string, dimension: AreaColorDimension) => string;

  /**
   * Gets the wiki URL for an entity value from metadata.
   * Used to display the correct Wikipedia article in the right drawer.
   *
   * @param value - The entity value (e.g., ruler ID)
   * @param dimension - The dimension (ruler, culture, religion, religionGeneral)
   * @returns The wiki URL or undefined if not found
   */
  getEntityWiki: (value: string, dimension: AreaColorDimension) => string | undefined;

  /**
   * Loads markers from the API for a specific year.
   * Requirement 5.1: WHEN the selectedYear changes, THE MapView SHALL fetch markers
   * from the Chronas_API endpoint `/v1/markers?year={year}`.
   *
   * @param year - The year to load markers for
   * @returns Promise that resolves with the markers array or empty array on error
   */
  loadMarkers: (year: number) => Promise<Marker[]>;

  /**
   * Sets the marker filter state for a specific marker type.
   * Requirement 6.3: THE Map_Store SHALL maintain the current marker filter state.
   *
   * @param type - The marker type to filter
   * @param enabled - Whether the marker type should be visible
   */
  setMarkerFilter: (type: MarkerType, enabled: boolean) => void;

  /**
   * Gets the filtered markers based on current filter state.
   * Requirement 6.4: WHEN markers are fetched, THE MapView SHALL apply the current filter.
   *
   * @returns Array of markers that pass the current filter
   */
  getFilteredMarkers: () => Marker[];

  /**
   * Calculates labels for the active color dimension.
   * Requirement 7.1: THE MapView SHALL display text labels for the currently active color dimension
   * Requirement 7.5: THE MapView SHALL calculate label positions by finding the centroid of merged province polygons
   * Requirement 7.6: THE MapView SHALL use appropriate font sizing based on the entity's territory size
   *
   * Groups provinces by entity value, merges their polygons, calculates centroids,
   * and determines font sizes based on territory area.
   *
   * @param dimension - The color dimension to calculate labels for
   */
  calculateLabels: (dimension: AreaColorDimension) => void;

  /**
   * Cancels any in-flight area data request.
   * Requirement 9.5: THE API_Client SHALL support request cancellation for in-flight requests
   * Requirement 11.2: THE MapView SHALL debounce year change events
   */
  cancelAreaDataRequest: () => void;

  /**
   * Cancels any in-flight markers request.
   * Requirement 9.5: THE API_Client SHALL support request cancellation for in-flight requests
   */
  cancelMarkersRequest: () => void;

  /**
   * Sets the active label dimension for entity labels.
   * Requirement 6.4, 6.5: Layer toggle controls for label dimension.
   *
   * @param dimension - The label dimension to activate (cannot be 'population')
   */
  setActiveLabel: (dimension: AreaColorDimension) => void;

  /**
   * Sets whether color and label dimensions are locked together.
   * Requirement 6.4: When locked, changing color also changes label.
   * Requirement 6.5: When unlocked, color and label can be changed independently.
   *
   * @param locked - Whether to lock color and label together
   */
  setColorLabelLocked: (locked: boolean) => void;

  /**
   * Sets the hovered province ID for tooltip display.
   * Requirement 5.1: Province hover triggers tooltip display.
   *
   * @param provinceId - The province ID or null to clear
   */
  setHoveredProvince: (provinceId: string | null) => void;

  /**
   * Sets the hovered marker ID for highlight.
   * Requirement 5.1: Marker hover triggers highlight.
   *
   * @param markerId - The marker ID or null to clear
   */
  setHoveredMarker: (markerId: string | null) => void;
}

/**
 * Combined map store type
 */
export type MapStore = MapState & MapActions;

/**
 * Default viewport values.
 * Requirement 2.2: THE MapStore SHALL initialize viewport with default values
 * (latitude: 37, longitude: 37, zoom: 2.5, minZoom: 2, bearing: 0, pitch: 0)
 */
export const defaultViewport: ViewportState = {
  latitude: 37,
  longitude: 37,
  zoom: 2.5,
  minZoom: 2,
  bearing: 0,
  pitch: 0,
  width: typeof window !== 'undefined' ? window.innerWidth : 1024,
  height: typeof window !== 'undefined' ? window.innerHeight : 768,
};

/**
 * Default flyTo animation duration in milliseconds.
 * Requirement 2.7: WHEN flyTo is called, THE MapView SHALL animate
 * smoothly using cubic easing over 2000ms
 */
export const DEFAULT_FLY_TO_DURATION = 2000;

/**
 * Fallback color for entities when metadata is not available.
 * Requirement 2.5: IF metadata loading fails, THEN THE MapView SHALL use default fallback colors.
 */
export const FALLBACK_COLOR = 'rgba(1,1,1,0.3)';

/**
 * Default layer visibility state.
 * Only the active color dimension layer is visible.
 * Requirement 5.4: setActiveColor action toggles layer visibility
 */
export const defaultLayerVisibility: LayerVisibility = {
  ruler: true, // Default active dimension
  religion: false,
  religionGeneral: false,
  culture: false,
  population: false,
};

/**
 * Default marker filter state.
 * All marker types are visible by default.
 * Requirement 6.3: THE Map_Store SHALL maintain the current marker filter state.
 * Uses individual API marker type codes to match production behavior.
 */
export const defaultMarkerFilters: MarkerFilterState = {
  // Legacy grouped categories (kept for backwards compatibility)
  battle: true,
  city: true,
  capital: true,
  person: true,
  event: true,
  other: true,
  // Individual marker types matching production
  ar: true,   // Artifact
  b: true,    // Battle
  si: true,   // Siege
  ca: true,   // Capital
  c: true,    // City
  l: true,    // Castle/Landmark
  ai: true,   // Landmark/Architecture
  m: true,    // Military
  p: true,    // Politician/Person
  e: true,    // Explorer/Event
  s: true,    // Scientists
  a: true,    // Artists
  r: true,    // Religious
  at: true,   // Athletes
  op: true,   // Unclassified
  o: true,    // Unknown/Organization
  h: true,    // Historical figure
};

/**
 * Mapping from API short marker type codes to filter category names.
 * The API returns single-letter codes (p, s, b, etc.) but our filter state
 * uses category names (person, battle, etc.).
 * 
 * Categories:
 * - person: p (person), s (scholar), r (religious figure), h (historical figure)
 * - battle: b (battle), m (military)
 * - city: c (city)
 * - capital: ca (capital)
 * - event: e (event)
 * - other: a (artist), ar (artwork), ai (architecture), o (organization), 
 *          si (site), l (landmark), and any unknown types
 */
export const MARKER_TYPE_TO_FILTER_CATEGORY: Record<string, keyof MarkerFilterState> = {
  // Person category
  p: 'person',
  s: 'person',  // scholar -> person
  r: 'person',  // religious figure -> person
  h: 'person',  // historical figure -> person
  // Battle category
  b: 'battle',
  m: 'battle',  // military -> battle
  // City category
  c: 'city',
  // Capital category
  ca: 'capital',
  // Event category
  e: 'event',
  // Other category (art, architecture, organizations, sites, landmarks)
  a: 'other',   // artist
  ar: 'other',  // artwork
  ai: 'other',  // architecture
  o: 'other',   // organization
  si: 'other',  // site
  l: 'other',   // landmark
  at: 'other',  // athlete
  op: 'other',  // unclassified
};

/**
 * Gets the filter category for a marker type.
 * Maps API short codes to filter category names.
 * 
 * @param type - The marker type from the API (e.g., 'p', 'b', 's')
 * @returns The filter category name (e.g., 'person', 'battle', 'other')
 */
export function getMarkerFilterCategory(type: string): keyof MarkerFilterState {
  const normalizedType = type.toLowerCase();
  return MARKER_TYPE_TO_FILTER_CATEGORY[normalizedType] ?? 'other';
}

/**
 * Performance threshold for cached year switches in milliseconds.
 * Requirement 11.5: WHEN switching between cached years, THE MapView SHALL update within 100ms.
 */
export const CACHED_SWITCH_THRESHOLD_MS = 100;

/**
 * Initial map state
 */
export const initialState: MapState = {
  viewport: { ...defaultViewport },
  basemap: 'topographic',
  showProvinceBorders: true,
  populationOpacity: false,
  activeColor: 'ruler',
  activeLabel: 'ruler',
  colorLabelLocked: true,
  previousActiveColor: null,
  layerVisibility: { ...defaultLayerVisibility },
  isFlying: false,
  flyToTarget: null,
  areaDataCache: new Map<number, AreaData>(),
  currentAreaData: null,
  isLoadingAreaData: false,
  selectedProvince: null,
  selectedProvinceData: null,
  hoveredProvinceId: null,
  hoveredMarkerId: null,
  error: null,
  entityOutline: null,
  entityOutlineColor: null,
  provincesGeoJSON: null,
  metadata: null,
  isLoadingMetadata: false,
  markers: [],
  isLoadingMarkers: false,
  markerLimit: 5000,
  clusterMarkers: false,
  markerFilters: { ...defaultMarkerFilters },
  labelData: null,
  areaDataAbortController: null,
  markersAbortController: null,
};

/**
 * Minimum zoom level for entity outline viewport fit.
 * Requirement 8.6: THE MapView SHALL constrain the zoom level between 4.5 and (current zoom - 1)
 */
export const MIN_ENTITY_ZOOM = 4.5;

/**
 * Index mapping for area color dimensions to province data array indices.
 * ruler=0, culture=1, religion=2, religionGeneral maps to religion (2)
 */
export const DIMENSION_INDEX: Record<AreaColorDimension, number> = {
  ruler: 0,
  culture: 1,
  religion: 2,
  religionGeneral: 2, // religionGeneral uses the same index as religion
  population: 4,
};

/**
 * Validates that a viewport state has all required fields with valid numeric values.
 *
 * @param viewport - The viewport state to validate
 * @returns true if the viewport is valid
 */
export function isValidViewport(viewport: Partial<ViewportState>): boolean {
  const requiredFields: (keyof ViewportState)[] = [
    'latitude',
    'longitude',
    'zoom',
    'minZoom',
    'bearing',
    'pitch',
    'width',
    'height',
  ];

  for (const field of requiredFields) {
    const value = viewport[field];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return false;
    }
  }

  return true;
}

/**
 * Validates that a color dimension is one of the allowed values.
 *
 * @param dimension - The dimension to validate
 * @returns true if the dimension is valid
 */
export function isValidColorDimension(dimension: unknown): dimension is AreaColorDimension {
  return (
    dimension === 'ruler' ||
    dimension === 'religion' ||
    dimension === 'religionGeneral' ||
    dimension === 'culture' ||
    dimension === 'population'
  );
}

/**
 * Validates that a basemap type is one of the allowed values.
 * Requirement 1.3: THE MapView SHALL support three basemap options: topographic, watercolor, and none
 *
 * @param basemap - The basemap type to validate
 * @returns true if the basemap type is valid
 */
export function isValidBasemapType(basemap: unknown): basemap is BasemapType {
  return basemap === 'topographic' || basemap === 'watercolor' || basemap === 'none';
}

/**
 * Clamps a latitude value to the valid range [-90, 90].
 *
 * @param lat - The latitude value to clamp
 * @returns The clamped latitude value
 */
export function clampLatitude(lat: number): number {
  if (!Number.isFinite(lat)) return defaultViewport.latitude;
  return Math.max(-90, Math.min(90, lat));
}

/**
 * Normalizes a longitude value to the range [-180, 180].
 *
 * @param lng - The longitude value to normalize
 * @returns The normalized longitude value
 */
export function normalizeLongitude(lng: number): number {
  if (!Number.isFinite(lng)) return defaultViewport.longitude;
  // Normalize to [-180, 180]
  let normalized = lng % 360;
  if (normalized > 180) normalized -= 360;
  if (normalized < -180) normalized += 360;
  return normalized;
}

/**
 * Clamps a zoom value to a valid range.
 *
 * @param zoom - The zoom value to clamp
 * @param minZoom - The minimum zoom level (default: 0)
 * @param maxZoom - The maximum zoom level (default: 22)
 * @returns The clamped zoom value
 */
export function clampZoom(zoom: number, minZoom = 0, maxZoom = 22): number {
  if (!Number.isFinite(zoom)) return defaultViewport.zoom;
  return Math.max(minZoom, Math.min(maxZoom, zoom));
}

/**
 * Font size calculation constants for label sizing.
 * Requirement 7.6: THE MapView SHALL use appropriate font sizing based on the entity's territory size
 */
export const LABEL_FONT_SIZE_MIN = 10;
export const LABEL_FONT_SIZE_MAX = 28;
export const LABEL_AREA_MIN = 1e9;  // 1,000 km² in square meters
export const LABEL_AREA_MAX = 1e12; // 1,000,000 km² in square meters

/**
 * Calculates font size for entity labels based on territory area.
 * Requirement 7.6: THE MapView SHALL use appropriate font sizing based on the entity's territory size
 *
 * Uses logarithmic scaling to map area to font size:
 * - Small territories (< 1,000 km²): 8px
 * - Large territories (> 1,000,000 km²): 24px
 *
 * @param area - Territory area in square meters
 * @returns Font size in pixels
 */
export function calculateFontSize(area: number): number {
  // Clamp area to valid range
  const clampedArea = Math.max(LABEL_AREA_MIN, Math.min(LABEL_AREA_MAX, area));
  
  // Use logarithmic scaling for better distribution
  const normalized = Math.log10(clampedArea);
  const minLog = Math.log10(LABEL_AREA_MIN);
  const maxLog = Math.log10(LABEL_AREA_MAX);
  
  // Linear interpolation in log space
  const ratio = (normalized - minLog) / (maxLog - minLog);
  
  return LABEL_FONT_SIZE_MIN + (LABEL_FONT_SIZE_MAX - LABEL_FONT_SIZE_MIN) * ratio;
}

/**
 * Zustand map store
 *
 * Manages all map-related state including viewport, color dimensions,
 * and flyTo animations.
 */
export const useMapStore = create<MapStore>((set, get) => ({
  // Initial state
  ...initialState,

  /**
   * Updates the viewport state with partial values.
   * Validates and clamps values to ensure they are within valid ranges.
   *
   * @param viewport - Partial viewport state to merge
   */
  setViewport: (viewport: Partial<ViewportState>) => {
    set((state) => {
      const newViewport = { ...state.viewport };

      // Update latitude with clamping
      if (viewport.latitude !== undefined) {
        newViewport.latitude = clampLatitude(viewport.latitude);
      }

      // Update longitude with normalization
      if (viewport.longitude !== undefined) {
        newViewport.longitude = normalizeLongitude(viewport.longitude);
      }

      // Update zoom with clamping
      if (viewport.zoom !== undefined) {
        newViewport.zoom = clampZoom(viewport.zoom, newViewport.minZoom);
      }

      // Update minZoom
      if (viewport.minZoom !== undefined && Number.isFinite(viewport.minZoom)) {
        newViewport.minZoom = Math.max(0, Math.min(22, viewport.minZoom));
        // Ensure current zoom is not below new minZoom
        if (newViewport.zoom < newViewport.minZoom) {
          newViewport.zoom = newViewport.minZoom;
        }
      }

      // Update bearing (0-360 degrees)
      if (viewport.bearing !== undefined && Number.isFinite(viewport.bearing)) {
        newViewport.bearing = ((viewport.bearing % 360) + 360) % 360;
      }

      // Update pitch (0-85 degrees for Mapbox)
      if (viewport.pitch !== undefined && Number.isFinite(viewport.pitch)) {
        newViewport.pitch = Math.max(0, Math.min(85, viewport.pitch));
      }

      // Update width
      if (viewport.width !== undefined && Number.isFinite(viewport.width)) {
        newViewport.width = Math.max(0, viewport.width);
      }

      // Update height
      if (viewport.height !== undefined && Number.isFinite(viewport.height)) {
        newViewport.height = Math.max(0, viewport.height);
      }

      return { viewport: newViewport };
    });
  },

  /**
   * Sets the basemap style for the map.
   * Requirement 1.1: WHEN the user selects a basemap option, THE MapStore SHALL update the basemap state
   *
   * @param basemap - The basemap style to set ('topographic', 'watercolor', or 'none')
   */
  setBasemap: (basemap: BasemapType) => {
    // Validate basemap is a valid type
    if (!isValidBasemapType(basemap)) {
      console.warn(`setBasemap: Invalid basemap type "${String(basemap)}"`);
      return;
    }
    
    set({ basemap });
  },

  /**
   * Sets whether province borders are visible.
   * Requirement 2.1: WHEN the user toggles the "Show Provinces" checkbox, THE MapStore SHALL update the showProvinceBorders state
   *
   * @param show - Whether province borders should be visible
   */
  setShowProvinceBorders: (show: boolean) => {
    // Validate show is a boolean
    if (typeof show !== 'boolean') {
      console.warn(`setShowProvinceBorders: Invalid value "${String(show)}", expected boolean`);
      return;
    }
    
    set({ showProvinceBorders: show });
  },

  /**
   * Sets whether population-based opacity is enabled.
   * Requirement 3.1: WHEN the user toggles the "Opacity by Population" checkbox, THE MapStore SHALL update the populationOpacity state
   *
   * @param enabled - Whether population-based opacity should be enabled
   */
  setPopulationOpacity: (enabled: boolean) => {
    // Validate enabled is a boolean
    if (typeof enabled !== 'boolean') {
      console.warn(`setPopulationOpacity: Invalid value "${String(enabled)}", expected boolean`);
      return;
    }
    
    set({ populationOpacity: enabled });
  },

  /**
   * Sets the maximum number of markers to fetch from the API.
   * Requirement 4.1: WHEN the user adjusts the marker limit slider, THE MapStore SHALL update the markerLimit state
   * Requirement 4.5: THE MapStore SHALL default markerLimit to 5000
   *
   * @param limit - The maximum number of markers (clamped to [0, 10000])
   */
  setMarkerLimit: (limit: number) => {
    // Validate limit is a number
    if (typeof limit !== 'number' || !Number.isFinite(limit)) {
      console.warn(`setMarkerLimit: Invalid value "${String(limit)}", expected number`);
      return;
    }
    
    // Clamp to valid range [0, 10000]
    const clampedLimit = Math.max(0, Math.min(10000, Math.round(limit)));
    
    set({ markerLimit: clampedLimit });
  },

  /**
   * Sets whether marker clustering is enabled.
   * Requirement 5.1: WHEN the user toggles the "Cluster Markers" checkbox, THE MapStore SHALL update the clusterMarkers state
   *
   * @param enabled - Whether marker clustering should be enabled
   */
  setClusterMarkers: (enabled: boolean) => {
    // Validate enabled is a boolean
    if (typeof enabled !== 'boolean') {
      console.warn(`setClusterMarkers: Invalid value "${String(enabled)}", expected boolean`);
      return;
    }
    
    set({ clusterMarkers: enabled });
  },

  /**
   * Initiates a flyTo animation to a target location.
   * Stores the target for the MapView component to consume.
   *
   * @param options - FlyTo options including target coordinates
   */
  flyTo: (options: FlyToOptions) => {
    // Validate required fields
    if (!Number.isFinite(options.latitude) || !Number.isFinite(options.longitude)) {
      console.warn('flyTo: Invalid latitude or longitude provided');
      return;
    }

    const target: FlyToOptions = {
      latitude: clampLatitude(options.latitude),
      longitude: normalizeLongitude(options.longitude),
      zoom: options.zoom !== undefined ? clampZoom(options.zoom, get().viewport.minZoom) : undefined,
      duration: options.duration ?? DEFAULT_FLY_TO_DURATION,
      bearing: options.bearing,
      pitch: options.pitch,
    };

    set({
      isFlying: true,
      flyToTarget: target,
    });
  },

  /**
   * Clears the flyTo target after animation completes.
   */
  clearFlyTo: () => {
    set({
      isFlying: false,
      flyToTarget: null,
    });
  },

  /**
   * Sets the active color dimension for area coloring.
   * Requirement 5.4: setActiveColor action updates activeColor state and toggles layer visibility.
   * Requirement 5.3: When active color dimension changes, update visible layer and hide previous.
   *
   * @param dimension - The color dimension to activate
   */
  setActiveColor: (dimension: AreaColorDimension) => {
    if (!isValidColorDimension(dimension)) {
      console.warn(`setActiveColor: Invalid dimension "${String(dimension)}"`);
      return;
    }
    
    const currentActiveColor = get().activeColor;
    
    // Skip if already the active dimension
    if (currentActiveColor === dimension) {
      return;
    }
    
    // Create new layer visibility state
    // Requirement 5.3: Hide previous dimension's layer and show new dimension's layer
    const newLayerVisibility: LayerVisibility = {
      ruler: false,
      religion: false,
      religionGeneral: false,
      culture: false,
      population: false,
    };
    
    // Set the new dimension to visible
    newLayerVisibility[dimension] = true;
    
    set({
      previousActiveColor: currentActiveColor,
      activeColor: dimension,
      layerVisibility: newLayerVisibility,
    });
  },

  /**
   * Gets the current layer visibility state.
   * Requirement 5.4: Layer visibility is managed based on active color dimension.
   *
   * @returns The current layer visibility state
   */
  getLayerVisibility: (): LayerVisibility => {
    return get().layerVisibility;
  },

  /**
   * Loads area data for a specific year with caching.
   * Requirement 12.2: THE MapStore SHALL cache area data by year
   * to avoid redundant API calls.
   * Requirement 3.1: WHEN the selectedYear changes, fetch new area data.
   * Requirement 3.2: Fetch from /areas/{year} endpoint.
   * Requirement 9.5: THE API_Client SHALL support request cancellation.
   * Requirement 11.2: Cancel in-flight requests on new year change.
   * Requirement 11.5: Cached data returns within 100ms.
   * Requirement 13.1: Log errors with details.
   *
   * @param year - The year to load area data for
   * @returns Promise that resolves with the area data or null
   */
  loadAreaData: async (year: number): Promise<AreaData | null> => {
    const startTime = performance.now();
    
    // Validate year is a finite number
    if (!Number.isFinite(year)) {
      console.warn(`loadAreaData: Invalid year "${String(year)}"`);
      return null;
    }

    const state = get();

    // Cancel any in-flight request - Requirement 9.5, 11.2
    if (state.areaDataAbortController) {
      state.areaDataAbortController.abort();
    }

    // Check cache first - Requirement 12.2
    const cachedData = state.areaDataCache.get(year);
    if (cachedData) {
      // Return cached data without making API call
      const duration = performance.now() - startTime;
      
      // Performance logging for debugging - Requirement 11.5
      // Cached year switches should complete within 100ms
      if (duration > CACHED_SWITCH_THRESHOLD_MS) {
        console.warn(
          `[Performance Warning] Cached year ${String(year)} switch exceeded ${String(CACHED_SWITCH_THRESHOLD_MS)}ms threshold: ${duration.toFixed(2)}ms. ` +
          `Cache size: ${String(state.areaDataCache.size)} entries, ` +
          `Province count: ${String(Object.keys(cachedData).length)}`
        );
      } else {
        console.debug(
          `[Performance] Cached year ${String(year)} returned in ${duration.toFixed(2)}ms ` +
          `(threshold: ${String(CACHED_SWITCH_THRESHOLD_MS)}ms, cache size: ${String(state.areaDataCache.size)})`
        );
      }
      
      set({ currentAreaData: cachedData, isLoadingAreaData: false, areaDataAbortController: null });
      
      // Update province properties with the cached area data
      // Requirement 4.2: WHEN area data changes, THE MapView SHALL update the province feature properties
      get().updateProvinceProperties(cachedData);
      
      return cachedData;
    }

    // Create new abort controller for this request - Requirement 9.5
    const abortController = new AbortController();

    // Data not in cache, set loading state and fetch from API
    set({ isLoadingAreaData: true, error: null, areaDataAbortController: abortController });

    try {
      // Fetch from /areas/{year} endpoint - Requirement 3.2
      const endpoint = AREAS.GET_BY_YEAR(year);
      const data = await apiClient.get<MapAreaData>(endpoint, { signal: abortController.signal });

      // Validate response is an object (dictionary of province data)
      if (typeof data !== 'object') {
        console.warn(`loadAreaData: Invalid response format for year ${String(year)}`);
        set({ isLoadingAreaData: false, areaDataAbortController: null });
        return null;
      }

      // Cast to AreaData (same structure as MapAreaData)
      const areaData = data as AreaData;

      // Cache the response - Requirement 12.2
      const duration = performance.now() - startTime;
      console.debug(
        `[Performance] Year ${String(year)} fetched from API in ${duration.toFixed(2)}ms ` +
        `(province count: ${String(Object.keys(areaData).length)})`
      );
      
      set((state) => {
        const newCache = new Map(state.areaDataCache);
        newCache.set(year, areaData);

        return {
          areaDataCache: newCache,
          currentAreaData: areaData,
          isLoadingAreaData: false,
          areaDataAbortController: null,
        };
      });

      // Update province properties with the new area data
      // Requirement 4.2: WHEN area data changes, THE MapView SHALL update the province feature properties
      get().updateProvinceProperties(areaData);

      return areaData;
    } catch (error) {
      // Check if request was aborted - Requirement 9.5
      if (error instanceof Error && error.name === 'AbortError') {
        console.debug(`[Performance] Request for year ${String(year)} was cancelled`);
        // Don't update state for aborted requests - let the new request handle it
        return null;
      }
      
      // Requirement 13.1: Log error with details
      const axiosError = error as {
        response?: {
          status?: number;
          statusText?: string;
          data?: unknown;
        };
        message?: string;
      };

      console.error(`API ERROR: Failed to load area data for year ${String(year)}:`, error);
      console.error('Error details:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        url: AREAS.GET_BY_YEAR(year),
      });

      // Store error state - Requirement 13.4
      const errorInstance =
        error instanceof Error ? error : new Error(`Failed to load area data for year ${String(year)}`);
      set({
        error: errorInstance,
        isLoadingAreaData: false,
        areaDataAbortController: null,
      });

      return null;
    }
  },

  /**
   * Sets area data directly (used for testing and API response handling).
   *
   * @param year - The year the data is for
   * @param data - The area data to set
   */
  setAreaData: (year: number, data: AreaData) => {
    if (!Number.isFinite(year)) {
      console.warn(`setAreaData: Invalid year "${String(year)}"`);
      return;
    }

    set((state) => {
      // Create a new Map to ensure immutability
      const newCache = new Map(state.areaDataCache);
      newCache.set(year, data);

      return {
        areaDataCache: newCache,
        currentAreaData: data,
        isLoadingAreaData: false,
      };
    });
  },

  /**
   * Clears the area data cache.
   */
  clearAreaDataCache: () => {
    set({
      areaDataCache: new Map<number, AreaData>(),
      currentAreaData: null,
      isLoadingAreaData: false,
    });
  },

  /**
   * Selects a province and stores its data from currentAreaData.
   * Requirement 7.2: WHEN a province is selected, THE MapStore SHALL
   * store the selected province ID and its data.
   *
   * @param provinceId - The ID of the province to select
   */
  selectProvince: (provinceId: string) => {
    // Validate provinceId is a non-empty string
    if (typeof provinceId !== 'string' || provinceId.trim() === '') {
      console.warn('selectProvince: Invalid province ID provided');
      return;
    }

    const state = get();
    const trimmedId = provinceId.trim();

    // Get province data from currentAreaData if available
    let provinceData: ProvinceData | null = null;
    const data = state.currentAreaData?.[trimmedId];
    if (data) {
      // Validate the data is a proper ProvinceData array
      if (Array.isArray(data)) {
        provinceData = data;
      }
    }

    set({
      selectedProvince: trimmedId,
      selectedProvinceData: provinceData,
    });
  },

  /**
   * Clears the selected province.
   * Requirement 7.2: Allows clearing the selection state.
   */
  clearSelection: () => {
    set({
      selectedProvince: null,
      selectedProvinceData: null,
    });
  },

  /**
   * Sets or clears the error state.
   * Requirement 13.4: WHEN an error occurs, THE MapStore SHALL
   * store the error state for display.
   *
   * @param error - The error to set, or null to clear
   */
  setError: (error: Error | null) => {
    set({ error });
  },

  /**
   * Calculates the entity outline for all provinces with a matching value.
   * Requirement 8.1: WHEN a province is selected, THE MapView SHALL calculate
   * the entity outline for that province's ruler/culture/religion.
   * Requirement 8.2: THE MapView SHALL use turf.union to merge all provinces.
   * Requirement 8.5: THE MapView SHALL use turf.unkinkPolygon to handle self-intersecting polygons.
   *
   * @param value - The entity value to match (e.g., ruler ID)
   * @param dimension - The dimension to match against (ruler, culture, religion, religionGeneral)
   */
  calculateEntityOutline: (value: string, dimension: AreaColorDimension) => {
    const state = get();

    // Validate inputs
    if (!value || typeof value !== 'string') {
      console.warn('calculateEntityOutline: Invalid value provided');
      set({ entityOutline: null, entityOutlineColor: null });
      return;
    }

    if (!isValidColorDimension(dimension) || dimension === 'population') {
      console.warn('calculateEntityOutline: Invalid dimension for entity outline');
      set({ entityOutline: null, entityOutlineColor: null });
      return;
    }

    // Need both provinces GeoJSON and area data
    if (!state.provincesGeoJSON || !state.currentAreaData) {
      console.warn('calculateEntityOutline: Missing provinces GeoJSON or area data');
      set({ entityOutline: null, entityOutlineColor: null });
      return;
    }

    // Get the dimension index for looking up values in province data
    const dimensionIndex = DIMENSION_INDEX[dimension];

    // Find all provinces with matching value
    const matchingFeatures: Feature<Polygon | MultiPolygon>[] = [];

    for (const feature of state.provincesGeoJSON.features) {
      // Province ID is stored in the 'name' property of the GeoJSON feature
      // After updateProvinceProperties runs, 'id' is also set
      const provinceId = (feature.properties?.['id'] as string | undefined) ?? 
                         (feature.properties?.['name'] as string | undefined);
      if (!provinceId) continue;

      const provinceData = state.currentAreaData[provinceId];
      if (!provinceData || !Array.isArray(provinceData)) continue;

      const provinceValue = provinceData[dimensionIndex];
      if (provinceValue === value) {
        matchingFeatures.push(feature);
      }
    }

    if (matchingFeatures.length === 0) {
      console.warn(`calculateEntityOutline: No provinces found with ${dimension}=${value}`);
      set({ entityOutline: null, entityOutlineColor: null });
      return;
    }

    try {
      // Merge all matching polygons using turf.union
      // Requirement 8.2: THE MapView SHALL use turf.union to merge all provinces
      let mergedPolygon: Feature<Polygon | MultiPolygon> | null = null;

      for (const feature of matchingFeatures) {
        if (!mergedPolygon) {
          mergedPolygon = feature;
        } else {
          // Use turf.union to merge polygons
          const unionResult: Feature<Polygon | MultiPolygon> | null = turf.union(
            turf.featureCollection([mergedPolygon, feature])
          );
          if (unionResult) {
            mergedPolygon = unionResult;
          }
        }
      }

      if (!mergedPolygon) {
        set({ entityOutline: null, entityOutlineColor: null });
        return;
      }

      // Handle self-intersecting polygons using turf.unkinkPolygon
      // Requirement 8.5: THE MapView SHALL use turf.unkinkPolygon to handle self-intersecting polygons
      try {
        const unkinked = turf.unkinkPolygon(mergedPolygon);
        if (unkinked.features.length > 0) {
          // If unkink produced multiple polygons, union them back together
          if (unkinked.features.length === 1) {
            const firstFeature = unkinked.features[0];
            if (firstFeature) {
              mergedPolygon = firstFeature;
            }
          } else {
            // Re-union the unkinked polygons
            let remerged: Feature<Polygon | MultiPolygon> | null = null;
            for (const f of unkinked.features) {
              if (!remerged) {
                remerged = f;
              } else {
                const innerUnionResult: Feature<Polygon | MultiPolygon> | null = turf.union(
                  turf.featureCollection([remerged, f])
                );
                if (innerUnionResult) {
                  remerged = innerUnionResult;
                }
              }
            }
            if (remerged) {
              mergedPolygon = remerged;
            }
          }
        }
      } catch (unkinkError) {
        // If unkink fails, continue with the merged polygon as-is
        console.warn('calculateEntityOutline: unkinkPolygon failed, using merged polygon', unkinkError);
      }

      // Get the color for this entity
      // Requirement 8.4: THE MapView SHALL color the entity outline using the metadata color
      const color = get().getEntityColor(value, dimension);

      set({
        entityOutline: mergedPolygon,
        entityOutlineColor: color,
      });
    } catch (error) {
      console.error('calculateEntityOutline: Error merging polygons', error);
      set({ entityOutline: null, entityOutlineColor: null });
    }
  },

  /**
   * Fits the viewport to the entity outline bounding box.
   * Requirement 8.3: THE MapView SHALL fit the viewport to the entity outline bounding box.
   * Requirement 8.6: THE MapView SHALL constrain the zoom level between 4.5 and (current zoom - 1).
   *
   * @param padding - Optional padding around the bounding box (default: 50)
   */
  fitToEntityOutline: (padding = 50) => {
    const state = get();

    if (!state.entityOutline) {
      console.warn('fitToEntityOutline: No entity outline to fit');
      return;
    }

    try {
      // Calculate bounding box using turf.bbox
      // Requirement 8.3: THE MapView SHALL fit the viewport to the entity outline bounding box
      const bbox = turf.bbox(state.entityOutline);

      // bbox is [minLng, minLat, maxLng, maxLat]
      const [minLng, minLat, maxLng, maxLat] = bbox;

      // Calculate center of bounding box
      const centerLng = (minLng + maxLng) / 2;
      const centerLat = (minLat + maxLat) / 2;

      // Calculate appropriate zoom level based on bounding box size
      // This is a simplified calculation - actual implementation would consider viewport size
      const lngDiff = maxLng - minLng;
      const latDiff = maxLat - minLat;
      const maxDiff = Math.max(lngDiff, latDiff);

      // Approximate zoom level calculation
      // At zoom 0, the world is ~360 degrees wide
      // Each zoom level doubles the resolution
      let calculatedZoom = Math.log2(360 / maxDiff) - 1;

      // Apply padding factor (reduce zoom slightly for padding)
      const paddingFactor = 1 - (padding / 500);
      calculatedZoom = calculatedZoom * paddingFactor;

      // Requirement 8.6: Constrain zoom between 4.5 and (current zoom - 1)
      const currentZoom = state.viewport.zoom;
      const maxZoom = Math.max(MIN_ENTITY_ZOOM, currentZoom - 1);
      const constrainedZoom = Math.max(MIN_ENTITY_ZOOM, Math.min(maxZoom, calculatedZoom));

      // Use flyTo to animate to the new viewport
      get().flyTo({
        latitude: centerLat,
        longitude: centerLng,
        zoom: constrainedZoom,
        duration: 1500,
      });
    } catch (error) {
      console.error('fitToEntityOutline: Error calculating bounding box', error);
    }
  },

  /**
   * Clears the entity outline.
   */
  clearEntityOutline: () => {
    set({
      entityOutline: null,
      entityOutlineColor: null,
    });
  },

  /**
   * Sets the provinces GeoJSON for entity outline calculation.
   *
   * @param geojson - The provinces GeoJSON feature collection
   */
  setProvincesGeoJSON: (geojson: FeatureCollection<Polygon | MultiPolygon>) => {
    set({ provincesGeoJSON: geojson });
  },

  /**
   * Sets the metadata for entity colors.
   *
   * @param metadata - The entity metadata
   */
  setMetadata: (metadata: EntityMetadata) => {
    set({ metadata });
  },

  /**
   * Loads metadata from the API.
   * Requirement 2.1: WHEN the application initializes, THE Map_Store SHALL fetch metadata
   * from the Chronas_API endpoint `/v1/metadata`.
   * Requirement 2.2: WHEN metadata is loaded, THE Map_Store SHALL store color mappings.
   *
   * @returns Promise that resolves with the metadata or null on error
   */
  loadMetadata: async (): Promise<EntityMetadata | null> => {
    set({ isLoadingMetadata: true });

    try {
      // Fetch combined metadata including provinces GeoJSON and entity colors
      const data = await apiClient.get<Record<string, unknown>>(METADATA.GET_INIT);

      // Extract provinces GeoJSON if available
      const provincesData = data['provinces'] as FeatureCollection<Polygon | MultiPolygon> | undefined;
      
      // Extract entity metadata
      const rulerData = data['ruler'] as Record<string, [string, string, string?, string?]> | undefined;
      const cultureData = data['culture'] as Record<string, [string, string, string?, string?]> | undefined;
      const religionData = data['religion'] as Record<string, [string, string, string?, string?, string?]> | undefined;
      const religionGeneralData = data['religionGeneral'] as Record<string, [string, string, string?, string?]> | undefined;

      // Convert array format to MetadataEntry format
      // Original format: [name, color, wiki?, icon?, parent?]
      const convertToMetadataEntry = (
        record: Record<string, [string, string, string?, string?, string?]> | undefined,
        hasParent = false
      ): Record<string, MetadataEntry> => {
        if (!record) return {};
        const result: Record<string, MetadataEntry> = {};
        for (const [key, value] of Object.entries(record)) {
          if (Array.isArray(value) && value.length >= 2) {
            result[key] = {
              name: value[0] || key,
              color: value[1] || FALLBACK_COLOR,
              ...(value[2] ? { wiki: value[2] } : {}),
              ...(hasParent && value[3] ? { parent: value[3] } : {}),
            };
          }
        }
        return result;
      };

      // Build EntityMetadata from the response
      const metadata: EntityMetadata = {
        ruler: convertToMetadataEntry(rulerData),
        culture: convertToMetadataEntry(cultureData),
        religion: convertToMetadataEntry(religionData, true),
        religionGeneral: convertToMetadataEntry(religionGeneralData),
      };

      // Set provinces GeoJSON if available
      if (provincesData?.features) {
        set({ provincesGeoJSON: provincesData });
      }

      set({
        metadata,
        isLoadingMetadata: false,
      });

      return metadata;
    } catch (error) {
      // Log error with details
      const axiosError = error as {
        response?: {
          status?: number;
          statusText?: string;
          data?: unknown;
        };
        message?: string;
      };

      console.error('API ERROR: Failed to load metadata:', error);
      console.error('Error details:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        url: METADATA.GET_INIT,
      });

      // Store error state
      const errorInstance =
        error instanceof Error ? error : new Error('Failed to load metadata');
      set({
        error: errorInstance,
        isLoadingMetadata: false,
      });

      return null;
    }
  },

  /**
   * Gets the color for an entity value from metadata.
   * Requirement 8.4: THE MapView SHALL color the entity outline using the metadata color.
   * Requirement 2.5: IF metadata loading fails, THEN THE MapView SHALL use default fallback colors.
   *
   * @param value - The entity value
   * @param dimension - The dimension (ruler, culture, religion, religionGeneral)
   * @returns The color string or fallback color if not found
   */
  getEntityColor: (value: string, dimension: AreaColorDimension): string => {
    const state = get();

    if (!state.metadata || !value) {
      return FALLBACK_COLOR;
    }

    // Map dimension to metadata key
    let metadataKey: keyof EntityMetadata;
    switch (dimension) {
      case 'ruler':
        metadataKey = 'ruler';
        break;
      case 'culture':
        metadataKey = 'culture';
        break;
      case 'religion':
        metadataKey = 'religion';
        break;
      case 'religionGeneral':
        metadataKey = 'religionGeneral';
        break;
      default:
        return FALLBACK_COLOR;
    }

    const dimensionMetadata = state.metadata[metadataKey];
    const entry = dimensionMetadata[value];
    return entry?.color ?? FALLBACK_COLOR;
  },

  /**
   * Gets the wiki URL for an entity value from metadata.
   * Used to display the correct Wikipedia article in the right drawer.
   *
   * For religionGeneral dimension, the value is a religion ID (from province data),
   * so we need to look up the religion's parent (religionGeneral ID) first,
   * then get the wiki from religionGeneral metadata.
   *
   * @param value - The entity value (e.g., ruler ID, or religion ID for religionGeneral)
   * @param dimension - The dimension (ruler, culture, religion, religionGeneral)
   * @returns The wiki URL or undefined if not found
   */
  getEntityWiki: (value: string, dimension: AreaColorDimension): string | undefined => {
    const state = get();

    if (!state.metadata || !value) {
      return undefined;
    }

    // Special handling for religionGeneral:
    // The value passed is a religion ID (from province data index 2),
    // but we need to look up the wiki from religionGeneral metadata.
    // Production code: metadata[activeAreaDim][(metadata.religion[activeprovinceValue] || [])[3]][2]
    if (dimension === 'religionGeneral') {
      // First, look up the religion to get its parent (religionGeneral ID)
      const religionEntry = state.metadata.religion[value];
      const religionGeneralId = religionEntry?.parent;
      
      if (!religionGeneralId) {
        return undefined;
      }
      
      // Then look up the wiki from religionGeneral metadata
      const religionGeneralEntry = state.metadata.religionGeneral[religionGeneralId];
      return religionGeneralEntry?.wiki;
    }

    // Map dimension to metadata key for other dimensions
    let metadataKey: keyof EntityMetadata;
    switch (dimension) {
      case 'ruler':
        metadataKey = 'ruler';
        break;
      case 'culture':
        metadataKey = 'culture';
        break;
      case 'religion':
        metadataKey = 'religion';
        break;
      default:
        return undefined;
    }

    const dimensionMetadata = state.metadata[metadataKey];
    const entry = dimensionMetadata[value];
    return entry?.wiki;
  },

  /**
   * Gets the religionGeneral ID for a given religion ID.
   * Uses metadata to look up the parent category.
   *
   * @param religionId - The religion ID
   * @returns The religionGeneral ID or the original religionId if not found
   */
  getReligionGeneral: (religionId: string): string => {
    const state = get();

    if (!religionId || !state.metadata) {
      return religionId;
    }

    // Look up the religion in metadata to find its parent (religionGeneral)
    const religionEntry = state.metadata.religion[religionId];
    if (religionEntry?.parent) {
      return religionEntry.parent;
    }

    // If no parent found, check if the religionId itself is a religionGeneral
    if (state.metadata.religionGeneral[religionId]) {
      return religionId;
    }

    // Fallback: return the original religionId
    return religionId;
  },

  /**
   * Updates province feature properties from area data.
   * Requirement 1.3: WHEN area data is fetched, THE MapView SHALL update the provinces GeoJSON source
   * Requirement 4.2: WHEN area data changes, THE MapView SHALL update the province feature properties
   *
   * @param areaData - The area data dictionary keyed by province ID
   */
  updateProvinceProperties: (areaData: AreaData) => {
    const state = get();

    if (!state.provincesGeoJSON) {
      // Silently return - provinces GeoJSON will be loaded later
      return;
    }

    // Create updated features with new properties
    const updatedFeatures = state.provincesGeoJSON.features.map((feature) => {
      // Province ID is stored in the 'name' property of the GeoJSON feature
      const provinceId = feature.properties?.['name'] as string | undefined;
      
      if (!provinceId) {
        return feature;
      }

      const data = areaData[provinceId];
      
      if (!data || !Array.isArray(data)) {
        return feature;
      }

      // Extract values from area data tuple
      // [ruler, culture, religion, capital, population]
      const ruler = data[0];
      const culture = data[1];
      const religion = data[2];
      const population = data[4];

      // Calculate religionGeneral from religion using metadata
      const religionGeneral = get().getReligionGeneral(religion);

      // Return feature with updated properties
      // Also set 'id' property to match provinceId for layer interactions
      return {
        ...feature,
        properties: {
          ...feature.properties,
          id: provinceId,
          r: ruler,
          c: culture,
          e: religion,
          g: religionGeneral,
          p: population,
        },
      };
    });

    // Update the provincesGeoJSON with new features
    set({
      provincesGeoJSON: {
        ...state.provincesGeoJSON,
        features: updatedFeatures,
      },
    });
  },

  /**
   * Loads markers from the API for a specific year.
   * Requirement 5.1: WHEN the selectedYear changes, THE MapView SHALL fetch markers
   * from the Chronas_API endpoint `/v1/markers?year={year}`.
   * Requirement 9.5: THE API_Client SHALL support request cancellation.
   *
   * @param year - The year to load markers for
   * @returns Promise that resolves with the markers array or empty array on error
   */
  loadMarkers: async (year: number): Promise<Marker[]> => {
    // Validate year is a finite number
    if (!Number.isFinite(year)) {
      console.warn(`loadMarkers: Invalid year "${String(year)}"`);
      return [];
    }

    const state = get();
    const { markerLimit } = state;

    // Handle limit=0 case - skip API call and return empty array
    // Requirement 4.4: WHEN markerLimit is 0, THE MapView SHALL not display any markers
    if (markerLimit === 0) {
      set({ markers: [], isLoadingMarkers: false });
      return [];
    }

    // Cancel any in-flight request - Requirement 9.5
    if (state.markersAbortController) {
      state.markersAbortController.abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();

    set({ isLoadingMarkers: true, markersAbortController: abortController });

    try {
      // Fetch from /v1/markers?year={year}&limit={markerLimit} endpoint
      // Requirement 4.2: WHEN markers are fetched from the API, THE MapStore SHALL include the markerLimit as a query parameter
      // Requirement 4.3: THE API request SHALL use the format `/markers?year={year}&limit={markerLimit}`
      const endpoint = MARKERS.GET_BY_YEAR_WITH_LIMIT(year, markerLimit);
      const data = await apiClient.get<Marker[]>(endpoint, { signal: abortController.signal });

      // Validate response is an array
      if (!Array.isArray(data)) {
        console.warn(`loadMarkers: Invalid response format for year ${String(year)}`);
        set({ isLoadingMarkers: false, markersAbortController: null });
        return [];
      }

      // Store markers in state
      set({
        markers: data,
        isLoadingMarkers: false,
        markersAbortController: null,
      });

      return data;
    } catch (error) {
      // Check if request was aborted - Requirement 9.5
      if (error instanceof Error && error.name === 'AbortError') {
        console.debug(`[Performance] Markers request for year ${String(year)} was cancelled`);
        // Don't update state for aborted requests
        return [];
      }

      // Log error with details
      const axiosError = error as {
        response?: {
          status?: number;
          statusText?: string;
          data?: unknown;
        };
        message?: string;
      };

      console.error(`API ERROR: Failed to load markers for year ${String(year)}:`, error);
      console.error('Error details:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        url: MARKERS.GET_BY_YEAR(year),
      });

      // Store error state
      const errorInstance =
        error instanceof Error ? error : new Error(`Failed to load markers for year ${String(year)}`);
      set({
        error: errorInstance,
        isLoadingMarkers: false,
        markersAbortController: null,
      });

      return [];
    }
  },

  /**
   * Sets the marker filter state for a specific marker type.
   * Requirement 6.3: THE Map_Store SHALL maintain the current marker filter state.
   * Supports both individual API types (p, b, ca, etc.) and legacy categories.
   *
   * @param type - The marker type to filter (API code or category name)
   * @param enabled - Whether the marker type should be visible
   */
  setMarkerFilter: (type: MarkerType, enabled: boolean) => {
    // Accept any string type - the filter state uses index signature
    set((state) => ({
      markerFilters: {
        ...state.markerFilters,
        [type]: enabled,
      },
    }));
  },

  /**
   * Gets the filtered markers based on current filter state.
   * Requirement 6.4: WHEN markers are fetched, THE MapView SHALL apply the current filter.
   * Checks both individual marker type and legacy category filters.
   *
   * @returns Array of markers that pass the current filter
   */
  getFilteredMarkers: (): Marker[] => {
    const state = get();
    const { markers, markerFilters } = state;

    // Filter markers based on current filter state
    // First check if the individual type is filtered, then fall back to category
    return markers.filter((marker) => {
      const markerType = marker.type.toLowerCase();
      
      // Check individual type filter first (e.g., 'p', 'b', 'ca')
      if (markerFilters[markerType] !== undefined) {
        return markerFilters[markerType];
      }
      
      // Fall back to category filter (e.g., 'person', 'battle')
      const filterCategory = getMarkerFilterCategory(markerType);
      return markerFilters[filterCategory];
    });
  },

  /**
   * Calculates labels for the active color dimension.
   * Requirement 7.1: THE MapView SHALL display text labels for the currently active color dimension
   * Requirement 7.5: THE MapView SHALL calculate label positions by finding the centroid of merged province polygons
   * Requirement 7.6: THE MapView SHALL use appropriate font sizing based on the entity's territory size
   *
   * PERFORMANCE OPTIMIZATION: Instead of using expensive turf.union to merge all provinces,
   * we calculate a weighted centroid based on individual province centroids and areas.
   * This is much faster while still producing good label positions.
   *
   * @param dimension - The color dimension to calculate labels for
   */
  calculateLabels: (dimension: AreaColorDimension) => {
    const state = get();

    // Validate inputs
    if (!state.provincesGeoJSON || !state.currentAreaData || !state.metadata) {
      set({ labelData: null });
      return;
    }

    // Population dimension doesn't have entity labels
    if (dimension === 'population') {
      set({ labelData: null });
      return;
    }

    // Get dimension index for looking up values
    const dimensionIndex = DIMENSION_INDEX[dimension];

    // Group province data by entity value (store centroid and area for weighted calculation)
    interface ProvinceData {
      centroid: [number, number];
      area: number;
    }
    const entityData = new Map<string, ProvinceData[]>();

    for (const feature of state.provincesGeoJSON.features) {
      // Province ID is stored in the 'name' property of the GeoJSON feature
      // After updateProvinceProperties runs, 'id' is also set
      const provinceId = (feature.properties?.['id'] as string | undefined) ?? 
                         (feature.properties?.['name'] as string | undefined);
      if (!provinceId) continue;

      const data = state.currentAreaData[provinceId];
      if (!data || !Array.isArray(data)) continue;

      let entityValue = data[dimensionIndex] as string | undefined;
      if (!entityValue) continue;

      // For religionGeneral, we need to look up the parent category
      if (dimension === 'religionGeneral') {
        entityValue = get().getReligionGeneral(entityValue);
      }

      // Calculate centroid and area for this province
      try {
        const centroid = turf.centroid(feature);
        const area = turf.area(feature);
        
        const provinceData: ProvinceData = {
          centroid: centroid.geometry.coordinates as [number, number],
          area,
        };

        const existing = entityData.get(entityValue);
        if (existing) {
          existing.push(provinceData);
        } else {
          entityData.set(entityValue, [provinceData]);
        }
      } catch {
        // Skip provinces that fail to process
        continue;
      }
    }

    // Calculate labels for each entity using weighted centroid
    const labelFeatures: Feature<Point, LabelFeatureProperties>[] = [];

    for (const [entityId, provinces] of entityData) {
      try {
        // Calculate weighted centroid (weighted by area)
        let totalArea = 0;
        let weightedLng = 0;
        let weightedLat = 0;

        for (const province of provinces) {
          totalArea += province.area;
          weightedLng += province.centroid[0] * province.area;
          weightedLat += province.centroid[1] * province.area;
        }

        if (totalArea === 0) continue;

        const centroidLng = weightedLng / totalArea;
        const centroidLat = weightedLat / totalArea;

        // Calculate font size based on total area
        const fontSize = calculateFontSize(totalArea);

        // Get entity name from metadata
        const metadataKey = dimension === 'religionGeneral' ? 'religionGeneral' : dimension;
        const dimensionMetadata = state.metadata[metadataKey];
        const entityName = dimensionMetadata[entityId]?.name ?? entityId;

        labelFeatures.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [centroidLng, centroidLat],
          },
          properties: {
            name: entityName,
            fontSize,
            entityId,
            dimension,
          },
        });
      } catch (error) {
        // Skip entities that fail to process
        console.warn(`calculateLabels: Failed to process entity ${entityId}`, error);
      }
    }

    set({
      labelData: {
        type: 'FeatureCollection',
        features: labelFeatures,
      },
    });
  },

  /**
   * Cancels any in-flight area data request.
   * Requirement 9.5: THE API_Client SHALL support request cancellation for in-flight requests
   * Requirement 11.2: THE MapView SHALL debounce year change events
   */
  cancelAreaDataRequest: () => {
    const state = get();
    if (state.areaDataAbortController) {
      state.areaDataAbortController.abort();
      set({ areaDataAbortController: null });
    }
  },

  /**
   * Cancels any in-flight markers request.
   * Requirement 9.5: THE API_Client SHALL support request cancellation for in-flight requests
   */
  cancelMarkersRequest: () => {
    const state = get();
    if (state.markersAbortController) {
      state.markersAbortController.abort();
      set({ markersAbortController: null });
    }
  },

  /**
   * Sets the active label dimension for entity labels.
   * Requirement 6.4, 6.5: Layer toggle controls for label dimension.
   *
   * @param dimension - The label dimension to activate (cannot be 'population')
   */
  setActiveLabel: (dimension: AreaColorDimension) => {
    // Population cannot be used for labels
    if (dimension === 'population') {
      console.warn('setActiveLabel: Population dimension cannot be used for labels');
      return;
    }

    if (!isValidColorDimension(dimension)) {
      console.warn(`setActiveLabel: Invalid dimension "${String(dimension)}"`);
      return;
    }

    set({ activeLabel: dimension });
  },

  /**
   * Sets whether color and label dimensions are locked together.
   * Requirement 6.4: When locked, changing color also changes label.
   * Requirement 6.5: When unlocked, color and label can be changed independently.
   *
   * @param locked - Whether to lock color and label together
   */
  setColorLabelLocked: (locked: boolean) => {
    set({ colorLabelLocked: locked });
  },

  /**
   * Sets the hovered province ID for tooltip display.
   * Requirement 5.1: Province hover triggers tooltip display.
   *
   * @param provinceId - The province ID or null to clear
   */
  setHoveredProvince: (provinceId: string | null) => {
    set({ hoveredProvinceId: provinceId });
  },

  /**
   * Sets the hovered marker ID for highlight.
   * Requirement 5.1: Marker hover triggers highlight.
   *
   * @param markerId - The marker ID or null to clear
   */
  setHoveredMarker: (markerId: string | null) => {
    set({ hoveredMarkerId: markerId });
  },
}));
