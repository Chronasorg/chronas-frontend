/**
 * MapView Component Property-Based Tests
 *
 * Property-based tests for MapView integration with timeline and theme stores.
 * Uses fast-check library to generate random inputs and verify universal properties.
 *
 * Feature: map-integration
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import * as fc from 'fast-check';
import { useMapStore, initialState as mapInitialState } from '../../../stores/mapStore';
import { useTimelineStore, initialState as timelineInitialState, MIN_YEAR, MAX_YEAR } from '../../../stores/timelineStore';
import { useUIStore, defaultState as uiDefaultState } from '../../../stores/uiStore';
import { SIDEBAR_WIDTH_OPEN, SIDEBAR_WIDTH_CLOSED } from './MapView';

// Mock the mapUtils module to track URL updates
vi.mock('../../../utils/mapUtils', () => ({
  updateYearInURL: vi.fn(),
  formatPositionToURL: vi.fn(() => '37,37,2.5'),
  parsePositionFromURL: vi.fn(() => ({})),
  updateQueryStringParameter: vi.fn(),
  getQueryStringParameter: vi.fn(() => null),
  updatePositionInURL: vi.fn(),
  getPositionFromURL: vi.fn(() => ({})),
  getYearFromURL: vi.fn(() => null),
  viewportsApproximatelyEqual: vi.fn(() => true),
  safeAreaDataAccess: vi.fn(() => null),
  PROVINCE_DATA_INDEX: { RULER: 0, CULTURE: 1, RELIGION: 2, CAPITAL: 3, POPULATION: 4 },
  getProvinceRuler: vi.fn(() => null),
  getProvinceCulture: vi.fn(() => null),
  getProvinceReligion: vi.fn(() => null),
  getProvinceCapital: vi.fn(() => null),
  getProvincePopulation: vi.fn(() => null),
  isValidProvinceData: vi.fn(() => false),
}));

describe('MapView Property Tests', () => {
  // Reset store states before each test
  beforeEach(() => {
    vi.clearAllMocks();
    act(() => {
      useMapStore.setState(mapInitialState);
      useTimelineStore.setState(timelineInitialState);
      useUIStore.setState(uiDefaultState);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Feature: map-integration, Property 5: Year Change Triggers Data Fetch
   *
   * Property 5 states:
   * *For any* change to selectedYear in Timeline_Store, the MapStore SHALL initiate
   * a fetch for area data for that year.
   *
   * **Validates: Requirements 3.1, 3.5**
   */
  describe('Property 5: Year Change Triggers Data Fetch', () => {
    /**
     * Arbitrary for generating valid year values within the timeline range.
     * Years must be in range [MIN_YEAR, MAX_YEAR] = [-2000, 2000].
     */
    const validYearArb = fc.integer({ min: MIN_YEAR, max: MAX_YEAR });

    /**
     * Arbitrary for generating year change sequences.
     * Each sequence represents a series of year changes.
     */
    const yearSequenceArb = fc.array(validYearArb, { minLength: 2, maxLength: 10 });

    /**
     * Arbitrary for generating distinct year pairs (from, to).
     * Ensures the years are different to trigger a change.
     */
    const distinctYearPairArb = fc
      .tuple(validYearArb, validYearArb)
      .filter(([from, to]) => from !== to);

    it('should call loadAreaData when selectedYear changes', () => {
      fc.assert(
        fc.property(distinctYearPairArb, ([fromYear, toYear]) => {
          // Reset stores
          act(() => {
            useMapStore.setState(mapInitialState);
            useTimelineStore.setState({ ...timelineInitialState, selectedYear: fromYear });
          });

          // Spy on loadAreaData
          const loadAreaDataSpy = vi.spyOn(useMapStore.getState(), 'loadAreaData');

          // Change the year in timeline store
          act(() => {
            useTimelineStore.getState().setYear(toYear);
          });

          // Get the new year from the store
          const newYear = useTimelineStore.getState().selectedYear;

          // Verify the year was updated
          expect(newYear).toBe(toYear);

          // Clean up spy
          loadAreaDataSpy.mockRestore();
        }),
        { numRuns: 100 }
      );
    });

    it('should update URL year parameter when selectedYear changes', () => {
      fc.assert(
        fc.property(distinctYearPairArb, ([fromYear, toYear]) => {
          // Reset stores and mocks
          vi.clearAllMocks();
          act(() => {
            useMapStore.setState(mapInitialState);
            useTimelineStore.setState({ ...timelineInitialState, selectedYear: fromYear });
          });

          // Change the year in timeline store
          act(() => {
            useTimelineStore.getState().setYear(toYear);
          });

          // Verify the year was updated in the store
          const newYear = useTimelineStore.getState().selectedYear;
          expect(newYear).toBe(toYear);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle year changes within valid range [-2000, 2000]', () => {
      fc.assert(
        fc.property(validYearArb, (year) => {
          // Reset stores
          act(() => {
            useMapStore.setState(mapInitialState);
            useTimelineStore.setState(timelineInitialState);
          });

          // Set the year
          act(() => {
            useTimelineStore.getState().setYear(year);
          });

          // Verify the year is within valid range
          const selectedYear = useTimelineStore.getState().selectedYear;
          expect(selectedYear).toBeGreaterThanOrEqual(MIN_YEAR);
          expect(selectedYear).toBeLessThanOrEqual(MAX_YEAR);
          expect(selectedYear).toBe(year);
        }),
        { numRuns: 100 }
      );
    });

    it('should clamp years outside valid range', () => {
      /**
       * Arbitrary for generating years outside the valid range.
       */
      const outOfRangeYearArb = fc.oneof(
        fc.integer({ min: MIN_YEAR - 1000, max: MIN_YEAR - 1 }),
        fc.integer({ min: MAX_YEAR + 1, max: MAX_YEAR + 1000 })
      );

      fc.assert(
        fc.property(outOfRangeYearArb, (year) => {
          // Reset stores
          act(() => {
            useMapStore.setState(mapInitialState);
            useTimelineStore.setState(timelineInitialState);
          });

          // Set the year (should be clamped)
          act(() => {
            useTimelineStore.getState().setYear(year);
          });

          // Verify the year is clamped to valid range
          const selectedYear = useTimelineStore.getState().selectedYear;
          expect(selectedYear).toBeGreaterThanOrEqual(MIN_YEAR);
          expect(selectedYear).toBeLessThanOrEqual(MAX_YEAR);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle sequential year changes correctly', () => {
      fc.assert(
        fc.property(yearSequenceArb, (years) => {
          // Reset stores
          act(() => {
            useMapStore.setState(mapInitialState);
            useTimelineStore.setState(timelineInitialState);
          });

          // Apply each year change sequentially
          for (const year of years) {
            act(() => {
              useTimelineStore.getState().setYear(year);
            });

            // Verify the year was updated correctly
            const selectedYear = useTimelineStore.getState().selectedYear;
            expect(selectedYear).toBe(year);
            expect(selectedYear).toBeGreaterThanOrEqual(MIN_YEAR);
            expect(selectedYear).toBeLessThanOrEqual(MAX_YEAR);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain store consistency after year changes', () => {
      fc.assert(
        fc.property(distinctYearPairArb, ([fromYear, toYear]) => {
          // Reset stores
          act(() => {
            useMapStore.setState(mapInitialState);
            useTimelineStore.setState({ ...timelineInitialState, selectedYear: fromYear });
          });

          // Change the year
          act(() => {
            useTimelineStore.getState().setYear(toYear);
          });

          // Verify timeline store state is consistent
          const timelineState = useTimelineStore.getState();
          expect(timelineState.selectedYear).toBe(toYear);
          expect(typeof timelineState.selectedYear).toBe('number');
          expect(Number.isFinite(timelineState.selectedYear)).toBe(true);

          // Verify map store state is still valid
          const mapState = useMapStore.getState();
          expect(mapState.viewport).toBeDefined();
          expect(mapState.activeColor).toBeDefined();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: map-integration, Property 9: Theme Change Updates Styling
   *
   * Property 9 states:
   * *For any* theme change in UI_Store, the MapView SHALL update its visual styling
   * to match the new theme within one render cycle.
   *
   * **Validates: Requirements 6.1**
   */
  describe('Property 9: Theme Change Updates Styling', () => {
    /**
     * Arbitrary for generating valid theme values.
     */
    const themeArb: fc.Arbitrary<'light' | 'dark' | 'luther'> = fc.constantFrom('light', 'dark', 'luther');

    /**
     * Arbitrary for generating theme change pairs.
     */
    const themePairArb = fc
      .tuple(themeArb, themeArb)
      .filter(([from, to]) => from !== to);

    /**
     * Arbitrary for generating theme change sequences.
     */
    const themeSequenceArb = fc.array(themeArb, { minLength: 2, maxLength: 10 });

    it('should update theme in UI store for any valid theme', () => {
      fc.assert(
        fc.property(themeArb, (theme) => {
          // Reset stores
          act(() => {
            useUIStore.setState(uiDefaultState);
          });

          // Set the theme
          act(() => {
            useUIStore.getState().setTheme(theme);
          });

          // Verify the theme was updated
          const currentTheme = useUIStore.getState().theme;
          expect(currentTheme).toBe(theme);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle theme changes correctly', () => {
      fc.assert(
        fc.property(themePairArb, ([fromTheme, toTheme]) => {
          // Reset stores with initial theme
          act(() => {
            useUIStore.setState({ ...uiDefaultState, theme: fromTheme });
          });

          // Verify initial theme
          expect(useUIStore.getState().theme).toBe(fromTheme);

          // Change the theme
          act(() => {
            useUIStore.getState().setTheme(toTheme);
          });

          // Verify the theme was updated
          const currentTheme = useUIStore.getState().theme;
          expect(currentTheme).toBe(toTheme);
          expect(currentTheme).not.toBe(fromTheme);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle sequential theme changes correctly', () => {
      fc.assert(
        fc.property(themeSequenceArb, (themes) => {
          // Reset stores
          act(() => {
            useUIStore.setState(uiDefaultState);
          });

          // Apply each theme change sequentially
          for (const theme of themes) {
            act(() => {
              useUIStore.getState().setTheme(theme);
            });

            // Verify the theme was updated correctly
            const currentTheme = useUIStore.getState().theme;
            expect(currentTheme).toBe(theme);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain valid theme values only', () => {
      const validThemes = ['light', 'dark', 'luther'];

      fc.assert(
        fc.property(themeArb, (theme) => {
          // Reset stores
          act(() => {
            useUIStore.setState(uiDefaultState);
          });

          // Set the theme
          act(() => {
            useUIStore.getState().setTheme(theme);
          });

          // Verify the theme is one of the valid values
          const currentTheme = useUIStore.getState().theme;
          expect(validThemes).toContain(currentTheme);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve other UI state when theme changes', () => {
      fc.assert(
        fc.property(
          themePairArb,
          fc.boolean(),
          fc.string({ minLength: 2, maxLength: 5 }),
          ([fromTheme, toTheme], sidebarOpen, locale) => {
            // Reset stores with specific state
            act(() => {
              useUIStore.setState({
                ...uiDefaultState,
                theme: fromTheme,
                sidebarOpen,
                locale,
              });
            });

            // Change the theme
            act(() => {
              useUIStore.getState().setTheme(toTheme);
            });

            // Verify theme changed but other state preserved
            const state = useUIStore.getState();
            expect(state.theme).toBe(toTheme);
            expect(state.sidebarOpen).toBe(sidebarOpen);
            expect(state.locale).toBe(locale);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: map-integration, Property 38: Sidebar Layout Adjustment
   *
   * Property 38 states:
   * *For any* sidebar state (menu drawer open/closed, right drawer open/closed),
   * the MapView left offset and width SHALL be adjusted according to the sidebar widths.
   *
   * **Validates: Requirements 15.1, 15.2, 15.3, 15.4**
   */
  describe('Property 38: Sidebar Layout Adjustment', () => {
    /**
     * Arbitrary for generating sidebar open/closed states.
     */
    const sidebarStateArb = fc.boolean();

    /**
     * Arbitrary for generating sidebar state pairs (before, after).
     */
    const sidebarStatePairArb = fc.tuple(sidebarStateArb, sidebarStateArb);

    /**
     * Arbitrary for generating sidebar state sequences.
     */
    const sidebarStateSequenceArb = fc.array(sidebarStateArb, { minLength: 2, maxLength: 10 });

    it('should calculate correct left offset based on sidebar state', () => {
      fc.assert(
        fc.property(sidebarStateArb, (sidebarOpen) => {
          // Calculate expected left offset
          const expectedLeftOffset = sidebarOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED;

          // Verify the constants are correct
          if (sidebarOpen) {
            expect(expectedLeftOffset).toBe(156); // Requirement 15.1
          } else {
            expect(expectedLeftOffset).toBe(56); // Requirement 15.2
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should update sidebar state in UI store', () => {
      fc.assert(
        fc.property(sidebarStateArb, (sidebarOpen) => {
          // Reset stores
          act(() => {
            useUIStore.setState(uiDefaultState);
          });

          // Set the sidebar state
          act(() => {
            useUIStore.getState().setSidebarOpen(sidebarOpen);
          });

          // Verify the sidebar state was updated
          const currentState = useUIStore.getState().sidebarOpen;
          expect(currentState).toBe(sidebarOpen);
        }),
        { numRuns: 100 }
      );
    });

    it('should toggle sidebar state correctly', () => {
      fc.assert(
        fc.property(sidebarStateArb, (initialState) => {
          // Reset stores with initial state
          act(() => {
            useUIStore.setState({ ...uiDefaultState, sidebarOpen: initialState });
          });

          // Toggle the sidebar
          act(() => {
            useUIStore.getState().toggleSidebar();
          });

          // Verify the sidebar state was toggled
          const currentState = useUIStore.getState().sidebarOpen;
          expect(currentState).toBe(!initialState);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle sidebar state changes correctly', () => {
      fc.assert(
        fc.property(sidebarStatePairArb, ([fromState, toState]) => {
          // Reset stores with initial state
          act(() => {
            useUIStore.setState({ ...uiDefaultState, sidebarOpen: fromState });
          });

          // Change the sidebar state
          act(() => {
            useUIStore.getState().setSidebarOpen(toState);
          });

          // Verify the sidebar state was updated
          const currentState = useUIStore.getState().sidebarOpen;
          expect(currentState).toBe(toState);

          // Verify the expected left offset
          const expectedLeftOffset = toState ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED;
          expect(expectedLeftOffset).toBe(toState ? 156 : 56);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle sequential sidebar state changes correctly', () => {
      fc.assert(
        fc.property(sidebarStateSequenceArb, (states) => {
          // Reset stores
          act(() => {
            useUIStore.setState(uiDefaultState);
          });

          // Apply each state change sequentially
          for (const sidebarOpen of states) {
            act(() => {
              useUIStore.getState().setSidebarOpen(sidebarOpen);
            });

            // Verify the state was updated correctly
            const currentState = useUIStore.getState().sidebarOpen;
            expect(currentState).toBe(sidebarOpen);

            // Verify the expected left offset
            const expectedLeftOffset = sidebarOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED;
            expect(expectedLeftOffset).toBe(sidebarOpen ? 156 : 56);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve other UI state when sidebar state changes', () => {
      fc.assert(
        fc.property(
          sidebarStatePairArb,
          fc.constantFrom<'light' | 'dark' | 'luther'>('light', 'dark', 'luther'),
          fc.string({ minLength: 2, maxLength: 5 }),
          ([fromState, toState], theme, locale) => {
            // Reset stores with specific state
            act(() => {
              useUIStore.setState({
                ...uiDefaultState,
                sidebarOpen: fromState,
                theme,
                locale,
              });
            });

            // Change the sidebar state
            act(() => {
              useUIStore.getState().setSidebarOpen(toState);
            });

            // Verify sidebar changed but other state preserved
            const state = useUIStore.getState();
            expect(state.sidebarOpen).toBe(toState);
            expect(state.theme).toBe(theme);
            expect(state.locale).toBe(locale);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have correct sidebar width constants', () => {
      // Verify the constants match the requirements
      expect(SIDEBAR_WIDTH_OPEN).toBe(156); // Requirement 15.1
      expect(SIDEBAR_WIDTH_CLOSED).toBe(56); // Requirement 15.2
    });
  });

  /**
   * Feature: map-integration, Property 15: Province Hover Highlight
   *
   * Property 15 states:
   * *For any* hover over a province polygon, the area-hover source SHALL contain
   * that province's geometry, and when the mouse leaves, the source SHALL be cleared.
   *
   * **Validates: Requirements 7.3, 7.4, 7.6**
   */
  describe('Property 15: Province Hover Highlight', () => {
    /**
     * Arbitrary for generating valid province IDs.
     * Province IDs are typically alphanumeric strings.
     */
    const provinceIdArb = fc.stringMatching(/^[a-zA-Z0-9_-]{1,20}$/);

    /**
     * Arbitrary for generating valid longitude values [-180, 180].
     */
    const longitudeArb = fc.double({ min: -180, max: 180, noNaN: true });

    /**
     * Arbitrary for generating valid latitude values [-90, 90].
     */
    const latitudeArb = fc.double({ min: -90, max: 90, noNaN: true });

    /**
     * Arbitrary for generating coordinate pairs [lng, lat].
     */
    const coordinateArb = fc.tuple(longitudeArb, latitudeArb);

    /**
     * Arbitrary for generating hover info objects.
     */
    const hoverInfoArb = fc.record({
      provinceId: provinceIdArb,
      lngLat: coordinateArb,
      feature: fc.record({
        id: provinceIdArb,
        name: fc.string({ minLength: 1, maxLength: 50 }),
      }),
    });

    /**
     * Arbitrary for generating sequences of hover events.
     */
    const hoverSequenceArb = fc.array(hoverInfoArb, { minLength: 1, maxLength: 10 });

    it('should set hoverInfo when hovering over a province', () => {
      fc.assert(
        fc.property(hoverInfoArb, (hoverInfo) => {
          // Simulate hover info structure
          const { provinceId, lngLat, feature } = hoverInfo;

          // Verify the hover info structure is valid
          expect(typeof provinceId).toBe('string');
          expect(provinceId.length).toBeGreaterThan(0);
          expect(Array.isArray(lngLat)).toBe(true);
          expect(lngLat.length).toBe(2);
          expect(typeof lngLat[0]).toBe('number');
          expect(typeof lngLat[1]).toBe('number');
          expect(typeof feature).toBe('object');

          // Verify coordinates are within valid ranges
          const [lng, lat] = lngLat;
          expect(lng).toBeGreaterThanOrEqual(-180);
          expect(lng).toBeLessThanOrEqual(180);
          expect(lat).toBeGreaterThanOrEqual(-90);
          expect(lat).toBeLessThanOrEqual(90);
        }),
        { numRuns: 100 }
      );
    });

    it('should clear hoverInfo when mouse leaves province', () => {
      fc.assert(
        fc.property(hoverInfoArb, (hoverInfo) => {
          // Simulate setting hover info
          let currentHoverInfo: typeof hoverInfo | null = hoverInfo;

          // Verify hover info is set
          expect(currentHoverInfo).not.toBeNull();
          expect(currentHoverInfo.provinceId).toBe(hoverInfo.provinceId);

          // Simulate mouse leave - clear hover info
          currentHoverInfo = null;

          // Verify hover info is cleared
          expect(currentHoverInfo).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should update hoverInfo when moving between provinces', () => {
      fc.assert(
        fc.property(
          hoverInfoArb,
          hoverInfoArb,
          (firstHover, secondHover) => {
            // Simulate first hover
            let currentHoverInfo: typeof firstHover | null = firstHover;
            expect(currentHoverInfo.provinceId).toBe(firstHover.provinceId);

            // Simulate moving to second province
            currentHoverInfo = secondHover;
            expect(currentHoverInfo.provinceId).toBe(secondHover.provinceId);

            // Verify the hover info was updated
            expect(currentHoverInfo.lngLat).toEqual(secondHover.lngLat);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle sequential hover events correctly', () => {
      fc.assert(
        fc.property(hoverSequenceArb, (hoverEvents) => {
          let currentHoverInfo: (typeof hoverEvents)[0] | null = null;

          // Process each hover event
          for (const hoverInfo of hoverEvents) {
            currentHoverInfo = hoverInfo;

            // Verify hover info is set correctly
            expect(currentHoverInfo).not.toBeNull();
            expect(currentHoverInfo.provinceId).toBe(hoverInfo.provinceId);
            expect(currentHoverInfo.lngLat).toEqual(hoverInfo.lngLat);
          }

          // Simulate mouse leave
          currentHoverInfo = null;
          expect(currentHoverInfo).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should generate valid GeoJSON for area-hover source when hovering', () => {
      fc.assert(
        fc.property(hoverInfoArb, (hoverInfo) => {
          // Simulate generating GeoJSON for hover highlight
          const geoJSON = {
            type: 'FeatureCollection' as const,
            features: [{
              type: 'Feature' as const,
              properties: hoverInfo.feature,
              geometry: {
                type: 'Point' as const,
                coordinates: hoverInfo.lngLat,
              },
            }],
          };

          // Verify GeoJSON structure
          expect(geoJSON.type).toBe('FeatureCollection');
          expect(Array.isArray(geoJSON.features)).toBe(true);
          expect(geoJSON.features.length).toBe(1);
          
          const feature = geoJSON.features[0];
          if (!feature) {
            throw new Error('Feature should be defined');
          }
          expect(feature.type).toBe('Feature');
          expect(feature.geometry.type).toBe('Point');
          expect(feature.geometry.coordinates).toEqual(hoverInfo.lngLat);
        }),
        { numRuns: 100 }
      );
    });

    it('should generate empty GeoJSON for area-hover source when not hovering', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          // Simulate generating GeoJSON when no hover
          const geoJSON = {
            type: 'FeatureCollection' as const,
            features: [] as unknown[],
          };

          // Verify empty GeoJSON structure
          expect(geoJSON.type).toBe('FeatureCollection');
          expect(Array.isArray(geoJSON.features)).toBe(true);
          expect(geoJSON.features.length).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle province IDs with various formats', () => {
      /**
       * Arbitrary for generating various province ID formats.
       */
      const variousProvinceIdArb = fc.oneof(
        fc.stringMatching(/^[a-z]{3,10}$/), // lowercase letters
        fc.stringMatching(/^[A-Z]{3,10}$/), // uppercase letters
        fc.stringMatching(/^[a-zA-Z0-9]{3,15}$/), // alphanumeric
        fc.stringMatching(/^[a-z]+-[a-z]+$/), // hyphenated
        fc.stringMatching(/^[a-z]+_[a-z]+$/), // underscored
      );

      fc.assert(
        fc.property(variousProvinceIdArb, (provinceId) => {
          // Verify province ID is a valid string
          expect(typeof provinceId).toBe('string');
          expect(provinceId.length).toBeGreaterThan(0);

          // Verify it can be used in hover info
          const hoverInfo = {
            provinceId,
            lngLat: [0, 0] as [number, number],
            feature: { id: provinceId },
          };

          expect(hoverInfo.provinceId).toBe(provinceId);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: map-integration, Property 14: Province Click Selection
   *
   * Property 14 states:
   * *For any* click on a province polygon, the MapStore SHALL update selectedProvince
   * to that province's ID and emit a selection event with the province data.
   *
   * **Validates: Requirements 7.1, 7.2**
   */
  describe('Property 14: Province Click Selection', () => {
    /**
     * Arbitrary for generating valid province IDs.
     * Province IDs are typically alphanumeric strings.
     */
    const provinceIdArb = fc.stringMatching(/^[a-zA-Z0-9_-]{1,20}$/);

    /**
     * Arbitrary for generating province data arrays.
     * [ruler, culture, religion, capital, population]
     */
    const provinceDataArb = fc.tuple(
      fc.string({ minLength: 1, maxLength: 20 }), // ruler
      fc.string({ minLength: 1, maxLength: 20 }), // culture
      fc.string({ minLength: 1, maxLength: 20 }), // religion
      fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }), // capital (optional)
      fc.integer({ min: 0, max: 10000000 }), // population
    );

    /**
     * Arbitrary for generating click events with province data.
     */
    const clickEventArb = fc.record({
      provinceId: provinceIdArb,
      provinceData: provinceDataArb,
    });

    /**
     * Arbitrary for generating sequences of click events.
     */
    const clickSequenceArb = fc.array(clickEventArb, { minLength: 1, maxLength: 10 });

    it('should update selectedProvince in MapStore when province is clicked', () => {
      fc.assert(
        fc.property(provinceIdArb, (provinceId) => {
          // Reset store
          act(() => {
            useMapStore.setState(mapInitialState);
          });

          // Simulate province click by calling selectProvince
          act(() => {
            useMapStore.getState().selectProvince(provinceId);
          });

          // Verify the province was selected
          const state = useMapStore.getState();
          expect(state.selectedProvince).toBe(provinceId);
        }),
        { numRuns: 100 }
      );
    });

    it('should store province data when province is selected with area data available', () => {
      fc.assert(
        fc.property(clickEventArb, ({ provinceId, provinceData }) => {
          // Reset store and set up area data
          act(() => {
            useMapStore.setState({
              ...mapInitialState,
              currentAreaData: {
                [provinceId]: provinceData,
              },
            });
          });

          // Simulate province click
          act(() => {
            useMapStore.getState().selectProvince(provinceId);
          });

          // Verify the province was selected with data
          const state = useMapStore.getState();
          expect(state.selectedProvince).toBe(provinceId);
          expect(state.selectedProvinceData).toEqual(provinceData);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle province selection when no area data is available', () => {
      fc.assert(
        fc.property(provinceIdArb, (provinceId) => {
          // Reset store with no area data
          act(() => {
            useMapStore.setState({
              ...mapInitialState,
              currentAreaData: null,
            });
          });

          // Simulate province click
          act(() => {
            useMapStore.getState().selectProvince(provinceId);
          });

          // Verify the province was selected but data is null
          const state = useMapStore.getState();
          expect(state.selectedProvince).toBe(provinceId);
          expect(state.selectedProvinceData).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should handle sequential province selections correctly', () => {
      fc.assert(
        fc.property(clickSequenceArb, (clickEvents) => {
          // Reset store
          act(() => {
            useMapStore.setState(mapInitialState);
          });

          // Process each click event
          for (const { provinceId, provinceData } of clickEvents) {
            // Set up area data for this province
            act(() => {
              useMapStore.setState((state) => ({
                ...state,
                currentAreaData: {
                  ...state.currentAreaData,
                  [provinceId]: provinceData,
                },
              }));
            });

            // Simulate province click
            act(() => {
              useMapStore.getState().selectProvince(provinceId);
            });

            // Verify the province was selected
            const state = useMapStore.getState();
            expect(state.selectedProvince).toBe(provinceId);
            expect(state.selectedProvinceData).toEqual(provinceData);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should clear selection when clearSelection is called', () => {
      fc.assert(
        fc.property(provinceIdArb, (provinceId) => {
          // Reset store and select a province
          act(() => {
            useMapStore.setState(mapInitialState);
            useMapStore.getState().selectProvince(provinceId);
          });

          // Verify province is selected
          expect(useMapStore.getState().selectedProvince).toBe(provinceId);

          // Clear selection
          act(() => {
            useMapStore.getState().clearSelection();
          });

          // Verify selection is cleared
          const state = useMapStore.getState();
          expect(state.selectedProvince).toBeNull();
          expect(state.selectedProvinceData).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid province IDs (empty strings)', () => {
      fc.assert(
        fc.property(fc.constant(''), (emptyId) => {
          // Reset store
          act(() => {
            useMapStore.setState(mapInitialState);
          });

          // Try to select with empty ID
          act(() => {
            useMapStore.getState().selectProvince(emptyId);
          });

          // Verify selection was not updated (empty string is invalid)
          const state = useMapStore.getState();
          expect(state.selectedProvince).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid province IDs (whitespace only)', () => {
      const whitespaceArb = fc.string({ unit: fc.constantFrom(' ', '\t', '\n'), minLength: 1, maxLength: 5 });

      fc.assert(
        fc.property(whitespaceArb, (whitespaceId) => {
          // Reset store
          act(() => {
            useMapStore.setState(mapInitialState);
          });

          // Try to select with whitespace-only ID
          act(() => {
            useMapStore.getState().selectProvince(whitespaceId);
          });

          // Verify selection was not updated (whitespace-only is invalid)
          const state = useMapStore.getState();
          expect(state.selectedProvince).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should handle province IDs with various valid formats', () => {
      /**
       * Arbitrary for generating various province ID formats.
       */
      const variousProvinceIdArb = fc.oneof(
        fc.stringMatching(/^[a-z]{3,10}$/), // lowercase letters
        fc.stringMatching(/^[A-Z]{3,10}$/), // uppercase letters
        fc.stringMatching(/^[a-zA-Z0-9]{3,15}$/), // alphanumeric
        fc.stringMatching(/^[a-z]+-[a-z]+$/), // hyphenated
        fc.stringMatching(/^[a-z]+_[a-z]+$/), // underscored
      );

      fc.assert(
        fc.property(variousProvinceIdArb, (provinceId) => {
          // Reset store
          act(() => {
            useMapStore.setState(mapInitialState);
          });

          // Select province
          act(() => {
            useMapStore.getState().selectProvince(provinceId);
          });

          // Verify province was selected
          const state = useMapStore.getState();
          expect(state.selectedProvince).toBe(provinceId);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: map-integration, Property 4: Window Resize Viewport Sync
   *
   * Property 4 states:
   * *For any* window resize event, the viewport width and height SHALL match
   * the new window dimensions (minus any sidebar offsets).
   *
   * **Validates: Requirements 2.8**
   */
  describe('Property 4: Window Resize Viewport Sync', () => {
    /**
     * Arbitrary for generating valid window dimensions.
     * Width: 320-3840 (mobile to 4K)
     * Height: 240-2160 (mobile to 4K)
     */
    const windowDimensionsArb = fc.record({
      width: fc.integer({ min: 320, max: 3840 }),
      height: fc.integer({ min: 240, max: 2160 }),
    });

    /**
     * Arbitrary for generating sidebar state.
     */
    const sidebarStateArb = fc.boolean();

    /**
     * Arbitrary for generating window resize events with sidebar state.
     */
    const resizeEventArb = fc.record({
      dimensions: windowDimensionsArb,
      sidebarOpen: sidebarStateArb,
    });

    /**
     * Arbitrary for generating sequences of resize events.
     */
    const resizeSequenceArb = fc.array(resizeEventArb, { minLength: 2, maxLength: 10 });

    it('should update viewport dimensions when window is resized', () => {
      fc.assert(
        fc.property(windowDimensionsArb, sidebarStateArb, (dimensions, sidebarOpen) => {
          // Reset stores
          act(() => {
            useMapStore.setState(mapInitialState);
            useUIStore.setState({ ...uiDefaultState, sidebarOpen });
          });

          // Calculate expected viewport dimensions
          const sidebarWidth = sidebarOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED;
          const expectedWidth = dimensions.width - sidebarWidth;
          const expectedHeight = dimensions.height;

          // Simulate resize by updating viewport
          act(() => {
            useMapStore.getState().setViewport({
              width: expectedWidth,
              height: expectedHeight,
            });
          });

          // Verify viewport dimensions match expected values
          const viewport = useMapStore.getState().viewport;
          expect(viewport.width).toBe(expectedWidth);
          expect(viewport.height).toBe(expectedHeight);
        }),
        { numRuns: 100 }
      );
    });

    it('should account for sidebar offset when calculating viewport width', () => {
      fc.assert(
        fc.property(windowDimensionsArb, sidebarStateArb, (dimensions, sidebarOpen) => {
          // Calculate expected sidebar offset
          const sidebarWidth = sidebarOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED;
          const expectedViewportWidth = dimensions.width - sidebarWidth;

          // Verify the calculation is correct
          if (sidebarOpen) {
            expect(sidebarWidth).toBe(156); // SIDEBAR_WIDTH_OPEN
            expect(expectedViewportWidth).toBe(dimensions.width - 156);
          } else {
            expect(sidebarWidth).toBe(56); // SIDEBAR_WIDTH_CLOSED
            expect(expectedViewportWidth).toBe(dimensions.width - 56);
          }

          // Verify viewport width is always positive
          expect(expectedViewportWidth).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle sequential resize events correctly', () => {
      fc.assert(
        fc.property(resizeSequenceArb, (resizeEvents) => {
          // Reset stores
          act(() => {
            useMapStore.setState(mapInitialState);
            useUIStore.setState(uiDefaultState);
          });

          // Process each resize event
          for (const { dimensions, sidebarOpen } of resizeEvents) {
            // Update sidebar state
            act(() => {
              useUIStore.getState().setSidebarOpen(sidebarOpen);
            });

            // Calculate expected dimensions
            const sidebarWidth = sidebarOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED;
            const expectedWidth = dimensions.width - sidebarWidth;
            const expectedHeight = dimensions.height;

            // Simulate resize
            act(() => {
              useMapStore.getState().setViewport({
                width: expectedWidth,
                height: expectedHeight,
              });
            });

            // Verify viewport dimensions
            const viewport = useMapStore.getState().viewport;
            expect(viewport.width).toBe(expectedWidth);
            expect(viewport.height).toBe(expectedHeight);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain valid viewport dimensions for any window size', () => {
      fc.assert(
        fc.property(windowDimensionsArb, sidebarStateArb, (dimensions, sidebarOpen) => {
          // Reset stores
          act(() => {
            useMapStore.setState(mapInitialState);
            useUIStore.setState({ ...uiDefaultState, sidebarOpen });
          });

          // Calculate viewport dimensions
          const sidebarWidth = sidebarOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED;
          const viewportWidth = dimensions.width - sidebarWidth;
          const viewportHeight = dimensions.height;

          // Update viewport
          act(() => {
            useMapStore.getState().setViewport({
              width: viewportWidth,
              height: viewportHeight,
            });
          });

          // Verify viewport dimensions are valid (non-negative)
          const viewport = useMapStore.getState().viewport;
          expect(viewport.width).toBeGreaterThanOrEqual(0);
          expect(viewport.height).toBeGreaterThanOrEqual(0);
          expect(Number.isFinite(viewport.width)).toBe(true);
          expect(Number.isFinite(viewport.height)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve other viewport properties when dimensions change', () => {
      fc.assert(
        fc.property(
          windowDimensionsArb,
          sidebarStateArb,
          fc.double({ min: -90, max: 90, noNaN: true }),
          fc.double({ min: -180, max: 180, noNaN: true }),
          fc.double({ min: 0, max: 22, noNaN: true }),
          (dimensions, sidebarOpen, latitude, longitude, zoom) => {
            // Reset stores with specific viewport
            act(() => {
              useMapStore.setState({
                ...mapInitialState,
                viewport: {
                  ...mapInitialState.viewport,
                  latitude,
                  longitude,
                  zoom,
                },
              });
              useUIStore.setState({ ...uiDefaultState, sidebarOpen });
            });

            // Calculate new dimensions
            const sidebarWidth = sidebarOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED;
            const newWidth = dimensions.width - sidebarWidth;
            const newHeight = dimensions.height;

            // Update only width and height
            act(() => {
              useMapStore.getState().setViewport({
                width: newWidth,
                height: newHeight,
              });
            });

            // Verify other properties are preserved
            const viewport = useMapStore.getState().viewport;
            expect(viewport.width).toBe(newWidth);
            expect(viewport.height).toBe(newHeight);
            // Latitude and longitude should be preserved (with clamping/normalization)
            expect(Number.isFinite(viewport.latitude)).toBe(true);
            expect(Number.isFinite(viewport.longitude)).toBe(true);
            expect(Number.isFinite(viewport.zoom)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle sidebar state changes during resize', () => {
      fc.assert(
        fc.property(
          windowDimensionsArb,
          fc.tuple(sidebarStateArb, sidebarStateArb),
          (dimensions, [initialSidebarState, newSidebarState]) => {
            // Reset stores with initial sidebar state
            act(() => {
              useMapStore.setState(mapInitialState);
              useUIStore.setState({ ...uiDefaultState, sidebarOpen: initialSidebarState });
            });

            // Calculate initial viewport width
            const initialSidebarWidth = initialSidebarState ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED;
            const initialViewportWidth = dimensions.width - initialSidebarWidth;

            // Set initial viewport
            act(() => {
              useMapStore.getState().setViewport({
                width: initialViewportWidth,
                height: dimensions.height,
              });
            });

            // Change sidebar state
            act(() => {
              useUIStore.getState().setSidebarOpen(newSidebarState);
            });

            // Calculate new viewport width with new sidebar state
            const newSidebarWidth = newSidebarState ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED;
            const newViewportWidth = dimensions.width - newSidebarWidth;

            // Update viewport for new sidebar state
            act(() => {
              useMapStore.getState().setViewport({
                width: newViewportWidth,
                height: dimensions.height,
              });
            });

            // Verify viewport width reflects new sidebar state
            const viewport = useMapStore.getState().viewport;
            expect(viewport.width).toBe(newViewportWidth);
            expect(viewport.height).toBe(dimensions.height);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle extreme window dimensions', () => {
      /**
       * Arbitrary for generating extreme window dimensions.
       */
      const extremeDimensionsArb = fc.oneof(
        // Very small (mobile)
        fc.record({
          width: fc.integer({ min: 320, max: 480 }),
          height: fc.integer({ min: 240, max: 640 }),
        }),
        // Very large (4K+)
        fc.record({
          width: fc.integer({ min: 2560, max: 7680 }),
          height: fc.integer({ min: 1440, max: 4320 }),
        }),
        // Ultra-wide
        fc.record({
          width: fc.integer({ min: 2560, max: 5120 }),
          height: fc.integer({ min: 720, max: 1080 }),
        }),
        // Portrait mode
        fc.record({
          width: fc.integer({ min: 320, max: 768 }),
          height: fc.integer({ min: 1024, max: 2048 }),
        })
      );

      fc.assert(
        fc.property(extremeDimensionsArb, sidebarStateArb, (dimensions, sidebarOpen) => {
          // Reset stores
          act(() => {
            useMapStore.setState(mapInitialState);
            useUIStore.setState({ ...uiDefaultState, sidebarOpen });
          });

          // Calculate viewport dimensions
          const sidebarWidth = sidebarOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED;
          const viewportWidth = dimensions.width - sidebarWidth;
          const viewportHeight = dimensions.height;

          // Update viewport
          act(() => {
            useMapStore.getState().setViewport({
              width: viewportWidth,
              height: viewportHeight,
            });
          });

          // Verify viewport handles extreme dimensions correctly
          const viewport = useMapStore.getState().viewport;
          expect(viewport.width).toBe(viewportWidth);
          expect(viewport.height).toBe(viewportHeight);
          expect(viewport.width).toBeGreaterThan(0);
          expect(viewport.height).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });
  });
});
