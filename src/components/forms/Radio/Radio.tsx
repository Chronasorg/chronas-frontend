import React, { useId } from 'react';
import styles from './Radio.module.css';
import { useRadioGroup } from './RadioContext';

export interface RadioProps {
  /** Radio name (for grouping) */
  name: string;
  /** Radio value */
  value: string;
  /** Checked state */
  checked?: boolean;
  /** Label text */
  label?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Change handler */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Additional CSS class */
  className?: string;
}

/**
 * Radio button component.
 * Supports selected and unselected states.
 * Theme-aware using CSS custom properties.
 * When used inside a RadioGroup, inherits name, checked state, and onChange from context.
 */
export const Radio: React.FC<RadioProps> = ({
  name,
  value,
  checked,
  label,
  disabled = false,
  onChange,
  className,
}) => {
  const id = useId();
  const radioGroup = useRadioGroup();

  // Use context values if inside a RadioGroup
  const actualName = radioGroup?.name ?? name;
  const isChecked = radioGroup ? radioGroup.value === value : checked;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (radioGroup) {
      radioGroup.onChange(value);
    }
    onChange?.(event);
  };

  const containerClasses = [
    styles['container'],
    disabled && styles['disabled'],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const radioId = `radio-${id}`;

  return (
    <label className={containerClasses} htmlFor={radioId}>
      <input
        type="radio"
        id={radioId}
        name={actualName}
        value={value}
        checked={isChecked}
        disabled={disabled}
        onChange={handleChange}
        className={styles['input']}
      />
      <span className={styles['radio']} aria-hidden="true">
        <span className={styles['dot']} />
      </span>
      {label && <span className={styles['label']}>{label}</span>}
    </label>
  );
};

export default Radio;
