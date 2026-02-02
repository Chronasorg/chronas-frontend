/**
 * Navigation Configuration
 *
 * Defines the navigation items for the sidebar.
 * Each item specifies its icon, label, route or action, and visibility conditions.
 *
 * Requirements: 3.1-3.4, 4.1-4.7
 */

import type React from 'react';

/**
 * Action types for navigation items that don't navigate to a route.
 */
export type NavAction = 'layers' | 'collections' | 'random' | 'logout';

/**
 * Navigation item configuration interface.
 */
export interface NavItemConfig {
  /** Unique identifier for the item */
  id: string;
  /** Icon component to render */
  icon: React.ReactNode;
  /** Tooltip text and aria-label */
  label: string;
  /** Navigation path (if navigating to a route) */
  to?: string;
  /** Action to perform (if not navigating) */
  action?: NavAction;
  /** Section of the sidebar (top or bottom) */
  section: 'top' | 'bottom';
  /** Whether the item requires authentication to be visible */
  requiresAuth?: boolean;
  /** Whether the item should only show when authenticated */
  showWhenAuth?: boolean;
  /** Whether to highlight when user has PRO subscription */
  highlightWhenPro?: boolean;
  /** Whether to highlight when user is authenticated */
  highlightWhenAuth?: boolean;
}

/**
 * SVG Icon components for navigation items.
 * These are inline SVGs to avoid external dependencies.
 */

/** Layers icon - stacked layers */
export const LayersIcon = (): React.ReactNode => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

/** Explore/Discover icon - compass */
export const ExploreIcon = (): React.ReactNode => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

/** Casino/Random icon - dice */
export const CasinoIcon = (): React.ReactNode => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
    <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" />
    <circle cx="8.5" cy="15.5" r="1.5" fill="currentColor" />
    <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

/** Settings icon - gear */
export const SettingsIcon = (): React.ReactNode => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

/** Star icon - PRO */
export const StarIcon = (): React.ReactNode => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

/** Forum/Community icon - message bubbles */
export const ForumIcon = (): React.ReactNode => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

/** Collections/Folder icon */
export const CollectionsIcon = (): React.ReactNode => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

/** Game/Play icon - gamepad */
export const GameIcon = (): React.ReactNode => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="12" x2="10" y2="12" />
    <line x1="8" y1="10" x2="8" y2="14" />
    <circle cx="15" cy="13" r="1" fill="currentColor" />
    <circle cx="18" cy="11" r="1" fill="currentColor" />
    <rect x="2" y="6" width="20" height="12" rx="2" />
  </svg>
);

/** Help icon - question mark circle */
export const HelpIcon = (): React.ReactNode => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

/** Logout icon - log out arrow */
export const LogoutIcon = (): React.ReactNode => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

/**
 * Navigation items configuration.
 * Defines all items in the sidebar with their properties.
 */
export const NAV_ITEMS: NavItemConfig[] = [
  // Top section
  {
    id: 'layers',
    icon: LayersIcon(),
    label: 'Layers',
    action: 'layers',
    section: 'top',
  },
  {
    id: 'discover',
    icon: ExploreIcon(),
    label: 'Discover',
    to: '/discover',
    section: 'top',
  },
  {
    id: 'random',
    icon: CasinoIcon(),
    label: 'Random',
    action: 'random',
    section: 'top',
  },
  {
    id: 'settings',
    icon: SettingsIcon(),
    label: 'Settings',
    to: '/configuration',
    section: 'top',
  },

  // Bottom section
  {
    id: 'pro',
    icon: StarIcon(),
    label: 'PRO Version',
    to: '/pro',
    section: 'bottom',
    highlightWhenPro: true,
  },
  {
    id: 'community',
    icon: ForumIcon(),
    label: 'Community',
    to: '/community/general',
    section: 'bottom',
    showWhenAuth: true,
  },
  {
    id: 'collections',
    icon: CollectionsIcon(),
    label: 'Collections',
    action: 'collections',
    section: 'bottom',
  },
  {
    id: 'play',
    icon: GameIcon(),
    label: 'Play',
    to: '/play',
    section: 'bottom',
  },
  {
    id: 'help',
    icon: HelpIcon(),
    label: 'Help',
    to: '/info',
    section: 'bottom',
  },
  {
    id: 'logout',
    icon: LogoutIcon(),
    label: 'Logout',
    action: 'logout',
    section: 'bottom',
    highlightWhenAuth: true,
  },
];

/**
 * Get navigation items filtered by section.
 */
export function getNavItemsBySection(section: 'top' | 'bottom'): NavItemConfig[] {
  return NAV_ITEMS.filter((item) => item.section === section);
}

/**
 * Get a navigation item by ID.
 */
export function getNavItemById(id: string): NavItemConfig | undefined {
  return NAV_ITEMS.find((item) => item.id === id);
}
