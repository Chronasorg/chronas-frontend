import type React from 'react';
import { Header } from './Header';
import { MainContent } from './MainContent';
import { Footer } from './Footer';
import { Sidebar } from '../navigation/Sidebar';
import { MenuDrawer } from '../navigation/MenuDrawer';
import { RightDrawer } from './RightDrawer/RightDrawer';
import { CollectionsPlaceholder } from '../placeholders';
import { LayersContent } from '../navigation/LayersContent';
import { Timeline } from '../timeline/Timeline/Timeline';
import { useUIStore } from '../../stores/uiStore';
import { useNavigationStore } from '../../stores/navigationStore';
import { clearURLParams } from '../../utils/urlStateUtils';
import styles from './AppShell.module.css';

export interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * AppShell component - Main layout wrapper combining all layout areas.
 * Requirements: 2.1, 2.4, 2.7, 2.8, 2.9
 */
export const AppShell: React.FC<AppShellProps> = ({ children, className }) => {
  const { sidebarOpen, toggleSidebar, rightDrawerOpen, rightDrawerContent, closeRightDrawer } = useUIStore();
  const { drawerOpen, drawerContent, closeDrawer } = useNavigationStore();

  /**
   * Handles closing the right drawer and clearing URL params.
   * Requirement 2.7: WHEN the close button is clicked, THE RightDrawer SHALL close
   * Requirement 2.9: WHEN the RightDrawer closes, THE System SHALL remove type and value from URL
   */
  const handleRightDrawerClose = () => {
    closeRightDrawer();
    clearURLParams(['type', 'value']);
  };

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
          {drawerContent === 'layers' && <LayersContent />}
          {drawerContent === 'collections' && <CollectionsPlaceholder />}
        </MenuDrawer>
        
        <MainContent>
          {children}
        </MainContent>
        
        {/* Right drawer for province/marker details */}
        {/* Requirement 2.1: WHEN a province is clicked, THE RightDrawer SHALL open */}
        {/* Requirement 2.2: WHEN the RightDrawer opens, THE MapView SHALL reduce its width by 25% */}
        <RightDrawer
          isOpen={rightDrawerOpen}
          content={rightDrawerContent}
          onClose={handleRightDrawerClose}
        />
      </div>
      
      <Timeline />
      
      <Footer />
    </div>
  );
};

export default AppShell;
