/**
 * UI Preferences Store
 *
 * Manages UI preferences state with localStorage persistence.
 * Uses Zustand for state management with persist middleware.
 *
 * Requirements: 4.2, 4.3
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// localStorage key for UI preferences
const UI_STORAGE_KEY = 'chs_ui_preferences';

/**
 * Available theme options
 */
export type Theme = 'light' | 'dark' | 'luther';

/**
 * UI state interface
 */
export interface UIState {
  theme: Theme;
  locale: string;
  sidebarOpen: boolean;
  isFullscreen: boolean;
}

/**
 * UI actions interface
 */
export interface UIActions {
  setTheme: (theme: Theme) => void;
  setLocale: (locale: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setFullscreen: (isFullscreen: boolean) => void;
  resetToDefaults: () => void;
}

/**
 * Combined UI store type
 */
export type UIStore = UIState & UIActions;

/**
 * Default UI state values
 */
const defaultState: UIState = {
  theme: 'light',
  locale: 'en',
  sidebarOpen: true,
  isFullscreen: false,
};

/**
 * Validates a theme value
 *
 * @param theme - The theme value to validate
 * @returns true if the theme is valid
 */
export function isValidTheme(theme: unknown): theme is Theme {
  return theme === 'light' || theme === 'dark' || theme === 'luther';
}

/**
 * Validates a locale string
 *
 * @param locale - The locale value to validate
 * @returns true if the locale is a non-empty string
 */
export function isValidLocale(locale: unknown): locale is string {
  return typeof locale === 'string' && locale.length > 0;
}

/**
 * Zustand UI store with localStorage persistence
 *
 * Uses the persist middleware to automatically save and restore
 * UI preferences to/from localStorage.
 */
export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // Initial state
      ...defaultState,

      /**
       * Sets the application theme.
       *
       * @param theme - The theme to set ('light', 'dark', or 'luther')
       */
      setTheme: (theme: Theme) => {
        if (!isValidTheme(theme)) {
          console.warn(`Invalid theme value: ${String(theme)}, ignoring`);
          return;
        }
        set({ theme });
      },

      /**
       * Sets the application locale.
       *
       * @param locale - The locale code to set (e.g., 'en', 'de', 'fr')
       */
      setLocale: (locale: string) => {
        if (!isValidLocale(locale)) {
          console.warn(`Invalid locale value: ${String(locale)}, ignoring`);
          return;
        }
        set({ locale });
      },

      /**
       * Toggles the sidebar open/closed state.
       */
      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      /**
       * Sets the sidebar open state directly.
       *
       * @param open - Whether the sidebar should be open
       */
      setSidebarOpen: (open: boolean) => {
        set({ sidebarOpen: open });
      },

      /**
       * Sets the fullscreen state.
       *
       * @param isFullscreen - Whether the app is in fullscreen mode
       */
      setFullscreen: (isFullscreen: boolean) => {
        set({ isFullscreen });
      },

      /**
       * Resets all UI preferences to default values.
       */
      resetToDefaults: () => {
        set(defaultState);
      },
    }),
    {
      name: UI_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Only persist these specific state properties (not actions)
      partialize: (state) => ({
        theme: state.theme,
        locale: state.locale,
        sidebarOpen: state.sidebarOpen,
        isFullscreen: state.isFullscreen,
      }),
      // Handle migration from older storage formats if needed
      version: 1,
      migrate: (persistedState: unknown, version: number) => {
        if (version === 0) {
          // Migration from version 0 to 1 (if needed in future)
          return persistedState as UIState;
        }
        return persistedState as UIState;
      },
      // Handle storage errors gracefully
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Failed to rehydrate UI store from localStorage:', error);
        } else if (state) {
          // Validate rehydrated state
          if (!isValidTheme(state.theme)) {
            state.theme = defaultState.theme;
          }
          if (!isValidLocale(state.locale)) {
            state.locale = defaultState.locale;
          }
        }
      },
    }
  )
);

// Export the storage key for testing purposes
export { UI_STORAGE_KEY };

// Export default state for testing
export { defaultState };
