/**
 * YearDisplay Component
 *
 * Displays the current selected year and suggested year (from hover) near the year marker.
 * The year label is clickable to open the year dialog.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */

import type React from 'react';
import { formatYearForDisplay } from '../../../utils/yearUtils';
import styles from './YearDisplay.module.css';

/**
 * YearDisplay component props
 */
export interface YearDisplayProps {
  /** Currently selected year */
  selectedYear: number;
  /** Suggested year from hover (or null) */
  suggestedYear: number | null;
  /** Callback when year label is clicked */
  onYearClick: () => void;
  /** Whether the label is near the right edge */
  isNearEdge?: boolean;
}

/**
 * YearDisplay Component
 *
 * Displays the current and suggested year near the year marker.
 * - Year label: 28px font, text-shadow for readability
 * - Suggested year: 18px font, positioned above with arrow
 * - Suggested year fades in/out with 1s transition
 * - Position adjusts when near screen edge
 *
 * @param props - YearDisplay component props
 * @returns YearDisplay React component
 */
export const YearDisplay: React.FC<YearDisplayProps> = ({
  selectedYear,
  suggestedYear,
  onYearClick,
  isNearEdge = false,
}) => {
  // Format years for display
  const formattedSelectedYear = formatYearForDisplay(selectedYear);
  const formattedSuggestedYear = suggestedYear !== null
    ? formatYearForDisplay(suggestedYear)
    : null;

  // Determine if suggested year should be shown
  // Only show when different from selected year (Requirement 4.6)
  const showSuggestedYear = suggestedYear !== null && suggestedYear !== selectedYear;

  // Build container class names
  const containerClasses = [
    styles['yearDisplayContainer'],
    isNearEdge ? styles['nearEdge'] : '',
  ].filter(Boolean).join(' ');

  // Build suggested year class names
  const suggestedYearClasses = [
    styles['suggestedYear'],
    showSuggestedYear ? styles['visible'] : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={containerClasses}
      data-testid="year-display"
      data-near-edge={isNearEdge}
    >
      {/* Suggested year with arrow indicator (Requirement 4.1, 4.2, 4.3) */}
      <div
        className={suggestedYearClasses}
        data-testid="suggested-year"
        aria-hidden={!showSuggestedYear}
      >
        <span className={styles['suggestedYearText']}>
          {formattedSuggestedYear}
        </span>
        <span className={styles['arrowIndicator']} aria-hidden="true">
          ▼
        </span>
      </div>

      {/* Main year label - clickable to open dialog (Requirement 2.1, 2.3, 2.4) */}
      <button
        type="button"
        className={styles['yearLabel']}
        onClick={onYearClick}
        data-testid="year-label"
        aria-label={`Current year: ${formattedSelectedYear}. Click to search for a specific year.`}
      >
        {formattedSelectedYear}
      </button>
    </div>
  );
};

export default YearDisplay;
