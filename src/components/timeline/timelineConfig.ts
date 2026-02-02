/**
 * Timeline Configuration
 *
 * Default configuration values for the timeline component.
 * These values match the production chronas.org site.
 *
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

import type { TimelineOptions } from './VisTimelineWrapper';

/** Minimum year in the timeline range */
export const MIN_YEAR = -2000;

/** Maximum year in the timeline range */
export const MAX_YEAR = 2000;

/** Extended minimum for zoom out (allows some padding) */
export const EXTENDED_MIN_YEAR = -2500;

/** Extended maximum for zoom out (allows some padding) */
export const EXTENDED_MAX_YEAR = 2500;

/** Minimum visible range in years (maximum zoom in) */
export const MIN_VISIBLE_YEARS = 10;

/** Milliseconds per year (approximate) */
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

/** Minimum zoom level in milliseconds (10 years) */
export const ZOOM_MIN_MS = MIN_VISIBLE_YEARS * MS_PER_YEAR;

/** Maximum zoom level in milliseconds (full range: 5000 years) */
export const ZOOM_MAX_MS = (EXTENDED_MAX_YEAR - EXTENDED_MIN_YEAR) * MS_PER_YEAR;

/** Timeline height when collapsed (pixels) */
export const TIMELINE_HEIGHT_COLLAPSED = 120;

/** Timeline height when expanded (pixels) */
export const TIMELINE_HEIGHT_EXPANDED = 400;

/** Default selected year */
export const DEFAULT_YEAR = 1000;

/** Default start year for initial view */
export const DEFAULT_VIEW_START_YEAR = 500;

/** Default end year for initial view */
export const DEFAULT_VIEW_END_YEAR = 1500;

/**
 * Convert a year to an ISO date string
 * Handles negative years (BCE) correctly
 */
export function yearToISOString(year: number): string {
  // JavaScript Date handles years 0-99 specially, so we need to use setFullYear
  const date = new Date(0);
  date.setFullYear(year, 0, 1);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

/**
 * Get default timeline options for collapsed state
 */
export function getCollapsedTimelineOptions(): TimelineOptions {
  return {
    width: '100%',
    height: TIMELINE_HEIGHT_COLLAPSED,
    zoomMin: ZOOM_MIN_MS,
    zoomMax: ZOOM_MAX_MS,
    min: yearToISOString(EXTENDED_MIN_YEAR),
    max: yearToISOString(EXTENDED_MAX_YEAR),
    start: yearToISOString(DEFAULT_VIEW_START_YEAR),
    end: yearToISOString(DEFAULT_VIEW_END_YEAR),
    stack: false,
    showCurrentTime: false,
    editable: false,
    showMajorLabels: true,
    showMinorLabels: true,
    horizontalScroll: true,
    zoomable: true,
    moveable: true,
  };
}

/**
 * Get default timeline options for expanded state
 */
export function getExpandedTimelineOptions(): TimelineOptions {
  return {
    ...getCollapsedTimelineOptions(),
    height: TIMELINE_HEIGHT_EXPANDED,
    stack: true, // Enable stacking when expanded
  };
}

/**
 * Get timeline options based on expanded state
 */
export function getTimelineOptions(isExpanded: boolean): TimelineOptions {
  return isExpanded ? getExpandedTimelineOptions() : getCollapsedTimelineOptions();
}
