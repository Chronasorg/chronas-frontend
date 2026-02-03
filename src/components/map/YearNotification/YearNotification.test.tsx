/**
 * YearNotification Component Unit Tests
 *
 * Tests for the year notification badge component.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { YearNotification, formatYearWithEra } from './YearNotification';

describe('YearNotification', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatYearWithEra', () => {
    it('should format positive year with AD', () => {
      const result = formatYearWithEra(2000);
      expect(result.value).toBe('2,000');
      expect(result.era).toBe('AD');
    });

    it('should format negative year with BC', () => {
      const result = formatYearWithEra(-500);
      expect(result.value).toBe('500');
      expect(result.era).toBe('BC');
    });

    it('should format year 0 as AD', () => {
      const result = formatYearWithEra(0);
      expect(result.value).toBe('0');
      expect(result.era).toBe('AD');
    });

    it('should handle large positive years', () => {
      const result = formatYearWithEra(10000);
      expect(result.value).toBe('10,000');
      expect(result.era).toBe('AD');
    });

    it('should handle large negative years', () => {
      const result = formatYearWithEra(-10000);
      expect(result.value).toBe('10,000');
      expect(result.era).toBe('BC');
    });

    it('should round decimal years', () => {
      const result = formatYearWithEra(1999.7);
      expect(result.value).toBe('2,000');
      expect(result.era).toBe('AD');
    });

    it('should handle NaN', () => {
      const result = formatYearWithEra(NaN);
      expect(result.value).toBe('0');
      expect(result.era).toBe('');
    });

    it('should handle Infinity', () => {
      const result = formatYearWithEra(Infinity);
      expect(result.value).toBe('0');
      expect(result.era).toBe('');
    });
  });

  describe('rendering', () => {
    it('should render with year value and era', () => {
      const onHide = vi.fn();
      render(<YearNotification year={2000} isVisible={true} onHide={onHide} />);

      expect(screen.getByTestId('year-notification')).toBeInTheDocument();
      expect(screen.getByTestId('year-value')).toHaveTextContent('2,000');
      expect(screen.getByTestId('year-era')).toHaveTextContent('(AD)');
    });

    it('should render BC for negative years', () => {
      const onHide = vi.fn();
      render(<YearNotification year={-500} isVisible={true} onHide={onHide} />);

      expect(screen.getByTestId('year-value')).toHaveTextContent('500');
      expect(screen.getByTestId('year-era')).toHaveTextContent('(BC)');
    });

    it('should have visible class when isVisible is true', () => {
      const onHide = vi.fn();
      render(<YearNotification year={2000} isVisible={true} onHide={onHide} />);

      const notification = screen.getByTestId('year-notification');
      expect(notification.className).toContain('visible');
    });

    it('should not have visible class when isVisible is false', () => {
      const onHide = vi.fn();
      render(<YearNotification year={2000} isVisible={false} onHide={onHide} />);

      const notification = screen.getByTestId('year-notification');
      expect(notification.className).not.toContain('visible');
    });

    it('should apply custom className', () => {
      const onHide = vi.fn();
      render(
        <YearNotification year={2000} isVisible={true} onHide={onHide} className="custom-class" />
      );

      const notification = screen.getByTestId('year-notification');
      expect(notification.className).toContain('custom-class');
    });

    it('should have correct accessibility attributes', () => {
      const onHide = vi.fn();
      render(<YearNotification year={2000} isVisible={true} onHide={onHide} />);

      const notification = screen.getByTestId('year-notification');
      expect(notification).toHaveAttribute('role', 'status');
      expect(notification).toHaveAttribute('aria-live', 'polite');
    });

    it('should set aria-hidden based on visibility', () => {
      const onHide = vi.fn();
      const { rerender } = render(
        <YearNotification year={2000} isVisible={true} onHide={onHide} />
      );

      expect(screen.getByTestId('year-notification')).toHaveAttribute('aria-hidden', 'false');

      rerender(<YearNotification year={2000} isVisible={false} onHide={onHide} />);

      expect(screen.getByTestId('year-notification')).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('auto-hide behavior', () => {
    it('should call onHide after 6 seconds when visible', () => {
      const onHide = vi.fn();
      render(<YearNotification year={2000} isVisible={true} onHide={onHide} />);

      expect(onHide).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(6000);
      });

      expect(onHide).toHaveBeenCalledTimes(1);
    });

    it('should not call onHide when not visible', () => {
      const onHide = vi.fn();
      render(<YearNotification year={2000} isVisible={false} onHide={onHide} />);

      act(() => {
        vi.advanceTimersByTime(6000);
      });

      expect(onHide).not.toHaveBeenCalled();
    });

    it('should reset timer when year changes', () => {
      const onHide = vi.fn();
      const { rerender } = render(
        <YearNotification year={2000} isVisible={true} onHide={onHide} />
      );

      // Advance 3 seconds
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(onHide).not.toHaveBeenCalled();

      // Change year - should reset timer
      rerender(<YearNotification year={2001} isVisible={true} onHide={onHide} />);

      // Advance another 3 seconds (total 6 from start, but only 3 from year change)
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(onHide).not.toHaveBeenCalled();

      // Advance remaining 3 seconds
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(onHide).toHaveBeenCalledTimes(1);
    });

    it('should clear timer when becoming invisible', () => {
      const onHide = vi.fn();
      const { rerender } = render(
        <YearNotification year={2000} isVisible={true} onHide={onHide} />
      );

      // Advance 3 seconds
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Hide notification
      rerender(<YearNotification year={2000} isVisible={false} onHide={onHide} />);

      // Advance remaining time
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(onHide).not.toHaveBeenCalled();
    });

    it('should clear timer on unmount', () => {
      const onHide = vi.fn();
      const { unmount } = render(
        <YearNotification year={2000} isVisible={true} onHide={onHide} />
      );

      // Advance 3 seconds
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Unmount
      unmount();

      // Advance remaining time
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(onHide).not.toHaveBeenCalled();
    });
  });
});
