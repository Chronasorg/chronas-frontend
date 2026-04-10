/**
 * MapView Utility Functions
 *
 * Non-component exports extracted from MapView.tsx to satisfy
 * react-refresh/only-export-components lint rule.
 *
 * Requirements: 3.5, 4.3, 5.2, 5.3, 11.2, 13.2
 */

import { useEffect, useState } from 'react';
import type { FeatureCollection, Point, Polygon, MultiPolygon } from 'geojson';
import { FALLBACK_COLOR } from '../../../stores/mapStore';
import type { Marker } from '../../../api/types';
import {
  type MapboxExpression,
  POPULATION_OPACITY_MIN,
  POPULATION_OPACITY_MAX,
  MARKER_COLORS,
} from './MapView.constants';

/**
 * Custom hook for debouncing a value.
 * Requirement 11.2: Add debounce to year change handler (300ms)
 *
 * @param value - The value to debounce
 * @param delay - The debounce delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up the timeout to update the debounced value
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value changes before delay completes
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Builds a Mapbox GL match expression for categorical coloring.
 * Requirement 4.3: Data-driven styling with categorical stops
 *
 * @param property - The property name to match against
 * @param colorMap - Map of entity ID to color string
 * @param fallback - Fallback color when no match
 * @returns Mapbox GL match expression
 */
export function buildColorMatchExpression(
  property: string,
  colorMap: Record<string, string>,
  fallback: string = FALLBACK_COLOR
): MapboxExpression | string {
  const entries = Object.entries(colorMap);

  if (entries.length === 0) {
    return fallback;
  }

  // Build match expression: ['match', ['get', property], id1, color1, id2, color2, ..., fallback]
  const matchExpr: [string, ...unknown[]] = ['match', ['get', property]];

  for (const [id, color] of entries) {
    matchExpr.push(id, color);
  }

  matchExpr.push(fallback);

  return matchExpr;
}

/**
 * Builds a Mapbox GL interpolate expression for population opacity.
 * Requirement 3.5: Population opacity interpolation [0.3, 0.8]
 *
 * @param maxPopulation - Maximum population value for scaling
 * @returns Mapbox GL interpolate expression
 */
export function buildPopulationOpacityExpression(maxPopulation: number): MapboxExpression {
  // Ensure maxPopulation is at least 1 to avoid division issues
  const safeMax = Math.max(1, maxPopulation);

  return [
    'interpolate',
    ['linear'],
    ['get', 'p'],
    0,
    POPULATION_OPACITY_MIN,
    safeMax,
    POPULATION_OPACITY_MAX,
  ];
}

/**
 * Calculates the maximum population from provinces GeoJSON.
 * Requirement 3.5: Calculate max population from area data
 *
 * @param geojson - Provinces GeoJSON feature collection
 * @returns Maximum population value
 */
export function calculateMaxPopulation(
  geojson: FeatureCollection<Polygon | MultiPolygon> | null
): number {
  if (!geojson?.features) {
    return 1;
  }

  let maxPop = 0;
  for (const feature of geojson.features) {
    const population = feature.properties?.['p'] as number | undefined;
    if (typeof population === 'number' && population > maxPop) {
      maxPop = population;
    }
  }

  return Math.max(1, maxPop);
}

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
 * Converts markers array to GeoJSON FeatureCollection.
 * Requirement 5.2: THE MapView SHALL display markers as icons on the map using a GeoJSON point source
 *
 * @param markers - Array of markers to convert
 * @returns GeoJSON FeatureCollection of Point features
 */
export function markersToGeoJSON(markers: Marker[]): FeatureCollection<Point> {
  let skippedCount = 0;
  const result: FeatureCollection<Point> = {
    type: 'FeatureCollection',
    features: markers
      // Filter out markers with invalid coordinates
      .filter((marker) => {
        // coo is typed as [number, number], but runtime data may be invalid
        // Use type assertion to allow runtime validation
        const coo = marker.coo as unknown;
        if (!coo || !Array.isArray(coo) || coo.length < 2) {
          skippedCount++;
          return false;
        }
        const [lng, lat] = coo as [unknown, unknown];
        if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) {
          skippedCount++;
          return false;
        }
        return true;
      })
      .map((marker) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: marker.coo,
        },
        properties: {
          id: marker._id,
          name: marker.name,
          type: marker.type,
          year: marker.year,
          wiki: marker.wiki ?? null,
          description: marker.data?.description ?? null,
        },
      })),
  };
  if (skippedCount > 0) {
    console.log(`[MapView] Skipped ${String(skippedCount)} markers with invalid coordinates`);
  }
  return result;
}

/**
 * Builds a Mapbox GL match expression for marker icon colors.
 * Requirement 5.3: THE MapView SHALL support marker types with distinct styling
 *
 * Maps API short codes (p, b, s, etc.) to colors based on category:
 * - person (p, s, r, h): purple
 * - battle (b, m): red
 * - city (c): blue
 * - capital (ca): gold
 * - event (e): green
 * - other (a, ar, ai, o, si, l): gray
 *
 * @returns Mapbox GL match expression for marker colors
 */
export function buildMarkerColorExpression(): MapboxExpression {
  return [
    'match',
    ['get', 'type'],
    // Person category (purple)
    'p',
    MARKER_COLORS['person'],
    's',
    MARKER_COLORS['person'], // scholar
    'r',
    MARKER_COLORS['person'], // religious figure
    'h',
    MARKER_COLORS['person'], // historical figure
    'person',
    MARKER_COLORS['person'],
    // Battle category (red)
    'b',
    MARKER_COLORS['battle'],
    'm',
    MARKER_COLORS['battle'], // military
    'battle',
    MARKER_COLORS['battle'],
    // City category (blue)
    'c',
    MARKER_COLORS['city'],
    'city',
    MARKER_COLORS['city'],
    // Capital category (gold)
    'ca',
    MARKER_COLORS['capital'],
    'capital',
    MARKER_COLORS['capital'],
    // Event category (green)
    'e',
    MARKER_COLORS['event'],
    'event',
    MARKER_COLORS['event'],
    // Other category (gray) - artists, artwork, architecture, organizations, sites, landmarks
    'a',
    MARKER_COLORS['other'],
    'ar',
    MARKER_COLORS['other'],
    'ai',
    MARKER_COLORS['other'],
    'o',
    MARKER_COLORS['other'],
    'si',
    MARKER_COLORS['other'],
    'l',
    MARKER_COLORS['other'],
    'other',
    MARKER_COLORS['other'],
    MARKER_COLORS['other'], // default fallback
  ];
}
