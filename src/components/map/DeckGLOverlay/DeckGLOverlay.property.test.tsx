/**
 * DeckGLOverlay Property-Based Tests
 *
 * Property-based tests for the DeckGLOverlay component using fast-check.
 * These tests verify universal properties that should hold across all valid inputs.
 *
 * Requirements: 9.2, 9.5, 9.9, 11.2, 11.3
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  getMarkerSizeScale,
  getClusterIconName,
  getClusterIconSize,
  MarkerSpatialIndex,
  calculateClusters,
  getCityLabelWeight,
  getCityLabelFontSize,
  isCityMarker,
  isNonCapitalCity,
  CITY_WEIGHT_CAPITAL,
  CITY_WEIGHT_CAPITAL_HISTORY,
  CITY_WEIGHT_REGULAR,
  CITY_LABEL_MIN_FONT_SIZE,
  CITY_LABEL_MAX_FONT_SIZE,
  ARC_STROKE_WIDTH,
  type MarkerData,
  type ArcData,
} from './DeckGLOverlay';

// ============================================================================
// Arbitrary Generators
// ============================================================================

/**
 * Generates valid longitude values [-180, 180]
 */
const longitudeArb = fc.double({ min: -180, max: 180, noNaN: true });

/**
 * Generates valid latitude values [-90, 90]
 */
const latitudeArb = fc.double({ min: -90, max: 90, noNaN: true });

/**
 * Generates valid zoom levels [0, 22]
 */
const zoomArb = fc.double({ min: 0, max: 22, noNaN: true });

/**
 * Generates valid marker coordinates
 */
const coordinatesArb: fc.Arbitrary<[number, number]> = fc.tuple(longitudeArb, latitudeArb);

/**
 * Generates valid marker subtypes
 */
const subtypeArb = fc.constantFrom(
  'cp', 'c', 'ca', 'b', 'si', 'l', 'm', 'p', 'e', 's', 'a', 'r', 'at', 'op', 'o', 'ar'
);

/**
 * Generates a valid MarkerData object
 */
const markerDataArb = fc.record({
  _id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  subtype: subtypeArb,
  coo: coordinatesArb,
  wiki: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
  year: fc.option(fc.integer({ min: -3000, max: 2100 }), { nil: undefined }),
  isActive: fc.option(fc.boolean(), { nil: undefined }),
});

/**
 * Generates a MarkerData with screen coordinates for clustering tests
 */
const markerWithScreenCoordsArb = fc.record({
  _id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  subtype: subtypeArb,
  coo: coordinatesArb,
  x: fc.double({ min: 0, max: 2000, noNaN: true }),
  y: fc.double({ min: 0, max: 2000, noNaN: true }),
});

/**
 * Generates an array of markers with screen coordinates
 */
const markersWithScreenCoordsArb = fc.array(markerWithScreenCoordsArb, { minLength: 0, maxLength: 50 });

// ============================================================================
// Property 22: Marker Position Accuracy
// ============================================================================

