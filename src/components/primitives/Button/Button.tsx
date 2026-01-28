import React from 'react';
import styles from './Button.module.css';

export interface ButtonProps {
  /** Button content */
  children: React.ReactNode;
  /** Visual variant */
  variant?: 'primary' | 'secondary' | 'text';
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Disabled state */
  disabled?: boolean;
  /** Loading state with spinner */
  loading?: boolean;
  /** Full width button */
  fullWidth?: boolean;
  /** Icon before label */
  startIcon?: React.ReactNode;
  /** Icon after label */
  endIcon?: React.ReactNode;
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Additional CSS class */
  className?: string;
}

/**
 * Button component with variants and sizes.
 * Supports primary, secondary, and text variants.
 * Supports small, medium, and large sizes.
 * Theme-aware using CSS custom properties.
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  startIcon,
  endIcon,
  type = 'button',
  onClick,
  className,
}) => {
  const classNames = [
    styles['button'],
    styles[`variant-${variant}`],
    styles[`size-${size}`],
    fullWidth && styles['fullWidth'],
    disabled && styles['disabled'],
    loading && styles['loading'],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <button
      type={type}
      className={classNames}
      disabled={disabled || loading}
      onClick={handleClick}
      aria-disabled={disabled || loading}
      aria-busy={loading}
    >
      {startIcon && <span className={styles['startIcon']}>{startIcon}</span>}
      <span className={styles['label']}>{children}</span>
      {endIcon && <span className={styles['endIcon']}>{endIcon}</span>}
    </button>
  );
};

export default Button;
