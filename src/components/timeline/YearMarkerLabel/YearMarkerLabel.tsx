/**
 * YearMarkerLabel Component
 * 
 * Renders the year label on the timeline's red marker (custom time).
 * Uses React Portal to render inside the vis-timeline custom time element.
 * Matches production TimelineSelectedYear.js behavior.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './YearMarkerLabel.module.css';

export interface YearMarkerLabelProps {
  /** The currently selected year to display */
  selectedYear: number;
  /** The suggested year shown on hover (optional) */
  suggestedYear?: number | null;
  /** Callback when the year label is clicked */
  onYearClick?: () => void;
}

/**
 * YearMarkerLabel Component
 * 
 * Renders a clickable year label that appears on the red timeline marker.
 * Shows the selected year and optionally a suggested year on hover.
 */
export const YearMarkerLabel: React.FC<YearMarkerLabelProps> = ({
  selectedYear,
  suggestedYear,
  onYearClick,
}) => {
  const [markerElement, setMarkerElement] = useState<HTMLElement | null>(null);
  const [showSuggested, setShowSuggested] = useState(false);

  // Find the custom time marker element
  useEffect(() => {
    const findMarker = () => {
      const marker = document.querySelector('.vis-custom-time.selectedYear');
      if (marker instanceof HTMLElement) {
        setMarkerElement(marker);
      }
    };

    // Try immediately and then with a delay (marker may not exist yet)
    findMarker();
    const timeout = setTimeout(findMarker, 500);
    const interval = setInterval(findMarker, 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  // Show suggested year briefly when it changes
  useEffect(() => {
    if (suggestedYear !== undefined && suggestedYear !== null && suggestedYear !== selectedYear) {
      setShowSuggested(true);
      const timeout = setTimeout(() => setShowSuggested(false), 1000);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [suggestedYear, selectedYear]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onYearClick?.();
  }, [onYearClick]);

  // Don't render if marker element not found
  if (!markerElement) {
    return null;
  }

  const content = (
    <button
      className={styles['yearLabel']}
      onClick={handleClick}
      title="Click to select exact year"
      type="button"
    >
      {/* Suggested year indicator (shows on hover) */}
      {showSuggested && (
        <div className={styles['suggestedYear']}>
          <svg 
            className={styles['arrowIcon']}
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M7 14l5-5 5 5z" />
          </svg>
          <span className={styles['suggestedYearText']}>{suggestedYear}</span>
        </div>
      )}
      
      {/* Main year display */}
      {selectedYear}
    </button>
  );

  return createPortal(content, markerElement);
};

export default YearMarkerLabel;
