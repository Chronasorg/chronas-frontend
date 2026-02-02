/**
 * YearDisplay Property-Based Tests
 *
 * **Feature: timeline-migration, Property 1: Year Display Consistency**
 * **Validates: Requirements 2.1, 5.3**
 *
 * **Feature: timeline-migration, Property 3: Year Label Edge Adjustment**
 * **Validates: Requirements 2.5**
 *
 * **Feature: timeline-migration, Property 5: Suggested Year Display Logic**
 * **Validates: Requirements 4.1, 4.6**
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { YearDisplay } from './YearDisplay';
import { formatYearForDisplay } from '../../../utils/yearUtils';
import { MIN_YEAR, MAX_YEAR } from '../../../stores/timelineStore';

describe('YearDisplay Property Tests', () => {
  describe('Property 1: Year Display Consistency', () => {
    it('should display the correct formatted year for any valid year', () => {
      fc.assert(
        fc.property(fc.integer({ min: MIN_YEAR, max: MAX_YEAR }), (year) => {
          const onYearClick = vi.fn();
          const { unmount } = render(
            <YearDisplay selectedYear={year} suggestedYear={null} onYearClick={onYearClick} />
          );
          const yearLabel = screen.getByTestId('year-label');
          expect(yearLabel).toHaveTextContent(formatYearForDisplay(year));
          unmount();
        }),
        { numRuns: 100 }
      );
    });

    it('should display positive years correctly', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: MAX_YEAR }), (year) => {
          const onYearClick = vi.fn();
          const { unmount } = render(
            <YearDisplay selectedYear={year} suggestedYear={null} onYearClick={onYearClick} />
          );
          const yearLabel = screen.getByTestId('year-label');
          expect(yearLabel.textContent).toBe(year.toString());
          unmount();
        }),
        { numRuns: 100 }
      );
    });

    it('should display negative years correctly with minus sign', () => {
      fc.assert(
        fc.property(fc.integer({ min: MIN_YEAR, max: -1 }), (year) => {
          const onYearClick = vi.fn();
          const { unmount } = render(
            <YearDisplay selectedYear={year} suggestedYear={null} onYearClick={onYearClick} />
          );
          const yearLabel = screen.getByTestId('year-label');
          expect(yearLabel.textContent).toContain('-');
          expect(yearLabel.textContent).toBe(year.toString());
          unmount();
        }),
        { numRuns: 100 }
      );
    });


    it('should include the year in the aria-label for accessibility', () => {
      fc.assert(
        fc.property(fc.integer({ min: MIN_YEAR, max: MAX_YEAR }), (year) => {
          const onYearClick = vi.fn();
          const { unmount } = render(
            <YearDisplay selectedYear={year} suggestedYear={null} onYearClick={onYearClick} />
          );
          const yearLabel = screen.getByTestId('year-label');
          const ariaLabel = yearLabel.getAttribute('aria-label');
          expect(ariaLabel).toContain(formatYearForDisplay(year));
          unmount();
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: Year Label Edge Adjustment', () => {
    it('should set data-near-edge attribute to match isNearEdge prop', () => {
      fc.assert(
        fc.property(fc.boolean(), fc.integer({ min: MIN_YEAR, max: MAX_YEAR }), (isNearEdge, year) => {
          const onYearClick = vi.fn();
          const { unmount } = render(
            <YearDisplay selectedYear={year} suggestedYear={null} onYearClick={onYearClick} isNearEdge={isNearEdge} />
          );
          const container = screen.getByTestId('year-display');
          expect(container).toHaveAttribute('data-near-edge', String(isNearEdge));
          unmount();
        }),
        { numRuns: 100 }
      );
    });

    it('should apply nearEdge CSS class when isNearEdge is true', () => {
      fc.assert(
        fc.property(fc.integer({ min: MIN_YEAR, max: MAX_YEAR }), (year) => {
          const onYearClick = vi.fn();
          const { unmount } = render(
            <YearDisplay selectedYear={year} suggestedYear={null} onYearClick={onYearClick} isNearEdge={true} />
          );
          const container = screen.getByTestId('year-display');
          expect(container.className).toContain('nearEdge');
          expect(container).toHaveAttribute('data-near-edge', 'true');
          unmount();
        }),
        { numRuns: 100 }
      );
    });

    it('should not apply nearEdge CSS class when isNearEdge is false', () => {
      fc.assert(
        fc.property(fc.integer({ min: MIN_YEAR, max: MAX_YEAR }), (year) => {
          const onYearClick = vi.fn();
          const { unmount } = render(
            <YearDisplay selectedYear={year} suggestedYear={null} onYearClick={onYearClick} isNearEdge={false} />
          );
          const container = screen.getByTestId('year-display');
          expect(container.className).not.toContain('nearEdge');
          expect(container).toHaveAttribute('data-near-edge', 'false');
          unmount();
        }),
        { numRuns: 100 }
      );
    });


    it('should default to no edge adjustment when isNearEdge is not provided', () => {
      fc.assert(
        fc.property(fc.integer({ min: MIN_YEAR, max: MAX_YEAR }), (year) => {
          const onYearClick = vi.fn();
          const { unmount } = render(
            <YearDisplay selectedYear={year} suggestedYear={null} onYearClick={onYearClick} />
          );
          const container = screen.getByTestId('year-display');
          expect(container.className).not.toContain('nearEdge');
          expect(container).toHaveAttribute('data-near-edge', 'false');
          unmount();
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain edge adjustment with suggested year visible', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          fc.integer({ min: MIN_YEAR, max: MAX_YEAR }),
          fc.integer({ min: MIN_YEAR, max: MAX_YEAR }),
          (isNearEdge, selectedYear, suggestedYear) => {
            fc.pre(selectedYear !== suggestedYear);
            const onYearClick = vi.fn();
            const { unmount } = render(
              <YearDisplay selectedYear={selectedYear} suggestedYear={suggestedYear} onYearClick={onYearClick} isNearEdge={isNearEdge} />
            );
            const container = screen.getByTestId('year-display');
            expect(container).toHaveAttribute('data-near-edge', String(isNearEdge));
            if (isNearEdge) {
              expect(container.className).toContain('nearEdge');
            } else {
              expect(container.className).not.toContain('nearEdge');
            }
            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 5: Suggested Year Display Logic', () => {
    it('should hide suggested year when it equals selected year', () => {
      fc.assert(
        fc.property(fc.integer({ min: MIN_YEAR, max: MAX_YEAR }), (year) => {
          const onYearClick = vi.fn();
          const { unmount } = render(
            <YearDisplay selectedYear={year} suggestedYear={year} onYearClick={onYearClick} />
          );
          const suggestedYearEl = screen.getByTestId('suggested-year');
          expect(suggestedYearEl).toHaveAttribute('aria-hidden', 'true');
          unmount();
        }),
        { numRuns: 100 }
      );
    });


    it('should show suggested year when it differs from selected year', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: MIN_YEAR, max: MAX_YEAR }),
          fc.integer({ min: MIN_YEAR, max: MAX_YEAR }),
          (selectedYear, suggestedYear) => {
            fc.pre(selectedYear !== suggestedYear);
            const onYearClick = vi.fn();
            const { unmount } = render(
              <YearDisplay selectedYear={selectedYear} suggestedYear={suggestedYear} onYearClick={onYearClick} />
            );
            const suggestedYearEl = screen.getByTestId('suggested-year');
            expect(suggestedYearEl).toHaveAttribute('aria-hidden', 'false');
            expect(suggestedYearEl).toHaveTextContent(formatYearForDisplay(suggestedYear));
            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should hide suggested year when it is null', () => {
      fc.assert(
        fc.property(fc.integer({ min: MIN_YEAR, max: MAX_YEAR }), (selectedYear) => {
          const onYearClick = vi.fn();
          const { unmount } = render(
            <YearDisplay selectedYear={selectedYear} suggestedYear={null} onYearClick={onYearClick} />
          );
          const suggestedYearEl = screen.getByTestId('suggested-year');
          expect(suggestedYearEl).toHaveAttribute('aria-hidden', 'true');
          unmount();
        }),
        { numRuns: 100 }
      );
    });

    it('should display arrow indicator when suggested year is visible', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: MIN_YEAR, max: MAX_YEAR }),
          fc.integer({ min: MIN_YEAR, max: MAX_YEAR }),
          (selectedYear, suggestedYear) => {
            fc.pre(selectedYear !== suggestedYear);
            const onYearClick = vi.fn();
            const { unmount } = render(
              <YearDisplay selectedYear={selectedYear} suggestedYear={suggestedYear} onYearClick={onYearClick} />
            );
            const suggestedYearEl = screen.getByTestId('suggested-year');
            expect(suggestedYearEl).toHaveTextContent('▼');
            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly format negative suggested years', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: MAX_YEAR }),
          fc.integer({ min: MIN_YEAR, max: -1 }),
          (selectedYear, suggestedYear) => {
            const onYearClick = vi.fn();
            const { unmount } = render(
              <YearDisplay selectedYear={selectedYear} suggestedYear={suggestedYear} onYearClick={onYearClick} />
            );
            const suggestedYearEl = screen.getByTestId('suggested-year');
            expect(suggestedYearEl).toHaveAttribute('aria-hidden', 'false');
            expect(suggestedYearEl).toHaveTextContent('-');
            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
