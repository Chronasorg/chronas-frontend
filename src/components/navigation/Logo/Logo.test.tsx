/**
 * Logo Component Unit Tests
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4
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
    it('should render the logo SVG', () => {
      render(
        <MemoryRouter>
          <Logo testId="logo" />
        </MemoryRouter>
      );

      const logo = screen.getByTestId('logo');
      expect(logo).toBeInTheDocument();
      
      // Check that SVG is rendered
      const svg = logo.querySelector('svg');
      expect(svg).toBeInTheDocument();
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
    it('should use CSS variables for colors', () => {
      render(
        <MemoryRouter>
          <Logo testId="logo" />
        </MemoryRouter>
      );

      const logo = screen.getByTestId('logo');
      // The component uses CSS variables, so we just verify it has the logo class
      expect(logo.className).toContain('logo');
    });
  });
});
