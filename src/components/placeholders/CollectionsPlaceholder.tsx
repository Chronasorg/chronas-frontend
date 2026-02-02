/**
 * CollectionsPlaceholder Component
 *
 * Placeholder component for the Collections drawer content.
 * Will be replaced with actual collections functionality during migration.
 *
 * Requirements: 11.2, 11.3
 */

import React from 'react';
import styles from './FeaturePlaceholder.module.css';

export interface CollectionsPlaceholderProps {
  /** Additional CSS class name */
  className?: string;
}

/**
 * CollectionsPlaceholder displays a placeholder message for the Collections drawer.
 */
export const CollectionsPlaceholder: React.FC<CollectionsPlaceholderProps> = ({
  className,
}) => {
  const containerClass = [
    styles['placeholder'],
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClass} data-testid="collections-placeholder">
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
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          <line x1="12" y1="11" x2="12" y2="17" />
          <line x1="9" y1="14" x2="15" y2="14" />
        </svg>
      </div>
      <h3 className={styles['title']}>Collections</h3>
      <p className={styles['description']}>
        Your saved collections and bookmarks will be available here.
        This feature is coming soon during the migration.
      </p>
    </div>
  );
};

export default CollectionsPlaceholder;
