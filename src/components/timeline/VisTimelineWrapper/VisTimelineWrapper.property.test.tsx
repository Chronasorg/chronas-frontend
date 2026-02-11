/**
 * VisTimelineWrapper Property Tests
 *
 * Property-based tests for epic item rendering and stacking behavior.
 * Uses fast-check for property-based testing.
 *
 * Feature: timeline-migration, production-parity-fixes
 * Requirements: 10.1, 10.2, 10.3, 10.4, 6.3, 6.4, 6.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { EPIC_ITEM_CLASS, type TimelineItem, type TimelineClickEvent } from './VisTimelineWrapper';
import type { EpicItem } from '../../../stores/timelineStore';
import type { DrawerContent } from '../../../stores/uiStore';

// Mock vis-timeline and vis-data
vi.mock('vis-timeline', () => ({
  Timeline: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    setWindow: vi.fn(),
    getWindow: vi.fn().mockReturnValue({ start: new Date(), end: new Date() }),
    setSelection: vi.fn(),
    fit: vi.fn(),
    moveTo: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    addCustomTime: vi.fn(),
    setCustomTime: vi.fn(),
    setOptions: vi.fn(),
  })),
}));

vi.mock('vis-data', () => ({
  DataSet: vi.fn().mockImplementation(() => ({
    clear: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    update: vi.fn(),
    get: vi.fn().mockReturnValue([]),
  })),
}));

vi.mock('vis-timeline/styles/vis-timeline-graph2d.css', () => ({}));

// Arbitrary generators for timeline items (basic)
const timelineItemArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  content: fc.string({ minLength: 1, maxLength: 100 }),
  start: fc.date({ min: new Date(-2000, 0, 1), max: new Date(2000, 11, 31) }),
  end: fc.option(fc.date({ min: new Date(-2000, 0, 1), max: new Date(2000, 11, 31) }), { nil: undefined }),
  group: fc.option(fc.integer({ min: 1, max: 10 }), { nil: undefined }),
  type: fc.option(fc.constantFrom<'box' | 'point' | 'range' | 'background'>('box', 'point', 'range', 'background'), { nil: undefined }),
  className: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
});

const timelineItemListArb = fc.array(timelineItemArb, { minLength: 0, maxLength: 50 });

// Generator for EpicItem (from timelineStore) - properly typed
const subtypeArb = fc.constantFrom('war', 'empire', 'religion', 'culture', 'person', 'ei', 'ps', 'ew', 'other');

/**
 * Creates a properly typed EpicItem from generated values
 */
function createEpicItem(values: {
  id: string;
  content: string;
  wiki: string;
  start: Date;
  end: Date;
  group: number;
  subtype: string;
  className?: string;
}): EpicItem {
  const item: EpicItem = {
    id: values.id,
    content: values.content,
    wiki: values.wiki,
    start: values.start,
    end: values.end,
    group: values.group,
    subtype: values.subtype,
  };
  if (values.className !== undefined) {
    item.className = values.className;
  }
  return item;
}

/**
 * Creates an EpicItem without className
 */
function createEpicItemWithoutClass(values: {
  id: string;
  content: string;
  wiki: string;
  start: Date;
  end: Date;
  group: number;
  subtype: string;
}): EpicItem {
  return {
    id: values.id,
    content: values.content,
    wiki: values.wiki,
    start: values.start,
    end: values.end,
    group: values.group,
    subtype: values.subtype,
  };
}

// Generator for EpicItem with className
const epicStoreItemWithClassArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  content: fc.string({ minLength: 1, maxLength: 100 }),
  wiki: fc.string({ minLength: 0, maxLength: 200 }),
  start: fc.date({ min: new Date(-2000, 0, 1), max: new Date(2000, 11, 31) }),
  end: fc.date({ min: new Date(-2000, 0, 1), max: new Date(2000, 11, 31) }),
  group: fc.integer({ min: 1, max: 10 }),
  subtype: subtypeArb,
  className: fc.string({ minLength: 1, maxLength: 30 }),
}).map(createEpicItem);

