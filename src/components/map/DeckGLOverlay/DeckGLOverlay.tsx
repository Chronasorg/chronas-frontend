/**
 * DeckGLOverlay Component
 *
 * Renders deck.gl layers on top of the Mapbox base map including
 * markers, arcs, city labels, and area color layers.
 *
 * Requirements: 1.2, 5.2, 5.3, 5.5, 9.1, 9.2, 9.3, 9.4, 9.5, 9.9, 11.1, 11.2, 11.3, 11.4
 */

import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { useControl } from 'react-map-gl/mapbox';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { IconLayer, TextLayer, ScatterplotLayer, ArcLayer, GeoJsonLayer } from '@deck.gl/layers';
import type { PickingInfo } from '@deck.gl/core';
import type { LayersList } from '@deck.gl/core';
import type { FeatureCollection, Polygon, MultiPolygon } from 'geojson';
import type { ThemeConfig } from '../../../config/mapTheme';
import type { ViewportState, AreaColorDimension, LayerVisibility, AreaData } from '../../../stores/mapStore';

// ============================================================================
// Types
// ============================================================================

/**
 * Marker data structure for map markers.
 * Requirements: 9.2
 */
export interface MarkerData {
  /** Unique identifier */
  _id: string;
  /** Display name */
  name: string;
  /** Marker type/subtype (b, si, c, cp, etc.) */
  subtype: string;
  /** Coordinates [longitude, latitude] */
  coo: [number, number];
  /** Wikipedia reference */
  wiki?: string;
  /** Year of the marker */
  year?: number;
  /** Capital history array [[startYear, endYear, rulerId], ...] */
  capital?: [number, number, string][];
  /** Whether this marker is currently active/selected */
  isActive?: boolean;
  /** Zoom level visibility data for clustering */
  zoomLevels?: Record<number, ZoomLevelData | null>;
  /** Screen X coordinate for clustering */
  x?: number;
  /** Screen Y coordinate for clustering */
  y?: number;
}

/**
 * Zoom level data for clustering
 */
export interface ZoomLevelData {
  icon: string;
  size: number;
  points: MarkerData[];
}

/**
 * Arc data for connections between locations.
 * Requirements: 11.2, 11.3
 */
export interface ArcData {
  /** Source coordinates [longitude, latitude] */
  source: [number, number];
  /** Target coordinates [longitude, latitude] */
  target: [number, number];
  /** Source color [r, g, b, a] */
  sourceColor: [number, number, number, number];
  /** Target color [r, g, b, a] */
  targetColor: [number, number, number, number];
}

/**
 * Selected item state
 */
export interface SelectedItem {
  wiki?: string;
  type?: string;
  data?: {
    content?: { properties?: { w?: string } }[];
    drawRoute?: boolean;
  };
}

/**
 * Metadata entry for colors and labels
 */
export interface MetadataEntry {
  /** Display name */
  0: string;
  /** Color value (rgba string) */
  1: string;
  /** Additional data varies by type */
  [key: number]: unknown;
}

/**
 * Metadata structure
 */
export interface Metadata {
  ruler: Record<string, MetadataEntry>;
  culture: Record<string, MetadataEntry>;
  religion: Record<string, MetadataEntry>;
  religionGeneral: Record<string, MetadataEntry>;
}

/**
 * Deck.gl hover event
 */
export interface DeckHoverEvent {
  object: MarkerData | undefined;
  x: number;
  y: number;
  coordinate: [number, number] | undefined;
}

/**
 * Go to viewport options
 */
export interface GoToViewportOptions {
  longitude: number;
  latitude: number;
  zoom?: number;
  zoomIn?: boolean;
}

/**
 * Props for the DeckGLOverlay component.
 * Requirements: 1.2, 5.2, 5.3, 5.5
 */
