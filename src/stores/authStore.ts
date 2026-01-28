/**
 * Authentication Store
 *
 * Manages user authentication state with localStorage persistence.
 * Uses Zustand for state management.
 *
 * Requirements: 4.1, 4.2
 */

import { create } from 'zustand';

// localStorage key for token (matches existing frontend)
const TOKEN_STORAGE_KEY = 'chs_token';

/**
 * JWT Token Payload structure from the chronas-api
 */
export interface JWTPayload {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  score?: number;
  subscription?: string;
  privilege?: number;
  name?: {
    first?: string;
    last?: string;
  };
  exp: number;
  iat: number;
}

/**
 * Authentication state interface
 */
export interface AuthState {
  token: string | null;
  userId: string | null;
  username: string | null;
  isAuthenticated: boolean;
  subscription: string | null;
  avatar: string | null;
  score: number | null;
}

/**
 * Authentication actions interface
 */
export interface AuthActions {
  setUser: (token: string, userData?: Partial<AuthState>) => void;
  clearUser: () => void;
  loadFromStorage: () => void;
}

/**
 * Combined auth store type
 */
export type AuthStore = AuthState & AuthActions;

/**
 * Initial authentication state
 */
const initialState: AuthState = {
  token: null,
  userId: null,
  username: null,
  isAuthenticated: false,
  subscription: null,
  avatar: null,
  score: null,
};

/**
 * Decodes a JWT token and extracts the payload.
 * Uses base64 decoding without external dependencies.
 *
 * @param token - The JWT token string to decode
 * @returns The decoded payload or null if decoding fails
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    // JWT structure: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Invalid JWT format: expected 3 parts');
      return null;
    }

    const payload = parts[1];
    if (!payload) {
      console.warn('Invalid JWT format: missing payload');
      return null;
    }

    // Base64Url decode: replace URL-safe characters and add padding
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

    // Decode base64 to string
    const jsonPayload = atob(paddedBase64);

    // Parse JSON
    const decoded = JSON.parse(jsonPayload) as JWTPayload;

    return decoded;
  } catch (error) {
    console.error('Failed to decode JWT token:', error);
    return null;
  }
}

/**
 * Checks if a JWT token is expired.
 *
 * @param payload - The decoded JWT payload
 * @returns true if the token is expired, false otherwise
 */
export function isTokenExpired(payload: JWTPayload): boolean {
  if (!payload.exp) {
    return false; // No expiration set
  }

  // exp is in seconds, Date.now() is in milliseconds
  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();

  return currentTime >= expirationTime;
}

/**
 * Zustand auth store with localStorage persistence
 */
export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  ...initialState,

  /**
   * Sets the user authentication state.
   * Stores the token in localStorage and extracts user data from JWT.
   *
   * @param token - The JWT token
   * @param userData - Optional additional user data to merge
   */
  setUser: (token: string, userData?: Partial<AuthState>) => {
    // Decode the JWT to extract user information
    const payload = decodeJWT(token);

    if (!payload) {
      console.error('Failed to decode token, cannot set user');
      return;
    }

    // Check if token is expired
    if (isTokenExpired(payload)) {
      console.warn('Token is expired, not setting user');
      get().clearUser();
      return;
    }

    // Store token in localStorage
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch (error) {
      console.error('Failed to store token in localStorage:', error);
    }

    // Update state with decoded payload and any additional user data
    set({
      token,
      userId: payload.id,
      username: payload.username,
      isAuthenticated: true,
      subscription: payload.subscription ?? userData?.subscription ?? null,
      avatar: payload.avatar ?? userData?.avatar ?? null,
      score: payload.score ?? userData?.score ?? null,
    });
  },

  /**
   * Clears the user authentication state.
   * Removes the token from localStorage.
   */
  clearUser: () => {
    // Remove token from localStorage
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to remove token from localStorage:', error);
    }

    // Reset state to initial values
    set(initialState);
  },

  /**
   * Loads authentication state from localStorage.
   * Should be called on application initialization.
   */
  loadFromStorage: () => {
    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);

      if (!token) {
        // No token stored, ensure clean state
        set(initialState);
        return;
      }

      // Decode and validate the token
      const payload = decodeJWT(token);

      if (!payload) {
        // Invalid token, clear it
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        set(initialState);
        return;
      }

      // Check if token is expired
      if (isTokenExpired(payload)) {
        console.warn('Stored token is expired, clearing authentication');
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        set(initialState);
        return;
      }

      // Token is valid, restore authentication state
      set({
        token,
        userId: payload.id,
        username: payload.username,
        isAuthenticated: true,
        subscription: payload.subscription ?? null,
        avatar: payload.avatar ?? null,
        score: payload.score ?? null,
      });
    } catch (error) {
      console.error('Failed to load authentication from storage:', error);
      set(initialState);
    }
  },
}));

// Export the storage key for testing purposes
export { TOKEN_STORAGE_KEY };
