/**
 * API Error Utilities
 *
 * Provides helper functions for extracting user-friendly error messages
 * from API responses (Axios errors).
 */

import axios from 'axios';

/**
 * Extracts a user-friendly error message from an API error.
 *
 * Priority order:
 * 1. err.response.data.message (backend's explicit message)
 * 2. err.response.data.error (alternative backend format)
 * 3. err.response.data (if it's a plain string under 200 chars)
 * 4. Network error message for connection failures
 * 5. err.message for generic Error instances
 * 6. Provided fallback
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as Record<string, unknown> | string | undefined;

    if (typeof data === 'string' && data.length > 0 && data.length < 200) {
      return data;
    }
    if (typeof data === 'object') {
      const message = data['message'];
      if (typeof message === 'string' && message.length > 0) {
        return message;
      }
      const error = data['error'];
      if (typeof error === 'string' && error.length > 0) {
        return error;
      }
    }

    if (!err.response) {
      return 'Network error. Please check your connection and try again.';
    }
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  return fallback;
}