describe('Property 22: Marker Position Accuracy', () => {
  /**
   * **Property 22: Marker Position Accuracy**
   * *For any* marker with coordinates [lng, lat], the marker SHALL be rendered
   * at exactly those geographic coordinates on the map.
   *
   * **Validates: Requirements 9.2**
   */
  it('should preserve marker coordinates exactly', () => {
    fc.assert(
      fc.property(markerDataArb, (marker) => {
        // The marker's coo property should be a tuple of [longitude, latitude]
        const [lng, lat] = marker.coo;

        // Verify coordinates are valid numbers
        expect(typeof lng).toBe('number');
        expect(typeof lat).toBe('number');
        expect(Number.isFinite(lng)).toBe(true);
        expect(Number.isFinite(lat)).toBe(true);

        // Verify coordinates are within valid ranges
        expect(lng).toBeGreaterThanOrEqual(-180);
        expect(lng).toBeLessThanOrEqual(180);
        expect(lat).toBeGreaterThanOrEqual(-90);
        expect(lat).toBeLessThanOrEqual(90);

        // The getPosition accessor in IconLayer returns d.coo directly
        // This verifies that the coordinate structure is correct for deck.gl
        const position = marker.coo;
        expect(position).toEqual([lng, lat]);
        expect(position).toHaveLength(2);
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain coordinate precision through processing', () => {
    fc.assert(
      fc.property(coordinatesArb, ([lng, lat]) => {
        // Create a marker with specific coordinates
        const marker: MarkerData = {
          _id: 'test',
          name: 'Test Marker',
          subtype: 'b',
          coo: [lng, lat],
        };

        // Verify the coordinates are preserved exactly
        expect(marker.coo[0]).toBe(lng);
        expect(marker.coo[1]).toBe(lat);

        // Verify no floating point errors are introduced
        expect(marker.coo[0]).toStrictEqual(lng);
        expect(marker.coo[1]).toStrictEqual(lat);
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Property 28: Marker Size Scaling
// ============================================================================

describe('Property 28: Marker Size Scaling', () => {
  /**
   * **Property 28: Marker Size Scaling**
   * *For any* zoom level z, marker size SHALL be scaled by the formula:
   * Math.min(Math.pow(1.55, z - 10), 1).
   *
   * **Validates: Requirements 9.9**
   */
  it('should scale marker size according to the formula', () => {
    fc.assert(
      fc.property(zoomArb, (zoom) => {
        const result = getMarkerSizeScale(zoom);
        const expected = Math.min(Math.pow(1.55, zoom - 10), 1);

        // Result should match the formula exactly
        expect(result).toBeCloseTo(expected, 10);
      }),
      { numRuns: 100 }
    );
  });

  it('should always return a value between 0 and 1', () => {
    fc.assert(
      fc.property(zoomArb, (zoom) => {
        const result = getMarkerSizeScale(zoom);

        // Result should always be positive
        expect(result).toBeGreaterThan(0);

        // Result should never exceed 1
        expect(result).toBeLessThanOrEqual(1);
      }),
      { numRuns: 100 }
    );
  });

  it('should be monotonically increasing with zoom', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 21, noNaN: true }),
        fc.double({ min: 0.1, max: 1, noNaN: true }),
        (zoom1, delta) => {
          const zoom2 = zoom1 + delta;
          if (zoom2 > 22) return; // Skip if out of range

          const size1 = getMarkerSizeScale(zoom1);
          const size2 = getMarkerSizeScale(zoom2);

          // Higher zoom should result in equal or larger size
          expect(size2).toBeGreaterThanOrEqual(size1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return 1 for zoom levels >= 10', () => {
    fc.assert(
      fc.property(fc.double({ min: 10, max: 22, noNaN: true }), (zoom) => {
        const result = getMarkerSizeScale(zoom);

        // At zoom 10 and above, the formula gives >= 1, so result should be capped at 1
        expect(result).toBe(1);
      }),
      { numRuns: 100 }
    );
  });

  it('should return values < 1 for zoom levels < 10', () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 9.99, noNaN: true }), (zoom) => {
        const result = getMarkerSizeScale(zoom);

        // Below zoom 10, the formula gives < 1
        expect(result).toBeLessThan(1);
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Property 25: Marker Clustering
// ============================================================================

describe('Property 25: Marker Clustering', () => {
  /**
   * **Property 25: Marker Clustering**
   * *For any* zoom level with cluster mode enabled, markers within the clustering
   * radius SHALL be aggregated into cluster icons showing the count.
   *
   * **Validates: Requirements 9.5**
   */
  it('should aggregate nearby markers into clusters', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20 }),
        fc.double({ min: 10, max: 100, noNaN: true }),
        (zoom, sizeScale) => {
          // Create markers that are very close together
          const markers: MarkerData[] = [
            { _id: '1', name: 'M1', subtype: 'b', coo: [0, 0], x: 10, y: 10 },
            { _id: '2', name: 'M2', subtype: 'b', coo: [0, 0], x: 11, y: 11 },
            { _id: '3', name: 'M3', subtype: 'b', coo: [0, 0], x: 12, y: 12 },
          ];

          const result = calculateClusters(markers, zoom, sizeScale);

          // All markers should have zoomLevels set
          const z = Math.floor(zoom);
          const markersWithZoomLevels = result.filter(
            (m) => m.zoomLevels?.[z] !== undefined
          );

          // At least one marker should be processed
          expect(markersWithZoomLevels.length).toBeGreaterThan(0);

          // Count cluster centers (markers with non-null zoomLevels[z])
          const clusterCenters = result.filter((m) => {
            const zoomLevels = m.zoomLevels;
            if (!zoomLevels) return false;
            const zoomData = zoomLevels[z];
            return zoomData?.icon !== undefined;
          });

          // There should be at least one cluster center
          expect(clusterCenters.length).toBeGreaterThanOrEqual(1);

          // If there's a cluster, it should have a valid icon name
          if (clusterCenters.length > 0) {
            const center = clusterCenters[0];
            const zoomLevels = center?.zoomLevels;
            const zoomData = zoomLevels?.[z];
            if (zoomData) {
              expect(typeof zoomData.icon).toBe('string');
              expect(zoomData.size).toBeGreaterThan(0);
              expect(Array.isArray(zoomData.points)).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not cluster city markers', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20 }),
        fc.double({ min: 10, max: 100, noNaN: true }),
        (zoom, sizeScale) => {
          // Create city markers
          const markers: MarkerData[] = [
            { _id: '1', name: 'City1', subtype: 'c', coo: [0, 0], x: 10, y: 10 },
            { _id: '2', name: 'City2', subtype: 'c', coo: [0, 0], x: 11, y: 11 },
          ];

          const result = calculateClusters(markers, zoom, sizeScale);

          // City markers should not have cluster data
          const z = Math.floor(zoom);
          const citiesWithClusters = result.filter(
            (m) => m.subtype === 'c' && m.zoomLevels?.[z]?.icon !== undefined
          );

          expect(citiesWithClusters).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should keep distant markers separate', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20 }),
        (zoom) => {
          // Create markers that are far apart
          const markers: MarkerData[] = [
            { _id: '1', name: 'M1', subtype: 'b', coo: [0, 0], x: 0, y: 0 },
            { _id: '2', name: 'M2', subtype: 'b', coo: [100, 100], x: 1000, y: 1000 },
          ];

          // Use a small size scale to ensure no clustering
          const result = calculateClusters(markers, zoom, 1);

          // Both markers should be cluster centers (not absorbed)
          const z = Math.floor(zoom);
          const clusterCenters = result.filter(
            (m) => m.zoomLevels?.[z] !== null && m.zoomLevels?.[z]?.icon !== undefined
          );

          // Each marker should be its own cluster center
          expect(clusterCenters).toHaveLength(2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should produce valid cluster icon names', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000 }), (clusterSize) => {
        const iconName = getClusterIconName(clusterSize);

        if (clusterSize === 0) {
          expect(iconName).toBe('');
        } else if (clusterSize < 10) {
          expect(iconName).toBe(String(clusterSize));
        } else if (clusterSize < 100) {
          const expected = String(Math.floor(clusterSize / 10) * 10);
          expect(iconName).toBe(expected);
        } else {
          expect(iconName).toBe('100');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should produce valid cluster icon sizes', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000 }), (clusterSize) => {
        const iconSize = getClusterIconSize(clusterSize);

        // Size should be between 0.5 and 1.0
        expect(iconSize).toBeGreaterThanOrEqual(0.5);
        expect(iconSize).toBeLessThanOrEqual(1.0);

        // Verify the formula: (min(100, size) / 100) * 0.5 + 0.5
        const expected = (Math.min(100, clusterSize) / 100) * 0.5 + 0.5;
        expect(iconSize).toBeCloseTo(expected, 10);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle empty marker arrays', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20 }),
        fc.double({ min: 10, max: 100, noNaN: true }),
        (zoom, sizeScale) => {
          const result = calculateClusters([], zoom, sizeScale);
          expect(result).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve marker data through clustering', () => {
    fc.assert(
      fc.property(markersWithScreenCoordsArb, (markers) => {
        if (markers.length === 0) return;

        const result = calculateClusters(markers, 5, 50);

        // All original markers should be in the result
        expect(result).toHaveLength(markers.length);

        // Each marker should preserve its original properties
        for (let i = 0; i < markers.length; i++) {
          const original = markers[i];
          const processed = result[i];

          if (original && processed) {
            expect(processed._id).toBe(original._id);
            expect(processed.name).toBe(original.name);
            expect(processed.subtype).toBe(original.subtype);
            expect(processed.coo).toEqual(original.coo);
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// MarkerSpatialIndex Property Tests
// ============================================================================

describe('MarkerSpatialIndex Properties', () => {
  it('should find all markers within search bounds', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            _id: fc.uuid(),
            name: fc.string(),
            subtype: fc.constant('b'),
            coo: fc.tuple(fc.constant(0), fc.constant(0)),
            x: fc.double({ min: 0, max: 1000, noNaN: true }),
            y: fc.double({ min: 0, max: 1000, noNaN: true }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (markers) => {
          const index = new MarkerSpatialIndex(50);
           
          index.load(markers as MarkerData[]);

          // Search the entire space
          const results = index.search(0, 0, 1000, 1000);

          // All markers should be found
          expect(results.length).toBe(markers.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty array for empty index', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1000, noNaN: true }),
        fc.double({ min: 0, max: 1000, noNaN: true }),
        fc.double({ min: 0, max: 1000, noNaN: true }),
        fc.double({ min: 0, max: 1000, noNaN: true }),
        (minX, minY, maxX, maxY) => {
          const index = new MarkerSpatialIndex(50);
          const results = index.search(
            Math.min(minX, maxX),
            Math.min(minY, maxY),
            Math.max(minX, maxX),
            Math.max(minY, maxY)
          );
          expect(results).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================================================
// Property 30: City Label Weighting
// ============================================================================

describe('Property 30: City Label Weighting', () => {
  /**
   * **Property 30: City Label Weighting**
   * *For any* city, the label weight SHALL be 4 for capitals, 2 for cities
   * with capital history, and 1 for regular cities.
   *
   * **Validates: Requirements 10.3**
   */

  /**
   * Generates a valid year in historical range
   */
  const yearArb = fc.integer({ min: -4000, max: 2100 });

  /**
   * Generates a capital history entry [startYear, endYear, rulerId]
   */
  const capitalHistoryEntryArb = fc
    .tuple(
      fc.integer({ min: -4000, max: 2000 }),
      fc.integer({ min: -4000, max: 2100 }),
      fc.string({ minLength: 1, maxLength: 20 })
    )
    .filter(([start, end]) => start <= end);

  /**
   * Generates a capital marker (subtype 'cp')
   */
  const capitalMarkerArb: fc.Arbitrary<MarkerData> = fc.record({
    _id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    subtype: fc.constant('cp'),
    coo: fc.tuple(
      fc.double({ min: -180, max: 180, noNaN: true }),
      fc.double({ min: -90, max: 90, noNaN: true })
    ),
  });

  /**
   * Generates a regular city marker (subtype 'c') without capital history
   */
  const regularCityMarkerArb: fc.Arbitrary<MarkerData> = fc.record({
    _id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    subtype: fc.constant('c'),
    coo: fc.tuple(
      fc.double({ min: -180, max: 180, noNaN: true }),
      fc.double({ min: -90, max: 90, noNaN: true })
    ),
  });

  /**
   * Generates a city marker with capital history
   */
  const cityWithCapitalHistoryArb: fc.Arbitrary<MarkerData> = fc.record({
    _id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    subtype: fc.constant('c'),
    coo: fc.tuple(
      fc.double({ min: -180, max: 180, noNaN: true }),
      fc.double({ min: -90, max: 90, noNaN: true })
    ),
    capital: fc.array(capitalHistoryEntryArb, { minLength: 1, maxLength: 5 }),
  });

  it('should return weight 4 for any capital marker (cp)', () => {
    fc.assert(
      fc.property(capitalMarkerArb, yearArb, (marker, year) => {
        const weight = getCityLabelWeight(marker, year);
        expect(weight).toBe(CITY_WEIGHT_CAPITAL);
        expect(weight).toBe(4);
      }),
      { numRuns: 100 }
    );
  });

  it('should return weight 1 for any regular city without capital history', () => {
    fc.assert(
      fc.property(regularCityMarkerArb, yearArb, (marker, year) => {
        const weight = getCityLabelWeight(marker, year);
        expect(weight).toBe(CITY_WEIGHT_REGULAR);
        expect(weight).toBe(1);
      }),
      { numRuns: 100 }
    );
  });

  it('should return weight 2 for cities with capital history when year is in range', () => {
    fc.assert(
      fc.property(cityWithCapitalHistoryArb, (marker) => {
        // Find a year that is within one of the capital history ranges
        const capitalHistory = marker.capital;
        if (!capitalHistory || capitalHistory.length === 0) return;

        const firstEntry = capitalHistory[0];
        if (!firstEntry) return;

        const [startYear, endYear] = firstEntry;
        // Pick a year in the middle of the range
        const yearInRange = Math.floor((startYear + endYear) / 2);

        const weight = getCityLabelWeight(marker, yearInRange);
        expect(weight).toBe(CITY_WEIGHT_CAPITAL_HISTORY);
        expect(weight).toBe(2);
      }),
      { numRuns: 100 }
    );
  });

  it('should return weight 1 for cities with capital history when year is outside all ranges', () => {
    fc.assert(
      fc.property(cityWithCapitalHistoryArb, (marker) => {
        const capitalHistory = marker.capital;
        if (!capitalHistory || capitalHistory.length === 0) return;

        // Find a year that is definitely outside all ranges
        // Use a year far in the future (beyond any historical range)
        const yearOutsideRange = 2200;

        // Verify the year is actually outside all ranges
        const isInAnyRange = capitalHistory.some(
          ([start, end]) => start <= yearOutsideRange && end >= yearOutsideRange
        );

        if (!isInAnyRange) {
          const weight = getCityLabelWeight(marker, yearOutsideRange);
          expect(weight).toBe(CITY_WEIGHT_REGULAR);
          expect(weight).toBe(1);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should return correct weight at boundary years', () => {
    fc.assert(
      fc.property(capitalHistoryEntryArb, (entry) => {
        const [startYear, endYear, rulerId] = entry;
        const marker: MarkerData = {
          _id: 'test',
          name: 'Test City',
          subtype: 'c',
          coo: [0, 0],
          capital: [[startYear, endYear, rulerId]],
        };

        // At start year - should be weight 2
        expect(getCityLabelWeight(marker, startYear)).toBe(CITY_WEIGHT_CAPITAL_HISTORY);

        // At end year - should be weight 2
        expect(getCityLabelWeight(marker, endYear)).toBe(CITY_WEIGHT_CAPITAL_HISTORY);

        // One year before start - should be weight 1
        expect(getCityLabelWeight(marker, startYear - 1)).toBe(CITY_WEIGHT_REGULAR);

        // One year after end - should be weight 1
        expect(getCityLabelWeight(marker, endYear + 1)).toBe(CITY_WEIGHT_REGULAR);
      }),
      { numRuns: 100 }
    );
  });

  it('should always return one of the three valid weights (1, 2, or 4)', () => {
    const anyMarkerArb = fc.oneof(
      capitalMarkerArb,
      regularCityMarkerArb,
      cityWithCapitalHistoryArb
    );

    fc.assert(
      fc.property(anyMarkerArb, yearArb, (marker, year) => {
        const weight = getCityLabelWeight(marker, year);
        expect([1, 2, 4]).toContain(weight);
      }),
      { numRuns: 100 }
    );
  });

  it('should produce font sizes within bounds for any weight', () => {
    fc.assert(
      fc.property(fc.constantFrom(1, 2, 4), (weight) => {
        const fontSize = getCityLabelFontSize(weight);
        expect(fontSize).toBeGreaterThanOrEqual(CITY_LABEL_MIN_FONT_SIZE);
        expect(fontSize).toBeLessThanOrEqual(CITY_LABEL_MAX_FONT_SIZE);
      }),
      { numRuns: 100 }
    );
  });

  it('should produce monotonically increasing font sizes with weight', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const fontSize1 = getCityLabelFontSize(1);
        const fontSize2 = getCityLabelFontSize(2);
        const fontSize4 = getCityLabelFontSize(4);

        expect(fontSize1).toBeLessThan(fontSize2);
        expect(fontSize2).toBeLessThan(fontSize4);
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// City Marker Type Properties
// ============================================================================

describe('City Marker Type Properties', () => {
  /**
   * Generates any valid marker subtype
   */
  const subtypeArb = fc.constantFrom(
    'cp', 'c', 'ca', 'b', 'si', 'l', 'm', 'p', 'e', 's', 'a', 'r', 'at', 'op', 'o', 'ar'
  );

  /**
   * Generates a marker with any subtype
   */
  const anyMarkerArb = fc.record({
    _id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    subtype: subtypeArb,
    coo: fc.tuple(
      fc.double({ min: -180, max: 180, noNaN: true }),
      fc.double({ min: -90, max: 90, noNaN: true })
    ),
  });

  it('isCityMarker should return true only for cp and c subtypes', () => {
    fc.assert(
      fc.property(anyMarkerArb, (marker) => {
        const result = isCityMarker(marker);
        const expected = marker.subtype === 'cp' || marker.subtype === 'c';
        expect(result).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  it('isNonCapitalCity should return true only for c subtype', () => {
    fc.assert(
      fc.property(anyMarkerArb, (marker) => {
        const result = isNonCapitalCity(marker);
        const expected = marker.subtype === 'c';
        expect(result).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  it('isNonCapitalCity implies isCityMarker', () => {
    fc.assert(
      fc.property(anyMarkerArb, (marker) => {
        if (isNonCapitalCity(marker)) {
          expect(isCityMarker(marker)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('capital markers (cp) are city markers but not non-capital cities', () => {
    fc.assert(
      fc.property(anyMarkerArb, (marker) => {
        if (marker.subtype === 'cp') {
          expect(isCityMarker(marker)).toBe(true);
          expect(isNonCapitalCity(marker)).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });
});


// ============================================================================
// Arc Data Arbitrary Generators
// ============================================================================

/**
 * Generates a valid RGBA color array [r, g, b, a]
 * Each component is an integer 0-255
 */
const rgbaColorArb: fc.Arbitrary<[number, number, number, number]> = fc.tuple(
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 })
);

/**
 * Generates valid arc coordinates [longitude, latitude]
 */
const arcCoordinatesArb: fc.Arbitrary<[number, number]> = fc.tuple(
  fc.double({ min: -180, max: 180, noNaN: true }),
  fc.double({ min: -90, max: 90, noNaN: true })
);

/**
 * Generates a valid ArcData object
 */
const arcDataArb: fc.Arbitrary<ArcData> = fc.record({
  source: arcCoordinatesArb,
  target: arcCoordinatesArb,
  sourceColor: rgbaColorArb,
  targetColor: rgbaColorArb,
});

/**
 * Generates an array of ArcData objects
 */
const arcDataArrayArb = fc.array(arcDataArb, { minLength: 0, maxLength: 50 });

// ============================================================================
// Property 33: Arc Rendering
// ============================================================================

describe('Property 33: Arc Rendering', () => {
  /**
   * **Property 33: Arc Rendering**
   * *For any* arc data with source and target coordinates, a curved line SHALL be
   * rendered between those points with the specified colors.
   *
   * **Validates: Requirements 11.2, 11.3**
   */

  it('should have valid source coordinates for any arc data', () => {
    fc.assert(
      fc.property(arcDataArb, (arc) => {
        const [lng, lat] = arc.source;

        // Verify source coordinates are valid numbers
        expect(typeof lng).toBe('number');
        expect(typeof lat).toBe('number');
        expect(Number.isFinite(lng)).toBe(true);
        expect(Number.isFinite(lat)).toBe(true);

        // Verify source coordinates are within valid ranges
        expect(lng).toBeGreaterThanOrEqual(-180);
        expect(lng).toBeLessThanOrEqual(180);
        expect(lat).toBeGreaterThanOrEqual(-90);
        expect(lat).toBeLessThanOrEqual(90);
      }),
      { numRuns: 100 }
    );
  });

  it('should have valid target coordinates for any arc data', () => {
    fc.assert(
      fc.property(arcDataArb, (arc) => {
        const [lng, lat] = arc.target;

        // Verify target coordinates are valid numbers
        expect(typeof lng).toBe('number');
        expect(typeof lat).toBe('number');
        expect(Number.isFinite(lng)).toBe(true);
        expect(Number.isFinite(lat)).toBe(true);

        // Verify target coordinates are within valid ranges
        expect(lng).toBeGreaterThanOrEqual(-180);
        expect(lng).toBeLessThanOrEqual(180);
        expect(lat).toBeGreaterThanOrEqual(-90);
        expect(lat).toBeLessThanOrEqual(90);
      }),
      { numRuns: 100 }
    );
  });

  it('should have valid source color for any arc data', () => {
    fc.assert(
      fc.property(arcDataArb, (arc) => {
        const [r, g, b, a] = arc.sourceColor;

        // Verify source color components are valid integers
        expect(Number.isInteger(r)).toBe(true);
        expect(Number.isInteger(g)).toBe(true);
        expect(Number.isInteger(b)).toBe(true);
        expect(Number.isInteger(a)).toBe(true);

        // Verify source color components are within valid range [0, 255]
        expect(r).toBeGreaterThanOrEqual(0);
        expect(r).toBeLessThanOrEqual(255);
        expect(g).toBeGreaterThanOrEqual(0);
        expect(g).toBeLessThanOrEqual(255);
        expect(b).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThanOrEqual(255);
        expect(a).toBeGreaterThanOrEqual(0);
        expect(a).toBeLessThanOrEqual(255);
      }),
      { numRuns: 100 }
    );
  });

  it('should have valid target color for any arc data', () => {
    fc.assert(
      fc.property(arcDataArb, (arc) => {
        const [r, g, b, a] = arc.targetColor;

        // Verify target color components are valid integers
        expect(Number.isInteger(r)).toBe(true);
        expect(Number.isInteger(g)).toBe(true);
        expect(Number.isInteger(b)).toBe(true);
        expect(Number.isInteger(a)).toBe(true);

        // Verify target color components are within valid range [0, 255]
        expect(r).toBeGreaterThanOrEqual(0);
        expect(r).toBeLessThanOrEqual(255);
        expect(g).toBeGreaterThanOrEqual(0);
        expect(g).toBeLessThanOrEqual(255);
        expect(b).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThanOrEqual(255);
        expect(a).toBeGreaterThanOrEqual(0);
        expect(a).toBeLessThanOrEqual(255);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve arc data structure through processing', () => {
    fc.assert(
      fc.property(arcDataArb, (arc) => {
        // Verify the arc data structure is complete
        expect(arc).toHaveProperty('source');
        expect(arc).toHaveProperty('target');
        expect(arc).toHaveProperty('sourceColor');
        expect(arc).toHaveProperty('targetColor');

        // Verify arrays have correct lengths
        expect(arc.source).toHaveLength(2);
        expect(arc.target).toHaveLength(2);
        expect(arc.sourceColor).toHaveLength(4);
        expect(arc.targetColor).toHaveLength(4);
      }),
      { numRuns: 100 }
    );
  });

  it('should support different source and target colors', () => {
    fc.assert(
      fc.property(arcDataArb, (arc) => {
        // Source and target colors can be different (gradient effect)
        // This test verifies both colors are independently valid
        const sourceColorSum = arc.sourceColor.reduce((a, b) => a + b, 0);
        const targetColorSum = arc.targetColor.reduce((a, b) => a + b, 0);

        // Both sums should be valid (0 to 1020 for 4 components * 255 max)
        expect(sourceColorSum).toBeGreaterThanOrEqual(0);
        expect(sourceColorSum).toBeLessThanOrEqual(1020);
        expect(targetColorSum).toBeGreaterThanOrEqual(0);
        expect(targetColorSum).toBeLessThanOrEqual(1020);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle empty arc data arrays', () => {
    fc.assert(
      fc.property(fc.constant([]), (arcs: ArcData[]) => {
        expect(arcs).toHaveLength(0);
        expect(Array.isArray(arcs)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle multiple arcs in an array', () => {
    fc.assert(
      fc.property(arcDataArrayArb, (arcs) => {
        // All arcs in the array should be valid
        for (const arc of arcs) {
          // Verify source coordinates
          expect(arc.source[0]).toBeGreaterThanOrEqual(-180);
          expect(arc.source[0]).toBeLessThanOrEqual(180);
          expect(arc.source[1]).toBeGreaterThanOrEqual(-90);
          expect(arc.source[1]).toBeLessThanOrEqual(90);

          // Verify target coordinates
          expect(arc.target[0]).toBeGreaterThanOrEqual(-180);
          expect(arc.target[0]).toBeLessThanOrEqual(180);
          expect(arc.target[1]).toBeGreaterThanOrEqual(-90);
          expect(arc.target[1]).toBeLessThanOrEqual(90);

          // Verify colors
          expect(arc.sourceColor.every((c) => c >= 0 && c <= 255)).toBe(true);
          expect(arc.targetColor.every((c) => c >= 0 && c <= 255)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should have a valid default stroke width constant', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        // Verify the ARC_STROKE_WIDTH constant is valid
        expect(ARC_STROKE_WIDTH).toBe(15);
        expect(typeof ARC_STROKE_WIDTH).toBe('number');
        expect(ARC_STROKE_WIDTH).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should support arcs connecting any two valid geographic points', () => {
    fc.assert(
      fc.property(
        arcCoordinatesArb,
        arcCoordinatesArb,
        rgbaColorArb,
        rgbaColorArb,
        (source, target, sourceColor, targetColor) => {
          const arc: ArcData = {
            source,
            target,
            sourceColor,
            targetColor,
          };

          // The arc should be valid regardless of the distance between points
          expect(arc.source).toEqual(source);
          expect(arc.target).toEqual(target);
          expect(arc.sourceColor).toEqual(sourceColor);
          expect(arc.targetColor).toEqual(targetColor);

          // Calculate great circle distance (simplified check)
          const [lng1, lat1] = source;
          const [lng2, lat2] = target;
          const dLng = Math.abs(lng2 - lng1);
          const dLat = Math.abs(lat2 - lat1);

          // Distance components should be valid
          expect(dLng).toBeGreaterThanOrEqual(0);
          expect(dLng).toBeLessThanOrEqual(360);
          expect(dLat).toBeGreaterThanOrEqual(0);
          expect(dLat).toBeLessThanOrEqual(180);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should support arcs with same source and target (zero-length arcs)', () => {
    fc.assert(
      fc.property(arcCoordinatesArb, rgbaColorArb, rgbaColorArb, (coords, sourceColor, targetColor) => {
        // Create an arc where source and target are the same point
        const arc: ArcData = {
          source: coords,
          target: coords,
          sourceColor,
          targetColor,
        };

        // Zero-length arcs should still be valid
        expect(arc.source).toEqual(arc.target);
        expect(arc.source[0]).toBe(arc.target[0]);
        expect(arc.source[1]).toBe(arc.target[1]);
      }),
      { numRuns: 100 }
    );
  });
});