export interface DeckGLOverlayProps {
  /** Current viewport state */
  viewport: ViewportState;
  /** Current theme configuration */
  theme: ThemeConfig;
  /** Active color dimension for areas */
  activeColor: AreaColorDimension;
  /** Layer visibility state for each color dimension - Requirement 5.3 */
  layerVisibility: LayerVisibility;
  /** Provinces GeoJSON for area coloring - Requirement 5.2 */
  provincesGeoJSON?: FeatureCollection<Polygon | MultiPolygon> | null;
  /** Current area data for province coloring - Requirement 5.2 */
  areaData?: AreaData | null;
  /** Marker data to display */
  markerData: MarkerData[];
  /** Arc data for connections (reserved for future arc layer implementation) */
  arcData?: ArcData[];
  /** Currently selected item */
  selectedItem: SelectedItem;
  /** Current year */
  selectedYear: number;
  /** Marker theme (themed or abstract) */
  markerTheme: string;
  /** Metadata for colors and labels */
  metadata: Metadata;
  /** Whether to show clustered markers */
  showCluster: boolean;
  /** Callback for marker clicks */
  onMarkerClick: (marker: MarkerData) => void;
  /** Callback for hover events */
  onHover: (event: DeckHoverEvent) => void;
  /** Callback to update route line (reserved for future route animation) */
  updateLine?: (coordinates: number[][]) => void;
  /** Callback to navigate viewport (reserved for future navigation) */
  goToViewport?: (options: GoToViewportOptions) => void;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Icon size multipliers by marker type.
 * Requirements: 9.9
 */
export const iconSize: Record<string, number> = {
  cp: 7, // Capital
  ca: 4, // Castle
  b: 5, // Battle
  si: 5, // Siege
  c0: 7, // Capital outline
  c: 4, // City
  l: 4, // Landmark
  m: 4, // Military
  p: 4, // Politician
  e: 4, // Explorer
  s: 4, // Scientist
  a: 4, // Artist
  r: 4, // Religious
  at: 4, // Athlete
  op: 4, // Unclassified
  o: 4, // Unknown
  ar: 4, // Artifact
};

/**
 * Default marker size in pixels
 */
export const DEFAULT_MARKER_SIZE = 20;

/**
 * Icon mapping for themed markers.
 * Each entry defines position and size in the sprite sheet.
 */
export interface IconEntry {
  x: number;
  y: number;
  width: number;
  height: number;
  anchorY: number;
  anchorX?: number;
  mask?: boolean;
}

export type IconMapping = Record<string, IconEntry>;

/**
 * Icon dimensions for themed atlas (from production properties.js)
 */
const ICON_WIDTH = 135;
const ICON_HEIGHT = 127;

/**
 * Basic icon mapping for themed markers
 * Positions from production iconMapping['them'] in properties.js
 */
export const themedIconMapping: IconMapping = {
  // Row 0: r, p, e (and '1' for cluster)
  r: { x: ICON_WIDTH, y: 0, width: ICON_WIDTH, height: ICON_HEIGHT, anchorY: ICON_HEIGHT, mask: false },
  p: { x: 2 * ICON_WIDTH, y: 0, width: ICON_WIDTH, height: ICON_HEIGHT, anchorY: ICON_HEIGHT, mask: false },
  e: { x: 3 * ICON_WIDTH, y: 0, width: ICON_WIDTH, height: ICON_HEIGHT, anchorY: ICON_HEIGHT, mask: false },
  // Row 1: a, s, op (and '6' for cluster)
  a: { x: 0, y: ICON_HEIGHT, width: ICON_WIDTH, height: ICON_HEIGHT, anchorY: ICON_HEIGHT, mask: false },
  s: { x: 2 * ICON_WIDTH, y: ICON_HEIGHT, width: ICON_WIDTH, height: ICON_HEIGHT, anchorY: ICON_HEIGHT, mask: false },
  op: { x: 3 * ICON_WIDTH, y: ICON_HEIGHT, width: ICON_WIDTH, height: ICON_HEIGHT, anchorY: ICON_HEIGHT, mask: false },
  // Row 2: at, m (and '9', '12' for cluster)
  at: { x: ICON_WIDTH, y: 2 * ICON_HEIGHT, width: ICON_WIDTH, height: ICON_HEIGHT, anchorY: ICON_HEIGHT, mask: false },
  m: { x: 2 * ICON_WIDTH, y: 2 * ICON_HEIGHT, width: ICON_WIDTH, height: ICON_HEIGHT, anchorY: ICON_HEIGHT, mask: false },
  // Row 3: ar, b, si, cp
  ar: { x: 0, y: 3 * ICON_HEIGHT, width: ICON_WIDTH, height: ICON_HEIGHT, anchorY: ICON_HEIGHT, mask: false },
  b: { x: ICON_WIDTH, y: 3 * ICON_HEIGHT, width: ICON_WIDTH, height: ICON_HEIGHT, anchorY: ICON_HEIGHT, mask: false },
  si: { x: 2 * ICON_WIDTH, y: 3 * ICON_HEIGHT, width: ICON_WIDTH, height: ICON_HEIGHT, anchorY: ICON_HEIGHT, mask: false },
  cp: { x: 3 * ICON_WIDTH, y: 3 * ICON_HEIGHT, width: ICON_WIDTH, height: ICON_HEIGHT, anchorY: ICON_HEIGHT, mask: true },
  // Row 4: ca, c0, l, o (and '18' for cluster)
  ca: { x: 0, y: 4 * ICON_HEIGHT, width: ICON_WIDTH, height: ICON_HEIGHT, anchorY: ICON_HEIGHT, mask: false },
  c0: { x: ICON_WIDTH, y: 4 * ICON_HEIGHT, width: ICON_WIDTH, height: ICON_HEIGHT, anchorY: ICON_HEIGHT, mask: false },
  l: { x: 2 * ICON_WIDTH, y: 4 * ICON_HEIGHT, width: ICON_WIDTH, height: ICON_HEIGHT, anchorY: ICON_HEIGHT, mask: false },
  h: { x: 2 * ICON_WIDTH, y: 4 * ICON_HEIGHT, width: ICON_WIDTH, height: ICON_HEIGHT, anchorY: ICON_HEIGHT, mask: false }, // Same as l
  o: { x: 3 * ICON_WIDTH, y: 4 * ICON_HEIGHT, width: ICON_WIDTH, height: ICON_HEIGHT, anchorY: ICON_HEIGHT, mask: false },
  // Row 5: c
  c: { x: 0, y: 5 * ICON_HEIGHT, width: ICON_WIDTH, height: ICON_HEIGHT, anchorY: ICON_HEIGHT, mask: false },
};

/**
 * Cluster icon mapping for cluster markers
 */
export const clusterIconMapping: IconMapping = {
  '': { x: 0, y: 0, width: 1, height: 1, anchorY: 1 },
  '1': { x: 0, y: 0, width: 64, height: 64, anchorY: 64 },
  '2': { x: 64, y: 0, width: 64, height: 64, anchorY: 64 },
  '3': { x: 128, y: 0, width: 64, height: 64, anchorY: 64 },
  '4': { x: 192, y: 0, width: 64, height: 64, anchorY: 64 },
  '5': { x: 0, y: 64, width: 64, height: 64, anchorY: 64 },
  '6': { x: 64, y: 64, width: 64, height: 64, anchorY: 64 },
  '7': { x: 128, y: 64, width: 64, height: 64, anchorY: 64 },
  '8': { x: 192, y: 64, width: 64, height: 64, anchorY: 64 },
  '9': { x: 0, y: 128, width: 64, height: 64, anchorY: 64 },
  '10': { x: 64, y: 128, width: 64, height: 64, anchorY: 64 },
  '20': { x: 128, y: 128, width: 64, height: 64, anchorY: 64 },
  '30': { x: 192, y: 128, width: 64, height: 64, anchorY: 64 },
  '40': { x: 0, y: 192, width: 64, height: 64, anchorY: 64 },
  '50': { x: 64, y: 192, width: 64, height: 64, anchorY: 64 },
  '60': { x: 128, y: 192, width: 64, height: 64, anchorY: 64 },
  '70': { x: 192, y: 192, width: 64, height: 64, anchorY: 64 },
  '80': { x: 0, y: 256, width: 64, height: 64, anchorY: 64 },
  '90': { x: 64, y: 256, width: 64, height: 64, anchorY: 64 },
  '100': { x: 128, y: 256, width: 64, height: 64, anchorY: 64 },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculates marker size based on zoom level.
 * Requirements: 9.9
 *
 * @param zoom - Current zoom level
 * @returns Size multiplier for markers
 */
export function getMarkerSizeScale(zoom: number): number {
  return Math.min(Math.pow(1.55, zoom - 10), 1);
}

/**
 * Converts an RGBA string to an array of numbers.
 *
 * @param rgba - RGBA string like "rgba(173, 135, 27, 1)" or "rgb(173, 135, 27)"
 * @returns Array of [r, g, b, a] values
 */
export function rgbaToArray(rgba: string): [number, number, number, number] {
  // Handle rgb() format
  const rgbMatch = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/.exec(rgba);
  if (rgbMatch) {
    return [
      parseInt(rgbMatch[1] ?? '0', 10),
      parseInt(rgbMatch[2] ?? '0', 10),
      parseInt(rgbMatch[3] ?? '0', 10),
      255,
    ];
  }

  // Handle rgba() format
  const rgbaMatch = /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/.exec(rgba);
  if (rgbaMatch) {
    return [
      parseInt(rgbaMatch[1] ?? '0', 10),
      parseInt(rgbaMatch[2] ?? '0', 10),
      parseInt(rgbaMatch[3] ?? '0', 10),
      Math.round(parseFloat(rgbaMatch[4] ?? '1') * 255),
    ];
  }

  // Default to black
  return [0, 0, 0, 255];
}

/**
 * Gets the icon name for a cluster based on size.
 *
 * @param size - Number of markers in the cluster
 * @returns Icon name string
 */
export function getClusterIconName(size: number): string {
  if (size === 0) {
    return '';
  }
  if (size < 10) {
    return String(size);
  }
  if (size < 100) {
    return String(Math.floor(size / 10) * 10);
  }
  return '100';
}

/**
 * Gets the icon size multiplier for a cluster based on size.
 *
 * @param size - Number of markers in the cluster
 * @returns Size multiplier (0.5 to 1.0)
 */
export function getClusterIconSize(size: number): number {
  return (Math.min(100, size) / 100) * 0.5 + 0.5;
}

// ============================================================================
// City Label Constants
// ============================================================================

/**
 * Minimum font size for city labels in pixels.
 * Requirements: 10.4
 */
export const CITY_LABEL_MIN_FONT_SIZE = 18;

/**
 * Maximum font size for city labels in pixels.
 * Requirements: 10.4
 */
export const CITY_LABEL_MAX_FONT_SIZE = 68;

/**
 * City label weight for capitals.
 * Requirements: 10.3
 */
export const CITY_WEIGHT_CAPITAL = 4;

/**
 * City label weight for cities with capital history.
 * Requirements: 10.3
 */
export const CITY_WEIGHT_CAPITAL_HISTORY = 2;

/**
 * City label weight for regular cities.
 * Requirements: 10.3
 */
export const CITY_WEIGHT_REGULAR = 1;

/**
 * Radius for city dots in pixels.
 * Requirements: 10.5
 */
export const CITY_DOT_RADIUS = 4;

/**
 * Radius for highlighted city dots in pixels.
 * Requirements: 10.6
 */
export const CITY_DOT_HIGHLIGHT_RADIUS = 6;

/**
 * Default stroke width for arc connections in pixels.
 * Requirements: 11.4
 */
export const ARC_STROKE_WIDTH = 15;

// ============================================================================
// Area Color Layer Constants
// ============================================================================

/**
 * Minimum opacity for population coloring.
 * Requirements: 5.5
 */
export const POPULATION_OPACITY_MIN = 0.3;

/**
 * Maximum opacity for population coloring.
 * Requirements: 5.5
 */
export const POPULATION_OPACITY_MAX = 0.8;

/**
 * Default fill color for areas without metadata color.
 */
export const DEFAULT_AREA_FILL_COLOR: [number, number, number, number] = [128, 128, 128, 180];

/**
 * Population color (used for population dimension).
 * Requirements: 5.5
 */
export const POPULATION_FILL_COLOR: [number, number, number] = [100, 149, 237]; // Cornflower blue

/**
 * Maximum population value for opacity interpolation.
 * Requirements: 5.5
 */
export const MAX_POPULATION_FOR_OPACITY = 10000000;

/**
 * Index mapping for area color dimensions to province data array indices.
 * ruler=0, culture=1, religion=2, religionGeneral maps to religion (2), population=4
 */
export const DIMENSION_INDEX: Record<AreaColorDimension, number> = {
  ruler: 0,
  culture: 1,
  religion: 2,
  religionGeneral: 2, // religionGeneral uses the same index as religion
  population: 4,
};

// ============================================================================
// Area Color Utility Functions
// ============================================================================

/**
 * Gets the fill color for a province based on the active color dimension.
 * Requirements: 5.2, 5.3
 *
 * @param provinceId - The province ID
 * @param areaData - The current area data
 * @param activeColor - The active color dimension
 * @param metadata - The metadata containing colors
 * @returns RGBA color array
 */
export function getProvinceColor(
  provinceId: string,
  areaData: AreaData | null | undefined,
  activeColor: AreaColorDimension,
  metadata: Metadata
): [number, number, number, number] {
  if (!areaData || !provinceId) {
    return DEFAULT_AREA_FILL_COLOR;
  }

  const provinceData = areaData[provinceId];
  if (!provinceData || !Array.isArray(provinceData)) {
    return DEFAULT_AREA_FILL_COLOR;
  }

  // For population, return the population color (opacity handled separately)
  if (activeColor === 'population') {
    return [...POPULATION_FILL_COLOR, 255];
  }

  // Get the dimension index
  const dimensionIndex = DIMENSION_INDEX[activeColor];
  const entityValue = provinceData[dimensionIndex];

  if (!entityValue || typeof entityValue !== 'string') {
    return DEFAULT_AREA_FILL_COLOR;
  }

  // Get the metadata section for the active color dimension
  const metadataSections: Record<Exclude<AreaColorDimension, 'population'>, Record<string, MetadataEntry>> = {
    ruler: metadata.ruler,
    culture: metadata.culture,
    religion: metadata.religion,
    religionGeneral: metadata.religionGeneral,
  };

  const metadataSection = metadataSections[activeColor];
  const entry = metadataSection[entityValue];
  if (!entry) {
    return DEFAULT_AREA_FILL_COLOR;
  }

  // Get color string from metadata entry (index 1 is the color)
  const colorString = entry[1];
  if (typeof colorString !== 'string') {
    return DEFAULT_AREA_FILL_COLOR;
  }

  return rgbaToArray(colorString);
}

/**
 * Gets the fill opacity for a province based on population.
 * Requirements: 5.5
 *
 * @param provinceId - The province ID
 * @param areaData - The current area data
 * @param activeColor - The active color dimension
 * @returns Opacity value between POPULATION_OPACITY_MIN and POPULATION_OPACITY_MAX
 */
export function getProvinceOpacity(
  provinceId: string,
  areaData: AreaData | null | undefined,
  activeColor: AreaColorDimension
): number {
  // For non-population dimensions, return full opacity
  if (activeColor !== 'population') {
    return 1.0;
  }

  if (!areaData || !provinceId) {
    return POPULATION_OPACITY_MIN;
  }

  const provinceData = areaData[provinceId];
  if (!provinceData || !Array.isArray(provinceData)) {
    return POPULATION_OPACITY_MIN;
  }

  // Population is at index 4
  const population = provinceData[4];
  if (typeof population !== 'number' || population <= 0) {
    return POPULATION_OPACITY_MIN;
  }

  // Interpolate opacity based on population
  // Requirements: 5.5 - opacity interpolation between 0.3 and 0.8
  const normalizedPopulation = Math.min(population / MAX_POPULATION_FOR_OPACITY, 1);
  return POPULATION_OPACITY_MIN + normalizedPopulation * (POPULATION_OPACITY_MAX - POPULATION_OPACITY_MIN);
}

// ============================================================================
// City Label Utility Functions
// ============================================================================

/**
 * Calculates the label weight for a city based on its type.
 * Requirements: 10.3
 *
 * - Capitals (subtype 'cp') get weight 4
 * - Cities with capital history for the current year get weight 2
 * - Regular cities get weight 1
 *
 * @param city - The city marker data
 * @param selectedYear - The currently selected year
 * @returns The weight value (1, 2, or 4)
 */
export function getCityLabelWeight(city: MarkerData, selectedYear: number): number {
  // Capital markers get weight 4
  if (city.subtype === 'cp') {
    return CITY_WEIGHT_CAPITAL;
  }

  // Cities with capital history for the current year get weight 2
  if (city.capital && Array.isArray(city.capital)) {
    const hasCapitalHistory = city.capital.some(
      (entry) =>
        Array.isArray(entry) &&
        entry[0] <= selectedYear &&
        entry[1] >= selectedYear
    );
    if (hasCapitalHistory) {
      return CITY_WEIGHT_CAPITAL_HISTORY;
    }
  }

  // Regular cities get weight 1
  return CITY_WEIGHT_REGULAR;
}

/**
 * Calculates the font size for a city label based on its weight.
 * Requirements: 10.4
 *
 * Font size is interpolated between 18px and 68px based on weight.
 * Weight 1 -> 18px, Weight 4 -> 68px
 *
 * @param weight - The city label weight (1, 2, or 4)
 * @returns The font size in pixels (18-68)
 */
export function getCityLabelFontSize(weight: number): number {
  // Normalize weight to 0-1 range (weight 1 = 0, weight 4 = 1)
  const normalizedWeight = (weight - CITY_WEIGHT_REGULAR) / (CITY_WEIGHT_CAPITAL - CITY_WEIGHT_REGULAR);
  
  // Interpolate between min and max font sizes
  return Math.round(
    CITY_LABEL_MIN_FONT_SIZE +
      normalizedWeight * (CITY_LABEL_MAX_FONT_SIZE - CITY_LABEL_MIN_FONT_SIZE)
  );
}

/**
 * Checks if a marker is a city type (c or cp).
 *
 * @param marker - The marker data
 * @returns True if the marker is a city
 */
export function isCityMarker(marker: MarkerData): boolean {
  return marker.subtype === 'c' || marker.subtype === 'cp';
}

/**
 * Checks if a marker is a non-capital city (subtype 'c').
 * Requirements: 10.5
 *
 * @param marker - The marker data
 * @returns True if the marker is a non-capital city
 */
export function isNonCapitalCity(marker: MarkerData): boolean {
  return marker.subtype === 'c';
}

// ============================================================================
// Clustering
// ============================================================================

/**
 * Simple spatial index for marker clustering.
 * Uses a grid-based approach for efficient neighbor queries.
 */
export class MarkerSpatialIndex {
  private grid = new Map<string, MarkerData[]>();
  private cellSize: number;

  constructor(cellSize = 50) {
    this.cellSize = cellSize;
  }

  /**
   * Clears the spatial index.
   */
  clear(): void {
    this.grid.clear();
  }

  /**
   * Loads markers into the spatial index.
   *
   * @param markers - Array of markers with x, y screen coordinates
   */
  load(markers: MarkerData[]): void {
    this.clear();
    for (const marker of markers) {
      if (marker.x !== undefined && marker.y !== undefined) {
        const cellKey = this.getCellKey(marker.x, marker.y);
        const cell = this.grid.get(cellKey);
        if (cell) {
          cell.push(marker);
        } else {
          this.grid.set(cellKey, [marker]);
        }
      }
    }
  }

  /**
   * Searches for markers within a bounding box.
   *
   * @param minX - Minimum X coordinate
   * @param minY - Minimum Y coordinate
   * @param maxX - Maximum X coordinate
   * @param maxY - Maximum Y coordinate
   * @returns Array of markers within the bounding box
   */
  search(minX: number, minY: number, maxX: number, maxY: number): MarkerData[] {
    const results: MarkerData[] = [];
    const minCellX = Math.floor(minX / this.cellSize);
    const minCellY = Math.floor(minY / this.cellSize);
    const maxCellX = Math.floor(maxX / this.cellSize);
    const maxCellY = Math.floor(maxY / this.cellSize);

    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cy = minCellY; cy <= maxCellY; cy++) {
        const cellKey = [cx, cy].join(',');
        const cell = this.grid.get(cellKey);
        if (cell) {
          for (const marker of cell) {
            if (
              marker.x !== undefined &&
              marker.y !== undefined &&
              marker.x >= minX &&
              marker.x <= maxX &&
              marker.y >= minY &&
              marker.y <= maxY
            ) {
              results.push(marker);
            }
          }
        }
      }
    }

    return results;
  }

  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return [cellX, cellY].join(',');
  }
}

