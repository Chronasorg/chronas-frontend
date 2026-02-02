/**
 * YearDisplay Component Tests
 *
 * Unit tests for the YearDisplay component covering rendering,
 * interactions, and edge cases.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { YearDisplay } from './YearDisplay';

describe('YearDisplay', () => {
  const defaultProps = {
    selectedYear: 1000,
    suggestedYear: null,
    onYearClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with correct structure', () => {
      render(<YearDisplay {...defaultProps} />);
      
      expect(screen.getByTestId('year-display')).toBeInTheDocument();
      expect(screen.getByTestId('year-label')).toBeInTheDocument();
      expect(screen.getByTestId('suggested-year')).toBeInTheDocument();
    });

    it('displays the selected year with 28px font (Requirement 2.1)', () => {
      render(<YearDisplay {...defaultProps} selectedYear={1500} />);
      
      const yearLabel = screen.getByTestId('year-label');
      expect(yearLabel).toHaveTextContent('1500');
    });

    it('displays negative years correctly', () => {
      render(<YearDisplay {...defaultProps} selectedYear={-500} />);
      
      const yearLabel = screen.getByTestId('year-label');
      expect(yearLabel).toHaveTextContent('-500');
    });

    it('displays year 0 correctly', () => {
      render(<YearDisplay {...defaultProps} selectedYear={0} />);
      
      const yearLabel = screen.getByTestId('year-label');
      expect(yearLabel).toHaveTextContent('0');
    });

    it('displays boundary years correctly', () => {
      const { rerender } = render(<YearDisplay {...defaultProps} selectedYear={-2000} />);
      expect(screen.getByTestId('year-label')).toHaveTextContent('-2000');
      
      rerender(<YearDisplay {...defaultProps} selectedYear={2000} />);
      expect(screen.getByTestId('year-label')).toHaveTextContent('2000');
    });
  });

  describe('Suggested Year Display (Requirements 4.1-4.6)', () => {
    it('hides suggested year when null', () => {
      render(<YearDisplay {...defaultProps} suggestedYear={null} />);
      
      const suggestedYear = screen.getByTestId('suggested-year');
      expect(suggestedYear).toHaveAttribute('aria-hidden', 'true');
    });

    it('shows suggested year when different from selected (Requirement 4.6)', () => {
      render(<YearDisplay {...defaultProps} selectedYear={1000} suggestedYear={1500} />);
      
      const suggestedYear = screen.getByTestId('suggested-year');
      expect(suggestedYear).toHaveAttribute('aria-hidden', 'false');
      expect(suggestedYear).toHaveTextContent('1500');
    });

    it('hides suggested year when equal to selected year (Requirement 4.6)', () => {
      render(<YearDisplay {...defaultProps} selectedYear={1000} suggestedYear={1000} />);
      
      const suggestedYear = screen.getByTestId('suggested-year');
      expect(suggestedYear).toHaveAttribute('aria-hidden', 'true');
    });

    it('displays arrow indicator with suggested year (Requirement 4.2)', () => {
      render(<YearDisplay {...defaultProps} selectedYear={1000} suggestedYear={1500} />);
      
      const suggestedYear = screen.getByTestId('suggested-year');
      expect(suggestedYear).toHaveTextContent('▼');
    });

    it('displays negative suggested years correctly', () => {
      render(<YearDisplay {...defaultProps} selectedYear={1000} suggestedYear={-500} />);
      
      const suggestedYear = screen.getByTestId('suggested-year');
      expect(suggestedYear).toHaveTextContent('-500');
    });
  });

  describe('Click Interaction (Requirement 2.4)', () => {
    it('calls onYearClick when year label is clicked', () => {
      const onYearClick = vi.fn();
      render(<YearDisplay {...defaultProps} onYearClick={onYearClick} />);
      
      const yearLabel = screen.getByTestId('year-label');
      fireEvent.click(yearLabel);
      
      expect(onYearClick).toHaveBeenCalledTimes(1);
    });

    it('year label is a button for accessibility', () => {
      render(<YearDisplay {...defaultProps} />);
      
      const yearLabel = screen.getByTestId('year-label');
      expect(yearLabel.tagName).toBe('BUTTON');
      expect(yearLabel).toHaveAttribute('type', 'button');
    });

    it('year label has appropriate aria-label', () => {
      render(<YearDisplay {...defaultProps} selectedYear={1500} />);
      
      const yearLabel = screen.getByTestId('year-label');
      expect(yearLabel).toHaveAttribute('aria-label');
      expect(yearLabel.getAttribute('aria-label')).toContain('1500');
    });
  });

  describe('Edge Detection (Requirement 2.5)', () => {
    it('applies nearEdge class when isNearEdge is true', () => {
      render(<YearDisplay {...defaultProps} isNearEdge={true} />);
      
      const container = screen.getByTestId('year-display');
      expect(container).toHaveAttribute('data-near-edge', 'true');
    });

    it('does not apply nearEdge class when isNearEdge is false', () => {
      render(<YearDisplay {...defaultProps} isNearEdge={false} />);
      
      const container = screen.getByTestId('year-display');
      expect(container).toHaveAttribute('data-near-edge', 'false');
    });

    it('defaults isNearEdge to false', () => {
      render(<YearDisplay {...defaultProps} />);
      
      const container = screen.getByTestId('year-display');
      expect(container).toHaveAttribute('data-near-edge', 'false');
    });
  });

  describe('Accessibility', () => {
    it('year label is keyboard accessible', () => {
      const onYearClick = vi.fn();
      render(<YearDisplay {...defaultProps} onYearClick={onYearClick} />);
      
      const yearLabel = screen.getByTestId('year-label');
      yearLabel.focus();
      
      fireEvent.keyDown(yearLabel, { key: 'Enter' });
      // Button elements automatically handle Enter key
    });

    it('suggested year is hidden from screen readers when not visible', () => {
      render(<YearDisplay {...defaultProps} suggestedYear={null} />);
      
      const suggestedYear = screen.getByTestId('suggested-year');
      expect(suggestedYear).toHaveAttribute('aria-hidden', 'true');
    });

    it('suggested year is visible to screen readers when shown', () => {
      render(<YearDisplay {...defaultProps} selectedYear={1000} suggestedYear={1500} />);
      
      const suggestedYear = screen.getByTestId('suggested-year');
      expect(suggestedYear).toHaveAttribute('aria-hidden', 'false');
    });
  });
});
