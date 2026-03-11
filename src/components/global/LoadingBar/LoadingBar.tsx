/**
 * LoadingBar Component
 *
 * Displays a loading progress bar at the top of the viewport.
 * Matches production: fixed position, full width, z-index 1000000.
 *
 * Requirements: US-1.4
 */

import { useEffect, useState } from 'react';
import { useLoadingStore } from '../../../stores/loadingStore';
import styles from './LoadingBar.module.css';

export interface LoadingBarProps {
  testId?: string;
}

export function LoadingBar({ testId = 'loading-bar' }: LoadingBarProps) {
  const { isLoading } = useLoadingStore();
  const [visible, setVisible] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setVisible(true);
      setComplete(false);
      return undefined;
    }
    if (visible) {
      setComplete(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setComplete(false);
      }, 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isLoading, visible]);

  if (!visible) return null;

  const barClass = [
    styles['bar'],
    complete ? styles['complete'] : styles['active'],
  ].filter(Boolean).join(' ');

  const containerClass = styles['loadingBar'] ?? '';

  return (
    <div
      className={containerClass}
      role="progressbar"
      aria-label="Loading"
      aria-busy={isLoading}
      data-testid={testId}
    >
      <div className={barClass} />
    </div>
  );
}

export default LoadingBar;
