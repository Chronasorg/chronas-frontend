/**
 * YearNotification Property Tests
 *
 * Property-based tests for the year notification component using fast-check.
 *
 * Requirements: 4.2, 4.3, 4.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { YearNotification, formatYearWithEra } from './YearNotification';

describe('YearNotification - Property Tests', () => {
  describe('Property 7: Year Era Display', () => {
    /**
     * **Property 7: Year Era Display**
     * **Validates: Requirements 4.2, 4.3, 4.4**
     *
     * For any year value, the YearNotification SHALL display:
     * - "(BC)" if the year is negative
     * - "(AD)" if the year is positive or zero
     * - The absolute year value
     */

    it('should display BC for any negative year', () => {
      fc.assert(
        fc.property(fc.integer({ min: -10000, max: -1 }), (year) => {
          const result = formatYearWithEra(year);
          expect(result.era).toBe('BC');
        }),
        { numRuns: 100 }
      );
    });

    it('should display AD for any positive year', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10000 }), (year) => {
          const result = formatYearWithEra(year);
          expect(result.era).toBe('AD');
        }),
        { numRuns: 100 }
      );
    });

    it('should display AD for year 0', () => {
      const result = formatYearWithEra(0);
      expect(result.era).toBe('AD');
    });

    it('should display absolute year value for any year', () => {
      fc.assert(
        fc.property(fc.integer({ min: -10000, max: 10000 }), (year) => {
          const result = formatYearWithEra(year);
          const expectedValue = Math.abs(year).toLocaleString();
          expect(result.value).toBe(expectedValue);
        }),
        { numRuns: 100 }
      );
    });

    it('should always produce non-empty value string for valid years', () => {
      fc.assert(
        fc.property(fc.integer({ min: -10000, max: 10000 }), (year) => {
          const result = formatYearWithEra(year);
          expect(result.value.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should always produce BC or AD era for valid years', () => {
      fc.assert(
        fc.property(fc.integer({ min: -10000, max: 10000 }), (year) => {
          const result = formatYearWithEra(year);
          expect(['BC', 'AD']).toContain(result.era);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle decimal years by rounding', () => {
      fc.assert(
        fc.property(fc.double({ min: -10000, max: 10000, noNaN: true }), (year) => {
          if (!Number.isFinite(year)) return true;

          const result = formatYearWithEra(year);
          const expectedValue = Math.abs(Math.round(year)).toLocaleString();
          expect(result.value).toBe(expectedValue);

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('YearNotification component rendering properties', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should render correct era for any year', () => {
      fc.assert(
        fc.property(fc.integer({ min: -10000, max: 10000 }), (year) => {
          const onHide = vi.fn();
          const { unmount } = render(
            <YearNotification year={year} isVisible={true} onHide={onHide} />
          );

          const eraElement = screen.getByTestId('year-era');
          const expectedEra = year < 0 ? '(BC)' : '(AD)';
          expect(eraElement).toHaveTextContent(expectedEra);

          unmount();
          return true;
        }),
        { numRuns: 50 } // Reduced for component rendering tests
      );
    });

    it('should render absolute year value for any year', () => {
      fc.assert(
        fc.property(fc.integer({ min: -10000, max: 10000 }), (year) => {
          const onHide = vi.fn();
          const { unmount } = render(
            <YearNotification year={year} isVisible={true} onHide={onHide} />
          );

          const valueElement = screen.getByTestId('year-value');
          const expectedValue = Math.abs(year).toLocaleString();
          expect(valueElement).toHaveTextContent(expectedValue);

          unmount();
          return true;
        }),
        { numRuns: 50 }
      );
    });

    it('should have visible class when isVisible is true for any year', () => {
      fc.assert(
        fc.property(fc.integer({ min: -10000, max: 10000 }), (year) => {
          const onHide = vi.fn();
          const { unmount } = render(
            <YearNotification year={year} isVisible={true} onHide={onHide} />
          );

          const notification = screen.getByTestId('year-notification');
          expect(notification.className).toContain('visible');

          unmount();
          return true;
        }),
        { numRuns: 50 }
      );
    });

    it('should not have visible class when isVisible is false for any year', () => {
      fc.assert(
        fc.property(fc.integer({ min: -10000, max: 10000 }), (year) => {
          const onHide = vi.fn();
          const { unmount } = render(
            <YearNotification year={year} isVisible={false} onHide={onHide} />
          );

          const notification = screen.getByTestId('year-notification');
          expect(notification.className).not.toContain('visible');

          unmount();
          return true;
        }),
        { numRuns: 50 }
      );
    });

    it('should have correct aria-hidden based on visibility for any year', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -10000, max: 10000 }),
          fc.boolean(),
          (year, isVisible) => {
            const onHide = vi.fn();
            const { unmount } = render(
              <YearNotification year={year} isVisible={isVisible} onHide={onHide} />
            );

            const notification = screen.getByTestId('year-notification');
            expect(notification).toHaveAttribute('aria-hidden', String(!isVisible));

            unmount();
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('formatYearWithEra edge cases', () => {
    it('should handle invalid inputs gracefully', () => {
      fc.assert(
        fc.property(
          fc.oneof(fc.constant(NaN), fc.constant(Infinity), fc.constant(-Infinity)),
          (invalidValue) => {
            const result = formatYearWithEra(invalidValue);
            expect(result.value).toBe('0');
            expect(result.era).toBe('');
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
