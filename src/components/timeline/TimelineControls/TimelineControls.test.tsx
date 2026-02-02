/**
 * TimelineControls Component Tests
 *
 * Unit tests for the TimelineControls component.
 * Tests rendering, button states, interactions, and accessibility.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimelineControls } from './TimelineControls';
import type { TimelineControlsProps } from './TimelineControls';

describe('TimelineControls', () => {
  // Default props for testing
  const defaultProps: TimelineControlsProps = {
    isExpanded: false,
    isDefaultView: true,
    onToggleExpand: vi.fn(),
    onReset: vi.fn(),
    onSearchOpen: vi.fn(),
    onAutoplayOpen: vi.fn(),
    isAutoplayActive: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the controls container', () => {
      render(<TimelineControls {...defaultProps} />);
      
      const container = screen.getByTestId('timeline-controls');
      expect(container).toBeInTheDocument();
    });

    it('renders all four control buttons', () => {
      render(<TimelineControls {...defaultProps} />);
      
      expect(screen.getByTestId('expand-button')).toBeInTheDocument();
      expect(screen.getByTestId('reset-button')).toBeInTheDocument();
      expect(screen.getByTestId('search-button')).toBeInTheDocument();
      expect(screen.getByTestId('autoplay-button')).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      render(<TimelineControls {...defaultProps} className="custom-class" />);
      
      const container = screen.getByTestId('timeline-controls');
      expect(container.className).toContain('custom-class');
    });

    it('has correct role and aria-label for accessibility', () => {
      render(<TimelineControls {...defaultProps} />);
      
      const container = screen.getByTestId('timeline-controls');
      expect(container).toHaveAttribute('role', 'group');
      expect(container).toHaveAttribute('aria-label', 'Timeline controls');
    });
  });

  describe('Expand Button (Requirement 6.2, 6.3)', () => {
    it('shows "Expand timeline" label when collapsed', () => {
      render(<TimelineControls {...defaultProps} isExpanded={false} />);
      
      const expandButton = screen.getByTestId('expand-button');
      expect(expandButton).toHaveAttribute('aria-label', 'Expand timeline');
    });

    it('shows "Collapse timeline" label when expanded', () => {
      render(<TimelineControls {...defaultProps} isExpanded={true} />);
      
      const expandButton = screen.getByTestId('expand-button');
      expect(expandButton).toHaveAttribute('aria-label', 'Collapse timeline');
    });

    it('calls onToggleExpand when clicked', () => {
      const onToggleExpand = vi.fn();
      render(<TimelineControls {...defaultProps} onToggleExpand={onToggleExpand} />);
      
      const expandButton = screen.getByTestId('expand-button');
      fireEvent.click(expandButton);
      
      expect(onToggleExpand).toHaveBeenCalledTimes(1);
    });

    it('renders up arrow icon when collapsed', () => {
      render(<TimelineControls {...defaultProps} isExpanded={false} />);
      
      const expandButton = screen.getByTestId('expand-button');
      const svg = expandButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
      
      // Check for up arrow polyline (points going up: 18 15 12 9 6 15)
      const polyline = svg?.querySelector('polyline');
      expect(polyline).toHaveAttribute('points', '18 15 12 9 6 15');
    });

    it('renders down arrow icon when expanded', () => {
      render(<TimelineControls {...defaultProps} isExpanded={true} />);
      
      const expandButton = screen.getByTestId('expand-button');
      const svg = expandButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
      
      // Check for down arrow polyline (points going down: 6 9 12 15 18 9)
      const polyline = svg?.querySelector('polyline');
      expect(polyline).toHaveAttribute('points', '6 9 12 15 18 9');
    });
  });

  describe('Reset Button (Requirement 6.4, 6.5)', () => {
    it('is disabled when at default view', () => {
      render(<TimelineControls {...defaultProps} isDefaultView={true} />);
      
      const resetButton = screen.getByTestId('reset-button');
      expect(resetButton).toBeDisabled();
    });

    it('is enabled when not at default view', () => {
      render(<TimelineControls {...defaultProps} isDefaultView={false} />);
      
      const resetButton = screen.getByTestId('reset-button');
      expect(resetButton).not.toBeDisabled();
    });

    it('calls onReset when clicked and enabled', () => {
      const onReset = vi.fn();
      render(<TimelineControls {...defaultProps} isDefaultView={false} onReset={onReset} />);
      
      const resetButton = screen.getByTestId('reset-button');
      fireEvent.click(resetButton);
      
      expect(onReset).toHaveBeenCalledTimes(1);
    });

    it('does not call onReset when clicked and disabled', () => {
      const onReset = vi.fn();
      render(<TimelineControls {...defaultProps} isDefaultView={true} onReset={onReset} />);
      
      const resetButton = screen.getByTestId('reset-button');
      fireEvent.click(resetButton);
      
      expect(onReset).not.toHaveBeenCalled();
    });

    it('has correct aria-label', () => {
      render(<TimelineControls {...defaultProps} />);
      
      const resetButton = screen.getByTestId('reset-button');
      expect(resetButton).toHaveAttribute('aria-label', 'Reset timeline view');
    });
  });

  describe('Search Button (Requirement 6.6)', () => {
    it('calls onSearchOpen when clicked', () => {
      const onSearchOpen = vi.fn();
      render(<TimelineControls {...defaultProps} onSearchOpen={onSearchOpen} />);
      
      const searchButton = screen.getByTestId('search-button');
      fireEvent.click(searchButton);
      
      expect(onSearchOpen).toHaveBeenCalledTimes(1);
    });

    it('has correct aria-label', () => {
      render(<TimelineControls {...defaultProps} />);
      
      const searchButton = screen.getByTestId('search-button');
      expect(searchButton).toHaveAttribute('aria-label', 'Search epics');
    });

    it('renders search icon', () => {
      render(<TimelineControls {...defaultProps} />);
      
      const searchButton = screen.getByTestId('search-button');
      const svg = searchButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
      
      // Check for search icon elements (circle and line)
      const circle = svg?.querySelector('circle');
      const line = svg?.querySelector('line');
      expect(circle).toBeInTheDocument();
      expect(line).toBeInTheDocument();
    });
  });

  describe('Autoplay Button (Requirement 6.7)', () => {
    it('shows "Start autoplay" label when inactive', () => {
      render(<TimelineControls {...defaultProps} isAutoplayActive={false} />);
      
      const autoplayButton = screen.getByTestId('autoplay-button');
      expect(autoplayButton).toHaveAttribute('aria-label', 'Start autoplay');
    });

    it('shows "Stop autoplay" label when active', () => {
      render(<TimelineControls {...defaultProps} isAutoplayActive={true} />);
      
      const autoplayButton = screen.getByTestId('autoplay-button');
      expect(autoplayButton).toHaveAttribute('aria-label', 'Stop autoplay');
    });

    it('calls onAutoplayOpen when clicked', () => {
      const onAutoplayOpen = vi.fn();
      render(<TimelineControls {...defaultProps} onAutoplayOpen={onAutoplayOpen} />);
      
      const autoplayButton = screen.getByTestId('autoplay-button');
      fireEvent.click(autoplayButton);
      
      expect(onAutoplayOpen).toHaveBeenCalledTimes(1);
    });

    it('renders play icon when inactive', () => {
      render(<TimelineControls {...defaultProps} isAutoplayActive={false} />);
      
      const autoplayButton = screen.getByTestId('autoplay-button');
      const svg = autoplayButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
      
      // Check for play icon (polygon)
      const polygon = svg?.querySelector('polygon');
      expect(polygon).toBeInTheDocument();
    });

    it('renders stop icon when active', () => {
      render(<TimelineControls {...defaultProps} isAutoplayActive={true} />);
      
      const autoplayButton = screen.getByTestId('autoplay-button');
      const svg = autoplayButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
      
      // Check for stop icon (rect)
      const rect = svg?.querySelector('rect');
      expect(rect).toBeInTheDocument();
    });
  });

  describe('Tooltips (Requirement 6.10)', () => {
    it('shows tooltip on hover for expand button', () => {
      render(<TimelineControls {...defaultProps} isExpanded={false} />);
      
      const expandButton = screen.getByTestId('expand-button');
      fireEvent.mouseEnter(expandButton);
      
      // Find tooltip by role
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveTextContent('Expand timeline');
      expect(tooltip.className).toContain('visible');
    });

    it('hides tooltip on mouse leave', () => {
      render(<TimelineControls {...defaultProps} />);
      
      const expandButton = screen.getByTestId('expand-button');
      fireEvent.mouseEnter(expandButton);
      fireEvent.mouseLeave(expandButton);
      
      // When hidden, tooltip has aria-hidden="true", so we need to query differently
      const buttonWrapper = expandButton.parentElement;
      const tooltip = buttonWrapper?.querySelector('[role="tooltip"]');
      expect(tooltip?.className).not.toContain('visible');
    });

    it('shows tooltip on focus for accessibility', () => {
      render(<TimelineControls {...defaultProps} />);
      
      const searchButton = screen.getByTestId('search-button');
      fireEvent.focus(searchButton);
      
      // Find the tooltip associated with search button
      const tooltips = screen.getAllByRole('tooltip');
      const searchTooltip = tooltips.find(t => t.textContent === 'Search epics');
      expect(searchTooltip?.className).toContain('visible');
    });

    it('hides tooltip on blur', () => {
      render(<TimelineControls {...defaultProps} />);
      
      const searchButton = screen.getByTestId('search-button');
      fireEvent.focus(searchButton);
      fireEvent.blur(searchButton);
      
      // When hidden, tooltip has aria-hidden="true", so we need to query differently
      const buttonWrapper = searchButton.parentElement;
      const tooltip = buttonWrapper?.querySelector('[role="tooltip"]');
      expect(tooltip?.className).not.toContain('visible');
    });
  });

  describe('Keyboard Navigation', () => {
    it('all buttons are focusable via keyboard', () => {
      render(<TimelineControls {...defaultProps} isDefaultView={false} />);
      
      const expandButton = screen.getByTestId('expand-button');
      const resetButton = screen.getByTestId('reset-button');
      const searchButton = screen.getByTestId('search-button');
      const autoplayButton = screen.getByTestId('autoplay-button');
      
      // Tab through buttons
      expandButton.focus();
      expect(document.activeElement).toBe(expandButton);
      
      resetButton.focus();
      expect(document.activeElement).toBe(resetButton);
      
      searchButton.focus();
      expect(document.activeElement).toBe(searchButton);
      
      autoplayButton.focus();
      expect(document.activeElement).toBe(autoplayButton);
    });

    it('buttons can be activated with Enter key', () => {
      const onToggleExpand = vi.fn();
      render(<TimelineControls {...defaultProps} onToggleExpand={onToggleExpand} />);
      
      const expandButton = screen.getByTestId('expand-button');
      expandButton.focus();
      
      fireEvent.keyDown(expandButton, { key: 'Enter', code: 'Enter' });
      fireEvent.keyUp(expandButton, { key: 'Enter', code: 'Enter' });
      fireEvent.click(expandButton);
      
      expect(onToggleExpand).toHaveBeenCalled();
    });
  });

  describe('Button Type Attribute', () => {
    it('all buttons have type="button" to prevent form submission', () => {
      render(<TimelineControls {...defaultProps} />);
      
      const expandButton = screen.getByTestId('expand-button');
      const resetButton = screen.getByTestId('reset-button');
      const searchButton = screen.getByTestId('search-button');
      const autoplayButton = screen.getByTestId('autoplay-button');
      
      expect(expandButton).toHaveAttribute('type', 'button');
      expect(resetButton).toHaveAttribute('type', 'button');
      expect(searchButton).toHaveAttribute('type', 'button');
      expect(autoplayButton).toHaveAttribute('type', 'button');
    });
  });
});
