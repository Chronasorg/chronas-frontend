/**
 * Property-Based Tests for Format Utilities
 *
 * Feature: map-interactions
 * Property 2: Population Formatting Consistency
 *
 * Validates: Requirements 1.6
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatPopulation } from './formatUtils';

describe('formatPopulation - Property Tests', () => {
  /**
   * Property 2: Population Formatting Consistency
   *
   * For any population value, the formatPopulation function SHALL return a string formatted as:
   * - "{value}M" for values >= 1,000,000
   * - "{value}k" for values >= 1,000 and < 1,000,000
   * - "{value}" for values < 1,000
   *
   * **Validates: Requirements 1.6**
   */
  describe('Property 2: Population Formatting Consistency', () => {
    it('should format populations >= 1,000,000 as millions (X.XM or XM)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1_000_000, max: 100_000_000 }),
          (population) => {
            const result = formatPopulation(population);
            expect(result).toMatch(/^\d+(\.\d)?M$/);
            
            // Verify the numeric value is correct
            const numericPart = parseFloat(result.replace('M', ''));
            const expectedMillions = population / 1_000_000;
            expect(numericPart).toBeCloseTo(expectedMillions, 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format populations >= 1,000 and < 1,000,000 as thousands (X.Xk or Xk)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1_000, max: 999_999 }),
          (population) => {
            const result = formatPopulation(population);
            expect(result).toMatch(/^\d+(\.\d)?k$/);
            
            // Verify the numeric value is correct (within 0.1 due to rounding to 1 decimal place)
            const numericPart = parseFloat(result.replace('k', ''));
            const expectedThousands = population / 1_000;
            // Use tolerance of 0.1 since formatPopulation rounds to 1 decimal place
            expect(Math.abs(numericPart - expectedThousands)).toBeLessThanOrEqual(0.1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format populations < 1,000 as raw integers', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 999 }),
          (population) => {
            const result = formatPopulation(population);
            expect(result).toMatch(/^\d+$/);
            expect(parseInt(result, 10)).toBe(Math.floor(population));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always return a non-empty string', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100_000_000 }),
          (population) => {
            const result = formatPopulation(population);
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce consistent results for the same input', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100_000_000 }),
          (population) => {
            const result1 = formatPopulation(population);
            const result2 = formatPopulation(population);
            expect(result1).toBe(result2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle negative values by returning "0"', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -100_000_000, max: -1 }),
          (population) => {
            const result = formatPopulation(population);
            expect(result).toBe('0');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero', () => {
      expect(formatPopulation(0)).toBe('0');
    });

    it('should handle boundary value 999 as raw number', () => {
      expect(formatPopulation(999)).toBe('999');
    });

    it('should handle boundary value 1000 as thousands', () => {
      expect(formatPopulation(1000)).toBe('1k');
    });

    it('should handle boundary value 999999 as thousands', () => {
      expect(formatPopulation(999999)).toBe('1000k');
    });

    it('should handle boundary value 1000000 as millions', () => {
      expect(formatPopulation(1000000)).toBe('1M');
    });

    it('should handle exactly 1.5 million', () => {
      expect(formatPopulation(1500000)).toBe('1.5M');
    });

    it('should handle exactly 1.5 thousand', () => {
      expect(formatPopulation(1500)).toBe('1.5k');
    });

    it('should handle NaN by returning "0"', () => {
      expect(formatPopulation(NaN)).toBe('0');
    });

    it('should handle Infinity by returning "0"', () => {
      expect(formatPopulation(Infinity)).toBe('0');
    });

    it('should handle -Infinity by returning "0"', () => {
      expect(formatPopulation(-Infinity)).toBe('0');
    });
  });
});
