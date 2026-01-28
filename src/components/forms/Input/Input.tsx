import React, { useState, useId } from 'react';
import styles from './Input.module.css';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'url';

export interface InputProps {
  /** Input name */
  name: string;
  /** Input type */
  type?: InputType;
  /** Current value */
  value?: string;
  /** Default value */
  defaultValue?: string;
  /** Floating label */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Helper text below input */
  helperText?: string;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Change handler */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Focus handler */
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  /** Blur handler */
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  /** Additional CSS class */
  className?: string;
}

/**
 * Input component with floating label.
 * Supports text, email, password, number, and url types.
 * Theme-aware using CSS custom properties.
 */
export const Input: React.FC<InputProps> = ({
  name,
  type = 'text',
  value,
  defaultValue,
  label,
  placeholder,
  helperText,
  error = false,
  errorMessage,
  disabled = false,
  fullWidth = false,
  onChange,
  onFocus,
  onBlur,
  className,
}) => {
  const id = useId();
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(
    Boolean(value ?? defaultValue)
  );

  const isFloating = isFocused || hasValue || Boolean(placeholder);

  const containerClasses = [
    styles['container'],
    fullWidth && styles['fullWidth'],
    error && styles['error'],
    disabled && styles['disabled'],
    isFocused && styles['focused'],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const labelClasses = [
    styles['label'],
    isFloating && styles['floating'],
  ]
    .filter(Boolean)
    .join(' ');

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(event.target.value.length > 0);
    onChange?.(event);
  };

  const inputId = `input-${id}`;
  const helperId = `helper-${id}`;
  const errorId = `error-${id}`;

  const describedBy = [
    helperText && helperId,
    error && errorMessage && errorId,
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div className={containerClasses}>
      <div className={styles['inputWrapper']}>
        {label && (
          <label htmlFor={inputId} className={labelClasses}>
            {label}
          </label>
        )}
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          defaultValue={defaultValue}
          placeholder={isFloating ? placeholder : undefined}
          disabled={disabled}
          className={styles['input']}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-invalid={error}
          aria-describedby={describedBy}
        />
      </div>
      {helperText && !error && (
        <div id={helperId} className={styles['helperText']}>
          {helperText}
        </div>
      )}
      {error && errorMessage && (
        <div id={errorId} className={styles['errorMessage']} role="alert">
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default Input;
