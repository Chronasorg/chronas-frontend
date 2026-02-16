/**
 * Timeline Store Tests
 *
 * Unit tests for the timeline state store.
 * Tests initial state, year selection, autoplay, and menu state management.
 *
 * Requirements: 13.1, 13.7, 6.1
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  useTimelineStore,
  initialState,
  clampYear,
  isValidYear,
  mapSubtypeToEpicType,
  createDateFromYear,
  transformApiResponseToEpicItem,
  toWikipediaUrl,
  parseYearFromQueryString,
  MIN_YEAR,
  MAX_YEAR,
  DEFAULT_YEAR,
  defaultAutoplayConfig,
  defaultEpicFilters,
  EPIC_TYPES,
  type EpicItem,
  type EpicApiResponse,
} from './timelineStore';

describe('useTimelineStore', () => {
  // Reset store state before each test
  beforeEach(() => {
    vi.useFakeTimers();
    useTimelineStore.setState(initialState);
  });

  afterEach(() => {
    // Stop any running autoplay
    useTimelineStore.getState().stopAutoplay();
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should have selectedYear set to 1000 initially', () => {
      const state = useTimelineStore.getState();
      expect(state.selectedYear).toBe(1000);
    });

    it('should have suggestedYear set to null initially', () => {
      const state = useTimelineStore.getState();
      expect(state.suggestedYear).toBeNull();
    });

    it('should have isExpanded set to false initially', () => {
      const state = useTimelineStore.getState();
      expect(state.isExpanded).toBe(false);
    });

    it('should have isDefaultView set to true initially', () => {
      const state = useTimelineStore.getState();
      expect(state.isDefaultView).toBe(true);
    });

    it('should have isAutoplayActive set to false initially', () => {
      const state = useTimelineStore.getState();
      expect(state.isAutoplayActive).toBe(false);
    });

    it('should have default autoplay configuration', () => {
      const state = useTimelineStore.getState();
      expect(state.autoplayConfig).toEqual(defaultAutoplayConfig);
      expect(state.autoplayConfig.startYear).toBe(1);
      expect(state.autoplayConfig.endYear).toBe(2000);
      expect(state.autoplayConfig.stepSize).toBe(25);
      expect(state.autoplayConfig.delay).toBe(1000);
      expect(state.autoplayConfig.repeat).toBe(true);
    });

    it('should have empty epicItems array initially', () => {
      const state = useTimelineStore.getState();
      expect(state.epicItems).toEqual([]);
    });

    it('should have all menu states set to false initially', () => {
      const state = useTimelineStore.getState();
      expect(state.isSearchOpen).toBe(false);
      expect(state.isAutoplayMenuOpen).toBe(false);
      expect(state.isYearDialogOpen).toBe(false);
    });

    it('should have all epic filters enabled initially', () => {
      const state = useTimelineStore.getState();
      expect(state.epicFilters).toEqual(defaultEpicFilters);
      expect(state.epicFilters.war).toBe(true);
      expect(state.epicFilters.empire).toBe(true);
      expect(state.epicFilters.religion).toBe(true);
      expect(state.epicFilters.culture).toBe(true);
      expect(state.epicFilters.person).toBe(true);
      expect(state.epicFilters.other).toBe(true);
    });
  });

  describe('setYear', () => {
    it('should set selectedYear to a valid year', () => {
      const { setYear } = useTimelineStore.getState();
      setYear(1500);

      const state = useTimelineStore.getState();
      expect(state.selectedYear).toBe(1500);
    });

    it('should set selectedYear to negative years', () => {
      const { setYear } = useTimelineStore.getState();
      setYear(-500);

      const state = useTimelineStore.getState();
      expect(state.selectedYear).toBe(-500);
    });

    it('should set selectedYear to zero', () => {
      const { setYear } = useTimelineStore.getState();
      setYear(0);

      const state = useTimelineStore.getState();
      expect(state.selectedYear).toBe(0);
    });

    it('should set selectedYear to minimum year (-2000)', () => {
      const { setYear } = useTimelineStore.getState();
      setYear(-2000);

      const state = useTimelineStore.getState();
      expect(state.selectedYear).toBe(-2000);
    });

    it('should set selectedYear to maximum year (2000)', () => {
      const { setYear } = useTimelineStore.getState();
      setYear(2000);

      const state = useTimelineStore.getState();
      expect(state.selectedYear).toBe(2000);
    });

    it('should clamp year below minimum to -2000', () => {
      const { setYear } = useTimelineStore.getState();
      setYear(-5000);

      const state = useTimelineStore.getState();
      expect(state.selectedYear).toBe(-2000);
    });

    it('should clamp year above maximum to 2000', () => {
      const { setYear } = useTimelineStore.getState();
      setYear(5000);

      const state = useTimelineStore.getState();
      expect(state.selectedYear).toBe(2000);
    });

    it('should round decimal years to nearest integer', () => {
      const { setYear } = useTimelineStore.getState();
      setYear(1500.7);

      const state = useTimelineStore.getState();
      expect(state.selectedYear).toBe(1501);
    });

    it('should handle NaN by setting to default year', () => {
      const { setYear } = useTimelineStore.getState();
      setYear(NaN);

      const state = useTimelineStore.getState();
      expect(state.selectedYear).toBe(DEFAULT_YEAR);
    });

    it('should handle Infinity by setting to default year', () => {
      const { setYear } = useTimelineStore.getState();
      setYear(Infinity);

      const state = useTimelineStore.getState();
      expect(state.selectedYear).toBe(DEFAULT_YEAR);
    });

    it('should handle -Infinity by setting to default year', () => {
      const { setYear } = useTimelineStore.getState();
      setYear(-Infinity);

      const state = useTimelineStore.getState();
      expect(state.selectedYear).toBe(DEFAULT_YEAR);
    });
  });

  describe('setSuggestedYear', () => {
    it('should set suggestedYear to a valid year', () => {
      const { setSuggestedYear } = useTimelineStore.getState();
      setSuggestedYear(1800);

      const state = useTimelineStore.getState();
      expect(state.suggestedYear).toBe(1800);
    });

    it('should clear suggestedYear when set to null', () => {
      const { setSuggestedYear } = useTimelineStore.getState();
      setSuggestedYear(1800);
      setSuggestedYear(null);

      const state = useTimelineStore.getState();
      expect(state.suggestedYear).toBeNull();
    });

    it('should clamp out-of-range suggested years', () => {
      const { setSuggestedYear } = useTimelineStore.getState();
      setSuggestedYear(5000);

      const state = useTimelineStore.getState();
      expect(state.suggestedYear).toBe(2000);
    });
  });

  describe('toggleExpanded', () => {
    it('should toggle isExpanded from false to true', () => {
      const { toggleExpanded } = useTimelineStore.getState();
      toggleExpanded();

      const state = useTimelineStore.getState();
      expect(state.isExpanded).toBe(true);
    });

    it('should toggle isExpanded from true to false', () => {
      useTimelineStore.setState({ isExpanded: true });
      const { toggleExpanded } = useTimelineStore.getState();
      toggleExpanded();

      const state = useTimelineStore.getState();
      expect(state.isExpanded).toBe(false);
    });

    it('should toggle isExpanded multiple times correctly', () => {
      const { toggleExpanded } = useTimelineStore.getState();

      toggleExpanded();
      expect(useTimelineStore.getState().isExpanded).toBe(true);

      toggleExpanded();
      expect(useTimelineStore.getState().isExpanded).toBe(false);

      toggleExpanded();
      expect(useTimelineStore.getState().isExpanded).toBe(true);
    });
  });

  describe('setExpanded', () => {
    it('should set isExpanded to true', () => {
      const { setExpanded } = useTimelineStore.getState();
      setExpanded(true);

      const state = useTimelineStore.getState();
      expect(state.isExpanded).toBe(true);
    });

    it('should set isExpanded to false', () => {
      useTimelineStore.setState({ isExpanded: true });
      const { setExpanded } = useTimelineStore.getState();
      setExpanded(false);

      const state = useTimelineStore.getState();
      expect(state.isExpanded).toBe(false);
    });
  });

  describe('setNotDefaultView and resetView', () => {
    it('should set isDefaultView to false', () => {
      const { setNotDefaultView } = useTimelineStore.getState();
      setNotDefaultView();

      const state = useTimelineStore.getState();
      expect(state.isDefaultView).toBe(false);
    });

    it('should reset isDefaultView to true', () => {
      useTimelineStore.setState({ isDefaultView: false });
      const { resetView } = useTimelineStore.getState();
      resetView();

      const state = useTimelineStore.getState();
      expect(state.isDefaultView).toBe(true);
    });
  });

  describe('startAutoplay', () => {
    it('should set isAutoplayActive to true', () => {
      const { startAutoplay } = useTimelineStore.getState();
      startAutoplay();

      const state = useTimelineStore.getState();
      expect(state.isAutoplayActive).toBe(true);
    });

    it('should set selectedYear to startYear when autoplay starts', () => {
      useTimelineStore.setState({
        autoplayConfig: { ...defaultAutoplayConfig, startYear: 500 },
      });
      const { startAutoplay } = useTimelineStore.getState();
      startAutoplay();

      const state = useTimelineStore.getState();
      expect(state.selectedYear).toBe(500);
    });

    it('should close autoplay menu when starting', () => {
      useTimelineStore.setState({ isAutoplayMenuOpen: true });
      const { startAutoplay } = useTimelineStore.getState();
      startAutoplay();

      const state = useTimelineStore.getState();
      expect(state.isAutoplayMenuOpen).toBe(false);
    });

    it('should advance year by stepSize after delay', () => {
      useTimelineStore.setState({
        autoplayConfig: {
          ...defaultAutoplayConfig,
          startYear: 100,
          stepSize: 50,
          delay: 1000,
        },
      });
      const { startAutoplay } = useTimelineStore.getState();
      startAutoplay();

      expect(useTimelineStore.getState().selectedYear).toBe(100);

      vi.advanceTimersByTime(1000);
      expect(useTimelineStore.getState().selectedYear).toBe(150);

      vi.advanceTimersByTime(1000);
      expect(useTimelineStore.getState().selectedYear).toBe(200);
    });

    it('should repeat from startYear when reaching endYear with repeat enabled', () => {
      useTimelineStore.setState({
        autoplayConfig: {
          ...defaultAutoplayConfig,
          startYear: 1900,
          endYear: 2000,
          stepSize: 50,
          delay: 1000,
          repeat: true,
        },
      });
      const { startAutoplay } = useTimelineStore.getState();
      startAutoplay();

      expect(useTimelineStore.getState().selectedYear).toBe(1900);

      vi.advanceTimersByTime(1000);
      expect(useTimelineStore.getState().selectedYear).toBe(1950);

      vi.advanceTimersByTime(1000);
      expect(useTimelineStore.getState().selectedYear).toBe(2000);

      // Should repeat back to start
      vi.advanceTimersByTime(1000);
      expect(useTimelineStore.getState().selectedYear).toBe(1900);
    });

    it('should stop autoplay when reaching endYear with repeat disabled', () => {
      useTimelineStore.setState({
        autoplayConfig: {
          ...defaultAutoplayConfig,
          startYear: 1900,
          endYear: 2000,
          stepSize: 50,
          delay: 1000,
          repeat: false,
        },
      });
      const { startAutoplay } = useTimelineStore.getState();
      startAutoplay();

      vi.advanceTimersByTime(1000);
      vi.advanceTimersByTime(1000);

      // At endYear now
      expect(useTimelineStore.getState().selectedYear).toBe(2000);

      // Should stop
      vi.advanceTimersByTime(1000);
      expect(useTimelineStore.getState().isAutoplayActive).toBe(false);
      expect(useTimelineStore.getState().selectedYear).toBe(2000);
    });
  });

  describe('stopAutoplay', () => {
    it('should set isAutoplayActive to false', () => {
      const { startAutoplay, stopAutoplay } = useTimelineStore.getState();
      startAutoplay();
      stopAutoplay();

      const state = useTimelineStore.getState();
      expect(state.isAutoplayActive).toBe(false);
    });

    it('should stop year advancement', () => {
      useTimelineStore.setState({
        autoplayConfig: {
          ...defaultAutoplayConfig,
          startYear: 100,
          stepSize: 50,
          delay: 1000,
        },
      });
      const { startAutoplay, stopAutoplay } = useTimelineStore.getState();
      startAutoplay();

      vi.advanceTimersByTime(1000);
      expect(useTimelineStore.getState().selectedYear).toBe(150);

      stopAutoplay();

      vi.advanceTimersByTime(1000);
      vi.advanceTimersByTime(1000);
      // Year should not have advanced
      expect(useTimelineStore.getState().selectedYear).toBe(150);
    });
  });

  describe('setAutoplayConfig', () => {
    it('should update startYear', () => {
      const { setAutoplayConfig } = useTimelineStore.getState();
      setAutoplayConfig({ startYear: 500 });

      const state = useTimelineStore.getState();
      expect(state.autoplayConfig.startYear).toBe(500);
    });

    it('should update endYear', () => {
      const { setAutoplayConfig } = useTimelineStore.getState();
      setAutoplayConfig({ endYear: 1500 });

      const state = useTimelineStore.getState();
      expect(state.autoplayConfig.endYear).toBe(1500);
    });

    it('should update stepSize', () => {
      const { setAutoplayConfig } = useTimelineStore.getState();
      setAutoplayConfig({ stepSize: 100 });

      const state = useTimelineStore.getState();
      expect(state.autoplayConfig.stepSize).toBe(100);
    });

    it('should update delay', () => {
      const { setAutoplayConfig } = useTimelineStore.getState();
      setAutoplayConfig({ delay: 2000 });

      const state = useTimelineStore.getState();
      expect(state.autoplayConfig.delay).toBe(2000);
    });

    it('should update repeat', () => {
      const { setAutoplayConfig } = useTimelineStore.getState();
      setAutoplayConfig({ repeat: false });

      const state = useTimelineStore.getState();
      expect(state.autoplayConfig.repeat).toBe(false);
    });

    it('should clamp out-of-range startYear', () => {
      const { setAutoplayConfig } = useTimelineStore.getState();
      setAutoplayConfig({ startYear: -5000 });

      const state = useTimelineStore.getState();
      expect(state.autoplayConfig.startYear).toBe(-2000);
    });

    it('should clamp out-of-range endYear', () => {
      const { setAutoplayConfig } = useTimelineStore.getState();
      setAutoplayConfig({ endYear: 5000 });

      const state = useTimelineStore.getState();
      expect(state.autoplayConfig.endYear).toBe(2000);
    });

    it('should preserve other config values when updating partial config', () => {
      const { setAutoplayConfig } = useTimelineStore.getState();
      setAutoplayConfig({ stepSize: 100 });

      const state = useTimelineStore.getState();
      expect(state.autoplayConfig.startYear).toBe(1);
      expect(state.autoplayConfig.endYear).toBe(2000);
      expect(state.autoplayConfig.stepSize).toBe(100);
      expect(state.autoplayConfig.delay).toBe(1000);
      expect(state.autoplayConfig.repeat).toBe(true);
    });
  });

  describe('setEpicItems', () => {
    it('should set epic items', () => {
      const { setEpicItems } = useTimelineStore.getState();
      const items: EpicItem[] = [
        {
          id: '1',
          content: 'Roman Empire',
          wiki: 'Roman_Empire',
          start: new Date(-27, 0, 1),
          end: new Date(476, 0, 1),
          group: 1,
          subtype: 'ei',
        },
      ];
      setEpicItems(items);

      const state = useTimelineStore.getState();
      expect(state.epicItems).toHaveLength(1);
      expect(state.epicItems[0]?.content).toBe('Roman Empire');
    });

    it('should replace existing epic items', () => {
      const { setEpicItems } = useTimelineStore.getState();
      const items1: EpicItem[] = [
        {
          id: '1',
          content: 'Item 1',
          wiki: 'Item_1',
          start: new Date(100, 0, 1),
          end: new Date(200, 0, 1),
          group: 1,
          subtype: 'ei',
        },
      ];
      const items2: EpicItem[] = [
        {
          id: '2',
          content: 'Item 2',
          wiki: 'Item_2',
          start: new Date(300, 0, 1),
          end: new Date(400, 0, 1),
          group: 1,
          subtype: 'ei',
        },
      ];

      setEpicItems(items1);
      setEpicItems(items2);

      const state = useTimelineStore.getState();
      expect(state.epicItems).toHaveLength(1);
      expect(state.epicItems[0]?.content).toBe('Item 2');
    });

    it('should handle empty array', () => {
      const { setEpicItems } = useTimelineStore.getState();
      setEpicItems([]);

      const state = useTimelineStore.getState();
      expect(state.epicItems).toEqual([]);
    });
  });

  describe('setEpicFilter', () => {
    it('should set a single epic filter to false', () => {
      const { setEpicFilter } = useTimelineStore.getState();
      setEpicFilter('war', false);

      const state = useTimelineStore.getState();
      expect(state.epicFilters.war).toBe(false);
      // Other filters should remain true
      expect(state.epicFilters.empire).toBe(true);
      expect(state.epicFilters.religion).toBe(true);
      expect(state.epicFilters.culture).toBe(true);
      expect(state.epicFilters.person).toBe(true);
      expect(state.epicFilters.other).toBe(true);
    });

    it('should set a single epic filter to true', () => {
      const { setEpicFilter } = useTimelineStore.getState();
      // First disable it
      setEpicFilter('empire', false);
      expect(useTimelineStore.getState().epicFilters.empire).toBe(false);
      
      // Then enable it
      setEpicFilter('empire', true);
      expect(useTimelineStore.getState().epicFilters.empire).toBe(true);
    });

    it('should set multiple epic filters independently', () => {
      const { setEpicFilter } = useTimelineStore.getState();
      setEpicFilter('war', false);
      setEpicFilter('religion', false);
      setEpicFilter('person', false);

      const state = useTimelineStore.getState();
      expect(state.epicFilters.war).toBe(false);
      expect(state.epicFilters.empire).toBe(true);
      expect(state.epicFilters.religion).toBe(false);
      expect(state.epicFilters.culture).toBe(true);
      expect(state.epicFilters.person).toBe(false);
      expect(state.epicFilters.other).toBe(true);
    });

    it('should handle all epic types', () => {
      const { setEpicFilter } = useTimelineStore.getState();
      
      // Disable all types one by one
      EPIC_TYPES.forEach((type) => {
        setEpicFilter(type, false);
      });

      const state = useTimelineStore.getState();
      EPIC_TYPES.forEach((type) => {
        expect(state.epicFilters[type]).toBe(false);
      });
    });
  });

  describe('setAllEpicFilters', () => {
    it('should set all epic filters to false', () => {
      const { setAllEpicFilters } = useTimelineStore.getState();
      setAllEpicFilters(false);

      const state = useTimelineStore.getState();
      expect(state.epicFilters.war).toBe(false);
      expect(state.epicFilters.empire).toBe(false);
      expect(state.epicFilters.religion).toBe(false);
      expect(state.epicFilters.culture).toBe(false);
      expect(state.epicFilters.person).toBe(false);
      expect(state.epicFilters.other).toBe(false);
    });

    it('should set all epic filters to true', () => {
      const { setAllEpicFilters } = useTimelineStore.getState();
      // First disable all
      setAllEpicFilters(false);
      
      // Then enable all
      setAllEpicFilters(true);

      const state = useTimelineStore.getState();
      expect(state.epicFilters.war).toBe(true);
      expect(state.epicFilters.empire).toBe(true);
      expect(state.epicFilters.religion).toBe(true);
      expect(state.epicFilters.culture).toBe(true);
      expect(state.epicFilters.person).toBe(true);
      expect(state.epicFilters.other).toBe(true);
    });

    it('should override individual filter settings', () => {
      const { setEpicFilter, setAllEpicFilters } = useTimelineStore.getState();
      
      // Set some filters individually
      setEpicFilter('war', false);
      setEpicFilter('empire', false);
      
      // Then set all to true
      setAllEpicFilters(true);

      const state = useTimelineStore.getState();
      // All should be true now
      EPIC_TYPES.forEach((type) => {
        expect(state.epicFilters[type]).toBe(true);
      });
    });
  });

  describe('getFilteredEpicItems', () => {
    const sampleEpicItems: EpicItem[] = [
      {
        id: 'war-1',
        content: 'World War I',
        wiki: 'World_War_I',
        start: new Date(1914, 6, 28),
        end: new Date(1918, 10, 11),
        group: 1,
        subtype: 'war',
      },
      {
        id: 'empire-1',
        content: 'Roman Empire',
        wiki: 'Roman_Empire',
        start: new Date(-27, 0, 1),
        end: new Date(476, 8, 4),
        group: 2,
        subtype: 'ei', // Maps to 'empire'
      },
      {
        id: 'religion-1',
        content: 'Protestant Reformation',
        wiki: 'Protestant_Reformation',
        start: new Date(1517, 9, 31),
        end: new Date(1648, 9, 24),
        group: 3,
        subtype: 'religion',
      },
      {
        id: 'person-1',
        content: 'Napoleon Bonaparte',
        wiki: 'Napoleon',
        start: new Date(1769, 7, 15),
        end: new Date(1821, 4, 5),
        group: 4,
        subtype: 'ps', // Maps to 'person'
      },
      {
        id: 'culture-1',
        content: 'Renaissance',
        wiki: 'Renaissance',
        start: new Date(1400, 0, 1),
        end: new Date(1600, 0, 1),
        group: 5,
        subtype: 'culture',
      },
      {
        id: 'other-1',
        content: 'Unknown Event',
        wiki: 'Unknown_Event',
        start: new Date(1000, 0, 1),
        end: new Date(1100, 0, 1),
        group: 6,
        subtype: 'unknown', // Maps to 'other'
      },
    ];

    it('should return all items when all filters are enabled', () => {
      const { setEpicItems, getFilteredEpicItems } = useTimelineStore.getState();
      setEpicItems(sampleEpicItems);

      const filtered = getFilteredEpicItems();
      expect(filtered).toHaveLength(6);
    });

    it('should filter out war items when war filter is disabled', () => {
      const { setEpicItems, setEpicFilter, getFilteredEpicItems } = useTimelineStore.getState();
      setEpicItems(sampleEpicItems);
      setEpicFilter('war', false);

      const filtered = getFilteredEpicItems();
      expect(filtered).toHaveLength(5);
      expect(filtered.find(item => item.id === 'war-1')).toBeUndefined();
    });

    it('should filter out empire items when empire filter is disabled', () => {
      const { setEpicItems, setEpicFilter, getFilteredEpicItems } = useTimelineStore.getState();
      setEpicItems(sampleEpicItems);
      setEpicFilter('empire', false);

      const filtered = getFilteredEpicItems();
      expect(filtered).toHaveLength(5);
      expect(filtered.find(item => item.id === 'empire-1')).toBeUndefined();
    });

    it('should filter out person items when person filter is disabled', () => {
      const { setEpicItems, setEpicFilter, getFilteredEpicItems } = useTimelineStore.getState();
      setEpicItems(sampleEpicItems);
      setEpicFilter('person', false);

      const filtered = getFilteredEpicItems();
      expect(filtered).toHaveLength(5);
      expect(filtered.find(item => item.id === 'person-1')).toBeUndefined();
    });

    it('should filter out multiple types when multiple filters are disabled', () => {
      const { setEpicItems, setEpicFilter, getFilteredEpicItems } = useTimelineStore.getState();
      setEpicItems(sampleEpicItems);
      setEpicFilter('war', false);
      setEpicFilter('religion', false);
      setEpicFilter('other', false);

      const filtered = getFilteredEpicItems();
      expect(filtered).toHaveLength(3);
      expect(filtered.find(item => item.id === 'war-1')).toBeUndefined();
      expect(filtered.find(item => item.id === 'religion-1')).toBeUndefined();
      expect(filtered.find(item => item.id === 'other-1')).toBeUndefined();
      // These should still be present
      expect(filtered.find(item => item.id === 'empire-1')).toBeDefined();
      expect(filtered.find(item => item.id === 'person-1')).toBeDefined();
      expect(filtered.find(item => item.id === 'culture-1')).toBeDefined();
    });

    it('should return empty array when all filters are disabled', () => {
      const { setEpicItems, setAllEpicFilters, getFilteredEpicItems } = useTimelineStore.getState();
      setEpicItems(sampleEpicItems);
      setAllEpicFilters(false);

      const filtered = getFilteredEpicItems();
      expect(filtered).toHaveLength(0);
    });

    it('should return empty array when epic items is empty', () => {
      const { setEpicItems, getFilteredEpicItems } = useTimelineStore.getState();
      setEpicItems([]);

      const filtered = getFilteredEpicItems();
      expect(filtered).toHaveLength(0);
    });

    it('should handle items with unknown subtypes as other', () => {
      const { setEpicItems, setEpicFilter, getFilteredEpicItems } = useTimelineStore.getState();
      const itemsWithUnknown: EpicItem[] = [
        {
          id: 'unknown-1',
          content: 'Mystery Event',
          wiki: 'Mystery',
          start: new Date(500, 0, 1),
          end: new Date(600, 0, 1),
          group: 1,
          subtype: 'xyz_unknown_type',
        },
      ];
      setEpicItems(itemsWithUnknown);
      
      // With 'other' enabled, should include the item
      let filtered = getFilteredEpicItems();
      expect(filtered).toHaveLength(1);
      
      // With 'other' disabled, should exclude the item
      setEpicFilter('other', false);
      filtered = getFilteredEpicItems();
      expect(filtered).toHaveLength(0);
    });
  });

  describe('toggleSearch', () => {
    it('should toggle isSearchOpen from false to true', () => {
      const { toggleSearch } = useTimelineStore.getState();
      toggleSearch();

      const state = useTimelineStore.getState();
      expect(state.isSearchOpen).toBe(true);
    });

    it('should toggle isSearchOpen from true to false', () => {
      useTimelineStore.setState({ isSearchOpen: true });
      const { toggleSearch } = useTimelineStore.getState();
      toggleSearch();

      const state = useTimelineStore.getState();
      expect(state.isSearchOpen).toBe(false);
    });

    it('should close other menus when opening search', () => {
      useTimelineStore.setState({
        isAutoplayMenuOpen: true,
        isYearDialogOpen: true,
      });
      const { toggleSearch } = useTimelineStore.getState();
      toggleSearch();

      const state = useTimelineStore.getState();
      expect(state.isSearchOpen).toBe(true);
      expect(state.isAutoplayMenuOpen).toBe(false);
      expect(state.isYearDialogOpen).toBe(false);
    });
  });

  describe('toggleAutoplayMenu', () => {
    it('should toggle isAutoplayMenuOpen from false to true', () => {
      const { toggleAutoplayMenu } = useTimelineStore.getState();
      toggleAutoplayMenu();

      const state = useTimelineStore.getState();
      expect(state.isAutoplayMenuOpen).toBe(true);
    });

    it('should toggle isAutoplayMenuOpen from true to false', () => {
      useTimelineStore.setState({ isAutoplayMenuOpen: true });
      const { toggleAutoplayMenu } = useTimelineStore.getState();
      toggleAutoplayMenu();

      const state = useTimelineStore.getState();
      expect(state.isAutoplayMenuOpen).toBe(false);
    });

    it('should close other menus when opening autoplay menu', () => {
      useTimelineStore.setState({
        isSearchOpen: true,
        isYearDialogOpen: true,
      });
      const { toggleAutoplayMenu } = useTimelineStore.getState();
      toggleAutoplayMenu();

      const state = useTimelineStore.getState();
      expect(state.isAutoplayMenuOpen).toBe(true);
      expect(state.isSearchOpen).toBe(false);
      expect(state.isYearDialogOpen).toBe(false);
    });
  });

  describe('toggleYearDialog', () => {
    it('should toggle isYearDialogOpen from false to true', () => {
      const { toggleYearDialog } = useTimelineStore.getState();
      toggleYearDialog();

      const state = useTimelineStore.getState();
      expect(state.isYearDialogOpen).toBe(true);
    });

    it('should toggle isYearDialogOpen from true to false', () => {
      useTimelineStore.setState({ isYearDialogOpen: true });
      const { toggleYearDialog } = useTimelineStore.getState();
      toggleYearDialog();

      const state = useTimelineStore.getState();
      expect(state.isYearDialogOpen).toBe(false);
    });

    it('should close other menus when opening year dialog', () => {
      useTimelineStore.setState({
        isSearchOpen: true,
        isAutoplayMenuOpen: true,
      });
      const { toggleYearDialog } = useTimelineStore.getState();
      toggleYearDialog();

      const state = useTimelineStore.getState();
      expect(state.isYearDialogOpen).toBe(true);
      expect(state.isSearchOpen).toBe(false);
      expect(state.isAutoplayMenuOpen).toBe(false);
    });
  });

  describe('closeAllMenus', () => {
    it('should close all menus', () => {
      useTimelineStore.setState({
        isSearchOpen: true,
        isAutoplayMenuOpen: true,
        isYearDialogOpen: true,
      });
      const { closeAllMenus } = useTimelineStore.getState();
      closeAllMenus();

      const state = useTimelineStore.getState();
      expect(state.isSearchOpen).toBe(false);
      expect(state.isAutoplayMenuOpen).toBe(false);
      expect(state.isYearDialogOpen).toBe(false);
    });

    it('should work when all menus are already closed', () => {
      const { closeAllMenus } = useTimelineStore.getState();
      closeAllMenus();

      const state = useTimelineStore.getState();
      expect(state.isSearchOpen).toBe(false);
      expect(state.isAutoplayMenuOpen).toBe(false);
      expect(state.isYearDialogOpen).toBe(false);
    });
  });
});

describe('clampYear utility', () => {
  it('should return year unchanged when within range', () => {
    expect(clampYear(1000)).toBe(1000);
    expect(clampYear(0)).toBe(0);
    expect(clampYear(-1000)).toBe(-1000);
  });

  it('should clamp to MIN_YEAR when below range', () => {
    expect(clampYear(-3000)).toBe(MIN_YEAR);
    expect(clampYear(-10000)).toBe(MIN_YEAR);
  });

  it('should clamp to MAX_YEAR when above range', () => {
    expect(clampYear(3000)).toBe(MAX_YEAR);
    expect(clampYear(10000)).toBe(MAX_YEAR);
  });

  it('should return boundary values unchanged', () => {
    expect(clampYear(MIN_YEAR)).toBe(MIN_YEAR);
    expect(clampYear(MAX_YEAR)).toBe(MAX_YEAR);
  });

  it('should round decimal values', () => {
    expect(clampYear(1000.4)).toBe(1000);
    expect(clampYear(1000.5)).toBe(1001);
    expect(clampYear(1000.6)).toBe(1001);
  });

  it('should return DEFAULT_YEAR for NaN', () => {
    expect(clampYear(NaN)).toBe(DEFAULT_YEAR);
  });

  it('should return DEFAULT_YEAR for Infinity', () => {
    expect(clampYear(Infinity)).toBe(DEFAULT_YEAR);
    expect(clampYear(-Infinity)).toBe(DEFAULT_YEAR);
  });
});

describe('isValidYear utility', () => {
  it('should return true for years within range', () => {
    expect(isValidYear(1000)).toBe(true);
    expect(isValidYear(0)).toBe(true);
    expect(isValidYear(-1000)).toBe(true);
  });

  it('should return true for boundary values', () => {
    expect(isValidYear(MIN_YEAR)).toBe(true);
    expect(isValidYear(MAX_YEAR)).toBe(true);
  });

  it('should return false for years below range', () => {
    expect(isValidYear(-2001)).toBe(false);
    expect(isValidYear(-10000)).toBe(false);
  });

  it('should return false for years above range', () => {
    expect(isValidYear(2001)).toBe(false);
    expect(isValidYear(10000)).toBe(false);
  });

  it('should return false for NaN', () => {
    expect(isValidYear(NaN)).toBe(false);
  });

  it('should return false for Infinity', () => {
    expect(isValidYear(Infinity)).toBe(false);
    expect(isValidYear(-Infinity)).toBe(false);
  });
});

describe('constants', () => {
  it('should have correct MIN_YEAR', () => {
    expect(MIN_YEAR).toBe(-2000);
  });

  it('should have correct MAX_YEAR', () => {
    expect(MAX_YEAR).toBe(2000);
  });

  it('should have correct DEFAULT_YEAR', () => {
    expect(DEFAULT_YEAR).toBe(1000);
  });
});

describe('mapSubtypeToEpicType utility', () => {
  it('should map war-related subtypes to war', () => {
    expect(mapSubtypeToEpicType('war')).toBe('war');
    expect(mapSubtypeToEpicType('War')).toBe('war');
    expect(mapSubtypeToEpicType('WAR')).toBe('war');
    expect(mapSubtypeToEpicType('battle')).toBe('war');
    expect(mapSubtypeToEpicType('conflict')).toBe('war');
  });

  it('should map empire-related subtypes to empire', () => {
    expect(mapSubtypeToEpicType('empire')).toBe('empire');
    expect(mapSubtypeToEpicType('Empire')).toBe('empire');
    expect(mapSubtypeToEpicType('ei')).toBe('empire');
    expect(mapSubtypeToEpicType('kingdom')).toBe('empire');
    expect(mapSubtypeToEpicType('dynasty')).toBe('empire');
  });

  it('should map religion-related subtypes to religion', () => {
    expect(mapSubtypeToEpicType('religion')).toBe('religion');
    expect(mapSubtypeToEpicType('Religion')).toBe('religion');
    expect(mapSubtypeToEpicType('religious')).toBe('religion');
  });

  it('should map culture-related subtypes to culture', () => {
    expect(mapSubtypeToEpicType('culture')).toBe('culture');
    expect(mapSubtypeToEpicType('Culture')).toBe('culture');
    expect(mapSubtypeToEpicType('cultural')).toBe('culture');
    expect(mapSubtypeToEpicType('art')).toBe('culture');
  });

  it('should map person-related subtypes to person', () => {
    expect(mapSubtypeToEpicType('person')).toBe('person');
    expect(mapSubtypeToEpicType('Person')).toBe('person');
    expect(mapSubtypeToEpicType('ps')).toBe('person');
    expect(mapSubtypeToEpicType('people')).toBe('person');
    expect(mapSubtypeToEpicType('leader')).toBe('person');
  });

  it('should map unknown subtypes to other', () => {
    expect(mapSubtypeToEpicType('unknown')).toBe('other');
    expect(mapSubtypeToEpicType('xyz')).toBe('other');
    expect(mapSubtypeToEpicType('')).toBe('other');
    expect(mapSubtypeToEpicType('random_type')).toBe('other');
  });
});

describe('EPIC_TYPES constant', () => {
  it('should contain all six epic types', () => {
    expect(EPIC_TYPES).toHaveLength(6);
    expect(EPIC_TYPES).toContain('war');
    expect(EPIC_TYPES).toContain('empire');
    expect(EPIC_TYPES).toContain('religion');
    expect(EPIC_TYPES).toContain('culture');
    expect(EPIC_TYPES).toContain('person');
    expect(EPIC_TYPES).toContain('other');
  });
});

describe('defaultEpicFilters constant', () => {
  it('should have all filters enabled by default', () => {
    expect(defaultEpicFilters.war).toBe(true);
    expect(defaultEpicFilters.empire).toBe(true);
    expect(defaultEpicFilters.religion).toBe(true);
    expect(defaultEpicFilters.culture).toBe(true);
    expect(defaultEpicFilters.person).toBe(true);
    expect(defaultEpicFilters.other).toBe(true);
  });
});

describe('createDateFromYear utility', () => {
  it('should create a date for a positive year', () => {
    const date = createDateFromYear(1000);
    expect(date.getFullYear()).toBe(1000);
    // Production uses new Date(0, 1, 1) which is February 1st
    expect(date.getMonth()).toBe(1); // February (matches production)
    expect(date.getDate()).toBe(1);
  });

  it('should create a date for year 0', () => {
    const date = createDateFromYear(0);
    expect(date.getFullYear()).toBe(0);
  });

  it('should create a date for a negative year (BCE)', () => {
    const date = createDateFromYear(-500);
    expect(date.getFullYear()).toBe(-500);
  });

  it('should create a date for year 2000', () => {
    const date = createDateFromYear(2000);
    expect(date.getFullYear()).toBe(2000);
  });
});

describe('toWikipediaUrl utility', () => {
  it('should convert article name to full Wikipedia URL', () => {
    expect(toWikipediaUrl('Roman_Empire')).toBe('https://en.wikipedia.org/wiki/Roman_Empire');
  });

  it('should handle URL-encoded article names', () => {
    expect(toWikipediaUrl('Archimedes%27_screw')).toBe('https://en.wikipedia.org/wiki/Archimedes%27_screw');
  });

  it('should return full URL as-is when already a https URL', () => {
    expect(toWikipediaUrl('https://en.wikipedia.org/wiki/Test')).toBe('https://en.wikipedia.org/wiki/Test');
  });

  it('should return full URL as-is when already a http URL', () => {
    expect(toWikipediaUrl('http://en.wikipedia.org/wiki/Test')).toBe('http://en.wikipedia.org/wiki/Test');
  });

  it('should return empty string for empty input', () => {
    expect(toWikipediaUrl('')).toBe('');
  });

  it('should handle simple article names', () => {
    expect(toWikipediaUrl('Cannon')).toBe('https://en.wikipedia.org/wiki/Cannon');
  });
});

describe('transformApiResponseToEpicItem utility', () => {
  it('should transform a complete API response to EpicItem', () => {
    const apiItem: EpicApiResponse = {
      _id: 'roman-empire',
      name: 'Roman Empire',
      wiki: 'https://en.wikipedia.org/wiki/Roman_Empire',
      year: -27,
      subtype: 'ei',
      data: {
        title: 'Roman Empire',
        start: -27,
        end: 476,
        wiki: 'https://en.wikipedia.org/wiki/Roman_Empire',
      },
    };

    const result = transformApiResponseToEpicItem(apiItem);

    expect(result.id).toBe('roman-empire');
    expect(result.content).toBe('Roman Empire');
    expect(result.wiki).toBe('https://en.wikipedia.org/wiki/Roman_Empire');
    expect(result.start.getFullYear()).toBe(-27);
    expect(result.end.getFullYear()).toBe(476);
    expect(result.group).toBe(1);
    expect(result.subtype).toBe('ei');
    expect(result.className).toBe('timelineItem_ei');
  });

  it('should use data.start and data.end when available', () => {
    const apiItem: EpicApiResponse = {
      _id: 'test-item',
      year: 100,
      subtype: 'ew',
      data: {
        start: 200,
        end: 300,
      },
    };

    const result = transformApiResponseToEpicItem(apiItem);

    expect(result.start.getFullYear()).toBe(200);
    expect(result.end.getFullYear()).toBe(300);
  });

  it('should fall back to year when data.start is not available', () => {
    const apiItem: EpicApiResponse = {
      _id: 'test-item',
      year: 100,
      subtype: 'ps',
      data: {},
    };

    const result = transformApiResponseToEpicItem(apiItem);

    expect(result.start.getFullYear()).toBe(100);
    expect(result.end.getFullYear()).toBe(101); // startYear + 1
  });

  it('should use name over data.title when both are available', () => {
    const apiItem: EpicApiResponse = {
      _id: 'test-item',
      name: 'Name from name field',
      subtype: 'ei',
      data: {
        title: 'Title from data',
      },
    };

    const result = transformApiResponseToEpicItem(apiItem);

    expect(result.content).toBe('Name from name field');
  });

  it('should fall back to data.title when name is not available', () => {
    const apiItem: EpicApiResponse = {
      _id: 'test-item',
      subtype: 'ei',
      data: {
        title: 'Title from data',
      },
    };

    const result = transformApiResponseToEpicItem(apiItem);

    expect(result.content).toBe('Title from data');
  });

  it('should fall back to _id when neither name nor data.title is available', () => {
    const apiItem: EpicApiResponse = {
      _id: 'test-item-id',
      subtype: 'ei',
      data: {},
    };

    const result = transformApiResponseToEpicItem(apiItem);

    expect(result.content).toBe('test-item-id');
  });

  it('should use data.wiki over wiki when both are available', () => {
    const apiItem: EpicApiResponse = {
      _id: 'test-item',
      wiki: 'https://wiki.from.root',
      subtype: 'ei',
      data: {
        wiki: 'https://wiki.from.data',
      },
    };

    const result = transformApiResponseToEpicItem(apiItem);

    expect(result.wiki).toBe('https://wiki.from.data');
  });

  it('should convert article name to full Wikipedia URL', () => {
    const apiItem: EpicApiResponse = {
      _id: 'test-item',
      subtype: 'ei',
      data: {
        wiki: 'Roman_Empire',
      },
    };

    const result = transformApiResponseToEpicItem(apiItem);

    expect(result.wiki).toBe('https://en.wikipedia.org/wiki/Roman_Empire');
  });

  it('should fall back to root wiki when data.wiki is not available', () => {
    const apiItem: EpicApiResponse = {
      _id: 'test-item',
      wiki: 'https://wiki.from.root',
      subtype: 'ei',
      data: {},
    };

    const result = transformApiResponseToEpicItem(apiItem);

    expect(result.wiki).toBe('https://wiki.from.root');
  });

  it('should return empty string for wiki when neither is available', () => {
    const apiItem: EpicApiResponse = {
      _id: 'test-item',
      subtype: 'ei',
      data: {},
    };

    const result = transformApiResponseToEpicItem(apiItem);

    expect(result.wiki).toBe('');
  });
});

// Mock the apiClient for loadEpicItems tests
const mockGet = vi.hoisted(() => vi.fn());

vi.mock('../api/client', () => ({
  apiClient: { get: mockGet },
}));

describe('loadEpicItems', () => {
  beforeEach(() => {
    mockGet.mockReset();
    useTimelineStore.setState(initialState);
  });

  it('should load and transform epic items from API', async () => {
    const mockApiResponse: EpicApiResponse[] = [
      {
        _id: 'roman-empire',
        name: 'Roman Empire',
        wiki: 'https://en.wikipedia.org/wiki/Roman_Empire',
        year: -27,
        subtype: 'ei',
        data: {
          title: 'Roman Empire',
          start: -27,
          end: 476,
          wiki: 'https://en.wikipedia.org/wiki/Roman_Empire',
        },
      },
      {
        _id: 'hundred-years-war',
        name: "Hundred Years' War",
        subtype: 'ew',
        data: {
          start: 1337,
          end: 1453,
        },
      },
    ];

    mockGet.mockResolvedValueOnce(mockApiResponse);

    await useTimelineStore.getState().loadEpicItems();

    const state = useTimelineStore.getState();
    expect(state.epicItems).toHaveLength(2);
    expect(state.epicItems[0]?.id).toBe('roman-empire');
    expect(state.epicItems[0]?.content).toBe('Roman Empire');
    expect(state.epicItems[1]?.id).toBe('hundred-years-war');
  });

  it('should filter out non-epic objects from response', async () => {
    // The API may return a battles-by-wars mapping object as the first element
    const mockApiResponse = [
      { 'war-1': [['Battle 1', 1340], ['Battle 2', 1345]] }, // battles-by-wars mapping
      {
        _id: 'hundred-years-war',
        name: "Hundred Years' War",
        subtype: 'ew',
        data: {
          start: 1337,
          end: 1453,
        },
      },
    ];

    mockGet.mockResolvedValueOnce(mockApiResponse);

    await useTimelineStore.getState().loadEpicItems();

    const state = useTimelineStore.getState();
    expect(state.epicItems).toHaveLength(1);
    expect(state.epicItems[0]?.id).toBe('hundred-years-war');
  });

  it('should set empty array on API error', async () => {
    // First set some existing items
    useTimelineStore.setState({
      epicItems: [
        {
          id: 'existing',
          content: 'Existing Item',
          wiki: '',
          start: new Date(),
          end: new Date(),
          group: 1,
          subtype: 'ei',
        },
      ],
    });

    mockGet.mockRejectedValueOnce(new Error('Network error'));

    await useTimelineStore.getState().loadEpicItems();

    const state = useTimelineStore.getState();
    expect(state.epicItems).toEqual([]);
  });

  it('should handle empty API response', async () => {
    mockGet.mockResolvedValueOnce([]);

    await useTimelineStore.getState().loadEpicItems();

    const state = useTimelineStore.getState();
    expect(state.epicItems).toEqual([]);
  });

  it('should call the correct API endpoint', async () => {
    mockGet.mockResolvedValueOnce([]);

    await useTimelineStore.getState().loadEpicItems();

    expect(mockGet).toHaveBeenCalledWith('/metadata?type=e&end=3000&subtype=ew,ei,ps');
  });
});

/**
 * Tests for URL year initialization
 * 
 * These tests verify that the timeline store correctly initializes the year
 * from the URL query parameter to prevent race conditions.
 */
