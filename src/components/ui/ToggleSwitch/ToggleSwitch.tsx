/**
 * ToggleSwitch Component
 *
 * A sliding toggle switch control (pill-shaped track with circular knob).
 * Replaces standard checkboxes for boolean settings.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.5
 */

import React from 'react';
import styles from './ToggleSwitch.module.css';

export interface ToggleSwitchProps {
  /** Whether the toggle is on */
  checked: boolean;
  /** Callback when toggle state changes */
  onChange: (checked: boolean) => void;
  /** Accessible label */
  label?: string;
  /** Optional disabled state */
  disabled?: boolean;
  /** Test ID for testing */
  testId?: string;
}

/**
 * ToggleSwitch - A sliding on/off control matching production styling.
 */
export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  testId = 'toggle-switch',
}) => {
  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled) {
        onChange(!checked);
      }
    }
  };

  return (
    <div
      className={[
        styles['toggleSwitch'],
        checked ? styles['on'] : styles['off'],
        disabled ? styles['disabled'] : ''
      ].filter(Boolean).join(' ')}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      data-testid={testId}
    >
      <div className={styles['track']}>
        <div className={styles['knob']} />
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onChange(!checked)}
        disabled={disabled}
        className={styles['hiddenInput']}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
};

export default ToggleSwitch;
