/**
 * YearNotification Component
 *
 * Displays the current year as a notification badge at the top center of the map.
 * Shows BC/AD indicator and auto-hides after 6 seconds.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
 */

import type React from 'react';
import { useEffect, useRef, useCallback } from 'react';
import styles from './YearNotification.module.css';

/**
 * Auto-hide delay in milliseconds
 * Requirement 4.5: THE YearNotification SHALL auto-hide after 6 seconds
 */
const AUTO_HIDE_DELAY = 6000;

/**
 * YearNotification component props
 */
export interface YearNotificationProps {
  /** Current selected year */
  year: number;
  /** Whether the notification is visible */
  isVisible: boolean;
  /** Callback when notification should hide */
  onHide: () => void;
  /** Optional CSS class name */
  className?: string;
}

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
    value: absYear.toLocaleString(),
    era,
  };
}

/**
 * YearNotification Component
 *
 * Displays the current year as a notification badge at the top center of the map.
 * - Shows year with BC/AD indicator
 * - Slides down from top when visible
 * - Auto-hides after 6 seconds
 * - Uses theme colors for styling
 *
 * @param props - YearNotification component props
 * @returns YearNotification React component
 */
export const YearNotification: React.FC<YearNotificationProps> = ({
  year,
  isVisible,
  onHide,
  className,
}) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear timer on unmount
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Set up auto-hide timer when visible
  // Requirement 4.5: THE YearNotification SHALL auto-hide after 6 seconds
  useEffect(() => {
    if (isVisible) {
      clearTimer();
      timerRef.current = setTimeout(() => {
        onHide();
      }, AUTO_HIDE_DELAY);
    }

    return clearTimer;
  }, [isVisible, onHide, clearTimer]);

  // Reset timer when year changes while visible
  useEffect(() => {
    if (isVisible) {
      clearTimer();
      timerRef.current = setTimeout(() => {
        onHide();
      }, AUTO_HIDE_DELAY);
    }
  }, [year, isVisible, onHide, clearTimer]);

  // Format year for display
  const { value: yearValue, era } = formatYearWithEra(year);

  // Build container class names
  const containerClasses = [
    styles['yearNotification'],
    isVisible ? styles['visible'] : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={containerClasses}
      data-testid="year-notification"
      role="status"
      aria-live="polite"
      aria-hidden={!isVisible}
    >
      <span className={styles['yearValue']} data-testid="year-value">
        {yearValue}
      </span>
      <span className={styles['yearEra']} data-testid="year-era">
        ({era})
      </span>
    </div>
  );
};

export default YearNotification;
