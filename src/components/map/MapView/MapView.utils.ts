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
  type MapExpression,
  POPULATION_OPACITY_MIN,
  POPULATION_OPACITY_MAX,
  MARKER_COLORS,
} from './MapView.constants';


/**
 * Casts a dynamically-assembled GL expression to MapLibre's strict spec type.
 *
 * `ExpressionSpecification` is a large discriminated union of fixed-arity
 * tuples. TypeScript can verify a literal expression against it, but not one
 * built by `push`/spread in a loop — the element types are known, the arity
 * isn't. The alternative (hand-writing every colour ramp as a literal) isn't
 * possible when the entries come from API metadata at runtime.
 *
 * Callers are responsible for emitting a valid expression; MapLibre validates
 * it at style-set time and reports a clear error if not.
 */
function asExpression(expression: unknown[]): MapExpression {
  return expression as unknown as MapExpression;
}

/**
 * Normalizes a Mapbox GL feature's `properties` into a plain-prototype object.
 *
 * Mapbox GL v3 returns `feature.properties` as a null-prototype object
 * (created via `Object.create(null)`). Such objects have no `hasOwnProperty`
 * method, so when they flow into the `area-hover` <Source> data, react-map-gl's
 * `deepEqual` (which calls `b.hasOwnProperty(key)` while diffing source props)
 * throws `hasOwnProperty is not a function` and crashes the map into the error
 * boundary. Spreading into a fresh object literal restores `Object.prototype`.
 *
 * @param properties - Raw feature properties (may be null-prototype or null)
 * @returns A plain object with `Object.prototype` in its chain
 */
export function normalizeFeatureProperties(
  properties: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  return { ...(properties ?? {}) };
}

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
): MapExpression | string {
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

  return asExpression(matchExpr);
}

/**
 * Builds a Mapbox GL interpolate expression for population opacity.
 * Requirement 3.5: Population opacity interpolation [0.3, 0.8]
 *
 * @param maxPopulation - Maximum population value for scaling
 * @returns Mapbox GL interpolate expression
 */
export function buildPopulationOpacityExpression(maxPopulation: number): MapExpression {
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
export function buildMarkerColorExpression(): MapExpression {
  return asExpression([
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
  ]);
}

/**
 * Matches a `name`-family field reference inside a serialized text-field
 * expression: `name`, `name:zh-Hans`, `name_en`, `{name}`. The surrounding
 * non-letter guards keep it from matching unrelated fields that merely contain
 * the substring (e.g. `surname`, `placename_alt`).
 */
const NAME_FIELD_PATTERN = /(?:^|[^a-z])name(?:[^a-z]|$)/i;

/**
 * Reports whether a symbol layer's `text-field` renders a place *name*.
 *
 * We localize basemap labels by rewriting `text-field`, so we must only touch
 * layers that were showing a name to begin with. Filtering on the layer *id*
 * (the old `id.includes('label')` test, inherited from Mapbox Streets where
 * every label layer ended in `-label`) misses OpenMapTiles' road, POI and
 * airport labels — their ids are `highway-name-major`, `poi_r20`, `airport`.
 *
 * Filtering on mere `text-field` presence over-reaches in the other direction:
 * the three road-shield layers (`highway-shield-non-us`,
 * `highway-shield-us-interstate`, `road_shield_us`) render
 * `["to-string", ["get", "ref"]]` — route *numbers*. Rewriting those with a
 * name expression puts road names inside shield icons.
 *
 * Testing the expression itself is provider-agnostic and shield-safe.
 */
export function textFieldReferencesName(textField: unknown): boolean {
  if (textField === null || textField === undefined) return false;
  const serialized = typeof textField === 'string' ? textField : JSON.stringify(textField);
  return NAME_FIELD_PATTERN.test(serialized);
}

/**
 * Maps an app locale to the OpenMapTiles `name:xx` keys to try, most specific
 * first.
 *
 * OpenMapTiles uses colon syntax (`name:de`), not Mapbox Streets' underscore
 * syntax (`name_de`). Chinese needs special handling: the schema carries both
 * `name:zh-Hans` and `name:zh-Hant`, and plain `name:zh` is populated
 * inconsistently, so we try script-specific keys before the bare one.
 */
export function getLocalizedNameKeys(locale: string): string[] {
  const parts = locale.split('-');
  const language = (parts[0] ?? '').toLowerCase();
  const region = parts[1]?.toLowerCase();

  if (language === 'zh') {
    // Traditional-script regions first for zh-TW/zh-HK/zh-MO, else Simplified.
    const traditional = region === 'tw' || region === 'hk' || region === 'mo';
    return traditional
      ? ['name:zh-Hant', 'name:zh-Hans', 'name:zh']
      : ['name:zh-Hans', 'name:zh-Hant', 'name:zh'];
  }

  return [`name:${language}`];
}

/**
 * Builds the `text-field` expression that renders a label in `locale`.
 *
 * The chain terminates in `['get', 'name']` *exactly*, so a feature missing
 * every localized key degrades to its default name rather than rendering
 * blank. `name:latin` sits in between as a transliteration fallback for
 * non-Latin-script regions.
 */
export function buildLocalizedNameExpression(locale: string): MapExpression {
  const keys = [...getLocalizedNameKeys(locale), 'name:latin', 'name'];
  return asExpression(['coalesce', ...keys.map((key) => ['get', key])]);
}

/**
 * Rewrites a glyph (PBF font range) request to a self-hosted font when the
 * requested fontstack includes one of ours.
 *
 * A glyph URL looks like `.../fonts/{fontstack}/{range}.pbf`, where
 * `{fontstack}` is the URL-encoded, **comma-joined** `text-font` array. The
 * previous implementation substring-matched the whole URL, which meant a stack
 * like `Cinzel Regular,Noto Sans Regular` was silently collapsed to just
 * `Cinzel Regular` with no record of the dropped font. Parsing the stack makes
 * that explicit and lets callers detect the lossy case.
 *
 * Returns `null` when the request should pass through untouched.
 *
 * @param url - The glyph request URL
 * @param localFontNames - Fonts self-hosted under `public/fonts/`
 */
export function resolveLocalGlyphUrl(
  url: string,
  localFontNames: ReadonlySet<string>
): { url: string; droppedFonts: string[] } | null {
  const match = /\/([^/]+)\/(\d+-\d+)\.pbf(?:$|[?#])/.exec(url);
  if (!match) return null;

  const [, encodedStack, range] = match;
  if (!encodedStack || !range) return null;

  let stack: string;
  try {
    stack = decodeURIComponent(encodedStack);
  } catch {
    // Malformed percent-encoding — leave the request alone.
    return null;
  }

  const fonts = stack.split(',').map((font) => font.trim());
  const local = fonts.find((font) => localFontNames.has(font));
  if (local === undefined) return null;

  return {
    url: `/fonts/${local}/${range}.pbf`,
    droppedFonts: fonts.filter((font) => font !== local),
  };
}
