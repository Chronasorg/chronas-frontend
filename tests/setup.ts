/**
 * Vitest Test Setup
 *
 * This file is run before each test file.
 * It sets up the testing environment with necessary configurations.
 */

import '@testing-library/jest-dom';

// Mock environment variables for tests
// These are required by the env config and API client
process.env['VITE_API_BASE_URL'] = 'http://localhost:3000';
process.env['VITE_ENVIRONMENT'] = 'development';

// Mock localStorage for tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string): string | null => {
      return store[key] ?? null;
    },
    setItem: (key: string, value: string): void => {
      store[key] = value;
    },
    removeItem: (key: string): void => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
    get length(): number {
      return Object.keys(store).length;
    },
    key: (index: number): string | null => {
      const keys = Object.keys(store);
      return keys[index] ?? null;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock atob and btoa for Node.js environment (jsdom)
if (typeof globalThis.atob === 'undefined') {
  globalThis.atob = (str: string): string => {
    return Buffer.from(str, 'base64').toString('binary');
  };
}

if (typeof globalThis.btoa === 'undefined') {
  globalThis.btoa = (str: string): string => {
    return Buffer.from(str, 'binary').toString('base64');
  };
}
