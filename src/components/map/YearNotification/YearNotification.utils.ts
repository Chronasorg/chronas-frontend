/**
 * YearNotification Utility Functions
 *
 * Year formatting with era indicators.
 * Extracted from YearNotification.tsx to satisfy react-refresh/only-export-components.
 */

/**
 * Formats a year value for display with BC/AD indicator.
 * Requirement 4.2: THE YearNotification SHALL display "(BC)" for negative years
 * Requirement 4.3: THE YearNotification SHALL display "(AD)" for positive years
 * Requirement 4.4: THE YearNotification SHALL display the absolute year value
 *
 * @param year - The year value (negative for BC, positive for AD)
 * @returns Formatted year string with era indicator
 */
export function formatYearWithEra(year: number): { value: string; era: string } {
  if (!Number.isFinite(year)) {
    return { value: '0', era: '' };
  }

  const absYear = Math.abs(Math.round(year));
  const era = year < 0 ? 'BC' : 'AD';

  return {
    value: absYear.toLocaleString('en'),
    era,
  };
}
