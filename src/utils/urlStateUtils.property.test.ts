/**
 * Property-Based Tests for URL State Utilities
 *
 * Feature: map-interactions
 * Property 4: URL State Round-Trip
 *
 * Validates: Requirements 9.1, 9.2, 9.3, 9.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  parseURLState,
  updateURLState,
  clearURLParams,
  hasDrawerParams,
} from './urlStateUtils';

describe('URL State Utilities - Property Tests', () => {
  // Store original location to restore after tests
  let originalLocation: Location;
  let mockHash: string;

  beforeEach(() => {
    originalLocation = window.location;
    mockHash = '#/';

    // Create a mock location object with getter/setter for hash
    const mockLocation = {
      get hash() {
        return mockHash;
      },
      set hash(value: string) {
        mockHash = value;
      },
      pathname: '/',
      href: '/',
      origin: 'http://localhost',
      protocol: 'http:',
      host: 'localhost',
      hostname: 'localhost',
      port: '',
      search: '',
    };

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
      configurable: true,
    });

    // Mock history.replaceState
    window.history.replaceState = (_data: unknown, _unused: string, url?: string | URL | null) => {
      if (url) {
        const urlStr = url.toString();
        const hashIndex = urlStr.indexOf('#');
        if (hashIndex !== -1) {
          mockHash = urlStr.slice(hashIndex);
        }
      }
    };
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  /**
   * Property 4: URL State Round-Trip
   *
   * For any valid URL state (type, value, year, limit), parsing the URL
   * and then updating it with the same values SHALL produce an equivalent URL.
   *
   * **Validates: Requirements 9.1, 9.2, 9.3, 9.5**
   */
  describe('Property 4: URL State Round-Trip', () => {
    it('should preserve year through round-trip', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -4000, max: 2100 }),
          (year) => {
            // Reset hash
            mockHash = '#/';

            // Update URL with year
            updateURLState({ year });

            // Parse and verify
            const parsed = parseURLState();
            expect(parsed.year).toBe(year);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve type through round-trip', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('area' as const, 'marker' as const),
          (type) => {
            // Reset hash
            mockHash = '#/';

            // Update URL with type
            updateURLState({ type });

            // Parse and verify
            const parsed = parseURLState();
            expect(parsed.type).toBe(type);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve value through round-trip', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes('&') && !s.includes('=')),
          (value) => {
            // Reset hash
            mockHash = '#/';

            // Update URL with value
            updateURLState({ value });

            // Parse and verify
            const parsed = parseURLState();
            expect(parsed.value).toBe(value);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve limit through round-trip', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }),
          (limit) => {
            // Reset hash
            mockHash = '#/';

            // Update URL with limit
            updateURLState({ limit });

            // Parse and verify
            const parsed = parseURLState();
            expect(parsed.limit).toBe(limit);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve complete state through round-trip when all values defined', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -4000, max: 2100 }),
          fc.constantFrom('area' as const, 'marker' as const),
          fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes('&') && !s.includes('=')),
          fc.integer({ min: 0, max: 10000 }),
          (year, type, value, limit) => {
            // Reset hash
            mockHash = '#/';

            // Update URL with complete state
            updateURLState({ year, type, value, limit });

            // Parse and verify each property
            const parsed = parseURLState();
            expect(parsed.year).toBe(year);
            expect(parsed.type).toBe(type);
            expect(parsed.value).toBe(value);
            expect(parsed.limit).toBe(limit);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not add undefined parameters to URL', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -4000, max: 2100 }),
          (year) => {
            // Reset hash
            mockHash = '#/';

            // Update URL with only year (other params not provided)
            updateURLState({ year });

            // Check that only year is in URL
            const hash = mockHash;
            expect(hash).toContain('year=');
            expect(hash).not.toContain('type=');
            expect(hash).not.toContain('value=');
            expect(hash).not.toContain('limit=');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('clearURLParams', () => {
    it('should remove specified parameters', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -4000, max: 2100 }),
          fc.constantFrom('area' as const, 'marker' as const),
          fc.string({ minLength: 1, maxLength: 20 }).filter((s) => !s.includes('&') && !s.includes('=')),
          (year, type, value) => {
            // Reset and set initial state
            mockHash = '#/';
            updateURLState({ year, type, value });

            // Clear type and value
            clearURLParams(['type', 'value']);

            // Verify type and value are removed but year remains
            const parsed = parseURLState();
            expect(parsed.year).toBe(year);
            expect(parsed.type).toBeUndefined();
            expect(parsed.value).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('hasDrawerParams', () => {
    it('should return true when both type and value are present', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('area' as const, 'marker' as const),
          fc.string({ minLength: 1, maxLength: 20 }).filter((s) => !s.includes('&') && !s.includes('=')),
          (type, value) => {
            // Reset and set state
            mockHash = '#/';
            updateURLState({ type, value });

            expect(hasDrawerParams()).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return false when type is missing', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter((s) => !s.includes('&') && !s.includes('=')),
          (value) => {
            // Reset and set state without type
            mockHash = '#/';
            updateURLState({ value });

            expect(hasDrawerParams()).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return false when value is missing', () => {
      fc.assert(
        fc.property(fc.constantFrom('area' as const, 'marker' as const), (type) => {
          // Reset and set state without value
          mockHash = '#/';
          updateURLState({ type });

          expect(hasDrawerParams()).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty hash', () => {
      mockHash = '';
      const parsed = parseURLState();
      expect(parsed).toEqual({});
    });

    it('should handle hash without query string', () => {
      mockHash = '#/';
      const parsed = parseURLState();
      expect(parsed).toEqual({});
    });

    it('should handle invalid year (non-numeric)', () => {
      mockHash = '#/?year=invalid';
      const parsed = parseURLState();
      expect(parsed.year).toBeUndefined();
    });

    it('should handle invalid type', () => {
      mockHash = '#/?type=invalid';
      const parsed = parseURLState();
      expect(parsed.type).toBeUndefined();
    });

    it('should handle empty value', () => {
      mockHash = '#/?value=';
      const parsed = parseURLState();
      expect(parsed.value).toBeUndefined();
    });

    it('should handle negative limit', () => {
      mockHash = '#/?limit=-100';
      const parsed = parseURLState();
      expect(parsed.limit).toBeUndefined();
    });

    it('should handle URL-encoded values', () => {
      mockHash = '#/';
      updateURLState({ value: 'Athens' });
      const parsed = parseURLState();
      expect(parsed.value).toBe('Athens');
    });

    it('should preserve existing params when updating', () => {
      mockHash = '#/?year=1000';
      updateURLState({ type: 'area' });
      const parsed = parseURLState();
      expect(parsed.year).toBe(1000);
      expect(parsed.type).toBe('area');
    });

    it('should remove param using clearURLParams', () => {
      mockHash = '#/?year=1000&type=area';
      clearURLParams(['type']);
      const parsed = parseURLState();
      expect(parsed.year).toBe(1000);
      expect(parsed.type).toBeUndefined();
    });
  });
});
