/**
 * API Endpoints Unit Tests
 *
 * Tests endpoint URL generation for historical data visualization.
 * Requirements: 9.1
 * 
 * Note: Endpoints do NOT include /v1 prefix because the base URL
 * (VITE_API_BASE_URL) already includes /v1.
 */

import { describe, it, expect } from 'vitest';
import { METADATA, MARKERS, AREAS } from './endpoints';

describe('API Endpoints', () => {
  describe('METADATA endpoints', () => {
    it('should have LIST endpoint', () => {
      expect(METADATA.LIST).toBe('/metadata');
    });

    it('should have LIST_V1 endpoint (same as LIST since base URL includes /v1)', () => {
      expect(METADATA.LIST_V1).toBe('/metadata');
    });

    it('should generate GET_BY_TYPE endpoint with type parameter', () => {
      expect(METADATA.GET_BY_TYPE('ruler')).toBe('/metadata?type=ruler');
      expect(METADATA.GET_BY_TYPE('culture')).toBe('/metadata?type=culture');
      expect(METADATA.GET_BY_TYPE('religion')).toBe('/metadata?type=religion');
    });

    it('should handle special characters in type parameter', () => {
      expect(METADATA.GET_BY_TYPE('religion-general')).toBe(
        '/metadata?type=religion-general'
      );
    });

    it('should handle empty type parameter', () => {
      expect(METADATA.GET_BY_TYPE('')).toBe('/metadata?type=');
    });
  });

  describe('MARKERS endpoints', () => {
    it('should have LIST endpoint', () => {
      expect(MARKERS.LIST).toBe('/markers');
    });

    it('should generate GET_BY_YEAR endpoint with year parameter', () => {
      expect(MARKERS.GET_BY_YEAR(1000)).toBe('/markers?year=1000');
      expect(MARKERS.GET_BY_YEAR(1500)).toBe('/markers?year=1500');
      expect(MARKERS.GET_BY_YEAR(2000)).toBe('/markers?year=2000');
    });

    it('should handle negative years (BCE)', () => {
      expect(MARKERS.GET_BY_YEAR(-500)).toBe('/markers?year=-500');
      expect(MARKERS.GET_BY_YEAR(-3000)).toBe('/markers?year=-3000');
    });

    it('should handle year zero', () => {
      expect(MARKERS.GET_BY_YEAR(0)).toBe('/markers?year=0');
    });

    it('should generate GET_BY_YEAR_AND_TYPE endpoint with both parameters', () => {
      expect(MARKERS.GET_BY_YEAR_AND_TYPE(1500, 'battle')).toBe(
        '/markers?year=1500&type=battle'
      );
      expect(MARKERS.GET_BY_YEAR_AND_TYPE(1800, 'city')).toBe(
        '/markers?year=1800&type=city'
      );
      expect(MARKERS.GET_BY_YEAR_AND_TYPE(1900, 'capital')).toBe(
        '/markers?year=1900&type=capital'
      );
    });

    it('should handle all marker types', () => {
      const markerTypes = ['battle', 'city', 'capital', 'person', 'event', 'other'];
      markerTypes.forEach((type) => {
        expect(MARKERS.GET_BY_YEAR_AND_TYPE(1000, type)).toBe(
          `/markers?year=1000&type=${type}`
        );
      });
    });

    it('should handle negative years with type', () => {
      expect(MARKERS.GET_BY_YEAR_AND_TYPE(-500, 'battle')).toBe(
        '/markers?year=-500&type=battle'
      );
    });
  });

  describe('AREAS endpoints', () => {
    it('should generate GET_BY_YEAR endpoint with year parameter', () => {
      expect(AREAS.GET_BY_YEAR(1000)).toBe('/areas/1000');
      expect(AREAS.GET_BY_YEAR(1500)).toBe('/areas/1500');
    });

    it('should handle negative years (BCE)', () => {
      expect(AREAS.GET_BY_YEAR(-500)).toBe('/areas/-500');
    });
  });
});
