/**
 * NavItem Component
 *
 * A reusable navigation item with icon, tooltip, and optional badge.
 * Supports both navigation links and action handlers.
 *
 * Requirements: 3.1-3.7, 4.1-4.9, 8.2, 8.3, 9.2
 */

import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Tooltip } from '../Tooltip';
import styles from './NavItem.module.css';

/**
 * NavItem component props
 */
export interface NavItemProps {
  /** Icon component to render */
  icon: ReactNode;
  /** Tooltip text (also used for aria-label) */
  label: string;
  /** Navigation path */
  to?: string | undefined;
  /** Click handler for action items */
  onClick?: (() => void) | undefined;
  /** Whether this item is currently active */
  isActive?: boolean;
  /** Whether to highlight the icon (e.g., PRO status, logged in) */
  isHighlighted?: boolean;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Optional badge content */
  badge?: string | number;
  /** Test ID for testing */
  testId?: string;
}

/**
 * NavItem component for sidebar navigation.
 *
 * @param props - NavItem props
 * @returns The navigation item element
 */
export function NavItem({
  icon,
  label,
  to,
  onClick,
  isActive,
  isHighlighted = false,
  disabled = false,
  badge,
  testId,
}: NavItemProps) {
  const location = useLocation();
  
  // Determine if this item is active based on route matching
  const isRouteActive = to ? location.pathname === to || location.pathname.startsWith(`${to}/`) : false;
  const active = isActive ?? isRouteActive;

  const itemClasses = [
    styles['nav-item'] ?? '',
    active ? styles['nav-item--active'] ?? '' : '',
    isHighlighted ? styles['nav-item--highlighted'] ?? '' : '',
    disabled ? styles['nav-item--disabled'] ?? '' : '',
  ].filter(Boolean).join(' ');

  const content = (
    <>
      <span className={styles['nav-item__icon'] ?? ''}>{icon}</span>
      {badge !== undefined && (
        <span className={styles['nav-item__badge'] ?? ''} data-testid={testId ? `${testId}-badge` : undefined}>
          {badge}
        </span>
      )}
    </>
  );

  const commonProps = {
    className: itemClasses,
    'aria-label': label,
    'data-testid': testId,
    'aria-disabled': disabled,
  };

  // Render as Link if `to` is provided, otherwise as button
  const element = to && !disabled ? (
    <Link
      {...commonProps}
      to={to}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
    >
      {content}
    </Link>
  ) : (
    <button
      {...commonProps}
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {content}
    </button>
  );

  return (
    <Tooltip content={label} position="right" disabled={disabled}>
      {element}
    </Tooltip>
  );
}

export default NavItem;
