/**
 * YearDialog Component
 *
 * Fullscreen modal for entering a specific year to navigate to.
 * Features a dark semi-transparent overlay, centered input with large font,
 * close button, search icon, and focus trap.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 14.3, 14.4
 */

import type React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { clampYear, isValidYear, MIN_YEAR, MAX_YEAR } from '../../../utils/yearUtils';
import styles from './YearDialog.module.css';

/**
 * YearDialog component props
 */
export interface YearDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Callback when year is submitted */
  onSubmit: (year: number) => void;
  /** Initial year value to display */
  initialYear?: number;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * Search Icon Component
 */
const SearchIcon: React.FC = () => (
  <svg
    width="24"
    height="24"
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
 * Close Icon Component
 */
const CloseIcon: React.FC = () => (
  <svg
    width="24"
    height="24"
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
 * YearDialog Component
 *
 * A fullscreen modal dialog for entering a specific year.
 * - Fullscreen overlay with dark background (rgba(0,0,0,0.8)) (Requirement 7.1, 7.2)
 * - Centered input with 60px font and letter-spacing (Requirement 7.3, 7.5)
 * - Close button in top-right corner (Requirement 7.6)
 * - Search icon button (Requirement 7.8)
 * - Auto-focus on open (Requirement 7.9)
 * - Validates year range (-2000 to 2000) (Requirement 7.4)
 * - Enter key submission (Requirement 7.7)
 * - Focus trap (Requirement 7.10)
 * - Accessibility: aria-label, role="dialog", aria-modal="true" (Requirement 14.3, 14.4)
 *
 * @param props - YearDialog component props
 * @returns YearDialog React component
 */
export const YearDialog: React.FC<YearDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialYear,
  placeholder = 'Enter year',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Store the previously focused element when dialog opens
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      // Set initial value if provided
      if (initialYear !== undefined) {
        setInputValue(initialYear.toString());
      } else {
        setInputValue('');
      }
      setError(null);
    }
  }, [isOpen, initialYear]);

  // Auto-focus input when dialog opens (Requirement 7.9)
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to ensure dialog is rendered
      const timeoutId = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [isOpen]);

  // Return focus when dialog closes (Requirement 14.4)
  useEffect(() => {
    if (!isOpen && previousActiveElement.current) {
      previousActiveElement.current.focus();
    }
  }, [isOpen]);

  // Handle escape key to close dialog
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus trap implementation (Requirement 7.10)
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    const focusableElements: HTMLElement[] = [
      inputRef.current,
      searchButtonRef.current,
      closeButtonRef.current,
    ].filter((el): el is HTMLInputElement | HTMLButtonElement => el !== null);

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab: if on first element, go to last
      if (document.activeElement === firstElement && lastElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: if on last element, go to first
      if (document.activeElement === lastElement && firstElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }, []);

  // Validate and parse year input
  const parseAndValidateYear = useCallback((value: string): number | null => {
    const trimmed = value.trim();
    if (trimmed === '' || trimmed === '-') {
      return null;
    }

    const parsed = parseInt(trimmed, 10);
    if (isNaN(parsed)) {
      return null;
    }

    return parsed;
  }, []);

  // Handle input change
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    
    // Allow empty, minus sign, or numeric input
    if (value === '' || value === '-' || /^-?\d*$/.test(value)) {
      setInputValue(value);
      setError(null);
    }
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(() => {
    const parsed = parseAndValidateYear(inputValue);
    
    if (parsed === null) {
      setError('Please enter a valid year');
      return;
    }

    // Validate year range (Requirement 7.4)
    if (!isValidYear(parsed)) {
      // Clamp to valid range and submit
      const clamped = clampYear(parsed);
      onSubmit(clamped);
      onClose();
      return;
    }

    onSubmit(parsed);
    onClose();
  }, [inputValue, parseAndValidateYear, onSubmit, onClose]);

  // Handle Enter key submission (Requirement 7.7)
  const handleInputKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  // Handle overlay click to close
  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={dialogRef}
      className={styles['yearDialog']}
      role="dialog"
      aria-modal="true"
      aria-label="Year search dialog"
      data-testid="year-dialog"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
    >
      <div className={styles['dialogContent']}>
        {/* Close button in top-right corner (Requirement 7.6) */}
        <button
          ref={closeButtonRef}
          type="button"
          className={styles['closeButton']}
          onClick={onClose}
          aria-label="Close dialog"
          data-testid="year-dialog-close"
        >
          <CloseIcon />
        </button>

        {/* Centered input container (Requirement 7.3) */}
        <div className={styles['inputContainer']}>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            className={styles['yearInput']}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            placeholder={placeholder}
            aria-label="Enter year"
            aria-describedby={error ? 'year-error' : undefined}
            aria-invalid={error ? 'true' : 'false'}
            data-testid="year-dialog-input"
          />
          
          {/* Search icon button (Requirement 7.8) */}
          <button
            ref={searchButtonRef}
            type="button"
            className={styles['searchButton']}
            onClick={handleSubmit}
            aria-label="Go to year"
            data-testid="year-dialog-search"
          >
            <SearchIcon />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div
            id="year-error"
            className={styles['errorMessage']}
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        {/* Year range hint */}
        <div className={styles['hint']}>
          Valid range: {MIN_YEAR} to {MAX_YEAR}
        </div>
      </div>
    </div>
  );
};

export default YearDialog;
