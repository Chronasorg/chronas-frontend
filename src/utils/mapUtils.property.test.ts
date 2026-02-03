/**
 * Map Utilities Property Tests
 *
 * Property-based tests for URL parameter helpers using fast-check.
 *
 * Requirements: 2.4, 2.5
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  formatPositionToURL,
  parsePositionFromURL,
  viewportsApproximatelyEqual,
  safeAreaDataAccess,
  isValidProvinceData,
  PROVINCE_DATA_INDEX,
} from './mapUtils';
import type { AreaData, ProvinceData, ViewportState } from '../stores/mapStore';

/**
 * Arbitrary for generating valid latitude values [-90, 90]
 */
const latitudeArb = fc.double({ min: -90, max: 90, noNaN: true });

/**
 * Arbitrary for generating valid longitude values [-180, 180]
 */
const longitudeArb = fc.double({ min: -180, max: 180, noNaN: true });

/**
 * Arbitrary for generating valid zoom values [0, 22]
 */
const zoomArb = fc.double({ min: 0, max: 22, noNaN: true });

/**
 * Arbitrary for generating valid viewport states
 */
const viewportArb = fc.record({
  latitude: latitudeArb,
  longitude: longitudeArb,
  zoom: zoomArb,
});

describe('mapUtils - Property Tests', () => {
  describe('Property 2: Viewport URL Round-Trip', () => {
    /**
     * **Property 2: Viewport URL Round-Trip**
     * **Validates: Requirements 2.4, 2.5**
     *
     * For any valid viewport state, formatting it to a URL position string
     * and then parsing that string back SHALL produce an equivalent viewport
     * (within floating-point tolerance).
     */
    it('should preserve viewport through format and parse round-trip', () => {
      fc.assert(
        fc.property(viewportArb, (viewport) => {
          // Format viewport to URL string
          const urlString = formatPositionToURL(viewport);

          // Parse URL string back to viewport
          const parsed = parsePositionFromURL(urlString);

          // Verify round-trip preserves values within tolerance
          // Latitude: 6 decimal places = ~0.1m accuracy
          expect(parsed.latitude).toBeDefined();
          expect(parsed.latitude).toBeCloseTo(viewport.latitude, 5);

          // Longitude: 6 decimal places = ~0.1m accuracy
          expect(parsed.longitude).toBeDefined();
          expect(parsed.longitude).toBeCloseTo(viewport.longitude, 5);

          // Zoom: 2 decimal places
          expect(parsed.zoom).toBeDefined();
          expect(parsed.zoom).toBeCloseTo(viewport.zoom, 1);
        }),
        { numRuns: 100 }
      );
    });

    it('should produce URL strings that are parseable', () => {
      fc.assert(
        fc.property(viewportArb, (viewport) => {
          const urlString = formatPositionToURL(viewport);

          // URL string should be non-empty
          expect(urlString.length).toBeGreaterThan(0);

          // URL string should contain exactly 2 commas (3 parts)
          const commaCount = (urlString.match(/,/g) ?? []).length;
          expect(commaCount).toBe(2);

          // Parsed result should have all three fields
          const parsed = parsePositionFromURL(urlString);
          expect(parsed.latitude).toBeDefined();
          expect(parsed.longitude).toBeDefined();
          expect(parsed.zoom).toBeDefined();
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain coordinate validity through round-trip', () => {
      fc.assert(
        fc.property(viewportArb, (viewport) => {
          const urlString = formatPositionToURL(viewport);
          const parsed = parsePositionFromURL(urlString);

          // Latitude should remain in valid range
          expect(parsed.latitude).toBeGreaterThanOrEqual(-90);
          expect(parsed.latitude).toBeLessThanOrEqual(90);

          // Longitude should remain in valid range
          expect(parsed.longitude).toBeGreaterThanOrEqual(-180);
          expect(parsed.longitude).toBeLessThanOrEqual(180);

          // Zoom should remain in valid range
          expect(parsed.zoom).toBeGreaterThanOrEqual(0);
          expect(parsed.zoom).toBeLessThanOrEqual(22);
        }),
        { numRuns: 100 }
      );
    });

    it('should be approximately equal after round-trip using viewportsApproximatelyEqual', () => {
      fc.assert(
        fc.property(viewportArb, (viewport) => {
          const urlString = formatPositionToURL(viewport);
          const parsed = parsePositionFromURL(urlString);

          // Use the utility function to verify approximate equality
          const areEqual = viewportsApproximatelyEqual(viewport, parsed, 0.00001);
          expect(areEqual).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('formatPositionToURL properties', () => {
    it('should always produce a string with 3 comma-separated parts', () => {
      fc.assert(
        fc.property(viewportArb, (viewport) => {
          const result = formatPositionToURL(viewport);
          const parts = result.split(',');
          expect(parts.length).toBe(3);
        }),
        { numRuns: 100 }
      );
    });

    it('should produce parseable numeric values in each part', () => {
      fc.assert(
        fc.property(viewportArb, (viewport) => {
          const result = formatPositionToURL(viewport);
          const parts = result.split(',');

          parts.forEach((part) => {
            const num = parseFloat(part);
            expect(Number.isFinite(num)).toBe(true);
          });
        }),
        { numRuns: 100 }
      );
    });

    it('should handle partial viewport with defaults', () => {
      fc.assert(
        fc.property(
          fc.record({
            latitude: fc.option(latitudeArb, { nil: undefined }),
            longitude: fc.option(longitudeArb, { nil: undefined }),
            zoom: fc.option(zoomArb, { nil: undefined }),
          }),
          (partialViewport) => {
            // Build viewport object, only including defined values
            const viewport: Partial<ViewportState> = {};
            if (partialViewport.latitude !== undefined) {
              viewport.latitude = partialViewport.latitude;
            }
            if (partialViewport.longitude !== undefined) {
              viewport.longitude = partialViewport.longitude;
            }
            if (partialViewport.zoom !== undefined) {
              viewport.zoom = partialViewport.zoom;
            }
            const result = formatPositionToURL(viewport);

            // Should always produce valid output
            expect(result.length).toBeGreaterThan(0);

            const parts = result.split(',');
            expect(parts.length).toBe(3);

            // All parts should be valid numbers
            parts.forEach((part) => {
              const num = parseFloat(part);
              expect(Number.isFinite(num)).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('parsePositionFromURL properties', () => {
    it('should return empty object for invalid inputs', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(null as string | null | undefined),
            fc.constant(undefined as string | null | undefined),
            fc.constant('' as string | null | undefined),
            fc.string({ unit: fc.constantFrom(' ', '\t', '\n') }), // whitespace only
            fc.string().filter((s) => s.split(',').length < 3) // insufficient parts
          ),
          (input: string | null | undefined) => {
            const result = parsePositionFromURL(input);

            // Should return empty or partial object (no exceptions)
            expect(result).toBeDefined();
            expect(typeof result).toBe('object');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject out-of-range latitude values', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 91, max: 1000, noNaN: true }),
          longitudeArb,
          zoomArb,
          (lat, lng, zoom) => {
            const urlString = `${String(lat)},${String(lng)},${String(zoom)}`;
            const result = parsePositionFromURL(urlString);

            // Latitude should be undefined (rejected)
            expect(result.latitude).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject out-of-range longitude values', () => {
      fc.assert(
        fc.property(
          latitudeArb,
          fc.double({ min: 181, max: 1000, noNaN: true }),
          zoomArb,
          (lat, lng, zoom) => {
            const urlString = `${String(lat)},${String(lng)},${String(zoom)}`;
            const result = parsePositionFromURL(urlString);

            // Longitude should be undefined (rejected)
            expect(result.longitude).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject out-of-range zoom values', () => {
      fc.assert(
        fc.property(
          latitudeArb,
          longitudeArb,
          fc.double({ min: 23, max: 100, noNaN: true }),
          (lat, lng, zoom) => {
            const urlString = `${String(lat)},${String(lng)},${String(zoom)}`;
            const result = parsePositionFromURL(urlString);

            // Zoom should be undefined (rejected)
            expect(result.zoom).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('viewportsApproximatelyEqual properties', () => {
    it('should be reflexive (a equals a)', () => {
      fc.assert(
        fc.property(viewportArb, (viewport) => {
          expect(viewportsApproximatelyEqual(viewport, viewport)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should be symmetric (a equals b implies b equals a)', () => {
      fc.assert(
        fc.property(viewportArb, viewportArb, (a, b) => {
          const aEqualsB = viewportsApproximatelyEqual(a, b);
          const bEqualsA = viewportsApproximatelyEqual(b, a);
          expect(aEqualsB).toBe(bEqualsA);
        }),
        { numRuns: 100 }
      );
    });

    it('should detect differences larger than tolerance', () => {
      fc.assert(
        fc.property(
          viewportArb,
          fc.double({ min: 0.001, max: 10, noNaN: true }),
          (viewport, delta) => {
            const modified = {
              ...viewport,
              latitude: viewport.latitude + delta,
            };

            // With default tolerance (0.000001), a delta of 0.001+ should be detected
            expect(viewportsApproximatelyEqual(viewport, modified)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


/**
 * Arbitrary for generating valid province IDs
 */
const provinceIdArb = fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0);

/**
 * Arbitrary for generating valid province data
 */
const provinceDataArb: fc.Arbitrary<ProvinceData> = fc.tuple(
  fc.string({ minLength: 1, maxLength: 20 }), // ruler
  fc.string({ minLength: 1, maxLength: 20 }), // culture
  fc.string({ minLength: 1, maxLength: 20 }), // religion
  fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }), // capital (nullable)
  fc.integer({ min: 0, max: 10000000 }) // population
);

/**
 * Arbitrary for generating valid area data
 */
const areaDataArb: fc.Arbitrary<AreaData> = fc
  .array(fc.tuple(provinceIdArb, provinceDataArb), { minLength: 1, maxLength: 10 })
  .map((entries) => Object.fromEntries(entries));

/**
 * Arbitrary for generating invalid/malformed data structures
 */
const invalidDataArb = fc.oneof(
  fc.constant(null),
  fc.constant(undefined),
  fc.string(),
  fc.integer(),
  fc.array(fc.string()),
  fc.record({ notAnArray: fc.string() })
);

describe('Property 37: Safe Province Data Access', () => {
  /**
   * **Property 37: Safe Province Data Access**
   * **Validates: Requirements 13.5, 13.6**
   *
   * For any province data access, the accessor function SHALL validate
   * the data structure and return null for missing or malformed data
   * without throwing an exception.
   */

  describe('safeAreaDataAccess never throws', () => {
    it('should never throw for any combination of inputs', () => {
      fc.assert(
        fc.property(
          fc.oneof(areaDataArb, fc.constant(null), fc.constant(undefined)),
          fc.oneof(provinceIdArb, fc.constant(''), fc.constant(null as unknown as string)),
          fc.integer({ min: -10, max: 10 }),
          (areaData, provinceId, index) => {
            // This should never throw
            expect(() => {
              safeAreaDataAccess(areaData, provinceId, index, false);
            }).not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null or valid value for any input', () => {
      fc.assert(
        fc.property(
          fc.oneof(areaDataArb, fc.constant(null), fc.constant(undefined)),
          fc.oneof(provinceIdArb, fc.constant('')),
          fc.integer({ min: 0, max: 4 }),
          (areaData, provinceId, index) => {
            const result = safeAreaDataAccess(areaData, provinceId, index, false);

            // Result should be null, string, or number
            expect(
              result === null || typeof result === 'string' || typeof result === 'number'
            ).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('safeAreaDataAccess returns correct values for valid data', () => {
    it('should return correct value for valid province and index', () => {
      fc.assert(
        fc.property(areaDataArb, (areaData) => {
          const provinceIds = Object.keys(areaData);
          if (provinceIds.length === 0) return true;

          const provinceId = provinceIds[0];
          if (provinceId === undefined) return true;
          
          const provinceData = areaData[provinceId];
          if (!provinceData) return true;

          // Test each valid index
          for (let i = 0; i < 5; i++) {
            const result = safeAreaDataAccess(areaData, provinceId, i, false);
            const expected = provinceData[i];

            if (expected === null || expected === undefined) {
              expect(result).toBeNull();
            } else {
              expect(result).toBe(expected);
            }
          }

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('safeAreaDataAccess returns null for missing data', () => {
    it('should return null for null areaData', () => {
      fc.assert(
        fc.property(provinceIdArb, fc.integer({ min: 0, max: 4 }), (provinceId, index) => {
          const result = safeAreaDataAccess(null, provinceId, index, false);
          expect(result).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should return null for undefined areaData', () => {
      fc.assert(
        fc.property(provinceIdArb, fc.integer({ min: 0, max: 4 }), (provinceId, index) => {
          const result = safeAreaDataAccess(undefined, provinceId, index, false);
          expect(result).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should return null for non-existent province', () => {
      fc.assert(
        fc.property(areaDataArb, fc.integer({ min: 0, max: 4 }), (areaData, index) => {
          const nonExistentId = 'definitely_not_a_real_province_id_12345';
          const result = safeAreaDataAccess(areaData, nonExistentId, index, false);
          expect(result).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should return null for out-of-bounds index', () => {
      fc.assert(
        fc.property(areaDataArb, fc.integer({ min: 5, max: 100 }), (areaData, index) => {
          const provinceIds = Object.keys(areaData);
          if (provinceIds.length === 0) return true;

          const provinceId = provinceIds[0];
          if (provinceId === undefined) return true;
          
          const result = safeAreaDataAccess(areaData, provinceId, index, false);
          expect(result).toBeNull();

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should return null for negative index', () => {
      fc.assert(
        fc.property(areaDataArb, fc.integer({ min: -100, max: -1 }), (areaData, index) => {
          const provinceIds = Object.keys(areaData);
          if (provinceIds.length === 0) return true;

          const provinceId = provinceIds[0];
          if (provinceId === undefined) return true;
          
          const result = safeAreaDataAccess(areaData, provinceId, index, false);
          expect(result).toBeNull();

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('isValidProvinceData validation', () => {
    it('should return true for all generated valid province data', () => {
      fc.assert(
        fc.property(provinceDataArb, (data) => {
          expect(isValidProvinceData(data)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should return false for invalid data structures', () => {
      fc.assert(
        fc.property(invalidDataArb, (data) => {
          expect(isValidProvinceData(data)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should return false for arrays with wrong length', () => {
      fc.assert(
        fc.property(
          fc.array(fc.oneof(fc.string(), fc.integer(), fc.constant(null)), {
            minLength: 0,
            maxLength: 4,
          }),
          (data) => {
            expect(isValidProvinceData(data)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('PROVINCE_DATA_INDEX consistency', () => {
    it('should access correct data using index constants', () => {
      fc.assert(
        fc.property(areaDataArb, (areaData) => {
          const provinceIds = Object.keys(areaData);
          if (provinceIds.length === 0) return true;

          const provinceId = provinceIds[0];
          if (provinceId === undefined) return true;
          
          const provinceData = areaData[provinceId];
          if (!provinceData) return true;

          // Verify index constants match expected positions
          expect(safeAreaDataAccess(areaData, provinceId, PROVINCE_DATA_INDEX.RULER, false)).toBe(
            provinceData[0]
          );
          expect(safeAreaDataAccess(areaData, provinceId, PROVINCE_DATA_INDEX.CULTURE, false)).toBe(
            provinceData[1]
          );
          expect(safeAreaDataAccess(areaData, provinceId, PROVINCE_DATA_INDEX.RELIGION, false)).toBe(
            provinceData[2]
          );

          const capitalResult = safeAreaDataAccess(
            areaData,
            provinceId,
            PROVINCE_DATA_INDEX.CAPITAL,
            false
          );
          if (provinceData[3] === null) {
            expect(capitalResult).toBeNull();
          } else {
            expect(capitalResult).toBe(provinceData[3]);
          }

          expect(
            safeAreaDataAccess(areaData, provinceId, PROVINCE_DATA_INDEX.POPULATION, false)
          ).toBe(provinceData[4]);

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });
});
