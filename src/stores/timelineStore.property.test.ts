/**
 * Timeline Store Property-Based Tests
 *
 * Property-based tests for autoplay advancement functionality and epic filtering.
 * Uses fast-check library to generate random configurations
 * and verify universal properties.
 *
 * **Feature: timeline-migration, Property 15: Autoplay Advancement**
 * **Validates: Requirements 9.9, 9.10**
 *
 * **Feature: production-parity-fixes, Property 8: Epic Filtering Correctness**
 * **Validates: Requirements 7.3**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  useTimelineStore,
  initialState,
  clampYear,
  MIN_YEAR,
  MAX_YEAR,
  type AutoplayConfig,
  type EpicType,
  EPIC_TYPES,
  mapSubtypeToEpicType,
} from './timelineStore';

describe('timelineStore Property Tests', () => {
  // Reset store state and use fake timers before each test
  beforeEach(() => {
    vi.useFakeTimers();
    useTimelineStore.setState(initialState);
  });

  afterEach(() => {
    // Stop any running autoplay
    useTimelineStore.getState().stopAutoplay();
    vi.useRealTimers();
  });

  /**
   * **Feature: timeline-migration, Property 15: Autoplay Advancement**
   *
   * Property 15 states:
   * *For any* autoplay configuration with startYear S, endYear E, stepSize T, delay D, and repeat R:
   * - The year SHALL advance by T at each interval of D milliseconds
   * - WHEN the year reaches or exceeds E:
   *   - IF R is true, the year SHALL reset to S
   *   - IF R is false, autoplay SHALL stop
   *
   * **Validates: Requirements 9.9, 9.10**
   */
  describe('Property 15: Autoplay Advancement', () => {
    /**
     * Arbitrary for generating valid autoplay configurations.
     * Ensures startYear < endYear and all values are within valid ranges.
     */
    const autoplayConfigArb = fc.record({
      startYear: fc.integer({ min: MIN_YEAR, max: MAX_YEAR - 100 }),
      endYear: fc.integer({ min: MIN_YEAR + 100, max: MAX_YEAR }),
      stepSize: fc.integer({ min: 1, max: 200 }),
      delay: fc.integer({ min: 100, max: 5000 }),
      repeat: fc.boolean(),
    }).filter((config) => config.startYear < config.endYear);

    it('should start autoplay at the configured startYear', () => {
      fc.assert(
        fc.property(autoplayConfigArb, (config) => {
          // Reset state
          useTimelineStore.setState(initialState);

          // Set the autoplay config
          useTimelineStore.getState().setAutoplayConfig(config);

          // Start autoplay
          useTimelineStore.getState().startAutoplay();

          // Verify initial state
          const state = useTimelineStore.getState();
          expect(state.isAutoplayActive).toBe(true);
          expect(state.selectedYear).toBe(clampYear(config.startYear));

          // Cleanup
          useTimelineStore.getState().stopAutoplay();
        }),
        { numRuns: 100 }
      );
    });

    it('should advance year by stepSize after each delay interval', () => {
      fc.assert(
        fc.property(autoplayConfigArb, (config) => {
          // Reset state
          useTimelineStore.setState(initialState);

          // Set the autoplay config
          useTimelineStore.getState().setAutoplayConfig(config);

          // Start autoplay
          useTimelineStore.getState().startAutoplay();

          const startYear = clampYear(config.startYear);
          expect(useTimelineStore.getState().selectedYear).toBe(startYear);

          // Advance by one interval
          vi.advanceTimersByTime(config.delay);

          const expectedYear = startYear + config.stepSize;
          const state = useTimelineStore.getState();

          // If we haven't exceeded endYear, year should advance by stepSize
          if (expectedYear <= config.endYear) {
            expect(state.selectedYear).toBe(clampYear(expectedYear));
          }

          // Cleanup
          useTimelineStore.getState().stopAutoplay();
        }),
        { numRuns: 100 }
      );
    });

    it('should repeat from startYear when reaching endYear with repeat=true', () => {
      // Use a more constrained arbitrary to ensure tests complete in reasonable time
      const repeatConfigArb = fc.record({
        startYear: fc.integer({ min: 0, max: 100 }),
        endYear: fc.integer({ min: 150, max: 300 }),
        stepSize: fc.integer({ min: 10, max: 50 }),
        delay: fc.integer({ min: 100, max: 500 }),
        repeat: fc.constant(true),
      });

      fc.assert(
        fc.property(repeatConfigArb, (config) => {
          // Reset state
          useTimelineStore.setState(initialState);

          // Set the autoplay config
          useTimelineStore.getState().setAutoplayConfig(config);

          // Start autoplay
          useTimelineStore.getState().startAutoplay();

          const startYear = clampYear(config.startYear);

          // Simulate autoplay steps and verify repeat behavior
          // We'll advance step by step and check when repeat occurs
          let previousYear = startYear;
          let repeatDetected = false;
          const maxSteps = 50; // Safety limit

          for (let step = 0; step < maxSteps && !repeatDetected; step++) {
            vi.advanceTimersByTime(config.delay);

            const state = useTimelineStore.getState();
            const currentYear = state.selectedYear;

            // Repeat is detected when year goes back to startYear
            // after having advanced beyond it
            if (currentYear === startYear && previousYear !== startYear) {
              repeatDetected = true;
              // Verify autoplay is still active after repeat
              expect(state.isAutoplayActive).toBe(true);
            }

            previousYear = currentYear;
          }

          // Verify that repeat was detected
          expect(repeatDetected).toBe(true);

          // Cleanup
          useTimelineStore.getState().stopAutoplay();
        }),
        { numRuns: 50 }
      );
    });

    it('should stop autoplay when reaching endYear with repeat=false', () => {
      fc.assert(
        fc.property(
          autoplayConfigArb.filter((c) => !c.repeat),
          (config) => {
            // Reset state
            useTimelineStore.setState(initialState);

            // Set the autoplay config
            useTimelineStore.getState().setAutoplayConfig(config);

            // Start autoplay
            useTimelineStore.getState().startAutoplay();

            const startYear = clampYear(config.startYear);
            const endYear = clampYear(config.endYear);

            // Calculate how many steps to reach or exceed endYear
            const stepsToEnd = Math.ceil((endYear - startYear) / config.stepSize);

            // Advance to reach the end
            for (let i = 0; i < stepsToEnd; i++) {
              vi.advanceTimersByTime(config.delay);
            }

            // One more step should trigger stop
            vi.advanceTimersByTime(config.delay);

            const state = useTimelineStore.getState();

            // Should have stopped
            expect(state.isAutoplayActive).toBe(false);

            // Cleanup (already stopped, but for consistency)
            useTimelineStore.getState().stopAutoplay();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should always keep year within valid range during autoplay', () => {
      fc.assert(
        fc.property(autoplayConfigArb, (config) => {
          // Reset state
          useTimelineStore.setState(initialState);

          // Set the autoplay config
          useTimelineStore.getState().setAutoplayConfig(config);

          // Start autoplay
          useTimelineStore.getState().startAutoplay();

          // Advance several intervals
          const numSteps = 10;
          for (let i = 0; i < numSteps; i++) {
            vi.advanceTimersByTime(config.delay);

            const state = useTimelineStore.getState();
            // Year should always be within valid range
            expect(state.selectedYear).toBeGreaterThanOrEqual(MIN_YEAR);
            expect(state.selectedYear).toBeLessThanOrEqual(MAX_YEAR);
          }

          // Cleanup
          useTimelineStore.getState().stopAutoplay();
        }),
        { numRuns: 50 }
      );
    });

    it('should not advance year after stopAutoplay is called', () => {
      fc.assert(
        fc.property(autoplayConfigArb, (config) => {
          // Reset state
          useTimelineStore.setState(initialState);

          // Set the autoplay config
          useTimelineStore.getState().setAutoplayConfig(config);

          // Start autoplay
          useTimelineStore.getState().startAutoplay();

          // Advance one interval
          vi.advanceTimersByTime(config.delay);

          const yearAfterFirstStep = useTimelineStore.getState().selectedYear;

          // Stop autoplay
          useTimelineStore.getState().stopAutoplay();

          // Advance more intervals
          vi.advanceTimersByTime(config.delay * 5);

          const state = useTimelineStore.getState();

          // Year should not have changed after stop
          expect(state.selectedYear).toBe(yearAfterFirstStep);
          expect(state.isAutoplayActive).toBe(false);
        }),
        { numRuns: 50 }
      );
    });

    it('should correctly handle multiple autoplay start/stop cycles', () => {
      fc.assert(
        fc.property(
          autoplayConfigArb,
          fc.integer({ min: 1, max: 5 }),
          (config, cycles) => {
            // Reset state
            useTimelineStore.setState(initialState);

            // Set the autoplay config
            useTimelineStore.getState().setAutoplayConfig(config);

            for (let cycle = 0; cycle < cycles; cycle++) {
              // Start autoplay
              useTimelineStore.getState().startAutoplay();

              expect(useTimelineStore.getState().isAutoplayActive).toBe(true);
              expect(useTimelineStore.getState().selectedYear).toBe(clampYear(config.startYear));

              // Advance a few steps
              vi.advanceTimersByTime(config.delay * 2);

              // Stop autoplay
              useTimelineStore.getState().stopAutoplay();

              expect(useTimelineStore.getState().isAutoplayActive).toBe(false);
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  /**
   * **Feature: timeline-migration, Property 15: Autoplay Advancement**
   *
   * Additional property tests for autoplay configuration validation.
   *
   * **Validates: Requirements 9.9, 9.10**
   */
  describe('Autoplay Configuration Validation', () => {
    it('should clamp startYear and endYear to valid range when setting config', () => {
      fc.assert(
        fc.property(
          fc.record({
            startYear: fc.integer({ min: -10000, max: 10000 }),
            endYear: fc.integer({ min: -10000, max: 10000 }),
            stepSize: fc.integer({ min: 1, max: 200 }),
            delay: fc.integer({ min: 100, max: 5000 }),
            repeat: fc.boolean(),
          }),
          (config) => {
            // Reset state
            useTimelineStore.setState(initialState);

            // Set the autoplay config
            useTimelineStore.getState().setAutoplayConfig(config);

            const state = useTimelineStore.getState();

            // startYear and endYear should be clamped
            expect(state.autoplayConfig.startYear).toBeGreaterThanOrEqual(MIN_YEAR);
            expect(state.autoplayConfig.startYear).toBeLessThanOrEqual(MAX_YEAR);
            expect(state.autoplayConfig.endYear).toBeGreaterThanOrEqual(MIN_YEAR);
            expect(state.autoplayConfig.endYear).toBeLessThanOrEqual(MAX_YEAR);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve other config values when updating partial config', () => {
      fc.assert(
        fc.property(
          fc.record({
            startYear: fc.integer({ min: MIN_YEAR, max: MAX_YEAR }),
            endYear: fc.integer({ min: MIN_YEAR, max: MAX_YEAR }),
            stepSize: fc.integer({ min: 1, max: 200 }),
            delay: fc.integer({ min: 100, max: 5000 }),
            repeat: fc.boolean(),
          }),
          fc.constantFrom('startYear', 'endYear', 'stepSize', 'delay', 'repeat') as fc.Arbitrary<keyof AutoplayConfig>,
          (config, keyToUpdate) => {
            // Reset state
            useTimelineStore.setState(initialState);

            // Set full config first
            useTimelineStore.getState().setAutoplayConfig(config);

            const originalConfig = { ...useTimelineStore.getState().autoplayConfig };

            // Update only one key
            const partialUpdate: Partial<AutoplayConfig> = {};
            if (keyToUpdate === 'startYear') {
              partialUpdate.startYear = config.startYear + 10;
            } else if (keyToUpdate === 'endYear') {
              partialUpdate.endYear = config.endYear - 10;
            } else if (keyToUpdate === 'stepSize') {
              partialUpdate.stepSize = config.stepSize + 5;
            } else if (keyToUpdate === 'delay') {
              partialUpdate.delay = config.delay + 100;
            } else {
              // keyToUpdate === 'repeat'
              partialUpdate.repeat = !config.repeat;
            }

            useTimelineStore.getState().setAutoplayConfig(partialUpdate);

            const newConfig = useTimelineStore.getState().autoplayConfig;

            // Other keys should remain unchanged
            // Check each key individually to avoid TypeScript narrowing issues
            if (keyToUpdate !== 'startYear') {
              expect(newConfig.startYear).toBe(originalConfig.startYear);
            }
            if (keyToUpdate !== 'endYear') {
              expect(newConfig.endYear).toBe(originalConfig.endYear);
            }
            if (keyToUpdate !== 'stepSize') {
              expect(newConfig.stepSize).toBe(originalConfig.stepSize);
            }
            if (keyToUpdate !== 'delay') {
              expect(newConfig.delay).toBe(originalConfig.delay);
            }
            if (keyToUpdate !== 'repeat') {
              expect(newConfig.repeat).toBe(originalConfig.repeat);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Feature: timeline-migration, Property 15: Autoplay Advancement**
   *
   * Tests for autoplay advancement with edge case configurations.
   *
   * **Validates: Requirements 9.9, 9.10**
   */
  describe('Autoplay Edge Cases', () => {
    it('should handle stepSize larger than range (endYear - startYear)', () => {
      fc.assert(
        fc.property(
          fc.record({
            startYear: fc.integer({ min: MIN_YEAR, max: MAX_YEAR - 50 }),
            rangeSize: fc.integer({ min: 10, max: 50 }),
            stepSize: fc.integer({ min: 100, max: 500 }),
            delay: fc.integer({ min: 100, max: 1000 }),
            repeat: fc.boolean(),
          }),
          ({ startYear, rangeSize, stepSize, delay, repeat }) => {
            const config = {
              startYear,
              endYear: startYear + rangeSize,
              stepSize,
              delay,
              repeat,
            };

            // Reset state
            useTimelineStore.setState(initialState);

            // Set the autoplay config
            useTimelineStore.getState().setAutoplayConfig(config);

            // Start autoplay
            useTimelineStore.getState().startAutoplay();

            // First step should exceed endYear
            vi.advanceTimersByTime(config.delay);

            const state = useTimelineStore.getState();

            if (repeat) {
              // Should have repeated back to startYear
              expect(state.selectedYear).toBe(clampYear(config.startYear));
              expect(state.isAutoplayActive).toBe(true);
            } else {
              // Should have stopped
              expect(state.isAutoplayActive).toBe(false);
            }

            // Cleanup
            useTimelineStore.getState().stopAutoplay();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle startYear at MIN_YEAR boundary', () => {
      fc.assert(
        fc.property(
          fc.record({
            endYear: fc.integer({ min: MIN_YEAR + 100, max: MAX_YEAR }),
            stepSize: fc.integer({ min: 1, max: 100 }),
            delay: fc.integer({ min: 100, max: 1000 }),
            repeat: fc.boolean(),
          }),
          ({ endYear, stepSize, delay, repeat }) => {
            const config = {
              startYear: MIN_YEAR,
              endYear,
              stepSize,
              delay,
              repeat,
            };

            // Reset state
            useTimelineStore.setState(initialState);

            // Set the autoplay config
            useTimelineStore.getState().setAutoplayConfig(config);

            // Start autoplay
            useTimelineStore.getState().startAutoplay();

            expect(useTimelineStore.getState().selectedYear).toBe(MIN_YEAR);

            // Advance one step
            vi.advanceTimersByTime(config.delay);

            const state = useTimelineStore.getState();
            expect(state.selectedYear).toBeGreaterThanOrEqual(MIN_YEAR);

            // Cleanup
            useTimelineStore.getState().stopAutoplay();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle endYear at MAX_YEAR boundary', () => {
      fc.assert(
        fc.property(
          fc.record({
            startYear: fc.integer({ min: MIN_YEAR, max: MAX_YEAR - 100 }),
            stepSize: fc.integer({ min: 1, max: 100 }),
            delay: fc.integer({ min: 100, max: 1000 }),
            repeat: fc.boolean(),
          }),
          ({ startYear, stepSize, delay, repeat }) => {
            const config = {
              startYear,
              endYear: MAX_YEAR,
              stepSize,
              delay,
              repeat,
            };

            // Reset state
            useTimelineStore.setState(initialState);

            // Set the autoplay config
            useTimelineStore.getState().setAutoplayConfig(config);

            // Start autoplay
            useTimelineStore.getState().startAutoplay();

            // Advance several steps
            const numSteps = 5;
            for (let i = 0; i < numSteps; i++) {
              vi.advanceTimersByTime(config.delay);
            }

            const state = useTimelineStore.getState();
            // Year should never exceed MAX_YEAR
            expect(state.selectedYear).toBeLessThanOrEqual(MAX_YEAR);

            // Cleanup
            useTimelineStore.getState().stopAutoplay();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle stepSize of 1 (minimum step)', () => {
      fc.assert(
        fc.property(
          fc.record({
            startYear: fc.integer({ min: MIN_YEAR, max: MAX_YEAR - 10 }),
            rangeSize: fc.integer({ min: 5, max: 20 }),
            delay: fc.integer({ min: 100, max: 1000 }),
            repeat: fc.boolean(),
          }),
          ({ startYear, rangeSize, delay, repeat }) => {
            const config = {
              startYear,
              endYear: startYear + rangeSize,
              stepSize: 1,
              delay,
              repeat,
            };

            // Reset state
            useTimelineStore.setState(initialState);

            // Set the autoplay config
            useTimelineStore.getState().setAutoplayConfig(config);

            // Start autoplay
            useTimelineStore.getState().startAutoplay();

            expect(useTimelineStore.getState().selectedYear).toBe(clampYear(config.startYear));

            // Advance one step
            vi.advanceTimersByTime(config.delay);

            const state = useTimelineStore.getState();
            // Should have advanced by exactly 1
            if (state.isAutoplayActive) {
              expect(state.selectedYear).toBe(clampYear(config.startYear + 1));
            }

            // Cleanup
            useTimelineStore.getState().stopAutoplay();
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});


/**
 * **Feature: production-parity-fixes, Property 8: Epic Filtering Correctness**
 *
 * Property 8 states:
 * *For any* epic filter state and epic items array, the filtered epic items
 * SHALL only include items whose type has a true value in the filter state.
 *
 * **Validates: Requirements 7.3**
 */
describe('Property 8: Epic Filtering Correctness', () => {
  // Reset store state before each test
  beforeEach(() => {
    useTimelineStore.setState(initialState);
  });

  /**
   * Arbitrary for generating valid EpicItem objects.
   * Generates items with various subtypes that map to different EpicType categories.
   */
  const epicSubtypeArb = fc.oneof(
    // War-related subtypes
    fc.constantFrom('war', 'battle', 'conflict'),
    // Empire-related subtypes
    fc.constantFrom('empire', 'ei', 'kingdom', 'dynasty'),
    // Religion-related subtypes
    fc.constantFrom('religion', 'religious'),
    // Culture-related subtypes
    fc.constantFrom('culture', 'cultural', 'art'),
    // Person-related subtypes
    fc.constantFrom('person', 'ps', 'people', 'leader'),
    // Other/unknown subtypes
    fc.constantFrom('other', 'unknown', 'misc', 'event')
  );

  const epicItemArb = fc.record({
    id: fc.uuid(),
    content: fc.string({ minLength: 1, maxLength: 100 }),
    wiki: fc.webUrl(),
    start: fc.date({ min: new Date(-2000, 0, 1), max: new Date(2000, 11, 31) }),
    end: fc.date({ min: new Date(-2000, 0, 1), max: new Date(2000, 11, 31) }),
    group: fc.integer({ min: 1, max: 10 }),
    subtype: epicSubtypeArb,
    className: fc.string({ minLength: 1, maxLength: 50 }),
  });

  /**
   * Arbitrary for generating epic filter state.
   * Each EpicType can be independently enabled or disabled.
   */
  const epicFiltersArb: fc.Arbitrary<Record<EpicType, boolean>> = fc.record({
    war: fc.boolean(),
    empire: fc.boolean(),
    religion: fc.boolean(),
    culture: fc.boolean(),
    person: fc.boolean(),
    other: fc.boolean(),
  });

  it('should include items when their type filter is enabled', () => {
    fc.assert(
      fc.property(
        fc.array(epicItemArb, { minLength: 1, maxLength: 50 }),
        epicFiltersArb,
        (items, filters) => {
          // Reset state
          useTimelineStore.setState(initialState);

          // Set epic items
          useTimelineStore.getState().setEpicItems(items);

          // Set filters
          EPIC_TYPES.forEach((type) => {
            useTimelineStore.getState().setEpicFilter(type, filters[type]);
          });

          // Get filtered items
          const filteredItems = useTimelineStore.getState().getFilteredEpicItems();

          // Verify: all filtered items have their type enabled
          filteredItems.forEach((item) => {
            const epicType = mapSubtypeToEpicType(item.subtype);
            expect(filters[epicType]).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should exclude items when their type filter is disabled', () => {
    fc.assert(
      fc.property(
        fc.array(epicItemArb, { minLength: 1, maxLength: 50 }),
        epicFiltersArb,
        (items, filters) => {
          // Reset state
          useTimelineStore.setState(initialState);

          // Set epic items
          useTimelineStore.getState().setEpicItems(items);

          // Set filters
          EPIC_TYPES.forEach((type) => {
            useTimelineStore.getState().setEpicFilter(type, filters[type]);
          });

          // Get filtered items
          const filteredItems = useTimelineStore.getState().getFilteredEpicItems();
          const filteredIds = new Set(filteredItems.map((item) => item.id));

          // Verify: items with disabled types are NOT in filtered results
          items.forEach((item) => {
            const epicType = mapSubtypeToEpicType(item.subtype);
            if (!filters[epicType]) {
              expect(filteredIds.has(item.id)).toBe(false);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return all items when all filters are enabled', () => {
    fc.assert(
      fc.property(
        fc.array(epicItemArb, { minLength: 0, maxLength: 50 }),
        (items) => {
          // Reset state
          useTimelineStore.setState(initialState);

          // Set epic items
          useTimelineStore.getState().setEpicItems(items);

          // Enable all filters
          useTimelineStore.getState().setAllEpicFilters(true);

          // Get filtered items
          const filteredItems = useTimelineStore.getState().getFilteredEpicItems();

          // Verify: all items are included
          expect(filteredItems.length).toBe(items.length);
          
          // Verify: same items (by id)
          const originalIds = new Set(items.map((item) => item.id));
          const filteredIds = new Set(filteredItems.map((item) => item.id));
          expect(filteredIds).toEqual(originalIds);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return no items when all filters are disabled', () => {
    fc.assert(
      fc.property(
        fc.array(epicItemArb, { minLength: 0, maxLength: 50 }),
        (items) => {
          // Reset state
          useTimelineStore.setState(initialState);

          // Set epic items
          useTimelineStore.getState().setEpicItems(items);

          // Disable all filters
          useTimelineStore.getState().setAllEpicFilters(false);

          // Get filtered items
          const filteredItems = useTimelineStore.getState().getFilteredEpicItems();

          // Verify: no items are included
          expect(filteredItems.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('setAllEpicFilters(true) should enable all filters', () => {
    fc.assert(
      fc.property(
        epicFiltersArb,
        (initialFilters) => {
          // Reset state
          useTimelineStore.setState(initialState);

          // Set initial random filters
          EPIC_TYPES.forEach((type) => {
            useTimelineStore.getState().setEpicFilter(type, initialFilters[type]);
          });

          // Enable all filters
          useTimelineStore.getState().setAllEpicFilters(true);

          // Verify: all filters are enabled
          const state = useTimelineStore.getState();
          EPIC_TYPES.forEach((type) => {
            expect(state.epicFilters[type]).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('setAllEpicFilters(false) should disable all filters', () => {
    fc.assert(
      fc.property(
        epicFiltersArb,
        (initialFilters) => {
          // Reset state
          useTimelineStore.setState(initialState);

          // Set initial random filters
          EPIC_TYPES.forEach((type) => {
            useTimelineStore.getState().setEpicFilter(type, initialFilters[type]);
          });

          // Disable all filters
          useTimelineStore.getState().setAllEpicFilters(false);

          // Verify: all filters are disabled
          const state = useTimelineStore.getState();
          EPIC_TYPES.forEach((type) => {
            expect(state.epicFilters[type]).toBe(false);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly filter items by individual type toggles', () => {
    fc.assert(
      fc.property(
        fc.array(epicItemArb, { minLength: 1, maxLength: 50 }),
        fc.constantFrom(...EPIC_TYPES),
        (items, typeToDisable) => {
          // Reset state
          useTimelineStore.setState(initialState);

          // Set epic items
          useTimelineStore.getState().setEpicItems(items);

          // Enable all filters first
          useTimelineStore.getState().setAllEpicFilters(true);

          // Disable one specific type
          useTimelineStore.getState().setEpicFilter(typeToDisable, false);

          // Get filtered items
          const filteredItems = useTimelineStore.getState().getFilteredEpicItems();

          // Count items of other types in original list (items that should remain)
          const otherTypesCount = items.filter(
            (item) => mapSubtypeToEpicType(item.subtype) !== typeToDisable
          ).length;

          // Verify: filtered items should equal items of other types
          expect(filteredItems.length).toBe(otherTypesCount);

          // Verify: no items of the disabled type are in filtered results
          filteredItems.forEach((item) => {
            expect(mapSubtypeToEpicType(item.subtype)).not.toBe(typeToDisable);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve filter state after multiple setEpicFilter calls', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            type: fc.constantFrom(...EPIC_TYPES),
            enabled: fc.boolean(),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (filterChanges) => {
          // Reset state
          useTimelineStore.setState(initialState);

          // Apply filter changes sequentially
          filterChanges.forEach(({ type, enabled }) => {
            useTimelineStore.getState().setEpicFilter(type, enabled);
          });

          // Build expected final state by replaying changes
          const expectedFilters: Record<EpicType, boolean> = { ...initialState.epicFilters };
          filterChanges.forEach(({ type, enabled }) => {
            expectedFilters[type] = enabled;
          });

          // Verify: final state matches expected
          const state = useTimelineStore.getState();
          EPIC_TYPES.forEach((type) => {
            expect(state.epicFilters[type]).toBe(expectedFilters[type]);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain filter consistency across getFilteredEpicItems calls', () => {
    fc.assert(
      fc.property(
        fc.array(epicItemArb, { minLength: 1, maxLength: 50 }),
        epicFiltersArb,
        (items, filters) => {
          // Reset state
          useTimelineStore.setState(initialState);

          // Set epic items
          useTimelineStore.getState().setEpicItems(items);

          // Set filters
          EPIC_TYPES.forEach((type) => {
            useTimelineStore.getState().setEpicFilter(type, filters[type]);
          });

          // Call getFilteredEpicItems multiple times
          const result1 = useTimelineStore.getState().getFilteredEpicItems();
          const result2 = useTimelineStore.getState().getFilteredEpicItems();
          const result3 = useTimelineStore.getState().getFilteredEpicItems();

          // Verify: all calls return the same result
          expect(result1.length).toBe(result2.length);
          expect(result2.length).toBe(result3.length);

          // Verify: same items in same order
          result1.forEach((item, index) => {
            const item2 = result2[index];
            const item3 = result3[index];
            expect(item2).toBeDefined();
            expect(item3).toBeDefined();
            expect(item.id).toBe(item2!.id);
            expect(item.id).toBe(item3!.id);
          });
        }
      ),
      { numRuns: 50 }
    );
  });
});
