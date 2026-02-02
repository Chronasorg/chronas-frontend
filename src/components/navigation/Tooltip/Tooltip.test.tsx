/**
 * Tooltip Component Unit Tests
 *
 * Requirements: 3.5, 3.6
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render children', () => {
      render(
        <Tooltip content="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );

      expect(screen.getByRole('button', { name: 'Hover me' })).toBeInTheDocument();
    });

    it('should not show tooltip initially', () => {
      render(
        <Tooltip content="Test tooltip" testId="tooltip">
          <button>Hover me</button>
        </Tooltip>
      );

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('Hover Behavior', () => {
    it('should show tooltip after hover delay', () => {
      render(
        <Tooltip content="Test tooltip" delay={200} testId="tooltip">
          <button>Hover me</button>
        </Tooltip>
      );

      const wrapper = screen.getByTestId('tooltip');
      
      fireEvent.mouseEnter(wrapper);
      
      // Tooltip should not be visible immediately
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      
      // Advance timers past the delay
      act(() => {
        vi.advanceTimersByTime(200);
      });
      
      // Tooltip should now be visible
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
      expect(screen.getByRole('tooltip')).toHaveTextContent('Test tooltip');
    });

    it('should hide tooltip on mouse leave', () => {
      render(
        <Tooltip content="Test tooltip" delay={200} testId="tooltip">
          <button>Hover me</button>
        </Tooltip>
      );

      const wrapper = screen.getByTestId('tooltip');
      
      fireEvent.mouseEnter(wrapper);
      act(() => {
        vi.advanceTimersByTime(200);
      });
      
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
      
      fireEvent.mouseLeave(wrapper);
      
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('should cancel tooltip if mouse leaves before delay', () => {
      render(
        <Tooltip content="Test tooltip" delay={200} testId="tooltip">
          <button>Hover me</button>
        </Tooltip>
      );

      const wrapper = screen.getByTestId('tooltip');
      
      fireEvent.mouseEnter(wrapper);
      
      // Leave before delay completes
      act(() => {
        vi.advanceTimersByTime(100);
      });
      fireEvent.mouseLeave(wrapper);
      
      // Complete the original delay time
      act(() => {
        vi.advanceTimersByTime(200);
      });
      
      // Tooltip should not appear
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('Content Display', () => {
    it('should display the correct content', () => {
      render(
        <Tooltip content="Custom tooltip text" delay={0} testId="tooltip">
          <button>Hover me</button>
        </Tooltip>
      );

      const wrapper = screen.getByTestId('tooltip');
      
      fireEvent.mouseEnter(wrapper);
      act(() => {
        vi.advanceTimersByTime(0);
      });
      
      expect(screen.getByRole('tooltip')).toHaveTextContent('Custom tooltip text');
    });
  });

  describe('Positioning', () => {
    it('should apply right position class by default', () => {
      render(
        <Tooltip content="Test tooltip" delay={0} testId="tooltip">
          <button>Hover me</button>
        </Tooltip>
      );

      const wrapper = screen.getByTestId('tooltip');
      
      fireEvent.mouseEnter(wrapper);
      act(() => {
        vi.advanceTimersByTime(0);
      });
      
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip.className).toContain('right');
    });

    it('should apply bottom-right position class when specified', () => {
      render(
        <Tooltip content="Test tooltip" position="bottom-right" delay={0} testId="tooltip">
          <button>Hover me</button>
        </Tooltip>
      );

      const wrapper = screen.getByTestId('tooltip');
      
      fireEvent.mouseEnter(wrapper);
      act(() => {
        vi.advanceTimersByTime(0);
      });
      
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip.className).toContain('bottom-right');
    });
  });

  describe('Disabled State', () => {
    it('should not show tooltip when disabled', () => {
      render(
        <Tooltip content="Test tooltip" disabled delay={0} testId="tooltip">
          <button>Hover me</button>
        </Tooltip>
      );

      const wrapper = screen.getByTestId('tooltip');
      
      fireEvent.mouseEnter(wrapper);
      act(() => {
        vi.advanceTimersByTime(0);
      });
      
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('Focus Behavior', () => {
    it('should show tooltip on focus', () => {
      render(
        <Tooltip content="Test tooltip" delay={0} testId="tooltip">
          <button>Hover me</button>
        </Tooltip>
      );

      const wrapper = screen.getByTestId('tooltip');
      
      fireEvent.focus(wrapper);
      act(() => {
        vi.advanceTimersByTime(0);
      });
      
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('should hide tooltip on blur', () => {
      render(
        <Tooltip content="Test tooltip" delay={0} testId="tooltip">
          <button>Hover me</button>
        </Tooltip>
      );

      const wrapper = screen.getByTestId('tooltip');
      
      fireEvent.focus(wrapper);
      act(() => {
        vi.advanceTimersByTime(0);
      });
      
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
      
      fireEvent.blur(wrapper);
      
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have role="tooltip" on the tooltip element', () => {
      render(
        <Tooltip content="Test tooltip" delay={0} testId="tooltip">
          <button>Hover me</button>
        </Tooltip>
      );

      const wrapper = screen.getByTestId('tooltip');
      
      fireEvent.mouseEnter(wrapper);
      act(() => {
        vi.advanceTimersByTime(0);
      });
      
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });
  });
});
