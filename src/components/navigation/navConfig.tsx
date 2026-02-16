/**
 * Navigation Configuration
 *
 * Defines the navigation items for the sidebar.
 * Each item specifies its icon, label, route or action, and visibility conditions.
 *
 * Requirements: 3.1-3.4, 4.1-4.7, 2.2
 *
 * Production reference icons (https://chronas.org) - Material-UI icons:
 * Top section: Layers, Discover (compass), Random (dice), Settings (gear)
 * Bottom section: Star (PRO), Collections, Play (gamepad), Help, Logout (power)
 *
 * Icon styling from production:
 * - viewBox="0 0 24 24"
 * - color: rgb(106, 106, 106)
 * - fill: currentcolor
 * - height: 24px, width: 24px
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
 * These are the EXACT Material-UI icon paths from production (https://chronas.org).
 * Extracted from production HTML.
 */

/** Layers icon - Material-UI maps/layers (EXACT production path) */
export const LayersIcon = (): React.ReactNode => (
  <svg viewBox="0 0 24 24" style={{ display: 'inline-block', fill: 'currentcolor', height: '24px', width: '24px', userSelect: 'none' }}>
    <path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z" />
  </svg>
);

/** Discover icon - Material-UI action/explore compass (EXACT production path) */
export const DiscoverIcon = (): React.ReactNode => (
  <svg viewBox="0 0 24 24" style={{ display: 'inline-block', fill: 'currentcolor', height: '24px', width: '24px', userSelect: 'none' }}>
    <path d="M12 10.9c-.61 0-1.1.49-1.1 1.1s.49 1.1 1.1 1.1c.61 0 1.1-.49 1.1-1.1s-.49-1.1-1.1-1.1zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.19 12.19L6 18l3.81-8.19L18 6l-3.81 8.19z" />
  </svg>
);

/** Random icon - Material-UI places/casino dice (EXACT production path) */
export const RandomIcon = (): React.ReactNode => (
  <svg viewBox="0 0 24 24" style={{ display: 'inline-block', fill: 'currentcolor', height: '24px', width: '24px', userSelect: 'none' }}>
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7.5 18c-.83 0-1.5-.67-1.5-1.5S6.67 15 7.5 15s1.5.67 1.5 1.5S8.33 18 7.5 18zm0-9C6.67 9 6 8.33 6 7.5S6.67 6 7.5 6 9 6.67 9 7.5 8.33 9 7.5 9zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-9c-.83 0-1.5-.67-1.5-1.5S15.67 6 16.5 6s1.5.67 1.5 1.5S17.33 9 16.5 9z" />
  </svg>
);

/** Settings icon - Material-UI action/settings gear (EXACT production path) */
export const SettingsIcon = (): React.ReactNode => (
  <svg viewBox="0 0 24 24" style={{ display: 'inline-block', fill: 'currentcolor', height: '24px', width: '24px', userSelect: 'none' }}>
    <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />
  </svg>
);

/** Star icon - Material-UI action/grade (EXACT production path) */
export const StarIcon = (): React.ReactNode => (
  <svg viewBox="0 0 24 24" style={{ display: 'inline-block', fill: 'currentcolor', height: '24px', width: '24px', userSelect: 'none' }}>
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

/** Collections icon - Material-UI image/collections-bookmark (EXACT production path) */
export const CollectionsIcon = (): React.ReactNode => (
  <svg viewBox="0 0 24 24" style={{ display: 'inline-block', fill: 'currentcolor', height: '24px', width: '24px', userSelect: 'none' }}>
    <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 10l-2.5-1.5L15 12V4h5v8z" />
  </svg>
);

/** Play icon - Material-UI hardware/videogame-asset gamepad (EXACT production path) */
export const PlayIcon = (): React.ReactNode => (
  <svg viewBox="0 0 24 24" style={{ display: 'inline-block', fill: 'currentcolor', height: '24px', width: '24px', userSelect: 'none' }}>
    <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
  </svg>
);

/** Help icon - Material-UI action/help (EXACT production path) */
export const HelpIcon = (): React.ReactNode => (
  <svg viewBox="0 0 24 24" style={{ display: 'inline-block', fill: 'currentcolor', height: '24px', width: '24px', userSelect: 'none' }}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
  </svg>
);

/** Logout icon - Material-UI action/power-settings-new (EXACT production path) */
export const LogoutIcon = (): React.ReactNode => (
  <svg viewBox="0 0 24 24" style={{ display: 'inline-block', fill: 'currentcolor', height: '24px', width: '24px', userSelect: 'none' }}>
    <path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z" />
  </svg>
);

/**
 * Navigation items configuration.
 * Defines all items in the sidebar with their properties.
 * Order matches production (https://chronas.org):
 * Top: Layers, Discover, Random, Settings
 * Bottom: Star (PRO), Collections, Play, Help, Logout
 */
export const NAV_ITEMS: NavItemConfig[] = [
  // Top section - matches production order exactly
  {
    id: 'layers',
    icon: LayersIcon(),
    label: 'Layers',
    action: 'layers',
    section: 'top',
  },
  {
    id: 'discover',
    icon: DiscoverIcon(),
    label: 'Discover',
    to: '/discover',
    section: 'top',
  },
  {
    id: 'random',
    icon: RandomIcon(),
    label: 'Random Article',
    action: 'random',
    section: 'top',
  },
  {
    id: 'settings',
    icon: SettingsIcon(),
    label: 'Configuration',
    to: '/configuration',
    section: 'top',
  },

  // Bottom section - matches production order exactly
  {
    id: 'pro',
    icon: StarIcon(),
    label: 'PRO Version',
    to: '/pro',
    section: 'bottom',
    highlightWhenPro: true,
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
    icon: PlayIcon(),
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
