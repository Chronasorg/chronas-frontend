/**
 * Year Utilities Property-Based Tests
 *
 * Property-based tests for year manipulation, validation, and clamping functions.
 * Uses fast-check library to generate random test inputs and verify universal properties.
 *
 * **Feature: timeline-migration, Property 2: Year Range Validation and Clamping**
 * **Validates: Requirements 2.6, 5.4, 7.4**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { clampYear, isValidYear, MIN_YEAR, MAX_YEAR, DEFAULT_YEAR } from './yearUtils';

describe('yearUtils Property Tests', () => {
  /**
   * **Feature: timeline-migration, Property 2: Year Range Validation and Clamping**
   *
   * Property 2 states:
   * *For any* year value:
   * - If the year is within the range [-2000, 2000], it SHALL be accepted as-is
   * - If the year is less than -2000, it SHALL be clamped to -2000
   * - If the year is greater than 2000, it SHALL be clamped to 2000
   *
   * **Validates: Requirements 2.6, 5.4, 7.4**
   */
  describe('Property 2: Year Range Validation and Clamping', () => {
    it('should accept years within valid range [-2000, 2000] as-is', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: MIN_YEAR, max: MAX_YEAR }),
          (year) => {
            const clamped = clampYear(year);
            expect(clamped).toBe(year);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clamp years less than -2000 to -2000', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -10000, max: MIN_YEAR - 1 }),
          (year) => {
            const clamped = clampYear(year);
            expect(clamped).toBe(MIN_YEAR);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clamp years greater than 2000 to 2000', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: MAX_YEAR + 1, max: 10000 }),
          (year) => {
            const clamped = clampYear(year);
            expect(clamped).toBe(MAX_YEAR);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always return a value within the valid range for any integer input', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -10000, max: 10000 }),
          (year) => {
            const clamped = clampYear(year);
            expect(clamped).toBeGreaterThanOrEqual(MIN_YEAR);
            expect(clamped).toBeLessThanOrEqual(MAX_YEAR);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be idempotent - clamping a clamped value returns the same value', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -10000, max: 10000 }),
          (year) => {
            const clamped = clampYear(year);
            const doubleClamped = clampYear(clamped);
            expect(doubleClamped).toBe(clamped);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: timeline-migration, Property 2: Year Range Validation and Clamping**
   *
   * Tests for isValidYear function which validates if a year is within the valid range.
   *
   * **Validates: Requirements 2.6, 5.4, 7.4**
   */
  describe('isValidYear validation', () => {
    it('should return true for all years within valid range [-2000, 2000]', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: MIN_YEAR, max: MAX_YEAR }),
          (year) => {
            expect(isValidYear(year)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return false for all years less than -2000', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -10000, max: MIN_YEAR - 1 }),
          (year) => {
            expect(isValidYear(year)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return false for all years greater than 2000', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: MAX_YEAR + 1, max: 10000 }),
          (year) => {
            expect(isValidYear(year)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be consistent with clampYear - valid years are unchanged by clamping', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -10000, max: 10000 }),
          (year) => {
            const isValid = isValidYear(year);
            const clamped = clampYear(year);
            
            if (isValid) {
              // Valid years should be unchanged by clamping
              expect(clamped).toBe(year);
            } else {
              // Invalid years should be clamped to a boundary
              expect(clamped === MIN_YEAR || clamped === MAX_YEAR || clamped === DEFAULT_YEAR).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: timeline-migration, Property 2: Year Range Validation and Clamping**
   *
   * Tests for floating point year handling - verifies rounding behavior.
   *
   * **Validates: Requirements 2.6, 5.4, 7.4**
   */
  describe('Floating point year handling', () => {
    it('should round floating point years and then clamp', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -10000, max: 10000, noNaN: true, noDefaultInfinity: true }),
          (year) => {
            const clamped = clampYear(year);
            const expectedRounded = Math.round(year);
            const expectedClamped = Math.max(MIN_YEAR, Math.min(MAX_YEAR, expectedRounded));
            
            expect(clamped).toBe(expectedClamped);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always return an integer value', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -10000, max: 10000, noNaN: true, noDefaultInfinity: true }),
          (year) => {
            const clamped = clampYear(year);
            expect(Number.isInteger(clamped)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: timeline-migration, Property 2: Year Range Validation and Clamping**
   *
   * Tests for edge cases and special values.
   *
   * **Validates: Requirements 2.6, 5.4, 7.4**
   */
  describe('Special value handling', () => {
    it('should return DEFAULT_YEAR for NaN', () => {
      expect(clampYear(NaN)).toBe(DEFAULT_YEAR);
    });

    it('should return DEFAULT_YEAR for Infinity', () => {
      expect(clampYear(Infinity)).toBe(DEFAULT_YEAR);
      expect(clampYear(-Infinity)).toBe(DEFAULT_YEAR);
    });

    it('should return false for NaN in isValidYear', () => {
      expect(isValidYear(NaN)).toBe(false);
    });

    it('should return false for Infinity in isValidYear', () => {
      expect(isValidYear(Infinity)).toBe(false);
      expect(isValidYear(-Infinity)).toBe(false);
    });
  });

  /**
   * **Feature: timeline-migration, Property 2: Year Range Validation and Clamping**
   *
   * Boundary value tests to ensure correct behavior at the edges of the valid range.
   *
   * **Validates: Requirements 2.6, 5.4, 7.4**
   */
  describe('Boundary value properties', () => {
    it('should correctly handle values at and around MIN_YEAR boundary', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: MIN_YEAR - 10, max: MIN_YEAR + 10 }),
          (year) => {
            const clamped = clampYear(year);
            
            if (year < MIN_YEAR) {
              expect(clamped).toBe(MIN_YEAR);
            } else if (year > MAX_YEAR) {
              expect(clamped).toBe(MAX_YEAR);
            } else {
              expect(clamped).toBe(year);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly handle values at and around MAX_YEAR boundary', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: MAX_YEAR - 10, max: MAX_YEAR + 10 }),
          (year) => {
            const clamped = clampYear(year);
            
            if (year > MAX_YEAR) {
              expect(clamped).toBe(MAX_YEAR);
            } else if (year < MIN_YEAR) {
              expect(clamped).toBe(MIN_YEAR);
            } else {
              expect(clamped).toBe(year);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have isValidYear return true exactly at boundaries', () => {
      expect(isValidYear(MIN_YEAR)).toBe(true);
      expect(isValidYear(MAX_YEAR)).toBe(true);
      expect(isValidYear(MIN_YEAR - 1)).toBe(false);
      expect(isValidYear(MAX_YEAR + 1)).toBe(false);
    });
  });
});
