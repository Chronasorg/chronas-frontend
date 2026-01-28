import React from 'react';
import styles from './MainContent.module.css';

export interface MainContentProps {
  /** Content to render in the main area */
  children: React.ReactNode;
  /** Optional className for additional styling */
  className?: string;
}

/**
 * MainContent component - wrapper for the main content area.
 * Provides consistent styling and layout for page content.
 */
export const MainContent: React.FC<MainContentProps> = ({
  children,
  className,
}) => {
  const mainContentClass = styles['mainContent'] ?? '';
  
  return (
    <main
      data-testid="main-content"
      className={`${mainContentClass} ${className ?? ''}`.trim()}
      role="main"
    >
      <div className={styles['content']}>
        {children}
      </div>
    </main>
  );
};

export default MainContent;
