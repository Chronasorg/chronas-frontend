/**
 * Property-Based Tests for Flex Component
 *
 * Feature: ui-primitives-migration, Property 12: Flex layout properties
 * Validates: Requirements 11.2, 11.5
 *
 * Tests that Flex layout properties are correctly applied.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { Flex, type FlexDirection, type FlexWrap, type FlexAlign, type FlexJustify, type FlexGap } from './Flex';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

const directions: FlexDirection[] = ['row', 'column', 'row-reverse', 'column-reverse'];
const wraps: FlexWrap[] = ['nowrap', 'wrap', 'wrap-reverse'];
const alignments: FlexAlign[] = ['flex-start', 'center', 'flex-end', 'stretch', 'baseline'];
const justifications: FlexJustify[] = ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'];
const gaps: FlexGap[] = ['none', 'xs', 'sm', 'md', 'lg', 'xl'];

describe('Flex Property Tests', () => {
  /**
   * Property 12: Flex direction
   * For any Flex with direction, the flex-direction CSS property SHALL match.
   * Validates: Requirements 11.2
   */
  describe('Property 12: Flex direction', () => {
    it('should apply correct direction class for all directions', () => {
      fc.assert(
        fc.property(fc.constantFrom(...directions), (direction) => {
          cleanup();
          const { container } = render(
            <Flex direction={direction}>
              <div>Item 1</div>
              <div>Item 2</div>
            </Flex>
          );

          const flex = container.firstChild as HTMLElement;
          expect(flex.className).toContain(`direction-${direction}`);
        }),
        { numRuns: 100 }
      );
    });

    it('should default to row direction', () => {
      const { container } = render(
        <Flex>
          <div>Item 1</div>
          <div>Item 2</div>
        </Flex>
      );

      const flex = container.firstChild as HTMLElement;
      expect(flex.className).toContain('direction-row');
    });
  });

  /**
   * Property 12: Flex wrap
   * For any Flex with wrap, the flex-wrap CSS property SHALL match.
   * Validates: Requirements 11.2
   */
  describe('Property 12: Flex wrap', () => {
    it('should apply correct wrap class for all wrap values', () => {
      fc.assert(
        fc.property(fc.constantFrom(...wraps), (wrap) => {
          cleanup();
          const { container } = render(
            <Flex wrap={wrap}>
              <div>Item 1</div>
              <div>Item 2</div>
            </Flex>
          );

          const flex = container.firstChild as HTMLElement;
          expect(flex.className).toContain(`wrap-${wrap}`);
        }),
        { numRuns: 100 }
      );
    });

    it('should default to nowrap', () => {
      const { container } = render(
        <Flex>
          <div>Item 1</div>
          <div>Item 2</div>
        </Flex>
      );

      const flex = container.firstChild as HTMLElement;
      expect(flex.className).toContain('wrap-nowrap');
    });
  });

  /**
   * Property 12: Flex gap
   * For any Flex with gap, the gap CSS property SHALL match.
   * Validates: Requirements 11.2
   */
  describe('Property 12: Flex gap', () => {
    it('should apply correct gap class for all gap values', () => {
      fc.assert(
        fc.property(fc.constantFrom(...gaps), (gap) => {
          cleanup();
          const { container } = render(
            <Flex gap={gap}>
              <div>Item 1</div>
              <div>Item 2</div>
            </Flex>
          );

          const flex = container.firstChild as HTMLElement;
          expect(flex.className).toContain(`gap-${gap}`);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 12: Flex alignment
   * For any Flex with align, the align-items CSS property SHALL match.
   * Validates: Requirements 11.2
   */
  describe('Property 12: Flex alignment', () => {
    it('should apply correct align class for all alignment values', () => {
      fc.assert(
        fc.property(fc.constantFrom(...alignments), (align) => {
          cleanup();
          const { container } = render(
            <Flex align={align}>
              <div>Item 1</div>
              <div>Item 2</div>
            </Flex>
          );

          const flex = container.firstChild as HTMLElement;
          expect(flex.className).toContain(`align-${align}`);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 12: Flex justification
   * For any Flex with justify, the justify-content CSS property SHALL match.
   * Validates: Requirements 11.2
   */
  describe('Property 12: Flex justification', () => {
    it('should apply correct justify class for all justification values', () => {
      fc.assert(
        fc.property(fc.constantFrom(...justifications), (justify) => {
          cleanup();
          const { container } = render(
            <Flex justify={justify}>
              <div>Item 1</div>
              <div>Item 2</div>
            </Flex>
          );

          const flex = container.firstChild as HTMLElement;
          expect(flex.className).toContain(`justify-${justify}`);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 12: Flex item properties (grow, shrink, basis)
   * For any Flex with grow, shrink, or basis props, the corresponding CSS properties SHALL match.
   * Validates: Requirements 11.5
   */
  describe('Property 12: Flex item properties', () => {
    it('should apply flex-grow inline style', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 10 }), (grow) => {
          cleanup();
          const { container } = render(
            <Flex grow={grow}>
              <div>Item 1</div>
            </Flex>
          );

          const flex = container.firstChild as HTMLElement;
          expect(flex.style.flexGrow).toBe(String(grow));
        }),
        { numRuns: 50 }
      );
    });

    it('should apply flex-shrink inline style', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 10 }), (shrink) => {
          cleanup();
          const { container } = render(
            <Flex shrink={shrink}>
              <div>Item 1</div>
            </Flex>
          );

          const flex = container.firstChild as HTMLElement;
          expect(flex.style.flexShrink).toBe(String(shrink));
        }),
        { numRuns: 50 }
      );
    });

    it('should apply flex-basis inline style', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('auto', '100px', '50%', '200px'),
          (basis) => {
            cleanup();
            const { container } = render(
              <Flex basis={basis}>
                <div>Item 1</div>
              </Flex>
            );

            const flex = container.firstChild as HTMLElement;
            expect(flex.style.flexBasis).toBe(basis);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should apply flex-basis of 0 correctly', () => {
      const { container } = render(
        <Flex basis="0">
          <div>Item 1</div>
        </Flex>
      );

      const flex = container.firstChild as HTMLElement;
      // Browser normalizes "0" to "0px"
      expect(flex.style.flexBasis).toMatch(/^0(px)?$/);
    });
  });

  /**
   * Inline display mode
   */
  describe('Inline display mode', () => {
    it('should apply inline class when inline is true', () => {
      const { container } = render(
        <Flex inline>
          <div>Item 1</div>
        </Flex>
      );

      const flex = container.firstChild as HTMLElement;
      expect(flex.className).toContain('inline');
    });

    it('should not apply inline class when inline is false', () => {
      const { container } = render(
        <Flex inline={false}>
          <div>Item 1</div>
        </Flex>
      );

      const flex = container.firstChild as HTMLElement;
      expect(flex.className).not.toContain('inline');
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
          fc.constantFrom(...wraps),
          fc.constantFrom(...gaps),
          fc.boolean(),
          (direction, wrap, gap, inline) => {
            cleanup();
            const { container } = render(
              <Flex
                direction={direction}
                wrap={wrap}
                gap={gap}
                inline={inline}
              >
                <div>Item 1</div>
                <div>Item 2</div>
              </Flex>
            );

            const flex = container.firstChild as HTMLElement;
            expect(flex.className).toContain(`direction-${direction}`);
            expect(flex.className).toContain(`wrap-${wrap}`);
            expect(flex.className).toContain(`gap-${gap}`);
            if (inline) {
              expect(flex.className).toContain('inline');
            }
          }
        ),
        { numRuns: 50 }
      );
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
              <Flex className={customClass}>
                <div>Item 1</div>
              </Flex>
            );

            const flex = container.firstChild as HTMLElement;
            expect(flex.className).toContain(customClass);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
