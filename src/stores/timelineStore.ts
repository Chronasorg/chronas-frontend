/**
 * Timeline Store
 *
 * Manages timeline state for year navigation, autoplay, and epic items.
 * Uses Zustand for state management.
 *
 * Requirements: 13.1, 13.2, 13.3, 13.4, 2.7
 */

import { create } from 'zustand';

/**
 * Year range constants
 */
export const MIN_YEAR = -2000;
export const MAX_YEAR = 2000;
export const DEFAULT_YEAR = 1000;

/**
 * Autoplay configuration interface
 */
export interface AutoplayConfig {
  /** Start year for autoplay */
  startYear: number;
  /** End year for autoplay */
  endYear: number;
  /** Number of years to advance per step */
  stepSize: number;
  /** Delay between steps in milliseconds */
  delay: number;
  /** Whether to repeat when reaching end year */
  repeat: boolean;
}

/**
 * Epic item interface for timeline display
 */
export interface EpicItem {
  /** Unique identifier */
  id: string;
  /** Display content/title */
  content: string;
  /** Wikipedia article reference */
  wiki: string;
  /** Start date */
  start: Date;
  /** End date */
  end: Date;
  /** Group ID for categorization */
  group: number;
  /** Subtype (e.g., 'ei' for epic item, 'ps' for person) */
  subtype: string;
  /** CSS class name for styling */
  className?: string;
}

/**
 * Timeline state interface
 */
export interface TimelineState {
  /** Currently selected year */
  selectedYear: number;
  /** Suggested year from hover (null when not hovering) */
  suggestedYear: number | null;
  /** Whether the timeline is expanded */
  isExpanded: boolean;
  /** Whether the timeline is at default view */
  isDefaultView: boolean;
  /** Whether autoplay is currently active */
  isAutoplayActive: boolean;
  /** Autoplay configuration */
  autoplayConfig: AutoplayConfig;
  /** Epic items loaded from API */
  epicItems: EpicItem[];
  /** Whether epic search is open */
  isSearchOpen: boolean;
  /** Whether autoplay menu is open */
  isAutoplayMenuOpen: boolean;
  /** Whether year dialog is open */
  isYearDialogOpen: boolean;
}

/**
 * Timeline actions interface
 */
export interface TimelineActions {
  /** Set the selected year */
  setYear: (year: number) => void;
  /** Set the suggested year */
  setSuggestedYear: (year: number | null) => void;
  /** Toggle expanded state */
  toggleExpanded: () => void;
  /** Set expanded state directly */
  setExpanded: (expanded: boolean) => void;
  /** Mark timeline as not at default view */
  setNotDefaultView: () => void;
  /** Reset to default view */
  resetView: () => void;
  /** Start autoplay */
  startAutoplay: () => void;
  /** Stop autoplay */
  stopAutoplay: () => void;
  /** Update autoplay configuration */
  setAutoplayConfig: (config: Partial<AutoplayConfig>) => void;
  /** Set epic items */
  setEpicItems: (items: EpicItem[]) => void;
  /** Toggle search open state */
  toggleSearch: () => void;
  /** Toggle autoplay menu open state */
  toggleAutoplayMenu: () => void;
  /** Toggle year dialog open state */
  toggleYearDialog: () => void;
  /** Close all menus */
  closeAllMenus: () => void;
}

/**
 * Combined timeline store type
 */
export type TimelineStore = TimelineState & TimelineActions;

/**
 * Default autoplay configuration
 */
export const defaultAutoplayConfig: AutoplayConfig = {
  startYear: 1,
  endYear: 2000,
  stepSize: 25,
  delay: 1000, // 1 second in milliseconds
  repeat: true,
};

/**
 * Initial timeline state
 */
export const initialState: TimelineState = {
  selectedYear: DEFAULT_YEAR,
  suggestedYear: null,
  isExpanded: false,
  isDefaultView: true,
  isAutoplayActive: false,
  autoplayConfig: { ...defaultAutoplayConfig },
  epicItems: [],
  isSearchOpen: false,
  isAutoplayMenuOpen: false,
  isYearDialogOpen: false,
};

/**
 * Clamps a year value to the valid range [-2000, 2000]
 *
 * @param year - The year value to clamp
 * @returns The clamped year value
 */
export function clampYear(year: number): number {
  if (!Number.isFinite(year)) {
    return DEFAULT_YEAR;
  }
  return Math.max(MIN_YEAR, Math.min(MAX_YEAR, Math.round(year)));
}

/**
 * Validates if a year is within the valid range
 *
 * @param year - The year value to validate
 * @returns true if the year is valid
 */
export function isValidYear(year: number): boolean {
  return Number.isFinite(year) && year >= MIN_YEAR && year <= MAX_YEAR;
}

// Store autoplay interval ID for cleanup
let autoplayIntervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Zustand timeline store
 *
 * Manages all timeline-related state including year selection,
 * autoplay functionality, and UI state for menus and dialogs.
 */
