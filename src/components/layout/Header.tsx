import React from 'react';
import styles from './Header.module.css';

export interface HeaderProps {
  /** Optional className for additional styling */
  className?: string;
}

/**
 * Header component - placeholder for the application header.
 * Will contain navigation, branding, and user controls after migration.
 */
export const Header: React.FC<HeaderProps> = ({ className }) => {
  const headerClass = styles['header'] ?? '';
  
  return (
    <header
      data-testid="header"
      className={`${headerClass} ${className ?? ''}`.trim()}
    >
      <div className={styles['content']}>
        <div className={styles['brand']}>
          <h1 className={styles['title']}>Chronas</h1>
        </div>
        <nav className={styles['nav']}>
          <span className={styles['placeholder']}>
            [Navigation placeholder - to be migrated]
          </span>
        </nav>
        <div className={styles['actions']}>
          <span className={styles['placeholder']}>
            [User actions placeholder]
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
