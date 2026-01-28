import React from 'react';
import styles from './Sidebar.module.css';

export interface SidebarProps {
  /** Whether the sidebar is open/visible */
  isOpen?: boolean;
  /** Optional className for additional styling */
  className?: string;
  /** Callback when sidebar toggle is requested */
  onToggle?: () => void;
}

/**
 * Sidebar component - placeholder for the application sidebar.
 * Will contain navigation menu, filters, and tools after migration.
 */
export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = true,
  className,
  onToggle,
}) => {
  const sidebarClass = styles['sidebar'] ?? '';
  const stateClass = isOpen ? (styles['open'] ?? '') : (styles['closed'] ?? '');
  
  return (
    <aside
      data-testid="sidebar"
      className={`${sidebarClass} ${stateClass} ${className ?? ''}`.trim()}
      aria-label="Sidebar navigation"
    >
      <div className={styles['content']}>
        <div className={styles['section']}>
          <h2 className={styles['sectionTitle']}>Navigation</h2>
          <div className={styles['placeholder']}>
            [Menu items placeholder - to be migrated]
          </div>
        </div>

        <div className={styles['section']}>
          <h2 className={styles['sectionTitle']}>Filters</h2>
          <div className={styles['placeholder']}>
            [Filter controls placeholder]
          </div>
        </div>

        <div className={styles['section']}>
          <h2 className={styles['sectionTitle']}>Tools</h2>
          <div className={styles['placeholder']}>
            [Tool buttons placeholder]
          </div>
        </div>
      </div>

      {onToggle && (
        <button
          className={styles['toggleButton']}
          onClick={onToggle}
          aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
          data-testid="sidebar-toggle"
        >
          {isOpen ? '◀' : '▶'}
        </button>
      )}
    </aside>
  );
};

export default Sidebar;
