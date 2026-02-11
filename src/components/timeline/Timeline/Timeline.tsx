/**
 * Timeline Component
 *
 * Main container component for the timeline navigation bar.
 * Fixed at the bottom of the viewport with expandable height.
 * Uses React Portal to render outside the main DOM hierarchy.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 6.2, 6.4, 6.5
 */

import type React from 'react';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTimelineStore } from '../../../stores/timelineStore';
import type { EpicItem } from '../../../stores/timelineStore';
import { useUIStore } from '../../../stores/uiStore';
import { TimelineControls } from '../TimelineControls/TimelineControls';
import { YearDialog } from '../YearDialog/YearDialog';
import { AutoplayMenu } from '../AutoplayMenu/AutoplayMenu';
import { VisTimelineWrapper, type TimelineItem, type TimelineGroup, type TimelineOptions, type VisTimelineRef, type TimelineClickEvent } from '../VisTimelineWrapper/VisTimelineWrapper';
import { YearMarkerLabel } from '../YearMarkerLabel';
import styles from './Timeline.module.css';

/**
 * Timeline groups configuration - matches production MapTimeline.js
 */
const TIMELINE_GROUPS: TimelineGroup[] = [{
  id: 1,
  content: 'Epics',
  className: 'timelineGroup_epics',
}];

/**
 * Timeline component props
 */
