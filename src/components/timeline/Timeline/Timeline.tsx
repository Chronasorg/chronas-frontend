/**
 * Timeline Component
 *
 * Main container component for the timeline navigation bar.
 * Fixed at the bottom of the viewport with expandable height.
 * Uses React Portal to render outside the main DOM hierarchy.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */

import type React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTimelineStore } from '../../../stores/timelineStore';
import type { EpicItem } from '../../../stores/timelineStore';
import { TimelineControls } from '../TimelineControls/TimelineControls';
import { YearDisplay } from '../YearDisplay/YearDisplay';
import { YearDialog } from '../YearDialog/YearDialog';
import { AutoplayMenu } from '../AutoplayMenu/AutoplayMenu';
import styles from './Timeline.module.css';

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
  onEpicSelect: _onEpicSelect,
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
  } = useTimelineStore();

  // Local state for dialogs/menus
  const [isYearDialogOpen, setIsYearDialogOpen] = useState(false);
  const [isAutoplayMenuOpen, setIsAutoplayMenuOpen] = useState(false);
  const [isDefaultView, setIsDefaultView] = useState(true);

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

        {/* Year display (Requirement 2.1-2.5, 4.1-4.6) */}
        <YearDisplay
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
