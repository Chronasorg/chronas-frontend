/**
 * Tooltip Component
 *
 * A lightweight tooltip for navigation items that appears on hover.
 * Uses CSS positioning without portals for simplicity.
 *
 * Requirements: 3.5, 3.6, 8.1
 */

import { useState, useRef, useCallback, type ReactNode } from 'react';
import styles from './Tooltip.module.css';

/**
 * Tooltip position options
 */
export type TooltipPosition = 'right' | 'bottom-right';

/**
 * Tooltip component props
 */
export interface TooltipProps {
  /** Content to display in tooltip */
  content: string;
  /** Position relative to trigger */
  position?: TooltipPosition;
  /** Delay before showing (ms) */
  delay?: number;
  /** Children to wrap */
  children: ReactNode;
  /** Whether tooltip is disabled */
  disabled?: boolean;
  /** Test ID for testing */
  testId?: string;
}

/**
 * Tooltip component that displays content on hover.
 *
 * @param props - Tooltip props
 * @returns The tooltip wrapper element
 */
export function Tooltip({
  content,
  position = 'right',
  delay = 200,
  children,
  disabled = false,
  testId,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = useCallback(() => {
    if (disabled) return;
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  }, [delay, disabled]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  }, []);

  const positionClass = position === 'bottom-right' 
    ? styles['tooltip--bottom-right'] ?? ''
    : styles['tooltip--right'] ?? '';

  return (
    <div
      className={styles['tooltip-wrapper'] ?? ''}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      data-testid={testId}
    >
      {children}
      {isVisible && !disabled && (
        <div
          className={`${styles['tooltip'] ?? ''} ${positionClass}`}
          role="tooltip"
          data-testid={testId ? `${testId}-content` : undefined}
        >
          {content}
        </div>
      )}
    </div>
  );
}

export default Tooltip;
