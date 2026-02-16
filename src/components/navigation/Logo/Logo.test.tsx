/**
 * Logo Component Unit Tests
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Logo } from './Logo';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Logo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the logo as inline SVG', () => {
      render(
        <MemoryRouter>
          <Logo testId="logo" />
        </MemoryRouter>
      );

      const logo = screen.getByTestId('logo');
      expect(logo).toBeInTheDocument();
      
      // Check that inline SVG is rendered (not img tag)
      const svg = logo.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('viewBox', '0 0 14930 16000');
    });

    it('should render as a link', () => {
      render(
        <MemoryRouter>
          <Logo testId="logo" />
        </MemoryRouter>
      );

      const logo = screen.getByTestId('logo');
      expect(logo.tagName.toLowerCase()).toBe('a');
    });

    it('should apply custom className', () => {
      render(
        <MemoryRouter>
          <Logo className="custom-class" testId="logo" />
        </MemoryRouter>
      );

      const logo = screen.getByTestId('logo');
      expect(logo.className).toContain('custom-class');
    });

    it('should have production theme classes', () => {
      render(
        <MemoryRouter>
          <Logo testId="logo" />
        </MemoryRouter>
      );

      const logo = screen.getByTestId('logo');
      // Should have logo, logoMenuContainer, and lightTheme classes from production
      expect(logo.className).toContain('logo');
      expect(logo.className).toContain('logoMenuContainer');
      expect(logo.className).toContain('lightTheme');
    });

    it('should render SVG with g element for CSS styling', () => {
      render(
        <MemoryRouter>
          <Logo testId="logo" />
        </MemoryRouter>
      );

      const logo = screen.getByTestId('logo');
      const svg = logo.querySelector('svg');
      const gElement = svg?.querySelector('g');
      
      expect(gElement).toBeInTheDocument();
      expect(gElement).toHaveAttribute('id', 'layer101');
      // SVG uses currentColor so CSS can control the fill
      expect(gElement).toHaveAttribute('fill', 'currentColor');
    });
  });

  describe('Navigation', () => {
    it('should link to /info route', () => {
      render(
        <MemoryRouter>
          <Logo testId="logo" />
        </MemoryRouter>
      );

      const logo = screen.getByTestId('logo');
      expect(logo).toHaveAttribute('href', '/info');
    });

    it('should set localStorage info section on click', () => {
      render(
        <MemoryRouter>
          <Logo testId="logo" />
        </MemoryRouter>
      );

      const logo = screen.getByTestId('logo');
      fireEvent.click(logo);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('chs_info_section', 'welcome');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label for screen readers', () => {
      render(
        <MemoryRouter>
          <Logo testId="logo" />
        </MemoryRouter>
      );

      const logo = screen.getByTestId('logo');
      expect(logo).toHaveAttribute('aria-label', 'Chronas - Go to info page');
    });

    it('should have aria-hidden on SVG', () => {
      render(
        <MemoryRouter>
          <Logo testId="logo" />
        </MemoryRouter>
      );

      const logo = screen.getByTestId('logo');
      const svg = logo.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Theme Integration', () => {
    it('should use lightTheme class for light theme styling', () => {
      render(
        <MemoryRouter>
          <Logo testId="logo" />
        </MemoryRouter>
      );

      const logo = screen.getByTestId('logo');
      // The component uses lightTheme class which sets color: #1f1f1f
      // SVG uses currentColor to inherit this
      expect(logo.className).toContain('lightTheme');
    });
  });
});
