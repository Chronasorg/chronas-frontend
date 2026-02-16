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
import { useTimelineStore, fetchEpicCoordinates } from '../../../stores/timelineStore';
import type { EpicItem } from '../../../stores/timelineStore';
import { useUIStore } from '../../../stores/uiStore';
import { useMapStore } from '../../../stores/mapStore';
import { TimelineControls } from '../TimelineControls/TimelineControls';
import { YearDialog } from '../YearDialog/YearDialog';
import { AutoplayMenu } from '../AutoplayMenu/AutoplayMenu';
import { EpicSearchAutocomplete } from '../EpicSearchAutocomplete/EpicSearchAutocomplete';
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
export const TIMELINE_HEIGHT_COLLAPSED = 132;
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
    stopAutoplay,
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
  const [isEpicSearchOpen, setIsEpicSearchOpen] = useState(false);
  const [isDefaultView, setIsDefaultView] = useState(true);

  /**
   * Get icon HTML for epic item based on subtype
   * Matches production Map.js epic item content formatting
   */
  const getEpicIconHtml = useCallback((subtype: string, index: number): string => {
    switch (subtype) {
      case 'ei': // Discovery/invention
        return '<img class="tsTicks discoveryIcon" src="/images/transparent.png" alt="" />';
      case 'ps': // Person
        return `<img class="tsTicks esIcon${(index % 3 === 0) ? '1' : '2'}" src="/images/transparent.png" alt="" />`;
      case 'ew': // War
        return ''; // Wars show title text, not icon
      default:
        return '';
    }
  }, []);

  /**
   * Get tooltip HTML for epic item based on subtype
   * Matches production Map.js epic item title formatting
   */
  const getEpicTooltipHtml = useCallback((epic: EpicItem): string => {
    const startYear = epic.start.getFullYear();
    const endYear = epic.end.getFullYear();
    const title = epic.content;
    
    switch (epic.subtype) {
      case 'ew': // War - show year range
        return `<img class="tsTicks warIcon timelineTooltipIcon" src="/images/transparent.png" alt="" /><span style="padding-left: 20px">${String(startYear)}-${String(endYear)} </span>: <b>${title}</b>`;
      case 'ei': // Discovery
        return `<img class="tsTicks discoveryIcon timelineTooltipIcon" src="/images/transparent.png" alt="" /><span style="padding-left: 20px">${String(startYear)}</span>: <b>${title}</b>`;
      case 'ps': // Person
        return `<img class="tsTicks esIcon timelineTooltipIcon" src="/images/transparent.png" alt="" /><span style="padding-left: 20px">${String(startYear)}</span>: <b>${title}</b>`;
      default:
        return `<b>${title}</b> (${String(startYear)})`;
    }
  }, []);

  /**
   * Transform EpicItem to TimelineItem format
   * Requirements: 6.2, 6.4, 6.5
   * Matches production Map.js epic item formatting
   */
  const transformEpicToTimelineItem = useCallback((epic: EpicItem, index: number): TimelineItem => {
    const iconHtml = getEpicIconHtml(epic.subtype, index);
    // For wars (ew), show the title; for others, show the icon
    const contentHtml = epic.subtype === 'ew' 
      ? `<div class="warContainer">${epic.content}</div>`
      : `<div class="warContainer">${iconHtml}</div>`;
    
    return {
      id: epic.id,
      content: contentHtml,
      start: epic.start,
      end: epic.end,
      group: epic.group,
      type: 'range',
      className: epic.className ?? `timelineItem_${epic.subtype}`,
      title: getEpicTooltipHtml(epic), // HTML tooltip
    };
  }, [getEpicIconHtml, getEpicTooltipHtml]);

  /**
   * Get filtered epic items and transform to TimelineItem format
   * Requirements: 6.2, 6.4, 6.5
   */
  const timelineItems = useMemo((): TimelineItem[] => {
    const filteredEpics = getFilteredEpicItems();
    console.log('[Timeline] Filtered epic items count:', filteredEpics.length);
    const items = filteredEpics.map((epic, index) => transformEpicToTimelineItem(epic, index));
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
    height: isExpanded ? TIMELINE_HEIGHT_EXPANDED : TIMELINE_HEIGHT_COLLAPSED,
    // Production uses -2500 to 2500 range
    min: '-002500-01-01',
    max: '2500-01-01',
    // Start with a wide view showing full history range like production
    start: '-000550-01-01',
    end: '2050-01-01',
    // zoomMin: ~10 years in ms - prevents zooming to months
    zoomMin: 315360000000,
    stack: isExpanded, // Only stack items when expanded (like production)
    showCurrentTime: false,
    editable: false,
    showMajorLabels: false,
    showMinorLabels: true,
    horizontalScroll: true,
    zoomable: true,
    moveable: true,
    // Force year-based time axis
    timeAxis: { scale: 'year', step: 100 },
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
   * Zooms timeline to show the epic's date range (like production _flyTo)
   * Flies the map to show the epic's related locations
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
        
        // Zoom timeline to show the epic's date range (like production _flyTo)
        // Production zooms to: start - 100 years to end + 100 years
        if (timelineRef.current) {
          const startYear = clickedEpic.start.getFullYear();
          const endYear = clickedEpic.end.getFullYear();
          const zoomStart = new Date(new Date(0, 1, 1).setFullYear(startYear - 100));
          const zoomEnd = new Date(new Date(0, 1, 1).setFullYear(endYear + 100));
          
          // Zoom to the epic's date range
          timelineRef.current.setWindow(zoomStart, zoomEnd);
          
          // Select the item after zoom animation (like production's 2 second delay)
          setTimeout(() => {
            timelineRef.current?.setSelection([String(event.item)]);
          }, 500);
        }
        
        // Set year to the epic's start year
        setYear(clickedEpic.start.getFullYear());
        setIsDefaultView(false);
        
        // Fetch epic linked content and fly map to show coordinates
        // This matches production behavior where clicking an epic flies the map
        void fetchEpicCoordinates(clickedEpic.id).then((coordinates) => {
          if (coordinates.length > 0) {
            // Calculate center and bounds of all coordinates
            const lngs = coordinates.map(c => c[0]);
            const lats = coordinates.map(c => c[1]);
            const minLng = Math.min(...lngs);
            const maxLng = Math.max(...lngs);
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);
            
            // Calculate center
            const centerLng = (minLng + maxLng) / 2;
            const centerLat = (minLat + maxLat) / 2;
            
            // Calculate appropriate zoom level based on bounds
            // Larger spread = lower zoom, smaller spread = higher zoom
            const lngSpread = maxLng - minLng;
            const latSpread = maxLat - minLat;
            const maxSpread = Math.max(lngSpread, latSpread);
            
            // Approximate zoom calculation (similar to production fitBounds)
            // maxSpread of 180 degrees = zoom 1, maxSpread of ~1 degree = zoom 8
            let zoom = 4.5; // Default minimum zoom
            if (maxSpread > 0) {
              zoom = Math.max(4.5, Math.min(8, 8 - Math.log2(maxSpread + 1)));
            }
            
            console.log('[Timeline] Flying map to epic coordinates:', { centerLng, centerLat, zoom, coordinateCount: coordinates.length });
            
            // Get flyTo from mapStore and fly to the center
            const { flyTo } = useMapStore.getState();
            flyTo({
              latitude: centerLat,
              longitude: centerLng,
              zoom,
              duration: 2000,
            });
          }
        });
        
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
  }, [getFilteredEpicItems, onEpicSelect, openRightDrawer, setYear]);

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
    setIsEpicSearchOpen((prev) => !prev);
  }, []);

  const handleAutoplayOpen = useCallback(() => {
    if (isAutoplayActive) {
      // If autoplay is running, stop it directly
      stopAutoplay();
    } else {
      // Otherwise toggle the autoplay menu
      setIsAutoplayMenuOpen((prev) => !prev);
    }
  }, [isAutoplayActive, stopAutoplay]);

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

  const handleEpicSearchClose = useCallback(() => {
    setIsEpicSearchOpen(false);
  }, []);

  const handleEpicSearchSelect = useCallback((epic: EpicItem, startYear: number, endYear: number) => {
    // Navigate timeline to the epic's date range
    if (timelineRef.current) {
      const startDate = new Date(new Date(0, 1, 1).setFullYear(startYear));
      const endDate = new Date(new Date(0, 1, 1).setFullYear(endYear));
      timelineRef.current.setWindow(startDate, endDate);
    }
    // Set year to the epic's start year
    setYear(startYear);
    setIsEpicSearchOpen(false);
    setIsDefaultView(false);
    
    // Call optional callback if provided
    if (onEpicSelect) {
      onEpicSelect(epic);
    }
  }, [setYear, onEpicSelect]);

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

        {/* Epic Search Autocomplete (Requirement 8.1-8.7) */}
        {isEpicSearchOpen && (
          <div className={styles['epicSearchContainer']}>
            <EpicSearchAutocomplete
              epics={getFilteredEpicItems()}
              onSelect={handleEpicSearchSelect}
              onClose={handleEpicSearchClose}
            />
          </div>
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
