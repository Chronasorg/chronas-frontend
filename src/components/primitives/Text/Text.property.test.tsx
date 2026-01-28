/**
 * Property-Based Tests for Text Component
 * Feature: ui-primitives-migration, Property 5: Text variant element mapping
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 *
 * Tests that for any Text component with:
 * - variant ∈ {h1, h2, h3, h4, h5, h6, body1, body2, caption, overline}
 * - color ∈ {primary, secondary, error, inherit}
 * - align ∈ {left, center, right, justify}
 *
 * The component SHALL:
 * 1. Render the correct HTML element (h1-h6 for headings, p for body variants, span for caption/overline)
 * 2. Apply the correct color and text-align CSS classes
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { Text } from './Text';

// Define the valid variants, colors, and alignments as per Requirements 3.1, 3.3, 3.4
const variants = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'body1',
  'body2',
  'caption',
  'overline',
] as const;
const colors = ['primary', 'secondary', 'error', 'inherit'] as const;
const alignments = ['left', 'center', 'right', 'justify'] as const;

type TextVariant = (typeof variants)[number];
type TextColor = (typeof colors)[number];
type TextAlign = (typeof alignments)[number];

/**
 * Maps text variants to their expected HTML elements.
 * - h1-h6 → <h1> - <h6>
 * - body1, body2 → <p>
 * - caption, overline → <span>
 */
const variantElementMap: Record<TextVariant, string> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  body1: 'p',
  body2: 'p',
  caption: 'span',
  overline: 'span',
};

