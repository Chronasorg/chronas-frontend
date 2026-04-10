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
import {
  LayersIcon,
  DiscoverIcon,
  RandomIcon,
  SettingsIcon,
  StarIcon,
  CollectionsIcon,
  PlayIcon,
  HelpIcon,
  LogoutIcon,
} from './navConfig.icons';

/**
 * Action types for navigation items that don't navigate to a route.
 */
export type NavAction = 'layers' | 'collections' | 'random' | 'logout' | 'settings' | 'help';

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
  /** Whether the item is disabled (not yet implemented) */
  disabled?: boolean;
}

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
    disabled: true, // Deferred: Discover page not yet implemented
  },
  {
    id: 'random',
    icon: RandomIcon(),
    label: 'Random Article',
    action: 'random',
    section: 'top',
    disabled: true,
  },
  {
    id: 'settings',
    icon: SettingsIcon(),
    label: 'Configuration',
    action: 'settings',
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
    disabled: true, // Deferred: PRO subscription page not yet implemented
  },
  {
    id: 'collections',
    icon: CollectionsIcon(),
    label: 'Collections',
    action: 'collections',
    section: 'bottom',
    disabled: true, // Deferred: Collections system not yet implemented
  },
  {
    id: 'play',
    icon: PlayIcon(),
    label: 'Play',
    to: '/play',
    section: 'bottom',
    disabled: true, // Deferred: Autoplay page not yet implemented
  },
  {
    id: 'help',
    icon: HelpIcon(),
    label: 'Help',
    action: 'help',
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

