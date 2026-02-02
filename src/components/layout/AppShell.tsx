import type React from 'react';
import { Header } from './Header';
import { MainContent } from './MainContent';
import { Footer } from './Footer';
import { Sidebar } from '../navigation/Sidebar';
import { MenuDrawer } from '../navigation/MenuDrawer';
import { LayersPlaceholder, CollectionsPlaceholder } from '../placeholders';
import { Timeline } from '../timeline/Timeline/Timeline';
import { useUIStore } from '../../stores/uiStore';
import { useNavigationStore } from '../../stores/navigationStore';
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
  const { drawerOpen, drawerContent, closeDrawer } = useNavigationStore();

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
        
        <MenuDrawer
          isOpen={drawerOpen}
          contentType={drawerContent}
          onClose={closeDrawer}
        >
          {drawerContent === 'layers' && <LayersPlaceholder />}
          {drawerContent === 'collections' && <CollectionsPlaceholder />}
        </MenuDrawer>
        
        <MainContent>
          {children}
        </MainContent>
      </div>
      
      <Timeline />
      
      <Footer />
    </div>
  );
};

export default AppShell;