/**
 * Calculates marker clusters for a given zoom level.
 * Requirements: 9.5
 *
 * @param markers - Array of markers with screen coordinates
 * @param zoom - Current zoom level
 * @param sizeScale - Base size scale for clustering radius
 * @returns Markers with zoomLevels populated for clustering
 */
export function calculateClusters(
  markers: MarkerData[],
  zoom: number,
  sizeScale: number
): MarkerData[] {
  const spatialIndex = new MarkerSpatialIndex();
  const z = Math.floor(zoom);

  // Reset zoom levels for all markers
  const processedMarkers = markers.map((m) => ({
    ...m,
    zoomLevels: {} as Record<number, ZoomLevelData | null>,
  }));

  spatialIndex.load(processedMarkers);

  // Calculate clustering radius based on zoom
  const radius = (sizeScale * 20) / Math.sqrt(2) / Math.pow(2, z);

  // Filter out city markers from clustering
  const clusterableMarkers = processedMarkers.filter(
    (m) => m.subtype !== 'c' && m.x !== undefined && m.y !== undefined
  );

  for (const marker of clusterableMarkers) {
    const zoomLevels = marker.zoomLevels;
    if (zoomLevels[z] === undefined && marker.x !== undefined && marker.y !== undefined) {
      // Find all neighbors within radius that haven't been clustered
      const neighbors = spatialIndex
        .search(marker.x - radius, marker.y - radius, marker.x + radius, marker.y + radius)
        .filter((n) => {
          const nZoomLevels = n.zoomLevels;
          return nZoomLevels !== undefined && nZoomLevels[z] === undefined;
        });

      // Mark all neighbors as belonging to this cluster
      for (const neighbor of neighbors) {
        const neighborZoomLevels = neighbor.zoomLevels;
        if (neighborZoomLevels !== undefined) {
          if (neighbor === marker) {
            // This is the cluster center
            neighborZoomLevels[z] = {
              icon: getClusterIconName(neighbors.length),
              size: getClusterIconSize(neighbors.length),
              points: neighbors,
            };
          } else {
            // This marker is absorbed into the cluster
            neighborZoomLevels[z] = null;
          }
        }
      }
    }
  }

  return processedMarkers;
}

