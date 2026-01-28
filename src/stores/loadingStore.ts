/**
 * Loading State Store
 *
 * Manages global loading state for the application.
 * Uses Zustand for state management.
 *
 * Note: This store does NOT use localStorage persistence as loading state
 * is transient and should not persist across page reloads.
 *
 * Requirements: 4.2
 */

import { create } from 'zustand';

/**
 * Loading state interface
 */
export interface LoadingState {
  isLoading: boolean;
  loadingMessage: string | null;
}

/**
 * Loading actions interface
 */
export interface LoadingActions {
  setLoading: (isLoading: boolean, message?: string) => void;
}

/**
 * Combined loading store type
 */
export type LoadingStore = LoadingState & LoadingActions;

/**
 * Initial loading state
 */
const initialState: LoadingState = {
  isLoading: false,
  loadingMessage: null,
};

/**
 * Zustand loading store
 *
 * Provides a simple interface for managing global loading state.
 * Useful for showing loading indicators during async operations.
 */
export const useLoadingStore = create<LoadingStore>((set) => ({
  // Initial state
  ...initialState,

  /**
   * Sets the loading state with an optional message.
   *
   * @param isLoading - Whether the application is in a loading state
   * @param message - Optional message to display during loading
   *
   * @example
   * // Start loading with a message
   * setLoading(true, 'Fetching data...');
   *
   * // Stop loading (clears the message)
   * setLoading(false);
   */
  setLoading: (isLoading: boolean, message?: string) => {
    set({
      isLoading,
      loadingMessage: isLoading ? (message ?? null) : null,
    });
  },
}));

// Export initial state for testing purposes
export { initialState };
