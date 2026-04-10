/**
 * EpicSearchAutocomplete Utility Functions and Constants
 *
 * Filtering, navigation range calculation, and constants for epic search.
 * Extracted from EpicSearchAutocomplete.tsx to satisfy react-refresh/only-export-components.
 */

import type { EpicItem } from '../../../stores/timelineStore';
import { dateToYear } from '../../../utils/yearUtils';

/**
 * Maximum number of search results to display (Requirement 8.7)
 */
export const MAX_SEARCH_RESULTS = 200;

/**
 * Padding in years to add on each side when navigating to an epic (Requirement 8.5)
 */
export const EPIC_NAVIGATION_PADDING = 100;

/**
 * Search result item with computed year
 */
export interface SearchResultItem {
  epic: EpicItem;
  startYear: number;
  endYear: number;
}

/**
 * Filters epics by search query (case-insensitive)
 * Returns at most MAX_SEARCH_RESULTS items
 *
 * @param epics - Array of epic items to filter
 * @param query - Search query string
 * @returns Filtered array of search result items
 */
export function filterEpics(epics: EpicItem[], query: string): SearchResultItem[] {
  if (!query.trim()) {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();

  const filtered = epics
    .filter((epic) => {
      // Case-insensitive search on content/name (Requirement 8.6)
      const name = epic.content || '';
      return name.toLowerCase().includes(normalizedQuery);
    })
    .map((epic) => ({
      epic,
      startYear: dateToYear(epic.start),
      endYear: dateToYear(epic.end),
    }))
    // Sort by start year for consistent ordering
    .sort((a, b) => a.startYear - b.startYear);

  // Limit results to MAX_SEARCH_RESULTS (Requirement 8.7)
  return filtered.slice(0, MAX_SEARCH_RESULTS);
}

/**
 * Calculates the navigation range for an epic with padding
 *
 * @param startYear - Epic start year
 * @param endYear - Epic end year
 * @returns Object with padded start and end years
 */
export function calculateNavigationRange(
  startYear: number,
  endYear: number
): { paddedStart: number; paddedEnd: number } {
  // Add 100 year padding on each side (Requirement 8.5)
  return {
    paddedStart: startYear - EPIC_NAVIGATION_PADDING,
    paddedEnd: endYear + EPIC_NAVIGATION_PADDING,
  };
}
