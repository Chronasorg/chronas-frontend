/**
 * YearDialog Property-Based Tests
 *
 * **Feature: timeline-migration, Property 10: Year Dialog Submission**
 * **Validates: Requirements 7.7**
 *
 * Property tests for YearDialog submission behavior using fast-check.
 * Tests verify that:
 * 1. For any valid year in range [-2000, 2000], submission calls onSubmit with that year
 * 2. For any valid year, submission calls onClose
 * 3. For any year outside range, submission clamps to valid range
 * 4. For any valid year, Enter key triggers submission
 * 5. For any valid year, search button click triggers submission
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { YearDialog } from './YearDialog';
import { MIN_YEAR, MAX_YEAR, clampYear } from '../../../utils/yearUtils';

describe('YearDialog Property Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  describe('Property 10: Year Dialog Submission', () => {
    /**
     * Property 10.1: For any valid year in range [-2000, 2000], submission should call onSubmit with that year
     */
    it('should call onSubmit with the exact year for any valid year in range', () => {
      fc.assert(
        fc.property(fc.integer({ min: MIN_YEAR, max: MAX_YEAR }), (year) => {
          const onSubmit = vi.fn();
          const onClose = vi.fn();

          render(
            <YearDialog isOpen={true} onClose={onClose} onSubmit={onSubmit} />
          );

          const input = screen.getByTestId('year-dialog-input');
          fireEvent.change(input, { target: { value: year.toString() } });

          const searchButton = screen.getByTestId('year-dialog-search');
          fireEvent.click(searchButton);

          expect(onSubmit).toHaveBeenCalledTimes(1);
          expect(onSubmit).toHaveBeenCalledWith(year);

          cleanup();
          vi.clearAllMocks();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 10.2: For any valid year, submission should call onClose
     */
    it('should call onClose after submission for any valid year', () => {
      fc.assert(
        fc.property(fc.integer({ min: MIN_YEAR, max: MAX_YEAR }), (year) => {
          const onSubmit = vi.fn();
          const onClose = vi.fn();

          render(
            <YearDialog isOpen={true} onClose={onClose} onSubmit={onSubmit} />
          );

          const input = screen.getByTestId('year-dialog-input');
          fireEvent.change(input, { target: { value: year.toString() } });

          const searchButton = screen.getByTestId('year-dialog-search');
          fireEvent.click(searchButton);

          expect(onClose).toHaveBeenCalledTimes(1);

          cleanup();
          vi.clearAllMocks();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 10.3: For any year outside range, submission should clamp to valid range
     */
    it('should clamp years above MAX_YEAR to MAX_YEAR', () => {
      fc.assert(
        fc.property(fc.integer({ min: MAX_YEAR + 1, max: 10000 }), (year) => {
          const onSubmit = vi.fn();
          const onClose = vi.fn();

          render(
            <YearDialog isOpen={true} onClose={onClose} onSubmit={onSubmit} />
          );

          const input = screen.getByTestId('year-dialog-input');
          fireEvent.change(input, { target: { value: year.toString() } });

          const searchButton = screen.getByTestId('year-dialog-search');
          fireEvent.click(searchButton);

          expect(onSubmit).toHaveBeenCalledTimes(1);
          expect(onSubmit).toHaveBeenCalledWith(MAX_YEAR);

          cleanup();
          vi.clearAllMocks();
        }),
        { numRuns: 100 }
      );
    });

    it('should clamp years below MIN_YEAR to MIN_YEAR', () => {
      fc.assert(
        fc.property(fc.integer({ min: -10000, max: MIN_YEAR - 1 }), (year) => {
          const onSubmit = vi.fn();
          const onClose = vi.fn();

          render(
            <YearDialog isOpen={true} onClose={onClose} onSubmit={onSubmit} />
          );

          const input = screen.getByTestId('year-dialog-input');
          fireEvent.change(input, { target: { value: year.toString() } });

          const searchButton = screen.getByTestId('year-dialog-search');
          fireEvent.click(searchButton);

          expect(onSubmit).toHaveBeenCalledTimes(1);
          expect(onSubmit).toHaveBeenCalledWith(MIN_YEAR);

          cleanup();
          vi.clearAllMocks();
        }),
        { numRuns: 100 }
      );
    });

    it('should clamp any out-of-range year to the correct boundary', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -10000, max: 10000 }).filter((y) => y < MIN_YEAR || y > MAX_YEAR),
          (year) => {
            const onSubmit = vi.fn();
            const onClose = vi.fn();

            render(
              <YearDialog isOpen={true} onClose={onClose} onSubmit={onSubmit} />
            );

            const input = screen.getByTestId('year-dialog-input');
            fireEvent.change(input, { target: { value: year.toString() } });

            const searchButton = screen.getByTestId('year-dialog-search');
            fireEvent.click(searchButton);

            const expectedYear = clampYear(year);
            expect(onSubmit).toHaveBeenCalledTimes(1);
            expect(onSubmit).toHaveBeenCalledWith(expectedYear);

            cleanup();
            vi.clearAllMocks();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 10.4: For any valid year, Enter key should trigger submission
     */
    it('should trigger submission via Enter key for any valid year', () => {
      fc.assert(
        fc.property(fc.integer({ min: MIN_YEAR, max: MAX_YEAR }), (year) => {
          const onSubmit = vi.fn();
          const onClose = vi.fn();

          render(
            <YearDialog isOpen={true} onClose={onClose} onSubmit={onSubmit} />
          );

          const input = screen.getByTestId('year-dialog-input');
          fireEvent.change(input, { target: { value: year.toString() } });
          fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

          expect(onSubmit).toHaveBeenCalledTimes(1);
          expect(onSubmit).toHaveBeenCalledWith(year);
          expect(onClose).toHaveBeenCalledTimes(1);

          cleanup();
          vi.clearAllMocks();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 10.5: For any valid year, search button click should trigger submission
     */
    it('should trigger submission via search button click for any valid year', () => {
      fc.assert(
        fc.property(fc.integer({ min: MIN_YEAR, max: MAX_YEAR }), (year) => {
          const onSubmit = vi.fn();
          const onClose = vi.fn();

          render(
            <YearDialog isOpen={true} onClose={onClose} onSubmit={onSubmit} />
          );

          const input = screen.getByTestId('year-dialog-input');
          fireEvent.change(input, { target: { value: year.toString() } });

          const searchButton = screen.getByTestId('year-dialog-search');
          fireEvent.click(searchButton);

          expect(onSubmit).toHaveBeenCalledTimes(1);
          expect(onSubmit).toHaveBeenCalledWith(year);
          expect(onClose).toHaveBeenCalledTimes(1);

          cleanup();
          vi.clearAllMocks();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Additional property: Both Enter key and search button should produce identical results
     */
    it('should produce identical results for Enter key and search button submission', () => {
      fc.assert(
        fc.property(fc.integer({ min: MIN_YEAR, max: MAX_YEAR }), (year) => {
          // Test Enter key submission
          const onSubmitEnter = vi.fn();
          const onCloseEnter = vi.fn();

          render(
            <YearDialog isOpen={true} onClose={onCloseEnter} onSubmit={onSubmitEnter} />
          );

          const inputEnter = screen.getByTestId('year-dialog-input');
          fireEvent.change(inputEnter, { target: { value: year.toString() } });
          fireEvent.keyDown(inputEnter, { key: 'Enter', code: 'Enter' });

          cleanup();

          // Test search button submission
          const onSubmitButton = vi.fn();
          const onCloseButton = vi.fn();

          render(
            <YearDialog isOpen={true} onClose={onCloseButton} onSubmit={onSubmitButton} />
          );

          const inputButton = screen.getByTestId('year-dialog-input');
          fireEvent.change(inputButton, { target: { value: year.toString() } });

          const searchButton = screen.getByTestId('year-dialog-search');
          fireEvent.click(searchButton);

          // Both methods should call onSubmit with the same year
          expect(onSubmitEnter).toHaveBeenCalledWith(year);
          expect(onSubmitButton).toHaveBeenCalledWith(year);

          // Both methods should call onClose
          expect(onCloseEnter).toHaveBeenCalledTimes(1);
          expect(onCloseButton).toHaveBeenCalledTimes(1);

          cleanup();
          vi.clearAllMocks();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Negative years should be submitted correctly
     */
    it('should correctly submit negative years', () => {
      fc.assert(
        fc.property(fc.integer({ min: MIN_YEAR, max: -1 }), (year) => {
          const onSubmit = vi.fn();
          const onClose = vi.fn();

          render(
            <YearDialog isOpen={true} onClose={onClose} onSubmit={onSubmit} />
          );

          const input = screen.getByTestId('year-dialog-input');
          fireEvent.change(input, { target: { value: year.toString() } });

          const searchButton = screen.getByTestId('year-dialog-search');
          fireEvent.click(searchButton);

          expect(onSubmit).toHaveBeenCalledTimes(1);
          expect(onSubmit).toHaveBeenCalledWith(year);
          expect(year).toBeLessThan(0);

          cleanup();
          vi.clearAllMocks();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Year 0 should be submitted correctly
     */
    it('should correctly submit year 0', () => {
      const onSubmit = vi.fn();
      const onClose = vi.fn();

      render(
        <YearDialog isOpen={true} onClose={onClose} onSubmit={onSubmit} />
      );

      const input = screen.getByTestId('year-dialog-input');
      fireEvent.change(input, { target: { value: '0' } });

      const searchButton = screen.getByTestId('year-dialog-search');
      fireEvent.click(searchButton);

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith(0);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    /**
     * Property: Boundary years should be submitted correctly
     */
    it('should correctly submit boundary years', () => {
      fc.assert(
        fc.property(fc.constantFrom(MIN_YEAR, MAX_YEAR), (year) => {
          const onSubmit = vi.fn();
          const onClose = vi.fn();

          render(
            <YearDialog isOpen={true} onClose={onClose} onSubmit={onSubmit} />
          );

          const input = screen.getByTestId('year-dialog-input');
          fireEvent.change(input, { target: { value: year.toString() } });

          const searchButton = screen.getByTestId('year-dialog-search');
          fireEvent.click(searchButton);

          expect(onSubmit).toHaveBeenCalledTimes(1);
          expect(onSubmit).toHaveBeenCalledWith(year);

          cleanup();
          vi.clearAllMocks();
        }),
        { numRuns: 10 }
      );
    });

    /**
     * Property: Submission should not occur for empty input
     */
    it('should not call onSubmit for empty input', () => {
      const onSubmit = vi.fn();
      const onClose = vi.fn();

      render(
        <YearDialog isOpen={true} onClose={onClose} onSubmit={onSubmit} />
      );

      const searchButton = screen.getByTestId('year-dialog-search');
      fireEvent.click(searchButton);

      expect(onSubmit).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });

    /**
     * Property: Submission should not occur for minus-only input
     */
    it('should not call onSubmit for minus-only input', () => {
      const onSubmit = vi.fn();
      const onClose = vi.fn();

      render(
        <YearDialog isOpen={true} onClose={onClose} onSubmit={onSubmit} />
      );

      const input = screen.getByTestId('year-dialog-input');
      fireEvent.change(input, { target: { value: '-' } });

      const searchButton = screen.getByTestId('year-dialog-search');
      fireEvent.click(searchButton);

      expect(onSubmit).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
