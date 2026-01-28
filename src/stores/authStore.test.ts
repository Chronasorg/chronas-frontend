/**
 * Auth Store Unit Tests
 *
 * Tests for the authentication store including JWT decoding,
 * localStorage persistence, and state management.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  useAuthStore,
  decodeJWT,
  isTokenExpired,
  TOKEN_STORAGE_KEY,
  type JWTPayload,
} from './authStore';

// Helper to create a valid JWT token for testing
function createTestToken(payload: Partial<JWTPayload>, expiresInSeconds = 3600): string {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JWTPayload = {
    id: 'test-user-id',
    username: 'testuser',
    exp: now + expiresInSeconds,
    iat: now,
    ...payload,
  };

  // Create a simple JWT structure (header.payload.signature)
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadBase64 = btoa(JSON.stringify(fullPayload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const signature = 'test-signature';

  return `${header}.${payloadBase64}.${signature}`;
}

// Helper to create an expired token
function createExpiredToken(payload: Partial<JWTPayload> = {}): string {
  return createTestToken(payload, -3600); // Expired 1 hour ago
}

describe('decodeJWT', () => {
  it('should decode a valid JWT token', () => {
    const token = createTestToken({
      id: 'user-123',
      username: 'john_doe',
      email: 'john@example.com',
      avatar: 'https://example.com/avatar.png',
      score: 100,
      subscription: 'premium',
    });

    const payload = decodeJWT(token);

    expect(payload).not.toBeNull();
    expect(payload?.id).toBe('user-123');
    expect(payload?.username).toBe('john_doe');
    expect(payload?.email).toBe('john@example.com');
    expect(payload?.avatar).toBe('https://example.com/avatar.png');
    expect(payload?.score).toBe(100);
    expect(payload?.subscription).toBe('premium');
  });

  it('should return null for invalid JWT format (missing parts)', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(decodeJWT('invalid')).toBeNull();
    expect(decodeJWT('only.two')).toBeNull();
    expect(decodeJWT('')).toBeNull();

    consoleSpy.mockRestore();
  });

  it('should return null for invalid base64 payload', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(decodeJWT('header.!!!invalid!!!.signature')).toBeNull();

    consoleSpy.mockRestore();
  });

  it('should handle tokens with URL-safe base64 characters', () => {
    // Create a token with characters that need URL-safe encoding
    const token = createTestToken({
      id: 'user+with/special=chars',
      username: 'test_user',
    });

    const payload = decodeJWT(token);

    expect(payload).not.toBeNull();
    expect(payload?.username).toBe('test_user');
  });
});

describe('isTokenExpired', () => {
  it('should return false for a valid non-expired token', () => {
    const payload: JWTPayload = {
      id: 'test',
      username: 'test',
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      iat: Math.floor(Date.now() / 1000),
    };

    expect(isTokenExpired(payload)).toBe(false);
  });

  it('should return true for an expired token', () => {
    const payload: JWTPayload = {
      id: 'test',
      username: 'test',
      exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      iat: Math.floor(Date.now() / 1000) - 7200,
    };

    expect(isTokenExpired(payload)).toBe(true);
  });

  it('should return false for a token without expiration', () => {
    const payload: JWTPayload = {
      id: 'test',
      username: 'test',
      exp: 0, // No expiration
      iat: Math.floor(Date.now() / 1000),
    };

    expect(isTokenExpired(payload)).toBe(false);
  });
});

describe('useAuthStore', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset the store to initial state
    useAuthStore.setState({
      token: null,
      userId: null,
      username: null,
      isAuthenticated: false,
      subscription: null,
      avatar: null,
      score: null,
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();

      expect(state.token).toBeNull();
      expect(state.userId).toBeNull();
      expect(state.username).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.subscription).toBeNull();
      expect(state.avatar).toBeNull();
      expect(state.score).toBeNull();
    });
  });

  describe('setUser', () => {
    it('should set user state from a valid token', () => {
      const token = createTestToken({
        id: 'user-456',
        username: 'jane_doe',
        email: 'jane@example.com',
        avatar: 'https://example.com/jane.png',
        score: 250,
        subscription: 'basic',
      });

      useAuthStore.getState().setUser(token);

      const state = useAuthStore.getState();
      expect(state.token).toBe(token);
      expect(state.userId).toBe('user-456');
      expect(state.username).toBe('jane_doe');
      expect(state.isAuthenticated).toBe(true);
      expect(state.avatar).toBe('https://example.com/jane.png');
      expect(state.score).toBe(250);
      expect(state.subscription).toBe('basic');
    });

    it('should store token in localStorage', () => {
      const token = createTestToken({ id: 'user-789', username: 'bob' });

      useAuthStore.getState().setUser(token);

      expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe(token);
    });

    it('should not set user for an expired token', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const expiredToken = createExpiredToken({ id: 'expired-user', username: 'expired' });

      useAuthStore.getState().setUser(expiredToken);

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.token).toBeNull();

      consoleSpy.mockRestore();
    });

    it('should not set user for an invalid token', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      useAuthStore.getState().setUser('invalid-token');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.token).toBeNull();

      consoleSpy.mockRestore();
    });

    it('should merge additional userData with token payload', () => {
      const token = createTestToken({
        id: 'user-merge',
        username: 'merge_user',
        // No avatar or score in token
      });

      useAuthStore.getState().setUser(token, {
        avatar: 'https://example.com/custom-avatar.png',
        score: 500,
      });

      const state = useAuthStore.getState();
      expect(state.avatar).toBe('https://example.com/custom-avatar.png');
      expect(state.score).toBe(500);
    });

    it('should prefer token payload values over userData', () => {
      const token = createTestToken({
        id: 'user-prefer',
        username: 'prefer_user',
        avatar: 'https://example.com/token-avatar.png',
        score: 100,
      });

      useAuthStore.getState().setUser(token, {
        avatar: 'https://example.com/override-avatar.png',
        score: 999,
      });

      const state = useAuthStore.getState();
      // Token values should take precedence
      expect(state.avatar).toBe('https://example.com/token-avatar.png');
      expect(state.score).toBe(100);
    });
  });

  describe('clearUser', () => {
    it('should clear all user state', () => {
      const token = createTestToken({ id: 'user-clear', username: 'clear_user' });
      useAuthStore.getState().setUser(token);

      // Verify user is set
      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      // Clear user
      useAuthStore.getState().clearUser();

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.userId).toBeNull();
      expect(state.username).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.subscription).toBeNull();
      expect(state.avatar).toBeNull();
      expect(state.score).toBeNull();
    });

    it('should remove token from localStorage', () => {
      const token = createTestToken({ id: 'user-remove', username: 'remove_user' });
      useAuthStore.getState().setUser(token);

      expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe(token);

      useAuthStore.getState().clearUser();

      expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    });
  });

  describe('loadFromStorage', () => {
    it('should load valid token from localStorage', () => {
      const token = createTestToken({
        id: 'stored-user',
        username: 'stored_user',
        avatar: 'https://example.com/stored.png',
        score: 300,
        subscription: 'premium',
      });

      // Manually set token in localStorage
      localStorage.setItem(TOKEN_STORAGE_KEY, token);

      // Load from storage
      useAuthStore.getState().loadFromStorage();

      const state = useAuthStore.getState();
      expect(state.token).toBe(token);
      expect(state.userId).toBe('stored-user');
      expect(state.username).toBe('stored_user');
      expect(state.isAuthenticated).toBe(true);
      expect(state.avatar).toBe('https://example.com/stored.png');
      expect(state.score).toBe(300);
      expect(state.subscription).toBe('premium');
    });

    it('should clear state if no token in localStorage', () => {
      // Set some state first
      useAuthStore.setState({
        token: 'old-token',
        userId: 'old-user',
        username: 'old_user',
        isAuthenticated: true,
        subscription: null,
        avatar: null,
        score: null,
      });

      // Ensure localStorage is empty
      localStorage.removeItem(TOKEN_STORAGE_KEY);

      // Load from storage
      useAuthStore.getState().loadFromStorage();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.token).toBeNull();
    });

    it('should clear state and localStorage if token is expired', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const expiredToken = createExpiredToken({ id: 'expired', username: 'expired_user' });

      localStorage.setItem(TOKEN_STORAGE_KEY, expiredToken);

      useAuthStore.getState().loadFromStorage();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.token).toBeNull();
      expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();

      consoleSpy.mockRestore();
    });

    it('should clear state and localStorage if token is invalid', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      localStorage.setItem(TOKEN_STORAGE_KEY, 'invalid-token-format');

      useAuthStore.getState().loadFromStorage();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.token).toBeNull();
      expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();

      consoleSpy.mockRestore();
    });
  });

  describe('TOKEN_STORAGE_KEY', () => {
    it('should use the correct localStorage key', () => {
      expect(TOKEN_STORAGE_KEY).toBe('chs_token');
    });
  });
});
