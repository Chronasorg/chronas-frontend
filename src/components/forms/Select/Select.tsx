import React, { useState, useRef, useEffect, useId } from 'react';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  /** Select name */
  name: string;
  /** Available options */
  options: SelectOption[];
  /** Current value */
  value?: string;
  /** Default value */
  defaultValue?: string;
  /** Label text */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Change handler */
  onChange?: (value: string) => void;
  /** Additional CSS class */
  className?: string;
}

/**
 * Select component with custom dropdown.
 * Supports single selection with keyboard navigation.
 * Theme-aware using CSS custom properties.
 */
export const Select: React.FC<SelectProps> = ({
  name,
  options,
  value,
  defaultValue,
  label,
  placeholder = 'Select an option',
  error = false,
  errorMessage,
  disabled = false,
  fullWidth = false,
  onChange,
  className,
}) => {
  const id = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value ?? defaultValue ?? '');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Sync with controlled value
  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  const selectedOption = options.find((opt) => opt.value === selectedValue);
  const displayValue = selectedOption?.label ?? placeholder;

  const containerClasses = [
    styles['container'],
    fullWidth && styles['fullWidth'],
    error && styles['error'],
    disabled && styles['disabled'],
    isOpen && styles['open'],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        const currentIndex = options.findIndex((opt) => opt.value === selectedValue);
        setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
      }
    }
  };

  const handleSelect = (optionValue: string) => {
    const option = options.find((opt) => opt.value === optionValue);
    if (option && !option.disabled) {
      setSelectedValue(optionValue);
      onChange?.(optionValue);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (isOpen && focusedIndex >= 0) {
          const option = options[focusedIndex];
          if (option && !option.disabled) {
            handleSelect(option.value);
          }
        } else {
          setIsOpen(true);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex((prev) => {
            const next = prev + 1;
            return next < options.length ? next : prev;
          });
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          setFocusedIndex((prev) => {
            const next = prev - 1;
            return next >= 0 ? next : prev;
          });
        }
        break;
    }
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll focused option into view
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && listRef.current) {
      const focusedElement = listRef.current.children[focusedIndex] as HTMLElement | undefined;
      if (focusedElement && typeof focusedElement.scrollIntoView === 'function') {
        focusedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex, isOpen]);

  const selectId = `select-${id}`;
  const listId = `select-list-${id}`;
  const errorId = `select-error-${id}`;

  return (
    <div className={containerClasses} ref={containerRef}>
      {label && (
        <label htmlFor={selectId} className={styles['label']}>
          {label}
        </label>
      )}
      <input type="hidden" name={name} value={selectedValue} />
      <button
        id={selectId}
        type="button"
        className={styles['trigger']}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-invalid={error}
        aria-describedby={error && errorMessage ? errorId : undefined}
      >
        <span className={selectedOption ? styles['value'] : styles['placeholder']}>
          {displayValue}
        </span>
        <span className={styles['arrow']} aria-hidden="true">
          ▼
        </span>
      </button>
      {isOpen && (
        <ul
          id={listId}
          ref={listRef}
          className={styles['dropdown']}
          role="listbox"
          aria-labelledby={selectId}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === selectedValue}
              aria-disabled={option.disabled}
              className={[
                styles['option'],
                option.value === selectedValue && styles['selected'],
                option.disabled && styles['optionDisabled'],
                index === focusedIndex && styles['focused'],
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
      {error && errorMessage && (
        <div id={errorId} className={styles['errorMessage']} role="alert">
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default Select;
