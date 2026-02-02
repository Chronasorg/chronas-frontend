/**
 * LayersPlaceholder Component
 *
 * Placeholder component for the Layers drawer content.
 * Will be replaced with actual layers functionality during migration.
 *
 * Requirements: 11.1, 11.3
 */

import React from 'react';
import styles from './FeaturePlaceholder.module.css';

export interface LayersPlaceholderProps {
  /** Additional CSS class name */
  className?: string;
}

/**
 * LayersPlaceholder displays a placeholder message for the Layers drawer.
 */
export const LayersPlaceholder: React.FC<LayersPlaceholderProps> = ({
  className,
}) => {
  const containerClass = [
    styles['placeholder'],
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClass} data-testid="layers-placeholder">
      <div className={styles['icon']}>
        <svg
          viewBox="0 0 24 24"
          width="48"
          height="48"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      </div>
      <h3 className={styles['title']}>Layers</h3>
      <p className={styles['description']}>
        Map layers and overlays will be available here.
        This feature is coming soon during the migration.
      </p>
    </div>
  );
};

export default LayersPlaceholder;