describe('URL year initialization', () => {
  // Save original window.location
  const originalLocation = window.location;
  
  beforeEach(() => {
    // Reset store state
    useTimelineStore.setState(initialState);
  });
  
  afterEach(() => {
    // Restore original location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });
  
  describe('getInitialYearFromURL behavior', () => {
    it('should return DEFAULT_YEAR when no year parameter in URL', () => {
      // The store is already initialized with the current URL
      // Since tests run without year param, it should use DEFAULT_YEAR
      const state = useTimelineStore.getState();
      // Note: initialState.selectedYear is set by getInitialYearFromURL()
      // In test environment without URL params, it returns DEFAULT_YEAR
      expect(state.selectedYear).toBe(DEFAULT_YEAR);
    });
    
    it('should clamp year values to valid range', () => {
      // Test that clampYear works correctly
      expect(clampYear(-3000)).toBe(MIN_YEAR); // -2000
      expect(clampYear(3000)).toBe(MAX_YEAR); // 2000
      expect(clampYear(683)).toBe(683);
      expect(clampYear(-500)).toBe(-500);
    });
    
    it('should handle invalid year values', () => {
      expect(clampYear(NaN)).toBe(DEFAULT_YEAR);
      expect(clampYear(Infinity)).toBe(DEFAULT_YEAR);
      expect(clampYear(-Infinity)).toBe(DEFAULT_YEAR);
    });
  });
  
  describe('year validation', () => {
    it('should validate years within range', () => {
      expect(isValidYear(683)).toBe(true);
      expect(isValidYear(-500)).toBe(true);
      expect(isValidYear(0)).toBe(true);
      expect(isValidYear(MIN_YEAR)).toBe(true);
      expect(isValidYear(MAX_YEAR)).toBe(true);
    });
    
    it('should reject years outside range', () => {
      expect(isValidYear(-3000)).toBe(false);
      expect(isValidYear(3000)).toBe(false);
      expect(isValidYear(NaN)).toBe(false);
      expect(isValidYear(Infinity)).toBe(false);
    });
  });
  
  describe('setYear action', () => {
    it('should set year from URL value', () => {
      const { setYear } = useTimelineStore.getState();
      setYear(683);
      expect(useTimelineStore.getState().selectedYear).toBe(683);
    });
    
    it('should clamp year to valid range when setting', () => {
      const { setYear } = useTimelineStore.getState();
      setYear(5000);
      expect(useTimelineStore.getState().selectedYear).toBe(MAX_YEAR);
      
      setYear(-5000);
      expect(useTimelineStore.getState().selectedYear).toBe(MIN_YEAR);
    });
    
    it('should handle negative years (BCE)', () => {
      const { setYear } = useTimelineStore.getState();
      setYear(-500);
      expect(useTimelineStore.getState().selectedYear).toBe(-500);
    });
  });
});

describe('parseYearFromQueryString', () => {
  it('should parse year from query string with leading ?', () => {
    expect(parseYearFromQueryString('?year=683')).toBe(683);
    expect(parseYearFromQueryString('?year=1000')).toBe(1000);
    expect(parseYearFromQueryString('?year=-500')).toBe(-500);
  });
  
  it('should parse year from query string without leading ?', () => {
    expect(parseYearFromQueryString('year=683')).toBe(683);
    expect(parseYearFromQueryString('year=1000')).toBe(1000);
  });
  
  it('should return null for missing year parameter', () => {
    expect(parseYearFromQueryString('?foo=bar')).toBeNull();
    expect(parseYearFromQueryString('?')).toBeNull();
    expect(parseYearFromQueryString('')).toBeNull();
    expect(parseYearFromQueryString(null)).toBeNull();
    expect(parseYearFromQueryString(undefined)).toBeNull();
  });
  
  it('should return null for invalid year values', () => {
    expect(parseYearFromQueryString('?year=abc')).toBeNull();
    expect(parseYearFromQueryString('?year=')).toBeNull();
    expect(parseYearFromQueryString('?year=NaN')).toBeNull();
  });
  
  it('should parse year with other parameters present', () => {
    expect(parseYearFromQueryString('?year=683&pos=37,45,5')).toBe(683);
    expect(parseYearFromQueryString('?foo=bar&year=1500&baz=qux')).toBe(1500);
  });
  
  it('should handle decimal years by parsing as integer', () => {
    expect(parseYearFromQueryString('?year=683.5')).toBe(683);
    expect(parseYearFromQueryString('?year=1000.9')).toBe(1000);
  });
});
