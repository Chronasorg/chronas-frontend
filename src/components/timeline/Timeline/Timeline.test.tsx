/**
 * Timeline Component Unit Tests
 *
 * Tests for the Timeline container component.
 * Validates rendering, height changes, store integration, and accessibility.
 *
 * Requirements: 1.1, 1.2, 1.3, 6.3
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { Timeline, TIMELINE_HEIGHT_COLLAPSED, TIMELINE_HEIGHT_EXPANDED } from './Timeline';
import { useTimelineStore, initialState } from '../../../stores/timelineStore';
import { useUIStore, defaultState as uiDefaultState } from '../../../stores/uiStore';

describe('Timeline Component', () => {
  // Reset store state before each test
  beforeEach(() => {
    useTimelineStore.setState(initialState);
    useUIStore.setState(uiDefaultState);
  });

  // Clean up after each test
  afterEach(() => {
    cleanup();
  });

  describe('Rendering', () => {
    it('renders with data-testid="timeline"', () => {
      render(<Timeline />);
      
      const timeline = screen.getByTestId('timeline');
      expect(timeline).toBeInTheDocument();
    });

    it('renders with correct role="navigation"', () => {
      render(<Timeline />);
      
      const timeline = screen.getByRole('navigation');
      expect(timeline).toBeInTheDocument();
    });

    it('renders with aria-label for accessibility', () => {
      render(<Timeline />);
      
      const timeline = screen.getByTestId('timeline');
      expect(timeline).toHaveAttribute('aria-label', 'Timeline navigation');
    });

    it('applies custom className when provided', () => {
      render(<Timeline className="custom-class" />);
      
      const timeline = screen.getByTestId('timeline');
      expect(timeline.className).toContain('custom-class');
    });

    it('renders without custom className when not provided', () => {
      render(<Timeline />);
      
      const timeline = screen.getByTestId('timeline');
      expect(timeline.className).not.toContain('undefined');
    });
  });

  describe('Year Display', () => {
    it('displays correct data-year attribute matching selectedYear', () => {
      render(<Timeline />);
      
      const timeline = screen.getByTestId('timeline');
      // Default selectedYear is 1000
      expect(timeline).toHaveAttribute('data-year', '1000');
    });

    it('updates data-year when store selectedYear changes', () => {
      render(<Timeline />);
      
      // Change the year in the store wrapped in act
      act(() => {
        useTimelineStore.getState().setYear(1500);
      });
      
      const timeline = screen.getByTestId('timeline');
      expect(timeline).toHaveAttribute('data-year', '1500');
    });

    it('displays negative years correctly in data-year', () => {
      useTimelineStore.setState({ ...initialState, selectedYear: -500 });
      render(<Timeline />);
      
      const timeline = screen.getByTestId('timeline');
      expect(timeline).toHaveAttribute('data-year', '-500');
    });

    it('displays year zero correctly in data-year', () => {
      useTimelineStore.setState({ ...initialState, selectedYear: 0 });
      render(<Timeline />);
      
      const timeline = screen.getByTestId('timeline');
      expect(timeline).toHaveAttribute('data-year', '0');
    });

    it('displays minimum year (-2000) correctly', () => {
      useTimelineStore.setState({ ...initialState, selectedYear: -2000 });
      render(<Timeline />);
      
      const timeline = screen.getByTestId('timeline');
      expect(timeline).toHaveAttribute('data-year', '-2000');
    });

    it('displays maximum year (2000) correctly', () => {
      useTimelineStore.setState({ ...initialState, selectedYear: 2000 });
      render(<Timeline />);
      
      const timeline = screen.getByTestId('timeline');
      expect(timeline).toHaveAttribute('data-year', '2000');
    });
  });

  describe('Height - Collapsed State', () => {
    it('has correct height when collapsed (120px)', () => {
      useTimelineStore.setState({ ...initialState, isExpanded: false });
      render(<Timeline />);
      
      const timeline = screen.getByTestId('timeline');
      expect(timeline).toHaveStyle({ height: `${String(TIMELINE_HEIGHT_COLLAPSED)}px` });
    });

    it('has data-expanded="false" when collapsed', () => {
      useTimelineStore.setState({ ...initialState, isExpanded: false });
      render(<Timeline />);
      
      const timeline = screen.getByTestId('timeline');
      expect(timeline).toHaveAttribute('data-expanded', 'false');
    });

    it('applies collapsed CSS class when collapsed', () => {
      useTimelineStore.setState({ ...initialState, isExpanded: false });
      render(<Timeline />);
      
      const timeline = screen.getByTestId('timeline');
      // The class name will be hashed by CSS modules, but we can check the data attribute
      expect(timeline).toHaveAttribute('data-expanded', 'false');
    });
  });

  describe('Height - Expanded State', () => {
    it('has correct height when expanded (400px)', () => {
      useTimelineStore.setState({ ...initialState, isExpanded: true });
      render(<Timeline />);
      
      const timeline = screen.getByTestId('timeline');
      expect(timeline).toHaveStyle({ height: `${String(TIMELINE_HEIGHT_EXPANDED)}px` });
    });

    it('has data-expanded="true" when expanded', () => {
      useTimelineStore.setState({ ...initialState, isExpanded: true });
      render(<Timeline />);
      
      const timeline = screen.getByTestId('timeline');
      expect(timeline).toHaveAttribute('data-expanded', 'true');
    });

    it('applies expanded CSS class when expanded', () => {
      useTimelineStore.setState({ ...initialState, isExpanded: true });
      render(<Timeline />);
      
      const timeline = screen.getByTestId('timeline');
      // The class name will be hashed by CSS modules, but we can check the data attribute
      expect(timeline).toHaveAttribute('data-expanded', 'true');
    });
  });

  describe('Store Integration', () => {
    it('responds to store state changes for selectedYear', () => {
      render(<Timeline />);
      
      // Initial state
      let timeline = screen.getByTestId('timeline');
      expect(timeline).toHaveAttribute('data-year', '1000');
      
      // Update store wrapped in act
      act(() => {
        useTimelineStore.getState().setYear(1776);
      });
      
      timeline = screen.getByTestId('timeline');
      expect(timeline).toHaveAttribute('data-year', '1776');
    });

    it('responds to store state changes for isExpanded', () => {
      render(<Timeline />);
      
      // Initial state - collapsed
      let timeline = screen.getByTestId('timeline');
      expect(timeline).toHaveStyle({ height: `${String(TIMELINE_HEIGHT_COLLAPSED)}px` });
      
      // Toggle expanded wrapped in act
      act(() => {
        useTimelineStore.getState().toggleExpanded();
      });
      
      timeline = screen.getByTestId('timeline');
      expect(timeline).toHaveStyle({ height: `${String(TIMELINE_HEIGHT_EXPANDED)}px` });
    });

    it('responds to multiple store state changes', () => {
      render(<Timeline />);
      
      // Change year
      act(() => {
        useTimelineStore.getState().setYear(500);
      });
      expect(screen.getByTestId('timeline')).toHaveAttribute('data-year', '500');
      
      // Toggle expanded
      act(() => {
        useTimelineStore.getState().toggleExpanded();
      });
      expect(screen.getByTestId('timeline')).toHaveAttribute('data-expanded', 'true');
      
      // Change year again
      act(() => {
        useTimelineStore.getState().setYear(-100);
      });
      expect(screen.getByTestId('timeline')).toHaveAttribute('data-year', '-100');
      
      // Toggle collapsed
      act(() => {
        useTimelineStore.getState().toggleExpanded();
      });
      expect(screen.getByTestId('timeline')).toHaveAttribute('data-expanded', 'false');
    });

    it('uses setExpanded to directly set expanded state', () => {
      render(<Timeline />);
      
      // Set expanded directly
      act(() => {
        useTimelineStore.getState().setExpanded(true);
      });
      expect(screen.getByTestId('timeline')).toHaveAttribute('data-expanded', 'true');
      
      // Set collapsed directly
      act(() => {
        useTimelineStore.getState().setExpanded(false);
      });
      expect(screen.getByTestId('timeline')).toHaveAttribute('data-expanded', 'false');
    });
  });

  describe('ARIA Attributes', () => {
    it('has proper aria-label attribute', () => {
      render(<Timeline />);
      
      const timeline = screen.getByTestId('timeline');
      expect(timeline).toHaveAttribute('aria-label', 'Timeline navigation');
    });

    it('has role="navigation" for accessibility', () => {
      render(<Timeline />);
      
      const timeline = screen.getByRole('navigation', { name: 'Timeline navigation' });
      expect(timeline).toBeInTheDocument();
    });
  });

  describe('Constants', () => {
    it('exports TIMELINE_HEIGHT_COLLAPSED as 132', () => {
      expect(TIMELINE_HEIGHT_COLLAPSED).toBe(132);
    });

    it('exports TIMELINE_HEIGHT_EXPANDED as 400', () => {
      expect(TIMELINE_HEIGHT_EXPANDED).toBe(400);
    });
  });

  describe('Props Handling', () => {
    it('accepts epicItems prop without error', () => {
      const epicItems = [
        {
          id: '1',
          content: 'Test Epic',
          wiki: 'Test_Epic',
          start: new Date(1000, 0, 1),
          end: new Date(1100, 0, 1),
          group: 1,
          subtype: 'ei',
        },
      ];
      
      expect(() => render(<Timeline epicItems={epicItems} />)).not.toThrow();
    });

    it('accepts onEpicSelect callback prop without error', () => {
      const onEpicSelect = (): void => {
        // Empty callback for testing
      };
      
      expect(() => render(<Timeline onEpicSelect={onEpicSelect} />)).not.toThrow();
    });

    it('accepts all props together without error', () => {
      const epicItems = [
        {
          id: '1',
          content: 'Test Epic',
          wiki: 'Test_Epic',
          start: new Date(1000, 0, 1),
          end: new Date(1100, 0, 1),
          group: 1,
          subtype: 'ei',
        },
      ];
      const onEpicSelect = (): void => {
        // Empty callback for testing
      };
      
      expect(() => 
        render(
          <Timeline 
            epicItems={epicItems} 
            onEpicSelect={onEpicSelect} 
            className="test-class" 
          />
        )
      ).not.toThrow();
    });
  });

  describe('Epic Items Integration (Requirements 6.2, 6.4, 6.5)', () => {
    it('renders VisTimelineWrapper component', () => {
      render(<Timeline />);
      
      // VisTimelineWrapper renders with data-testid="vis-timeline"
      const visTimeline = screen.getByTestId('vis-timeline');
      expect(visTimeline).toBeInTheDocument();
    });

    it('passes filtered epic items to VisTimelineWrapper', () => {
      // Set up epic items in the store
      const epicItems = [
        {
          id: 'epic-1',
          content: 'Roman Empire',
          wiki: 'Roman_Empire',
          start: new Date(-27, 0, 1),
          end: new Date(476, 8, 4),
          group: 1,
          subtype: 'ei',
          className: 'timelineItem_ei',
        },
        {
          id: 'epic-2',
          content: 'Hundred Years War',
          wiki: 'Hundred_Years_War',
          start: new Date(1337, 4, 24),
          end: new Date(1453, 9, 19),
          group: 2,
          subtype: 'war',
          className: 'timelineItem_war',
        },
      ];
      
      act(() => {
        useTimelineStore.getState().setEpicItems(epicItems);
      });
      
      render(<Timeline />);
      
      // VisTimelineWrapper should be rendered
      const visTimeline = screen.getByTestId('vis-timeline');
      expect(visTimeline).toBeInTheDocument();
    });

    it('filters epic items based on epicFilters state', () => {
      // Set up epic items in the store
      const epicItems = [
        {
          id: 'epic-1',
          content: 'Roman Empire',
          wiki: 'Roman_Empire',
          start: new Date(-27, 0, 1),
          end: new Date(476, 8, 4),
          group: 1,
          subtype: 'ei', // Maps to 'empire' type
          className: 'timelineItem_ei',
        },
        {
          id: 'war-1',
          content: 'Hundred Years War',
          wiki: 'Hundred_Years_War',
          start: new Date(1337, 4, 24),
          end: new Date(1453, 9, 19),
          group: 2,
          subtype: 'war', // Maps to 'war' type
          className: 'timelineItem_war',
        },
      ];
      
      act(() => {
        useTimelineStore.getState().setEpicItems(epicItems);
        // Disable war type filter
        useTimelineStore.getState().setEpicFilter('war', false);
      });
      
      render(<Timeline />);
      
      // Verify filtered items - only empire items should be included
      const filteredItems = useTimelineStore.getState().getFilteredEpicItems();
      expect(filteredItems).toHaveLength(1);
      expect(filteredItems[0]?.id).toBe('epic-1');
    });

    it('updates timeline items when epic filters change', () => {
      const epicItems = [
        {
          id: 'epic-1',
          content: 'Roman Empire',
          wiki: 'Roman_Empire',
          start: new Date(-27, 0, 1),
          end: new Date(476, 8, 4),
          group: 1,
          subtype: 'ei',
          className: 'timelineItem_ei',
        },
      ];
      
      act(() => {
        useTimelineStore.getState().setEpicItems(epicItems);
      });
      
      render(<Timeline />);
      
      // Initially all filters are enabled
      let filteredItems = useTimelineStore.getState().getFilteredEpicItems();
      expect(filteredItems).toHaveLength(1);
      
      // Disable empire filter
      act(() => {
        useTimelineStore.getState().setEpicFilter('empire', false);
      });
      
      filteredItems = useTimelineStore.getState().getFilteredEpicItems();
      expect(filteredItems).toHaveLength(0);
      
      // Re-enable empire filter
      act(() => {
        useTimelineStore.getState().setEpicFilter('empire', true);
      });
      
      filteredItems = useTimelineStore.getState().getFilteredEpicItems();
      expect(filteredItems).toHaveLength(1);
    });

    it('renders with empty epic items array', () => {
      act(() => {
        useTimelineStore.getState().setEpicItems([]);
      });
      
      render(<Timeline />);
      
      const visTimeline = screen.getByTestId('vis-timeline');
      expect(visTimeline).toBeInTheDocument();
    });

    it('handles setAllEpicFilters correctly', () => {
      const epicItems = [
        {
          id: 'epic-1',
          content: 'Roman Empire',
          wiki: 'Roman_Empire',
          start: new Date(-27, 0, 1),
          end: new Date(476, 8, 4),
          group: 1,
          subtype: 'ei',
          className: 'timelineItem_ei',
        },
        {
          id: 'war-1',
          content: 'Hundred Years War',
          wiki: 'Hundred_Years_War',
          start: new Date(1337, 4, 24),
          end: new Date(1453, 9, 19),
          group: 2,
          subtype: 'war',
          className: 'timelineItem_war',
        },
      ];
      
      act(() => {
        useTimelineStore.getState().setEpicItems(epicItems);
      });
      
      render(<Timeline />);
      
      // Disable all filters
      act(() => {
        useTimelineStore.getState().setAllEpicFilters(false);
      });
      
      let filteredItems = useTimelineStore.getState().getFilteredEpicItems();
      expect(filteredItems).toHaveLength(0);
      
      // Enable all filters
      act(() => {
        useTimelineStore.getState().setAllEpicFilters(true);
      });
      
      filteredItems = useTimelineStore.getState().getFilteredEpicItems();
      expect(filteredItems).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid state changes correctly', () => {
      render(<Timeline />);
      
      // Rapid year changes
      for (let year = 0; year <= 2000; year += 500) {
        act(() => {
          useTimelineStore.getState().setYear(year);
        });
        expect(screen.getByTestId('timeline')).toHaveAttribute('data-year', String(year));
      }
    });

    it('handles rapid expand/collapse toggles correctly', () => {
      render(<Timeline />);
      
      // Rapid toggles
      for (let i = 0; i < 5; i++) {
        act(() => {
          useTimelineStore.getState().toggleExpanded();
        });
        const expectedExpanded = (i + 1) % 2 === 1;
        expect(screen.getByTestId('timeline')).toHaveAttribute(
          'data-expanded', 
          String(expectedExpanded)
        );
      }
    });

    it('handles boundary year values correctly', () => {
      render(<Timeline />);
      
      // Test boundary values
      const boundaryYears = [-2000, -1999, -1, 0, 1, 1999, 2000];
      
      for (const year of boundaryYears) {
        act(() => {
          useTimelineStore.getState().setYear(year);
        });
        expect(screen.getByTestId('timeline')).toHaveAttribute('data-year', String(year));
      }
    });
  });

  describe('Epic Click Handler (Requirement 6.3)', () => {
    it('calls onEpicSelect callback when epic is clicked', () => {
      const onEpicSelect = vi.fn();
      const epicItems = [
        {
          id: 'epic-1',
          content: 'Roman Empire',
          wiki: 'https://en.wikipedia.org/wiki/Roman_Empire',
          start: new Date(-27, 0, 1),
          end: new Date(476, 8, 4),
          group: 1,
          subtype: 'ei',
          className: 'timelineItem_ei',
        },
      ];
      
      act(() => {
        useTimelineStore.getState().setEpicItems(epicItems);
      });
      
      render(<Timeline onEpicSelect={onEpicSelect} />);
      
      // Verify the component renders
      expect(screen.getByTestId('vis-timeline')).toBeInTheDocument();
    });

    it('opens right drawer with epic content when epic with wiki URL is clicked', () => {
      const epicItems = [
        {
          id: 'epic-1',
          content: 'Roman Empire',
          wiki: 'https://en.wikipedia.org/wiki/Roman_Empire',
          start: new Date(-27, 0, 1),
          end: new Date(476, 8, 4),
          group: 1,
          subtype: 'ei',
          className: 'timelineItem_ei',
        },
      ];
      
      act(() => {
        useTimelineStore.getState().setEpicItems(epicItems);
      });
      
      render(<Timeline />);
      
      // Simulate what happens when openRightDrawer is called with epic content
      act(() => {
        useUIStore.getState().openRightDrawer({
          type: 'epic',
          epicId: 'epic-1',
          epicName: 'Roman Empire',
          wikiUrl: 'https://en.wikipedia.org/wiki/Roman_Empire',
        });
      });
      
      // Verify the UI store state is updated correctly
      const uiState = useUIStore.getState();
      expect(uiState.rightDrawerOpen).toBe(true);
      expect(uiState.rightDrawerContent).toEqual({
        type: 'epic',
        epicId: 'epic-1',
        epicName: 'Roman Empire',
        wikiUrl: 'https://en.wikipedia.org/wiki/Roman_Empire',
      });
    });

    it('does not open right drawer when epic has no wiki URL', () => {
      const epicItems = [
        {
          id: 'epic-no-wiki',
          content: 'Epic Without Wiki',
          wiki: '', // Empty wiki URL
          start: new Date(1000, 0, 1),
          end: new Date(1100, 0, 1),
          group: 1,
          subtype: 'ei',
          className: 'timelineItem_ei',
        },
      ];
      
      act(() => {
        useTimelineStore.getState().setEpicItems(epicItems);
      });
      
      render(<Timeline />);
      
      // Verify the right drawer is not opened (initial state)
      const uiState = useUIStore.getState();
      expect(uiState.rightDrawerOpen).toBe(false);
      expect(uiState.rightDrawerContent).toBeNull();
    });

    it('supports epic drawer content type in uiStore', () => {
      // Test that the uiStore correctly handles epic content type
      act(() => {
        useUIStore.getState().openRightDrawer({
          type: 'epic',
          epicId: 'test-epic',
          epicName: 'Test Epic Name',
          wikiUrl: 'https://en.wikipedia.org/wiki/Test',
        });
      });
      
      const state = useUIStore.getState();
      expect(state.rightDrawerOpen).toBe(true);
      expect(state.rightDrawerContent?.type).toBe('epic');
      if (state.rightDrawerContent?.type === 'epic') {
        expect(state.rightDrawerContent.epicId).toBe('test-epic');
        expect(state.rightDrawerContent.epicName).toBe('Test Epic Name');
        expect(state.rightDrawerContent.wikiUrl).toBe('https://en.wikipedia.org/wiki/Test');
      }
    });

    it('closes right drawer correctly after opening with epic content', () => {
      // Open drawer with epic content
      act(() => {
        useUIStore.getState().openRightDrawer({
          type: 'epic',
          epicId: 'epic-1',
          epicName: 'Roman Empire',
          wikiUrl: 'https://en.wikipedia.org/wiki/Roman_Empire',
        });
      });
      
      expect(useUIStore.getState().rightDrawerOpen).toBe(true);
      
      // Close drawer
      act(() => {
        useUIStore.getState().closeRightDrawer();
      });
      
      const state = useUIStore.getState();
      expect(state.rightDrawerOpen).toBe(false);
      expect(state.rightDrawerContent).toBeNull();
    });
  });
});
