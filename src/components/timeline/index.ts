/**
 * Timeline Components Barrel Export
 */

export { Timeline, TIMELINE_HEIGHT_COLLAPSED, TIMELINE_HEIGHT_EXPANDED } from './Timeline';
export type { TimelineProps } from './Timeline';

export { VisTimelineWrapper } from './VisTimelineWrapper';
export type {
  VisTimelineWrapperProps,
  VisTimelineRef,
  TimelineOptions,
  TimelineItem,
  TimelineGroup,
  TimelineClickEvent,
  TimelineMouseEvent,
} from './VisTimelineWrapper';

export { YearDisplay } from './YearDisplay';
export type { YearDisplayProps } from './YearDisplay';

export { TimelineControls } from './TimelineControls';
export type { TimelineControlsProps } from './TimelineControls';

export { YearDialog } from './YearDialog';
export type { YearDialogProps } from './YearDialog';

export {
  EpicSearchAutocomplete,
  filterEpics,
  calculateNavigationRange,
  MAX_SEARCH_RESULTS,
  EPIC_NAVIGATION_PADDING,
} from './EpicSearchAutocomplete';
export type { EpicSearchAutocompleteProps } from './EpicSearchAutocomplete';

export {
  AutoplayMenu,
  DEFAULT_START_YEAR,
  DEFAULT_END_YEAR,
  DEFAULT_STEP_SIZE,
  DEFAULT_DELAY_SECONDS,
  DEFAULT_REPEAT,
  MIN_STEP_SIZE,
  MAX_STEP_SIZE,
  MIN_DELAY_SECONDS,
  MAX_DELAY_SECONDS,
} from './AutoplayMenu';
export type { AutoplayMenuProps } from './AutoplayMenu';

// Timeline configuration
export {
  MIN_YEAR,
  MAX_YEAR,
  EXTENDED_MIN_YEAR,
  EXTENDED_MAX_YEAR,
  MIN_VISIBLE_YEARS,
  ZOOM_MIN_MS,
  ZOOM_MAX_MS,
  DEFAULT_YEAR,
  DEFAULT_VIEW_START_YEAR,
  DEFAULT_VIEW_END_YEAR,
  yearToISOString,
  getCollapsedTimelineOptions,
  getExpandedTimelineOptions,
  getTimelineOptions,
} from './timelineConfig';
