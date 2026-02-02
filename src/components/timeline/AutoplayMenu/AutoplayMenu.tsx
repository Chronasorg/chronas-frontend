/**
 * AutoplayMenu Component
 *
 * Configuration panel for autoplay/slideshow feature.
 * Positioned as a Paper/card above the autoplay button.
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7
 */

import type React from 'react';
import { useState, useCallback, useRef, useEffect } from 'react';
import type { AutoplayConfig } from '../../../stores/timelineStore';
import { MIN_YEAR, MAX_YEAR } from '../../../stores/timelineStore';
import styles from './AutoplayMenu.module.css';

/**
 * AutoplayMenu component props
 */
export interface AutoplayMenuProps {
  /** Current autoplay configuration */
  config: AutoplayConfig;
  /** Callback when configuration changes */
  onConfigChange: (config: Partial<AutoplayConfig>) => void;
  /** Callback to start autoplay */
  onStart: () => void;
  /** Callback when menu should close */
  onClose: () => void;
}

/**
 * Default autoplay configuration values
 */
export const DEFAULT_START_YEAR = 1;
export const DEFAULT_END_YEAR = 2000;
export const DEFAULT_STEP_SIZE = 25;
export const DEFAULT_DELAY_SECONDS = 1;
export const DEFAULT_REPEAT = true;

/**
 * Minimum and maximum values for inputs
 */
export const MIN_STEP_SIZE = 1;
export const MAX_STEP_SIZE = 500;
export const MIN_DELAY_SECONDS = 0.1;
export const MAX_DELAY_SECONDS = 60;

/**
 * Close Icon Component
 */
const CloseIcon: React.FC = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/**
 * Play Icon Component
 */
const PlayIcon: React.FC = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <polygon points="5,3 19,12 5,21" />
  </svg>
);

/**
 * Clamps a value to a range
 */
function clampValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Parses a numeric input value
 */
