/**
 * Property-Based Tests for Stack Component
 *
 * Feature: ui-primitives-migration, Property 11: Stack layout properties
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4
 *
 * Tests that Stack layout properties are correctly applied.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { Stack, type StackDirection, type StackSpacing, type StackAlign, type StackJustify } from './Stack';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

const directions: StackDirection[] = ['row', 'column', 'row-reverse', 'column-reverse'];
const spacings: StackSpacing[] = ['none', 'xs', 'sm', 'md', 'lg', 'xl'];
const alignments: StackAlign[] = ['flex-start', 'center', 'flex-end', 'stretch', 'baseline'];
const justifications: StackJustify[] = ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'];

describe('Stack Property Tests', () => {
  /**
   * Property 11: Stack layout properties
   * For any Stack with direction, the flex-direction CSS property SHALL match.
   * Validates: Requirements 10.1
   */
  describe('Property 11: Stack direction', () => {
    it('should apply correct direction class for all directions', () => {
      fc.assert(
        fc.property(fc.constantFrom(...directions), (direction) => {
          cleanup();
          const { container } = render(
            <Stack direction={direction}>
              <div>Item 1</div>
              <div>Item 2</div>
            </Stack>
          );

          const stack = container.firstChild as HTMLElement;
          expect(stack.className).toContain(`direction-${direction}`);
        }),
        { numRuns: 100 }
      );
    });

    it('should default to column direction', () => {
      const { container } = render(
        <Stack>
          <div>Item 1</div>
          <div>Item 2</div>
        </Stack>
      );

      const stack = container.firstChild as HTMLElement;
      expect(stack.className).toContain('direction-column');
    });
  });

  /**
   * Property 11: Stack spacing
   * For any spacing value, the gap CSS property SHALL match.
   * Validates: Requirements 10.2
   */
  describe('Property 11: Stack spacing', () => {
    it('should apply correct spacing class for all spacing values', () => {
      fc.assert(
        fc.property(fc.constantFrom(...spacings), (spacing) => {
          cleanup();
          const { container } = render(
            <Stack spacing={spacing}>
              <div>Item 1</div>
              <div>Item 2</div>
            </Stack>
          );

          const stack = container.firstChild as HTMLElement;
          expect(stack.className).toContain(`spacing-${spacing}`);
        }),
        { numRuns: 100 }
      );
    });

    it('should default to md spacing', () => {
      const { container } = render(
        <Stack>
          <div>Item 1</div>
          <div>Item 2</div>
        </Stack>
      );

      const stack = container.firstChild as HTMLElement;
      expect(stack.className).toContain('spacing-md');
    });
  });

  /**
   * Property 11: Stack alignment
   * For any align value, the align-items CSS property SHALL match.
   * Validates: Requirements 10.3
   */
  describe('Property 11: Stack alignment', () => {
    it('should apply correct align class for all alignment values', () => {
      fc.assert(
        fc.property(fc.constantFrom(...alignments), (align) => {
          cleanup();
          const { container } = render(
            <Stack align={align}>
              <div>Item 1</div>
              <div>Item 2</div>
            </Stack>
          );

          const stack = container.firstChild as HTMLElement;
          expect(stack.className).toContain(`align-${align}`);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 11: Stack justification
   * For any justify value, the justify-content CSS property SHALL match.
   * Validates: Requirements 10.4
   */
  describe('Property 11: Stack justification', () => {
    it('should apply correct justify class for all justification values', () => {
      fc.assert(
        fc.property(fc.constantFrom(...justifications), (justify) => {
          cleanup();
          const { container } = render(
            <Stack justify={justify}>
              <div>Item 1</div>
              <div>Item 2</div>
            </Stack>
          );

          const stack = container.firstChild as HTMLElement;
          expect(stack.className).toContain(`justify-${justify}`);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Combined property test for all layout properties
   */
  describe('Combined layout properties', () => {
    it('should apply all layout properties correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...directions),
          fc.constantFrom(...spacings),
          fc.constantFrom(...alignments),
          fc.constantFrom(...justifications),
          fc.boolean(),
          (direction, spacing, align, justify, wrap) => {
            cleanup();
            const { container } = render(
              <Stack
                direction={direction}
                spacing={spacing}
                align={align}
                justify={justify}
                wrap={wrap}
              >
                <div>Item 1</div>
                <div>Item 2</div>
              </Stack>
            );

            const stack = container.firstChild as HTMLElement;
            expect(stack.className).toContain(`direction-${direction}`);
            expect(stack.className).toContain(`spacing-${spacing}`);
            expect(stack.className).toContain(`align-${align}`);
            expect(stack.className).toContain(`justify-${justify}`);
            if (wrap) {
              expect(stack.className).toContain('wrap');
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Divider tests
   * Validates: Requirements 10.6
   */
  describe('Divider support', () => {
    it('should insert dividers between children', () => {
      fc.assert(
        fc.property(fc.integer({ min: 2, max: 5 }), (childCount) => {
          cleanup();
          const { container } = render(
            <Stack divider={<hr />}>
              {Array.from({ length: childCount }, (_, i) => (
                <div key={i}>Item {String(i + 1)}</div>
              ))}
            </Stack>
          );

          const dividers = container.querySelectorAll('hr');
          // Should have childCount - 1 dividers
          expect(dividers.length).toBe(childCount - 1);
        }),
        { numRuns: 30 }
      );
    });

    it('should not insert dividers when not provided', () => {
      const { container } = render(
        <Stack>
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </Stack>
      );

      const dividers = container.querySelectorAll('[class*="divider"]');
      expect(dividers.length).toBe(0);
    });
  });

  /**
   * Custom className support
   */
  describe('Custom className', () => {
    it('should apply custom className', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9-]*$/).filter((s) => s.length >= 1 && s.length <= 20),
          (customClass) => {
            cleanup();
            const { container } = render(
              <Stack className={customClass}>
                <div>Item 1</div>
              </Stack>
            );

            const stack = container.firstChild as HTMLElement;
            expect(stack.className).toContain(customClass);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