// ============================================================================
// DeckGL Overlay Hook
// ============================================================================

/**
 * Custom hook to create a DeckGL MapboxOverlay control.
 * This integrates deck.gl layers with react-map-gl.
 */
function DeckGLOverlayControl(props: { layers: LayersList }) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay({ interleaved: true }));

  overlay.setProps({ layers: props.layers });

  return null;
}

// ============================================================================
// DeckGLOverlay Component
// ============================================================================

/**
 * DeckGLOverlay Component
 *
 * Renders deck.gl layers on top of the Mapbox base map.
 * Includes IconLayer for markers with hover highlighting and click handling.
 *
 * Requirements:
 * - 1.2: THE MapView SHALL initialize deck.gl for overlay rendering
 * - 5.2: THE MapView SHALL support coloring provinces by ruler, religion, religionGeneral, culture, or population
 * - 5.3: WHEN the active color dimension changes, THE MapView SHALL update the visible layer
 * - 5.5: WHEN population coloring is active, THE MapView SHALL use opacity interpolation
 * - 9.1: THE MapView SHALL render markers using a deck.gl IconLayer
 * - 9.2: WHEN markers are loaded, THE MapView SHALL display them at their geographic coordinates
 * - 9.3: THE MapView SHALL use the appropriate icon atlas based on the marker theme setting
 * - 9.4: WHEN the user hovers over a marker, THE MapView SHALL highlight the marker
 * - 9.5: WHEN cluster mode is enabled, THE MapView SHALL display cluster icons with counts
 * - 9.9: THE MapView SHALL scale marker size based on zoom level
 * - 10.1: THE MapView SHALL render city labels using a TextLayer (alternative to TagmapLayer)
 * - 10.2: WHEN cities are loaded, THE MapView SHALL display their names at their geographic coordinates
 * - 10.3: THE MapView SHALL weight city labels (capitals: 4, capital history: 2, regular: 1)
 * - 10.4: THE MapView SHALL configure font size range (18-68px)
 * - 10.5: THE MapView SHALL render dots for non-capital cities using ScatterplotLayer
 * - 10.6: WHEN the user hovers over a city dot, THE MapView SHALL highlight the dot
 * - 10.7: WHEN the user clicks a city dot, THE MapView SHALL trigger onMarkerClick
 * - 11.1: THE MapView SHALL render route connections using a deck.gl ArcLayer
 * - 11.2: WHEN arc data is provided, THE MapView SHALL render curved lines between source and target coordinates
 * - 11.3: THE MapView SHALL color arcs using the provided source and target colors
 * - 11.4: THE MapView SHALL configure arc stroke width
 */