function parseNumericInput(value: string, defaultValue: number): number {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * AutoplayMenu Component
 *
 * A Paper/card component for configuring autoplay settings.
 * - Paper/card positioned above autoplay button (Requirement 9.1)
 * - Start year input with default 1 (Requirement 9.2)
 * - End year input with default 2000 (Requirement 9.3)
 * - Step size input with default 25 years (Requirement 9.4)
 * - Delay input with default 1 second (Requirement 9.5)
 * - Repeat checkbox with default checked (Requirement 9.6)
 * - "Start Slideshow" button (Requirement 9.7)
 *
 * @param props - AutoplayMenu component props
 * @returns AutoplayMenu React component
 */
export const AutoplayMenu: React.FC<AutoplayMenuProps> = ({
  config,
  onConfigChange,
  onStart,
  onClose,
}) => {
  // Local state for input values (allows typing without immediate validation)
  const [startYearInput, setStartYearInput] = useState(config.startYear.toString());
  const [endYearInput, setEndYearInput] = useState(config.endYear.toString());
  const [stepSizeInput, setStepSizeInput] = useState(config.stepSize.toString());
  const [delayInput, setDelayInput] = useState((config.delay / 1000).toString());
  const [repeat, setRepeat] = useState(config.repeat);

  const menuRef = useRef<HTMLDivElement>(null);
  const startYearRef = useRef<HTMLInputElement>(null);

  // Sync local state when config changes externally
  useEffect(() => {
    setStartYearInput(config.startYear.toString());
    setEndYearInput(config.endYear.toString());
    setStepSizeInput(config.stepSize.toString());
    setDelayInput((config.delay / 1000).toString());
    setRepeat(config.repeat);
  }, [config]);

  // Focus first input on mount
  useEffect(() => {
    startYearRef.current?.focus();
  }, []);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Add listener with a small delay to prevent immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  /**
   * Handles start year input change
   */
  const handleStartYearChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setStartYearInput(value);
  }, []);

  /**
   * Handles start year input blur - validates and updates config
   */
  const handleStartYearBlur = useCallback(() => {
    const parsed = parseNumericInput(startYearInput, DEFAULT_START_YEAR);
    const clamped = clampValue(Math.round(parsed), MIN_YEAR, MAX_YEAR);
    setStartYearInput(clamped.toString());
    onConfigChange({ startYear: clamped });
  }, [startYearInput, onConfigChange]);

  /**
   * Handles end year input change
   */
  const handleEndYearChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setEndYearInput(value);
  }, []);

  /**
   * Handles end year input blur - validates and updates config
   */
  const handleEndYearBlur = useCallback(() => {
    const parsed = parseNumericInput(endYearInput, DEFAULT_END_YEAR);
    const clamped = clampValue(Math.round(parsed), MIN_YEAR, MAX_YEAR);
    setEndYearInput(clamped.toString());
    onConfigChange({ endYear: clamped });
  }, [endYearInput, onConfigChange]);

  /**
   * Handles step size input change
   */
  const handleStepSizeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setStepSizeInput(value);
  }, []);

  /**
   * Handles step size input blur - validates and updates config
   */
  const handleStepSizeBlur = useCallback(() => {
    const parsed = parseNumericInput(stepSizeInput, DEFAULT_STEP_SIZE);
    const clamped = clampValue(Math.round(parsed), MIN_STEP_SIZE, MAX_STEP_SIZE);
    setStepSizeInput(clamped.toString());
    onConfigChange({ stepSize: clamped });
  }, [stepSizeInput, onConfigChange]);

  /**
   * Handles delay input change
   */
  const handleDelayChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setDelayInput(value);
  }, []);

  /**
   * Handles delay input blur - validates and updates config
   */
  const handleDelayBlur = useCallback(() => {
    const parsed = parseNumericInput(delayInput, DEFAULT_DELAY_SECONDS);
    const clamped = clampValue(parsed, MIN_DELAY_SECONDS, MAX_DELAY_SECONDS);
    // Round to 1 decimal place
    const rounded = Math.round(clamped * 10) / 10;
    setDelayInput(rounded.toString());
    onConfigChange({ delay: rounded * 1000 }); // Convert to milliseconds
  }, [delayInput, onConfigChange]);

  /**
   * Handles repeat checkbox change
   */
  const handleRepeatChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setRepeat(checked);
    onConfigChange({ repeat: checked });
  }, [onConfigChange]);

  /**
   * Handles start button click
   */
  const handleStartClick = useCallback(() => {
    // Ensure all values are validated before starting
    handleStartYearBlur();
    handleEndYearBlur();
    handleStepSizeBlur();
    handleDelayBlur();
    
    // Small delay to ensure state is updated
    setTimeout(() => {
      onStart();
    }, 0);
  }, [handleStartYearBlur, handleEndYearBlur, handleStepSizeBlur, handleDelayBlur, onStart]);

  /**
   * Handles Enter key to start slideshow
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleStartClick();
    }
  }, [handleStartClick]);

  return (
    <div
      ref={menuRef}
      className={styles['autoplayMenu']}
      role="dialog"
      aria-label="Autoplay configuration"
      data-testid="autoplay-menu"
      onKeyDown={handleKeyDown}
    >
      {/* Header with title and close button */}
      <div className={styles['header']}>
        <h3 className={styles['title']}>Slideshow Settings</h3>
        <button
          type="button"
          className={styles['closeButton']}
          onClick={onClose}
          aria-label="Close autoplay menu"
          data-testid="autoplay-menu-close"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Configuration form */}
      <div className={styles['content']}>
        {/* Start Year Input (Requirement 9.2) */}
        <div className={styles['inputGroup']}>
          <label htmlFor="autoplay-start-year" className={styles['label']}>
            Start Year
          </label>
          <input
            ref={startYearRef}
            id="autoplay-start-year"
            type="number"
            className={styles['input']}
            value={startYearInput}
            onChange={handleStartYearChange}
            onBlur={handleStartYearBlur}
            min={MIN_YEAR}
            max={MAX_YEAR}
            aria-describedby="start-year-hint"
            data-testid="autoplay-start-year"
          />
          <span id="start-year-hint" className={styles['hint']}>
            {MIN_YEAR} to {MAX_YEAR}
          </span>
        </div>

        {/* End Year Input (Requirement 9.3) */}
        <div className={styles['inputGroup']}>
          <label htmlFor="autoplay-end-year" className={styles['label']}>
            End Year
          </label>
          <input
            id="autoplay-end-year"
            type="number"
            className={styles['input']}
            value={endYearInput}
            onChange={handleEndYearChange}
            onBlur={handleEndYearBlur}
            min={MIN_YEAR}
            max={MAX_YEAR}
            aria-describedby="end-year-hint"
            data-testid="autoplay-end-year"
          />
          <span id="end-year-hint" className={styles['hint']}>
            {MIN_YEAR} to {MAX_YEAR}
          </span>
        </div>

        {/* Step Size Input (Requirement 9.4) */}
        <div className={styles['inputGroup']}>
          <label htmlFor="autoplay-step-size" className={styles['label']}>
            Step Size (years)
          </label>
          <input
            id="autoplay-step-size"
            type="number"
            className={styles['input']}
            value={stepSizeInput}
            onChange={handleStepSizeChange}
            onBlur={handleStepSizeBlur}
            min={MIN_STEP_SIZE}
            max={MAX_STEP_SIZE}
            aria-describedby="step-size-hint"
            data-testid="autoplay-step-size"
          />
          <span id="step-size-hint" className={styles['hint']}>
            {MIN_STEP_SIZE} to {MAX_STEP_SIZE} years
          </span>
        </div>

        {/* Delay Input (Requirement 9.5) */}
        <div className={styles['inputGroup']}>
          <label htmlFor="autoplay-delay" className={styles['label']}>
            Delay (seconds)
          </label>
          <input
            id="autoplay-delay"
            type="number"
            className={styles['input']}
            value={delayInput}
            onChange={handleDelayChange}
            onBlur={handleDelayBlur}
            min={MIN_DELAY_SECONDS}
            max={MAX_DELAY_SECONDS}
            step="0.1"
            aria-describedby="delay-hint"
            data-testid="autoplay-delay"
          />
          <span id="delay-hint" className={styles['hint']}>
            {MIN_DELAY_SECONDS} to {MAX_DELAY_SECONDS} seconds
          </span>
        </div>

        {/* Repeat Checkbox (Requirement 9.6) */}
        <div className={styles['checkboxGroup']}>
          <label className={styles['checkboxLabel']}>
            <input
              type="checkbox"
              className={styles['checkbox']}
              checked={repeat}
              onChange={handleRepeatChange}
              data-testid="autoplay-repeat"
            />
            <span className={styles['checkboxText']}>Repeat slideshow</span>
          </label>
        </div>
      </div>

      {/* Footer with start button (Requirement 9.7) */}
      <div className={styles['footer']}>
        <button
          type="button"
          className={styles['startButton']}
          onClick={handleStartClick}
          aria-label="Start slideshow"
          data-testid="autoplay-start-button"
        >
          <PlayIcon />
          <span>Start Slideshow</span>
        </button>
      </div>
    </div>
  );
};

export default AutoplayMenu;
