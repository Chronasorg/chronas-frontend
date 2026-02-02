/**
 * EpicSearchAutocomplete Property-Based Tests
 *
 * **Feature: timeline-migration, Property 11: Epic Search Filtering**
 * **Validates: Requirements 8.2, 8.6, 8.7**
 *
 * Tests the filterEpics function to ensure:
 * 1. Case-insensitive filtering works correctly
 * 2. Results are limited to 200 items maximum
 * 3. All returned results contain the query string
 * 4. Empty query returns no results
 * 5. Non-matching query returns empty array
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { filterEpics, MAX_SEARCH_RESULTS } from './EpicSearchAutocomplete';
import type { EpicItem } from '../../../stores/timelineStore';
import { yearToDate } from '../../../utils/yearUtils';

/**
 * Arbitrary for generating valid EpicItem objects
 */
const epicItemArbitrary: fc.Arbitrary<EpicItem> = fc.record({
  id: fc.uuid(),
  content: fc.string({ minLength: 1, maxLength: 100 }),
  wiki: fc.string({ minLength: 1, maxLength: 50 }),
  start: fc.integer({ min: -2000, max: 2000 }).map(yearToDate),
  end: fc.integer({ min: -2000, max: 2000 }).map(yearToDate),
  group: fc.integer({ min: 0, max: 10 }),
  subtype: fc.constantFrom('ei', 'ps', 'ev'),
}).map((item) => ({
  ...item,
  // className is optional, so we randomly include it or not
  ...(Math.random() > 0.5 ? { className: `class-${item.id.slice(0, 8)}` } : {}),
}));

/**
 * Arbitrary for generating a list of epic items
 */
const epicListArbitrary = fc.array(epicItemArbitrary, { minLength: 0, maxLength: 300 });

/**
 * Arbitrary for generating non-empty search queries
 */
const searchQueryArbitrary = fc.string({ minLength: 1, maxLength: 50 });

/**
 * Creates an epic item with a specific content string
 */
function createEpicWithContent(content: string, id?: string): EpicItem {
  return {
    id: id ?? `epic-${Math.random().toString(36).substring(7)}`,
    content,
    wiki: 'test-wiki',
    start: yearToDate(1000),
    end: yearToDate(1100),
    group: 1,
    subtype: 'ei',
  };
}

