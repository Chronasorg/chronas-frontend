/**
 * TimelineControls Component
 *
 * Container for the control buttons on the left side of the timeline.
 * Includes expand/collapse, reset, search, and autoplay buttons.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10
 */

import type React from 'react';
import { useState, useCallback } from 'react';
import styles from './TimelineControls.module.css';

/**
 * TimelineControls component props
 */
export interface TimelineControlsProps {
  /** Whether the timeline is expanded */
  isExpanded: boolean;
  /** Whether the timeline is at default view (for reset button) */
  isDefaultView: boolean;
  /** Callback to toggle expanded state */
  onToggleExpand: () => void;
  /** Callback to reset timeline view */
  onReset: () => void;
  /** Callback to open search */
  onSearchOpen: () => void;
  /** Callback to open autoplay menu */
  onAutoplayOpen: () => void;
  /** Whether autoplay is currently active */
  isAutoplayActive: boolean;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Individual control button props
 */
interface ControlButtonProps {
  /** Button label for tooltip and aria-label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Icon content (SVG or Unicode) */
  icon: React.ReactNode;
  /** Test ID for testing */
  testId: string;
  /** Whether the button is in active state */
  isActive?: boolean;
}

/**
 * ControlButton Component
 *
 * Individual control button with circular background, drop-shadow,
 * and tooltip on hover.
 */
const ControlButton: React.FC<ControlButtonProps> = ({
  label,
  onClick,
  disabled = false,
  icon,
  testId,
  isActive = false,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleMouseEnter = useCallback(() => {
    setShowTooltip(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowTooltip(false);
  }, []);

  const buttonClasses = [
    styles['controlButton'],
    disabled ? styles['disabled'] : '',
    isActive ? styles['active'] : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={styles['buttonWrapper']}>
      <button
        type="button"
        className={buttonClasses}
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        data-testid={testId}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
      >
        {icon}
      </button>
      {/* Tooltip (Requirement 6.10) */}
      <div
        className={[
          styles['tooltip'] ?? '',
          showTooltip ? (styles['visible'] ?? '') : '',
        ].filter(Boolean).join(' ')}
        role="tooltip"
        aria-hidden={!showTooltip}
      >
        {label}
      </div>
    </div>
  );
};

/**
 * Expand/Collapse Icon Component - Material-UI expand-less / expand-more
 */
const ExpandIcon: React.FC<{ isExpanded: boolean }> = ({ isExpanded }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
    {isExpanded ? (
      <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z" />
    ) : (
      <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z" />
    )}
  </svg>
);

/**
 * Reset Icon Component - Material-UI av/replay
 */
const ResetIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
    <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
  </svg>
);

/**
 * Search Icon Component - Material-UI action/search
 */
const SearchIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
  </svg>
);

/**
 * Autoplay Icon Component - Material-UI image/slideshow (play) / av/stop
 */
const AutoplayIcon: React.FC<{ isActive: boolean }> = ({ isActive }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
    {isActive ? (
      <path d="M6 6h12v12H6z" />
    ) : (
      <path d="M10 8v8l5-4-5-4zm9-5H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
    )}
  </svg>
);

/**
 * TimelineControls Component
 *
 * Container for the control buttons on the left side of the timeline.
 * - Positioned at left: 64px (to the right of sidebar)
 * - Buttons stacked vertically with 8px gap
 * - Each button has circular background with drop-shadow
 * - Tooltips appear on hover
 *
 * @param props - TimelineControls component props
 * @returns TimelineControls React component
 */
export const TimelineControls: React.FC<TimelineControlsProps> = ({
  isExpanded,
  isDefaultView,
  onToggleExpand,
  onReset,
  onSearchOpen,
  onAutoplayOpen,
  isAutoplayActive,
  className,
}) => {
  const containerClasses = [
    styles['timelineControls'],
    className ?? '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={containerClasses}
      data-testid="timeline-controls"
      role="group"
      aria-label="Timeline controls"
    >
      {/* Expand/Collapse Button (Requirement 6.2, 6.3) */}
      <ControlButton
        label={isExpanded ? 'Collapse timeline' : 'Expand timeline'}
        onClick={onToggleExpand}
        icon={<ExpandIcon isExpanded={isExpanded} />}
        testId="expand-button"
      />

      {/* Reset Button (Requirement 6.4, 6.5) */}
      <ControlButton
        label="Reset timeline view"
        onClick={onReset}
        disabled={isDefaultView}
        icon={<ResetIcon />}
        testId="reset-button"
      />

      {/* Search Button (Requirement 6.6) */}
      <ControlButton
        label="Search epics"
        onClick={onSearchOpen}
        icon={<SearchIcon />}
        testId="search-button"
      />

      {/* Autoplay Button (Requirement 6.7) */}
      <ControlButton
        label={isAutoplayActive ? 'Stop autoplay' : 'Start autoplay'}
        onClick={onAutoplayOpen}
        icon={<AutoplayIcon isActive={isAutoplayActive} />}
        testId="autoplay-button"
        isActive={isAutoplayActive}
      />
    </div>
  );
};

export default TimelineControls;
