/**
 * Navigation Store
 *
 * Manages navigation state including drawer open/close state and active navigation item.
 * Uses Zustand for state management.
 *
 * Requirements: 10.2
 */

import { create } from 'zustand';

/**
 * Drawer content types
 */
export type DrawerContent = 'layers' | 'collections';

/**
 * Navigation state interface
 */
export interface NavigationState {
  /** Whether the menu drawer is open */
  drawerOpen: boolean;
  /** Current drawer content type */
  drawerContent: DrawerContent | null;
  /** Currently active navigation item */
  activeItem: string | null;
}

/**
 * Navigation actions interface
 */
export interface NavigationActions {
  /** Open the drawer with specific content */
  openDrawer: (content: DrawerContent) => void;
  /** Close the drawer */
  closeDrawer: () => void;
  /** Toggle drawer for specific content */
  toggleDrawer: (content: DrawerContent) => void;
  /** Set the active navigation item */
  setActiveItem: (item: string | null) => void;
}

/**
 * Combined navigation store type
 */
export type NavigationStore = NavigationState & NavigationActions;

/**
 * Initial navigation state
 */
const initialState: NavigationState = {
  drawerOpen: false,
  drawerContent: null,
  activeItem: null,
};

/**
 * Zustand navigation store
 */
export const useNavigationStore = create<NavigationStore>((set, get) => ({
  // Initial state
  ...initialState,

  /**
   * Opens the drawer with the specified content type.
   *
   * @param content - The content type to display ('layers' or 'collections')
   */
  openDrawer: (content: DrawerContent) => {
    set({
      drawerOpen: true,
      drawerContent: content,
    });
  },

  /**
   * Closes the drawer and clears the content type.
   */
  closeDrawer: () => {
    set({
      drawerOpen: false,
      drawerContent: null,
    });
  },

  /**
   * Toggles the drawer for the specified content type.
   * If the drawer is open with the same content, it closes.
   * If the drawer is closed or has different content, it opens with the new content.
   *
   * @param content - The content type to toggle ('layers' or 'collections')
   */
  toggleDrawer: (content: DrawerContent) => {
    const { drawerOpen, drawerContent } = get();

    if (drawerOpen && drawerContent === content) {
      // Same content, close the drawer
      set({
        drawerOpen: false,
        drawerContent: null,
      });
    } else {
      // Different content or closed, open with new content
      set({
        drawerOpen: true,
        drawerContent: content,
      });
    }
  },

  /**
   * Sets the currently active navigation item.
   *
   * @param item - The ID of the active navigation item, or null to clear
   */
  setActiveItem: (item: string | null) => {
    set({ activeItem: item });
  },
}));

// Export initial state for testing
export { initialState };
