/**
 * Property-Based Tests for Button Component
 * Feature: ui-primitives-migration, Property 4: Button variants and sizes
 * Validates: Requirements 2.1, 2.2
 *
 * Tests that for any Button with:
 * - variant ∈ {primary, secondary, text}
 * - size ∈ {small, medium, large}
 *
 * The Button SHALL render with the CSS class corresponding to that variant and size combination.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

// Define the valid variants and sizes as per Requirements 2.1 and 2.2
const variants = ['primary', 'secondary', 'text'] as const;
const sizes = ['small', 'medium', 'large'] as const;

type ButtonVariant = (typeof variants)[number];
type ButtonSize = (typeof sizes)[number];

describe('Button Property Tests', () => {
  /**
   * Feature: ui-primitives-migration, Property 4: Button variants and sizes
   * Validates: Requirements 2.1, 2.2
   *
   * For any Button with variant ∈ {primary, secondary, text} and size ∈ {small, medium, large},
   * the Button SHALL render with the CSS class corresponding to that variant and size combination.
   */
  describe('Property 4: Button variants and sizes', () => {
    it('should apply correct variant CSS class for any valid variant', () => {
      fc.assert(
        fc.property(fc.constantFrom(...variants), (variant: ButtonVariant) => {
          const { unmount } = render(<Button variant={variant}>Test Button</Button>);
          const button = screen.getByRole('button');

          // The button should have the variant class applied
          expect(button.className).toMatch(new RegExp(`variant-${variant}`));

          unmount();
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should apply correct size CSS class for any valid size', () => {
      fc.assert(
        fc.property(fc.constantFrom(...sizes), (size: ButtonSize) => {
          const { unmount } = render(<Button size={size}>Test Button</Button>);
          const button = screen.getByRole('button');

          // The button should have the size class applied
          expect(button.className).toMatch(new RegExp(`size-${size}`));

          unmount();
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should apply correct CSS classes for any variant and size combination', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...variants),
          fc.constantFrom(...sizes),
          (variant: ButtonVariant, size: ButtonSize) => {
            const { unmount } = render(
              <Button variant={variant} size={size}>
                Test Button
              </Button>
            );
            const button = screen.getByRole('button');

            // The button should have both variant and size classes applied
            expect(button.className).toMatch(new RegExp(`variant-${variant}`));
            expect(button.className).toMatch(new RegExp(`size-${size}`));

            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have exactly one variant class applied for any variant', () => {
      fc.assert(
        fc.property(fc.constantFrom(...variants), (variant: ButtonVariant) => {
          const { unmount } = render(<Button variant={variant}>Test Button</Button>);
          const button = screen.getByRole('button');

          // Count how many variant classes are applied
          const variantClassCount = variants.filter((v) =>
            button.className.includes(`variant-${v}`)
          ).length;

          // Should have exactly one variant class
          expect(variantClassCount).toBe(1);

          // And it should be the correct one
          expect(button.className).toMatch(new RegExp(`variant-${variant}`));

          unmount();
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should have exactly one size class applied for any size', () => {
      fc.assert(
        fc.property(fc.constantFrom(...sizes), (size: ButtonSize) => {
          const { unmount } = render(<Button size={size}>Test Button</Button>);
          const button = screen.getByRole('button');

          // Count how many size classes are applied
          const sizeClassCount = sizes.filter((s) => button.className.includes(`size-${s}`)).length;

          // Should have exactly one size class
          expect(sizeClassCount).toBe(1);

          // And it should be the correct one
          expect(button.className).toMatch(new RegExp(`size-${size}`));

          unmount();
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should always have base button class regardless of variant and size', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...variants),
          fc.constantFrom(...sizes),
          (variant: ButtonVariant, size: ButtonSize) => {
            const { unmount } = render(
              <Button variant={variant} size={size}>
                Test Button
              </Button>
            );
            const button = screen.getByRole('button');

            // The button should always have the base button class
            // CSS modules will hash the class name, but it should contain 'button'
            expect(button.className).toMatch(/button/);

            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render as a button element for any variant and size combination', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...variants),
          fc.constantFrom(...sizes),
          (variant: ButtonVariant, size: ButtonSize) => {
            const { unmount } = render(
              <Button variant={variant} size={size}>
                Test Button
              </Button>
            );
            const button = screen.getByRole('button');

            // Should be a button element
            expect(button.tagName.toLowerCase()).toBe('button');

            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve variant and size classes when combined with other props', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...variants),
          fc.constantFrom(...sizes),
          fc.boolean(),
          fc.boolean(),
          (variant: ButtonVariant, size: ButtonSize, fullWidth: boolean, disabled: boolean) => {
            const { unmount } = render(
              <Button variant={variant} size={size} fullWidth={fullWidth} disabled={disabled}>
                Test Button
              </Button>
            );
            const button = screen.getByRole('button');

            // Variant and size classes should still be present
            expect(button.className).toMatch(new RegExp(`variant-${variant}`));
            expect(button.className).toMatch(new RegExp(`size-${size}`));

            // Additional classes should be applied based on props
            if (fullWidth) {
              expect(button.className).toMatch(/fullWidth/);
            }
            if (disabled) {
              expect(button.className).toMatch(/disabled/);
            }

            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
