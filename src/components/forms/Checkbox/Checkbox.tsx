import React, { useId } from 'react';
import styles from './Checkbox.module.css';

export interface CheckboxProps {
  /** Checkbox name */
  name: string;
  /** Checked state */
  checked?: boolean;
  /** Default checked state */
  defaultChecked?: boolean;
  /** Indeterminate state */
  indeterminate?: boolean;
  /** Label text */
  label?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Change handler */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Custom checked icon */
  checkedIcon?: React.ReactNode;
  /** Custom unchecked icon */
  uncheckedIcon?: React.ReactNode;
  /** Additional CSS class */
  className?: string;
}

/**
 * Checkbox component with customizable icons.
 * Supports checked, unchecked, and indeterminate states.
 * Theme-aware using CSS custom properties.
 */
export const Checkbox: React.FC<CheckboxProps> = ({
  name,
  checked,
  defaultChecked,
  indeterminate = false,
  label,
  disabled = false,
  onChange,
  checkedIcon,
  uncheckedIcon,
  className,
}) => {
  const id = useId();
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Set indeterminate state via ref (can't be set via attribute)
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const containerClasses = [
    styles['container'],
    disabled && styles['disabled'],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const checkboxId = `checkbox-${id}`;

  // Default icons
  const defaultCheckedIcon = (
    <svg viewBox="0 0 24 24" className={styles['icon']} aria-hidden="true">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  );

  const defaultUncheckedIcon = (
    <svg viewBox="0 0 24 24" className={styles['icon']} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );

  const defaultIndeterminateIcon = (
    <svg viewBox="0 0 24 24" className={styles['icon']} aria-hidden="true">
      <path d="M19 13H5v-2h14v2z" />
    </svg>
  );

  const getIcon = () => {
    if (indeterminate) {
      return defaultIndeterminateIcon;
    }
    const isChecked = checked ?? inputRef.current?.checked ?? defaultChecked;
    if (isChecked) {
      return checkedIcon ?? defaultCheckedIcon;
    }
    return uncheckedIcon ?? defaultUncheckedIcon;
  };

  return (
    <label className={containerClasses} htmlFor={checkboxId}>
      <input
        ref={inputRef}
        type="checkbox"
        id={checkboxId}
        name={name}
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        onChange={onChange}
        className={styles['input']}
        aria-checked={indeterminate ? 'mixed' : undefined}
      />
      <span className={styles['checkbox']} aria-hidden="true">
        {getIcon()}
      </span>
      {label && <span className={styles['label']}>{label}</span>}
    </label>
  );
};

export default Checkbox;
