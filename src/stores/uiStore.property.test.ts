/**
 * UI Store Property-Based Tests
 *
 * Property-based tests for UI state management, specifically for
 * right drawer state consistency.
 *
 * Feature: map-interactions, Property 5: Right Drawer State Consistency
 * **Validates: Requirements 2.1, 2.7, 3.1**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import * as fc from 'fast-check';
import { useUIStore, defaultState, type DrawerContent } from './uiStore';
import type { Marker } from '../api/types';

describe('uiStore Property Tests', () => {
  // Reset store state before each test
  beforeEach(() => {
    act(() => {
      useUIStore.setState({
        ...defaultState,
      });
    });
  });

  /**
   * Feature: map-interactions, Property 5: Right Drawer State Consistency
   *
   * Property 5 states:
   * *For any* province or marker selection, the right drawer open state SHALL be true
   * if and only if rightDrawerContent is not null.
   *
   * **Validates: Requirements 2.1, 2.7, 3.1**
   */
  describe('Property 5: Right Drawer State Consistency', () => {
    /**
     * Arbitrary for generating province IDs.
     */
    const provinceIdArb = fc.stringMatching(/^[A-Za-z][A-Za-z0-9_]{2,20}$/);

    /**
     * Arbitrary for generating province names.
     */
    const provinceNameArb = fc.string({ minLength: 1, maxLength: 50 });

    /**
     * Arbitrary for generating marker IDs.
     */
    const markerIdArb = fc.stringMatching(/^[A-Za-z][A-Za-z0-9_]{2,30}$/);

    /**
     * Arbitrary for generating marker types.
     */
    const markerTypeArb = fc.constantFrom('battle', 'city', 'capital', 'person', 'event', 'other');

    /**
     * Arbitrary for generating years.
     */
    const yearArb = fc.integer({ min: -5000, max: 2100 });

    /**
     * Arbitrary for generating coordinates.
     */
    const coordinatesArb = fc.tuple(
      fc.double({ min: -180, max: 180, noNaN: true }),
      fc.double({ min: -90, max: 90, noNaN: true })
    );

    /**
     * Arbitrary for generating area drawer content.
     */
    const areaContentArb: fc.Arbitrary<DrawerContent> = fc
      .record({
        type: fc.constant('area' as const),
        provinceId: provinceIdArb,
        provinceName: provinceNameArb,
        wikiUrl: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
      })
      .map((content) => {
        // Remove wikiUrl if undefined to match optional property type
        if (content.wikiUrl === undefined) {
          const { wikiUrl: _, ...rest } = content;
          return rest as DrawerContent;
        }
        return content as DrawerContent;
      });

    /**
     * Arbitrary for generating marker drawer content.
     */
    const markerContentArb: fc.Arbitrary<DrawerContent> = fc
      .record({
        type: fc.constant('marker' as const),
        marker: fc
          .record({
            _id: markerIdArb,
            name: fc.string({ minLength: 1, maxLength: 50 }),
            type: markerTypeArb,
            year: yearArb,
            coo: coordinatesArb,
            wiki: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
          })
          .map((m) => {
            // Remove wiki if undefined to match optional property type
            if (m.wiki === undefined) {
              const { wiki: _, ...rest } = m;
              return rest as Marker;
            }
            return m as Marker;
          }),
      })
      .map((content) => content as DrawerContent);

    /**
     * Arbitrary for generating any drawer content.
     */
    const drawerContentArb: fc.Arbitrary<DrawerContent> = fc.oneof(
      areaContentArb,
      markerContentArb
    );

    it('should have rightDrawerOpen=true iff rightDrawerContent is not null after openRightDrawer', () => {
      fc.assert(
        fc.property(drawerContentArb, (content) => {
          // Reset state
          act(() => {
            useUIStore.setState(defaultState);
          });

          // Open drawer with content
          act(() => {
            useUIStore.getState().openRightDrawer(content);
          });

          const state = useUIStore.getState();

          // Property: rightDrawerOpen is true iff rightDrawerContent is not null
          expect(state.rightDrawerOpen).toBe(true);
          expect(state.rightDrawerContent).not.toBeNull();
          expect(state.rightDrawerContent).toEqual(content);
        }),
        { numRuns: 100 }
      );
    });

    it('should have rightDrawerOpen=false and rightDrawerContent=null after closeRightDrawer', () => {
      fc.assert(
        fc.property(drawerContentArb, (content) => {
          // Reset state
          act(() => {
            useUIStore.setState(defaultState);
          });

          // Open drawer first
          act(() => {
            useUIStore.getState().openRightDrawer(content);
          });

          // Verify drawer is open
          expect(useUIStore.getState().rightDrawerOpen).toBe(true);

          // Close drawer
          act(() => {
            useUIStore.getState().closeRightDrawer();
          });

          const state = useUIStore.getState();

          // Property: rightDrawerOpen is false and rightDrawerContent is null
          expect(state.rightDrawerOpen).toBe(false);
          expect(state.rightDrawerContent).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain consistency after multiple open/close cycles', () => {
      fc.assert(
        fc.property(
          fc.array(drawerContentArb, { minLength: 1, maxLength: 10 }),
          (contents) => {
            // Reset state
            act(() => {
              useUIStore.setState(defaultState);
            });

            for (const content of contents) {
              // Open drawer
              act(() => {
                useUIStore.getState().openRightDrawer(content);
              });

              // Verify consistency: open=true iff content!=null
              let state = useUIStore.getState();
              expect(state.rightDrawerOpen).toBe(state.rightDrawerContent !== null);
              expect(state.rightDrawerContent).toEqual(content);

              // Close drawer
              act(() => {
                useUIStore.getState().closeRightDrawer();
              });

              // Verify consistency: open=false and content=null
              state = useUIStore.getState();
              expect(state.rightDrawerOpen).toBe(false);
              expect(state.rightDrawerContent).toBeNull();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should replace content when opening drawer with new content while already open', () => {
      fc.assert(
        fc.property(
          drawerContentArb,
          drawerContentArb,
          (content1, content2) => {
            // Reset state
            act(() => {
              useUIStore.setState(defaultState);
            });

            // Open drawer with first content
            act(() => {
              useUIStore.getState().openRightDrawer(content1);
            });

            expect(useUIStore.getState().rightDrawerContent).toEqual(content1);

            // Open drawer with second content (should replace)
            act(() => {
              useUIStore.getState().openRightDrawer(content2);
            });

            const state = useUIStore.getState();

            // Property: drawer is still open with new content
            expect(state.rightDrawerOpen).toBe(true);
            expect(state.rightDrawerContent).toEqual(content2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve drawer content type (area vs marker)', () => {
      fc.assert(
        fc.property(drawerContentArb, (content) => {
          // Reset state
          act(() => {
            useUIStore.setState(defaultState);
          });

          // Open drawer
          act(() => {
            useUIStore.getState().openRightDrawer(content);
          });

          const state = useUIStore.getState();

          // Property: content type is preserved
          expect(state.rightDrawerContent?.type).toBe(content.type);

          if (content.type === 'area') {
            expect(state.rightDrawerContent).toHaveProperty('provinceId');
            expect(state.rightDrawerContent).toHaveProperty('provinceName');
          } else {
            expect(state.rightDrawerContent).toHaveProperty('marker');
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should handle area content with all optional fields', () => {
      fc.assert(
        fc.property(
          provinceIdArb,
          provinceNameArb,
          fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
          (provinceId, provinceName, wikiUrl) => {
            // Reset state
            act(() => {
              useUIStore.setState(defaultState);
            });

            // Build content, only including wikiUrl if defined
            const content: DrawerContent = wikiUrl !== undefined
              ? { type: 'area', provinceId, provinceName, wikiUrl }
              : { type: 'area', provinceId, provinceName };

            // Open drawer
            act(() => {
              useUIStore.getState().openRightDrawer(content);
            });

            const state = useUIStore.getState();

            // Property: all fields are preserved
            expect(state.rightDrawerOpen).toBe(true);
            expect(state.rightDrawerContent).toEqual(content);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle marker content with all marker properties', () => {
      fc.assert(
        fc.property(
          markerIdArb,
          fc.string({ minLength: 1, maxLength: 50 }),
          markerTypeArb,
          yearArb,
          coordinatesArb,
          (id, name, type, year, coo) => {
            // Reset state
            act(() => {
              useUIStore.setState(defaultState);
            });

            const marker: Marker = {
              _id: id,
              name,
              type: type,
              year,
              coo: coo,
            };

            const content: DrawerContent = {
              type: 'marker',
              marker,
            };

            // Open drawer
            act(() => {
              useUIStore.getState().openRightDrawer(content);
            });

            const state = useUIStore.getState();

            // Property: marker is preserved
            expect(state.rightDrawerOpen).toBe(true);
            expect(state.rightDrawerContent?.type).toBe('marker');
            if (state.rightDrawerContent?.type === 'marker') {
              expect(state.rightDrawerContent.marker._id).toBe(id);
              expect(state.rightDrawerContent.marker.name).toBe(name);
              expect(state.rightDrawerContent.marker.type).toBe(type);
              expect(state.rightDrawerContent.marker.year).toBe(year);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