describe('Text Property Tests', () => {
  /**
   * Feature: ui-primitives-migration, Property 5: Text variant element mapping
   * Validates: Requirements 3.1, 3.2
   *
   * For any Text component with variant ∈ {h1, h2, h3, h4, h5, h6, body1, body2, caption, overline},
   * the component SHALL render the correct HTML element.
   */
  describe('Property 5: Text variant element mapping', () => {
    it('should render the correct HTML element for any valid variant', () => {
      fc.assert(
        fc.property(fc.constantFrom(...variants), (variant: TextVariant) => {
          const testId = `text-${variant}`;
          const { unmount } = render(
            <Text variant={variant} data-testid={testId}>
              Test Text
            </Text>
          );

          const expectedElement = variantElementMap[variant];
          const element = screen.getByText('Test Text');

          // The element should be the correct HTML tag
          expect(element.tagName.toLowerCase()).toBe(expectedElement);

          unmount();
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should render heading elements (h1-h6) for heading variants', () => {
      const headingVariants = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

      fc.assert(
        fc.property(fc.constantFrom(...headingVariants), (variant: (typeof headingVariants)[number]) => {
          const { unmount } = render(<Text variant={variant}>Heading Text</Text>);

          const element = screen.getByText('Heading Text');

          // Should be the exact heading element
          expect(element.tagName.toLowerCase()).toBe(variant);

          // Should have role heading
          expect(element.tagName.toLowerCase()).toMatch(/^h[1-6]$/);

          unmount();
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should render paragraph elements for body variants', () => {
      const bodyVariants = ['body1', 'body2'] as const;

      fc.assert(
        fc.property(fc.constantFrom(...bodyVariants), (variant: (typeof bodyVariants)[number]) => {
          const { unmount } = render(<Text variant={variant}>Body Text</Text>);

          const element = screen.getByText('Body Text');

          // Should be a paragraph element
          expect(element.tagName.toLowerCase()).toBe('p');

          unmount();
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should render span elements for caption and overline variants', () => {
      const inlineVariants = ['caption', 'overline'] as const;

      fc.assert(
        fc.property(fc.constantFrom(...inlineVariants), (variant: (typeof inlineVariants)[number]) => {
          const { unmount } = render(<Text variant={variant}>Inline Text</Text>);

          const element = screen.getByText('Inline Text');

          // Should be a span element
          expect(element.tagName.toLowerCase()).toBe('span');

          unmount();
          return true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Validates: Requirement 3.3
     *
     * For any Text component with color ∈ {primary, secondary, error, inherit},
     * the component SHALL apply the correct color CSS class.
     */
    it('should apply correct color CSS class for any valid color', () => {
      fc.assert(
        fc.property(fc.constantFrom(...colors), (color: TextColor) => {
          const { unmount } = render(<Text color={color}>Colored Text</Text>);

          const element = screen.getByText('Colored Text');

          // The element should have the color class applied
          expect(element.className).toMatch(new RegExp(`color-${color}`));

          unmount();
          return true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Validates: Requirement 3.4
     *
     * For any Text component with align ∈ {left, center, right, justify},
     * the component SHALL apply the correct text-align CSS class.
     */
    it('should apply correct alignment CSS class for any valid alignment', () => {
      fc.assert(
        fc.property(fc.constantFrom(...alignments), (align: TextAlign) => {
          const { unmount } = render(<Text align={align}>Aligned Text</Text>);

          const element = screen.getByText('Aligned Text');

          // The element should have the alignment class applied
          expect(element.className).toMatch(new RegExp(`align-${align}`));

          unmount();
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should apply correct CSS classes for any variant, color, and alignment combination', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...variants),
          fc.constantFrom(...colors),
          fc.constantFrom(...alignments),
          (variant: TextVariant, color: TextColor, align: TextAlign) => {
            const { unmount } = render(
              <Text variant={variant} color={color} align={align}>
                Combined Text
              </Text>
            );

            const element = screen.getByText('Combined Text');

            // Should have the correct HTML element
            expect(element.tagName.toLowerCase()).toBe(variantElementMap[variant]);

            // Should have variant, color, and alignment classes applied
            expect(element.className).toMatch(new RegExp(`variant-${variant}`));
            expect(element.className).toMatch(new RegExp(`color-${color}`));
            expect(element.className).toMatch(new RegExp(`align-${align}`));

            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have exactly one variant class applied for any variant', () => {
      fc.assert(
        fc.property(fc.constantFrom(...variants), (variant: TextVariant) => {
          const { unmount } = render(<Text variant={variant}>Test Text</Text>);

          const element = screen.getByText('Test Text');

          // Count how many variant classes are applied
          const variantClassCount = variants.filter((v) =>
            element.className.includes(`variant-${v}`)
          ).length;

          // Should have exactly one variant class
          expect(variantClassCount).toBe(1);

          // And it should be the correct one
          expect(element.className).toMatch(new RegExp(`variant-${variant}`));

          unmount();
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should have exactly one color class applied for any color', () => {
      fc.assert(
        fc.property(fc.constantFrom(...colors), (color: TextColor) => {
          const { unmount } = render(<Text color={color}>Test Text</Text>);

          const element = screen.getByText('Test Text');

          // Count how many color classes are applied
          const colorClassCount = colors.filter((c) =>
            element.className.includes(`color-${c}`)
          ).length;

          // Should have exactly one color class
          expect(colorClassCount).toBe(1);

          // And it should be the correct one
          expect(element.className).toMatch(new RegExp(`color-${color}`));

          unmount();
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should have exactly one alignment class applied for any alignment', () => {
      fc.assert(
        fc.property(fc.constantFrom(...alignments), (align: TextAlign) => {
          const { unmount } = render(<Text align={align}>Test Text</Text>);

          const element = screen.getByText('Test Text');

          // Count how many alignment classes are applied
          const alignClassCount = alignments.filter((a) =>
            element.className.includes(`align-${a}`)
          ).length;

          // Should have exactly one alignment class
          expect(alignClassCount).toBe(1);

          // And it should be the correct one
          expect(element.className).toMatch(new RegExp(`align-${align}`));

          unmount();
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should always have base text class regardless of variant, color, and alignment', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...variants),
          fc.constantFrom(...colors),
          fc.constantFrom(...alignments),
          (variant: TextVariant, color: TextColor, align: TextAlign) => {
            const { unmount } = render(
              <Text variant={variant} color={color} align={align}>
                Test Text
              </Text>
            );

            const element = screen.getByText('Test Text');

            // The element should always have the base text class
            // CSS modules will hash the class name, but it should contain 'text'
            expect(element.className).toMatch(/text/);

            unmount();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve variant, color, and alignment classes when combined with noWrap', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...variants),
          fc.constantFrom(...colors),
          fc.constantFrom(...alignments),
          fc.boolean(),
          (variant: TextVariant, color: TextColor, align: TextAlign, noWrap: boolean) => {
            const { unmount } = render(
              <Text variant={variant} color={color} align={align} noWrap={noWrap}>
                Test Text
              </Text>
            );

            const element = screen.getByText('Test Text');

            // Variant, color, and alignment classes should still be present
            expect(element.className).toMatch(new RegExp(`variant-${variant}`));
            expect(element.className).toMatch(new RegExp(`color-${color}`));
            expect(element.className).toMatch(new RegExp(`align-${align}`));

            // noWrap class should be applied based on prop
            if (noWrap) {
              expect(element.className).toMatch(/noWrap/);
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
