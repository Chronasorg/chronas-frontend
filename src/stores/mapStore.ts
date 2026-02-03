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
import type { Feature, Polygon, MultiPolygon, FeatureCollection } from 'geojson';
import { apiClient } from '../api/client';
import { AREAS } from '../api/endpoints';
import type { MapAreaData } from '../api/types';

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
  /** Active color dimension for area coloring */
  activeColor: AreaColorDimension;
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
  /** Error state for display - Requirement 13.4 */
  error: Error | null;
  /** Entity outline polygon - Requirement 8.1, 8.2, 8.5 */
  entityOutline: Feature<Polygon | MultiPolygon> | null;
  /** Entity outline color - Requirement 8.4 */
  entityOutlineColor: string | null;
  /** Provinces GeoJSON for entity outline calculation */
  provincesGeoJSON: FeatureCollection<Polygon | MultiPolygon> | null;
  /** Metadata for entity colors */
  metadata: EntityMetadata | null;
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
}

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
   * Gets the color for an entity value from metadata.
   * Requirement 8.4: THE MapView SHALL color the entity outline using the metadata color.
   *
   * @param value - The entity value
   * @param dimension - The dimension (ruler, culture, religion, religionGeneral)
   * @returns The color string or null if not found
   */
  getEntityColor: (value: string, dimension: AreaColorDimension) => string | null;
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
 * Initial map state
 */
export const initialState: MapState = {
  viewport: { ...defaultViewport },
  activeColor: 'ruler',
  previousActiveColor: null,
  layerVisibility: { ...defaultLayerVisibility },
  isFlying: false,
  flyToTarget: null,
  areaDataCache: new Map<number, AreaData>(),
  currentAreaData: null,
  isLoadingAreaData: false,
  selectedProvince: null,
  selectedProvinceData: null,
  error: null,
  entityOutline: null,
  entityOutlineColor: null,
  provincesGeoJSON: null,
  metadata: null,
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
   * Requirement 13.1: Log errors with details.
   *
   * @param year - The year to load area data for
   * @returns Promise that resolves with the area data or null
   */
  loadAreaData: async (year: number): Promise<AreaData | null> => {
    // Validate year is a finite number
    if (!Number.isFinite(year)) {
      console.warn(`loadAreaData: Invalid year "${String(year)}"`);
      return null;
    }

    const state = get();

    // Check cache first - Requirement 12.2
    const cachedData = state.areaDataCache.get(year);
    if (cachedData) {
      // Return cached data without making API call
      set({ currentAreaData: cachedData, isLoadingAreaData: false });
      return cachedData;
    }

    // Data not in cache, set loading state and fetch from API
    set({ isLoadingAreaData: true, error: null });

    try {
      // Fetch from /areas/{year} endpoint - Requirement 3.2
      const endpoint = AREAS.GET_BY_YEAR(year);
      const data = await apiClient.get<MapAreaData>(endpoint);

      // Validate response is an object (dictionary of province data)
      if (typeof data !== 'object') {
        console.warn(`loadAreaData: Invalid response format for year ${String(year)}`);
        set({ isLoadingAreaData: false });
        return null;
      }

      // Cast to AreaData (same structure as MapAreaData)
      const areaData = data as AreaData;

      // Cache the response - Requirement 12.2
      set((state) => {
        const newCache = new Map(state.areaDataCache);
        newCache.set(year, areaData);

        return {
          areaDataCache: newCache,
          currentAreaData: areaData,
          isLoadingAreaData: false,
        };
      });

      return areaData;
    } catch (error) {
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
      const provinceId = feature.properties?.['id'] as string | undefined;
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
   * Gets the color for an entity value from metadata.
   * Requirement 8.4: THE MapView SHALL color the entity outline using the metadata color.
   *
   * @param value - The entity value
   * @param dimension - The dimension (ruler, culture, religion, religionGeneral)
   * @returns The color string or null if not found
   */
  getEntityColor: (value: string, dimension: AreaColorDimension): string | null => {
    const state = get();

    if (!state.metadata || !value) {
      return null;
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
        return null;
    }

    const entry = state.metadata[metadataKey][value];
    return entry?.color ?? null;
  },
}));
