/**
 * Timeline Store Tests
 *
 * Unit tests for the timeline state store.
 * Tests initial state, year selection, autoplay, and menu state management.
 *
 * Requirements: 13.1, 13.7
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  useTimelineStore,
  initialState,
  clampYear,
  isValidYear,
  MIN_YEAR,
  MAX_YEAR,
  DEFAULT_YEAR,
  defaultAutoplayConfig,
  type EpicItem,
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
