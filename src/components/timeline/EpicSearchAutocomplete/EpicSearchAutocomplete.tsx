/**
 * EpicSearchAutocomplete Component
 *
 * Autocomplete input for searching epics by name.
 * Displays epic name and start year in results, with case-insensitive filtering.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7
 */

import type React from 'react';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { EpicItem } from '../../../stores/timelineStore';
import { dateToYear } from '../../../utils/yearUtils';
import styles from './EpicSearchAutocomplete.module.css';

/**
 * Maximum number of search results to display (Requirement 8.7)
 */
export const MAX_SEARCH_RESULTS = 200;

/**
 * Padding in years to add on each side when navigating to an epic (Requirement 8.5)
 */
export const EPIC_NAVIGATION_PADDING = 100;

/**
 * EpicSearchAutocomplete component props
 */
export interface EpicSearchAutocompleteProps {
  /** Available epics to search */
  epics: EpicItem[];
  /** Callback when an epic is selected */
  onSelect: (epic: EpicItem, startYear: number, endYear: number) => void;
  /** Callback when search is closed */
  onClose: () => void;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Search result item with computed year
 */
interface SearchResultItem {
  epic: EpicItem;
  startYear: number;
  endYear: number;
}

/**
 * Close Icon Component
 */
const CloseIcon: React.FC = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/**
 * Search Icon Component
 */
const SearchIcon: React.FC = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

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

/**
 * Formats a year for display, handling negative years
 *
 * @param year - Year to format
 * @returns Formatted year string
 */
function formatYear(year: number): string {
  if (year < 0) {
    return `${String(Math.abs(year))} BCE`;
  }
  return `${String(year)} CE`;
}

/**
 * EpicSearchAutocomplete Component
 *
 * An autocomplete input for searching historical epics.
 * - Provides autocomplete input for searching epics (Requirement 8.1)
 * - Filters epics by name as user types (Requirement 8.2)
 * - Displays epic name and start year in results (Requirement 8.3)
 * - Selecting an epic navigates timeline to that epic's date range (Requirement 8.4)
 * - Navigation includes 100 year padding on each side (Requirement 8.5)
 * - Case-insensitive filtering (Requirement 8.6)
 * - Results limited to 200 items (Requirement 8.7)
 *
 * @param props - EpicSearchAutocomplete component props
 * @returns EpicSearchAutocomplete React component
 */
export const EpicSearchAutocomplete: React.FC<EpicSearchAutocompleteProps> = ({
  epics,
  onSelect,
  onClose,
  className,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter epics based on query (Requirement 8.2, 8.6, 8.7)
  const filteredResults = useMemo(() => {
    return filterEpics(epics, query);
  }, [epics, query]);

  // Determine if results should be visible
  const isResultsVisible = filteredResults.length > 0;

  // Auto-focus input on mount
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timeoutId);
  }, []);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [filteredResults.length]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Handle input change
  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(event.target.value);
    },
    []
  );

  // Handle epic selection (Requirement 8.4, 8.5)
  const handleSelectEpic = useCallback(
    (result: SearchResultItem) => {
      const { paddedStart, paddedEnd } = calculateNavigationRange(
        result.startYear,
        result.endYear
      );
      onSelect(result.epic, paddedStart, paddedEnd);
    },
    [onSelect]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!isResultsVisible || filteredResults.length === 0) {
        return;
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredResults.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredResults.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < filteredResults.length) {
            const selectedResult = filteredResults[selectedIndex];
            if (selectedResult) {
              handleSelectEpic(selectedResult);
            }
          }
          break;
        case 'Tab':
          // Allow tab to close and move focus
          onClose();
          break;
      }
    },
    [isResultsVisible, filteredResults, selectedIndex, handleSelectEpic, onClose]
  );

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[
        selectedIndex
      ] as HTMLElement | undefined;
      selectedElement?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex]);

  // Handle result item click
  const handleResultClick = useCallback(
    (result: SearchResultItem) => {
      handleSelectEpic(result);
    },
    [handleSelectEpic]
  );

  // Handle clear button click
  const handleClear = useCallback(() => {
    setQuery('');
    inputRef.current?.focus();
  }, []);

  const containerClasses = [styles['epicSearchAutocomplete'], className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      data-testid="epic-search-autocomplete"
      role="combobox"
      aria-expanded={isResultsVisible}
      aria-haspopup="listbox"
      aria-owns="epic-search-results"
    >
      {/* Search input container */}
      <div className={styles['inputContainer']}>
        <span className={styles['searchIcon']}>
          <SearchIcon />
        </span>
        <input
          ref={inputRef}
          type="text"
          className={styles['searchInput']}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Search epics..."
          aria-label="Search epics"
          aria-autocomplete="list"
          aria-controls="epic-search-results"
          aria-activedescendant={
            selectedIndex >= 0 ? `epic-result-${String(selectedIndex)}` : undefined
          }
          data-testid="epic-search-input"
        />
        {query && (
          <button
            type="button"
            className={styles['clearButton']}
            onClick={handleClear}
            aria-label="Clear search"
            data-testid="epic-search-clear"
          >
            <CloseIcon />
          </button>
        )}
        <button
          type="button"
          className={styles['closeButton']}
          onClick={onClose}
          aria-label="Close search"
          data-testid="epic-search-close"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Search results dropdown (Requirement 8.3) */}
      {filteredResults.length > 0 && (
        <ul
          ref={resultsRef}
          id="epic-search-results"
          className={styles['resultsList']}
          role="listbox"
          aria-label="Search results"
          data-testid="epic-search-results"
        >
          {filteredResults.map((result, index) => (
            <li
              key={result.epic.id}
              id={`epic-result-${String(index)}`}
              className={[
                styles['resultItem'],
                index === selectedIndex ? styles['selected'] : '',
              ]
                .filter(Boolean)
                .join(' ')}
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => handleResultClick(result)}
              onMouseEnter={() => setSelectedIndex(index)}
              data-testid={`epic-result-${String(index)}`}
            >
              {/* Epic name (Requirement 8.3) */}
              <span className={styles['epicName']}>{result.epic.content}</span>
              {/* Start year (Requirement 8.3) */}
              <span className={styles['epicYear']}>
                {formatYear(result.startYear)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* No results message */}
      {query.trim() && filteredResults.length === 0 && (
        <div
          className={styles['noResults']}
          role="status"
          aria-live="polite"
          data-testid="epic-search-no-results"
        >
          No epics found matching "{query}"
        </div>
      )}

      {/* Results count indicator */}
      {filteredResults.length > 0 && (
        <div className={styles['resultsCount']} aria-live="polite">
          {filteredResults.length === MAX_SEARCH_RESULTS
            ? `Showing first ${String(MAX_SEARCH_RESULTS)} results`
            : `${String(filteredResults.length)} result${filteredResults.length === 1 ? '' : 's'}`}
        </div>
      )}
    </div>
  );
};

export default EpicSearchAutocomplete;