export interface TimelineProps {
  /** Epic items to display on the timeline */
  epicItems?: EpicItem[];
  /** Callback when an epic is selected */
  onEpicSelect?: (epic: EpicItem) => void;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Timeline heights in pixels
 */
export const TIMELINE_HEIGHT_COLLAPSED = 120;
export const TIMELINE_HEIGHT_EXPANDED = 400;

/**
 * Timeline Component
 *
 * The main container component that orchestrates all timeline functionality.
 * - Fixed position at bottom of viewport
 * - Height transitions between 120px (collapsed) and 400px (expanded)
 * - Contains all sub-components
 * - Manages vis.js timeline instance lifecycle
 *
 * @param props - Timeline component props
 * @returns Timeline React component
 */
export const Timeline: React.FC<TimelineProps> = ({
  epicItems: _epicItems,
  onEpicSelect,
  className,
}) => {
  const {
    selectedYear,
    suggestedYear,
    isExpanded,
    isAutoplayActive,
    autoplayConfig,
    toggleExpanded,
    setYear,
    setAutoplayConfig,
    startAutoplay,
    getFilteredEpicItems,
    epicItems, // Subscribe to epicItems to trigger re-render when loaded
  } = useTimelineStore();

  // Get openRightDrawer from uiStore for epic click handling
  // Requirements: 6.3
  const openRightDrawer = useUIStore((state) => state.openRightDrawer);

  // Ref for the vis-timeline wrapper
  const timelineRef = useRef<VisTimelineRef>(null);

  // Local state for dialogs/menus
  const [isYearDialogOpen, setIsYearDialogOpen] = useState(false);
  const [isAutoplayMenuOpen, setIsAutoplayMenuOpen] = useState(false);
  const [isDefaultView, setIsDefaultView] = useState(true);

  /**
   * Transform EpicItem to TimelineItem format
   * Requirements: 6.2, 6.4, 6.5
   */
  const transformEpicToTimelineItem = useCallback((epic: EpicItem): TimelineItem => {
    return {
      id: epic.id,
      content: epic.content,
      start: epic.start,
      end: epic.end,
      group: epic.group,
      type: 'range',
      className: epic.className ?? `timelineItem_${epic.subtype}`,
      title: epic.content, // Tooltip text
    };
  }, []);

  /**
   * Get filtered epic items and transform to TimelineItem format
   * Requirements: 6.2, 6.4, 6.5
   */
  const timelineItems = useMemo((): TimelineItem[] => {
    const filteredEpics = getFilteredEpicItems();
    console.log('[Timeline] Filtered epic items count:', filteredEpics.length);
    const items = filteredEpics.map(transformEpicToTimelineItem);
    if (items.length > 0) {
      console.log('[Timeline] Sample timeline item:', items[0]);
    }
    return items;
  }, [getFilteredEpicItems, transformEpicToTimelineItem, epicItems]); // Include epicItems to trigger recompute

  /**
   * Timeline options configuration
   * Matches production MapTimeline.js settings
   */
  const timelineOptions = useMemo((): TimelineOptions => ({
    width: '100%',
    height: isExpanded ? TIMELINE_HEIGHT_EXPANDED - 20 : TIMELINE_HEIGHT_COLLAPSED - 20,
    // Production uses -2500 to 2500 range
    min: '-002500-01-01',
    max: '2500-01-01',
    // Start with a wide view showing ~2600 years (from -550 BC to 2050 AD like production)
    start: '-000550-01-05',
    end: '2050-04-01',
    // zoomMin prevents zooming in too much - 315360000000ms = ~10 years
    // This ensures we always see years, not months
    zoomMin: 315360000000,
    stack: isExpanded, // Only stack items when expanded (like production)
    showCurrentTime: false,
    editable: false,
    showMajorLabels: true,
    showMinorLabels: true,
    horizontalScroll: true,
    zoomable: true,
    moveable: true,
  }), [isExpanded]);

  /**
   * Custom time marker for current year
   * Uses 'selectedYear' as the ID to match production CSS class .vis-custom-time.selectedYear
   */
  const customTimes = useMemo(() => ({
    selectedYear: new Date(new Date(0, 1, 1).setFullYear(selectedYear)).toISOString(),
  }), [selectedYear]);

  /**
   * Handle epic item click
   * Requirements: 6.3
   * Opens the right drawer with the epic's Wikipedia article
   */
  const handleEpicClick = useCallback((event: TimelineClickEvent) => {
    if (event.item) {
      // Find the clicked epic item
      const filteredEpics = getFilteredEpicItems();
      const clickedEpic = filteredEpics.find(epic => epic.id === event.item);
      if (clickedEpic) {
        // Call optional callback if provided
        if (onEpicSelect) {
          onEpicSelect(clickedEpic);
        }
        
        // Open right drawer with epic content if wiki URL is available
        // Requirements: 6.3 - WHEN an epic item is clicked, THE UIStore SHALL open the right drawer
        if (clickedEpic.wiki) {
          openRightDrawer({
            type: 'epic',
            epicId: clickedEpic.id,
            epicName: clickedEpic.content,
            wikiUrl: clickedEpic.wiki,
          });
        }
      }
    }
  }, [getFilteredEpicItems, onEpicSelect, openRightDrawer]);

  /**
   * Handle timeline click (not on an item) - set year
   */
  const handleTimelineClick = useCallback((event: TimelineClickEvent) => {
    if (!event.item) {
      const clickedYear = event.time.getFullYear();
      setYear(clickedYear);
      setIsDefaultView(false);
    }
  }, [setYear]);

  // Handlers
  const handleToggleExpand = useCallback(() => {
    toggleExpanded();
  }, [toggleExpanded]);

  const handleReset = useCallback(() => {
    setYear(1000);
    setIsDefaultView(true);
  }, [setYear]);

  const handleSearchOpen = useCallback(() => {
    setIsYearDialogOpen(true);
  }, []);

  const handleAutoplayOpen = useCallback(() => {
    setIsAutoplayMenuOpen((prev) => !prev);
  }, []);

  const handleYearDialogClose = useCallback(() => {
    setIsYearDialogOpen(false);
  }, []);

  const handleYearDialogSubmit = useCallback((year: number) => {
    setYear(year);
    setIsYearDialogOpen(false);
    setIsDefaultView(false);
  }, [setYear]);

  const handleYearClick = useCallback(() => {
    setIsYearDialogOpen(true);
  }, []);

  const handleAutoplayMenuClose = useCallback(() => {
    setIsAutoplayMenuOpen(false);
  }, []);

  const handleAutoplayStart = useCallback(() => {
    startAutoplay();
    setIsAutoplayMenuOpen(false);
  }, [startAutoplay]);

  // Create portal container for timeline
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Create a container for the timeline portal
    let container = document.getElementById('timeline-portal');
    if (!container) {
      container = document.createElement('div');
      container.id = 'timeline-portal';
      container.style.position = 'relative';
      container.style.zIndex = '350';
      document.body.appendChild(container);
    }
    setPortalContainer(container);

    return () => {
      // Don't remove the container on unmount as it may be reused
    };
  }, []);

  // Determine the current height based on expanded state
  const currentHeight = isExpanded ? TIMELINE_HEIGHT_EXPANDED : TIMELINE_HEIGHT_COLLAPSED;

  // Build class names safely
  const timelineClass = styles['timeline'] ?? '';
  const expandedClass = styles['expanded'] ?? '';
  const collapsedClass = styles['collapsed'] ?? '';
  const stateClass = isExpanded ? expandedClass : collapsedClass;
  const combinedClassName = `${timelineClass} ${stateClass} ${className ?? ''}`.trim();

  const timelineContent = (
    <div
      data-testid="timeline"
      data-year={selectedYear}
      data-expanded={isExpanded}
      className={combinedClassName}
      style={{ height: `${String(currentHeight)}px` }}
      role="navigation"
      aria-label="Timeline navigation"
    >
      <div className={styles['content']}>
        {/* Timeline controls (Requirement 6.1-6.10) */}
        <TimelineControls
          isExpanded={isExpanded}
          isDefaultView={isDefaultView}
          onToggleExpand={handleToggleExpand}
          onReset={handleReset}
          onSearchOpen={handleSearchOpen}
          onAutoplayOpen={handleAutoplayOpen}
          isAutoplayActive={isAutoplayActive}
        />

        {/* Vis.js Timeline with epic items (Requirements 6.2, 6.4, 6.5) */}
        <VisTimelineWrapper
          ref={timelineRef}
          options={timelineOptions}
          items={timelineItems}
          groups={TIMELINE_GROUPS}
          customTimes={customTimes}
          onClick={handleEpicClick}
          onTimelineClick={handleTimelineClick}
          className={styles['visTimeline'] ?? ''}
        />

        {/* Year label on the red marker (like production) */}
        <YearMarkerLabel
          selectedYear={selectedYear}
          suggestedYear={suggestedYear}
          onYearClick={handleYearClick}
        />

        {/* Autoplay menu (Requirement 9.1-9.7) */}
        {isAutoplayMenuOpen && (
          <AutoplayMenu
            config={autoplayConfig}
            onConfigChange={setAutoplayConfig}
            onStart={handleAutoplayStart}
            onClose={handleAutoplayMenuClose}
          />
        )}
      </div>

      {/* Year dialog (Requirement 7.1-7.10) */}
      <YearDialog
        isOpen={isYearDialogOpen}
        onClose={handleYearDialogClose}
        onSubmit={handleYearDialogSubmit}
        initialYear={selectedYear}
      />
    </div>
  );

  // Use portal to render timeline outside the main DOM hierarchy
  if (!portalContainer) {
    return null;
  }

  return createPortal(timelineContent, portalContainer);
};

export default Timeline;
