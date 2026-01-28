/**
 * Unit Tests for SpinnerGlobal Component
 *
 * Tests rendering with default and custom title, and animation classes.
 * Validates: Requirements 5.1, 5.2
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SpinnerGlobal } from './SpinnerGlobal';

describe('SpinnerGlobal', () => {
  describe('Rendering', () => {
    it('should render with default title', () => {
      render(<SpinnerGlobal />);

      expect(screen.getByText('loading...')).toBeInTheDocument();
    });

    it('should render with custom title', () => {
      render(<SpinnerGlobal title="Please wait..." />);

      expect(screen.getByText('Please wait...')).toBeInTheDocument();
    });

    it('should render the SVG logo', () => {
      const { container } = render(<SpinnerGlobal />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('id', 'spinner-logo');
    });

    it('should have aria-hidden on SVG for accessibility', () => {
      const { container } = render(<SpinnerGlobal />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have role="status" on loading text for accessibility', () => {
      render(<SpinnerGlobal />);

      const loadingText = screen.getByRole('status');
      expect(loadingText).toBeInTheDocument();
      expect(loadingText).toHaveTextContent('loading...');
    });

    it('should have aria-live="polite" for screen readers', () => {
      render(<SpinnerGlobal />);

      const loadingText = screen.getByRole('status');
      expect(loadingText).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('CSS Classes', () => {
    it('should apply wrapper class', () => {
      const { container } = render(<SpinnerGlobal />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('wrapper');
    });

    it('should apply rotate class to SVG', () => {
      const { container } = render(<SpinnerGlobal />);

      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('class')).toContain('rotate');
    });

    it('should apply loading class to text', () => {
      const { container } = render(<SpinnerGlobal />);

      const loadingText = container.querySelector('[class*="loading"]');
      expect(loadingText).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<SpinnerGlobal className="custom-spinner" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('custom-spinner');
    });

    it('should apply logoCircle class to SVG group', () => {
      const { container } = render(<SpinnerGlobal />);

      const logoGroup = container.querySelector('g');
      expect(logoGroup?.getAttribute('class')).toContain('logoCircle');
    });
  });

  describe('Structure', () => {
    it('should have correct DOM structure', () => {
      const { container } = render(<SpinnerGlobal />);

      // Wrapper > Inner > SVG + Loading text
      const wrapper = container.firstChild as HTMLElement;
      const inner = wrapper.firstChild as HTMLElement;

      expect(inner.className).toContain('inner');
      expect(inner.children.length).toBe(2); // SVG and loading text
    });

    it('should render SVG with correct viewBox', () => {
      const { container } = render(<SpinnerGlobal />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 4220 4220');
    });

    it('should render SVG with preserveAspectRatio', () => {
      const { container } = render(<SpinnerGlobal />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('preserveAspectRatio', 'xMidYMid meet');
    });
  });

  describe('Different titles', () => {
    it('should render empty string title', () => {
      render(<SpinnerGlobal title="" />);

      const loadingText = screen.getByRole('status');
      expect(loadingText).toHaveTextContent('');
    });

    it('should render long title', () => {
      const longTitle = 'Loading your historical data, please wait...';
      render(<SpinnerGlobal title={longTitle} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should render title with special characters', () => {
      const specialTitle = 'Loading... (50%)';
      render(<SpinnerGlobal title={specialTitle} />);

      expect(screen.getByText(specialTitle)).toBeInTheDocument();
    });
  });
});
