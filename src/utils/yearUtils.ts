/**
 * Year Utility Functions
 *
 * Provides utility functions for year manipulation, validation, and formatting
 * used throughout the timeline component.
 *
 * Requirements: 2.6, 5.4
 */

import { MIN_YEAR, MAX_YEAR, DEFAULT_YEAR } from '../stores/timelineStore';

/**
 * Clamps a year value to the valid range [-2000, 2000]
 *
 * @param year - The year value to clamp
 * @returns The clamped year value within the valid range
 *
 * @example
 * clampYear(2500)  // returns 2000
 * clampYear(-3000) // returns -2000
 * clampYear(1500)  // returns 1500
 * clampYear(NaN)   // returns 1000 (DEFAULT_YEAR)
 */
export function clampYear(year: number): number {
  if (!Number.isFinite(year)) {
    return DEFAULT_YEAR;
  }
  return Math.max(MIN_YEAR, Math.min(MAX_YEAR, Math.round(year)));
}

/**
 * Validates if a year is within the valid range [-2000, 2000]
 *
 * @param year - The year value to validate
 * @returns true if the year is a finite number within the valid range
 *
 * @example
 * isValidYear(1500)  // returns true
 * isValidYear(-2000) // returns true
 * isValidYear(2001)  // returns false
 * isValidYear(NaN)   // returns false
 */
export function isValidYear(year: number): boolean {
  return Number.isFinite(year) && year >= MIN_YEAR && year <= MAX_YEAR;
}

/**
 * Formats a year for display, handling negative years appropriately.
 *
 * Negative years are displayed with a minus sign prefix.
 * Positive years are displayed as-is.
 *
 * @param year - The year value to format
 * @returns The formatted year string
 *
 * @example
 * formatYearForDisplay(1500)  // returns "1500"
 * formatYearForDisplay(-500)  // returns "-500"
 * formatYearForDisplay(0)     // returns "0"
 * formatYearForDisplay(-2000) // returns "-2000"
 */
export function formatYearForDisplay(year: number): string {
  // Round to handle any floating point values
  const roundedYear = Math.round(year);
  return roundedYear.toString();
}

/**
 * Extracts the year from a Date object.
 *
 * Uses getFullYear() which correctly handles years before year 0
 * (negative years in JavaScript Date).
 *
 * @param date - The Date object to extract the year from
 * @returns The year as a number
 *
 * @example
 * dateToYear(new Date('2000-06-15')) // returns 2000
 * dateToYear(new Date('0500-01-01')) // returns 500
 */
export function dateToYear(date: Date): number {
  return date.getFullYear();
}

/**
 * Converts a year to a Date object (January 1st of that year).
 *
 * Creates a Date object representing January 1st, 00:00:00 of the given year.
 * Handles negative years (BCE) correctly using setFullYear().
 *
 * @param year - The year to convert
 * @returns A Date object representing January 1st of the given year
 *
 * @example
 * yearToDate(2000) // returns Date for 2000-01-01
 * yearToDate(-500) // returns Date for 500 BCE (year -500)
 * yearToDate(0)    // returns Date for year 0
 */
export function yearToDate(year: number): Date {
  // Create a date and use setFullYear to handle years correctly
  // This is necessary because new Date(year, 0, 1) treats years 0-99 as 1900-1999
  const date = new Date(0);
  date.setFullYear(year, 0, 1); // January 1st
  date.setHours(0, 0, 0, 0);
  return date;
}

// Re-export constants for convenience
export { MIN_YEAR, MAX_YEAR, DEFAULT_YEAR };
