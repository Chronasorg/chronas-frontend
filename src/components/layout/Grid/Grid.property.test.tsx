/**
 * Property-Based Tests for Grid Component
 *
 * Feature: ui-primitives-migration, Property 13: Grid layout properties
 * Validates: Requirements 12.2, 12.3, 12.4, 12.6
 *
 * Tests that Grid layout properties are correctly applied.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { Grid, GridItem, type GridGap } from './index';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

const gaps: GridGap[] = ['none', 'xs', 'sm', 'md', 'lg', 'xl'];

describe('Grid Property Tests', () => {
  /**
   * Property 13: Grid columns
   * For any Grid with columns (number), the grid-template-columns CSS property SHALL be set correctly.
   * Validates: Requirements 12.2
   */
  describe('Property 13: Grid columns (number)', () => {
    it('should apply correct grid-template-columns for numeric columns', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 12 }), (columns) => {
          cleanup();
          const { container } = render(
            <Grid columns={columns}>
              <div>Item 1</div>
              <div>Item 2</div>
            </Grid>
          );

          const grid = container.firstChild as HTMLElement;
          expect(grid.style.gridTemplateColumns).toBe(`repeat(${String(columns)}, 1fr)`);
        }),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 13: Grid columns (template string)
   * For any Grid with columns (string), the grid-template-columns CSS property SHALL match.
   * Validates: Requirements 12.2
   */
  describe('Property 13: Grid columns (template string)', () => {
    it('should apply correct grid-template-columns for template strings', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('1fr 2fr', '100px 1fr', 'auto 1fr auto', '1fr 1fr 1fr'),
          (columns) => {
            cleanup();
            const { container } = render(
              <Grid columns={columns}>
                <div>Item 1</div>
                <div>Item 2</div>
              </Grid>
            );

            const grid = container.firstChild as HTMLElement;
            expect(grid.style.gridTemplateColumns).toBe(columns);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 13: Grid rows
   * For any Grid with rows template, the grid-template-rows CSS property SHALL match.
   * Validates: Requirements 12.3
   */
  describe('Property 13: Grid rows', () => {
    it('should apply correct grid-template-rows', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('auto', '1fr 2fr', '100px auto', 'auto 1fr auto'),
          (rows) => {
            cleanup();
            const { container } = render(
              <Grid rows={rows}>
                <div>Item 1</div>
                <div>Item 2</div>
              </Grid>
            );

            const grid = container.firstChild as HTMLElement;
            expect(grid.style.gridTemplateRows).toBe(rows);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 13: Grid gap
   * For any Grid with gap value, the gap CSS property SHALL match.
   * Validates: Requirements 12.4
   */
  describe('Property 13: Grid gap', () => {
    it('should apply correct gap class for all gap values', () => {
      fc.assert(
        fc.property(fc.constantFrom(...gaps), (gap) => {
          cleanup();
          const { container } = render(
            <Grid gap={gap}>
              <div>Item 1</div>
              <div>Item 2</div>
            </Grid>
          );

          const grid = container.firstChild as HTMLElement;
          expect(grid.className).toContain(`gap-${gap}`);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 13: Grid column gap
   * For any Grid with columnGap value, the column-gap CSS property SHALL match.
   * Validates: Requirements 12.4
   */
  describe('Property 13: Grid column gap', () => {
    it('should apply correct column-gap class', () => {
      fc.assert(
        fc.property(fc.constantFrom(...gaps), (columnGap) => {
          cleanup();
          const { container } = render(
            <Grid columnGap={columnGap}>
              <div>Item 1</div>
              <div>Item 2</div>
            </Grid>
          );

          const grid = container.firstChild as HTMLElement;
          expect(grid.className).toContain(`column-gap-${columnGap}`);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 13: Grid row gap
   * For any Grid with rowGap value, the row-gap CSS property SHALL match.
   * Validates: Requirements 12.4
   */
  describe('Property 13: Grid row gap', () => {
    it('should apply correct row-gap class', () => {
      fc.assert(
        fc.property(fc.constantFrom(...gaps), (rowGap) => {
          cleanup();
          const { container } = render(
            <Grid rowGap={rowGap}>
              <div>Item 1</div>
              <div>Item 2</div>
            </Grid>
          );

          const grid = container.firstChild as HTMLElement;
          expect(grid.className).toContain(`row-gap-${rowGap}`);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 13: GridItem colSpan
   * For any GridItem with colSpan, the grid-column CSS property SHALL be set correctly.
   * Validates: Requirements 12.6
   */
  describe('Property 13: GridItem colSpan', () => {
    it('should apply correct grid-column for colSpan', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 6 }), (colSpan) => {
          cleanup();
          const { container } = render(
            <Grid columns={6}>
              <GridItem colSpan={colSpan}>Item 1</GridItem>
            </Grid>
          );

          const gridItem = container.querySelector('[class*="grid-item"]') as HTMLElement;
          expect(gridItem.style.gridColumn).toBe(`span ${String(colSpan)}`);
        }),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 13: GridItem rowSpan
   * For any GridItem with rowSpan, the grid-row CSS property SHALL be set correctly.
   * Validates: Requirements 12.6
   */
  describe('Property 13: GridItem rowSpan', () => {
    it('should apply correct grid-row for rowSpan', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 6 }), (rowSpan) => {
          cleanup();
          const { container } = render(
            <Grid columns={3}>
              <GridItem rowSpan={rowSpan}>Item 1</GridItem>
            </Grid>
          );

          const gridItem = container.querySelector('[class*="grid-item"]') as HTMLElement;
          expect(gridItem.style.gridRow).toBe(`span ${String(rowSpan)}`);
        }),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 13: GridItem positioning (colStart/colEnd)
   * For any GridItem with colStart and colEnd, the grid-column CSS property SHALL be set correctly.
   * Validates: Requirements 12.6
   */
  describe('Property 13: GridItem column positioning', () => {
    it('should apply correct grid-column for colStart and colEnd', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 4 }),
          fc.integer({ min: 2, max: 5 }),
          (colStart, colEndOffset) => {
            cleanup();
            const colEnd = colStart + colEndOffset;
            const { container } = render(
              <Grid columns={6}>
                <GridItem colStart={colStart} colEnd={colEnd}>Item 1</GridItem>
              </Grid>
            );

            const gridItem = container.querySelector('[class*="grid-item"]') as HTMLElement;
            expect(gridItem.style.gridColumn).toBe(`${String(colStart)} / ${String(colEnd)}`);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should apply correct grid-column-start for colStart only', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 6 }), (colStart) => {
          cleanup();
          const { container } = render(
            <Grid columns={6}>
              <GridItem colStart={colStart}>Item 1</GridItem>
            </Grid>
          );

          const gridItem = container.querySelector('[class*="grid-item"]') as HTMLElement;
          expect(gridItem.style.gridColumnStart).toBe(String(colStart));
        }),
        { numRuns: 30 }
      );
    });
  });

  /**
   * Property 13: GridItem positioning (rowStart/rowEnd)
   * For any GridItem with rowStart and rowEnd, the grid-row CSS property SHALL be set correctly.
   * Validates: Requirements 12.6
   */
  describe('Property 13: GridItem row positioning', () => {
    it('should apply correct grid-row for rowStart and rowEnd', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 4 }),
          fc.integer({ min: 2, max: 5 }),
          (rowStart, rowEndOffset) => {
            cleanup();
            const rowEnd = rowStart + rowEndOffset;
            const { container } = render(
              <Grid columns={3}>
                <GridItem rowStart={rowStart} rowEnd={rowEnd}>Item 1</GridItem>
              </Grid>
            );

            const gridItem = container.querySelector('[class*="grid-item"]') as HTMLElement;
            expect(gridItem.style.gridRow).toBe(`${String(rowStart)} / ${String(rowEnd)}`);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should apply correct grid-row-start for rowStart only', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 6 }), (rowStart) => {
          cleanup();
          const { container } = render(
            <Grid columns={3}>
              <GridItem rowStart={rowStart}>Item 1</GridItem>
            </Grid>
          );

          const gridItem = container.querySelector('[class*="grid-item"]') as HTMLElement;
          expect(gridItem.style.gridRowStart).toBe(String(rowStart));
        }),
        { numRuns: 30 }
      );
    });
  });

  /**
   * Custom className support
   */
  describe('Custom className', () => {
    it('should apply custom className to Grid', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9-]*$/).filter((s) => s.length >= 1 && s.length <= 20),
          (customClass) => {
            cleanup();
            const { container } = render(
              <Grid className={customClass}>
                <div>Item 1</div>
              </Grid>
            );

            const grid = container.firstChild as HTMLElement;
            expect(grid.className).toContain(customClass);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should apply custom className to GridItem', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9-]*$/).filter((s) => s.length >= 1 && s.length <= 20),
          (customClass) => {
            cleanup();
            const { container } = render(
              <Grid>
                <GridItem className={customClass}>Item 1</GridItem>
              </Grid>
            );

            const gridItem = container.querySelector('[class*="grid-item"]') as HTMLElement;
            expect(gridItem.className).toContain(customClass);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