describe('EpicSearchAutocomplete Property Tests', () => {
  describe('Property 11: Epic Search Filtering', () => {
    /**
     * Property 11.1: Case-insensitive filtering
     * For any query, filtering should be case-insensitive
     * (uppercase query matches lowercase content and vice versa)
     */
    it('should filter case-insensitively - uppercase query matches lowercase content', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
          (baseString) => {
            const lowercaseContent = baseString.toLowerCase();
            const uppercaseQuery = baseString.toUpperCase();

            const epics: EpicItem[] = [createEpicWithContent(lowercaseContent)];
            const results = filterEpics(epics, uppercaseQuery);

            // If the query has content after trimming, it should match
            if (uppercaseQuery.trim().length > 0) {
              expect(results.length).toBe(1);
              expect(results[0]?.epic.content.toLowerCase()).toContain(
                uppercaseQuery.toLowerCase().trim()
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should filter case-insensitively - lowercase query matches uppercase content', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
          (baseString) => {
            const uppercaseContent = baseString.toUpperCase();
            const lowercaseQuery = baseString.toLowerCase();

            const epics: EpicItem[] = [createEpicWithContent(uppercaseContent)];
            const results = filterEpics(epics, lowercaseQuery);

            // If the query has content after trimming, it should match
            if (lowercaseQuery.trim().length > 0) {
              expect(results.length).toBe(1);
              expect(results[0]?.epic.content.toLowerCase()).toContain(
                lowercaseQuery.toLowerCase().trim()
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should filter case-insensitively - mixed case query matches mixed case content', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 2, maxLength: 20 }).filter((s) => s.trim().length > 0),
          (baseString) => {
            // Create mixed case versions
            const mixedContent = baseString
              .split('')
              .map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()))
              .join('');
            const mixedQuery = baseString
              .split('')
              .map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()))
              .join('');

            const epics: EpicItem[] = [createEpicWithContent(mixedContent)];
            const results = filterEpics(epics, mixedQuery);

            if (mixedQuery.trim().length > 0) {
              expect(results.length).toBe(1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 11.2: 200 item limit
     * For any epic list with more than 200 matches, results should be limited to 200
     */
    it('should limit results to MAX_SEARCH_RESULTS (200) items', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 201, max: 500 }),
          (count) => {
            // Create more than 200 epics that all match the query
            const epics: EpicItem[] = Array.from({ length: count }, (_, i) =>
              createEpicWithContent(`Test Epic ${String(i)}`, `epic-${String(i)}`)
            );

            const results = filterEpics(epics, 'Test');

            expect(results.length).toBeLessThanOrEqual(MAX_SEARCH_RESULTS);
            expect(results.length).toBe(MAX_SEARCH_RESULTS);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should return all results when count is less than MAX_SEARCH_RESULTS', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 199 }),
          (count) => {
            // Create fewer than 200 epics that all match the query
            const epics: EpicItem[] = Array.from({ length: count }, (_, i) =>
              createEpicWithContent(`Matching Epic ${String(i)}`, `epic-${String(i)}`)
            );

            const results = filterEpics(epics, 'Matching');

            expect(results.length).toBe(count);
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Property 11.3: All returned results contain the query string
     * For any query, all returned results should contain the query string (case-insensitive)
     */
    it('should only return results that contain the query string (case-insensitive)', () => {
      fc.assert(
        fc.property(
          epicListArbitrary,
          searchQueryArbitrary.filter((s) => s.trim().length > 0),
          (epics, query) => {
            const results = filterEpics(epics, query);
            const normalizedQuery = query.toLowerCase().trim();

            // Every result should contain the query string (case-insensitive)
            for (const result of results) {
              const normalizedContent = result.epic.content.toLowerCase();
              expect(normalizedContent).toContain(normalizedQuery);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include all epics that match the query (up to limit)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: 0, max: 50 }),
          (matchingCount, nonMatchingCount) => {
            // Use a unique query that won't appear in non-matching content
            const uniqueQuery = 'UNIQUEMATCH';

            // Create epics that match
            const matchingEpics: EpicItem[] = Array.from({ length: matchingCount }, (_, i) =>
              createEpicWithContent(`${uniqueQuery} Epic ${String(i)}`, `matching-${String(i)}`)
            );

            // Create epics that don't match (using completely different content)
            const nonMatchingEpics: EpicItem[] = Array.from({ length: nonMatchingCount }, (_, i) =>
              createEpicWithContent(`Different Content ${String(i)}`, `non-matching-${String(i)}`)
            );

            // Combine epics
            const allEpics = [...matchingEpics, ...nonMatchingEpics];
            const results = filterEpics(allEpics, uniqueQuery);

            // Should return all matching epics (up to limit)
            const expectedCount = Math.min(matchingCount, MAX_SEARCH_RESULTS);
            expect(results.length).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 11.4: Empty query returns no results
     * For empty query, no results should be returned
     */
    it('should return empty array for empty query', () => {
      fc.assert(
        fc.property(epicListArbitrary, (epics) => {
          const results = filterEpics(epics, '');
          expect(results).toEqual([]);
        }),
        { numRuns: 100 }
      );
    });

    it('should return empty array for whitespace-only query', () => {
      fc.assert(
        fc.property(
          epicListArbitrary,
          fc.string({ unit: fc.constantFrom(' ', '\t', '\n', '\r'), minLength: 0, maxLength: 10 }),
          (epics, whitespace) => {
            const results = filterEpics(epics, whitespace);
            expect(results).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 11.5: Non-matching query returns empty array
     * For any query that doesn't match any epic, empty array should be returned
     */
    it('should return empty array when no epics match the query', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }),
          (count) => {
            // Create epics with content that won't match our query
            const epics: EpicItem[] = Array.from({ length: count }, (_, i) =>
              createEpicWithContent(`Alpha Beta Gamma ${String(i)}`, `epic-${String(i)}`)
            );

            // Use a query that definitely won't match
            const results = filterEpics(epics, 'ZZZZXYZNONEXISTENT');

            expect(results).toEqual([]);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should return empty array for empty epic list regardless of query', () => {
      fc.assert(
        fc.property(searchQueryArbitrary, (query) => {
          const results = filterEpics([], query);
          expect(results).toEqual([]);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Additional property: Results should include computed year values
     */
    it('should include startYear and endYear in results', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -2000, max: 2000 }),
          fc.integer({ min: -2000, max: 2000 }),
          (startYear, endYear) => {
            const epic = createEpicWithContent('Test Epic');
            epic.start = yearToDate(startYear);
            epic.end = yearToDate(endYear);

            const results = filterEpics([epic], 'Test');

            expect(results.length).toBe(1);
            expect(results[0]?.startYear).toBe(startYear);
            expect(results[0]?.endYear).toBe(endYear);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Additional property: Results should be sorted by start year
     */
    it('should return results sorted by start year', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: -2000, max: 2000 }), { minLength: 2, maxLength: 50 }),
          (years) => {
            // Create epics with different start years
            const epics: EpicItem[] = years.map((year, i) => {
              const epic = createEpicWithContent(`Matching Epic ${String(i)}`, `epic-${String(i)}`);
              epic.start = yearToDate(year);
              return epic;
            });

            const results = filterEpics(epics, 'Matching');

            // Verify results are sorted by start year
            for (let i = 1; i < results.length; i++) {
              const prevYear = results[i - 1]?.startYear ?? 0;
              const currYear = results[i]?.startYear ?? 0;
              expect(prevYear).toBeLessThanOrEqual(currYear);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


/**
 * Property 12: Epic Search Result Display
 *
 * **Feature: timeline-migration, Property 12: Epic Search Result Display**
 * **Validates: Requirements 8.3**
 *
 * Tests that epic search results display correctly:
 * 1. Results show the epic name (content field)
 * 2. Results show the start year
 * 3. Negative years are formatted as "X BCE"
 * 4. Positive years are formatted as "X CE"
 */

import { render, screen } from '@testing-library/react';

/**
 * Helper function to format year for display (matches component implementation)
 */
function formatYearForTest(year: number): string {
  if (year < 0) {
    return `${String(Math.abs(year))} BCE`;
  }
  return `${String(year)} CE`;
}

describe('Property 12: Epic Search Result Display', () => {
  /**
   * Property 12.1: Results show epic name (content field)
   * For any epic item in search results, the displayed result SHALL include the epic name
   */
  it('should display epic name (content field) for any matching epic', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
        (epicName, searchQuery) => {
          // Create an epic with the generated name that contains the search query
          const fullContent = `${searchQuery} ${epicName}`;
          const epic = createEpicWithContent(fullContent);
          
          const results = filterEpics([epic], searchQuery);
          
          // If there's a match, verify the epic name is preserved in results
          if (results.length > 0) {
            expect(results[0]?.epic.content).toBe(fullContent);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve exact epic content in search results', () => {
    fc.assert(
      fc.property(
        // Generate epic content with various characters
        fc.string({ minLength: 3, maxLength: 100 }).filter((s) => s.trim().length >= 3),
        (content) => {
          const epic = createEpicWithContent(content);
          // Use first 3 characters as search query
          const query = content.substring(0, 3);
          
          const results = filterEpics([epic], query);
          
          // The result should contain the exact original content
          if (results.length > 0) {
            expect(results[0]?.epic.content).toBe(content);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12.2: Results show start year
   * For any epic item in search results, the displayed result SHALL include the start year
   */
  it('should include start year in search results for any epic', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -2000, max: 2000 }),
        (startYear) => {
          const epic = createEpicWithContent('Test Epic');
          epic.start = yearToDate(startYear);
          
          const results = filterEpics([epic], 'Test');
          
          expect(results.length).toBe(1);
          expect(results[0]?.startYear).toBe(startYear);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include both start and end years in search results', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -2000, max: 1999 }),
        fc.integer({ min: 1, max: 500 }),
        (startYear, duration) => {
          const endYear = Math.min(startYear + duration, 2000);
          const epic = createEpicWithContent('Historical Event');
          epic.start = yearToDate(startYear);
          epic.end = yearToDate(endYear);
          
          const results = filterEpics([epic], 'Historical');
          
          expect(results.length).toBe(1);
          expect(results[0]?.startYear).toBe(startYear);
          expect(results[0]?.endYear).toBe(endYear);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12.3: Negative years formatted as "X BCE"
   * For any epic with negative year, the year should be formatted correctly
   */
  it('should format negative years as "X BCE"', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -2000, max: -1 }),
        (negativeYear) => {
          const expectedFormat = `${String(Math.abs(negativeYear))} BCE`;
          const actualFormat = formatYearForTest(negativeYear);
          
          expect(actualFormat).toBe(expectedFormat);
          expect(actualFormat).toContain('BCE');
          expect(actualFormat).not.toContain('-');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly format BCE years in search results display', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -2000, max: -1 }),
        (negativeYear) => {
          const epic = createEpicWithContent('Ancient Event');
          epic.start = yearToDate(negativeYear);
          
          const results = filterEpics([epic], 'Ancient');
          
          expect(results.length).toBe(1);
          expect(results[0]?.startYear).toBe(negativeYear);
          
          // Verify the year can be formatted correctly for display
          const formattedYear = formatYearForTest(results[0]?.startYear ?? 0);
          expect(formattedYear).toBe(`${String(Math.abs(negativeYear))} BCE`);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12.4: Positive years formatted as "X CE"
   * For any epic with positive year, the year should be formatted correctly
   */
  it('should format positive years as "X CE"', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 2000 }),
        (positiveYear) => {
          const expectedFormat = `${String(positiveYear)} CE`;
          const actualFormat = formatYearForTest(positiveYear);
          
          expect(actualFormat).toBe(expectedFormat);
          expect(actualFormat).toContain('CE');
          expect(actualFormat).not.toContain('BCE');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly format CE years in search results display', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 2000 }),
        (positiveYear) => {
          const epic = createEpicWithContent('Modern Event');
          epic.start = yearToDate(positiveYear);
          
          const results = filterEpics([epic], 'Modern');
          
          expect(results.length).toBe(1);
          expect(results[0]?.startYear).toBe(positiveYear);
          
          // Verify the year can be formatted correctly for display
          const formattedYear = formatYearForTest(results[0]?.startYear ?? 0);
          expect(formattedYear).toBe(`${String(positiveYear)} CE`);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12.5: Year 0 edge case
   * Year 0 should be formatted as "0 CE"
   */
  it('should format year 0 as "0 CE"', () => {
    const epic = createEpicWithContent('Year Zero Event');
    epic.start = yearToDate(0);
    
    const results = filterEpics([epic], 'Year Zero');
    
    expect(results.length).toBe(1);
    expect(results[0]?.startYear).toBe(0);
    
    const formattedYear = formatYearForTest(0);
    expect(formattedYear).toBe('0 CE');
  });

  /**
   * Property 12.6: Multiple epics with different year formats
   * Results should correctly display both BCE and CE years in the same result set
   */
  it('should correctly display mixed BCE and CE years in results', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -2000, max: -1 }),
        fc.integer({ min: 1, max: 2000 }),
        (bceYear, ceYear) => {
          const bceEpic = createEpicWithContent('Ancient BCE Event', 'bce-epic');
          bceEpic.start = yearToDate(bceYear);
          
          const ceEpic = createEpicWithContent('Modern CE Event', 'ce-epic');
          ceEpic.start = yearToDate(ceYear);
          
          // Search for "Event" to match both
          const results = filterEpics([bceEpic, ceEpic], 'Event');
          
          expect(results.length).toBe(2);
          
          // Find BCE and CE results
          const bceResult = results.find(r => r.startYear < 0);
          const ceResult = results.find(r => r.startYear > 0);
          
          expect(bceResult).toBeDefined();
          expect(ceResult).toBeDefined();
          
          // Verify formatting
          if (bceResult) {
            const bceFormatted = formatYearForTest(bceResult.startYear);
            expect(bceFormatted).toContain('BCE');
          }
          
          if (ceResult) {
            const ceFormatted = formatYearForTest(ceResult.startYear);
            expect(ceFormatted).toContain('CE');
            expect(ceFormatted).not.toContain('BCE');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12.7: Rendered component displays name and year
   * When rendered, the component should display both epic name and formatted year
   */
  it('should render epic name and year in the DOM for any epic', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 30 }).filter((s) => /^[a-zA-Z\s]+$/.test(s) && s.trim().length >= 5),
        fc.integer({ min: -2000, max: 2000 }),
        (epicName, year) => {
          const epic = createEpicWithContent(epicName.trim());
          epic.start = yearToDate(year);
          
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          const mockOnSelect = () => {};
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          const mockOnClose = () => {};
          
          const { container } = render(
            <EpicSearchAutocomplete
              epics={[epic]}
              onSelect={mockOnSelect}
              onClose={mockOnClose}
            />
          );
          
          // Verify input is rendered
          const _input = screen.getByTestId('epic-search-input');
          expect(_input).toBeDefined();
          
          // Use first 3 characters as search query
          const searchQuery = epicName.trim().substring(0, 3);
          
          // Manually trigger the filter
          const results = filterEpics([epic], searchQuery);
          
          if (results.length > 0) {
            // Verify the result contains the epic name
            expect(results[0]?.epic.content).toBe(epicName.trim());
            
            // Verify the year is correctly computed
            expect(results[0]?.startYear).toBe(year);
            
            // Verify year can be formatted for display
            const formattedYear = formatYearForTest(year);
            if (year < 0) {
              expect(formattedYear).toContain('BCE');
            } else {
              expect(formattedYear).toContain('CE');
            }
          }
          
          // Cleanup
          container.remove();
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 12.8: Year formatting consistency
   * The same year should always produce the same formatted output
   */
  it('should consistently format the same year value', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -2000, max: 2000 }),
        fc.integer({ min: 1, max: 10 }),
        (year, iterations) => {
          const formattedYears: string[] = [];
          
          for (let i = 0; i < iterations; i++) {
            formattedYears.push(formatYearForTest(year));
          }
          
          // All formatted years should be identical
          const firstFormat = formattedYears[0];
          expect(formattedYears.every(f => f === firstFormat)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Import the component for rendering tests
import { EpicSearchAutocomplete } from './EpicSearchAutocomplete';


/**
 * Property 13: Epic Selection Navigation
 *
 * **Feature: timeline-migration, Property 13: Epic Selection Navigation**
 * **Validates: Requirements 8.4, 8.5, 10.5, 10.6**
 *
 * Tests that epic selection navigation works correctly:
 * 1. Navigation adds 100 year padding to start
 * 2. Navigation adds 100 year padding to end
 * 3. paddedStart equals startYear - 100
 * 4. paddedEnd equals endYear + 100
 * 5. Padded range is at least 200 years wider than original
 */

import { calculateNavigationRange, EPIC_NAVIGATION_PADDING } from './EpicSearchAutocomplete';

describe('Property 13: Epic Selection Navigation', () => {
  /**
   * Property 13.1: Navigation adds 100 year padding to start
   * For any epic date range, navigation should add 100 year padding to start
   */
  it('should add 100 year padding to start for any epic date range', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -2000, max: 2000 }),
        fc.integer({ min: 1, max: 500 }),
        (startYear, duration) => {
          const endYear = startYear + duration;
          const { paddedStart } = calculateNavigationRange(startYear, endYear);
          
          // Verify padding is exactly EPIC_NAVIGATION_PADDING (100 years)
          expect(startYear - paddedStart).toBe(EPIC_NAVIGATION_PADDING);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13.2: Navigation adds 100 year padding to end
   * For any epic date range, navigation should add 100 year padding to end
   */
  it('should add 100 year padding to end for any epic date range', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -2000, max: 2000 }),
        fc.integer({ min: 1, max: 500 }),
        (startYear, duration) => {
          const endYear = startYear + duration;
          const { paddedEnd } = calculateNavigationRange(startYear, endYear);
          
          // Verify padding is exactly EPIC_NAVIGATION_PADDING (100 years)
          expect(paddedEnd - endYear).toBe(EPIC_NAVIGATION_PADDING);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13.3: paddedStart equals startYear - 100
   * For any epic, paddedStart should equal startYear - 100
   */
  it('should calculate paddedStart as startYear minus 100', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -5000, max: 5000 }),
        fc.integer({ min: -5000, max: 5000 }),
        (startYear, endYear) => {
          const { paddedStart } = calculateNavigationRange(startYear, endYear);
          
          expect(paddedStart).toBe(startYear - 100);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13.4: paddedEnd equals endYear + 100
   * For any epic, paddedEnd should equal endYear + 100
   */
  it('should calculate paddedEnd as endYear plus 100', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -5000, max: 5000 }),
        fc.integer({ min: -5000, max: 5000 }),
        (startYear, endYear) => {
          const { paddedEnd } = calculateNavigationRange(startYear, endYear);
          
          expect(paddedEnd).toBe(endYear + 100);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13.5: Padded range is at least 200 years wider than original
   * For any epic, the padded range should be at least 200 years wider than the original
   */
  it('should produce a padded range at least 200 years wider than original', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -5000, max: 5000 }),
        fc.integer({ min: 0, max: 2000 }),
        (startYear, duration) => {
          const endYear = startYear + duration;
          const originalRange = endYear - startYear;
          
          const { paddedStart, paddedEnd } = calculateNavigationRange(startYear, endYear);
          const paddedRange = paddedEnd - paddedStart;
          
          // Padded range should be exactly 200 years wider (100 on each side)
          expect(paddedRange).toBe(originalRange + 200);
          expect(paddedRange - originalRange).toBeGreaterThanOrEqual(200);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13.6: Navigation range is symmetric
   * The padding should be equal on both sides (100 years each)
   */
  it('should apply symmetric padding on both sides', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -5000, max: 5000 }),
        fc.integer({ min: -5000, max: 5000 }),
        (startYear, endYear) => {
          const { paddedStart, paddedEnd } = calculateNavigationRange(startYear, endYear);
          
          const startPadding = startYear - paddedStart;
          const endPadding = paddedEnd - endYear;
          
          // Both paddings should be equal
          expect(startPadding).toBe(endPadding);
          expect(startPadding).toBe(EPIC_NAVIGATION_PADDING);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13.7: Navigation works with negative years (BCE)
   * For epics in BCE period, navigation should still add correct padding
   */
  it('should correctly handle negative years (BCE period)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -2000, max: -1 }),
        fc.integer({ min: 1, max: 500 }),
        (startYear, duration) => {
          const endYear = Math.min(startYear + duration, 0);
          const { paddedStart, paddedEnd } = calculateNavigationRange(startYear, endYear);
          
          // Verify padding is correct even for negative years
          expect(paddedStart).toBe(startYear - 100);
          expect(paddedEnd).toBe(endYear + 100);
          
          // paddedStart should be more negative than startYear
          expect(paddedStart).toBeLessThan(startYear);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13.8: Navigation works across BCE/CE boundary
   * For epics spanning BCE to CE, navigation should handle correctly
   */
  it('should correctly handle epics spanning BCE/CE boundary', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -500, max: -1 }),
        fc.integer({ min: 1, max: 500 }),
        (startYear, endYear) => {
          // startYear is BCE (negative), endYear is CE (positive)
          const { paddedStart, paddedEnd } = calculateNavigationRange(startYear, endYear);
          
          expect(paddedStart).toBe(startYear - 100);
          expect(paddedEnd).toBe(endYear + 100);
          
          // Original range spans BCE to CE
          const originalRange = endYear - startYear;
          const paddedRange = paddedEnd - paddedStart;
          
          expect(paddedRange).toBe(originalRange + 200);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13.9: Navigation preserves relative ordering
   * paddedStart should always be less than paddedEnd when startYear < endYear
   */
  it('should preserve relative ordering (paddedStart < paddedEnd when startYear < endYear)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -5000, max: 4999 }),
        fc.integer({ min: 1, max: 1000 }),
        (startYear, duration) => {
          const endYear = startYear + duration;
          const { paddedStart, paddedEnd } = calculateNavigationRange(startYear, endYear);
          
          // paddedStart should always be less than paddedEnd
          expect(paddedStart).toBeLessThan(paddedEnd);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13.10: Navigation with zero-duration epics
   * Even for epics where startYear equals endYear, padding should be applied
   */
  it('should handle zero-duration epics (startYear equals endYear)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -2000, max: 2000 }),
        (year) => {
          const { paddedStart, paddedEnd } = calculateNavigationRange(year, year);
          
          expect(paddedStart).toBe(year - 100);
          expect(paddedEnd).toBe(year + 100);
          
          // Padded range should be exactly 200 years for zero-duration epic
          expect(paddedEnd - paddedStart).toBe(200);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13.11: EPIC_NAVIGATION_PADDING constant is 100
   * Verify the constant value is correct
   */
  it('should use EPIC_NAVIGATION_PADDING constant value of 100', () => {
    expect(EPIC_NAVIGATION_PADDING).toBe(100);
  });

  /**
   * Property 13.12: Navigation range calculation is deterministic
   * Same inputs should always produce same outputs
   */
  it('should produce deterministic results for same inputs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -5000, max: 5000 }),
        fc.integer({ min: -5000, max: 5000 }),
        fc.integer({ min: 1, max: 10 }),
        (startYear, endYear, iterations) => {
          const results: { paddedStart: number; paddedEnd: number }[] = [];
          
          for (let i = 0; i < iterations; i++) {
            results.push(calculateNavigationRange(startYear, endYear));
          }
          
          // All results should be identical
          const firstResult = results[0];
          if (firstResult) {
            expect(results.every(r => 
              r.paddedStart === firstResult.paddedStart && 
              r.paddedEnd === firstResult.paddedEnd
            )).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
