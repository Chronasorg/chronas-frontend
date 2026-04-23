/**
 * DeckGLOverlay Utility Functions
 *
 * Utility functions and classes used by the DeckGLOverlay component.
 *
 * Requirements: 5.2, 5.3, 5.5, 9.5, 9.9, 10.3, 10.4, 10.5
 */

import type { AreaColorDimension, AreaData } from '../../../stores/mapStore';
import type { MarkerData, ZoomLevelData, MetadataEntry, Metadata } from './DeckGLOverlay.types';
import {
  CITY_WEIGHT_CAPITAL,
  CITY_WEIGHT_CAPITAL_HISTORY,
  CITY_WEIGHT_REGULAR,
  CITY_LABEL_MIN_FONT_SIZE,
  CITY_LABEL_MAX_FONT_SIZE,
  DEFAULT_AREA_FILL_COLOR,
  POPULATION_FILL_COLOR,
  POPULATION_OPACITY_MIN,
  POPULATION_OPACITY_MAX,
  MAX_POPULATION_FOR_OPACITY,
  DIMENSION_INDEX,
} from './DeckGLOverlay.constants';

// ============================================================================
// Marker Utility Functions
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
  const metadataSections: Record<
    Exclude<AreaColorDimension, 'population'>,
    Record<string, MetadataEntry>
  > = {
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
  return (
    POPULATION_OPACITY_MIN + normalizedPopulation * (POPULATION_OPACITY_MAX - POPULATION_OPACITY_MIN)
  );
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
        Array.isArray(entry) && entry[0] <= selectedYear && entry[1] >= selectedYear
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
  const normalizedWeight =
    (weight - CITY_WEIGHT_REGULAR) / (CITY_WEIGHT_CAPITAL - CITY_WEIGHT_REGULAR);

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
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
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
