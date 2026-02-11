/**
 * Timeline Store
 *
 * Manages timeline state for year navigation, autoplay, and epic items.
 * Uses Zustand for state management.
 *
 * Requirements: 13.1, 13.2, 13.3, 13.4, 2.7, 7.3, 7.4, 6.1
 */

import { create } from 'zustand';
import { apiClient } from '../api/client';
import { EPICS } from '../api/endpoints';

/**
 * Year range constants
 */
export const MIN_YEAR = -2000;
export const MAX_YEAR = 2000;
export const DEFAULT_YEAR = 1000;

/**
 * Epic type categories for filtering
 * Requirements: 7.3, 7.4
 */
export type EpicType = 'war' | 'empire' | 'religion' | 'culture' | 'person' | 'other';

/**
 * All epic types as an array for iteration
 */
export const EPIC_TYPES: EpicType[] = ['war', 'empire', 'religion', 'culture', 'person', 'other'];

/**
 * Default epic filter state - all types enabled
 */
export const defaultEpicFilters: Record<EpicType, boolean> = {
  war: true,
  empire: true,
  religion: true,
  culture: true,
  person: true,
  other: true,
};

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
 * Epic item API response interface
 * Represents the raw data returned from the /metadata?type=e endpoint
 * Requirements: 6.1
 */
