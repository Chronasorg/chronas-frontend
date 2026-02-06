/**
 * Map Utilities Unit Tests
 *
 * Tests for URL parameter helpers and map-related utility functions.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatPositionToURL,
  parsePositionFromURL,
  updateQueryStringParameter,
  getQueryStringParameter,
  updatePositionInURL,
  updateYearInURL,
  getYearFromURL,
  viewportsApproximatelyEqual,
  safeAreaDataAccess,
  getProvinceRuler,
  getProvinceCulture,
  getProvinceReligion,
  getProvinceCapital,
  getProvincePopulation,
  isValidProvinceData,
  PROVINCE_DATA_INDEX,
} from './mapUtils';
import type { AreaData, ProvinceData } from '../stores/mapStore';

// Suppress unused variable warning - getPositionFromURL is tested indirectly
void updatePositionInURL;

describe('mapUtils', () => {
  describe('formatPositionToURL', () => {
    it('should format viewport to URL string with correct precision', () => {
      const viewport = { latitude: 37.123456789, longitude: 45.987654321, zoom: 5.5 };
      const result = formatPositionToURL(viewport);
      expect(result).toBe('37.123457,45.987654,5.50');
    });

    it('should use default values for missing fields', () => {
      const result = formatPositionToURL({});
      expect(result).toBe('37.000000,37.000000,2.50');
    });

    it('should handle negative coordinates', () => {
      const viewport = { latitude: -45.5, longitude: -120.25, zoom: 10 };
      const result = formatPositionToURL(viewport);
      expect(result).toBe('-45.500000,-120.250000,10.00');
    });

    it('should handle edge case coordinates', () => {
      const viewport = { latitude: 90, longitude: 180, zoom: 22 };
      const result = formatPositionToURL(viewport);
      expect(result).toBe('90.000000,180.000000,22.00');
    });

    it('should handle NaN values with defaults', () => {
      const viewport = { latitude: NaN, longitude: NaN, zoom: NaN };
      const result = formatPositionToURL(viewport);
      expect(result).toBe('37.000000,37.000000,2.50');
    });

    it('should handle Infinity values with defaults', () => {
      const viewport = { latitude: Infinity, longitude: -Infinity, zoom: Infinity };
      const result = formatPositionToURL(viewport);
      expect(result).toBe('37.000000,37.000000,2.50');
    });
  });

  describe('parsePositionFromURL', () => {
    it('should parse valid URL string to viewport', () => {
      const result = parsePositionFromURL('37.123456,45.654321,5.50');
      expect(result).toEqual({
        latitude: 37.123456,
        longitude: 45.654321,
        zoom: 5.5,
      });
    });

    it('should return empty object for null input', () => {
      const result = parsePositionFromURL(null);
      expect(result).toEqual({});
    });

    it('should return empty object for undefined input', () => {
      const result = parsePositionFromURL(undefined);
      expect(result).toEqual({});
    });

    it('should return empty object for empty string', () => {
      const result = parsePositionFromURL('');
      expect(result).toEqual({});
    });

    it('should return empty object for whitespace-only string', () => {
      const result = parsePositionFromURL('   ');
      expect(result).toEqual({});
    });

    it('should return empty object for insufficient parts', () => {
      const result = parsePositionFromURL('37.5,45.5');
      expect(result).toEqual({});
    });

    it('should handle negative coordinates', () => {
      const result = parsePositionFromURL('-45.5,-120.25,10');
      expect(result).toEqual({
        latitude: -45.5,
        longitude: -120.25,
        zoom: 10,
      });
    });

    it('should reject latitude out of range', () => {
      const result = parsePositionFromURL('91,45,5');
      expect(result.latitude).toBeUndefined();
      expect(result.longitude).toBe(45);
      expect(result.zoom).toBe(5);
    });

    it('should reject longitude out of range', () => {
      const result = parsePositionFromURL('45,181,5');
      expect(result.latitude).toBe(45);
      expect(result.longitude).toBeUndefined();
      expect(result.zoom).toBe(5);
    });

    it('should reject zoom out of range', () => {
      const result = parsePositionFromURL('45,90,25');
      expect(result.latitude).toBe(45);
      expect(result.longitude).toBe(90);
      expect(result.zoom).toBeUndefined();
    });

    it('should handle extra parts gracefully', () => {
      const result = parsePositionFromURL('37,45,5,extra,parts');
      expect(result).toEqual({
        latitude: 37,
        longitude: 45,
        zoom: 5,
      });
    });

    it('should handle non-numeric values', () => {
      const result = parsePositionFromURL('abc,def,ghi');
      expect(result).toEqual({});
    });
  });

  describe('URL round-trip', () => {
    it('should preserve viewport through format and parse', () => {
      const original = { latitude: 37.123456, longitude: 45.654321, zoom: 5.5 };
      const formatted = formatPositionToURL(original);
      const parsed = parsePositionFromURL(formatted);

      expect(parsed.latitude).toBeCloseTo(original.latitude, 5);
      expect(parsed.longitude).toBeCloseTo(original.longitude, 5);
      expect(parsed.zoom).toBeCloseTo(original.zoom, 1);
    });

    it('should preserve negative coordinates through round-trip', () => {
      const original = { latitude: -45.5, longitude: -120.25, zoom: 10 };
      const formatted = formatPositionToURL(original);
      const parsed = parsePositionFromURL(formatted);

      expect(parsed.latitude).toBeCloseTo(original.latitude, 5);
      expect(parsed.longitude).toBeCloseTo(original.longitude, 5);
      expect(parsed.zoom).toBeCloseTo(original.zoom, 1);
    });
  });

  describe('viewportsApproximatelyEqual', () => {
    it('should return true for identical viewports', () => {
      const a = { latitude: 37, longitude: 45, zoom: 5 };
      const b = { latitude: 37, longitude: 45, zoom: 5 };
      expect(viewportsApproximatelyEqual(a, b)).toBe(true);
    });

    it('should return true for viewports within tolerance', () => {
      const a = { latitude: 37.0000001, longitude: 45.0000001, zoom: 5.001 };
      const b = { latitude: 37, longitude: 45, zoom: 5 };
      expect(viewportsApproximatelyEqual(a, b)).toBe(true);
    });

    it('should return false for viewports outside tolerance', () => {
      const a = { latitude: 37.001, longitude: 45, zoom: 5 };
      const b = { latitude: 37, longitude: 45, zoom: 5 };
      expect(viewportsApproximatelyEqual(a, b)).toBe(false);
    });

    it('should handle undefined fields', () => {
      const a = { latitude: 37 };
      const b = { latitude: 37 };
      expect(viewportsApproximatelyEqual(a, b)).toBe(true);
    });

    it('should return false when one field is undefined', () => {
      const a = { latitude: 37, longitude: 45 };
      const b = { latitude: 37 };
      expect(viewportsApproximatelyEqual(a, b)).toBe(false);
    });

    it('should handle empty viewports', () => {
      expect(viewportsApproximatelyEqual({}, {})).toBe(true);
    });
  });

  describe('Query string functions', () => {
    let originalLocation: Location;

    beforeEach(() => {
      // Save original window objects
      originalLocation = window.location;

      // Mock window.location
      const mockUrl = new URL('http://localhost:3000/');
      Object.defineProperty(window, 'location', {
        value: {
          href: mockUrl.href,
          search: mockUrl.search,
          hash: '',
          toString: () => mockUrl.href,
        },
        writable: true,
        configurable: true,
      });

      // Mock window.history.replaceState
      vi.spyOn(window.history, 'replaceState').mockImplementation(() => {
        // Empty implementation for mock
      });
    });

    afterEach(() => {
      // Restore original window objects
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true,
      });
      vi.restoreAllMocks();
    });

    describe('updateQueryStringParameter', () => {
      it('should call history.replaceState with updated URL', () => {
        updateQueryStringParameter('test', 'value');
        const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
        updateQueryStringParameter('test2', 'value2');
        expect(replaceStateSpy).toHaveBeenCalled();
      });

      it('should handle null value by removing parameter', () => {
        const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
        updateQueryStringParameter('test', null);
        expect(replaceStateSpy).toHaveBeenCalled();
      });

      it('should handle empty string value', () => {
        const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
        updateQueryStringParameter('test', '');
        expect(replaceStateSpy).toHaveBeenCalled();
      });
    });

    describe('getQueryStringParameter', () => {
      it('should return null for non-existent parameter', () => {
        const result = getQueryStringParameter('nonexistent');
        expect(result).toBeNull();
      });

      it('should return parameter from hash-based URL', () => {
        // Simulate HashRouter URL: /#/?year=1500
        Object.defineProperty(window, 'location', {
          value: {
            href: 'http://localhost/#/?year=1500',
            hash: '#/?year=1500',
            search: '',
            pathname: '/',
          },
          writable: true,
        });
        
        const result = getQueryStringParameter('year');
        expect(result).toBe('1500');
      });
    });

    describe('updatePositionInURL', () => {
      it('should format viewport and update URL', () => {
        const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
        const viewport = { latitude: 37, longitude: 45, zoom: 5 };
        updatePositionInURL(viewport);
        expect(replaceStateSpy).toHaveBeenCalled();
      });
    });

    describe('updateYearInURL', () => {
      it('should update year parameter', () => {
        const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
        updateYearInURL(1500);
        expect(replaceStateSpy).toHaveBeenCalled();
      });

      it('should not update for NaN year', () => {
        const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
        replaceStateSpy.mockClear();
        updateYearInURL(NaN);
        expect(replaceStateSpy).not.toHaveBeenCalled();
      });

      it('should not update for Infinity year', () => {
        const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
        replaceStateSpy.mockClear();
        updateYearInURL(Infinity);
        expect(replaceStateSpy).not.toHaveBeenCalled();
      });
    });

    describe('getYearFromURL', () => {
      it('should return null when year parameter is not present', () => {
        const result = getYearFromURL();
        expect(result).toBeNull();
      });
    });
  });
});describe('safeAreaDataAccess', () => {
  const validProvinceData: ProvinceData = ['ruler1', 'culture1', 'religion1', 'capital1', 1000];
  const validAreaData: AreaData = {
    province1: validProvinceData,
    province2: ['ruler2', 'culture2', 'religion2', null, 500],
  };

  describe('with valid data', () => {
    it('should return ruler at index 0', () => {
      const result = safeAreaDataAccess(validAreaData, 'province1', 0, false);
      expect(result).toBe('ruler1');
    });

    it('should return culture at index 1', () => {
      const result = safeAreaDataAccess(validAreaData, 'province1', 1, false);
      expect(result).toBe('culture1');
    });

    it('should return religion at index 2', () => {
      const result = safeAreaDataAccess(validAreaData, 'province1', 2, false);
      expect(result).toBe('religion1');
    });

    it('should return capital at index 3', () => {
      const result = safeAreaDataAccess(validAreaData, 'province1', 3, false);
      expect(result).toBe('capital1');
    });

    it('should return population at index 4', () => {
      const result = safeAreaDataAccess(validAreaData, 'province1', 4, false);
      expect(result).toBe(1000);
    });

    it('should return null for null capital', () => {
      const result = safeAreaDataAccess(validAreaData, 'province2', 3, false);
      expect(result).toBeNull();
    });
  });

  describe('with missing data', () => {
    it('should return null for null areaData', () => {
      const result = safeAreaDataAccess(null, 'province1', 0, false);
      expect(result).toBeNull();
    });

    it('should return null for undefined areaData', () => {
      const result = safeAreaDataAccess(undefined, 'province1', 0, false);
      expect(result).toBeNull();
    });

    it('should return null for missing province', () => {
      const result = safeAreaDataAccess(validAreaData, 'nonexistent', 0, false);
      expect(result).toBeNull();
    });

    it('should return null for empty province ID', () => {
      const result = safeAreaDataAccess(validAreaData, '', 0, false);
      expect(result).toBeNull();
    });

    it('should return null for invalid province ID type', () => {
      const result = safeAreaDataAccess(validAreaData, null as unknown as string, 0, false);
      expect(result).toBeNull();
    });
  });

  describe('with invalid structure', () => {
    it('should return null for non-array province data', () => {
      const invalidData = { province1: 'not an array' } as unknown as AreaData;
      const result = safeAreaDataAccess(invalidData, 'province1', 0, false);
      expect(result).toBeNull();
    });

    it('should return null for index out of bounds', () => {
      const shortData: AreaData = { province1: ['ruler'] as unknown as ProvinceData };
      const result = safeAreaDataAccess(shortData, 'province1', 4, false);
      expect(result).toBeNull();
    });

    it('should return null for negative index', () => {
      const result = safeAreaDataAccess(validAreaData, 'province1', -1, false);
      expect(result).toBeNull();
    });

    it('should return null for non-integer index', () => {
      const result = safeAreaDataAccess(validAreaData, 'province1', 1.5, false);
      expect(result).toBeNull();
    });
  });
});

describe('Province data helper functions', () => {
  const validAreaData: AreaData = {
    province1: ['ruler1', 'culture1', 'religion1', 'capital1', 1000],
    province2: ['ruler2', 'culture2', 'religion2', null, 500],
  };

  describe('getProvinceRuler', () => {
    it('should return ruler for valid province', () => {
      expect(getProvinceRuler(validAreaData, 'province1', false)).toBe('ruler1');
    });

    it('should return null for missing province', () => {
      expect(getProvinceRuler(validAreaData, 'nonexistent', false)).toBeNull();
    });
  });

  describe('getProvinceCulture', () => {
    it('should return culture for valid province', () => {
      expect(getProvinceCulture(validAreaData, 'province1', false)).toBe('culture1');
    });
  });

  describe('getProvinceReligion', () => {
    it('should return religion for valid province', () => {
      expect(getProvinceReligion(validAreaData, 'province1', false)).toBe('religion1');
    });
  });

  describe('getProvinceCapital', () => {
    it('should return capital for valid province', () => {
      expect(getProvinceCapital(validAreaData, 'province1', false)).toBe('capital1');
    });

    it('should return null for province with null capital', () => {
      expect(getProvinceCapital(validAreaData, 'province2', false)).toBeNull();
    });
  });

  describe('getProvincePopulation', () => {
    it('should return population for valid province', () => {
      expect(getProvincePopulation(validAreaData, 'province1', false)).toBe(1000);
    });

    it('should return population for province2', () => {
      expect(getProvincePopulation(validAreaData, 'province2', false)).toBe(500);
    });
  });
});

describe('isValidProvinceData', () => {
  it('should return true for valid province data', () => {
    const data: ProvinceData = ['ruler', 'culture', 'religion', 'capital', 1000];
    expect(isValidProvinceData(data)).toBe(true);
  });

  it('should return true for province data with null capital', () => {
    const data: ProvinceData = ['ruler', 'culture', 'religion', null, 1000];
    expect(isValidProvinceData(data)).toBe(true);
  });

  it('should return false for non-array', () => {
    expect(isValidProvinceData('not an array')).toBe(false);
  });

  it('should return false for array with wrong length', () => {
    expect(isValidProvinceData(['ruler', 'culture'])).toBe(false);
  });

  it('should return false for array with wrong types', () => {
    expect(isValidProvinceData([123, 'culture', 'religion', 'capital', 1000])).toBe(false);
  });

  it('should return false for array with non-number population', () => {
    expect(isValidProvinceData(['ruler', 'culture', 'religion', 'capital', 'not a number'])).toBe(
      false
    );
  });
});

describe('PROVINCE_DATA_INDEX', () => {
  it('should have correct index values', () => {
    expect(PROVINCE_DATA_INDEX.RULER).toBe(0);
    expect(PROVINCE_DATA_INDEX.CULTURE).toBe(1);
    expect(PROVINCE_DATA_INDEX.RELIGION).toBe(2);
    expect(PROVINCE_DATA_INDEX.CAPITAL).toBe(3);
    expect(PROVINCE_DATA_INDEX.POPULATION).toBe(4);
  });
});