export function DeckGLOverlay(props: DeckGLOverlayProps) {
  const {
    viewport,
    theme,
    activeColor,
    layerVisibility,
    provincesGeoJSON,
    areaData,
    markerData,
    arcData,
    selectedItem,
    selectedYear,
    markerTheme,
    metadata,
    showCluster,
    onMarkerClick,
    onHover,
  } = props;

  // Track processed markers with clustering data
  const [processedMarkers, setProcessedMarkers] = useState<MarkerData[]>([]);
  const prevZoomRef = useRef<number>(viewport.zoom);

  // Process markers for clustering when data or zoom changes
  useEffect(() => {
    if (markerData.length === 0) {
      setProcessedMarkers([]);
      return;
    }

    // Add screen coordinates to markers for clustering
    // coo is typed as [number, number], but runtime data may be invalid
    // Use type assertion to allow runtime validation
    const validMarkers = markerData.filter((marker) => {
      const coo = marker.coo as unknown;
      if (!coo || !Array.isArray(coo) || coo.length < 2) {
        return false;
      }
      const [lng, lat] = coo as [unknown, unknown];
      return typeof lng === 'number' && typeof lat === 'number' && !isNaN(lng) && !isNaN(lat);
    });

    const markersWithCoords = validMarkers.map((marker) => {
      // Simple mercator projection for screen coordinates
      // This is a simplified version - in production, use WebMercatorViewport
      const x = ((marker.coo[0] + 180) / 360) * viewport.width;
      const y = ((90 - marker.coo[1]) / 180) * viewport.height;
      return { ...marker, x, y };
    });

    if (showCluster) {
      const sizeScaleValue = DEFAULT_MARKER_SIZE * getMarkerSizeScale(viewport.zoom) * (window.devicePixelRatio || 1);
      const clustered = calculateClusters(markersWithCoords, viewport.zoom, sizeScaleValue);
      setProcessedMarkers(clustered);
    } else {
      setProcessedMarkers(markersWithCoords);
    }

    prevZoomRef.current = viewport.zoom;
  }, [markerData, viewport.zoom, viewport.width, viewport.height, showCluster]);

  /**
   * Handle marker hover events.
   * Requirements: 9.4
   */
  const handleHover = useCallback(
    (info: PickingInfo) => {
      onHover({
        object: info.object as MarkerData | undefined,
        x: info.x,
        y: info.y,
        coordinate: info.coordinate as [number, number] | undefined,
      });
    },
    [onHover]
  );

  /**
   * Handle marker click events.
   * Requirements: 7.5
   */
  const handleClick = useCallback(
    (info: PickingInfo) => {
      if (info.object) {
        onMarkerClick(info.object as MarkerData);
      }
    },
    [onMarkerClick]
  );

  /**
   * Get the icon atlas URL based on marker theme.
   * Requirements: 9.3
   */
  const iconAtlasUrl = useMemo(() => {
    if (showCluster) {
      return '/images/themed-cluster-atlas.png';
    }
    return '/images/' + markerTheme + '-atlas.png';
  }, [markerTheme, showCluster]);

  /**
   * Get the icon mapping based on marker theme.
   */
  const currentIconMapping = useMemo(() => {
    return showCluster ? clusterIconMapping : themedIconMapping;
  }, [showCluster]);

  /**
   * Calculate marker size scale based on zoom.
   * Requirements: 9.9
   */
  const sizeScale = useMemo(() => {
    return DEFAULT_MARKER_SIZE * getMarkerSizeScale(viewport.zoom) * (window.devicePixelRatio || 1);
  }, [viewport.zoom]);

  /**
   * Get highlight color from theme.
   * Requirements: 9.4
   */
  const highlightColor = useMemo(() => {
    const colorStr = theme.highlightColors[0];
    return rgbaToArray(colorStr);
  }, [theme.highlightColors]);

  /**
   * Filter markers for display based on clustering.
   */
  const displayMarkers = useMemo(() => {
    if (!showCluster) {
      return processedMarkers;
    }

    const z = Math.floor(viewport.zoom);
    // Only show markers that are cluster centers (have non-null zoomLevels[z])
    return processedMarkers.filter((m) => {
      if (m.subtype === 'c') return true; // Always show cities
      const zoomLevels = m.zoomLevels;
      if (!zoomLevels) return false;
      return zoomLevels[z] !== null && zoomLevels[z] !== undefined;
    });
  }, [processedMarkers, showCluster, viewport.zoom]);

  /**
   * Filter city markers for labels and dots.
   * Requirements: 10.1, 10.5
   */
  const cityMarkers = useMemo(() => {
    return processedMarkers.filter(isCityMarker);
  }, [processedMarkers]);

  /**
   * Filter non-capital city markers for dots.
   * Requirements: 10.5
   */
  const nonCapitalCityMarkers = useMemo(() => {
    return processedMarkers.filter(isNonCapitalCity);
  }, [processedMarkers]);

  /**
   * Create the IconLayer for markers.
   * Requirements: 5.2, 5.3, 5.5, 9.1, 9.2, 9.3, 9.4, 9.5, 9.9
   */
  const layers = useMemo(() => {
    const z = Math.floor(viewport.zoom);
    const layersList: LayersList = [];

    /**
     * Area Color GeoJsonLayer
     * Requirements: 5.2, 5.3, 5.5
     *
     * Renders province polygons colored by the active dimension.
     * - Supports ruler, religion, religionGeneral, culture, and population
     * - Uses categorical fill-color stops from metadata
     * - Population uses opacity interpolation between 0.3 and 0.8
     */
    if (provincesGeoJSON && layerVisibility[activeColor]) {
      const areaColorLayer = new GeoJsonLayer({
        id: `area-color-${activeColor}`,
        data: provincesGeoJSON,
        pickable: true,
        stroked: true,
        filled: true,
        extruded: false,
        lineWidthMinPixels: 1,
        // Requirements: 5.2 - Color provinces by active dimension
        getFillColor: (feature) => {
          const props = feature.properties as Record<string, unknown> | null;
          const provinceId = props?.['id'] as string | undefined;
          if (!provinceId) return DEFAULT_AREA_FILL_COLOR;
          return getProvinceColor(provinceId, areaData, activeColor, metadata);
        },
        // Requirements: 5.5 - Population opacity interpolation
        getLineColor: [80, 80, 80, 255] as [number, number, number, number],
        getLineWidth: 1,
        // Apply opacity for population dimension
        opacity: activeColor === 'population' ? 0.7 : 0.8,
        updateTriggers: {
          getFillColor: [activeColor, areaData],
          opacity: [activeColor],
        },
      });
      layersList.push(areaColorLayer);
    }

    const iconLayer = new IconLayer({
      id: 'markers',
      data: displayMarkers,
      pickable: true,
      autoHighlight: true,
      highlightColor: showCluster ? [0, 50, 0, 1] : highlightColor,
      iconAtlas: iconAtlasUrl,
      iconMapping: currentIconMapping,
      sizeScale,
      // Requirements: 9.2 - Position markers at their geographic coordinates
      getPosition: (d: MarkerData) => d.coo,
      // Get icon based on subtype or cluster icon
      getIcon: (d: MarkerData) => {
        const zoomLevels = d.zoomLevels;
        if (showCluster && zoomLevels) {
          const zoomData = zoomLevels[z];
          if (zoomData) {
            return zoomData.icon || d.subtype;
          }
        }
        return d.subtype;
      },
      // Get size based on marker type or cluster size
      getSize: (d: MarkerData) => {
        const zoomLevels = d.zoomLevels;
        if (showCluster && zoomLevels) {
          const zoomData = zoomLevels[z];
          if (zoomData) {
            return (zoomData.size || 1) * 20;
          }
        }
        // Highlight active markers
        if (d.isActive) {
          return (iconSize[d.subtype] ?? 4) + 10;
        }
        return iconSize[d.subtype] ?? 4;
      },
      // Get color for capital markers based on ruler metadata
      getColor: (d: MarkerData): [number, number, number, number] => {
        if (d.subtype === 'cp' && d.capital) {
          // Find the ruler for the current year
          const capitalEntry = d.capital.find(
            (entry) => entry[0] <= selectedYear && entry[1] >= selectedYear
          );
          if (capitalEntry) {
            const rulerId = capitalEntry[2];
            const rulerMeta = metadata.ruler[rulerId];
            if (rulerMeta) {
              const colorValue = rulerMeta[1];
              if (typeof colorValue === 'string') {
                return rgbaToArray(colorValue);
              }
            }
          }
        }
        return [0, 0, 0, 255];
      },
      onHover: handleHover,
      onClick: handleClick,
      updateTriggers: {
        getIcon: [z, showCluster],
        getSize: [z, showCluster, selectedItem.wiki],
        getColor: [selectedYear, activeColor],
      },
    });

    /**
     * City Labels TextLayer
     * Requirements: 10.1, 10.2, 10.3, 10.4
     *
     * Renders city names at their geographic coordinates with weight-based sizing.
     * - Capitals (cp): weight 4, largest font
     * - Cities with capital history: weight 2, medium font
     * - Regular cities (c): weight 1, smallest font
     */
    const cityLabelsLayer = new TextLayer({
      id: 'city-labels',
      data: cityMarkers,
      pickable: true,
      // Requirements: 10.2 - Position labels at geographic coordinates
      getPosition: (d: MarkerData) => d.coo,
      getText: (d: MarkerData) => d.name,
      // Requirements: 10.3, 10.4 - Weight-based font sizing
      getSize: (d: MarkerData) => {
        const weight = getCityLabelWeight(d, selectedYear);
        return getCityLabelFontSize(weight);
      },
      getColor: [0, 0, 0, 255],
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'top',
      getPixelOffset: [0, 10], // Offset below the marker
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      outlineWidth: 2,
      outlineColor: [255, 255, 255, 200],
      // Scale text with zoom for better visibility
      sizeScale: Math.max(0.5, getMarkerSizeScale(viewport.zoom)),
      sizeMinPixels: CITY_LABEL_MIN_FONT_SIZE,
      sizeMaxPixels: CITY_LABEL_MAX_FONT_SIZE,
      updateTriggers: {
        getSize: [selectedYear],
      },
    });

    /**
     * City Dots ScatterplotLayer
     * Requirements: 10.5, 10.6, 10.7
     *
     * Renders dots for non-capital cities with hover highlighting and click handling.
     */
    const cityDotsLayer = new ScatterplotLayer({
      id: 'city-dots',
      data: nonCapitalCityMarkers,
      pickable: true,
      autoHighlight: true,
      // Requirements: 10.6 - Highlight on hover
      highlightColor: highlightColor,
      // Requirements: 10.5 - Position dots at geographic coordinates
      getPosition: (d: MarkerData) => d.coo,
      getRadius: (d: MarkerData) => d.isActive ? CITY_DOT_HIGHLIGHT_RADIUS : CITY_DOT_RADIUS,
      getFillColor: [100, 100, 100, 200],
      getLineColor: [50, 50, 50, 255],
      stroked: true,
      lineWidthMinPixels: 1,
      radiusMinPixels: 2,
      radiusMaxPixels: 10,
      // Requirements: 10.6, 10.7 - Hover and click handling
      onHover: handleHover,
      onClick: handleClick,
      updateTriggers: {
        getRadius: [selectedItem.wiki],
      },
    });

    /**
     * Arc Layer for Route Connections
     * Requirements: 11.1, 11.2, 11.3, 11.4
     *
     * Renders curved lines between source and target coordinates for route connections.
     * - Source and target positions from arc data
     * - Source and target colors for gradient effect
     * - Configurable stroke width (default: 15)
     */
    const arcLayer = new ArcLayer<ArcData>({
      id: 'arcs',
      data: arcData ?? [],
      pickable: true,
      // Requirements: 11.2 - Position arcs between source and target coordinates
      getSourcePosition: (d: ArcData) => d.source,
      getTargetPosition: (d: ArcData) => d.target,
      // Requirements: 11.3 - Color arcs using source and target colors
      getSourceColor: (d: ArcData) => d.sourceColor,
      getTargetColor: (d: ArcData) => d.targetColor,
      // Requirements: 11.4 - Configure stroke width
      getWidth: ARC_STROKE_WIDTH,
      // Requirements: 11.5 - Update on viewport changes
      updateTriggers: {
        getSourcePosition: [arcData],
        getTargetPosition: [arcData],
        getSourceColor: [arcData],
        getTargetColor: [arcData],
      },
    });

    // Add all layers to the list
    layersList.push(iconLayer, cityLabelsLayer, cityDotsLayer, arcLayer);

    return layersList;
  }, [
    displayMarkers,
    cityMarkers,
    nonCapitalCityMarkers,
    viewport.zoom,
    showCluster,
    highlightColor,
    iconAtlasUrl,
    currentIconMapping,
    sizeScale,
    metadata,
    selectedYear,
    selectedItem.wiki,
    activeColor,
    layerVisibility,
    provincesGeoJSON,
    areaData,
    handleHover,
    handleClick,
    arcData,
  ]);

  return <DeckGLOverlayControl layers={layers} />;
}

export default DeckGLOverlay;
