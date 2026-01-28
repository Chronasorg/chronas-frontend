import type React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';
import { Footer } from './Footer';
import { useUIStore } from '../../stores/uiStore';
import styles from './AppShell.module.css';

export interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * AppShell component - Main layout wrapper combining all layout areas.
 * Requirements: 2.1, 2.4
 */
export const AppShell: React.FC<AppShellProps> = ({ children, className }) => {
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <div
      data-testid="app-shell"
      className={`${styles['shell'] ?? ''} ${sidebarOpen ? styles['sidebarOpen'] ?? '' : styles['sidebarClosed'] ?? ''} ${className ?? ''}`.trim()}
    >
      <Header />
      
      <div className={styles['body']}>
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={toggleSidebar}
        />
        
        <MainContent>
          {children}
        </MainContent>
      </div>
      
      <Footer />
    </div>
  );
};

export default AppShell;
