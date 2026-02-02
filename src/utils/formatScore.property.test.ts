/**
 * Property-Based Tests for Score Formatting
 *
 * Feature: header-navigation-migration
 * Property 7: Score Formatting
 *
 * Validates: Requirements 5.4, 5.5
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatScore } from './formatScore';

describe('formatScore - Property Tests', () => {
  /**
   * Property 7: Score Formatting
   *
   * For any numeric score value:
   * - If score > 100,000, the formatted output SHALL be `${Math.floor(score/1000000)}m`
   * - If score > 1,000, the formatted output SHALL be `${Math.floor(score/1000)}k`
   * - Otherwise, the formatted output SHALL be the string representation of the score
   *
   * **Validates: Requirements 5.4, 5.5**
   */
  describe('Property 7: Score Formatting', () => {
    it('should format scores > 100,000 as millions (Xm)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100001, max: 10000000 }),
          (score) => {
            const result = formatScore(score);
            const expectedMillions = Math.floor(score / 1000000);
            expect(result).toBe(`${String(expectedMillions)}m`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format scores > 1,000 and <= 100,000 as thousands (Xk)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1001, max: 100000 }),
          (score) => {
            const result = formatScore(score);
            const expectedThousands = Math.floor(score / 1000);
            expect(result).toBe(`${String(expectedThousands)}k`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format scores <= 1,000 as raw numbers', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          (score) => {
            const result = formatScore(score);
            expect(result).toBe(String(score));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always return a string', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000000 }),
          (score) => {
            const result = formatScore(score);
            expect(typeof result).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce consistent results for the same input', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000000 }),
          (score) => {
            const result1 = formatScore(score);
            const result2 = formatScore(score);
            expect(result1).toBe(result2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle boundary value 1000 as raw number', () => {
      expect(formatScore(1000)).toBe('1000');
    });

    it('should handle boundary value 1001 as thousands', () => {
      expect(formatScore(1001)).toBe('1k');
    });

    it('should handle boundary value 100000 as thousands', () => {
      expect(formatScore(100000)).toBe('100k');
    });

    it('should handle boundary value 100001 as millions', () => {
      expect(formatScore(100001)).toBe('0m');
    });

    it('should handle zero', () => {
      expect(formatScore(0)).toBe('0');
    });

    it('should handle exactly 1 million', () => {
      expect(formatScore(1000000)).toBe('1m');
    });
  });
});
