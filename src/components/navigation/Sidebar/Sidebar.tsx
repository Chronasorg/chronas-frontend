/**
 * Sidebar Component
 *
 * The main navigation container that renders the vertical icon menu.
 * Integrates with useUIStore, useAuthStore, and useNavigationStore.
 *
 * Requirements: 1.1-1.6, 7.1-7.5, 10.1, 10.3, 10.4
 */

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../Logo';
import { NavItem } from '../NavItem';
import { UserAvatar } from '../UserAvatar';
import { getNavItemsBySection, type NavItemConfig } from '../navConfig';
import { useUIStore } from '../../../stores/uiStore';
import { useAuthStore } from '../../../stores/authStore';
import { useNavigationStore } from '../../../stores/navigationStore';
import styles from './Sidebar.module.css';

export interface SidebarProps {
  /** Whether the sidebar is open (for mobile responsive behavior) */
  isOpen?: boolean;
  /** Callback when sidebar toggle is requested */
  onToggle?: () => void;
  /** Additional CSS class name */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

/**
 * Sidebar component - the main navigation container.
 * Renders Logo, NavItems, and UserAvatar based on authentication state.
 */
export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = true,
  onToggle,
  className,
  testId = 'navigation-sidebar',
}) => {
  const navigate = useNavigate();
  const { theme } = useUIStore();
  const { isAuthenticated, username, avatar, score, subscription, clearUser } = useAuthStore();
  const { toggleDrawer, drawerOpen, drawerContent } = useNavigationStore();

  const topItems = getNavItemsBySection('top');
  const bottomItems = getNavItemsBySection('bottom');

  const isPro = subscription === 'pro';

  /**
   * Handle navigation item click.
   * Routes to path or triggers action based on item configuration.
   */
  const handleItemClick = useCallback(
    (item: NavItemConfig) => {
      if (item.action) {
        switch (item.action) {
          case 'layers':
            toggleDrawer('layers');
            break;
          case 'collections':
            toggleDrawer('collections');
            break;
          case 'random':
            // TODO: Implement random area selection
            console.log('Random action triggered');
            break;
          case 'logout':
            if (isAuthenticated) {
              clearUser();
              navigate('/');
            } else {
              // Trigger login flow
              navigate('/login');
            }
            break;
        }
      }
    },
    [toggleDrawer, isAuthenticated, clearUser, navigate]
  );

  /**
   * Handle user avatar click - navigate to profile.
   */
  const handleAvatarClick = useCallback(() => {
    if (username) {
      navigate(`/community/user/${username}`);
    }
  }, [navigate, username]);

  /**
   * Determine if a navigation item should be visible.
   */
  const isItemVisible = (item: NavItemConfig): boolean => {
    if (item.showWhenAuth && !isAuthenticated) {
      return false;
    }
    return true;
  };

  /**
   * Determine if a navigation item should be highlighted.
   */
  const isItemHighlighted = (item: NavItemConfig): boolean => {
    if (item.highlightWhenPro && isPro) {
      return true;
    }
    if (item.highlightWhenAuth && isAuthenticated) {
      return true;
    }
    return false;
  };

  /**
   * Determine if a navigation item is active (drawer open with matching content).
   */
  const isItemActive = (item: NavItemConfig): boolean => {
    if (item.action === 'layers' && drawerOpen && drawerContent === 'layers') {
      return true;
    }
    if (item.action === 'collections' && drawerOpen && drawerContent === 'collections') {
      return true;
    }
    return false;
  };

  /**
   * Render a navigation item with optional separator.
   */
  const renderNavItem = (item: NavItemConfig) => {
    if (!isItemVisible(item)) {
      return null;
    }

    return (
      <React.Fragment key={item.id}>
        <NavItem
          icon={item.icon}
          label={item.label}
          to={item.disabled ? undefined : item.to}
          onClick={item.action && !item.disabled ? () => handleItemClick(item) : undefined}
          isActive={isItemActive(item)}
          isHighlighted={isItemHighlighted(item)}
          disabled={item.disabled === true}
          testId={`nav-item-${item.id}`}
        />
      </React.Fragment>
    );
  };

  const sidebarClass = [
    styles['sidebar'],
    isOpen && styles['open'],
    !isOpen && styles['closed'],
    className,
  ].filter(Boolean).join(' ');

  return (
    <aside
      className={sidebarClass}
      aria-label="Main navigation"
      data-testid={testId}
      data-theme={theme}
    >
      <div className={styles['content']}>
        {/* Logo at top */}
        <div className={styles['logoSection']}>
          <Logo testId="sidebar-logo" />
        </div>

        {/* Top navigation items */}
        <nav className={styles['topSection']} aria-label="Primary navigation" data-testid="nav-section-top">
          {topItems.map(renderNavItem)}
        </nav>

        {/* Spacer */}
        <div className={styles['spacer']} />

        {/* Bottom navigation items */}
        <nav className={styles['bottomSection']} aria-label="Secondary navigation" data-testid="nav-section-bottom">
          {bottomItems.map(renderNavItem)}

          {/* User avatar (shown when authenticated) */}
          {isAuthenticated && (
            <div className={styles['avatarSection']}>
              <UserAvatar
                avatarUrl={avatar}
                username={username}
                score={score}
                onClick={handleAvatarClick}
                testId="sidebar-user-avatar"
              />
            </div>
          )}
        </nav>
      </div>

      {/* Mobile toggle button */}
      {onToggle && (
        <button
          type="button"
          className={styles['toggleButton']}
          onClick={onToggle}
          aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
          data-testid="sidebar-toggle"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {isOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      )}
    </aside>
  );
};

export default Sidebar;