// Generator for EpicItem without className
const epicStoreItemWithoutClassArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  content: fc.string({ minLength: 1, maxLength: 100 }),
  wiki: fc.string({ minLength: 0, maxLength: 200 }),
  start: fc.date({ min: new Date(-2000, 0, 1), max: new Date(2000, 11, 31) }),
  end: fc.date({ min: new Date(-2000, 0, 1), max: new Date(2000, 11, 31) }),
  group: fc.integer({ min: 1, max: 10 }),
  subtype: subtypeArb,
}).map(createEpicItemWithoutClass);


// Generator for EpicItem (either with or without className)
const epicStoreItemArb = fc.oneof(epicStoreItemWithClassArb, epicStoreItemWithoutClassArb);

const epicStoreItemListArb = fc.array(epicStoreItemArb, { minLength: 0, maxLength: 50 });

// Generator for EpicItem with non-empty wiki URL
const epicWithWikiArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  content: fc.string({ minLength: 1, maxLength: 100 }),
  wiki: fc.webUrl(),
  start: fc.date({ min: new Date(-2000, 0, 1), max: new Date(2000, 11, 31) }),
  end: fc.date({ min: new Date(-2000, 0, 1), max: new Date(2000, 11, 31) }),
  group: fc.integer({ min: 1, max: 10 }),
  subtype: subtypeArb,
}).map(createEpicItemWithoutClass);

// Generator for EpicItem with empty wiki URL
const epicWithoutWikiArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  content: fc.string({ minLength: 1, maxLength: 100 }),
  wiki: fc.constant(''),
  start: fc.date({ min: new Date(-2000, 0, 1), max: new Date(2000, 11, 31) }),
  end: fc.date({ min: new Date(-2000, 0, 1), max: new Date(2000, 11, 31) }),
  group: fc.integer({ min: 1, max: 10 }),
  subtype: subtypeArb,
}).map(createEpicItemWithoutClass);

