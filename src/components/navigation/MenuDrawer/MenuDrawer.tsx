/**
 * MenuDrawer Component
 *
 * A slide-out panel for displaying Layers or Collections content.
 * Positioned to the right of the sidebar.
 * 
 * - Layers: Light theme, no header (LayersContent has its own)
 * - Collections: Dark theme, with header
 *
 * Requirements: 6.1-6.9
 */

import React, { useEffect, useRef } from 'react';
import styles from './MenuDrawer.module.css';

export interface MenuDrawerProps {
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Content type to display */
  contentType: 'layers' | 'collections' | null;
  /** Callback when close is requested */
  onClose: () => void;
  /** Children to render in the content area */
  children?: React.ReactNode;
  /** Additional CSS class name */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

/**
 * Gets the title based on content type.
 */
function getTitle(contentType: 'layers' | 'collections' | null): string {
  switch (contentType) {
    case 'layers':
      return 'Layers';
    case 'collections':
      return 'Collections';
    default:
      return '';
  }
}

/**
 * MenuDrawer component that slides out from the left side.
 * Displays a header with title and close button, and a scrollable content area.
 * Uses light theme for Layers (matching production), dark theme for Collections.
 */
export const MenuDrawer: React.FC<MenuDrawerProps> = ({
  isOpen,
  contentType,
  onClose,
  children,
  className,
  testId = 'menu-drawer',
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Determine if using light theme (for Layers)
  const isLightTheme = contentType === 'layers';
  // Hide header for Layers (LayersContent has its own header)
  const hideHeader = contentType === 'layers';

  // Focus trap and focus management
  useEffect(() => {
    if (isOpen && closeButtonRef.current && !hideHeader) {
      closeButtonRef.current.focus();
    }
  }, [isOpen, hideHeader]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const drawerClass = [
    styles['drawer'],
    isOpen && styles['open'],
    isLightTheme && styles['light'],
    className,
  ].filter(Boolean).join(' ');

  const headerClass = [
    styles['header'],
    hideHeader && styles['headerHidden'],
  ].filter(Boolean).join(' ');

  const contentClass = [
    styles['content'],
    !isLightTheme && styles['padded'],
  ].filter(Boolean).join(' ');

  const title = getTitle(contentType);

  return (
    <div
      ref={drawerRef}
      className={drawerClass}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Menu drawer'}
      aria-hidden={!isOpen}
      data-testid={testId}
    >
      <div className={headerClass}>
        <h2 className={styles['title']} data-testid={`${testId}-title`}>
          {title}
        </h2>
        <button
          ref={closeButtonRef}
          type="button"
          className={styles['closeButton']}
          onClick={onClose}
          aria-label="Close drawer"
          data-testid={`${testId}-close`}
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div
        className={contentClass}
        data-testid={`${testId}-content`}
      >
        {children}
      </div>
    </div>
  );
};

export default MenuDrawer;
