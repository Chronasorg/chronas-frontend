import React from 'react';
import styles from './Card.module.css';

export type CardElevation = 'none' | 'low' | 'medium' | 'high';

export interface CardProps {
  /** Card content */
  children: React.ReactNode;
  /** Shadow elevation */
  elevation?: CardElevation;
  /** Card header title */
  title?: string;
  /** Card header subtitle */
  subtitle?: string;
  /** Action buttons */
  actions?: React.ReactNode;
  /** Clickable card */
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  /** Additional CSS class */
  className?: string | undefined;
}

/**
 * Card component with elevation shadows.
 * Supports none, low, medium, and high elevation levels.
 * Theme-aware using CSS custom properties.
 */
export const Card: React.FC<CardProps> = ({
  children,
  elevation = 'low',
  title,
  subtitle,
  actions,
  onClick,
  className,
}) => {
  const isClickable = Boolean(onClick);

  const classNames = [
    styles['card'],
    styles[`elevation-${elevation}`],
    isClickable && styles['clickable'],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    onClick?.(event);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (isClickable && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick?.(event as unknown as React.MouseEvent<HTMLDivElement>);
    }
  };

  const hasHeader = Boolean(title) || Boolean(subtitle);

  return (
    <div
      className={classNames}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={isClickable ? (title ?? undefined) : undefined}
    >
      {hasHeader && (
        <div className={styles['header']}>
          {title && <div className={styles['title']}>{title}</div>}
          {subtitle && <div className={styles['subtitle']}>{subtitle}</div>}
        </div>
      )}
      <div className={styles['content']}>{children}</div>
      {actions && <div className={styles['actions']}>{actions}</div>}
    </div>
  );
};

export default Card;
