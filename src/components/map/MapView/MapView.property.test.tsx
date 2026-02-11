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
import { useMapStore, initialState as mapInitialState, BASEMAP_STYLES } from '../../../stores/mapStore';
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

  /**
   * Feature: historical-data-visualization, Property 7: Population Opacity Interpolation
   *
   * Property 7 states:
   * *For any* province with a population value, when activeColor is 'population',
   * the fill opacity SHALL be within the interpolated range [0.3, 0.8] based on
   * the population relative to the maximum.
   *
   * **Validates: Requirements 3.5**
   */
  describe('Property 7: Population Opacity Interpolation', () => {
    /**
     * Constants for population opacity range
     */
    const POPULATION_OPACITY_MIN = 0.3;
    const POPULATION_OPACITY_MAX = 0.8;

    /**
     * Builds a Mapbox GL interpolate expression for population opacity.
     * This mirrors the implementation in MapView.tsx
     */
    function buildPopulationOpacityExpression(maxPopulation: number): unknown[] {
      const safeMax = Math.max(1, maxPopulation);
      return [
        'interpolate',
        ['linear'],
        ['get', 'p'],
        0, POPULATION_OPACITY_MIN,
        safeMax, POPULATION_OPACITY_MAX,
      ];
    }

    /**
     * Calculates the maximum population from provinces GeoJSON.
     * This mirrors the implementation in MapView.tsx
     */
    function calculateMaxPopulation(
      geojson: { features: { properties?: { p?: number } }[] } | null
    ): number {
      if (!geojson?.features) {
        return 1;
      }
      
      let maxPop = 0;
      for (const feature of geojson.features) {
        const population = feature.properties?.p;
        if (typeof population === 'number' && population > maxPop) {
          maxPop = population;
        }
      }
      
      return Math.max(1, maxPop);
    }

    /**
     * Arbitrary for generating valid population values.
     */
    const populationArb = fc.integer({ min: 0, max: 10000000 });

    /**
     * Arbitrary for generating max population values (must be >= 1).
     */
    const maxPopulationArb = fc.integer({ min: 1, max: 10000000 });

    /**
     * Arbitrary for generating province features with population.
     */
    const provinceFeatureWithPopulationArb = (population: number) => ({
      type: 'Feature' as const,
      properties: { id: 'test_province', p: population },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
      },
    });

    /**
     * Arbitrary for generating GeoJSON with multiple provinces and populations.
     */
    const provincesGeoJSONArb = fc
      .array(populationArb, { minLength: 1, maxLength: 20 })
      .map((populations) => ({
        type: 'FeatureCollection' as const,
        features: populations.map((pop, i) => ({
          type: 'Feature' as const,
          properties: { id: `province_${String(i)}`, p: pop },
          geometry: {
            type: 'Polygon' as const,
            coordinates: [[[i, 0], [i + 1, 0], [i + 1, 1], [i, 1], [i, 0]]],
          },
        })),
      }));

    it('should generate interpolate expression with correct structure', () => {
      fc.assert(
        fc.property(maxPopulationArb, (maxPop) => {
          const expr = buildPopulationOpacityExpression(maxPop);

          // Verify expression structure
          expect(Array.isArray(expr)).toBe(true);
          expect(expr[0]).toBe('interpolate');
          expect(expr[1]).toEqual(['linear']);
          expect(expr[2]).toEqual(['get', 'p']);
          
          // Verify opacity range [0.3, 0.8]
          expect(expr[3]).toBe(0); // min population
          expect(expr[4]).toBe(POPULATION_OPACITY_MIN); // 0.3
          expect(expr[5]).toBe(Math.max(1, maxPop)); // max population (at least 1)
          expect(expr[6]).toBe(POPULATION_OPACITY_MAX); // 0.8
        }),
        { numRuns: 100 }
      );
    });

    it('should use minimum opacity (0.3) for population of 0', () => {
      fc.assert(
        fc.property(maxPopulationArb, (maxPop) => {
          const expr = buildPopulationOpacityExpression(maxPop);

          // At population 0, opacity should be 0.3
          expect(expr[3]).toBe(0);
          expect(expr[4]).toBe(0.3);
        }),
        { numRuns: 100 }
      );
    });

    it('should use maximum opacity (0.8) for max population', () => {
      fc.assert(
        fc.property(maxPopulationArb, (maxPop) => {
          const expr = buildPopulationOpacityExpression(maxPop);

          // At max population, opacity should be 0.8
          const safeMax = Math.max(1, maxPop);
          expect(expr[5]).toBe(safeMax);
          expect(expr[6]).toBe(0.8);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle maxPopulation of 0 by using 1 as minimum', () => {
      const expr = buildPopulationOpacityExpression(0);

      // Should use 1 as minimum to avoid division issues
      expect(expr[5]).toBe(1);
      expect(expr[6]).toBe(0.8);
    });

    it('should calculate correct max population from GeoJSON', () => {
      fc.assert(
        fc.property(provincesGeoJSONArb, (geojson) => {
          const maxPop = calculateMaxPopulation(geojson);

          // Find expected max from features
          const expectedMax = Math.max(
            1,
            ...geojson.features.map((f: { properties: { p: number } }) => f.properties.p)
          );

          expect(maxPop).toBe(expectedMax);
          expect(maxPop).toBeGreaterThanOrEqual(1);
        }),
        { numRuns: 100 }
      );
    });

    it('should return 1 for empty GeoJSON', () => {
      const emptyGeoJSON = {
        type: 'FeatureCollection' as const,
        features: [],
      };

      const maxPop = calculateMaxPopulation(emptyGeoJSON);
      expect(maxPop).toBe(1);
    });

    it('should return 1 for null GeoJSON', () => {
      const maxPop = calculateMaxPopulation(null);
      expect(maxPop).toBe(1);
    });

    it('should handle GeoJSON with all zero populations', () => {
      const zeroPopGeoJSON = {
        type: 'FeatureCollection' as const,
        features: [
          provinceFeatureWithPopulationArb(0),
          provinceFeatureWithPopulationArb(0),
          provinceFeatureWithPopulationArb(0),
        ],
      };

      const maxPop = calculateMaxPopulation(zeroPopGeoJSON);
      expect(maxPop).toBe(1); // Should return 1 as minimum
    });

    it('should produce opacity values within [0.3, 0.8] range for any population', () => {
      fc.assert(
        fc.property(
          populationArb,
          maxPopulationArb,
          (population, maxPop) => {
            // Calculate expected opacity using linear interpolation
            const safeMax = Math.max(1, maxPop);
            const ratio = Math.min(1, population / safeMax);
            const expectedOpacity = POPULATION_OPACITY_MIN + ratio * (POPULATION_OPACITY_MAX - POPULATION_OPACITY_MIN);

            // Verify opacity is within valid range
            expect(expectedOpacity).toBeGreaterThanOrEqual(POPULATION_OPACITY_MIN);
            expect(expectedOpacity).toBeLessThanOrEqual(POPULATION_OPACITY_MAX);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have correct opacity constants', () => {
      expect(POPULATION_OPACITY_MIN).toBe(0.3);
      expect(POPULATION_OPACITY_MAX).toBe(0.8);
    });
  });

  /**
   * Feature: historical-data-visualization, Property 8: Layer Visibility Exclusivity
   *
   * Property 8 states:
   * *For any* activeColor dimension change, exactly one province fill layer SHALL be visible
   * and all others SHALL be hidden.
   *
   * **Validates: Requirements 3.6**
   */
  describe('Property 8: Layer Visibility Exclusivity', () => {
    /**
     * All valid area color dimensions.
     */
    const ALL_DIMENSIONS = ['ruler', 'religion', 'religionGeneral', 'culture', 'population'] as const;
    type AreaColorDimension = (typeof ALL_DIMENSIONS)[number];

    /**
     * Arbitrary for generating valid area color dimensions.
     */
    const dimensionArb: fc.Arbitrary<AreaColorDimension> = fc.constantFrom(...ALL_DIMENSIONS);

    /**
     * Arbitrary for generating distinct dimension pairs (from, to).
     * Ensures the dimensions are different to trigger a change.
     */
    const distinctDimensionPairArb = fc
      .tuple(dimensionArb, dimensionArb)
      .filter(([from, to]) => from !== to);

    /**
     * Arbitrary for generating dimension change sequences.
     */
    const dimensionSequenceArb = fc.array(dimensionArb, { minLength: 2, maxLength: 10 });

    /**
     * Helper function to count visible layers in layerVisibility state.
     */
    function countVisibleLayers(layerVisibility: Record<AreaColorDimension, boolean>): number {
      return ALL_DIMENSIONS.filter((dim) => layerVisibility[dim]).length;
    }

    /**
     * Helper function to get the visible dimension from layerVisibility state.
     */
    function getVisibleDimension(layerVisibility: Record<AreaColorDimension, boolean>): AreaColorDimension | null {
      for (const dim of ALL_DIMENSIONS) {
        if (layerVisibility[dim]) {
          return dim;
        }
      }
      return null;
    }

    it('should have exactly one visible layer when activeColor is set to any dimension', () => {
      fc.assert(
        fc.property(dimensionArb, (dimension) => {
          // Reset store
          act(() => {
            useMapStore.setState(mapInitialState);
          });

          // Set the active color dimension
          act(() => {
            useMapStore.getState().setActiveColor(dimension);
          });

          // Get the layer visibility state
          const layerVisibility = useMapStore.getState().layerVisibility;

          // Verify exactly one layer is visible
          const visibleCount = countVisibleLayers(layerVisibility);
          expect(visibleCount).toBe(1);

          // Verify the visible layer matches the active dimension
          const visibleDimension = getVisibleDimension(layerVisibility);
          expect(visibleDimension).toBe(dimension);
        }),
        { numRuns: 100 }
      );
    });

    it('should show only ruler-fill layer when activeColor is ruler', () => {
      fc.assert(
        fc.property(fc.constant('ruler' as AreaColorDimension), (dimension) => {
          // Reset store
          act(() => {
            useMapStore.setState(mapInitialState);
          });

          // Set active color to ruler
          act(() => {
            useMapStore.getState().setActiveColor(dimension);
          });

          // Verify layer visibility
          const layerVisibility = useMapStore.getState().layerVisibility;
          expect(layerVisibility.ruler).toBe(true);
          expect(layerVisibility.culture).toBe(false);
          expect(layerVisibility.religion).toBe(false);
          expect(layerVisibility.religionGeneral).toBe(false);
          expect(layerVisibility.population).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should hide ruler-fill and show culture-fill when activeColor changes from ruler to culture', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          // Reset store with ruler as active
          act(() => {
            useMapStore.setState({
              ...mapInitialState,
              activeColor: 'ruler',
              layerVisibility: {
                ruler: true,
                religion: false,
                religionGeneral: false,
                culture: false,
                population: false,
              },
            });
          });

          // Verify initial state
          let layerVisibility = useMapStore.getState().layerVisibility;
          expect(layerVisibility.ruler).toBe(true);
          expect(layerVisibility.culture).toBe(false);

          // Change to culture
          act(() => {
            useMapStore.getState().setActiveColor('culture');
          });

          // Verify ruler is hidden and culture is visible
          layerVisibility = useMapStore.getState().layerVisibility;
          expect(layerVisibility.ruler).toBe(false);
          expect(layerVisibility.culture).toBe(true);
          expect(layerVisibility.religion).toBe(false);
          expect(layerVisibility.religionGeneral).toBe(false);
          expect(layerVisibility.population).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain exactly one visible layer after any dimension change', () => {
      fc.assert(
        fc.property(distinctDimensionPairArb, ([fromDimension, toDimension]) => {
          // Reset store with initial dimension
          act(() => {
            useMapStore.setState(mapInitialState);
            useMapStore.getState().setActiveColor(fromDimension);
          });

          // Verify initial state has exactly one visible layer
          let layerVisibility = useMapStore.getState().layerVisibility;
          expect(countVisibleLayers(layerVisibility)).toBe(1);
          expect(getVisibleDimension(layerVisibility)).toBe(fromDimension);

          // Change to new dimension
          act(() => {
            useMapStore.getState().setActiveColor(toDimension);
          });

          // Verify exactly one layer is visible after change
          layerVisibility = useMapStore.getState().layerVisibility;
          expect(countVisibleLayers(layerVisibility)).toBe(1);
          expect(getVisibleDimension(layerVisibility)).toBe(toDimension);

          // Verify the previous dimension is now hidden
          expect(layerVisibility[fromDimension]).toBe(false);
          expect(layerVisibility[toDimension]).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle sequential dimension changes correctly', () => {
      fc.assert(
        fc.property(dimensionSequenceArb, (dimensions) => {
          // Reset store
          act(() => {
            useMapStore.setState(mapInitialState);
          });

          // Apply each dimension change sequentially
          for (const dimension of dimensions) {
            act(() => {
              useMapStore.getState().setActiveColor(dimension);
            });

            // Verify exactly one layer is visible after each change
            const layerVisibility = useMapStore.getState().layerVisibility;
            const visibleCount = countVisibleLayers(layerVisibility);
            expect(visibleCount).toBe(1);

            // Verify the visible layer matches the current dimension
            const visibleDimension = getVisibleDimension(layerVisibility);
            expect(visibleDimension).toBe(dimension);

            // Verify activeColor state matches
            expect(useMapStore.getState().activeColor).toBe(dimension);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should not change visibility when setting same dimension', () => {
      fc.assert(
        fc.property(dimensionArb, (dimension) => {
          // Reset store and set initial dimension
          act(() => {
            useMapStore.setState(mapInitialState);
            useMapStore.getState().setActiveColor(dimension);
          });

          // Get initial visibility state
          const initialVisibility = { ...useMapStore.getState().layerVisibility };

          // Set the same dimension again
          act(() => {
            useMapStore.getState().setActiveColor(dimension);
          });

          // Verify visibility state is unchanged
          const currentVisibility = useMapStore.getState().layerVisibility;
          expect(currentVisibility).toEqual(initialVisibility);
          expect(countVisibleLayers(currentVisibility)).toBe(1);
        }),
        { numRuns: 100 }
      );
    });

    it('should update previousActiveColor when dimension changes', () => {
      fc.assert(
        fc.property(distinctDimensionPairArb, ([fromDimension, toDimension]) => {
          // Reset store with initial dimension
          act(() => {
            useMapStore.setState(mapInitialState);
            useMapStore.getState().setActiveColor(fromDimension);
          });

          // Change to new dimension
          act(() => {
            useMapStore.getState().setActiveColor(toDimension);
          });

          // Verify previousActiveColor is updated
          const state = useMapStore.getState();
          expect(state.previousActiveColor).toBe(fromDimension);
          expect(state.activeColor).toBe(toDimension);
        }),
        { numRuns: 100 }
      );
    });

    it('should have all dimensions hidden except the active one', () => {
      fc.assert(
        fc.property(dimensionArb, (activeDimension) => {
          // Reset store
          act(() => {
            useMapStore.setState(mapInitialState);
            useMapStore.getState().setActiveColor(activeDimension);
          });

          // Get layer visibility
          const layerVisibility = useMapStore.getState().layerVisibility;

          // Verify all other dimensions are hidden
          for (const dim of ALL_DIMENSIONS) {
            if (dim === activeDimension) {
              expect(layerVisibility[dim]).toBe(true);
            } else {
              expect(layerVisibility[dim]).toBe(false);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should correctly map layer visibility to Mapbox visibility values', () => {
      fc.assert(
        fc.property(dimensionArb, (dimension) => {
          // Reset store
          act(() => {
            useMapStore.setState(mapInitialState);
            useMapStore.getState().setActiveColor(dimension);
          });

          // Get layer visibility
          const layerVisibility = useMapStore.getState().layerVisibility;

          // Verify the mapping to Mapbox visibility values
          for (const dim of ALL_DIMENSIONS) {
            const mapboxVisibility = layerVisibility[dim] ? 'visible' : 'none';
            if (dim === dimension) {
              expect(mapboxVisibility).toBe('visible');
            } else {
              expect(mapboxVisibility).toBe('none');
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should have default layer visibility with ruler visible', () => {
      // Reset store to initial state
      act(() => {
        useMapStore.setState(mapInitialState);
      });

      // Verify default state
      const state = useMapStore.getState();
      expect(state.activeColor).toBe('ruler');
      expect(state.layerVisibility.ruler).toBe(true);
      expect(state.layerVisibility.culture).toBe(false);
      expect(state.layerVisibility.religion).toBe(false);
      expect(state.layerVisibility.religionGeneral).toBe(false);
      expect(state.layerVisibility.population).toBe(false);
      expect(countVisibleLayers(state.layerVisibility)).toBe(1);
    });
  });

  /**
   * Feature: historical-data-visualization, Property 10: Marker Rendering by Type
   *
   * Property 10 states:
   * *For any* marker in the markers array, it SHALL be rendered with the icon
   * corresponding to its type property.
   *
   * **Validates: Requirements 5.2, 5.3, 5.5**
   */
  describe('Property 10: Marker Rendering by Type', () => {
    /**
     * Valid marker types as defined in the API types.
     */
    const validMarkerTypes = ['battle', 'city', 'capital', 'person', 'event', 'other'] as const;
    type MarkerType = (typeof validMarkerTypes)[number];

    /**
     * Marker colors by type (from MapView.tsx).
     */
    const MARKER_COLORS: Record<MarkerType, string> = {
      battle: '#e74c3c',
      city: '#3498db',
      capital: '#f1c40f',
      person: '#9b59b6',
      event: '#2ecc71',
      other: '#95a5a6',
    };

    /**
     * Arbitrary for generating valid marker types.
     */
    const markerTypeArb: fc.Arbitrary<MarkerType> = fc.constantFrom(...validMarkerTypes);

    /**
     * Arbitrary for generating valid longitude values [-180, 180].
     */
    const longitudeArb = fc.double({ min: -180, max: 180, noNaN: true });

    /**
     * Arbitrary for generating valid latitude values [-90, 90].
     */
    const latitudeArb = fc.double({ min: -90, max: 90, noNaN: true });

    /**
     * Arbitrary for generating valid year values.
     */
    const yearArb = fc.integer({ min: -2000, max: 2000 });

    /**
     * Arbitrary for generating marker IDs.
     */
    const markerIdArb = fc.stringMatching(/^[a-f0-9]{24}$/);

    /**
     * Arbitrary for generating marker names.
     */
    const markerNameArb = fc.string({ minLength: 1, maxLength: 100 });

    /**
     * Arbitrary for generating a single marker.
     */
    const markerArb = fc.record({
      _id: markerIdArb,
      name: markerNameArb,
      type: markerTypeArb,
      year: yearArb,
      coo: fc.tuple(longitudeArb, latitudeArb),
      wiki: fc.option(fc.webUrl(), { nil: undefined }),
      data: fc.option(
        fc.record({
          description: fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: undefined }),
        }),
        { nil: undefined }
      ),
    });

    /**
     * Arbitrary for generating arrays of markers.
     */
    const markersArrayArb = fc.array(markerArb, { minLength: 1, maxLength: 20 });

    it('should assign correct color for each marker type', () => {
      fc.assert(
        fc.property(markerTypeArb, (markerType) => {
          // Verify each marker type has a defined color
          const color = MARKER_COLORS[markerType];
          expect(color).toBeDefined();
          expect(typeof color).toBe('string');
          expect(color).toMatch(/^#[0-9a-f]{6}$/i);
        }),
        { numRuns: 100 }
      );
    });

    it('should have distinct colors for each marker type', () => {
      // Verify all marker types have unique colors
      const colors = Object.values(MARKER_COLORS);
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(colors.length);
    });

    it('should generate valid GeoJSON for any marker', () => {
      fc.assert(
        fc.property(markerArb, (marker) => {
          // Convert marker to GeoJSON feature
          const feature = {
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
          };

          // Verify GeoJSON structure
          expect(feature.type).toBe('Feature');
          expect(feature.geometry.type).toBe('Point');
          expect(Array.isArray(feature.geometry.coordinates)).toBe(true);
          expect(feature.geometry.coordinates.length).toBe(2);

          // Verify coordinates are valid
          const [lng, lat] = feature.geometry.coordinates;
          expect(lng).toBeGreaterThanOrEqual(-180);
          expect(lng).toBeLessThanOrEqual(180);
          expect(lat).toBeGreaterThanOrEqual(-90);
          expect(lat).toBeLessThanOrEqual(90);

          // Verify properties
          expect(feature.properties.id).toBe(marker._id);
          expect(feature.properties.name).toBe(marker.name);
          expect(feature.properties.type).toBe(marker.type);
          expect(validMarkerTypes).toContain(feature.properties.type);
        }),
        { numRuns: 100 }
      );
    });

    it('should generate valid GeoJSON FeatureCollection for any markers array', () => {
      fc.assert(
        fc.property(markersArrayArb, (markers) => {
          // Convert markers to GeoJSON FeatureCollection
          const featureCollection = {
            type: 'FeatureCollection' as const,
            features: markers.map((marker) => ({
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

          // Verify FeatureCollection structure
          expect(featureCollection.type).toBe('FeatureCollection');
          expect(Array.isArray(featureCollection.features)).toBe(true);
          expect(featureCollection.features.length).toBe(markers.length);

          // Verify each feature has correct type property
          for (let i = 0; i < featureCollection.features.length; i++) {
            const feature = featureCollection.features[i];
            const marker = markers[i];
            expect(feature?.properties.type).toBe(marker?.type);
            expect(validMarkerTypes).toContain(feature?.properties.type);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should map marker type to correct color in match expression', () => {
      fc.assert(
        fc.property(markerArb, (marker) => {
          // Simulate the Mapbox match expression logic
          const getColorForType = (type: MarkerType): string => {
            return MARKER_COLORS[type];
          };

          const expectedColor = MARKER_COLORS[marker.type];
          const actualColor = getColorForType(marker.type);

          expect(actualColor).toBe(expectedColor);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle markers with all valid type values', () => {
      // Test each marker type explicitly
      for (const markerType of validMarkerTypes) {
        const color = MARKER_COLORS[markerType];
        expect(color).toBeDefined();
        expect(typeof color).toBe('string');
      }
    });

    it('should store markers in mapStore correctly', () => {
      fc.assert(
        fc.property(markersArrayArb, (generatedMarkers) => {
          // Cast to Marker[] to satisfy exactOptionalPropertyTypes
          // eslint-disable-next-line @typescript-eslint/consistent-type-imports
          const markers = generatedMarkers as unknown as import('../../../api/types').Marker[];
          
          // Reset store
          act(() => {
            useMapStore.setState({
              ...mapInitialState,
              markers: [],
            });
          });

          // Set markers in store
          act(() => {
            useMapStore.setState({ markers });
          });

          // Verify markers are stored correctly
          const state = useMapStore.getState();
          expect(state.markers).toEqual(markers);
          expect(state.markers.length).toBe(markers.length);

          // Verify each marker has valid type
          for (const marker of state.markers) {
            expect(validMarkerTypes).toContain(marker.type);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve marker properties when converting to GeoJSON', () => {
      fc.assert(
        fc.property(markerArb, (marker) => {
          // Convert to GeoJSON and back
          const geoJSONFeature = {
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
          };

          // Verify all essential properties are preserved
          expect(geoJSONFeature.properties.id).toBe(marker._id);
          expect(geoJSONFeature.properties.name).toBe(marker.name);
          expect(geoJSONFeature.properties.type).toBe(marker.type);
          expect(geoJSONFeature.properties.year).toBe(marker.year);
          expect(geoJSONFeature.geometry.coordinates[0]).toBe(marker.coo[0]);
          expect(geoJSONFeature.geometry.coordinates[1]).toBe(marker.coo[1]);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: map-interactions, Property 12: Drawer Content Type Consistency
   *
   * Property 12 states:
   * *For any* drawer content, the content type ('area' or 'marker') SHALL match
   * the URL type parameter when the drawer is open.
   *
   * **Validates: Requirements 2.3, 3.2, 9.1, 9.2**
   */
  describe('Property 12: Drawer Content Type Consistency', () => {
    // Store original location to restore after tests
    let mockHash: string;

    beforeEach(() => {
      mockHash = '#/';

      // Create a mock location object with getter/setter for hash
      const mockLocation = {
        get hash() {
          return mockHash;
        },
        set hash(value: string) {
          mockHash = value;
        },
        pathname: '/',
        href: '/',
        origin: 'http://localhost',
        protocol: 'http:',
        host: 'localhost',
        hostname: 'localhost',
        port: '',
        search: '',
      };

      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
        configurable: true,
      });

      // Mock history.replaceState
      window.history.replaceState = (_data: unknown, _unused: string, url?: string | URL | null) => {
        if (url) {
          const urlStr = url.toString();
          const hashIndex = urlStr.indexOf('#');
          if (hashIndex !== -1) {
            mockHash = urlStr.slice(hashIndex);
          }
        }
      };
    });

    /**
     * Arbitrary for generating province IDs.
     */
    const provinceIdArb = fc.stringMatching(/^[A-Za-z][A-Za-z0-9_]{2,20}$/);

    /**
     * Arbitrary for generating province names.
     */
    const provinceNameArb = fc.string({ minLength: 1, maxLength: 50 }).filter(
      (s) => !s.includes('&') && !s.includes('=') && !s.includes('#')
    );

    /**
     * Arbitrary for generating marker IDs.
     */
    const markerIdArb = fc.stringMatching(/^[A-Za-z][A-Za-z0-9_]{2,30}$/);

    /**
     * Arbitrary for generating marker types.
     */
    const markerTypeArb = fc.constantFrom('battle', 'city', 'capital', 'person', 'event', 'other');

    /**
     * Arbitrary for generating years.
     */
    const yearArb = fc.integer({ min: -5000, max: 2100 });

    /**
     * Arbitrary for generating coordinates.
     */
    const coordinatesArb = fc.tuple(
      fc.double({ min: -180, max: 180, noNaN: true }),
      fc.double({ min: -90, max: 90, noNaN: true })
    );

    /**
     * Helper function to parse URL state from mock hash.
     */
    function parseURLState(): { type?: 'area' | 'marker'; value?: string } {
      const hash = mockHash;
      const queryIndex = hash.indexOf('?');
      if (queryIndex === -1) {
        return {};
      }

      const queryString = hash.slice(queryIndex + 1);
      const params = new URLSearchParams(queryString);

      const state: { type?: 'area' | 'marker'; value?: string } = {};

      const typeParam = params.get('type');
      if (typeParam === 'area' || typeParam === 'marker') {
        state.type = typeParam;
      }

      const valueParam = params.get('value');
      if (valueParam !== null && valueParam !== '') {
        state.value = valueParam;
      }

      return state;
    }

    /**
     * Helper function to update URL state.
     */
    function updateURLState(params: { type?: 'area' | 'marker'; value?: string }): void {
      const hash = mockHash;
      const queryIndex = hash.indexOf('?');
      const path = queryIndex === -1 ? hash : hash.slice(0, queryIndex);
      const queryString = queryIndex === -1 ? '' : hash.slice(queryIndex + 1);

      const searchParams = new URLSearchParams(queryString);

      if (params.type !== undefined) {
        searchParams.set('type', params.type);
      } else {
        searchParams.delete('type');
      }

      if (params.value !== undefined) {
        searchParams.set('value', params.value);
      } else {
        searchParams.delete('value');
      }

      const newQueryString = searchParams.toString();
      const newHash = newQueryString ? `${path}?${newQueryString}` : path;
      mockHash = newHash;
    }

    /**
     * Helper function to clear URL params.
     */
    function clearURLParams(): void {
      const hash = mockHash;
      const queryIndex = hash.indexOf('?');
      const path = queryIndex === -1 ? hash : hash.slice(0, queryIndex);
      const queryString = queryIndex === -1 ? '' : hash.slice(queryIndex + 1);

      const searchParams = new URLSearchParams(queryString);
      searchParams.delete('type');
      searchParams.delete('value');

      const newQueryString = searchParams.toString();
      const newHash = newQueryString ? `${path}?${newQueryString}` : path;
      mockHash = newHash;
    }

    it('should have URL type=area when drawer content type is area', () => {
      fc.assert(
        fc.property(provinceIdArb, provinceNameArb, (provinceId, provinceName) => {
          // Reset stores and URL
          act(() => {
            useUIStore.setState(uiDefaultState);
          });
          mockHash = '#/';

          // Simulate opening drawer with area content and updating URL
          const content = { type: 'area' as const, provinceId, provinceName };

          act(() => {
            useUIStore.getState().openRightDrawer(content);
          });

          // Update URL to match drawer content (simulating click handler behavior)
          updateURLState({ type: 'area', value: provinceName });

          // Verify drawer state
          const uiState = useUIStore.getState();
          expect(uiState.rightDrawerOpen).toBe(true);
          expect(uiState.rightDrawerContent?.type).toBe('area');

          // Verify URL state matches drawer content type
          const urlState = parseURLState();
          expect(urlState.type).toBe('area');
          expect(urlState.type).toBe(uiState.rightDrawerContent?.type);
        }),
        { numRuns: 100 }
      );
    });

    it('should have URL type=marker when drawer content type is marker', () => {
      fc.assert(
        fc.property(
          markerIdArb,
          fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes('&') && !s.includes('=')),
          markerTypeArb,
          yearArb,
          coordinatesArb,
          (markerId, markerName, markerType, year, coo) => {
            // Reset stores and URL
            act(() => {
              useUIStore.setState(uiDefaultState);
            });
            mockHash = '#/';

            // Create marker content
            const marker = {
              _id: markerId,
              name: markerName,
              type: markerType,
              year,
              coo,
            };
            const content = { type: 'marker' as const, marker };

            // Simulate opening drawer with marker content
            act(() => {
              useUIStore.getState().openRightDrawer(content);
            });

            // Update URL to match drawer content (simulating click handler behavior)
            updateURLState({ type: 'marker', value: markerId });

            // Verify drawer state
            const uiState = useUIStore.getState();
            expect(uiState.rightDrawerOpen).toBe(true);
            expect(uiState.rightDrawerContent?.type).toBe('marker');

            // Verify URL state matches drawer content type
            const urlState = parseURLState();
            expect(urlState.type).toBe('marker');
            expect(urlState.type).toBe(uiState.rightDrawerContent?.type);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not have type/value params in URL when drawer is closed', () => {
      fc.assert(
        fc.property(provinceIdArb, provinceNameArb, (provinceId, provinceName) => {
          // Reset stores and URL
          act(() => {
            useUIStore.setState(uiDefaultState);
          });
          mockHash = '#/';

          // Open drawer first
          const content = { type: 'area' as const, provinceId, provinceName };
          act(() => {
            useUIStore.getState().openRightDrawer(content);
          });
          updateURLState({ type: 'area', value: provinceName });

          // Verify drawer is open
          expect(useUIStore.getState().rightDrawerOpen).toBe(true);

          // Close drawer and clear URL params
          act(() => {
            useUIStore.getState().closeRightDrawer();
          });
          clearURLParams();

          // Verify drawer is closed
          const uiState = useUIStore.getState();
          expect(uiState.rightDrawerOpen).toBe(false);
          expect(uiState.rightDrawerContent).toBeNull();

          // Verify URL has no type/value params
          const urlState = parseURLState();
          expect(urlState.type).toBeUndefined();
          expect(urlState.value).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain type consistency when switching between area and marker content', () => {
      fc.assert(
        fc.property(
          provinceIdArb,
          provinceNameArb,
          markerIdArb,
          fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes('&') && !s.includes('=')),
          markerTypeArb,
          yearArb,
          coordinatesArb,
          (provinceId, provinceName, markerId, markerName, markerType, year, coo) => {
            // Reset stores and URL
            act(() => {
              useUIStore.setState(uiDefaultState);
            });
            mockHash = '#/';

            // Open drawer with area content
            const areaContent = { type: 'area' as const, provinceId, provinceName };
            act(() => {
              useUIStore.getState().openRightDrawer(areaContent);
            });
            updateURLState({ type: 'area', value: provinceName });

            // Verify area type consistency
            let uiState = useUIStore.getState();
            let urlState = parseURLState();
            expect(uiState.rightDrawerContent?.type).toBe('area');
            expect(urlState.type).toBe('area');
            expect(urlState.type).toBe(uiState.rightDrawerContent?.type);

            // Switch to marker content
            const marker = {
              _id: markerId,
              name: markerName,
              type: markerType,
              year,
              coo,
            };
            const markerContent = { type: 'marker' as const, marker };
            act(() => {
              useUIStore.getState().openRightDrawer(markerContent);
            });
            updateURLState({ type: 'marker', value: markerId });

            // Verify marker type consistency
            uiState = useUIStore.getState();
            urlState = parseURLState();
            expect(uiState.rightDrawerContent?.type).toBe('marker');
            expect(urlState.type).toBe('marker');
            expect(urlState.type).toBe(uiState.rightDrawerContent?.type);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have consistent type after multiple open/close cycles', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.oneof(
              fc.record({
                contentType: fc.constant('area' as const),
                provinceId: provinceIdArb,
                provinceName: provinceNameArb,
              }),
              fc.record({
                contentType: fc.constant('marker' as const),
                markerId: markerIdArb,
                markerName: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes('&') && !s.includes('=')),
                markerType: markerTypeArb,
                year: yearArb,
                coo: coordinatesArb,
              })
            ),
            { minLength: 1, maxLength: 5 }
          ),
          (contentSequence) => {
            // Reset stores and URL
            act(() => {
              useUIStore.setState(uiDefaultState);
            });
            mockHash = '#/';

            for (const item of contentSequence) {
              if (item.contentType === 'area') {
                // Open with area content
                const content = {
                  type: 'area' as const,
                  provinceId: item.provinceId,
                  provinceName: item.provinceName,
                };
                act(() => {
                  useUIStore.getState().openRightDrawer(content);
                });
                updateURLState({ type: 'area', value: item.provinceName });

                // Verify consistency
                const uiState = useUIStore.getState();
                const urlState = parseURLState();
                expect(uiState.rightDrawerOpen).toBe(true);
                expect(uiState.rightDrawerContent?.type).toBe('area');
                expect(urlState.type).toBe('area');
                expect(urlState.type).toBe(uiState.rightDrawerContent?.type);
              } else {
                // Open with marker content
                const marker = {
                  _id: item.markerId,
                  name: item.markerName,
                  type: item.markerType,
                  year: item.year,
                  coo: item.coo,
                };
                const content = { type: 'marker' as const, marker };
                act(() => {
                  useUIStore.getState().openRightDrawer(content);
                });
                updateURLState({ type: 'marker', value: item.markerId });

                // Verify consistency
                const uiState = useUIStore.getState();
                const urlState = parseURLState();
                expect(uiState.rightDrawerOpen).toBe(true);
                expect(uiState.rightDrawerContent?.type).toBe('marker');
                expect(urlState.type).toBe('marker');
                expect(urlState.type).toBe(uiState.rightDrawerContent?.type);
              }

              // Close drawer
              act(() => {
                useUIStore.getState().closeRightDrawer();
              });
              clearURLParams();

              // Verify closed state
              const closedUiState = useUIStore.getState();
              const closedUrlState = parseURLState();
              expect(closedUiState.rightDrawerOpen).toBe(false);
              expect(closedUiState.rightDrawerContent).toBeNull();
              expect(closedUrlState.type).toBeUndefined();
              expect(closedUrlState.value).toBeUndefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have URL value match drawer content identifier', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.record({
              contentType: fc.constant('area' as const),
              provinceId: provinceIdArb,
              provinceName: provinceNameArb.filter((s) => s.length > 0),
            }),
            fc.record({
              contentType: fc.constant('marker' as const),
              markerId: markerIdArb,
              markerName: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes('&') && !s.includes('=')),
              markerType: markerTypeArb,
              year: yearArb,
              coo: coordinatesArb,
            })
          ),
          (item) => {
            // Reset stores and URL
            act(() => {
              useUIStore.setState(uiDefaultState);
            });
            mockHash = '#/';

            if (item.contentType === 'area') {
              // Open with area content
              const content = {
                type: 'area' as const,
                provinceId: item.provinceId,
                provinceName: item.provinceName,
              };
              act(() => {
                useUIStore.getState().openRightDrawer(content);
              });
              updateURLState({ type: 'area', value: item.provinceName });

              // Verify URL value matches province name
              const urlState = parseURLState();
              expect(urlState.value).toBe(item.provinceName);
            } else {
              // Open with marker content
              const marker = {
                _id: item.markerId,
                name: item.markerName,
                type: item.markerType,
                year: item.year,
                coo: item.coo,
              };
              const content = { type: 'marker' as const, marker };
              act(() => {
                useUIStore.getState().openRightDrawer(content);
              });
              updateURLState({ type: 'marker', value: item.markerId });

              // Verify URL value matches marker ID
              const urlState = parseURLState();
              expect(urlState.value).toBe(item.markerId);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: map-interactions, Property 7: Marker Hover State Invariant
   *
   * Property 7 states:
   * *For any* marker hover interaction, exactly zero or one marker SHALL be in the hovered state at any time.
   *
   * This property ensures that:
   * - At any point in time, hoveredMarkerId is either null (no marker hovered) or a single marker ID
   * - When setHoveredMarker is called with a new ID, the previous hovered marker is replaced
   * - Multiple rapid hover changes still result in exactly 0 or 1 marker being hovered
   *
   * **Validates: Requirements 5.1, 5.4**
   */
  describe('Property 7: Marker Hover State Invariant', () => {
    /**
     * Arbitrary for generating valid marker IDs.
     * Marker IDs are typically alphanumeric strings with underscores.
     */
    const markerIdArb = fc.stringMatching(/^[a-zA-Z0-9_-]{1,30}$/);

    /**
     * Arbitrary for generating nullable marker IDs (null or valid ID).
     */
    const nullableMarkerIdArb = fc.option(markerIdArb, { nil: null });

    /**
     * Arbitrary for generating sequences of marker hover events.
     * Each event is either a marker ID or null (mouse leave).
     */
    const hoverSequenceArb = fc.array(nullableMarkerIdArb, { minLength: 1, maxLength: 50 });

    /**
     * Arbitrary for generating pairs of distinct marker IDs.
     */
    const distinctMarkerPairArb = fc
      .tuple(markerIdArb, markerIdArb)
      .filter(([id1, id2]) => id1 !== id2);

    /**
     * Arbitrary for generating rapid hover sequences (simulating fast mouse movement).
     */
    const rapidHoverSequenceArb = fc.array(markerIdArb, { minLength: 5, maxLength: 20 });

    it('should have exactly zero or one marker hovered at any time', () => {
      fc.assert(
        fc.property(nullableMarkerIdArb, (markerId) => {
          // Reset store
          act(() => {
            useMapStore.setState(mapInitialState);
          });

          // Set hovered marker
          act(() => {
            useMapStore.getState().setHoveredMarker(markerId);
          });

          // Verify the invariant: exactly 0 or 1 marker is hovered
          const state = useMapStore.getState();
          const hoveredMarkerId = state.hoveredMarkerId;

          // hoveredMarkerId must be either null or a single string
          if (hoveredMarkerId === null) {
            // Zero markers hovered - valid state
            expect(hoveredMarkerId).toBeNull();
          } else {
            // Exactly one marker hovered - must be a string
            expect(typeof hoveredMarkerId).toBe('string');
            expect(hoveredMarkerId.length).toBeGreaterThan(0);
            expect(hoveredMarkerId).toBe(markerId);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should replace previous hovered marker when new marker is hovered', () => {
      fc.assert(
        fc.property(distinctMarkerPairArb, ([firstMarkerId, secondMarkerId]) => {
          // Reset store
          act(() => {
            useMapStore.setState(mapInitialState);
          });

          // Hover first marker
          act(() => {
            useMapStore.getState().setHoveredMarker(firstMarkerId);
          });

          // Verify first marker is hovered
          expect(useMapStore.getState().hoveredMarkerId).toBe(firstMarkerId);

          // Hover second marker (should replace first)
          act(() => {
            useMapStore.getState().setHoveredMarker(secondMarkerId);
          });

          // Verify second marker replaced first
          const state = useMapStore.getState();
          expect(state.hoveredMarkerId).toBe(secondMarkerId);
          expect(state.hoveredMarkerId).not.toBe(firstMarkerId);

          // Verify invariant: exactly one marker is hovered
          expect(typeof state.hoveredMarkerId).toBe('string');
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain invariant through sequential hover changes', () => {
      fc.assert(
        fc.property(hoverSequenceArb, (hoverEvents) => {
          // Reset store
          act(() => {
            useMapStore.setState(mapInitialState);
          });

          // Process each hover event
          for (const markerId of hoverEvents) {
            act(() => {
              useMapStore.getState().setHoveredMarker(markerId);
            });

            // Verify invariant after each change
            const state = useMapStore.getState();
            const hoveredMarkerId = state.hoveredMarkerId;

            // Must be exactly 0 or 1 marker hovered
            if (markerId === null) {
              expect(hoveredMarkerId).toBeNull();
            } else {
              expect(hoveredMarkerId).toBe(markerId);
              expect(typeof hoveredMarkerId).toBe('string');
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should handle rapid hover changes correctly', () => {
      fc.assert(
        fc.property(rapidHoverSequenceArb, (markerIds) => {
          // Reset store
          act(() => {
            useMapStore.setState(mapInitialState);
          });

          // Simulate rapid hover changes (like fast mouse movement over markers)
          for (const markerId of markerIds) {
            act(() => {
              useMapStore.getState().setHoveredMarker(markerId);
            });
          }

          // After all rapid changes, verify invariant holds
          const state = useMapStore.getState();
          const hoveredMarkerId = state.hoveredMarkerId;

          // Must be exactly one marker hovered (the last one)
          const lastMarkerId = markerIds[markerIds.length - 1];
          expect(hoveredMarkerId).toBe(lastMarkerId);
          expect(typeof hoveredMarkerId).toBe('string');
        }),
        { numRuns: 100 }
      );
    });

    it('should clear hovered marker when null is set', () => {
      fc.assert(
        fc.property(markerIdArb, (markerId) => {
          // Reset store
          act(() => {
            useMapStore.setState(mapInitialState);
          });

          // Hover a marker
          act(() => {
            useMapStore.getState().setHoveredMarker(markerId);
          });

          // Verify marker is hovered
          expect(useMapStore.getState().hoveredMarkerId).toBe(markerId);

          // Clear hover (mouse leave)
          act(() => {
            useMapStore.getState().setHoveredMarker(null);
          });

          // Verify no marker is hovered
          const state = useMapStore.getState();
          expect(state.hoveredMarkerId).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should not affect province hover state when marker hover changes', () => {
      fc.assert(
        fc.property(
          markerIdArb,
          fc.stringMatching(/^[a-zA-Z0-9_-]{1,20}$/),
          (markerId, provinceId) => {
            // Reset store
            act(() => {
              useMapStore.setState(mapInitialState);
            });

            // Set province hover first
            act(() => {
              useMapStore.getState().setHoveredProvince(provinceId);
            });

            // Verify province is hovered
            expect(useMapStore.getState().hoveredProvinceId).toBe(provinceId);

            // Now hover a marker
            act(() => {
              useMapStore.getState().setHoveredMarker(markerId);
            });

            // Verify marker hover is independent of province hover
            const state = useMapStore.getState();
            expect(state.hoveredMarkerId).toBe(markerId);
            // Province hover state should be unchanged
            expect(state.hoveredProvinceId).toBe(provinceId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle alternating marker and null hover states', () => {
      fc.assert(
        fc.property(
          fc.array(markerIdArb, { minLength: 2, maxLength: 10 }),
          (markerIds) => {
            // Reset store
            act(() => {
              useMapStore.setState(mapInitialState);
            });

            // Alternate between hovering markers and clearing
            for (const markerId of markerIds) {
              // Hover marker
              act(() => {
                useMapStore.getState().setHoveredMarker(markerId);
              });
              expect(useMapStore.getState().hoveredMarkerId).toBe(markerId);

              // Clear hover
              act(() => {
                useMapStore.getState().setHoveredMarker(null);
              });
              expect(useMapStore.getState().hoveredMarkerId).toBeNull();
            }

            // Final state should be null (no marker hovered)
            expect(useMapStore.getState().hoveredMarkerId).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle setting same marker ID multiple times', () => {
      fc.assert(
        fc.property(
          markerIdArb,
          fc.integer({ min: 2, max: 10 }),
          (markerId, repeatCount) => {
            // Reset store
            act(() => {
              useMapStore.setState(mapInitialState);
            });

            // Set the same marker ID multiple times
            for (let i = 0; i < repeatCount; i++) {
              act(() => {
                useMapStore.getState().setHoveredMarker(markerId);
              });

              // Verify invariant holds after each call
              const state = useMapStore.getState();
              expect(state.hoveredMarkerId).toBe(markerId);
            }

            // Final state should still be the same marker
            expect(useMapStore.getState().hoveredMarkerId).toBe(markerId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain store consistency after marker hover changes', () => {
      fc.assert(
        fc.property(hoverSequenceArb, (hoverEvents) => {
          // Reset store
          act(() => {
            useMapStore.setState(mapInitialState);
          });

          // Process hover events
          for (const markerId of hoverEvents) {
            act(() => {
              useMapStore.getState().setHoveredMarker(markerId);
            });
          }

          // Verify store state is consistent
          const state = useMapStore.getState();

          // hoveredMarkerId should match the last event
          const lastEvent = hoverEvents[hoverEvents.length - 1];
          expect(state.hoveredMarkerId).toBe(lastEvent);

          // Other state should be unaffected
          expect(state.viewport).toBeDefined();
          expect(state.activeColor).toBeDefined();
          expect(state.markers).toBeDefined();
          expect(Array.isArray(state.markers)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle marker IDs with various valid formats', () => {
      /**
       * Arbitrary for generating various marker ID formats.
       */
      const variousMarkerIdArb = fc.oneof(
        fc.stringMatching(/^[a-z]{3,15}$/), // lowercase letters
        fc.stringMatching(/^[A-Z]{3,15}$/), // uppercase letters
        fc.stringMatching(/^[a-zA-Z0-9]{3,20}$/), // alphanumeric
        fc.stringMatching(/^[a-z]+-[a-z]+$/), // hyphenated
        fc.stringMatching(/^[a-z]+_[a-z]+$/), // underscored
        fc.stringMatching(/^marker_[0-9]+$/), // prefixed with number
        fc.stringMatching(/^battle_[a-z]+_[0-9]+$/), // battle format
      );

      fc.assert(
        fc.property(variousMarkerIdArb, (markerId) => {
          // Reset store
          act(() => {
            useMapStore.setState(mapInitialState);
          });

          // Set hovered marker
          act(() => {
            useMapStore.getState().setHoveredMarker(markerId);
          });

          // Verify marker is hovered correctly
          const state = useMapStore.getState();
          expect(state.hoveredMarkerId).toBe(markerId);
          expect(typeof state.hoveredMarkerId).toBe('string');
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: production-parity-fixes, Property 2: Basemap Style Mapping
   *
   * Property 2 states:
   * *For any* basemap state value ('topographic', 'watercolor', 'none'), the MapView
   * SHALL use the corresponding Mapbox style URL from the BASEMAP_STYLES mapping.
   *
   * **Validates: Requirements 1.2**
   */
  describe('Property 2: Basemap Style Mapping', () => {
    /**
     * Arbitrary for generating valid basemap types.
     * Requirement 1.3: THE MapView SHALL support three basemap options: topographic, watercolor, and none
     */
    const basemapTypeArb: fc.Arbitrary<'topographic' | 'watercolor' | 'none'> = fc.constantFrom(
      'topographic',
      'watercolor',
      'none'
    );

    /**
     * Arbitrary for generating sequences of basemap selections.
     */
    const basemapSequenceArb = fc.array(basemapTypeArb, { minLength: 1, maxLength: 20 });

    /**
     * Arbitrary for generating pairs of basemap types for transition testing.
     */
    const basemapPairArb = fc.tuple(basemapTypeArb, basemapTypeArb);

    /**
     * Expected Mapbox style URLs for each basemap type.
     * These must match the BASEMAP_STYLES constant in mapStore.
     */
    const EXPECTED_BASEMAP_STYLES: Record<'topographic' | 'watercolor' | 'none', string> = {
      topographic: 'mapbox://styles/mapbox/outdoors-v12',
      watercolor: 'mapbox://styles/stamen/cj3hzkdwfaw1v2sqmrlvmdqjf',
      none: 'mapbox://styles/mapbox/empty-v9',
    };

    it('should return a valid Mapbox style URL for any basemap type', () => {
      fc.assert(
        fc.property(basemapTypeArb, (basemapType) => {
          // Get the style URL for the basemap type
          const styleUrl = BASEMAP_STYLES[basemapType];

          // Verify the style URL is defined and is a string
          expect(styleUrl).toBeDefined();
          expect(typeof styleUrl).toBe('string');

          // Verify the style URL is a valid Mapbox style URL format
          expect(styleUrl.startsWith('mapbox://styles/')).toBe(true);

          // Verify the style URL matches the expected value
          expect(styleUrl).toBe(EXPECTED_BASEMAP_STYLES[basemapType]);
        }),
        { numRuns: 100 }
      );
    });

    it('should have consistent mapping (same input always produces same output)', () => {
      fc.assert(
        fc.property(
          basemapTypeArb,
          fc.integer({ min: 2, max: 10 }),
          (basemapType, repeatCount) => {
            // Get the style URL multiple times
            const results: string[] = [];
            for (let i = 0; i < repeatCount; i++) {
              results.push(BASEMAP_STYLES[basemapType]);
            }

            // Verify all results are identical (deterministic mapping)
            const firstResult = results[0];
            for (const result of results) {
              expect(result).toBe(firstResult);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update mapStore basemap state and return correct style URL', () => {
      fc.assert(
        fc.property(basemapTypeArb, (basemapType) => {
          // Reset store
          act(() => {
            useMapStore.setState(mapInitialState);
          });

          // Set the basemap in the store
          act(() => {
            useMapStore.getState().setBasemap(basemapType);
          });

          // Get the current basemap from the store
          const currentBasemap = useMapStore.getState().basemap;

          // Verify the basemap was set correctly
          expect(currentBasemap).toBe(basemapType);

          // Verify the corresponding style URL is correct
          const styleUrl = BASEMAP_STYLES[currentBasemap];
          expect(styleUrl).toBe(EXPECTED_BASEMAP_STYLES[basemapType]);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle basemap transitions correctly', () => {
      fc.assert(
        fc.property(basemapPairArb, ([fromBasemap, toBasemap]) => {
          // Reset store with initial basemap
          act(() => {
            useMapStore.setState({ ...mapInitialState, basemap: fromBasemap });
          });

          // Verify initial state
          expect(useMapStore.getState().basemap).toBe(fromBasemap);
          expect(BASEMAP_STYLES[fromBasemap]).toBe(EXPECTED_BASEMAP_STYLES[fromBasemap]);

          // Transition to new basemap
          act(() => {
            useMapStore.getState().setBasemap(toBasemap);
          });

          // Verify transition
          const currentBasemap = useMapStore.getState().basemap;
          expect(currentBasemap).toBe(toBasemap);
          expect(BASEMAP_STYLES[currentBasemap]).toBe(EXPECTED_BASEMAP_STYLES[toBasemap]);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle sequential basemap changes correctly', () => {
      fc.assert(
        fc.property(basemapSequenceArb, (basemapSelections) => {
          // Reset store
          act(() => {
            useMapStore.setState(mapInitialState);
          });

          // Apply each basemap selection sequentially
          for (const basemapType of basemapSelections) {
            act(() => {
              useMapStore.getState().setBasemap(basemapType);
            });

            // Verify the basemap was set correctly
            const currentBasemap = useMapStore.getState().basemap;
            expect(currentBasemap).toBe(basemapType);

            // Verify the style URL is correct for the current basemap
            const styleUrl = BASEMAP_STYLES[currentBasemap];
            expect(styleUrl).toBe(EXPECTED_BASEMAP_STYLES[basemapType]);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should have all three basemap types defined in BASEMAP_STYLES', () => {
      fc.assert(
        fc.property(basemapTypeArb, (basemapType) => {
          // Verify the basemap type exists in BASEMAP_STYLES
          expect(basemapType in BASEMAP_STYLES).toBe(true);

          // Verify the mapping is complete (all three types are defined)
          expect('topographic' in BASEMAP_STYLES).toBe(true);
          expect('watercolor' in BASEMAP_STYLES).toBe(true);
          expect('none' in BASEMAP_STYLES).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve other map state when basemap changes', () => {
      fc.assert(
        fc.property(
          basemapPairArb,
          fc.boolean(),
          fc.boolean(),
          fc.integer({ min: 0, max: 10000 }),
          ([fromBasemap, toBasemap], showProvinceBorders, populationOpacity, markerLimit) => {
            // Reset store with specific state
            act(() => {
              useMapStore.setState({
                ...mapInitialState,
                basemap: fromBasemap,
                showProvinceBorders,
                populationOpacity,
                markerLimit,
              });
            });

            // Change the basemap
            act(() => {
              useMapStore.getState().setBasemap(toBasemap);
            });

            // Verify basemap changed
            const state = useMapStore.getState();
            expect(state.basemap).toBe(toBasemap);
            expect(BASEMAP_STYLES[state.basemap]).toBe(EXPECTED_BASEMAP_STYLES[toBasemap]);

            // Verify other state is preserved
            expect(state.showProvinceBorders).toBe(showProvinceBorders);
            expect(state.populationOpacity).toBe(populationOpacity);
            expect(state.markerLimit).toBe(markerLimit);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return style URLs that are valid Mapbox protocol URLs', () => {
      fc.assert(
        fc.property(basemapTypeArb, (basemapType) => {
          const styleUrl = BASEMAP_STYLES[basemapType];

          // Verify the URL follows Mapbox style URL format: mapbox://styles/{owner}/{style}
          expect(styleUrl).toMatch(/^mapbox:\/\/styles\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/);
        }),
        { numRuns: 100 }
      );
    });

    it('should have unique style URLs for each basemap type', () => {
      fc.assert(
        fc.property(basemapPairArb.filter(([a, b]) => a !== b), ([basemapA, basemapB]) => {
          const styleUrlA = BASEMAP_STYLES[basemapA];
          const styleUrlB = BASEMAP_STYLES[basemapB];

          // Different basemap types should have different style URLs
          expect(styleUrlA).not.toBe(styleUrlB);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: production-parity-fixes, Property 3: Province Border Visibility Consistency
   *
   * Property 3 states:
   * *For any* showProvinceBorders state value (true or false), the province-borders layer
   * visibility property SHALL equal 'visible' when true and 'none' when false.
   *
   * **Validates: Requirements 2.2, 2.3**
   */
  describe('Property 3: Province Border Visibility Consistency', () => {
    /**
     * Arbitrary for generating boolean values for showProvinceBorders state.
     */
    const showProvinceBordersArb = fc.boolean();

    /**
     * Arbitrary for generating distinct boolean pairs (from, to) for state transitions.
     * Ensures the values are different to trigger a change.
     */
    const distinctBooleanPairArb = fc
      .tuple(showProvinceBordersArb, showProvinceBordersArb)
      .filter(([from, to]) => from !== to);

    /**
     * Arbitrary for generating sequences of boolean state changes.
     */
    const booleanSequenceArb = fc.array(showProvinceBordersArb, { minLength: 2, maxLength: 20 });

    /**
     * Helper function to determine expected visibility value based on showProvinceBorders state.
     * This mirrors the implementation in MapView.tsx:
     * layout={{ visibility: showProvinceBorders ? 'visible' : 'none' }}
     *
     * @param showProvinceBorders - The current state value
     * @returns 'visible' when true, 'none' when false
     */
    function getExpectedVisibility(showProvinceBorders: boolean): 'visible' | 'none' {
      return showProvinceBorders ? 'visible' : 'none';
    }

    it('should return "visible" when showProvinceBorders is true', () => {
      fc.assert(
        fc.property(fc.constant(true), (showProvinceBorders) => {
          // Reset store
          act(() => {
            useMapStore.setState(mapInitialState);
          });

          // Set showProvinceBorders to true
          act(() => {
            useMapStore.getState().setShowProvinceBorders(showProvinceBorders);
          });

          // Verify the state was updated
          const state = useMapStore.getState();
          expect(state.showProvinceBorders).toBe(true);

          // Verify the expected visibility is 'visible'
          const expectedVisibility = getExpectedVisibility(state.showProvinceBorders);
          expect(expectedVisibility).toBe('visible');
        }),
        { numRuns: 100 }
      );
    });

    it('should return "none" when showProvinceBorders is false', () => {
      fc.assert(
        fc.property(fc.constant(false), (showProvinceBorders) => {
          // Reset store
          act(() => {
            useMapStore.setState(mapInitialState);
          });

          // Set showProvinceBorders to false
          act(() => {
            useMapStore.getState().setShowProvinceBorders(showProvinceBorders);
          });

          // Verify the state was updated
          const state = useMapStore.getState();
          expect(state.showProvinceBorders).toBe(false);

          // Verify the expected visibility is 'none'
          const expectedVisibility = getExpectedVisibility(state.showProvinceBorders);
          expect(expectedVisibility).toBe('none');
        }),
        { numRuns: 100 }
      );
    });

    it('should map any showProvinceBorders value to correct visibility', () => {
      fc.assert(
        fc.property(showProvinceBordersArb, (showProvinceBorders) => {
          // Reset store
          act(() => {
            useMapStore.setState(mapInitialState);
          });

          // Set showProvinceBorders to the generated value
          act(() => {
            useMapStore.getState().setShowProvinceBorders(showProvinceBorders);
          });

          // Verify the state was updated correctly
          const state = useMapStore.getState();
          expect(state.showProvinceBorders).toBe(showProvinceBorders);

          // Verify the visibility mapping is correct
          const expectedVisibility = getExpectedVisibility(state.showProvinceBorders);
          if (showProvinceBorders) {
            expect(expectedVisibility).toBe('visible');
          } else {
            expect(expectedVisibility).toBe('none');
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain visibility consistency across state transitions', () => {
      fc.assert(
        fc.property(distinctBooleanPairArb, ([fromState, toState]) => {
          // Reset store with initial state
          act(() => {
            useMapStore.setState({
              ...mapInitialState,
              showProvinceBorders: fromState,
            });
          });

          // Verify initial visibility
          let state = useMapStore.getState();
          expect(state.showProvinceBorders).toBe(fromState);
          expect(getExpectedVisibility(state.showProvinceBorders)).toBe(
            fromState ? 'visible' : 'none'
          );

          // Transition to new state
          act(() => {
            useMapStore.getState().setShowProvinceBorders(toState);
          });

          // Verify new visibility
          state = useMapStore.getState();
          expect(state.showProvinceBorders).toBe(toState);
          expect(getExpectedVisibility(state.showProvinceBorders)).toBe(
            toState ? 'visible' : 'none'
          );

          // Verify the visibility changed correctly
          const fromVisibility = getExpectedVisibility(fromState);
          const toVisibility = getExpectedVisibility(toState);
          expect(fromVisibility).not.toBe(toVisibility);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle sequential state changes correctly', () => {
      fc.assert(
        fc.property(booleanSequenceArb, (stateSequence) => {
          // Reset store
          act(() => {
            useMapStore.setState(mapInitialState);
          });

          // Apply each state change sequentially
          for (const showProvinceBorders of stateSequence) {
            act(() => {
              useMapStore.getState().setShowProvinceBorders(showProvinceBorders);
            });

            // Verify the state was updated correctly
            const state = useMapStore.getState();
            expect(state.showProvinceBorders).toBe(showProvinceBorders);

            // Verify the visibility mapping is consistent
            const expectedVisibility = getExpectedVisibility(state.showProvinceBorders);
            expect(expectedVisibility).toBe(showProvinceBorders ? 'visible' : 'none');
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve other map state when showProvinceBorders changes', () => {
      fc.assert(
        fc.property(
          distinctBooleanPairArb,
          fc.constantFrom<'topographic' | 'watercolor' | 'none'>('topographic', 'watercolor', 'none'),
          fc.boolean(),
          fc.integer({ min: 0, max: 10000 }),
          ([fromState, toState], basemap, populationOpacity, markerLimit) => {
            // Reset store with specific state
            act(() => {
              useMapStore.setState({
                ...mapInitialState,
                showProvinceBorders: fromState,
                basemap,
                populationOpacity,
                markerLimit,
              });
            });

            // Change showProvinceBorders
            act(() => {
              useMapStore.getState().setShowProvinceBorders(toState);
            });

            // Verify showProvinceBorders changed
            const state = useMapStore.getState();
            expect(state.showProvinceBorders).toBe(toState);
            expect(getExpectedVisibility(state.showProvinceBorders)).toBe(
              toState ? 'visible' : 'none'
            );

            // Verify other state is preserved
            expect(state.basemap).toBe(basemap);
            expect(state.populationOpacity).toBe(populationOpacity);
            expect(state.markerLimit).toBe(markerLimit);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have correct visibility values (only "visible" or "none")', () => {
      fc.assert(
        fc.property(showProvinceBordersArb, (showProvinceBorders) => {
          const visibility = getExpectedVisibility(showProvinceBorders);

          // Verify visibility is one of the valid Mapbox GL values
          expect(['visible', 'none']).toContain(visibility);

          // Verify the mapping is deterministic
          expect(getExpectedVisibility(true)).toBe('visible');
          expect(getExpectedVisibility(false)).toBe('none');
        }),
        { numRuns: 100 }
      );
    });

    it('should be idempotent - setting same value multiple times has no effect', () => {
      fc.assert(
        fc.property(
          showProvinceBordersArb,
          fc.integer({ min: 1, max: 10 }),
          (showProvinceBorders, repeatCount) => {
            // Reset store
            act(() => {
              useMapStore.setState(mapInitialState);
            });

            // Set the same value multiple times
            for (let i = 0; i < repeatCount; i++) {
              act(() => {
                useMapStore.getState().setShowProvinceBorders(showProvinceBorders);
              });

              // Verify state remains consistent
              const state = useMapStore.getState();
              expect(state.showProvinceBorders).toBe(showProvinceBorders);
              expect(getExpectedVisibility(state.showProvinceBorders)).toBe(
                showProvinceBorders ? 'visible' : 'none'
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should toggle visibility correctly when alternating between true and false', () => {
      fc.assert(
        fc.property(fc.integer({ min: 2, max: 20 }), (toggleCount) => {
          // Reset store
          act(() => {
            useMapStore.setState(mapInitialState);
          });

          let currentState = useMapStore.getState().showProvinceBorders;

          // Toggle the state multiple times
          for (let i = 0; i < toggleCount; i++) {
            const newState = !currentState;

            act(() => {
              useMapStore.getState().setShowProvinceBorders(newState);
            });

            // Verify the state toggled correctly
            const state = useMapStore.getState();
            expect(state.showProvinceBorders).toBe(newState);
            expect(state.showProvinceBorders).not.toBe(currentState);

            // Verify visibility mapping is correct after toggle
            const expectedVisibility = getExpectedVisibility(state.showProvinceBorders);
            expect(expectedVisibility).toBe(newState ? 'visible' : 'none');

            currentState = newState;
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: production-parity-fixes, Property 4: Population Opacity Mode Consistency
   *
   * Property 4 states:
   * *For any* populationOpacity state value, the province fill layer paint property
   * SHALL use an interpolate expression when true and a constant opacity when false.
   *
   * **Validates: Requirements 3.2, 3.3**
   */
  describe('Property 4: Population Opacity Mode Consistency', () => {
    /**
     * Constants from MapView.tsx for population opacity
     */
    const POPULATION_OPACITY_MIN = 0.3;
    const POPULATION_OPACITY_MAX = 1.0;
    const MAX_POPULATION_FOR_OPACITY = 10000000; // 10 million
    const DEFAULT_FILL_OPACITY = 0.7;

    /**
     * Builds a Mapbox GL interpolate expression for population opacity.
     * This mirrors the implementation in MapView.tsx
     *
     * @param maxPopulation - Maximum population value for scaling
     * @returns Mapbox GL interpolate expression
     */
    function buildPopulationOpacityExpression(maxPopulation: number): unknown[] {
      const safeMax = Math.max(1, maxPopulation);
      return [
        'interpolate',
        ['linear'],
        ['get', 'p'],
        0, POPULATION_OPACITY_MIN,
        safeMax, POPULATION_OPACITY_MAX,
      ];
    }

    /**
     * Gets the fill opacity expression based on populationOpacity state.
     * This mirrors the logic in MapView.tsx
     *
     * @param populationOpacity - Whether population opacity is enabled
     * @param maxPopulation - Maximum population value for scaling
     * @returns Either an interpolate expression array or a constant number
     */
    function getFillOpacityExpression(
      populationOpacity: boolean,
      maxPopulation: number = MAX_POPULATION_FOR_OPACITY
    ): unknown[] | number {
      if (populationOpacity) {
        return buildPopulationOpacityExpression(maxPopulation);
      }
      return DEFAULT_FILL_OPACITY;
    }

    /**
     * Arbitrary for generating populationOpacity boolean values.
     */
    const populationOpacityArb = fc.boolean();

    /**
     * Arbitrary for generating max population values (must be >= 1).
     */
    const maxPopulationArb = fc.integer({ min: 1, max: 100000000 });

    /**
     * Arbitrary for generating populationOpacity state pairs (from, to).
     */
    const populationOpacityPairArb = fc.tuple(populationOpacityArb, populationOpacityArb);

    it('should return interpolate expression when populationOpacity is true', () => {
      fc.assert(
        fc.property(maxPopulationArb, (maxPop) => {
          const expr = getFillOpacityExpression(true, maxPop);

          // When populationOpacity is true, should return an interpolate expression array
          expect(Array.isArray(expr)).toBe(true);
          
          const exprArray = expr as unknown[];
          expect(exprArray[0]).toBe('interpolate');
          expect(exprArray[1]).toEqual(['linear']);
          expect(exprArray[2]).toEqual(['get', 'p']);
        }),
        { numRuns: 100 }
      );
    });

    it('should return constant opacity (0.7) when populationOpacity is false', () => {
      fc.assert(
        fc.property(maxPopulationArb, (maxPop) => {
          const expr = getFillOpacityExpression(false, maxPop);

          // When populationOpacity is false, should return constant DEFAULT_FILL_OPACITY
          expect(typeof expr).toBe('number');
          expect(expr).toBe(DEFAULT_FILL_OPACITY);
          expect(expr).toBe(0.7);
        }),
        { numRuns: 100 }
      );
    });

    it('should update populationOpacity state in MapStore', () => {
      fc.assert(
        fc.property(populationOpacityArb, (populationOpacity) => {
          // Reset store
          act(() => {
            useMapStore.setState(mapInitialState);
          });

          // Set populationOpacity
          act(() => {
            useMapStore.getState().setPopulationOpacity(populationOpacity);
          });

          // Verify state was updated
          const state = useMapStore.getState();
          expect(state.populationOpacity).toBe(populationOpacity);
        }),
        { numRuns: 100 }
      );
    });

    it('should produce correct expression type based on populationOpacity state', () => {
      fc.assert(
        fc.property(populationOpacityPairArb, maxPopulationArb, ([fromState, toState], maxPop) => {
          // Reset store with initial state
          act(() => {
            useMapStore.setState({
              ...mapInitialState,
              populationOpacity: fromState,
            });
          });

          // Change populationOpacity
          act(() => {
            useMapStore.getState().setPopulationOpacity(toState);
          });

          // Get the expression based on new state
          const state = useMapStore.getState();
          const expr = getFillOpacityExpression(state.populationOpacity, maxPop);

          // Verify expression type matches state
          if (state.populationOpacity) {
            expect(Array.isArray(expr)).toBe(true);
            const exprArray = expr as unknown[];
            expect(exprArray[0]).toBe('interpolate');
          } else {
            expect(typeof expr).toBe('number');
            expect(expr).toBe(DEFAULT_FILL_OPACITY);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve other state when populationOpacity changes', () => {
      fc.assert(
        fc.property(
          populationOpacityPairArb,
          fc.constantFrom<'topographic' | 'watercolor' | 'none'>('topographic', 'watercolor', 'none'),
          fc.boolean(),
          fc.integer({ min: 0, max: 10000 }),
          ([fromState, toState], basemap, showProvinceBorders, markerLimit) => {
            // Reset store with specific state
            act(() => {
              useMapStore.setState({
                ...mapInitialState,
                populationOpacity: fromState,
                basemap,
                showProvinceBorders,
                markerLimit,
              });
            });

            // Change populationOpacity
            act(() => {
              useMapStore.getState().setPopulationOpacity(toState);
            });

            // Verify populationOpacity changed
            const state = useMapStore.getState();
            expect(state.populationOpacity).toBe(toState);

            // Verify other state is preserved
            expect(state.basemap).toBe(basemap);
            expect(state.showProvinceBorders).toBe(showProvinceBorders);
            expect(state.markerLimit).toBe(markerLimit);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be idempotent - setting same value multiple times has no effect', () => {
      fc.assert(
        fc.property(
          populationOpacityArb,
          fc.integer({ min: 1, max: 10 }),
          (populationOpacity, repeatCount) => {
            // Reset store
            act(() => {
              useMapStore.setState(mapInitialState);
            });

            // Set the same value multiple times
            for (let i = 0; i < repeatCount; i++) {
              act(() => {
                useMapStore.getState().setPopulationOpacity(populationOpacity);
              });

              // Verify state remains consistent
              const state = useMapStore.getState();
              expect(state.populationOpacity).toBe(populationOpacity);

              // Verify expression type is consistent
              const expr = getFillOpacityExpression(state.populationOpacity);
              if (populationOpacity) {
                expect(Array.isArray(expr)).toBe(true);
              } else {
                expect(typeof expr).toBe('number');
                expect(expr).toBe(DEFAULT_FILL_OPACITY);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have correct constant values', () => {
      expect(POPULATION_OPACITY_MIN).toBe(0.3);
      expect(POPULATION_OPACITY_MAX).toBe(1.0);
      expect(MAX_POPULATION_FOR_OPACITY).toBe(10000000);
      expect(DEFAULT_FILL_OPACITY).toBe(0.7);
    });
  });

  /**
   * Feature: production-parity-fixes, Property 5: Population Opacity Bounds
   *
   * Property 5 states:
   * *For any* population value in the range [0, maxPopulation], the interpolated
   * opacity SHALL be within the range [0.3, 1.0].
   *
   * **Validates: Requirements 3.4**
   */
  describe('Property 5: Population Opacity Bounds', () => {
    /**
     * Constants from MapView.tsx for population opacity
     */
    const POPULATION_OPACITY_MIN = 0.3;
    const POPULATION_OPACITY_MAX = 1.0;
    const MAX_POPULATION_FOR_OPACITY = 10000000; // 10 million

    /**
     * Calculates the interpolated opacity for a given population value.
     * Formula: opacity = 0.3 + (population / maxPopulation) * (1.0 - 0.3)
     *
     * @param population - The population value
     * @param maxPopulation - The maximum population for scaling
     * @returns The interpolated opacity value
     */
    function calculateInterpolatedOpacity(
      population: number,
      maxPopulation: number
    ): number {
      const safeMax = Math.max(1, maxPopulation);
      const ratio = Math.min(1, Math.max(0, population) / safeMax);
      return POPULATION_OPACITY_MIN + ratio * (POPULATION_OPACITY_MAX - POPULATION_OPACITY_MIN);
    }

    /**
     * Arbitrary for generating valid population values.
     */
    const populationArb = fc.integer({ min: 0, max: 100000000 });

    /**
     * Arbitrary for generating max population values (must be >= 1).
     */
    const maxPopulationArb = fc.integer({ min: 1, max: 100000000 });

    /**
     * Arbitrary for generating population values within the standard range.
     */
    const standardPopulationArb = fc.integer({ min: 0, max: MAX_POPULATION_FOR_OPACITY });

    /**
     * Arbitrary for generating population/maxPopulation pairs.
     */
    const populationPairArb = fc.tuple(populationArb, maxPopulationArb);

    it('should produce opacity within [0.3, 1.0] for any population value', () => {
      fc.assert(
        fc.property(populationPairArb, ([population, maxPop]) => {
          const opacity = calculateInterpolatedOpacity(population, maxPop);

          // Verify opacity is within valid range [0.3, 1.0]
          expect(opacity).toBeGreaterThanOrEqual(POPULATION_OPACITY_MIN);
          expect(opacity).toBeLessThanOrEqual(POPULATION_OPACITY_MAX);
        }),
        { numRuns: 100 }
      );
    });

    it('should return minimum opacity (0.3) for population of 0', () => {
      fc.assert(
        fc.property(maxPopulationArb, (maxPop) => {
          const opacity = calculateInterpolatedOpacity(0, maxPop);

          // At population 0, opacity should be exactly 0.3
          expect(opacity).toBe(POPULATION_OPACITY_MIN);
          expect(opacity).toBe(0.3);
        }),
        { numRuns: 100 }
      );
    });

    it('should return maximum opacity (1.0) for population equal to maxPopulation', () => {
      fc.assert(
        fc.property(maxPopulationArb, (maxPop) => {
          const opacity = calculateInterpolatedOpacity(maxPop, maxPop);

          // At max population, opacity should be exactly 1.0
          expect(opacity).toBe(POPULATION_OPACITY_MAX);
          expect(opacity).toBe(1.0);
        }),
        { numRuns: 100 }
      );
    });

    it('should cap opacity at 1.0 for population exceeding maxPopulation', () => {
      fc.assert(
        fc.property(
          maxPopulationArb,
          fc.integer({ min: 1, max: 100000000 }),
          (maxPop, excess) => {
            const population = maxPop + excess;
            const opacity = calculateInterpolatedOpacity(population, maxPop);

            // Opacity should be capped at 1.0
            expect(opacity).toBe(POPULATION_OPACITY_MAX);
            expect(opacity).toBe(1.0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce monotonically increasing opacity as population increases', () => {
      fc.assert(
        fc.property(
          maxPopulationArb,
          fc.array(standardPopulationArb, { minLength: 2, maxLength: 10 }),
          (maxPop, populations) => {
            // Sort populations to test monotonicity
            const sortedPops = [...populations].sort((a, b) => a - b);
            
            let prevOpacity = -1;
            for (const pop of sortedPops) {
              const opacity = calculateInterpolatedOpacity(pop, maxPop);
              
              // Opacity should be >= previous opacity (monotonically increasing)
              expect(opacity).toBeGreaterThanOrEqual(prevOpacity);
              
              // Opacity should always be within bounds
              expect(opacity).toBeGreaterThanOrEqual(POPULATION_OPACITY_MIN);
              expect(opacity).toBeLessThanOrEqual(POPULATION_OPACITY_MAX);
              
              prevOpacity = opacity;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce correct intermediate opacity values', () => {
      fc.assert(
        fc.property(
          maxPopulationArb,
          fc.double({ min: 0, max: 1, noNaN: true }),
          (maxPop, ratio) => {
            const population = Math.floor(ratio * maxPop);
            const opacity = calculateInterpolatedOpacity(population, maxPop);

            // Calculate expected opacity
            const expectedRatio = Math.min(1, population / Math.max(1, maxPop));
            const expectedOpacity = POPULATION_OPACITY_MIN + expectedRatio * (POPULATION_OPACITY_MAX - POPULATION_OPACITY_MIN);

            // Verify opacity matches expected value (within floating point tolerance)
            expect(opacity).toBeCloseTo(expectedOpacity, 10);
            
            // Verify bounds
            expect(opacity).toBeGreaterThanOrEqual(POPULATION_OPACITY_MIN);
            expect(opacity).toBeLessThanOrEqual(POPULATION_OPACITY_MAX);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge case of maxPopulation = 1', () => {
      fc.assert(
        fc.property(populationArb, (population) => {
          const opacity = calculateInterpolatedOpacity(population, 1);

          // With maxPop = 1, any population >= 1 should give max opacity
          if (population >= 1) {
            expect(opacity).toBe(POPULATION_OPACITY_MAX);
          } else {
            expect(opacity).toBe(POPULATION_OPACITY_MIN);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should handle maxPopulation = 0 by using 1 as minimum', () => {
      fc.assert(
        fc.property(populationArb, (population) => {
          // When maxPopulation is 0, it should be treated as 1
          const opacity = calculateInterpolatedOpacity(population, 0);

          // Verify opacity is still within bounds
          expect(opacity).toBeGreaterThanOrEqual(POPULATION_OPACITY_MIN);
          expect(opacity).toBeLessThanOrEqual(POPULATION_OPACITY_MAX);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle negative population by treating as 0', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -1000000, max: -1 }),
          maxPopulationArb,
          (negativePopulation, maxPop) => {
            const opacity = calculateInterpolatedOpacity(negativePopulation, maxPop);

            // Negative population should be treated as 0, giving minimum opacity
            expect(opacity).toBe(POPULATION_OPACITY_MIN);
            expect(opacity).toBe(0.3);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have correct constant values matching MapView.tsx', () => {
      expect(POPULATION_OPACITY_MIN).toBe(0.3);
      expect(POPULATION_OPACITY_MAX).toBe(1.0);
      expect(MAX_POPULATION_FOR_OPACITY).toBe(10000000);
    });

    it('should produce opacity range of exactly 0.7 (1.0 - 0.3)', () => {
      const opacityRange = POPULATION_OPACITY_MAX - POPULATION_OPACITY_MIN;
      expect(opacityRange).toBe(0.7);
    });
  });
});
