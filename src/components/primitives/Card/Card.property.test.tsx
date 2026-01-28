/**
 * Property-Based Tests for Card Component
 *
 * Feature: ui-primitives-migration, Property 6: Card elevation shadows
 * Validates: Requirements 4.2
 *
 * Tests that Card elevation shadows are correctly applied for all elevation levels.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { Card, type CardElevation } from './Card';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Elevation values for property testing
const elevations: CardElevation[] = ['none', 'low', 'medium', 'high'];

describe('Card Property Tests', () => {
  /**
   * Property 6: Card elevation shadows
   * For any Card with elevation ∈ {none, low, medium, high}, the Card SHALL
   * render with the CSS class corresponding to that elevation level.
   * Validates: Requirements 4.2
   */
  describe('Property 6: Card elevation shadows', () => {
    it('should apply correct elevation class for all elevation levels', () => {
      fc.assert(
        fc.property(fc.constantFrom(...elevations), (elevation) => {
          cleanup();
          const { container } = render(
            <Card elevation={elevation}>Content</Card>
          );
          const card = container.firstChild as HTMLElement;

          // Verify the elevation class is applied
          expect(card.className).toContain(`elevation-${elevation}`);
        }),
        { numRuns: 100 }
      );
    });

    it('should render card element for all elevations', () => {
      fc.assert(
        fc.property(fc.constantFrom(...elevations), (elevation) => {
          cleanup();
          const { container } = render(
            <Card elevation={elevation}>Test content</Card>
          );
          const card = container.firstChild as HTMLElement;

          // Card should be a div
          expect(card.tagName).toBe('DIV');
          // Card should have base card class
          expect(card.className).toContain('card');
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Click handlers trigger correctly (Card portion)
   * For any Card with onClick handler, clicking the card SHALL trigger
   * the handler exactly once.
   * Validates: Requirements 4.7
   */
  describe('Property 3: Click handlers trigger correctly', () => {
    it('should trigger onClick handler when clicked', () => {
      fc.assert(
        fc.property(fc.constantFrom(...elevations), (elevation) => {
          cleanup();
          const handleClick = vi.fn();
          const { container } = render(
            <Card elevation={elevation} onClick={handleClick}>
              Clickable content
            </Card>
          );
          const card = container.firstChild as HTMLElement;

          fireEvent.click(card);

          expect(handleClick).toHaveBeenCalledTimes(1);
        }),
        { numRuns: 100 }
      );
    });

    it('should apply clickable class when onClick is provided', () => {
      fc.assert(
        fc.property(fc.constantFrom(...elevations), (elevation) => {
          cleanup();
          const handleClick = vi.fn();
          const { container } = render(
            <Card elevation={elevation} onClick={handleClick}>
              Clickable content
            </Card>
          );
          const card = container.firstChild as HTMLElement;

          expect(card.className).toContain('clickable');
        }),
        { numRuns: 100 }
      );
    });

    it('should not apply clickable class when onClick is not provided', () => {
      fc.assert(
        fc.property(fc.constantFrom(...elevations), (elevation) => {
          cleanup();
          const { container } = render(
            <Card elevation={elevation}>Non-clickable content</Card>
          );
          const card = container.firstChild as HTMLElement;

          expect(card.className).not.toContain('clickable');
        }),
        { numRuns: 100 }
      );
    });

    it('should have button role when clickable', () => {
      fc.assert(
        fc.property(fc.constantFrom(...elevations), (elevation) => {
          cleanup();
          const handleClick = vi.fn();
          const { container } = render(
            <Card elevation={elevation} onClick={handleClick}>
              Clickable content
            </Card>
          );
          const card = container.firstChild as HTMLElement;

          expect(card.getAttribute('role')).toBe('button');
          expect(card.getAttribute('tabindex')).toBe('0');
        }),
        { numRuns: 100 }
      );
    });

    it('should trigger onClick on Enter key press', () => {
      fc.assert(
        fc.property(fc.constantFrom(...elevations), (elevation) => {
          cleanup();
          const handleClick = vi.fn();
          const { container } = render(
            <Card elevation={elevation} onClick={handleClick}>
              Clickable content
            </Card>
          );
          const card = container.firstChild as HTMLElement;

          fireEvent.keyDown(card, { key: 'Enter' });

          expect(handleClick).toHaveBeenCalledTimes(1);
        }),
        { numRuns: 100 }
      );
    });

    it('should trigger onClick on Space key press', () => {
      fc.assert(
        fc.property(fc.constantFrom(...elevations), (elevation) => {
          cleanup();
          const handleClick = vi.fn();
          const { container } = render(
            <Card elevation={elevation} onClick={handleClick}>
              Clickable content
            </Card>
          );
          const card = container.firstChild as HTMLElement;

          fireEvent.keyDown(card, { key: ' ' });

          expect(handleClick).toHaveBeenCalledTimes(1);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Card header and sections tests
   * Validates: Requirements 4.3, 4.4
   */
  describe('Card header and sections', () => {
    it('should render title when provided', () => {
      // Use alphanumeric strings to avoid whitespace-only issues
      const alphanumeric = fc.stringMatching(/^[a-zA-Z0-9]+$/);
      
      fc.assert(
        fc.property(
          fc.constantFrom(...elevations),
          alphanumeric.filter((s) => s.length >= 1 && s.length <= 50),
          (elevation, title) => {
            cleanup();
            const { container } = render(
              <Card elevation={elevation} title={title}>
                Content
              </Card>
            );
            const titleElement = container.querySelector('[class*="title"]');

            expect(titleElement).not.toBeNull();
            expect(titleElement?.textContent).toBe(title);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should render subtitle when provided', () => {
      const alphanumeric = fc.stringMatching(/^[a-zA-Z0-9]+$/);
      
      fc.assert(
        fc.property(
          fc.constantFrom(...elevations),
          alphanumeric.filter((s) => s.length >= 1 && s.length <= 50),
          (elevation, subtitle) => {
            cleanup();
            const { container } = render(
              <Card elevation={elevation} subtitle={subtitle}>
                Content
              </Card>
            );
            const subtitleElement = container.querySelector('[class*="subtitle"]');

            expect(subtitleElement).not.toBeNull();
            expect(subtitleElement?.textContent).toBe(subtitle);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should render actions when provided', () => {
      fc.assert(
        fc.property(fc.constantFrom(...elevations), (elevation) => {
          cleanup();
          const { container } = render(
            <Card
              elevation={elevation}
              actions={<button data-testid="action-btn">Action</button>}
            >
              Content
            </Card>
          );
          const actionsSection = container.querySelector('[class*="actions"]');

          expect(actionsSection).not.toBeNull();
          expect(actionsSection?.querySelector('button')).not.toBeNull();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Card content rendering tests
   */
  describe('Card content rendering', () => {
    it('should render children content', () => {
      const alphanumeric = fc.stringMatching(/^[a-zA-Z0-9]+$/);
      
      fc.assert(
        fc.property(
          fc.constantFrom(...elevations),
          alphanumeric.filter((s) => s.length >= 1 && s.length <= 100),
          (elevation, content) => {
            cleanup();
            const { container } = render(
              <Card elevation={elevation}>{content}</Card>
            );
            const contentSection = container.querySelector('[class*="content"]');

            expect(contentSection).not.toBeNull();
            expect(contentSection?.textContent).toBe(content);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should apply custom className', () => {
      const alphanumeric = fc.stringMatching(/^[a-z]+$/);
      
      fc.assert(
        fc.property(
          fc.constantFrom(...elevations),
          alphanumeric.filter((s) => s.length >= 1 && s.length <= 20),
          (elevation, customClass) => {
            cleanup();
            const { container } = render(
              <Card elevation={elevation} className={customClass}>
                Content
              </Card>
            );
            const card = container.firstChild as HTMLElement;

            expect(card.className).toContain(customClass);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Default elevation test
   */
  describe('Default values', () => {
    it('should default to low elevation when not specified', () => {
      const { container } = render(<Card>Default elevation</Card>);
      const card = container.firstChild as HTMLElement;

      expect(card.className).toContain('elevation-low');
    });
  });
});