export const useTimelineStore = create<TimelineStore>((set, get) => ({
  // Initial state
  ...initialState,

  /**
   * Sets the selected year, clamping to valid range.
   *
   * @param year - The year to set
   */
  setYear: (year: number) => {
    const clampedYear = clampYear(year);
    set({ selectedYear: clampedYear });
  },

  /**
   * Sets the suggested year (from hover).
   *
   * @param year - The suggested year or null to clear
   */
  setSuggestedYear: (year: number | null) => {
    if (year === null) {
      set({ suggestedYear: null });
      return;
    }
    const clampedYear = clampYear(year);
    set({ suggestedYear: clampedYear });
  },

  /**
   * Toggles the expanded state of the timeline.
   */
  toggleExpanded: () => {
    set((state) => ({ isExpanded: !state.isExpanded }));
  },

  /**
   * Sets the expanded state directly.
   *
   * @param expanded - Whether the timeline should be expanded
   */
  setExpanded: (expanded: boolean) => {
    set({ isExpanded: expanded });
  },

  /**
   * Marks the timeline as not at default view (zoomed or panned).
   */
  setNotDefaultView: () => {
    set({ isDefaultView: false });
  },

  /**
   * Resets the timeline to default view.
   */
  resetView: () => {
    set({ isDefaultView: true });
  },

  /**
   * Starts the autoplay slideshow.
   * Advances the year by stepSize at each delay interval.
   */
  startAutoplay: () => {
    // Clear any existing interval
    if (autoplayIntervalId !== null) {
      clearInterval(autoplayIntervalId);
    }

    const { autoplayConfig } = get();

    // Set initial year to start year
    set({
      isAutoplayActive: true,
      selectedYear: clampYear(autoplayConfig.startYear),
      isAutoplayMenuOpen: false, // Close menu when starting
    });

    // Start the interval
    autoplayIntervalId = setInterval(() => {
      const state = get();
      const { selectedYear, autoplayConfig: config, isAutoplayActive } = state;

      // Safety check - stop if autoplay was deactivated
      if (!isAutoplayActive) {
        if (autoplayIntervalId !== null) {
          clearInterval(autoplayIntervalId);
          autoplayIntervalId = null;
        }
        return;
      }

      const nextYear = selectedYear + config.stepSize;

      if (nextYear > config.endYear) {
        if (config.repeat) {
          // Restart from beginning
          set({ selectedYear: clampYear(config.startYear) });
        } else {
          // Stop autoplay
          if (autoplayIntervalId !== null) {
            clearInterval(autoplayIntervalId);
            autoplayIntervalId = null;
          }
          set({ isAutoplayActive: false });
        }
      } else {
        // Advance to next year
        set({ selectedYear: clampYear(nextYear) });
      }
    }, autoplayConfig.delay);
  },

  /**
   * Stops the autoplay slideshow.
   */
  stopAutoplay: () => {
    if (autoplayIntervalId !== null) {
      clearInterval(autoplayIntervalId);
      autoplayIntervalId = null;
    }
    set({ isAutoplayActive: false });
  },

  /**
   * Updates the autoplay configuration.
   *
   * @param config - Partial configuration to merge
   */
  setAutoplayConfig: (config: Partial<AutoplayConfig>) => {
    set((state) => ({
      autoplayConfig: {
        ...state.autoplayConfig,
        ...config,
        // Ensure years are clamped
        startYear: config.startYear !== undefined
          ? clampYear(config.startYear)
          : state.autoplayConfig.startYear,
        endYear: config.endYear !== undefined
          ? clampYear(config.endYear)
          : state.autoplayConfig.endYear,
      },
    }));
  },

  /**
   * Sets the epic items for display on the timeline.
   *
   * @param items - Array of epic items
   */
  setEpicItems: (items: EpicItem[]) => {
    set({ epicItems: items });
  },

  /**
   * Toggles the epic search open state.
   */
  toggleSearch: () => {
    set((state) => ({
      isSearchOpen: !state.isSearchOpen,
      // Close other menus when opening search
      isAutoplayMenuOpen: state.isSearchOpen ? state.isAutoplayMenuOpen : false,
      isYearDialogOpen: state.isSearchOpen ? state.isYearDialogOpen : false,
    }));
  },

  /**
   * Toggles the autoplay menu open state.
   */
  toggleAutoplayMenu: () => {
    set((state) => ({
      isAutoplayMenuOpen: !state.isAutoplayMenuOpen,
      // Close other menus when opening autoplay menu
      isSearchOpen: state.isAutoplayMenuOpen ? state.isSearchOpen : false,
      isYearDialogOpen: state.isAutoplayMenuOpen ? state.isYearDialogOpen : false,
    }));
  },

  /**
   * Toggles the year dialog open state.
   */
  toggleYearDialog: () => {
    set((state) => ({
      isYearDialogOpen: !state.isYearDialogOpen,
      // Close other menus when opening year dialog
      isSearchOpen: state.isYearDialogOpen ? state.isSearchOpen : false,
      isAutoplayMenuOpen: state.isYearDialogOpen ? state.isAutoplayMenuOpen : false,
    }));
  },

  /**
   * Closes all menus and dialogs.
   */
  closeAllMenus: () => {
    set({
      isSearchOpen: false,
      isAutoplayMenuOpen: false,
      isYearDialogOpen: false,
    });
  },
}));

// Export for testing purposes
export { autoplayIntervalId };
