/**
 * RightDrawer Component
 *
 * A sliding panel from the right side of the screen (25% width) for displaying
 * detailed content about provinces or markers.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.10, 10.2, 10.4, 10.5
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DrawerContent } from '@/stores/uiStore';
import { useMapStore } from '@/stores/mapStore';
import { ProvinceDrawerContent } from '@/components/content/ProvinceDrawerContent/ProvinceDrawerContent';
import { MarkerDrawerContent } from '@/components/content/MarkerDrawerContent/MarkerDrawerContent';
import { ArticleIframe } from '@/components/content/ArticleIframe/ArticleIframe';
import styles from './RightDrawer.module.css';

export interface RightDrawerProps {
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Content to display */
  content: DrawerContent | null;
  /** Callback when close is requested */
  onClose: () => void;
}

/**
 * Gets the title to display in the drawer header based on content type
 */
function getDrawerTitle(content: DrawerContent | null): string {
  if (!content) return '';

  switch (content.type) {
    case 'area':
      return content.provinceName;
    case 'marker':
      return content.marker.name;
    case 'epic':
      return content.epicName;
    default:
      return '';
  }
}

/**
 * RightDrawer component - sliding panel from the right edge of the screen.
 *
 * Features:
 * - 25% viewport width (Requirement 4.1)
 * - 300ms slide animation (Requirement 4.2)
 * - Close button in header (Requirement 4.3)
 * - Header with title (Requirement 4.4)
 * - Scrollable content area (Requirement 4.5)
 * - Escape key to close (Requirement 4.6, 10.4)
 * - Shadow on left edge (Requirement 4.7)
 * - ARIA attributes for accessibility (Requirement 4.10, 10.5)
 * - Focus trap when open (Requirement 10.2)
 */
export const RightDrawer: React.FC<RightDrawerProps> = ({
  isOpen,
  content,
  onClose,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const { t } = useTranslation();

  // Resize state (US-3.2)
  const [drawerWidth, setDrawerWidth] = useState('35%');
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  // Get metadata and province data from mapStore for rendering content
  const metadata = useMapStore((state) => state.metadata);
  const currentAreaData = useMapStore((state) => state.currentAreaData);

  // Drag handle resize handlers (US-3.2)
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartWidth.current = drawerRef.current?.getBoundingClientRect().width ?? window.innerWidth * 0.5;
  }, []);

  useEffect(() => {
    if (!isDragging) return undefined;

    const handleDragMove = (e: MouseEvent) => {
      const delta = dragStartX.current - e.clientX;
      const newWidth = Math.max(300, Math.min(window.innerWidth * 0.8, dragStartWidth.current + delta));
      setDrawerWidth(`${String(newWidth)}px`);
    };

    const handleDragEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging]);

  // Handle Escape key to close drawer (Requirement 4.6, 10.4)
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        onClose();
      }
    },
    [isOpen, onClose]
  );

  // Focus trap implementation (Requirement 10.2)
  const handleFocusTrap = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen || event.key !== 'Tab' || !drawerRef.current) return;

      const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Safety check for undefined elements
      if (!firstElement || !lastElement) return;

      if (event.shiftKey) {
        // Shift + Tab: if on first element, go to last
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: if on last element, go to first
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    },
    [isOpen]
  );

  // Set up keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleFocusTrap);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleFocusTrap);
    };
  }, [handleKeyDown, handleFocusTrap]);

  // Focus management: focus close button when opening, restore focus when closing
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;
      // Focus the close button after animation starts
      const timeoutId = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timeoutId);
    }
    // Restore focus to the previously focused element when closing
    if (previousActiveElement.current) {
      previousActiveElement.current.focus();
      previousActiveElement.current = null;
    }
    return undefined;
  }, [isOpen]);

  const title = getDrawerTitle(content);

  // Safe CSS class access
  const drawerClass = styles['drawer'] ?? '';
  const openClass = styles['open'] ?? '';
  const closedClass = styles['closed'] ?? '';
  const headerClass = styles['header'] ?? '';
  const titleClass = styles['title'] ?? '';
  const closeButtonClass = styles['closeButton'] ?? '';
  const contentClass = styles['content'] ?? '';
  const contentInnerClass = styles['contentInner'] ?? '';
  const placeholderClass = styles['placeholder'] ?? '';
  const placeholderNoteClass = styles['placeholderNote'] ?? '';
  const emptyStateClass = styles['emptyState'] ?? '';

  const draggingClass = styles['dragging'] ?? '';

  return (
    <aside
      ref={drawerRef}
      data-testid="right-drawer"
      className={`${drawerClass} ${isOpen ? openClass : closedClass} ${isDragging ? draggingClass : ''}`}
      style={isOpen ? { width: drawerWidth } : undefined}
      role="complementary"
      aria-label="Content details panel"
      aria-hidden={!isOpen}
    >
      {/* Drag handle for resizing (US-3.2) */}
      {isOpen && (
        <div
          className={styles['dragHandle'] ?? ''}
          onMouseDown={handleDragStart}
          data-testid="right-drawer-drag-handle"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panel"
        />
      )}
      {/* Header with title and close button (Requirements 4.3, 4.4) */}
      <header className={headerClass}>
        <h2 className={titleClass} data-testid="right-drawer-title">
          {title}
        </h2>
        <button
          ref={closeButtonRef}
          type="button"
          className={closeButtonClass}
          onClick={onClose}
          aria-label={t('drawer.closePanel', 'Close panel')}
          data-testid="right-drawer-close"
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>

      {/* Scrollable content area (Requirement 4.5) */}
      <div className={contentClass} data-testid="right-drawer-content">
        {content ? (
          <div className={contentInnerClass}>
            {/* Render ProvinceDrawerContent for area type */}
            {content.type === 'area' && (() => {
              const provinceData = currentAreaData?.[content.provinceId];
              if (provinceData) {
                return (
                  <ProvinceDrawerContent
                    provinceId={content.provinceId}
                    provinceData={provinceData}
                    metadata={metadata}
                    {...(content.wikiUrl ? { wikiUrl: content.wikiUrl } : {})}
                  />
                );
              }
              // No province data — show Wikipedia article directly if URL available
              if (content.wikiUrl) {
                return (
                  <ArticleIframe
                    url={content.wikiUrl}
                    title={`Wikipedia article for ${content.provinceName}`}
                  />
                );
              }
              return (
                <div className={placeholderClass}>
                  <p>Province: {content.provinceName}</p>
                  <p className={placeholderNoteClass}>
                    {t('drawer.provinceDataNotAvailable', 'Province data not available for this selection.')}
                  </p>
                </div>
              );
            })()}
            {/* Render MarkerDrawerContent for marker type */}
            {content.type === 'marker' && (
              <MarkerDrawerContent marker={content.marker} />
            )}
            {/* Render ArticleIframe for epic type (Requirement 6.3) */}
            {content.type === 'epic' && (
              <ArticleIframe
                url={content.wikiUrl}
                title={`Wikipedia article: ${content.epicName}`}
              />
            )}
          </div>
        ) : (
          <div className={emptyStateClass}>
            <p>{t('drawer.noContent', 'No content selected')}</p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default RightDrawer;
