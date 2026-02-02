/**
 * VisTimelineWrapper Component Unit Tests
 *
 * Tests for the vis.js Timeline wrapper component.
 * Note: vis-timeline is a DOM-based library that's difficult to fully test in jsdom.
 * These tests focus on:
 * - Component renders with correct data-testid
 * - Props are accepted without errors
 * - Ref methods are exposed correctly
 *
 * Requirements: 5.1, 10.1
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { createRef } from 'react';

// Mock vis-timeline and vis-data since they require DOM APIs not available in jsdom
vi.mock('vis-timeline', () => {
  const mockTimeline = vi.fn().mockImplementation(() => ({
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
  }));

  return {
    Timeline: mockTimeline,
  };
});

vi.mock('vis-data', () => {
  const mockDataSet = vi.fn().mockImplementation(() => ({
    clear: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    update: vi.fn(),
    get: vi.fn().mockReturnValue([]),
  }));

  return {
    DataSet: mockDataSet,
  };
});

// Mock CSS imports
vi.mock('vis-timeline/styles/vis-timeline-graph2d.css', () => ({}));

// Import after mocks are set up
import {
  VisTimelineWrapper,
  type VisTimelineWrapperProps,
  type VisTimelineRef,
  type TimelineOptions,
  type TimelineItem,
  type TimelineGroup,
} from './VisTimelineWrapper';

describe('VisTimelineWrapper Component', () => {
  const defaultOptions: TimelineOptions = {
    width: '100%',
    height: 120,
    stack: false,
    showCurrentTime: false,
  };

  const defaultProps: VisTimelineWrapperProps = {
    options: defaultOptions,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Rendering', () => {
    it('renders with data-testid="vis-timeline"', () => {
      render(<VisTimelineWrapper {...defaultProps} />);

      const timeline = screen.getByTestId('vis-timeline');
      expect(timeline).toBeInTheDocument();
    });

    it('renders a div element as container', () => {
      render(<VisTimelineWrapper {...defaultProps} />);

      const timeline = screen.getByTestId('vis-timeline');
      expect(timeline.tagName).toBe('DIV');
    });

    it('applies custom className when provided', () => {
      render(<VisTimelineWrapper {...defaultProps} className="custom-timeline" />);

      const timeline = screen.getByTestId('vis-timeline');
      expect(timeline.className).toContain('custom-timeline');
    });

    it('renders without custom className when not provided', () => {
      render(<VisTimelineWrapper {...defaultProps} />);

      const timeline = screen.getByTestId('vis-timeline');
      expect(timeline.className).not.toContain('undefined');
    });
  });

  describe('Props Handling - Options', () => {
    it('accepts options prop without error', () => {
      const options: TimelineOptions = {
        width: '100%',
        height: 200,
        zoomMin: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        stack: true,
        showCurrentTime: false,
      };

      expect(() => render(<VisTimelineWrapper options={options} />)).not.toThrow();
    });

    it('accepts minimal options without error', () => {
      const options: TimelineOptions = {};

      expect(() => render(<VisTimelineWrapper options={options} />)).not.toThrow();
    });

    it('accepts options with all properties without error', () => {
      const options: TimelineOptions = {
        width: '100%',
        height: 400,
        zoomMin: 1000 * 60 * 60 * 24 * 365,
        zoomMax: 1000 * 60 * 60 * 24 * 365 * 100,
        min: '0000-01-01',
        max: '2500-12-31',
        start: '1000-01-01',
        end: '1100-01-01',
        stack: true,
        showCurrentTime: false,
        editable: false,
        showMajorLabels: true,
        showMinorLabels: true,
        horizontalScroll: true,
        zoomable: true,
        moveable: true,
      };

      expect(() => render(<VisTimelineWrapper options={options} />)).not.toThrow();
    });
  });

  describe('Props Handling - Items', () => {
    it('accepts empty items array without error', () => {
      expect(() =>
        render(<VisTimelineWrapper {...defaultProps} items={[]} />)
      ).not.toThrow();
    });

    it('accepts items array with single item without error', () => {
      const items: TimelineItem[] = [
        {
          id: '1',
          content: 'Test Event',
          start: new Date(1000, 0, 1),
        },
      ];

      expect(() =>
        render(<VisTimelineWrapper {...defaultProps} items={items} />)
      ).not.toThrow();
    });

    it('accepts items array with multiple items without error', () => {
      const items: TimelineItem[] = [
        {
          id: '1',
          content: 'Event 1',
          start: new Date(1000, 0, 1),
          end: new Date(1100, 0, 1),
          type: 'range',
        },
        {
          id: '2',
          content: 'Event 2',
          start: new Date(1200, 0, 1),
          type: 'point',
        },
        {
          id: '3',
          content: 'Event 3',
          start: new Date(1300, 0, 1),
          end: new Date(1400, 0, 1),
          group: 1,
          className: 'custom-item',
        },
      ];

      expect(() =>
        render(<VisTimelineWrapper {...defaultProps} items={items} />)
      ).not.toThrow();
    });

    it('accepts items with string dates without error', () => {
      const items: TimelineItem[] = [
        {
          id: '1',
          content: 'String Date Event',
          start: '1000-01-01',
          end: '1100-12-31',
        },
      ];

      expect(() =>
        render(<VisTimelineWrapper {...defaultProps} items={items} />)
      ).not.toThrow();
    });
  });

  describe('Epic Item Styling (Requirements 10.1, 10.7, 10.8)', () => {
    it('accepts epic items with range type without error', () => {
      const items: TimelineItem[] = [
        {
          id: 'epic-1',
          content: 'Roman Empire',
          start: new Date(-27, 0, 1),
          end: new Date(476, 0, 1),
          type: 'range',
        },
        {
          id: 'epic-2',
          content: 'Byzantine Empire',
          start: new Date(330, 0, 1),
          end: new Date(1453, 0, 1),
          type: 'range',
        },
      ];

      expect(() =>
        render(<VisTimelineWrapper {...defaultProps} items={items} />)
      ).not.toThrow();
    });

    it('accepts epic items with custom className without error', () => {
      const items: TimelineItem[] = [
        {
          id: 'epic-1',
          content: 'Test Epic',
          start: new Date(1000, 0, 1),
          end: new Date(1100, 0, 1),
          className: 'custom-epic-class',
        },
      ];

      expect(() =>
        render(<VisTimelineWrapper {...defaultProps} items={items} />)
      ).not.toThrow();
    });

    it('accepts epic items with title for tooltip without error', () => {
      const items: TimelineItem[] = [
        {
          id: 'epic-1',
          content: 'Short Name',
          title: 'This is a longer description for the tooltip',
          start: new Date(1000, 0, 1),
          end: new Date(1100, 0, 1),
        },
      ];

      expect(() =>
        render(<VisTimelineWrapper {...defaultProps} items={items} />)
      ).not.toThrow();
    });

    it('accepts epic items with group assignment without error', () => {
      const items: TimelineItem[] = [
        {
          id: 'epic-1',
          content: 'Group 1 Epic',
          start: new Date(1000, 0, 1),
          end: new Date(1100, 0, 1),
          group: 1,
        },
        {
          id: 'epic-2',
          content: 'Group 2 Epic',
          start: new Date(1050, 0, 1),
          end: new Date(1150, 0, 1),
          group: 2,
        },
      ];

      const groups: TimelineGroup[] = [
        { id: 1, content: 'Political' },
        { id: 2, content: 'Cultural' },
      ];

      expect(() =>
        render(<VisTimelineWrapper {...defaultProps} items={items} groups={groups} />)
      ).not.toThrow();
    });

    it('handles items without end date as point items', () => {
      const items: TimelineItem[] = [
        {
          id: 'point-1',
          content: 'Single Event',
          start: new Date(1066, 0, 1),
          // No end date - should be treated as point
        },
      ];

      expect(() =>
        render(<VisTimelineWrapper {...defaultProps} items={items} />)
      ).not.toThrow();
    });

    it('handles mixed range and point items without error', () => {
      const items: TimelineItem[] = [
        {
          id: 'range-1',
          content: 'Range Event',
          start: new Date(1000, 0, 1),
          end: new Date(1100, 0, 1),
          type: 'range',
        },
        {
          id: 'point-1',
          content: 'Point Event',
          start: new Date(1050, 0, 1),
          type: 'point',
        },
      ];

      expect(() =>
        render(<VisTimelineWrapper {...defaultProps} items={items} />)
      ).not.toThrow();
    });
  });

  describe('Props Handling - Groups', () => {
    it('accepts empty groups array without error', () => {
      expect(() =>
        render(<VisTimelineWrapper {...defaultProps} groups={[]} />)
      ).not.toThrow();
    });

    it('accepts groups array with items without error', () => {
      const groups: TimelineGroup[] = [
        { id: 1, content: 'Group 1' },
        { id: 2, content: 'Group 2' },
        { id: 3, content: 'Group 3' },
      ];

      expect(() =>
        render(<VisTimelineWrapper {...defaultProps} groups={groups} />)
      ).not.toThrow();
    });
  });

  describe('Props Handling - Custom Times', () => {
    it('accepts empty customTimes object without error', () => {
      expect(() =>
        render(<VisTimelineWrapper {...defaultProps} customTimes={{}} />)
      ).not.toThrow();
    });

    it('accepts customTimes with string dates without error', () => {
      const customTimes = {
        marker1: '1000-01-01',
        marker2: '1500-06-15',
      };

      expect(() =>
        render(<VisTimelineWrapper {...defaultProps} customTimes={customTimes} />)
      ).not.toThrow();
    });

    it('accepts customTimes with Date objects without error', () => {
      const customTimes = {
        marker1: new Date(1000, 0, 1),
        marker2: new Date(1500, 5, 15),
      };

      expect(() =>
        render(<VisTimelineWrapper {...defaultProps} customTimes={customTimes} />)
      ).not.toThrow();
    });
  });

  describe('Props Handling - Event Handlers', () => {
    it('accepts onTimelineClick callback without error', () => {
      const onTimelineClick = vi.fn();

      expect(() =>
        render(<VisTimelineWrapper {...defaultProps} onTimelineClick={onTimelineClick} />)
      ).not.toThrow();
    });

    it('accepts onRangeChange callback without error', () => {
      const onRangeChange = vi.fn();

      expect(() =>
        render(<VisTimelineWrapper {...defaultProps} onRangeChange={onRangeChange} />)
      ).not.toThrow();
    });

    it('accepts onRangeChanged callback without error', () => {
      const onRangeChanged = vi.fn();

      expect(() =>
        render(<VisTimelineWrapper {...defaultProps} onRangeChanged={onRangeChanged} />)
      ).not.toThrow();
    });

    it('accepts onMouseMove callback without error', () => {
      const onMouseMove = vi.fn();

      expect(() =>
        render(<VisTimelineWrapper {...defaultProps} onMouseMove={onMouseMove} />)
      ).not.toThrow();
    });

    it('accepts all event handlers together without error', () => {
      const handlers = {
        onTimelineClick: vi.fn(),
        onRangeChange: vi.fn(),
        onRangeChanged: vi.fn(),
        onMouseMove: vi.fn(),
      };

      expect(() =>
        render(<VisTimelineWrapper {...defaultProps} {...handlers} />)
      ).not.toThrow();
    });

    it('accepts onClick callback for item clicks without error (Requirement 10.8)', () => {
      const onClick = vi.fn();

      expect(() =>
        render(<VisTimelineWrapper {...defaultProps} onClick={onClick} />)
      ).not.toThrow();
    });

    it('accepts onClick with items without error (Requirement 10.8)', () => {
      const onClick = vi.fn();
      const items: TimelineItem[] = [
        {
          id: 'epic-1',
          content: 'Roman Empire',
          start: new Date(-27, 0, 1),
          end: new Date(476, 0, 1),
          type: 'range',
        },
      ];

      expect(() =>
        render(<VisTimelineWrapper {...defaultProps} items={items} onClick={onClick} />)
      ).not.toThrow();
    });
  });

  describe('Props Handling - All Props Combined', () => {
    it('accepts all props together without error', () => {
      const items: TimelineItem[] = [
        {
          id: '1',
          content: 'Test Epic',
          start: new Date(1000, 0, 1),
          end: new Date(1100, 0, 1),
          group: 1,
          type: 'range',
        },
      ];

      const groups: TimelineGroup[] = [{ id: 1, content: 'Events' }];

      const customTimes = {
        currentYear: new Date(1050, 0, 1),
      };

      const fullProps: VisTimelineWrapperProps = {
        options: {
          width: '100%',
          height: 400,
          stack: true,
          showCurrentTime: false,
          zoomMin: 1000 * 60 * 60 * 24 * 365 * 10,
        },
        items,
        groups,
        customTimes,
        onTimelineClick: vi.fn(),
        onRangeChange: vi.fn(),
        onRangeChanged: vi.fn(),
        onMouseMove: vi.fn(),
        className: 'full-timeline',
      };

      expect(() => render(<VisTimelineWrapper {...fullProps} />)).not.toThrow();
    });
  });

  describe('Ref Methods', () => {
    it('exposes setWindow method via ref', () => {
      const ref = createRef<VisTimelineRef>();

      render(<VisTimelineWrapper {...defaultProps} ref={ref} />);

      expect(ref.current).not.toBeNull();
      expect(typeof ref.current?.setWindow).toBe('function');
    });

    it('exposes setSelection method via ref', () => {
      const ref = createRef<VisTimelineRef>();

      render(<VisTimelineWrapper {...defaultProps} ref={ref} />);

      expect(ref.current).not.toBeNull();
      expect(typeof ref.current?.setSelection).toBe('function');
    });

    it('exposes getWindow method via ref', () => {
      const ref = createRef<VisTimelineRef>();

      render(<VisTimelineWrapper {...defaultProps} ref={ref} />);

      expect(ref.current).not.toBeNull();
      expect(typeof ref.current?.getWindow).toBe('function');
    });

    it('exposes fit method via ref', () => {
      const ref = createRef<VisTimelineRef>();

      render(<VisTimelineWrapper {...defaultProps} ref={ref} />);

      expect(ref.current).not.toBeNull();
      expect(typeof ref.current?.fit).toBe('function');
    });

    it('exposes moveTo method via ref', () => {
      const ref = createRef<VisTimelineRef>();

      render(<VisTimelineWrapper {...defaultProps} ref={ref} />);

      expect(ref.current).not.toBeNull();
      expect(typeof ref.current?.moveTo).toBe('function');
    });

    it('exposes zoomIn method via ref', () => {
      const ref = createRef<VisTimelineRef>();

      render(<VisTimelineWrapper {...defaultProps} ref={ref} />);

      expect(ref.current).not.toBeNull();
      expect(typeof ref.current?.zoomIn).toBe('function');
    });

    it('exposes zoomOut method via ref', () => {
      const ref = createRef<VisTimelineRef>();

      render(<VisTimelineWrapper {...defaultProps} ref={ref} />);

      expect(ref.current).not.toBeNull();
      expect(typeof ref.current?.zoomOut).toBe('function');
    });

    it('ref methods can be called without error', () => {
      const ref = createRef<VisTimelineRef>();

      render(<VisTimelineWrapper {...defaultProps} ref={ref} />);

      expect(() => {
        ref.current?.setWindow(new Date(1000, 0, 1), new Date(1100, 0, 1));
      }).not.toThrow();

      expect(() => {
        ref.current?.setSelection(['1', '2']);
      }).not.toThrow();

      expect(() => {
        ref.current?.getWindow();
      }).not.toThrow();

      expect(() => {
        ref.current?.fit();
      }).not.toThrow();

      expect(() => {
        ref.current?.moveTo(new Date(1050, 0, 1));
      }).not.toThrow();

      expect(() => {
        ref.current?.zoomIn(0.5);
      }).not.toThrow();

      expect(() => {
        ref.current?.zoomOut(0.5);
      }).not.toThrow();
    });

    it('getWindow returns an object with start and end dates', () => {
      const ref = createRef<VisTimelineRef>();

      render(<VisTimelineWrapper {...defaultProps} ref={ref} />);

      const window = ref.current?.getWindow();
      expect(window).toBeDefined();
      expect(window).toHaveProperty('start');
      expect(window).toHaveProperty('end');
    });
  });

  describe('Component Lifecycle', () => {
    it('renders and unmounts without error', () => {
      const { unmount } = render(<VisTimelineWrapper {...defaultProps} />);

      expect(screen.getByTestId('vis-timeline')).toBeInTheDocument();

      expect(() => unmount()).not.toThrow();
    });

    it('handles multiple renders without error', () => {
      const { rerender } = render(<VisTimelineWrapper {...defaultProps} />);

      expect(() => {
        rerender(<VisTimelineWrapper {...defaultProps} />);
        rerender(<VisTimelineWrapper {...defaultProps} />);
        rerender(<VisTimelineWrapper {...defaultProps} />);
      }).not.toThrow();
    });

    it('handles prop changes without error', () => {
      const { rerender } = render(<VisTimelineWrapper {...defaultProps} />);

      // Change items
      const newItems: TimelineItem[] = [
        { id: '1', content: 'New Item', start: new Date() },
      ];
      expect(() => {
        rerender(<VisTimelineWrapper {...defaultProps} items={newItems} />);
      }).not.toThrow();

      // Change options
      const newOptions: TimelineOptions = { ...defaultOptions, height: 300 };
      expect(() => {
        rerender(<VisTimelineWrapper options={newOptions} items={newItems} />);
      }).not.toThrow();

      // Change className
      expect(() => {
        rerender(
          <VisTimelineWrapper
            options={newOptions}
            items={newItems}
            className="updated-class"
          />
        );
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('handles omitted optional props gracefully', () => {
      // Only pass required props, omit all optional ones
      expect(() =>
        render(<VisTimelineWrapper options={defaultOptions} />)
      ).not.toThrow();
    });

    it('handles empty string className', () => {
      render(<VisTimelineWrapper {...defaultProps} className="" />);

      const timeline = screen.getByTestId('vis-timeline');
      expect(timeline).toBeInTheDocument();
    });

    it('handles items with minimal required properties', () => {
      const items: TimelineItem[] = [
        { id: 'min1', content: '', start: new Date() },
      ];

      expect(() =>
        render(<VisTimelineWrapper {...defaultProps} items={items} />)
      ).not.toThrow();
    });

    it('handles large number of items without error', () => {
      const items: TimelineItem[] = Array.from({ length: 100 }, (_, i) => ({
        id: String(i),
        content: `Item ${String(i)}`,
        start: new Date(1000 + i, 0, 1),
      }));

      expect(() =>
        render(<VisTimelineWrapper {...defaultProps} items={items} />)
      ).not.toThrow();
    });

    it('handles options with zero height', () => {
      const options: TimelineOptions = { ...defaultOptions, height: 0 };

      expect(() => render(<VisTimelineWrapper options={options} />)).not.toThrow();
    });
  });
});
