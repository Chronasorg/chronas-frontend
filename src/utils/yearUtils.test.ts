/**
 * Year Utilities Unit Tests
 *
 * Tests for year manipulation, validation, and formatting functions.
 *
 * Requirements: 2.6, 5.4
 */

import { describe, it, expect } from 'vitest';
import {
  clampYear,
  isValidYear,
  formatYearForDisplay,
  dateToYear,
  yearToDate,
  MIN_YEAR,
  MAX_YEAR,
  DEFAULT_YEAR,
} from './yearUtils';

describe('yearUtils', () => {
  describe('clampYear', () => {
    it('should return the same year when within valid range', () => {
      expect(clampYear(1000)).toBe(1000);
      expect(clampYear(0)).toBe(0);
      expect(clampYear(-1000)).toBe(-1000);
    });

    it('should clamp years above MAX_YEAR to MAX_YEAR', () => {
      expect(clampYear(2001)).toBe(MAX_YEAR);
      expect(clampYear(3000)).toBe(MAX_YEAR);
      expect(clampYear(10000)).toBe(MAX_YEAR);
    });

    it('should clamp years below MIN_YEAR to MIN_YEAR', () => {
      expect(clampYear(-2001)).toBe(MIN_YEAR);
      expect(clampYear(-3000)).toBe(MIN_YEAR);
      expect(clampYear(-10000)).toBe(MIN_YEAR);
    });

    it('should return DEFAULT_YEAR for non-finite values', () => {
      expect(clampYear(NaN)).toBe(DEFAULT_YEAR);
      expect(clampYear(Infinity)).toBe(DEFAULT_YEAR);
      expect(clampYear(-Infinity)).toBe(DEFAULT_YEAR);
    });

    it('should round floating point years', () => {
      expect(clampYear(1000.4)).toBe(1000);
      expect(clampYear(1000.6)).toBe(1001);
      expect(clampYear(-500.5)).toBe(-500);
    });

    it('should handle boundary values correctly', () => {
      expect(clampYear(MIN_YEAR)).toBe(MIN_YEAR);
      expect(clampYear(MAX_YEAR)).toBe(MAX_YEAR);
      expect(clampYear(MIN_YEAR - 1)).toBe(MIN_YEAR);
      expect(clampYear(MAX_YEAR + 1)).toBe(MAX_YEAR);
    });
  });

  describe('isValidYear', () => {
    it('should return true for years within valid range', () => {
      expect(isValidYear(0)).toBe(true);
      expect(isValidYear(1000)).toBe(true);
      expect(isValidYear(-1000)).toBe(true);
      expect(isValidYear(MIN_YEAR)).toBe(true);
      expect(isValidYear(MAX_YEAR)).toBe(true);
    });

    it('should return false for years outside valid range', () => {
      expect(isValidYear(2001)).toBe(false);
      expect(isValidYear(-2001)).toBe(false);
      expect(isValidYear(10000)).toBe(false);
      expect(isValidYear(-10000)).toBe(false);
    });

    it('should return false for non-finite values', () => {
      expect(isValidYear(NaN)).toBe(false);
      expect(isValidYear(Infinity)).toBe(false);
      expect(isValidYear(-Infinity)).toBe(false);
    });
  });

  describe('formatYearForDisplay', () => {
    it('should format positive years correctly', () => {
      expect(formatYearForDisplay(2000)).toBe('2000');
      expect(formatYearForDisplay(1)).toBe('1');
      expect(formatYearForDisplay(1500)).toBe('1500');
    });

    it('should format negative years with minus sign', () => {
      expect(formatYearForDisplay(-500)).toBe('-500');
      expect(formatYearForDisplay(-2000)).toBe('-2000');
      expect(formatYearForDisplay(-1)).toBe('-1');
    });

    it('should format year zero correctly', () => {
      expect(formatYearForDisplay(0)).toBe('0');
    });

    it('should round floating point years', () => {
      expect(formatYearForDisplay(1000.4)).toBe('1000');
      expect(formatYearForDisplay(1000.6)).toBe('1001');
      expect(formatYearForDisplay(-500.5)).toBe('-500');
    });
  });

  describe('dateToYear', () => {
    it('should extract year from Date objects', () => {
      expect(dateToYear(new Date(2000, 0, 1))).toBe(2000);
      expect(dateToYear(new Date(1500, 5, 15))).toBe(1500);
    });

    it('should handle dates with different months and days', () => {
      expect(dateToYear(new Date(2000, 11, 31))).toBe(2000);
      expect(dateToYear(new Date(1999, 0, 1))).toBe(1999);
    });

    it('should handle year zero', () => {
      const date = new Date(0);
      date.setFullYear(0, 0, 1);
      expect(dateToYear(date)).toBe(0);
    });

    it('should handle negative years (BCE)', () => {
      const date = new Date(0);
      date.setFullYear(-500, 0, 1);
      expect(dateToYear(date)).toBe(-500);
    });
  });

  describe('yearToDate', () => {
    it('should create Date for January 1st of positive years', () => {
      const date = yearToDate(2000);
      expect(date.getFullYear()).toBe(2000);
      expect(date.getMonth()).toBe(0); // January
      expect(date.getDate()).toBe(1);
    });

    it('should create Date for January 1st of negative years', () => {
      const date = yearToDate(-500);
      expect(date.getFullYear()).toBe(-500);
      expect(date.getMonth()).toBe(0); // January
      expect(date.getDate()).toBe(1);
    });

    it('should create Date for year zero', () => {
      const date = yearToDate(0);
      expect(date.getFullYear()).toBe(0);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(1);
    });

    it('should set time to midnight', () => {
      const date = yearToDate(2000);
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
      expect(date.getSeconds()).toBe(0);
      expect(date.getMilliseconds()).toBe(0);
    });

    it('should handle small positive years correctly (not as 1900s)', () => {
      // This tests that we don't fall into the JavaScript Date trap
      // where new Date(50, 0, 1) creates year 1950 instead of year 50
      const date = yearToDate(50);
      expect(date.getFullYear()).toBe(50);
    });
  });

  describe('roundtrip conversion', () => {
    it('should convert year to date and back correctly', () => {
      const years = [2000, 1500, 0, -500, -2000, 50, 99];
      for (const year of years) {
        const date = yearToDate(year);
        const result = dateToYear(date);
        expect(result).toBe(year);
      }
    });
  });

  describe('constants', () => {
    it('should export correct constant values', () => {
      expect(MIN_YEAR).toBe(-2000);
      expect(MAX_YEAR).toBe(2000);
      expect(DEFAULT_YEAR).toBe(1000);
    });
  });
});
