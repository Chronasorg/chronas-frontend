/**
 * Timeline Configuration Property Tests
 *
 * Property-based tests for zoom bounds and configuration.
 * Uses fast-check for property-based testing.
 *
 * Feature: timeline-migration
 * Property 18: Zoom Bounds Constraint
 * Requirements: 11.3, 11.4
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  MIN_YEAR,
  MAX_YEAR,
  EXTENDED_MIN_YEAR,
  EXTENDED_MAX_YEAR,
  MIN_VISIBLE_YEARS,
  ZOOM_MIN_MS,
  ZOOM_MAX_MS,
  getCollapsedTimelineOptions,
  getExpandedTimelineOptions,
  getTimelineOptions,
  yearToISOString,
} from './timelineConfig';

/** Milliseconds per year (approximate) */
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

describe('Timeline Configuration Property Tests', () => {
  describe('Property 18: Zoom Bounds Constraint', () => {
    /**
     * Property 18: Zoom Bounds Constraint
     * For any zoom operation:
     * - The visible range SHALL NOT be less than 10 years (minimum zoom)
     * - The visible range SHALL NOT exceed the full range of -2500 to 2500 (maximum zoom)
     *
     * **Validates: Requirements 11.3, 11.4**
     */
    it('should enforce minimum zoom level of 10 years', () => {
      fc.assert(
        fc.property(fc.boolean(), (isExpanded) => {
          const options = getTimelineOptions(isExpanded);

          // zoomMin should be at least 10 years in milliseconds
          expect(options.zoomMin).toBeDefined();
          expect(options.zoomMin).toBeGreaterThanOrEqual(MIN_VISIBLE_YEARS * MS_PER_YEAR * 0.99); // Allow 1% tolerance
        }),
        { numRuns: 100 }
      );
    });

    it('should enforce maximum zoom level covering full range', () => {
      fc.assert(
        fc.property(fc.boolean(), (isExpanded) => {
          const options = getTimelineOptions(isExpanded);

          // zoomMax should cover the full extended range
          const expectedMaxMs = (EXTENDED_MAX_YEAR - EXTENDED_MIN_YEAR) * MS_PER_YEAR;
          expect(options.zoomMax).toBeDefined();
          expect(options.zoomMax).toBeLessThanOrEqual(expectedMaxMs * 1.01); // Allow 1% tolerance
        }),
        { numRuns: 100 }
      );
    });

    it('should have min/max dates covering extended range', () => {
      fc.assert(
        fc.property(fc.boolean(), (isExpanded) => {
          const options = getTimelineOptions(isExpanded);

          // min should be at or before EXTENDED_MIN_YEAR
          expect(options.min).toBeDefined();
          const minDate = new Date(options.min!);
          expect(minDate.getFullYear()).toBeLessThanOrEqual(EXTENDED_MIN_YEAR + 1);

          // max should be at or after EXTENDED_MAX_YEAR
          expect(options.max).toBeDefined();
          const maxDate = new Date(options.max!);
          expect(maxDate.getFullYear()).toBeGreaterThanOrEqual(EXTENDED_MAX_YEAR - 1);
        }),
        { numRuns: 100 }
      );
    });

    it('should have zoomMin less than zoomMax', () => {
      fc.assert(
        fc.property(fc.boolean(), (isExpanded) => {
          const options = getTimelineOptions(isExpanded);

          expect(options.zoomMin).toBeDefined();
          expect(options.zoomMax).toBeDefined();
          expect(options.zoomMin).toBeLessThan(options.zoomMax!);
        }),
        { numRuns: 100 }
      );
    });

    it('should generate valid zoom constraints for any random zoom level', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5000 }), // Random zoom level in years
          (zoomYears) => {
            const zoomMs = zoomYears * MS_PER_YEAR;

            // Check if zoom level is within bounds
            const isWithinBounds = zoomMs >= ZOOM_MIN_MS && zoomMs <= ZOOM_MAX_MS;

            // If within bounds, it should be valid
            if (zoomYears >= MIN_VISIBLE_YEARS && zoomYears <= (EXTENDED_MAX_YEAR - EXTENDED_MIN_YEAR)) {
              expect(isWithinBounds).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('yearToISOString', () => {
    it('should convert any valid year to ISO string', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: MIN_YEAR, max: MAX_YEAR }).filter(y => y !== 0), // Exclude year 0 (special case)
          (year) => {
            const isoString = yearToISOString(year);

            // Should be a valid date string
            const parsedDate = new Date(isoString);
            expect(parsedDate.toString()).not.toBe('Invalid Date');

            // Should parse back to approximately the same year
            expect(parsedDate.getFullYear()).toBe(year);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle negative years (BCE)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -2000, max: -1 }),
          (year) => {
            const isoString = yearToISOString(year);
            const parsedDate = new Date(isoString);

            // Should preserve the negative year
            expect(parsedDate.getFullYear()).toBe(year);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle year 0 specially', () => {
      // Year 0 in JavaScript Date is actually 1 BCE
      const isoString = yearToISOString(0);
      const parsedDate = new Date(isoString);
      expect(parsedDate.getFullYear()).toBe(0);
    });
  });

  describe('Configuration consistency', () => {
    it('should have consistent options between collapsed and expanded states', () => {
      const collapsed = getCollapsedTimelineOptions();
      const expanded = getExpandedTimelineOptions();

      // These should be the same
      expect(collapsed.zoomMin).toBe(expanded.zoomMin);
      expect(collapsed.zoomMax).toBe(expanded.zoomMax);
      expect(collapsed.min).toBe(expanded.min);
      expect(collapsed.max).toBe(expanded.max);
      expect(collapsed.width).toBe(expanded.width);

      // These should differ
      expect(collapsed.height).not.toBe(expanded.height);
      expect(collapsed.stack).not.toBe(expanded.stack);
    });

    it('should return correct options based on expanded state', () => {
      fc.assert(
        fc.property(fc.boolean(), (isExpanded) => {
          const options = getTimelineOptions(isExpanded);

          if (isExpanded) {
            expect(options.stack).toBe(true);
            expect(options.height).toBe(400);
          } else {
            expect(options.stack).toBe(false);
            expect(options.height).toBe(120);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