export interface EpicApiResponse {
  /** Unique identifier */
  _id: string;
  /** Display name */
  name?: string;
  /** Wikipedia article URL */
  wiki?: string;
  /** Year of the epic item */
  year?: number;
  /** Subtype (e.g., 'ew' for war, 'ei' for discovery, 'ps' for person) */
  subtype: string;
  /** Additional data */
  data: {
    /** Title of the epic item */
    title?: string;
    /** Start year */
    start?: number;
    /** End year */
    end?: number;
    /** Wikipedia URL */
    wiki?: string;
    /** Source URL */
    source?: string;
  };
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
  /** Filter state for epic types - Requirements: 7.3, 7.4 */
  epicFilters: Record<EpicType, boolean>;
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
  /** Load epic items from API - Requirements: 6.1 */
  loadEpicItems: () => Promise<void>;
  /** Set filter for a specific epic type - Requirements: 7.3, 7.4 */
  setEpicFilter: (type: EpicType, enabled: boolean) => void;
  /** Set all epic filters to the same value - Requirements: 7.3, 7.4 */
  setAllEpicFilters: (enabled: boolean) => void;
  /** Get filtered epic items based on current filter state - Requirements: 7.3 */
  getFilteredEpicItems: () => EpicItem[];
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
 * Parses year from a query string.
 * Exported for testing purposes.
 * 
 * @param queryString - The query string (with or without leading ?)
 * @returns The year value or null if not found/invalid
 */
export function parseYearFromQueryString(queryString: string | null | undefined): number | null {
  if (!queryString) {
    return null;
  }
  
  // Ensure we have a proper query string format
  const normalizedQuery = queryString.startsWith('?') ? queryString : `?${queryString}`;
  const params = new URLSearchParams(normalizedQuery);
  const yearParam = params.get('year');
  
  if (!yearParam) {
    return null;
  }
  
  const year = parseInt(yearParam, 10);
  if (!Number.isFinite(year)) {
    return null;
  }
  
  return year;
}

/**
 * Gets the initial year from URL or returns default.
 * This is called synchronously during store initialization to prevent race conditions.
 * 
 * Supports multiple URL formats:
 * 1. Regular query params: https://example.com/?year=683
 * 2. HashRouter with query after hash: https://example.com/#/?year=683
 * 3. Query params before hash (legacy): https://example.com/?year=683#/
 * 
 * @returns The year from URL or DEFAULT_YEAR
 */
function getInitialYearFromURL(): number {
  if (typeof window === 'undefined') {
    return DEFAULT_YEAR;
  }
  
  let yearParam: number | null = null;
  
  try {
    const fullUrl = window.location.href;
    const hash = window.location.hash;
    const search = window.location.search;
    
    // Debug logging for troubleshooting
    console.log('[TimelineStore] URL parsing:', { fullUrl, hash, search });
    
    // Strategy 1: Check regular URL search params (before hash)
    // This handles: https://example.com/?year=683 or https://example.com/?year=683#/
    if (search) {
      yearParam = parseYearFromQueryString(search);
      if (yearParam !== null) {
        console.log('[TimelineStore] Found year in search params:', yearParam);
      }
    }
    
    // Strategy 2: Check HashRouter format (query params after hash)
    // This handles: https://example.com/#/?year=683
    if (yearParam === null && hash) {
      const hashContent = hash.slice(1); // Remove leading #
      const queryIndex = hashContent.indexOf('?');
      if (queryIndex !== -1) {
        const hashQueryString = hashContent.slice(queryIndex);
        yearParam = parseYearFromQueryString(hashQueryString);
        if (yearParam !== null) {
          console.log('[TimelineStore] Found year in hash params:', yearParam);
        }
      }
    }
    
    // Strategy 3: Parse the full URL as a fallback
    // This handles edge cases where URL parsing might differ
    if (yearParam === null) {
      const url = new URL(fullUrl);
      const urlYearParam = url.searchParams.get('year');
      if (urlYearParam) {
        const parsed = parseInt(urlYearParam, 10);
        if (Number.isFinite(parsed)) {
          yearParam = parsed;
          console.log('[TimelineStore] Found year via URL object:', yearParam);
        }
      }
    }
  } catch (error) {
    console.error('[TimelineStore] Error parsing URL for year:', error);
  }
  
  // Validate and clamp the year
  if (yearParam === null) {
    console.log('[TimelineStore] No year found in URL, using default:', DEFAULT_YEAR);
    return DEFAULT_YEAR;
  }
  
  // Clamp to valid range
  const clampedYear = Math.max(MIN_YEAR, Math.min(MAX_YEAR, yearParam));
  if (clampedYear !== yearParam) {
    console.log('[TimelineStore] Year clamped from', yearParam, 'to', clampedYear);
  }
  
  console.log('[TimelineStore] Initial year from URL:', clampedYear);
  return clampedYear;
}

/**
 * Initial timeline state
 * Note: selectedYear is initialized from URL synchronously to prevent race conditions
 */
export const initialState: TimelineState = {
  selectedYear: getInitialYearFromURL(),
  suggestedYear: null,
  isExpanded: false,
  isDefaultView: true,
  isAutoplayActive: false,
  autoplayConfig: { ...defaultAutoplayConfig },
  epicItems: [],
  epicFilters: { ...defaultEpicFilters },
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

/**
 * Maps an epic item subtype to an EpicType category.
 * Used for filtering epic items by type.
 * Requirements: 7.3
 *
 * @param subtype - The subtype string from the epic item
 * @returns The corresponding EpicType category
 */
export function mapSubtypeToEpicType(subtype: string): EpicType {
  const subtypeLower = subtype.toLowerCase();
  
  // Map known subtypes to categories
  if (subtypeLower === 'war' || subtypeLower === 'battle' || subtypeLower === 'conflict') {
    return 'war';
  }
  if (subtypeLower === 'empire' || subtypeLower === 'ei' || subtypeLower === 'kingdom' || subtypeLower === 'dynasty') {
    return 'empire';
  }
  if (subtypeLower === 'religion' || subtypeLower === 'religious') {
    return 'religion';
  }
  if (subtypeLower === 'culture' || subtypeLower === 'cultural' || subtypeLower === 'art') {
    return 'culture';
  }
  if (subtypeLower === 'person' || subtypeLower === 'ps' || subtypeLower === 'people' || subtypeLower === 'leader') {
    return 'person';
  }
  
  // Default to 'other' for unknown subtypes
  return 'other';
}

/**
 * Creates a Date object from a year number.
 * Handles negative years (BCE) correctly.
 * Uses the same method as production: new Date(new Date(0, 1, 1).setFullYear(year))
 *
 * @param year - The year number (can be negative for BCE)
 * @returns A Date object set to February 1st of the given year (matches production)
 */
export function createDateFromYear(year: number): Date {
  // Match production method exactly: new Date(new Date(0, 1, 1).setFullYear(year))
  return new Date(new Date(0, 1, 1).setFullYear(year));
}

/**
 * Transforms an API response item to an EpicItem.
 * Requirements: 6.1
 *
 * @param apiItem - The raw API response item
 * @returns The transformed EpicItem
 */
export function transformApiResponseToEpicItem(apiItem: EpicApiResponse): EpicItem {
  const startYear = apiItem.data.start ?? apiItem.year ?? 0;
  const endYear = apiItem.data.end ?? startYear + 1;
  const title = apiItem.name ?? apiItem.data.title ?? apiItem._id;
  const wiki = apiItem.data.wiki ?? apiItem.wiki ?? '';

  return {
    id: apiItem._id,
    content: title,
    wiki,
    start: createDateFromYear(startYear),
    end: createDateFromYear(endYear),
    group: 1,
    subtype: apiItem.subtype,
    className: `timelineItem_${apiItem.subtype}`,
  };
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
   * Loads epic items from the API and stores them in state.
   * Fetches all epic types (wars, discoveries, persons) and transforms
   * the API response to EpicItem format.
   * Requirements: 6.1
   */
  loadEpicItems: async () => {
    try {
      console.log('[Timeline] Loading epic items from API...');
      
      // Fetch all epic items from the API
      // The response may include a battles-by-wars mapping object as the first element
      // when 'ew' subtype is included, so we use unknown[] and filter
      const response = await apiClient.get<unknown[]>(EPICS.GET_ALL);
      
      console.log('[Timeline] API response received, total items:', Array.isArray(response) ? response.length : 0);
      
      // Filter out any non-epic objects (like the battles-by-wars mapping)
      // and transform to EpicItem format
      const epicItems = response
        .filter((item): item is EpicApiResponse => 
          item !== null && 
          typeof item === 'object' && 
          '_id' in item && 
          'subtype' in item &&
          'data' in item
        )
        .map(transformApiResponseToEpicItem);
      
      console.log('[Timeline] Transformed epic items:', epicItems.length);
      if (epicItems.length > 0) {
        console.log('[Timeline] Sample epic item:', epicItems[0]);
      }
      
      set({ epicItems });
    } catch (error) {
      // Log error but don't throw - set empty array on failure
      console.error('[Timeline] Failed to load epic items:', error);
      set({ epicItems: [] });
    }
  },

  /**
   * Sets the filter state for a specific epic type.
   * Requirements: 7.3, 7.4
   *
   * @param type - The epic type to filter
   * @param enabled - Whether the type should be visible
   */
  setEpicFilter: (type: EpicType, enabled: boolean) => {
    set((state) => ({
      epicFilters: {
        ...state.epicFilters,
        [type]: enabled,
      },
    }));
  },

  /**
   * Sets all epic filters to the same value.
   * Requirements: 7.3, 7.4
   *
   * @param enabled - Whether all types should be visible
   */
  setAllEpicFilters: (enabled: boolean) => {
    set({
      epicFilters: {
        war: enabled,
        empire: enabled,
        religion: enabled,
        culture: enabled,
        person: enabled,
        other: enabled,
      },
    });
  },

  /**
   * Returns epic items filtered by the current filter state.
   * Maps epic subtypes to EpicType categories.
   * Requirements: 7.3
   *
   * @returns Filtered array of epic items
   */
  getFilteredEpicItems: (): EpicItem[] => {
    const { epicItems, epicFilters } = get();
    
    return epicItems.filter((item) => {
      // Map subtype to EpicType category
      const epicType = mapSubtypeToEpicType(item.subtype);
      return epicFilters[epicType];
    });
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