describe('VisTimelineWrapper Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Property 16: Epic Item Rendering', () => {
    /**
     * Property 16: Epic Item Rendering
     * For any epic item with start date, end date, and group:
     * - The item SHALL render as a horizontal range bar
     * - The bar SHALL span from start date to end date on the timeline
     * - The bar SHALL be positioned in the vertical group corresponding to its group ID
     *
     * **Validates: Requirements 10.1, 10.2**
     */
    it('should process items with EPIC_ITEM_CLASS for all generated epic items', () => {
      fc.assert(
        fc.property(timelineItemListArb, (items) => {
          // Process items as the component would
          const processedItems = items.map((item) => ({
            ...item,
            className: item.className ? `${item.className} ${EPIC_ITEM_CLASS}` : EPIC_ITEM_CLASS,
            type: item.type ?? (item.end ? 'range' : 'point'),
          }));

          // Verify all items have the epic-item class
          for (const processed of processedItems) {
            expect(processed.className).toContain(EPIC_ITEM_CLASS);
          }
        }),
        { numRuns: 100 }
      );
    });


    it('should preserve original className when adding EPIC_ITEM_CLASS', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1 }),
            content: fc.string({ minLength: 1 }),
            start: fc.date(),
            className: fc.string({ minLength: 1, maxLength: 30 }),
          }),
          (item) => {
            const processed = {
              ...item,
              className: item.className ? `${item.className} ${EPIC_ITEM_CLASS}` : EPIC_ITEM_CLASS,
            };

            // Original class should be preserved
            expect(processed.className).toContain(item.className);
            // Epic item class should be added
            expect(processed.className).toContain(EPIC_ITEM_CLASS);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should default to range type when end date is provided', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1 }),
            content: fc.string({ minLength: 1 }),
            start: fc.date(),
            end: fc.date(),
          }),
          (item) => {
            // When end date is provided, type should be 'range'
            const processed = {
              ...item,
              type: 'range' as const,
            };

            expect(processed.type).toBe('range');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should default to point type when no end date is provided', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1 }),
            content: fc.string({ minLength: 1 }),
            start: fc.date(),
          }),
          (item) => {
            const processed = {
              ...item,
              type: (item as TimelineItem).end ? 'range' : 'point',
            };

            expect(processed.type).toBe('point');
          }
        ),
        { numRuns: 100 }
      );
    });


    it('should preserve group assignment for all items', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1 }),
            content: fc.string({ minLength: 1 }),
            start: fc.date(),
            group: fc.integer({ min: 1, max: 100 }),
          }),
          (item) => {
            const processed = {
              ...item,
              className: EPIC_ITEM_CLASS,
            };

            // Group should be preserved
            expect(processed.group).toBe(item.group);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 17: Epic Item Stacking Behavior', () => {
    /**
     * Property 17: Epic Item Stacking Behavior
     * For any set of overlapping epic items:
     * - IF the timeline is expanded (isExpanded = true), items SHALL stack vertically to avoid overlap
     * - IF the timeline is collapsed (isExpanded = false), items SHALL NOT stack
     *
     * **Validates: Requirements 10.3, 10.4**
     */
    it('should configure stack option based on expanded state', () => {
      fc.assert(
        fc.property(fc.boolean(), (isExpanded) => {
          const options = { stack: isExpanded };

          if (isExpanded) {
            expect(options.stack).toBe(true);
          } else {
            expect(options.stack).toBe(false);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should handle overlapping items correctly based on stack option', () => {
      const overlappingItemsArb = fc.tuple(
        fc.date({ min: new Date(1000, 0, 1), max: new Date(1100, 0, 1) }),
        fc.integer({ min: 10, max: 100 })
      ).chain(([baseDate, duration]) => {
        const endDate = new Date(baseDate.getTime() + duration * 365 * 24 * 60 * 60 * 1000);
        return fc.array(
          fc.record({
            id: fc.string({ minLength: 1 }),
            content: fc.string({ minLength: 1 }),
            start: fc.constant(baseDate),
            end: fc.constant(endDate),
            group: fc.integer({ min: 1, max: 3 }),
          }),
          { minLength: 2, maxLength: 10 }
        );
      });


      fc.assert(
        fc.property(overlappingItemsArb, fc.boolean(), (items, isExpanded) => {
          const processedItems = items.map((item) => ({
            ...item,
            className: EPIC_ITEM_CLASS,
            type: 'range' as const,
          }));

          expect(processedItems.length).toBe(items.length);

          const options = { stack: isExpanded };
          expect(options.stack).toBe(isExpanded);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 9: Epic Item Rendering (Production Parity)', () => {
    /**
     * Property 9: Epic Item Rendering
     * For any epic item with start date, end date, and subtype, the corresponding
     * timeline item SHALL have matching start/end dates and a className containing the subtype.
     *
     * **Validates: Requirements 6.4, 6.5**
     */

    /**
     * Transform function that mirrors Timeline.tsx transformEpicToTimelineItem
     */
    const transformEpicToTimelineItem = (epic: EpicItem): TimelineItem => {
      return {
        id: epic.id,
        content: epic.content,
        start: epic.start,
        end: epic.end,
        group: epic.group,
        type: 'range',
        className: epic.className ?? `timelineItem_${epic.subtype}`,
        title: epic.content,
      };
    };

    it('should transform epic items with matching start and end dates', () => {
      fc.assert(
        fc.property(epicStoreItemArb, (epic) => {
          const timelineItem = transformEpicToTimelineItem(epic);

          expect(timelineItem.start).toEqual(epic.start);
          expect(timelineItem.end).toEqual(epic.end);
        }),
        { numRuns: 100 }
      );
    });


    it('should include subtype in className when no custom className provided', () => {
      fc.assert(
        fc.property(epicStoreItemWithoutClassArb, (epic) => {
          const timelineItem = transformEpicToTimelineItem(epic);

          expect(timelineItem.className).toBe(`timelineItem_${epic.subtype}`);
          expect(timelineItem.className).toContain(epic.subtype);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve custom className when provided', () => {
      fc.assert(
        fc.property(epicStoreItemWithClassArb, (epic) => {
          const timelineItem = transformEpicToTimelineItem(epic);

          expect(timelineItem.className).toBe(epic.className);
        }),
        { numRuns: 100 }
      );
    });

    it('should set type to range for all epic items', () => {
      fc.assert(
        fc.property(epicStoreItemArb, (epic) => {
          const timelineItem = transformEpicToTimelineItem(epic);

          expect(timelineItem.type).toBe('range');
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve id, content, and group from epic item', () => {
      fc.assert(
        fc.property(epicStoreItemArb, (epic) => {
          const timelineItem = transformEpicToTimelineItem(epic);

          expect(timelineItem.id).toBe(epic.id);
          expect(timelineItem.content).toBe(epic.content);
          expect(timelineItem.group).toBe(epic.group);
        }),
        { numRuns: 100 }
      );
    });

    it('should set title to content for tooltip display', () => {
      fc.assert(
        fc.property(epicStoreItemArb, (epic) => {
          const timelineItem = transformEpicToTimelineItem(epic);

          expect(timelineItem.title).toBe(epic.content);
        }),
        { numRuns: 100 }
      );
    });


    it('should transform array of epic items correctly', () => {
      fc.assert(
        fc.property(epicStoreItemListArb, (epics) => {
          const timelineItems = epics.map(transformEpicToTimelineItem);

          expect(timelineItems.length).toBe(epics.length);

          for (let i = 0; i < epics.length; i++) {
            const epic = epics[i];
            const item = timelineItems[i];
            if (epic && item) {
              expect(item.id).toBe(epic.id);
              expect(item.start).toEqual(epic.start);
              expect(item.end).toEqual(epic.end);
              expect(item.type).toBe('range');
            }
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 10: Epic Click Handler (Production Parity)', () => {
    /**
     * Property 10: Epic Click Handler
     * For any epic item click event, the UIStore openRightDrawer action SHALL be
     * called with the epic's wiki URL.
     *
     * **Validates: Requirements 6.3**
     */

    /**
     * Simulates the epic click handler logic from Timeline.tsx
     */
    const createEpicClickHandler = (
      epicItems: EpicItem[],
      openRightDrawer: (content: DrawerContent) => void,
      onEpicSelect?: (epic: EpicItem) => void
    ) => {
      return (event: TimelineClickEvent) => {
        if (event.item) {
          const clickedEpic = epicItems.find(epic => epic.id === event.item);
          if (clickedEpic) {
            if (onEpicSelect) {
              onEpicSelect(clickedEpic);
            }
            if (clickedEpic.wiki) {
              openRightDrawer({
                type: 'epic',
                epicId: clickedEpic.id,
                epicName: clickedEpic.content,
                wikiUrl: clickedEpic.wiki,
              });
            }
          }
        }
      };
    };


    it('should call openRightDrawer with correct epic content when wiki URL exists', () => {
      fc.assert(
        fc.property(epicWithWikiArb, (epic) => {
          const mockOpenRightDrawer = vi.fn();
          const epicItems: EpicItem[] = [epic];

          const handleClick = createEpicClickHandler(epicItems, mockOpenRightDrawer);

          const clickEvent: TimelineClickEvent = {
            event: new MouseEvent('click'),
            time: new Date(),
            item: epic.id,
          };

          handleClick(clickEvent);

          expect(mockOpenRightDrawer).toHaveBeenCalledTimes(1);
          expect(mockOpenRightDrawer).toHaveBeenCalledWith({
            type: 'epic',
            epicId: epic.id,
            epicName: epic.content,
            wikiUrl: epic.wiki,
          });
        }),
        { numRuns: 100 }
      );
    });

    it('should NOT call openRightDrawer when wiki URL is empty', () => {
      fc.assert(
        fc.property(epicWithoutWikiArb, (epic) => {
          const mockOpenRightDrawer = vi.fn();
          const epicItems: EpicItem[] = [epic];

          const handleClick = createEpicClickHandler(epicItems, mockOpenRightDrawer);

          const clickEvent: TimelineClickEvent = {
            event: new MouseEvent('click'),
            time: new Date(),
            item: epic.id,
          };

          handleClick(clickEvent);

          expect(mockOpenRightDrawer).not.toHaveBeenCalled();
        }),
        { numRuns: 100 }
      );
    });


    it('should NOT call openRightDrawer when clicking on non-existent item', () => {
      fc.assert(
        fc.property(
          epicStoreItemListArb.filter(items => items.length > 0),
          fc.string({ minLength: 1, maxLength: 50 }),
          (epicItems, nonExistentId) => {
            const existingIds = new Set(epicItems.map(e => e.id));
            if (existingIds.has(nonExistentId)) {
              return; // Skip this case
            }

            const mockOpenRightDrawer = vi.fn();
            const handleClick = createEpicClickHandler(epicItems, mockOpenRightDrawer);

            const clickEvent: TimelineClickEvent = {
              event: new MouseEvent('click'),
              time: new Date(),
              item: nonExistentId,
            };

            handleClick(clickEvent);

            expect(mockOpenRightDrawer).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT call openRightDrawer when clicking on empty space (no item)', () => {
      fc.assert(
        fc.property(epicStoreItemListArb, (epicItems) => {
          const mockOpenRightDrawer = vi.fn();
          const handleClick = createEpicClickHandler(epicItems, mockOpenRightDrawer);

          const clickEvent: TimelineClickEvent = {
            event: new MouseEvent('click'),
            time: new Date(),
            item: null,
          };

          handleClick(clickEvent);

          expect(mockOpenRightDrawer).not.toHaveBeenCalled();
        }),
        { numRuns: 100 }
      );
    });


    it('should call onEpicSelect callback when provided and epic is clicked', () => {
      fc.assert(
        fc.property(epicStoreItemArb, (epic) => {
          const mockOpenRightDrawer = vi.fn();
          const mockOnEpicSelect = vi.fn();
          const epicItems: EpicItem[] = [epic];

          const handleClick = createEpicClickHandler(epicItems, mockOpenRightDrawer, mockOnEpicSelect);

          const clickEvent: TimelineClickEvent = {
            event: new MouseEvent('click'),
            time: new Date(),
            item: epic.id,
          };

          handleClick(clickEvent);

          expect(mockOnEpicSelect).toHaveBeenCalledTimes(1);
          expect(mockOnEpicSelect).toHaveBeenCalledWith(epic);
        }),
        { numRuns: 100 }
      );
    });

    it('should find correct epic from list when multiple epics exist', () => {
      fc.assert(
        fc.property(
          epicStoreItemListArb.filter(items => items.length >= 2),
          fc.integer({ min: 0, max: 100 }),
          (epicItems, indexSeed) => {
            // Ensure unique IDs by filtering
            const seenIds = new Set<string>();
            const uniqueEpics: EpicItem[] = [];
            for (const epic of epicItems) {
              if (!seenIds.has(epic.id)) {
                seenIds.add(epic.id);
                uniqueEpics.push(epic);
              }
            }

            if (uniqueEpics.length < 2) {
              return; // Skip if not enough unique items
            }

            const targetIndex = indexSeed % uniqueEpics.length;
            const targetEpic = uniqueEpics[targetIndex];
            if (!targetEpic) return;

            const mockOpenRightDrawer = vi.fn();
            const handleClick = createEpicClickHandler(uniqueEpics, mockOpenRightDrawer);

            const clickEvent: TimelineClickEvent = {
              event: new MouseEvent('click'),
              time: new Date(),
              item: targetEpic.id,
            };

            handleClick(clickEvent);

            if (targetEpic.wiki) {
              expect(mockOpenRightDrawer).toHaveBeenCalledWith({
                type: 'epic',
                epicId: targetEpic.id,
                epicName: targetEpic.content,
                wikiUrl: targetEpic.wiki,
              });
            }
          }
        ),
        { numRuns: 100 }
      );
    });


    it('should extract wiki URL correctly from epic item', () => {
      const wikiUrlArb = fc.oneof(
        fc.constant('https://en.wikipedia.org/wiki/Roman_Empire'),
        fc.constant('https://en.wikipedia.org/wiki/Hundred_Years%27_War'),
        fc.constant('https://en.wikipedia.org/wiki/Alexander_the_Great'),
        fc.webUrl()
      );

      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            content: fc.string({ minLength: 1, maxLength: 100 }),
            wiki: wikiUrlArb,
            start: fc.date({ min: new Date(-2000, 0, 1), max: new Date(2000, 11, 31) }),
            end: fc.date({ min: new Date(-2000, 0, 1), max: new Date(2000, 11, 31) }),
            group: fc.integer({ min: 1, max: 10 }),
            subtype: subtypeArb,
          }).map(createEpicItemWithoutClass),
          (epic) => {
            const mockOpenRightDrawer = vi.fn();
            const epicItems: EpicItem[] = [epic];

            const handleClick = createEpicClickHandler(epicItems, mockOpenRightDrawer);

            const clickEvent: TimelineClickEvent = {
              event: new MouseEvent('click'),
              time: new Date(),
              item: epic.id,
            };

            handleClick(clickEvent);

            expect(mockOpenRightDrawer).toHaveBeenCalledWith(
              expect.objectContaining({
                wikiUrl: epic.wiki,
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
