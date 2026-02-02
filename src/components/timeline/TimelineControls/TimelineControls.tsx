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
 * Expand/Collapse Icon Component
 * Shows up arrow when collapsed, down arrow when expanded (Requirement 6.3)
 */
const ExpandIcon: React.FC<{ isExpanded: boolean }> = ({ isExpanded }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {isExpanded ? (
      // Down arrow when expanded
      <polyline points="6 9 12 15 18 9" />
    ) : (
      // Up arrow when collapsed
      <polyline points="18 15 12 9 6 15" />
    )}
  </svg>
);

/**
 * Reset Icon Component
 */
const ResetIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

/**
 * Search Icon Component
 */
const SearchIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

/**
 * Autoplay Icon Component
 * Shows play icon when inactive, stop icon when active (Requirement 9.8)
 */
const AutoplayIcon: React.FC<{ isActive: boolean }> = ({ isActive }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {isActive ? (
      // Stop icon when active
      <rect x="6" y="6" width="12" height="12" fill="currentColor" />
    ) : (
      // Play/slideshow icon when inactive
      <>
        <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
      </>
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
