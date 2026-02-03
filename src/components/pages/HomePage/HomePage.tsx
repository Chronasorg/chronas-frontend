/**
 * HomePage Component
 *
 * Main home page that displays the interactive historical map as the primary visual element.
 * Integrates MapView, YearNotification, and Timeline components.
 *
 * Requirements: 1.3 - THE MapView SHALL be the primary visual element on the home page
 */

import type React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { MapView, MapErrorBoundary } from '../../map/MapView';
import { YearNotification } from '../../map/YearNotification';
import { Timeline } from '../../timeline/Timeline';
import { useTimelineStore } from '../../../stores/timelineStore';
import styles from './HomePage.module.css';

/**
 * HomePage Component
 *
 * The main home page that renders the interactive historical map.
 * - MapView fills the available content area
 * - YearNotification displays at top center
 * - Timeline displays at bottom
 *
 * @returns HomePage React component
 */
export const HomePage: React.FC = () => {
  // Get state from stores
  const selectedYear = useTimelineStore((state) => state.selectedYear);
  
  // Track previous year to detect changes for notification
  const [prevYear, setPrevYear] = useState<number>(selectedYear);
  
  // Year notification visibility state
  // Requirement 4.6: THE Year_Notification SHALL auto-hide after 6 seconds of inactivity
  const [isYearNotificationVisible, setIsYearNotificationVisible] = useState(false);

  /**
   * Show year notification when year changes.
   * Requirement 4.7: WHEN the year changes, THE Year_Notification SHALL animate into view
   */
  useEffect(() => {
    if (selectedYear !== prevYear) {
      setPrevYear(selectedYear);
      setIsYearNotificationVisible(true);
    }
  }, [selectedYear, prevYear]);

  /**
   * Handle year notification hide callback.
   * Requirement 4.6: THE Year_Notification SHALL auto-hide after 6 seconds
   */
  const handleYearNotificationHide = useCallback(() => {
    setIsYearNotificationVisible(false);
  }, []);

  return (
    <div className={styles['homePage']} data-testid="home-page">
      {/* Map View - Primary visual element */}
      {/* Requirement 1.3: THE MapView SHALL be the primary visual element on the home page */}
      <MapErrorBoundary>
        <MapView className={styles['mapView'] ?? ''} />
      </MapErrorBoundary>

      {/* Year Notification - Top center */}
      {/* Requirements 4.1-4.8: Year notification display */}
      <YearNotification
        year={selectedYear}
        isVisible={isYearNotificationVisible}
        onHide={handleYearNotificationHide}
        className={styles['yearNotification'] ?? ''}
      />

      {/* Timeline - Bottom of viewport */}
      {/* Timeline uses portal to render at bottom */}
      <Timeline />
    </div>
  );
};

export default HomePage;
