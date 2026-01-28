import type React from 'react';
import styles from './FeaturePlaceholder.module.css';

export interface FeaturePlaceholderProps {
  featureName: string;
  description?: string;
  migrationPriority?: 'high' | 'medium' | 'low';
}

/**
 * FeaturePlaceholder component - displays placeholder for features pending migration.
 * Requirements: 2.2
 */
export const FeaturePlaceholder: React.FC<FeaturePlaceholderProps> = ({
  featureName,
  description,
  migrationPriority = 'medium',
}) => {
  const priorityColors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#22c55e',
  };

  return (
    <div
      data-testid="feature-placeholder"
      className={styles['placeholder'] ?? ''}
    >
      <div className={styles['icon']}>📦</div>
      <h3 className={styles['title']}>{featureName}</h3>
      {description && <p className={styles['description']}>{description}</p>}
      <div className={styles['status']}>
        <span
          className={styles['priority']}
          style={{ backgroundColor: priorityColors[migrationPriority] }}
        >
          {migrationPriority} priority
        </span>
        <span className={styles['badge']}>Pending Migration</span>
      </div>
    </div>
  );
};

export default FeaturePlaceholder;
