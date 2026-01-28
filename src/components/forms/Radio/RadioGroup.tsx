import React, { useState } from 'react';
import styles from './Radio.module.css';
import { RadioGroupContext } from './RadioContext';

export interface RadioGroupProps {
  /** Group name */
  name: string;
  /** Current value */
  value?: string;
  /** Default value */
  defaultValue?: string;
  /** Radio options */
  children: React.ReactNode;
  /** Change handler */
  onChange?: (value: string) => void;
  /** Layout direction */
  direction?: 'row' | 'column';
  /** Additional CSS class */
  className?: string;
}

/**
 * RadioGroup component for managing mutual exclusivity of Radio buttons.
 * Provides context for child Radio components.
 */
export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  value,
  defaultValue = '',
  children,
  onChange,
  direction = 'column',
  className,
}) => {
  const [selectedValue, setSelectedValue] = useState(value ?? defaultValue);

  // Sync with controlled value
  React.useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  const handleChange = (newValue: string) => {
    setSelectedValue(newValue);
    onChange?.(newValue);
  };

  const containerClasses = [
    styles['group'],
    styles[`direction-${direction}`],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <RadioGroupContext.Provider
      value={{ name, value: selectedValue, onChange: handleChange }}
    >
      <div className={containerClasses} role="radiogroup">
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
};

export default RadioGroup;
