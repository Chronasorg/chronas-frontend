/**
 * Map Store Property-Based Tests
 *
 * Property-based tests for viewport state management.
 * Uses fast-check library to generate random viewport updates
 * and verify universal properties.
 *
 * Feature: map-integration, Property 1: Viewport State Completeness
 * **Validates: Requirements 2.1**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import * as fc from 'fast-check';
import type { FeatureCollection, Polygon, MultiPolygon } from 'geojson';
import {
  useMapStore,
  initialState,
  isValidViewport,
  type AreaData,
  type ProvinceData,
  type AreaColorDimension,
} from './mapStore';

describe('mapStore Property Tests', () => {
  // Reset store state before each test
  beforeEach(() => {
    act(() => {
      useMapStore.setState(initialState);
    });
  });

  /**
   * Feature: map-integration, Property 1: Viewport State Completeness
   *
   * Property 1 states:
   * *For any* viewport state in the MapStore, the state SHALL contain all required fields
   * (longitude, latitude, zoom, pitch, bearing, width, height) with valid numeric values.
   *
   * **Validates: Requirements 2.1**
   */
  describe('Property 1: Viewport State Completeness', () => {
    /**
     * Arbitrary for generating valid latitude values.
     * Latitude must be in range [-90, 90].
     */
    const latitudeArb = fc.double({
      min: -180, // Generate values outside range to test clamping
      max: 180,
      noNaN: false, // Allow NaN to test handling
    });

    /**
     * Arbitrary for generating valid longitude values.
     * Longitude must be in range [-180, 180] (normalized).
     */
    const longitudeArb = fc.double({
      min: -540, // Generate values outside range to test normalization
      max: 540,
      noNaN: false,
    });

    /**
     * Arbitrary for generating zoom values.
     * Zoom must be in range [minZoom, 22].
     */
    const zoomArb = fc.double({
      min: -10,
      max: 30,
      noNaN: false,
    });

    /**
     * Arbitrary for generating bearing values.
     * Bearing is normalized to [0, 360).
     */
    const bearingArb = fc.double({
      min: -720,
      max: 720,
      noNaN: false,
    });

    /**
     * Arbitrary for generating pitch values.
     * Pitch must be in range [0, 85].
     */
    const pitchArb = fc.double({
      min: -30,
      max: 120,
      noNaN: false,
    });

    /**
     * Arbitrary for generating dimension values (width/height).
     * Dimensions must be non-negative.
     */
    const dimensionArb = fc.double({
      min: -100,
      max: 5000,
      noNaN: false,
    });

    /**
     * Arbitrary for generating partial viewport updates.
     */
    const viewportUpdateArb = fc.record({
      latitude: fc.option(latitudeArb, { nil: undefined }),
      longitude: fc.option(longitudeArb, { nil: undefined }),
      zoom: fc.option(zoomArb, { nil: undefined }),
      bearing: fc.option(bearingArb, { nil: undefined }),
      pitch: fc.option(pitchArb, { nil: undefined }),
      width: fc.option(dimensionArb, { nil: undefined }),
      height: fc.option(dimensionArb, { nil: undefined }),
    });

    /**
     * Helper to filter out undefined values from an object.
     * Returns an object with only defined values, properly typed for setViewport.
     */
    function filterUndefined(obj: Record<string, number | undefined>): Record<string, number> {
      const result: Record<string, number> = {};
      for (const key of Object.keys(obj)) {
        const value = obj[key];
        if (value !== undefined) {
          result[key] = value;
        }
      }
      return result;
    }

    it('should always have all required viewport fields after any update', () => {
      fc.assert(
        fc.property(viewportUpdateArb, (update) => {
          // Reset state
          act(() => {
            useMapStore.setState(initialState);
          });

          // Apply the update (filter out undefined values)
          act(() => {
            useMapStore.getState().setViewport(filterUndefined(update));
          });

          const state = useMapStore.getState();
          const viewport = state.viewport;

          // All required fields must be present
          expect(viewport).toHaveProperty('latitude');
          expect(viewport).toHaveProperty('longitude');
          expect(viewport).toHaveProperty('zoom');
          expect(viewport).toHaveProperty('minZoom');
          expect(viewport).toHaveProperty('bearing');
          expect(viewport).toHaveProperty('pitch');
          expect(viewport).toHaveProperty('width');
          expect(viewport).toHaveProperty('height');
        }),
        { numRuns: 100 }
      );
    });

    it('should always have valid finite numeric values for all viewport fields', () => {
      fc.assert(
        fc.property(viewportUpdateArb, (update) => {
          // Reset state
          act(() => {
            useMapStore.setState(initialState);
          });

          // Apply the update
          act(() => {
            useMapStore.getState().setViewport(filterUndefined(update));
          });

          const state = useMapStore.getState();
          const viewport = state.viewport;

          // All fields must be finite numbers
          expect(typeof viewport.latitude).toBe('number');
          expect(Number.isFinite(viewport.latitude)).toBe(true);

          expect(typeof viewport.longitude).toBe('number');
          expect(Number.isFinite(viewport.longitude)).toBe(true);

          expect(typeof viewport.zoom).toBe('number');
          expect(Number.isFinite(viewport.zoom)).toBe(true);

          expect(typeof viewport.minZoom).toBe('number');
          expect(Number.isFinite(viewport.minZoom)).toBe(true);

          expect(typeof viewport.bearing).toBe('number');
          expect(Number.isFinite(viewport.bearing)).toBe(true);

          expect(typeof viewport.pitch).toBe('number');
          expect(Number.isFinite(viewport.pitch)).toBe(true);

          expect(typeof viewport.width).toBe('number');
          expect(Number.isFinite(viewport.width)).toBe(true);

          expect(typeof viewport.height).toBe('number');
          expect(Number.isFinite(viewport.height)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should always have latitude within valid range [-90, 90]', () => {
      fc.assert(
        fc.property(latitudeArb, (latitude) => {
          // Reset state
          act(() => {
            useMapStore.setState(initialState);
          });

          // Apply the update
          act(() => {
            useMapStore.getState().setViewport({ latitude });
          });

          const state = useMapStore.getState();

          // Latitude must be within valid range
          expect(state.viewport.latitude).toBeGreaterThanOrEqual(-90);
          expect(state.viewport.latitude).toBeLessThanOrEqual(90);
        }),
        { numRuns: 100 }
      );
    });

    it('should always have longitude within valid range [-180, 180]', () => {
      fc.assert(
        fc.property(longitudeArb, (longitude) => {
          // Reset state
          act(() => {
            useMapStore.setState(initialState);
          });

          // Apply the update
          act(() => {
            useMapStore.getState().setViewport({ longitude });
          });

          const state = useMapStore.getState();

          // Longitude must be within valid range (normalized)
          expect(state.viewport.longitude).toBeGreaterThanOrEqual(-180);
          expect(state.viewport.longitude).toBeLessThanOrEqual(180);
        }),
        { numRuns: 100 }
      );
    });

    it('should always have zoom within valid range [minZoom, 22]', () => {
      fc.assert(
        fc.property(zoomArb, (zoom) => {
          // Reset state
          act(() => {
            useMapStore.setState(initialState);
          });

          // Apply the update
          act(() => {
            useMapStore.getState().setViewport({ zoom });
          });

          const state = useMapStore.getState();

          // Zoom must be within valid range
          expect(state.viewport.zoom).toBeGreaterThanOrEqual(state.viewport.minZoom);
          expect(state.viewport.zoom).toBeLessThanOrEqual(22);
        }),
        { numRuns: 100 }
      );
    });

    it('should always have bearing within valid range [0, 360)', () => {
      fc.assert(
        fc.property(bearingArb, (bearing) => {
          // Reset state
          act(() => {
            useMapStore.setState(initialState);
          });

          // Apply the update
          act(() => {
            useMapStore.getState().setViewport({ bearing });
          });

          const state = useMapStore.getState();

          // Bearing must be within valid range (normalized)
          expect(state.viewport.bearing).toBeGreaterThanOrEqual(0);
          expect(state.viewport.bearing).toBeLessThan(360);
        }),
        { numRuns: 100 }
      );
    });

    it('should always have pitch within valid range [0, 85]', () => {
      fc.assert(
        fc.property(pitchArb, (pitch) => {
          // Reset state
          act(() => {
            useMapStore.setState(initialState);
          });

          // Apply the update
          act(() => {
            useMapStore.getState().setViewport({ pitch });
          });

          const state = useMapStore.getState();

          // Pitch must be within valid range
          expect(state.viewport.pitch).toBeGreaterThanOrEqual(0);
          expect(state.viewport.pitch).toBeLessThanOrEqual(85);
        }),
        { numRuns: 100 }
      );
    });

    it('should always have non-negative width and height', () => {
      fc.assert(
        fc.property(dimensionArb, dimensionArb, (width, height) => {
          // Reset state
          act(() => {
            useMapStore.setState(initialState);
          });

          // Apply the update
          act(() => {
            useMapStore.getState().setViewport({ width, height });
          });

          const state = useMapStore.getState();

          // Dimensions must be non-negative
          expect(state.viewport.width).toBeGreaterThanOrEqual(0);
          expect(state.viewport.height).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should pass isValidViewport check after any update', () => {
      fc.assert(
        fc.property(viewportUpdateArb, (update) => {
          // Reset state
          act(() => {
            useMapStore.setState(initialState);
          });

          // Apply the update
          act(() => {
            useMapStore.getState().setViewport(filterUndefined(update));
          });

          const state = useMapStore.getState();

          // The viewport should always be valid
          expect(isValidViewport(state.viewport)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain viewport completeness after multiple sequential updates', () => {
      fc.assert(
        fc.property(
          fc.array(viewportUpdateArb, { minLength: 1, maxLength: 10 }),
          (updates) => {
            // Reset state
            act(() => {
              useMapStore.setState(initialState);
            });

            // Apply all updates sequentially
            for (const update of updates) {
              act(() => {
                useMapStore.getState().setViewport(filterUndefined(update));
              });

              // After each update, viewport should remain complete and valid
              const state = useMapStore.getState();
              const viewport = state.viewport;

              // All required fields must be present and valid
              expect(isValidViewport(viewport)).toBe(true);

              // All values must be within their valid ranges
              expect(viewport.latitude).toBeGreaterThanOrEqual(-90);
              expect(viewport.latitude).toBeLessThanOrEqual(90);
              expect(viewport.longitude).toBeGreaterThanOrEqual(-180);
              expect(viewport.longitude).toBeLessThanOrEqual(180);
              expect(viewport.zoom).toBeGreaterThanOrEqual(viewport.minZoom);
              expect(viewport.zoom).toBeLessThanOrEqual(22);
              expect(viewport.bearing).toBeGreaterThanOrEqual(0);
              expect(viewport.bearing).toBeLessThan(360);
              expect(viewport.pitch).toBeGreaterThanOrEqual(0);
              expect(viewport.pitch).toBeLessThanOrEqual(85);
              expect(viewport.width).toBeGreaterThanOrEqual(0);
              expect(viewport.height).toBeGreaterThanOrEqual(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle extreme values gracefully', () => {
      const extremeValuesArb = fc.record({
        latitude: fc.constantFrom(
          Number.MAX_VALUE,
          Number.MIN_VALUE,
          Number.MAX_SAFE_INTEGER,
          Number.MIN_SAFE_INTEGER,
          -Infinity,
          Infinity,
          NaN,
          0,
          -0
        ),
        longitude: fc.constantFrom(
          Number.MAX_VALUE,
          Number.MIN_VALUE,
          Number.MAX_SAFE_INTEGER,
          Number.MIN_SAFE_INTEGER,
          -Infinity,
          Infinity,
          NaN,
          0,
          -0
        ),
        zoom: fc.constantFrom(
          Number.MAX_VALUE,
          Number.MIN_VALUE,
          -Infinity,
          Infinity,
          NaN,
          0,
          -0
        ),
      });

      fc.assert(
        fc.property(extremeValuesArb, (update) => {
          // Reset state
          act(() => {
            useMapStore.setState(initialState);
          });

          // Apply the update - should not throw
          act(() => {
            useMapStore.getState().setViewport(filterUndefined(update));
          });

          const state = useMapStore.getState();

          // Viewport should still be valid after extreme values
          expect(isValidViewport(state.viewport)).toBe(true);

          // All values should be finite
          expect(Number.isFinite(state.viewport.latitude)).toBe(true);
          expect(Number.isFinite(state.viewport.longitude)).toBe(true);
          expect(Number.isFinite(state.viewport.zoom)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });
});


/**
 * Feature: map-integration, Property 35: Area Data Caching
 *
 * Property 35 states:
 * *For any* year that has been previously fetched, subsequent requests for that year
 * SHALL return cached data without making an API call.
 *
 * **Validates: Requirements 12.2**
 */
describe('Property 35: Area Data Caching', () => {
  /**
   * Arbitrary for generating valid year values.
   * Years can be negative (BC) or positive (AD).
   */
  const yearArb = fc.integer({ min: -5000, max: 2100 });

  /**
   * Arbitrary for generating province IDs.
   * Province IDs are typically strings like "province_123" or "prov_abc".
   */
  const provinceIdArb = fc.stringMatching(/^[a-z_][a-z0-9_]{2,20}$/);

  /**
   * Arbitrary for generating province data.
   * ProvinceData is a tuple: [ruler, culture, religion, capital, population]
   */
  const provinceDataArb: fc.Arbitrary<ProvinceData> = fc.tuple(
    fc.string({ minLength: 1, maxLength: 20 }), // ruler ID
    fc.string({ minLength: 1, maxLength: 20 }), // culture ID
    fc.string({ minLength: 1, maxLength: 20 }), // religion ID
    fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }), // capital ID (optional)
    fc.integer({ min: 0, max: 10000000 }) // population
  );

  /**
   * Arbitrary for generating area data (dictionary of province ID to province data).
   */
  const areaDataArb: fc.Arbitrary<AreaData> = fc
    .array(fc.tuple(provinceIdArb, provinceDataArb), { minLength: 1, maxLength: 10 })
    .map((entries) => Object.fromEntries(entries));

  it('should return cached data for any year that has been previously set', async () => {
    await fc.assert(
      fc.asyncProperty(yearArb, areaDataArb, async (year, areaData) => {
        // Reset state
        act(() => {
          useMapStore.setState(initialState);
        });

        // Set area data for the year (simulating a successful fetch)
        act(() => {
          useMapStore.getState().setAreaData(year, areaData);
        });

        // Verify data is in cache
        const stateAfterSet = useMapStore.getState();
        expect(stateAfterSet.areaDataCache.has(year)).toBe(true);
        expect(stateAfterSet.currentAreaData).toEqual(areaData);

        // Load area data for the same year - should return cached data
        let loadedData: AreaData | null = null;
        await act(async () => {
          loadedData = await useMapStore.getState().loadAreaData(year);
        });

        // Verify cached data is returned
        expect(loadedData).toEqual(areaData);

        // Verify isLoadingAreaData is false (no new fetch needed)
        const stateAfterLoad = useMapStore.getState();
        expect(stateAfterLoad.isLoadingAreaData).toBe(false);
        expect(stateAfterLoad.currentAreaData).toEqual(areaData);
      }),
      { numRuns: 100 }
    );
  });

  it('should keep isLoadingAreaData false when returning cached data', async () => {
    await fc.assert(
      fc.asyncProperty(yearArb, areaDataArb, async (year, areaData) => {
        // Reset state
        act(() => {
          useMapStore.setState(initialState);
        });

        // Set area data for the year
        act(() => {
          useMapStore.getState().setAreaData(year, areaData);
        });

        // Load area data for the same year
        await act(async () => {
          await useMapStore.getState().loadAreaData(year);
        });

        // isLoadingAreaData should remain false since data was cached
        const state = useMapStore.getState();
        expect(state.isLoadingAreaData).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should persist cache across multiple loadAreaData calls for the same year', async () => {
    await fc.assert(
      fc.asyncProperty(
        yearArb,
        areaDataArb,
        fc.integer({ min: 2, max: 10 }),
        async (year, areaData, numCalls) => {
          // Reset state
          act(() => {
            useMapStore.setState(initialState);
          });

          // Set area data for the year
          act(() => {
            useMapStore.getState().setAreaData(year, areaData);
          });

          // Call loadAreaData multiple times for the same year
          for (let i = 0; i < numCalls; i++) {
            let loadedData: AreaData | null = null;
            await act(async () => {
              loadedData = await useMapStore.getState().loadAreaData(year);
            });

            // Each call should return the same cached data
            expect(loadedData).toEqual(areaData);

            // State should remain consistent
            const state = useMapStore.getState();
            expect(state.areaDataCache.has(year)).toBe(true);
            expect(state.currentAreaData).toEqual(areaData);
            expect(state.isLoadingAreaData).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should cache different years independently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.tuple(yearArb, areaDataArb), { minLength: 2, maxLength: 5 }).filter(
          // Ensure all years are unique
          (entries) => new Set(entries.map(([year]) => year)).size === entries.length
        ),
        async (yearDataPairs) => {
          // Reset state
          act(() => {
            useMapStore.setState(initialState);
          });

          // Set area data for each year
          for (const [year, areaData] of yearDataPairs) {
            act(() => {
              useMapStore.getState().setAreaData(year, areaData);
            });
          }

          // Verify all years are cached independently
          const state = useMapStore.getState();
          for (const [year, areaData] of yearDataPairs) {
            expect(state.areaDataCache.has(year)).toBe(true);
            expect(state.areaDataCache.get(year)).toEqual(areaData);
          }

          // Load each year and verify correct data is returned
          for (const [year, areaData] of yearDataPairs) {
            let loadedData: AreaData | null = null;
            await act(async () => {
              loadedData = await useMapStore.getState().loadAreaData(year);
            });

            expect(loadedData).toEqual(areaData);
          }

          // Verify cache still contains all years
          const finalState = useMapStore.getState();
          expect(finalState.areaDataCache.size).toBe(yearDataPairs.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return null and set loading state for uncached years', async () => {
    await fc.assert(
      fc.asyncProperty(yearArb, async (year) => {
        // Reset state with empty cache
        act(() => {
          useMapStore.setState(initialState);
        });

        // Verify year is not in cache
        expect(useMapStore.getState().areaDataCache.has(year)).toBe(false);

        // Load area data for uncached year
        let loadedData: AreaData | null = null;
        await act(async () => {
          loadedData = await useMapStore.getState().loadAreaData(year);
        });

        // Should return null (API call fails in test environment)
        expect(loadedData).toBeNull();

        // isLoadingAreaData should be false after API call completes (with error)
        const state = useMapStore.getState();
        expect(state.isLoadingAreaData).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should clear cache when clearAreaDataCache is called', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.tuple(yearArb, areaDataArb), { minLength: 1, maxLength: 5 }).filter(
          // Ensure all years are unique
          (entries) => new Set(entries.map(([year]) => year)).size === entries.length
        ),
        async (yearDataPairs) => {
          // Reset state
          act(() => {
            useMapStore.setState(initialState);
          });

          // Set area data for each year
          for (const [year, areaData] of yearDataPairs) {
            act(() => {
              useMapStore.getState().setAreaData(year, areaData);
            });
          }

          // Verify cache is populated
          expect(useMapStore.getState().areaDataCache.size).toBe(yearDataPairs.length);

          // Clear cache
          act(() => {
            useMapStore.getState().clearAreaDataCache();
          });

          // Verify cache is empty
          const state = useMapStore.getState();
          expect(state.areaDataCache.size).toBe(0);
          expect(state.currentAreaData).toBeNull();
          expect(state.isLoadingAreaData).toBe(false);

          // Verify loading any previously cached year now returns null
          for (const [year] of yearDataPairs) {
            let loadedData: AreaData | null = null;
            await act(async () => {
              loadedData = await useMapStore.getState().loadAreaData(year);
            });
            expect(loadedData).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Feature: map-integration, Property 18: Entity Outline Calculation
 *
 * Property 18 states:
 * *For any* selected province with a valid ruler/culture/religion value, the entity outline
 * SHALL contain the merged polygon of all provinces sharing that value.
 *
 * **Validates: Requirements 8.1, 8.5**
 */
describe('Property 18: Entity Outline Calculation', () => {
  /**
   * Arbitrary for generating valid entity values (ruler/culture/religion IDs).
   */
  const entityValueArb = fc.stringMatching(/^[a-z][a-z0-9_]{2,15}$/);

  /**
   * Arbitrary for generating valid dimensions (excluding population).
   */
  const dimensionArb = fc.constantFrom('ruler', 'culture', 'religion', 'religionGeneral') as fc.Arbitrary<AreaColorDimension>;

  /**
   * Arbitrary for generating polygon coordinates.
   * Creates a simple square polygon at a random position.
   */
  const polygonCoordsArb = fc.tuple(
    fc.double({ min: -170, max: 170, noNaN: true }),
    fc.double({ min: -80, max: 80, noNaN: true }),
    fc.double({ min: 0.5, max: 5, noNaN: true })
  ).map(([lng, lat, size]) => {
    // Create a simple square polygon
    return [
      [
        [lng, lat],
        [lng + size, lat],
        [lng + size, lat + size],
        [lng, lat + size],
        [lng, lat], // Close the polygon
      ],
    ];
  });

  /**
   * Arbitrary for generating a province feature.
   */
  const provinceFeatureArb = (id: string) =>
    polygonCoordsArb.map((coordinates) => ({
      type: 'Feature' as const,
      properties: { id },
      geometry: {
        type: 'Polygon' as const,
        coordinates,
      },
    }));

  /**
   * Arbitrary for generating province data.
   */
  const provinceDataArb = (ruler: string, culture: string, religion: string): fc.Arbitrary<ProvinceData> =>
    fc.tuple(
      fc.constant(ruler),
      fc.constant(culture),
      fc.constant(religion),
      fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: null }),
      fc.integer({ min: 0, max: 10000000 })
    );

  /**
   * Arbitrary for generating a test scenario with provinces and area data.
   */
  const entityOutlineScenarioArb = fc.tuple(
    entityValueArb, // Target entity value
    dimensionArb, // Dimension to test
    fc.integer({ min: 2, max: 5 }), // Number of matching provinces
    fc.integer({ min: 0, max: 3 }) // Number of non-matching provinces
  ).chain(([targetValue, dimension, matchingCount, nonMatchingCount]) => {
    // Generate province IDs
    const matchingIds = Array.from({ length: matchingCount }, (_, i) => `match_prov_${String(i)}`);
    const nonMatchingIds = Array.from({ length: nonMatchingCount }, (_, i) => `other_prov_${String(i)}`);
    const allIds = [...matchingIds, ...nonMatchingIds];

    // Generate features for all provinces
    const featuresArb = fc.tuple(
      ...allIds.map((id) => provinceFeatureArb(id))
    );

    // Generate area data
    const areaDataArb = fc.tuple(
      ...matchingIds.map(() => {
        // Matching provinces have the target value in the appropriate dimension
        const ruler = dimension === 'ruler' ? targetValue : `other_ruler_${String(Math.random()).slice(2, 8)}`;
        const culture = dimension === 'culture' ? targetValue : `other_culture_${String(Math.random()).slice(2, 8)}`;
        const religion = dimension === 'religion' || dimension === 'religionGeneral' ? targetValue : `other_religion_${String(Math.random()).slice(2, 8)}`;
        return provinceDataArb(ruler, culture, religion);
      }),
      ...nonMatchingIds.map(() => {
        // Non-matching provinces have different values
        return provinceDataArb(
          `diff_ruler_${String(Math.random()).slice(2, 8)}`,
          `diff_culture_${String(Math.random()).slice(2, 8)}`,
          `diff_religion_${String(Math.random()).slice(2, 8)}`
        );
      })
    );

    return fc.tuple(
      fc.constant(targetValue),
      fc.constant(dimension),
      fc.constant(matchingIds),
      fc.constant(nonMatchingIds),
      featuresArb,
      areaDataArb
    );
  });

  it('should produce a valid polygon for any matching provinces', () => {
    fc.assert(
      fc.property(entityOutlineScenarioArb, ([targetValue, dimension, matchingIds, _nonMatchingIds, features, areaDataTuples]) => {
        // Reset state
        act(() => {
          useMapStore.setState({
            ...initialState,
            areaDataCache: new Map(),
          });
        });

        // Build provinces GeoJSON
        const provincesGeoJSON = {
          type: 'FeatureCollection' as const,
          features: features,
        };

        // Build area data
        const allIds = [...matchingIds, ..._nonMatchingIds];
        const areaData: AreaData = {};
        allIds.forEach((id, index) => {
          areaData[id] = areaDataTuples[index] as ProvinceData;
        });

        // Set up the store
        act(() => {
          useMapStore.getState().setProvincesGeoJSON(provincesGeoJSON as FeatureCollection<Polygon | MultiPolygon>);
          useMapStore.getState().setAreaData(1000, areaData);
        });

        // Calculate entity outline
        act(() => {
          useMapStore.getState().calculateEntityOutline(targetValue, dimension);
        });

        const state = useMapStore.getState();

        // Property: Entity outline should exist when there are matching provinces
        expect(state.entityOutline).not.toBeNull();
        expect(state.entityOutline?.type).toBe('Feature');
        expect(state.entityOutline?.geometry.type).toMatch(/Polygon|MultiPolygon/);

        // Property: The outline should have valid coordinates
        const geometry = state.entityOutline?.geometry;
        if (geometry?.type === 'Polygon') {
          expect(geometry.coordinates).toBeDefined();
          expect(geometry.coordinates.length).toBeGreaterThan(0);
          // Each ring should have at least 4 points (closed polygon)
          for (const ring of geometry.coordinates) {
            expect(ring.length).toBeGreaterThanOrEqual(4);
          }
        } else if (geometry?.type === 'MultiPolygon') {
          expect(geometry.coordinates).toBeDefined();
          expect(geometry.coordinates.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should return null for non-existent entity values', () => {
    fc.assert(
      fc.property(
        entityValueArb,
        dimensionArb,
        (nonExistentValue, dimension) => {
          // Reset state
          act(() => {
            useMapStore.setState({
              ...initialState,
              areaDataCache: new Map(),
            });
          });

          // Set up provinces with different values
          const provincesGeoJSON = {
            type: 'FeatureCollection' as const,
            features: [
              {
                type: 'Feature' as const,
                properties: { id: 'prov1' },
                geometry: {
                  type: 'Polygon' as const,
                  coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
                },
              },
            ],
          };

          const areaData: AreaData = {
            prov1: ['different_ruler', 'different_culture', 'different_religion', null, 1000],
          };

          act(() => {
            useMapStore.getState().setProvincesGeoJSON(provincesGeoJSON as FeatureCollection<Polygon | MultiPolygon>);
            useMapStore.getState().setAreaData(1000, areaData);
          });

          // Calculate entity outline with non-existent value
          act(() => {
            useMapStore.getState().calculateEntityOutline(nonExistentValue, dimension);
          });

          const state = useMapStore.getState();

          // Property: Entity outline should be null for non-existent values
          expect(state.entityOutline).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle all valid dimensions consistently', () => {
    fc.assert(
      fc.property(dimensionArb, (dimension) => {
        // Reset state
        act(() => {
          useMapStore.setState({
            ...initialState,
            areaDataCache: new Map(),
          });
        });

        const targetValue = 'test_entity';

        // Create provinces with the target value in the appropriate dimension
        const provincesGeoJSON = {
          type: 'FeatureCollection' as const,
          features: [
            {
              type: 'Feature' as const,
              properties: { id: 'prov1' },
              geometry: {
                type: 'Polygon' as const,
                coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
              },
            },
            {
              type: 'Feature' as const,
              properties: { id: 'prov2' },
              geometry: {
                type: 'Polygon' as const,
                coordinates: [[[1, 0], [2, 0], [2, 1], [1, 1], [1, 0]]],
              },
            },
          ],
        };

        // Set up area data based on dimension
        const ruler = dimension === 'ruler' ? targetValue : 'other_ruler';
        const culture = dimension === 'culture' ? targetValue : 'other_culture';
        const religion = dimension === 'religion' || dimension === 'religionGeneral' ? targetValue : 'other_religion';

        const areaData: AreaData = {
          prov1: [ruler, culture, religion, null, 1000],
          prov2: [ruler, culture, religion, null, 2000],
        };

        act(() => {
          useMapStore.getState().setProvincesGeoJSON(provincesGeoJSON as FeatureCollection<Polygon | MultiPolygon>);
          useMapStore.getState().setAreaData(1000, areaData);
        });

        // Calculate entity outline
        act(() => {
          useMapStore.getState().calculateEntityOutline(targetValue, dimension);
        });

        const state = useMapStore.getState();

        // Property: Entity outline should exist for all valid dimensions
        expect(state.entityOutline).not.toBeNull();
        expect(state.entityOutline?.type).toBe('Feature');
      }),
      { numRuns: 100 }
    );
  });

  it('should reject population dimension for entity outlines', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 10 }), (value) => {
        // Reset state
        act(() => {
          useMapStore.setState({
            ...initialState,
            areaDataCache: new Map(),
          });
        });

        const provincesGeoJSON = {
          type: 'FeatureCollection' as const,
          features: [
            {
              type: 'Feature' as const,
              properties: { id: 'prov1' },
              geometry: {
                type: 'Polygon' as const,
                coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
              },
            },
          ],
        };

        const areaData: AreaData = {
          prov1: ['ruler1', 'culture1', 'religion1', null, 1000],
        };

        act(() => {
          useMapStore.getState().setProvincesGeoJSON(provincesGeoJSON as FeatureCollection<Polygon | MultiPolygon>);
          useMapStore.getState().setAreaData(1000, areaData);
        });

        // Calculate entity outline with population dimension
        act(() => {
          useMapStore.getState().calculateEntityOutline(value, 'population');
        });

        const state = useMapStore.getState();

        // Property: Entity outline should be null for population dimension
        expect(state.entityOutline).toBeNull();
      }),
      { numRuns: 100 }
    );
  });
});


/**
 * Feature: map-integration, Property 19: Entity Outline Viewport Fit
 *
 * Property 19 states:
 * *For any* calculated entity outline, the viewport SHALL be adjusted to fit the outline's
 * bounding box with padding, and the zoom SHALL be constrained between 4.5 and (current zoom - 1).
 *
 * **Validates: Requirements 8.3, 8.6**
 */
describe('Property 19: Entity Outline Viewport Fit', () => {
  /**
   * Arbitrary for generating valid zoom levels.
   */
  const zoomArb = fc.double({ min: 2, max: 20, noNaN: true });

  /**
   * Arbitrary for generating padding values.
   */
  const paddingArb = fc.integer({ min: 0, max: 200 });

  /**
   * Arbitrary for generating polygon bounding boxes.
   * Returns [minLng, minLat, maxLng, maxLat] and the polygon coordinates.
   */
  const polygonBboxArb = fc.tuple(
    fc.double({ min: -170, max: 160, noNaN: true }), // minLng
    fc.double({ min: -80, max: 70, noNaN: true }), // minLat
    fc.double({ min: 1, max: 20, noNaN: true }), // width
    fc.double({ min: 1, max: 20, noNaN: true }) // height
  ).map(([minLng, minLat, width, height]) => {
    const maxLng = minLng + width;
    const maxLat = minLat + height;
    const coordinates = [
      [
        [minLng, minLat],
        [maxLng, minLat],
        [maxLng, maxLat],
        [minLng, maxLat],
        [minLng, minLat],
      ],
    ];
    return { minLng, minLat, maxLng, maxLat, coordinates };
  });

  /**
   * Helper to set up a test scenario with an entity outline.
   */
  function setupEntityOutline(coordinates: number[][][]) {
    const provincesGeoJSON = {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          properties: { id: 'prov1' },
          geometry: {
            type: 'Polygon' as const,
            coordinates,
          },
        },
      ],
    };

    const areaData: AreaData = {
      prov1: ['ruler1', 'culture1', 'religion1', null, 1000],
    };

    act(() => {
      useMapStore.getState().setProvincesGeoJSON(provincesGeoJSON as FeatureCollection<Polygon | MultiPolygon>);
      useMapStore.getState().setAreaData(1000, areaData);
      useMapStore.getState().calculateEntityOutline('ruler1', 'ruler');
    });
  }

  it('should initiate flyTo for any valid entity outline', () => {
    fc.assert(
      fc.property(polygonBboxArb, zoomArb, ({ coordinates }, initialZoom) => {
        // Reset state
        act(() => {
          useMapStore.setState({
            ...initialState,
            areaDataCache: new Map(),
            viewport: { ...initialState.viewport, zoom: initialZoom },
          });
        });

        // Set up entity outline
        setupEntityOutline(coordinates);

        // Verify entity outline was created
        expect(useMapStore.getState().entityOutline).not.toBeNull();

        // Fit to entity outline
        act(() => {
          useMapStore.getState().fitToEntityOutline();
        });

        const state = useMapStore.getState();

        // Property: flyTo should be initiated
        expect(state.isFlying).toBe(true);
        expect(state.flyToTarget).not.toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it('should constrain zoom to minimum 4.5 for any entity outline', () => {
    fc.assert(
      fc.property(polygonBboxArb, zoomArb, paddingArb, ({ coordinates }, initialZoom, padding) => {
        // Reset state
        act(() => {
          useMapStore.setState({
            ...initialState,
            areaDataCache: new Map(),
            viewport: { ...initialState.viewport, zoom: initialZoom },
          });
        });

        // Set up entity outline
        setupEntityOutline(coordinates);

        // Fit to entity outline
        act(() => {
          useMapStore.getState().fitToEntityOutline(padding);
        });

        const state = useMapStore.getState();

        // Property: zoom should be at least 4.5 (MIN_ENTITY_ZOOM)
        if (state.flyToTarget?.zoom !== undefined) {
          expect(state.flyToTarget.zoom).toBeGreaterThanOrEqual(4.5);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should constrain zoom to at most (current zoom - 1) for any entity outline', () => {
    fc.assert(
      fc.property(
        polygonBboxArb,
        fc.double({ min: 6, max: 20, noNaN: true }), // Use higher zoom to test constraint
        ({ coordinates }, initialZoom) => {
          // Reset state
          act(() => {
            useMapStore.setState({
              ...initialState,
              areaDataCache: new Map(),
              viewport: { ...initialState.viewport, zoom: initialZoom },
            });
          });

          // Set up entity outline
          setupEntityOutline(coordinates);

          // Fit to entity outline
          act(() => {
            useMapStore.getState().fitToEntityOutline();
          });

          const state = useMapStore.getState();

          // Property: zoom should be at most (initialZoom - 1) or 4.5, whichever is greater
          if (state.flyToTarget?.zoom !== undefined) {
            const maxAllowedZoom = Math.max(4.5, initialZoom - 1);
            expect(state.flyToTarget.zoom).toBeLessThanOrEqual(maxAllowedZoom);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should target the center of the bounding box for any entity outline', () => {
    fc.assert(
      fc.property(polygonBboxArb, ({ minLng, minLat, maxLng, maxLat, coordinates }) => {
        // Reset state
        act(() => {
          useMapStore.setState({
            ...initialState,
            areaDataCache: new Map(),
          });
        });

        // Set up entity outline
        setupEntityOutline(coordinates);

        // Fit to entity outline
        act(() => {
          useMapStore.getState().fitToEntityOutline();
        });

        const state = useMapStore.getState();

        // Calculate expected center
        const expectedCenterLng = (minLng + maxLng) / 2;
        const expectedCenterLat = (minLat + maxLat) / 2;

        // Property: flyTo target should be approximately at the center of the bounding box
        if (state.flyToTarget) {
          // Allow some tolerance for floating point calculations
          expect(state.flyToTarget.longitude).toBeCloseTo(expectedCenterLng, 1);
          expect(state.flyToTarget.latitude).toBeCloseTo(expectedCenterLat, 1);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should not initiate flyTo when no entity outline exists', () => {
    fc.assert(
      fc.property(zoomArb, paddingArb, (initialZoom, padding) => {
        // Reset state with no entity outline
        act(() => {
          useMapStore.setState({
            ...initialState,
            areaDataCache: new Map(),
            viewport: { ...initialState.viewport, zoom: initialZoom },
            entityOutline: null,
          });
        });

        // Try to fit to entity outline
        act(() => {
          useMapStore.getState().fitToEntityOutline(padding);
        });

        const state = useMapStore.getState();

        // Property: flyTo should not be initiated when no entity outline
        expect(state.isFlying).toBe(false);
        expect(state.flyToTarget).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it('should respect padding parameter for any entity outline', () => {
    fc.assert(
      fc.property(
        polygonBboxArb,
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 101, max: 300 }),
        ({ coordinates }, smallPadding, largePadding) => {
          // Reset state
          act(() => {
            useMapStore.setState({
              ...initialState,
              areaDataCache: new Map(),
              viewport: { ...initialState.viewport, zoom: 10 },
            });
          });

          // Set up entity outline
          setupEntityOutline(coordinates);

          // Fit with small padding
          act(() => {
            useMapStore.getState().fitToEntityOutline(smallPadding);
          });

          const smallPaddingZoom = useMapStore.getState().flyToTarget?.zoom;

          // Reset flyTo state
          act(() => {
            useMapStore.getState().clearFlyTo();
          });

          // Fit with large padding
          act(() => {
            useMapStore.getState().fitToEntityOutline(largePadding);
          });

          const largePaddingZoom = useMapStore.getState().flyToTarget?.zoom;

          // Property: larger padding should result in same or lower zoom (more zoomed out)
          // This is because more padding means we need to show more area
          if (smallPaddingZoom !== undefined && largePaddingZoom !== undefined) {
            expect(largePaddingZoom).toBeLessThanOrEqual(smallPaddingZoom);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Feature: map-integration, Property 11: Color Dimension Change Updates Map
 *
 * Property 11 states:
 * *For any* change to the active color dimension, the MapView SHALL update the visible layer
 * to the new dimension and hide the previous dimension's layer.
 *
 * **Validates: Requirements 5.3**
 */
describe('Property 11: Color Dimension Change Updates Map', () => {
  /**
   * Arbitrary for generating valid color dimensions.
   */
  const colorDimensionArb = fc.constantFrom(
    'ruler',
    'religion',
    'religionGeneral',
    'culture',
    'population'
  ) as fc.Arbitrary<AreaColorDimension>;

  /**
   * Arbitrary for generating pairs of different color dimensions.
   */
  const differentDimensionPairArb = fc
    .tuple(colorDimensionArb, colorDimensionArb)
    .filter(([a, b]) => a !== b);

  it('should update activeColor to the new dimension for any valid dimension', () => {
    fc.assert(
      fc.property(colorDimensionArb, (dimension) => {
        // Reset state
        act(() => {
          useMapStore.setState(initialState);
        });

        // Set the active color
        act(() => {
          useMapStore.getState().setActiveColor(dimension);
        });

        const state = useMapStore.getState();

        // Property: activeColor should be updated to the new dimension
        expect(state.activeColor).toBe(dimension);
      }),
      { numRuns: 100 }
    );
  });

  it('should set only the new dimension layer to visible and hide all others', () => {
    fc.assert(
      fc.property(colorDimensionArb, (dimension) => {
        // Reset state
        act(() => {
          useMapStore.setState(initialState);
        });

        // Set the active color
        act(() => {
          useMapStore.getState().setActiveColor(dimension);
        });

        const state = useMapStore.getState();

        // Property: Only the active dimension should be visible
        expect(state.layerVisibility[dimension]).toBe(true);

        // Property: All other dimensions should be hidden
        const allDimensions: AreaColorDimension[] = [
          'ruler',
          'religion',
          'religionGeneral',
          'culture',
          'population',
        ];
        for (const dim of allDimensions) {
          if (dim !== dimension) {
            expect(state.layerVisibility[dim]).toBe(false);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should track the previous active color when changing dimensions', () => {
    fc.assert(
      fc.property(differentDimensionPairArb, ([firstDimension, secondDimension]) => {
        // Reset state
        act(() => {
          useMapStore.setState(initialState);
        });

        // Set the first dimension
        act(() => {
          useMapStore.getState().setActiveColor(firstDimension);
        });

        // Set the second dimension
        act(() => {
          useMapStore.getState().setActiveColor(secondDimension);
        });

        const state = useMapStore.getState();

        // Property: previousActiveColor should be the first dimension
        expect(state.previousActiveColor).toBe(firstDimension);

        // Property: activeColor should be the second dimension
        expect(state.activeColor).toBe(secondDimension);
      }),
      { numRuns: 100 }
    );
  });

  it('should hide the previous dimension layer when changing to a new dimension', () => {
    fc.assert(
      fc.property(differentDimensionPairArb, ([previousDimension, newDimension]) => {
        // Reset state
        act(() => {
          useMapStore.setState(initialState);
        });

        // Set the previous dimension
        act(() => {
          useMapStore.getState().setActiveColor(previousDimension);
        });

        // Verify previous dimension is visible
        expect(useMapStore.getState().layerVisibility[previousDimension]).toBe(true);

        // Set the new dimension
        act(() => {
          useMapStore.getState().setActiveColor(newDimension);
        });

        const state = useMapStore.getState();

        // Property: Previous dimension should now be hidden
        expect(state.layerVisibility[previousDimension]).toBe(false);

        // Property: New dimension should be visible
        expect(state.layerVisibility[newDimension]).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should not change state when setting the same dimension', () => {
    fc.assert(
      fc.property(colorDimensionArb, (dimension) => {
        // Reset state
        act(() => {
          useMapStore.setState(initialState);
        });

        // Set the dimension
        act(() => {
          useMapStore.getState().setActiveColor(dimension);
        });

        const stateAfterFirst = useMapStore.getState();
        const visibilityAfterFirst = { ...stateAfterFirst.layerVisibility };

        // Set the same dimension again
        act(() => {
          useMapStore.getState().setActiveColor(dimension);
        });

        const stateAfterSecond = useMapStore.getState();

        // Property: State should remain unchanged
        expect(stateAfterSecond.activeColor).toBe(dimension);
        expect(stateAfterSecond.layerVisibility).toEqual(visibilityAfterFirst);

        // Property: previousActiveColor should not be updated to the same dimension
        // (it should remain what it was before, or null if this was the first change)
        if (dimension !== 'ruler') {
          // If we changed from ruler (default) to something else, previousActiveColor should be ruler
          expect(stateAfterSecond.previousActiveColor).toBe('ruler');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain exactly one visible layer at all times', () => {
    fc.assert(
      fc.property(
        fc.array(colorDimensionArb, { minLength: 1, maxLength: 10 }),
        (dimensions) => {
          // Reset state
          act(() => {
            useMapStore.setState(initialState);
          });

          // Apply each dimension change
          for (const dimension of dimensions) {
            act(() => {
              useMapStore.getState().setActiveColor(dimension);
            });

            const state = useMapStore.getState();

            // Property: Exactly one layer should be visible
            const visibleLayers = Object.entries(state.layerVisibility).filter(
              ([, visible]) => visible
            );
            expect(visibleLayers).toHaveLength(1);

            // Property: The visible layer should be the active dimension
            expect(visibleLayers[0]?.[0]).toBe(dimension);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle rapid dimension changes correctly', () => {
    fc.assert(
      fc.property(
        fc.array(colorDimensionArb, { minLength: 5, maxLength: 20 }),
        (dimensions) => {
          // Reset state
          act(() => {
            useMapStore.setState(initialState);
          });

          // Apply all dimension changes rapidly
          for (const dimension of dimensions) {
            act(() => {
              useMapStore.getState().setActiveColor(dimension);
            });
          }

          const finalState = useMapStore.getState();
          const lastDimension = dimensions[dimensions.length - 1];

          // Property: Final activeColor should be the last dimension
          expect(finalState.activeColor).toBe(lastDimension);

          // Property: Only the last dimension should be visible
          expect(finalState.layerVisibility[lastDimension!]).toBe(true);

          // Property: All other dimensions should be hidden
          const allDimensions: AreaColorDimension[] = [
            'ruler',
            'religion',
            'religionGeneral',
            'culture',
            'population',
          ];
          for (const dim of allDimensions) {
            if (dim !== lastDimension) {
              expect(finalState.layerVisibility[dim]).toBe(false);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly cycle through all dimensions', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        // Reset state
        act(() => {
          useMapStore.setState(initialState);
        });

        const allDimensions: AreaColorDimension[] = [
          'ruler',
          'religion',
          'religionGeneral',
          'culture',
          'population',
        ];

        // Cycle through all dimensions
        for (const dimension of allDimensions) {
          act(() => {
            useMapStore.getState().setActiveColor(dimension);
          });

          const state = useMapStore.getState();

          // Property: Current dimension should be active and visible
          expect(state.activeColor).toBe(dimension);
          expect(state.layerVisibility[dimension]).toBe(true);

          // Property: All other dimensions should be hidden
          for (const otherDim of allDimensions) {
            if (otherDim !== dimension) {
              expect(state.layerVisibility[otherDim]).toBe(false);
            }
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});
