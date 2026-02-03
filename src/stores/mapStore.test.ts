/**
 * Map Store Unit Tests
 *
 * Tests for the mapStore including viewport state management,
 * flyTo actions, color dimension switching, area data caching,
 * province selection, and error handling.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.6, 7.2, 12.2, 13.4
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import {
  useMapStore,
  defaultViewport,
  initialState,
  isValidViewport,
  isValidColorDimension,
  clampLatitude,
  normalizeLongitude,
  clampZoom,
  DEFAULT_FLY_TO_DURATION,
  type ViewportState,
  type AreaColorDimension,
  type AreaData,
  type ProvinceData,
} from './mapStore';

describe('mapStore', () => {
  // Reset store before each test
  beforeEach(() => {
    act(() => {
      // Reset with a fresh Map to ensure clean state between tests
      useMapStore.setState({
        ...initialState,
        areaDataCache: new Map(),
        selectedProvince: null,
        selectedProvinceData: null,
        error: null,
      });
    });
  });

  describe('initial state', () => {
    /**
     * Requirement 2.2: THE MapStore SHALL initialize viewport with default values
     * (latitude: 37, longitude: 37, zoom: 2.5, minZoom: 2, bearing: 0, pitch: 0)
     */
    it('should initialize with default viewport values', () => {
      const state = useMapStore.getState();

      expect(state.viewport.latitude).toBe(37);
      expect(state.viewport.longitude).toBe(37);
      expect(state.viewport.zoom).toBe(2.5);
      expect(state.viewport.minZoom).toBe(2);
      expect(state.viewport.bearing).toBe(0);
      expect(state.viewport.pitch).toBe(0);
    });

    it('should initialize with ruler as default active color', () => {
      const state = useMapStore.getState();
      expect(state.activeColor).toBe('ruler');
    });

    it('should initialize with isFlying as false', () => {
      const state = useMapStore.getState();
      expect(state.isFlying).toBe(false);
    });

    it('should initialize with flyToTarget as null', () => {
      const state = useMapStore.getState();
      expect(state.flyToTarget).toBeNull();
    });

    /**
     * Requirement 12.2: THE MapStore SHALL cache area data by year
     */
    it('should initialize with empty areaDataCache', () => {
      const state = useMapStore.getState();
      expect(state.areaDataCache).toBeInstanceOf(Map);
      expect(state.areaDataCache.size).toBe(0);
    });

    it('should initialize with currentAreaData as null', () => {
      const state = useMapStore.getState();
      expect(state.currentAreaData).toBeNull();
    });

    it('should initialize with isLoadingAreaData as false', () => {
      const state = useMapStore.getState();
      expect(state.isLoadingAreaData).toBe(false);
    });

    /**
     * Requirement 7.2: WHEN a province is selected, THE MapStore SHALL
     * store the selected province ID and its data
     */
    it('should initialize with selectedProvince as null', () => {
      const state = useMapStore.getState();
      expect(state.selectedProvince).toBeNull();
    });

    it('should initialize with selectedProvinceData as null', () => {
      const state = useMapStore.getState();
      expect(state.selectedProvinceData).toBeNull();
    });

    /**
     * Requirement 13.4: WHEN an error occurs, THE MapStore SHALL
     * store the error state for display
     */
    it('should initialize with error as null', () => {
      const state = useMapStore.getState();
      expect(state.error).toBeNull();
    });

    /**
     * Requirement 2.1: THE MapStore SHALL maintain viewport state including
     * longitude, latitude, zoom, pitch, bearing, width, height
     */
    it('should have all required viewport fields', () => {
      const state = useMapStore.getState();
      const viewport = state.viewport;

      expect(viewport).toHaveProperty('latitude');
      expect(viewport).toHaveProperty('longitude');
      expect(viewport).toHaveProperty('zoom');
      expect(viewport).toHaveProperty('minZoom');
      expect(viewport).toHaveProperty('bearing');
      expect(viewport).toHaveProperty('pitch');
      expect(viewport).toHaveProperty('width');
      expect(viewport).toHaveProperty('height');
    });
  });

  describe('setViewport', () => {
    /**
     * Requirement 2.3: WHEN the user pans or zooms the map,
     * THE MapStore SHALL update the viewport state
     */
    it('should update viewport with partial values', () => {
      act(() => {
        useMapStore.getState().setViewport({ latitude: 45, longitude: 90 });
      });

      const state = useMapStore.getState();
      expect(state.viewport.latitude).toBe(45);
      expect(state.viewport.longitude).toBe(90);
      // Other values should remain unchanged
      expect(state.viewport.zoom).toBe(2.5);
    });

    it('should update zoom level', () => {
      act(() => {
        useMapStore.getState().setViewport({ zoom: 5 });
      });

      const state = useMapStore.getState();
      expect(state.viewport.zoom).toBe(5);
    });

    it('should clamp latitude to valid range [-90, 90]', () => {
      act(() => {
        useMapStore.getState().setViewport({ latitude: 100 });
      });
      expect(useMapStore.getState().viewport.latitude).toBe(90);

      act(() => {
        useMapStore.getState().setViewport({ latitude: -100 });
      });
      expect(useMapStore.getState().viewport.latitude).toBe(-90);
    });

    it('should normalize longitude to [-180, 180]', () => {
      act(() => {
        useMapStore.getState().setViewport({ longitude: 200 });
      });
      expect(useMapStore.getState().viewport.longitude).toBe(-160);

      act(() => {
        useMapStore.getState().setViewport({ longitude: -200 });
      });
      expect(useMapStore.getState().viewport.longitude).toBe(160);
    });

    it('should clamp zoom to valid range', () => {
      act(() => {
        useMapStore.getState().setViewport({ zoom: -5 });
      });
      // Should be clamped to minZoom (2)
      expect(useMapStore.getState().viewport.zoom).toBe(2);

      act(() => {
        useMapStore.getState().setViewport({ zoom: 30 });
      });
      expect(useMapStore.getState().viewport.zoom).toBe(22);
    });

    it('should update bearing with normalization', () => {
      act(() => {
        useMapStore.getState().setViewport({ bearing: 45 });
      });
      expect(useMapStore.getState().viewport.bearing).toBe(45);

      act(() => {
        useMapStore.getState().setViewport({ bearing: 400 });
      });
      expect(useMapStore.getState().viewport.bearing).toBe(40);
    });

    it('should clamp pitch to valid range [0, 85]', () => {
      act(() => {
        useMapStore.getState().setViewport({ pitch: 60 });
      });
      expect(useMapStore.getState().viewport.pitch).toBe(60);

      act(() => {
        useMapStore.getState().setViewport({ pitch: 100 });
      });
      expect(useMapStore.getState().viewport.pitch).toBe(85);

      act(() => {
        useMapStore.getState().setViewport({ pitch: -10 });
      });
      expect(useMapStore.getState().viewport.pitch).toBe(0);
    });

    it('should update width and height', () => {
      act(() => {
        useMapStore.getState().setViewport({ width: 1920, height: 1080 });
      });

      const state = useMapStore.getState();
      expect(state.viewport.width).toBe(1920);
      expect(state.viewport.height).toBe(1080);
    });

    it('should handle invalid numeric values gracefully', () => {
      act(() => {
        useMapStore.getState().setViewport({ latitude: NaN });
      });

      // Should use default value for invalid input
      expect(useMapStore.getState().viewport.latitude).toBe(defaultViewport.latitude);
    });

    it('should ensure zoom is not below minZoom after minZoom update', () => {
      act(() => {
        useMapStore.getState().setViewport({ zoom: 3, minZoom: 5 });
      });

      const state = useMapStore.getState();
      expect(state.viewport.minZoom).toBe(5);
      expect(state.viewport.zoom).toBe(5); // Should be raised to minZoom
    });
  });

  describe('flyTo', () => {
    /**
     * Requirement 2.6: THE MapStore SHALL provide a flyTo action that
     * animates the viewport to a target location
     */
    it('should set flyToTarget with coordinates', () => {
      act(() => {
        useMapStore.getState().flyTo({ latitude: 50, longitude: 10 });
      });

      const state = useMapStore.getState();
      expect(state.isFlying).toBe(true);
      expect(state.flyToTarget).not.toBeNull();
      expect(state.flyToTarget?.latitude).toBe(50);
      expect(state.flyToTarget?.longitude).toBe(10);
    });

    it('should use default duration of 2000ms', () => {
      act(() => {
        useMapStore.getState().flyTo({ latitude: 50, longitude: 10 });
      });

      const state = useMapStore.getState();
      expect(state.flyToTarget?.duration).toBe(DEFAULT_FLY_TO_DURATION);
      expect(state.flyToTarget?.duration).toBe(2000);
    });

    it('should accept custom duration', () => {
      act(() => {
        useMapStore.getState().flyTo({ latitude: 50, longitude: 10, duration: 3000 });
      });

      const state = useMapStore.getState();
      expect(state.flyToTarget?.duration).toBe(3000);
    });

    it('should accept optional zoom level', () => {
      act(() => {
        useMapStore.getState().flyTo({ latitude: 50, longitude: 10, zoom: 8 });
      });

      const state = useMapStore.getState();
      expect(state.flyToTarget?.zoom).toBe(8);
    });

    it('should accept optional bearing and pitch', () => {
      act(() => {
        useMapStore.getState().flyTo({
          latitude: 50,
          longitude: 10,
          bearing: 45,
          pitch: 30,
        });
      });

      const state = useMapStore.getState();
      expect(state.flyToTarget?.bearing).toBe(45);
      expect(state.flyToTarget?.pitch).toBe(30);
    });

    it('should clamp latitude in flyTo target', () => {
      act(() => {
        useMapStore.getState().flyTo({ latitude: 100, longitude: 10 });
      });

      const state = useMapStore.getState();
      expect(state.flyToTarget?.latitude).toBe(90);
    });

    it('should normalize longitude in flyTo target', () => {
      act(() => {
        useMapStore.getState().flyTo({ latitude: 50, longitude: 200 });
      });

      const state = useMapStore.getState();
      expect(state.flyToTarget?.longitude).toBe(-160);
    });

    it('should not set flyTo with invalid coordinates', () => {
      act(() => {
        useMapStore.getState().flyTo({ latitude: NaN, longitude: 10 });
      });

      const state = useMapStore.getState();
      expect(state.isFlying).toBe(false);
      expect(state.flyToTarget).toBeNull();
    });
  });

  describe('clearFlyTo', () => {
    it('should clear flyTo state', () => {
      // First set a flyTo target
      act(() => {
        useMapStore.getState().flyTo({ latitude: 50, longitude: 10 });
      });

      expect(useMapStore.getState().isFlying).toBe(true);

      // Then clear it
      act(() => {
        useMapStore.getState().clearFlyTo();
      });

      const state = useMapStore.getState();
      expect(state.isFlying).toBe(false);
      expect(state.flyToTarget).toBeNull();
    });
  });

  describe('setActiveColor', () => {
    it('should set active color dimension', () => {
      const dimensions: AreaColorDimension[] = [
        'ruler',
        'religion',
        'religionGeneral',
        'culture',
        'population',
      ];

      for (const dimension of dimensions) {
        act(() => {
          useMapStore.getState().setActiveColor(dimension);
        });
        expect(useMapStore.getState().activeColor).toBe(dimension);
      }
    });

    it('should not change state for invalid dimension', () => {
      act(() => {
        useMapStore.getState().setActiveColor('ruler');
      });

      act(() => {
        // @ts-expect-error Testing invalid input
        useMapStore.getState().setActiveColor('invalid');
      });

      expect(useMapStore.getState().activeColor).toBe('ruler');
    });
  });

  /**
   * Area Data Caching Tests
   * Requirement 12.2: THE MapStore SHALL cache area data by year
   * to avoid redundant API calls
   */
  describe('area data caching', () => {
    // Sample area data for testing
    const sampleAreaData: AreaData = {
      province1: ['ruler1', 'culture1', 'religion1', 'capital1', 1000] as ProvinceData,
      province2: ['ruler2', 'culture2', 'religion2', null, 2000] as ProvinceData,
    };

    const sampleAreaData2: AreaData = {
      province3: ['ruler3', 'culture3', 'religion3', 'capital3', 3000] as ProvinceData,
    };

    describe('setAreaData', () => {
      it('should store area data in cache for a given year', () => {
        act(() => {
          useMapStore.getState().setAreaData(1000, sampleAreaData);
        });

        const state = useMapStore.getState();
        expect(state.areaDataCache.has(1000)).toBe(true);
        expect(state.areaDataCache.get(1000)).toEqual(sampleAreaData);
      });

      it('should set currentAreaData to the provided data', () => {
        act(() => {
          useMapStore.getState().setAreaData(1000, sampleAreaData);
        });

        const state = useMapStore.getState();
        expect(state.currentAreaData).toEqual(sampleAreaData);
      });

      it('should set isLoadingAreaData to false', () => {
        // First set loading to true
        act(() => {
          useMapStore.setState({ isLoadingAreaData: true });
        });

        act(() => {
          useMapStore.getState().setAreaData(1000, sampleAreaData);
        });

        const state = useMapStore.getState();
        expect(state.isLoadingAreaData).toBe(false);
      });

      it('should store multiple years in cache', () => {
        act(() => {
          useMapStore.getState().setAreaData(1000, sampleAreaData);
        });

        act(() => {
          useMapStore.getState().setAreaData(1500, sampleAreaData2);
        });

        const state = useMapStore.getState();
        expect(state.areaDataCache.size).toBe(2);
        expect(state.areaDataCache.has(1000)).toBe(true);
        expect(state.areaDataCache.has(1500)).toBe(true);
        expect(state.areaDataCache.get(1000)).toEqual(sampleAreaData);
        expect(state.areaDataCache.get(1500)).toEqual(sampleAreaData2);
      });

      it('should overwrite existing data for the same year', () => {
        act(() => {
          useMapStore.getState().setAreaData(1000, sampleAreaData);
        });

        act(() => {
          useMapStore.getState().setAreaData(1000, sampleAreaData2);
        });

        const state = useMapStore.getState();
        expect(state.areaDataCache.size).toBe(1);
        expect(state.areaDataCache.get(1000)).toEqual(sampleAreaData2);
      });

      it('should not store data for invalid year (NaN)', () => {
        act(() => {
          useMapStore.getState().setAreaData(NaN, sampleAreaData);
        });

        const state = useMapStore.getState();
        expect(state.areaDataCache.size).toBe(0);
      });

      it('should not store data for invalid year (Infinity)', () => {
        act(() => {
          useMapStore.getState().setAreaData(Infinity, sampleAreaData);
        });

        const state = useMapStore.getState();
        expect(state.areaDataCache.size).toBe(0);
      });

      it('should handle negative years (BC)', () => {
        act(() => {
          useMapStore.getState().setAreaData(-500, sampleAreaData);
        });

        const state = useMapStore.getState();
        expect(state.areaDataCache.has(-500)).toBe(true);
        expect(state.areaDataCache.get(-500)).toEqual(sampleAreaData);
      });
    });

    describe('loadAreaData', () => {
      it('should return cached data if available', async () => {
        // First cache some data
        act(() => {
          useMapStore.getState().setAreaData(1000, sampleAreaData);
        });

        // Then load it
        let result: AreaData | null = null;
        await act(async () => {
          result = await useMapStore.getState().loadAreaData(1000);
        });

        expect(result).toEqual(sampleAreaData);
      });

      it('should set currentAreaData when returning cached data', async () => {
        // First cache some data
        act(() => {
          useMapStore.getState().setAreaData(1000, sampleAreaData);
        });

        // Clear currentAreaData
        act(() => {
          useMapStore.setState({ currentAreaData: null });
        });

        // Then load it
        await act(async () => {
          await useMapStore.getState().loadAreaData(1000);
        });

        const state = useMapStore.getState();
        expect(state.currentAreaData).toEqual(sampleAreaData);
      });

      it('should set isLoadingAreaData to false when returning cached data', async () => {
        // First cache some data
        act(() => {
          useMapStore.getState().setAreaData(1000, sampleAreaData);
        });

        // Set loading to true
        act(() => {
          useMapStore.setState({ isLoadingAreaData: true });
        });

        // Then load it
        await act(async () => {
          await useMapStore.getState().loadAreaData(1000);
        });

        const state = useMapStore.getState();
        expect(state.isLoadingAreaData).toBe(false);
      });

      it('should set isLoadingAreaData to false after API call completes (with error)', async () => {
        await act(async () => {
          await useMapStore.getState().loadAreaData(1000);
        });

        const state = useMapStore.getState();
        // After API call completes (even with error), loading should be false
        expect(state.isLoadingAreaData).toBe(false);
      });

      it('should set error state when API call fails', async () => {
        await act(async () => {
          await useMapStore.getState().loadAreaData(1000);
        });

        const state = useMapStore.getState();
        // API call should fail (no server running) and set error
        expect(state.error).not.toBeNull();
      });

      it('should return null when API call fails', async () => {
        let result: AreaData | null = null;
        await act(async () => {
          result = await useMapStore.getState().loadAreaData(1000);
        });

        expect(result).toBeNull();
      });

      it('should return null for invalid year (NaN)', async () => {
        let result: AreaData | null = null;
        await act(async () => {
          result = await useMapStore.getState().loadAreaData(NaN);
        });

        expect(result).toBeNull();
      });

      it('should return null for invalid year (Infinity)', async () => {
        let result: AreaData | null = null;
        await act(async () => {
          result = await useMapStore.getState().loadAreaData(Infinity);
        });

        expect(result).toBeNull();
      });

      it('should handle negative years (BC)', async () => {
        // First cache some data
        act(() => {
          useMapStore.getState().setAreaData(-500, sampleAreaData);
        });

        // Then load it
        let result: AreaData | null = null;
        await act(async () => {
          result = await useMapStore.getState().loadAreaData(-500);
        });

        expect(result).toEqual(sampleAreaData);
      });
    });

    describe('clearAreaDataCache', () => {
      it('should clear all cached area data', () => {
        // First cache some data
        act(() => {
          useMapStore.getState().setAreaData(1000, sampleAreaData);
          useMapStore.getState().setAreaData(1500, sampleAreaData2);
        });

        expect(useMapStore.getState().areaDataCache.size).toBe(2);

        // Clear the cache
        act(() => {
          useMapStore.getState().clearAreaDataCache();
        });

        const state = useMapStore.getState();
        expect(state.areaDataCache.size).toBe(0);
      });

      it('should set currentAreaData to null', () => {
        // First cache some data
        act(() => {
          useMapStore.getState().setAreaData(1000, sampleAreaData);
        });

        expect(useMapStore.getState().currentAreaData).not.toBeNull();

        // Clear the cache
        act(() => {
          useMapStore.getState().clearAreaDataCache();
        });

        const state = useMapStore.getState();
        expect(state.currentAreaData).toBeNull();
      });

      it('should set isLoadingAreaData to false', () => {
        // Set loading to true
        act(() => {
          useMapStore.setState({ isLoadingAreaData: true });
        });

        // Clear the cache
        act(() => {
          useMapStore.getState().clearAreaDataCache();
        });

        const state = useMapStore.getState();
        expect(state.isLoadingAreaData).toBe(false);
      });
    });
  });

  /**
   * Province Selection Tests
   * Requirement 7.2: WHEN a province is selected, THE MapStore SHALL
   * store the selected province ID and its data
   */
  describe('province selection', () => {
    // Sample area data for testing
    const sampleAreaData: AreaData = {
      province1: ['ruler1', 'culture1', 'religion1', 'capital1', 1000] as ProvinceData,
      province2: ['ruler2', 'culture2', 'religion2', null, 2000] as ProvinceData,
    };

    describe('selectProvince', () => {
      it('should set selectedProvince to the provided ID', () => {
        act(() => {
          useMapStore.getState().selectProvince('province1');
        });

        const state = useMapStore.getState();
        expect(state.selectedProvince).toBe('province1');
      });

      it('should set selectedProvinceData from currentAreaData when available', () => {
        // First set area data
        act(() => {
          useMapStore.getState().setAreaData(1000, sampleAreaData);
        });

        // Then select a province
        act(() => {
          useMapStore.getState().selectProvince('province1');
        });

        const state = useMapStore.getState();
        expect(state.selectedProvince).toBe('province1');
        expect(state.selectedProvinceData).toEqual(sampleAreaData['province1']);
      });

      it('should set selectedProvinceData to null when province not in currentAreaData', () => {
        // First set area data
        act(() => {
          useMapStore.getState().setAreaData(1000, sampleAreaData);
        });

        // Then select a province that doesn't exist
        act(() => {
          useMapStore.getState().selectProvince('nonexistent');
        });

        const state = useMapStore.getState();
        expect(state.selectedProvince).toBe('nonexistent');
        expect(state.selectedProvinceData).toBeNull();
      });

      it('should set selectedProvinceData to null when currentAreaData is null', () => {
        act(() => {
          useMapStore.getState().selectProvince('province1');
        });

        const state = useMapStore.getState();
        expect(state.selectedProvince).toBe('province1');
        expect(state.selectedProvinceData).toBeNull();
      });

      it('should trim whitespace from province ID', () => {
        act(() => {
          useMapStore.getState().selectProvince('  province1  ');
        });

        const state = useMapStore.getState();
        expect(state.selectedProvince).toBe('province1');
      });

      it('should not select province with empty string', () => {
        // First set a valid selection
        act(() => {
          useMapStore.getState().selectProvince('province1');
        });

        // Try to select with empty string
        act(() => {
          useMapStore.getState().selectProvince('');
        });

        // Should remain unchanged
        const state = useMapStore.getState();
        expect(state.selectedProvince).toBe('province1');
      });

      it('should not select province with whitespace-only string', () => {
        // First set a valid selection
        act(() => {
          useMapStore.getState().selectProvince('province1');
        });

        // Try to select with whitespace-only string
        act(() => {
          useMapStore.getState().selectProvince('   ');
        });

        // Should remain unchanged
        const state = useMapStore.getState();
        expect(state.selectedProvince).toBe('province1');
      });

      it('should update selection when selecting a different province', () => {
        // First set area data
        act(() => {
          useMapStore.getState().setAreaData(1000, sampleAreaData);
        });

        // Select first province
        act(() => {
          useMapStore.getState().selectProvince('province1');
        });

        expect(useMapStore.getState().selectedProvince).toBe('province1');
        expect(useMapStore.getState().selectedProvinceData).toEqual(sampleAreaData['province1']);

        // Select second province
        act(() => {
          useMapStore.getState().selectProvince('province2');
        });

        const state = useMapStore.getState();
        expect(state.selectedProvince).toBe('province2');
        expect(state.selectedProvinceData).toEqual(sampleAreaData['province2']);
      });

      it('should handle province data with null capital', () => {
        // First set area data
        act(() => {
          useMapStore.getState().setAreaData(1000, sampleAreaData);
        });

        // Select province2 which has null capital
        act(() => {
          useMapStore.getState().selectProvince('province2');
        });

        const state = useMapStore.getState();
        expect(state.selectedProvince).toBe('province2');
        expect(state.selectedProvinceData).toEqual(['ruler2', 'culture2', 'religion2', null, 2000]);
      });
    });

    describe('clearSelection', () => {
      it('should clear selectedProvince', () => {
        // First set a selection
        act(() => {
          useMapStore.getState().selectProvince('province1');
        });

        expect(useMapStore.getState().selectedProvince).toBe('province1');

        // Clear selection
        act(() => {
          useMapStore.getState().clearSelection();
        });

        const state = useMapStore.getState();
        expect(state.selectedProvince).toBeNull();
      });

      it('should clear selectedProvinceData', () => {
        // First set area data and selection
        act(() => {
          useMapStore.getState().setAreaData(1000, sampleAreaData);
        });

        act(() => {
          useMapStore.getState().selectProvince('province1');
        });

        expect(useMapStore.getState().selectedProvinceData).not.toBeNull();

        // Clear selection
        act(() => {
          useMapStore.getState().clearSelection();
        });

        const state = useMapStore.getState();
        expect(state.selectedProvinceData).toBeNull();
      });

      it('should be safe to call when nothing is selected', () => {
        // Clear selection when nothing is selected
        act(() => {
          useMapStore.getState().clearSelection();
        });

        const state = useMapStore.getState();
        expect(state.selectedProvince).toBeNull();
        expect(state.selectedProvinceData).toBeNull();
      });
    });
  });

  /**
   * Error State Tests
   * Requirement 13.4: WHEN an error occurs, THE MapStore SHALL
   * store the error state for display
   */
  describe('error state', () => {
    describe('setError', () => {
      it('should set error state with an Error object', () => {
        const testError = new Error('Test error message');

        act(() => {
          useMapStore.getState().setError(testError);
        });

        const state = useMapStore.getState();
        expect(state.error).toBe(testError);
        expect(state.error?.message).toBe('Test error message');
      });

      it('should clear error state when passed null', () => {
        // First set an error
        const testError = new Error('Test error');
        act(() => {
          useMapStore.getState().setError(testError);
        });

        expect(useMapStore.getState().error).not.toBeNull();

        // Clear the error
        act(() => {
          useMapStore.getState().setError(null);
        });

        const state = useMapStore.getState();
        expect(state.error).toBeNull();
      });

      it('should replace existing error with new error', () => {
        const error1 = new Error('First error');
        const error2 = new Error('Second error');

        act(() => {
          useMapStore.getState().setError(error1);
        });

        expect(useMapStore.getState().error?.message).toBe('First error');

        act(() => {
          useMapStore.getState().setError(error2);
        });

        const state = useMapStore.getState();
        expect(state.error?.message).toBe('Second error');
      });

      it('should handle errors with custom properties', () => {
        class CustomError extends Error {
          code: string;
          constructor(message: string, code: string) {
            super(message);
            this.code = code;
            this.name = 'CustomError';
          }
        }

        const customError = new CustomError('Custom error', 'ERR_001');

        act(() => {
          useMapStore.getState().setError(customError);
        });

        const state = useMapStore.getState();
        expect(state.error).toBe(customError);
        expect((state.error as CustomError).code).toBe('ERR_001');
      });

      it('should be safe to set null when error is already null', () => {
        act(() => {
          useMapStore.getState().setError(null);
        });

        const state = useMapStore.getState();
        expect(state.error).toBeNull();
      });
    });
  });
});

describe('utility functions', () => {
  describe('isValidViewport', () => {
    it('should return true for valid viewport', () => {
      const viewport: ViewportState = {
        latitude: 37,
        longitude: 37,
        zoom: 2.5,
        minZoom: 2,
        bearing: 0,
        pitch: 0,
        width: 1024,
        height: 768,
      };

      expect(isValidViewport(viewport)).toBe(true);
    });

    it('should return false for viewport with missing fields', () => {
      const viewport = {
        latitude: 37,
        longitude: 37,
        // missing other fields
      };

      expect(isValidViewport(viewport)).toBe(false);
    });

    it('should return false for viewport with NaN values', () => {
      const viewport: ViewportState = {
        latitude: NaN,
        longitude: 37,
        zoom: 2.5,
        minZoom: 2,
        bearing: 0,
        pitch: 0,
        width: 1024,
        height: 768,
      };

      expect(isValidViewport(viewport)).toBe(false);
    });

    it('should return false for viewport with Infinity values', () => {
      const viewport: ViewportState = {
        latitude: 37,
        longitude: Infinity,
        zoom: 2.5,
        minZoom: 2,
        bearing: 0,
        pitch: 0,
        width: 1024,
        height: 768,
      };

      expect(isValidViewport(viewport)).toBe(false);
    });
  });

  describe('isValidColorDimension', () => {
    it('should return true for valid dimensions', () => {
      expect(isValidColorDimension('ruler')).toBe(true);
      expect(isValidColorDimension('religion')).toBe(true);
      expect(isValidColorDimension('religionGeneral')).toBe(true);
      expect(isValidColorDimension('culture')).toBe(true);
      expect(isValidColorDimension('population')).toBe(true);
    });

    it('should return false for invalid dimensions', () => {
      expect(isValidColorDimension('invalid')).toBe(false);
      expect(isValidColorDimension('')).toBe(false);
      expect(isValidColorDimension(null)).toBe(false);
      expect(isValidColorDimension(undefined)).toBe(false);
      expect(isValidColorDimension(123)).toBe(false);
    });
  });

  describe('clampLatitude', () => {
    it('should return value within range', () => {
      expect(clampLatitude(45)).toBe(45);
      expect(clampLatitude(-45)).toBe(-45);
      expect(clampLatitude(0)).toBe(0);
    });

    it('should clamp values outside range', () => {
      expect(clampLatitude(100)).toBe(90);
      expect(clampLatitude(-100)).toBe(-90);
    });

    it('should handle edge cases', () => {
      expect(clampLatitude(90)).toBe(90);
      expect(clampLatitude(-90)).toBe(-90);
    });

    it('should return default for invalid values', () => {
      expect(clampLatitude(NaN)).toBe(defaultViewport.latitude);
      expect(clampLatitude(Infinity)).toBe(defaultViewport.latitude);
    });
  });

  describe('normalizeLongitude', () => {
    it('should return value within range', () => {
      expect(normalizeLongitude(90)).toBe(90);
      expect(normalizeLongitude(-90)).toBe(-90);
      expect(normalizeLongitude(0)).toBe(0);
    });

    it('should normalize values outside range', () => {
      expect(normalizeLongitude(200)).toBe(-160);
      expect(normalizeLongitude(-200)).toBe(160);
      expect(normalizeLongitude(360)).toBe(0);
      expect(normalizeLongitude(540)).toBe(180);
    });

    it('should handle edge cases', () => {
      expect(normalizeLongitude(180)).toBe(180);
      expect(normalizeLongitude(-180)).toBe(-180);
    });

    it('should return default for invalid values', () => {
      expect(normalizeLongitude(NaN)).toBe(defaultViewport.longitude);
      expect(normalizeLongitude(Infinity)).toBe(defaultViewport.longitude);
    });
  });

  describe('clampZoom', () => {
    it('should return value within default range', () => {
      expect(clampZoom(5)).toBe(5);
      expect(clampZoom(10)).toBe(10);
    });

    it('should clamp values outside default range', () => {
      expect(clampZoom(-5)).toBe(0);
      expect(clampZoom(30)).toBe(22);
    });

    it('should respect custom min/max', () => {
      expect(clampZoom(1, 2, 10)).toBe(2);
      expect(clampZoom(15, 2, 10)).toBe(10);
    });

    it('should return default for invalid values', () => {
      expect(clampZoom(NaN)).toBe(defaultViewport.zoom);
      expect(clampZoom(Infinity)).toBe(defaultViewport.zoom);
    });
  });
});

describe('defaultViewport', () => {
  /**
   * Requirement 2.2: THE MapStore SHALL initialize viewport with default values
   */
  it('should have correct default values', () => {
    expect(defaultViewport.latitude).toBe(37);
    expect(defaultViewport.longitude).toBe(37);
    expect(defaultViewport.zoom).toBe(2.5);
    expect(defaultViewport.minZoom).toBe(2);
    expect(defaultViewport.bearing).toBe(0);
    expect(defaultViewport.pitch).toBe(0);
  });
});


/**
 * Entity Outline Tests
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */
describe('entity outline', () => {
  // Sample provinces GeoJSON for testing
  const sampleProvincesGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Polygon> = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { id: 'province1' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
        },
      },
      {
        type: 'Feature',
        properties: { id: 'province2' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[1, 0], [2, 0], [2, 1], [1, 1], [1, 0]]],
        },
      },
      {
        type: 'Feature',
        properties: { id: 'province3' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[5, 5], [6, 5], [6, 6], [5, 6], [5, 5]]],
        },
      },
    ],
  };

  // Sample area data where province1 and province2 have the same ruler
  const sampleAreaDataForOutline: AreaData = {
    province1: ['ruler1', 'culture1', 'religion1', 'capital1', 1000] as ProvinceData,
    province2: ['ruler1', 'culture2', 'religion2', null, 2000] as ProvinceData,
    province3: ['ruler2', 'culture1', 'religion1', 'capital3', 3000] as ProvinceData,
  };

  // Sample metadata for entity colors
  const sampleMetadata = {
    ruler: {
      ruler1: { name: 'Ruler One', color: 'rgba(255, 0, 0, 1)' },
      ruler2: { name: 'Ruler Two', color: 'rgba(0, 255, 0, 1)' },
    },
    culture: {
      culture1: { name: 'Culture One', color: 'rgba(0, 0, 255, 1)' },
      culture2: { name: 'Culture Two', color: 'rgba(255, 255, 0, 1)' },
    },
    religion: {
      religion1: { name: 'Religion One', color: 'rgba(255, 0, 255, 1)' },
      religion2: { name: 'Religion Two', color: 'rgba(0, 255, 255, 1)' },
    },
    religionGeneral: {
      religion1: { name: 'Religion General One', color: 'rgba(128, 128, 128, 1)' },
    },
  };

  beforeEach(() => {
    act(() => {
      useMapStore.setState({
        ...initialState,
        areaDataCache: new Map(),
        provincesGeoJSON: null,
        metadata: null,
        entityOutline: null,
        entityOutlineColor: null,
      });
    });
  });

  describe('setProvincesGeoJSON', () => {
    it('should set provinces GeoJSON', () => {
      act(() => {
        useMapStore.getState().setProvincesGeoJSON(sampleProvincesGeoJSON as GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon>);
      });

      const state = useMapStore.getState();
      expect(state.provincesGeoJSON).toEqual(sampleProvincesGeoJSON);
    });
  });

  describe('setMetadata', () => {
    it('should set metadata', () => {
      act(() => {
        useMapStore.getState().setMetadata(sampleMetadata);
      });

      const state = useMapStore.getState();
      expect(state.metadata).toEqual(sampleMetadata);
    });
  });

  describe('getEntityColor', () => {
    beforeEach(() => {
      act(() => {
        useMapStore.getState().setMetadata(sampleMetadata);
      });
    });

    it('should return color for valid ruler', () => {
      const color = useMapStore.getState().getEntityColor('ruler1', 'ruler');
      expect(color).toBe('rgba(255, 0, 0, 1)');
    });

    it('should return color for valid culture', () => {
      const color = useMapStore.getState().getEntityColor('culture1', 'culture');
      expect(color).toBe('rgba(0, 0, 255, 1)');
    });

    it('should return color for valid religion', () => {
      const color = useMapStore.getState().getEntityColor('religion1', 'religion');
      expect(color).toBe('rgba(255, 0, 255, 1)');
    });

    it('should return null for non-existent entity', () => {
      const color = useMapStore.getState().getEntityColor('nonexistent', 'ruler');
      expect(color).toBeNull();
    });

    it('should return null when metadata is not set', () => {
      act(() => {
        useMapStore.setState({ metadata: null });
      });

      const color = useMapStore.getState().getEntityColor('ruler1', 'ruler');
      expect(color).toBeNull();
    });

    it('should return null for empty value', () => {
      const color = useMapStore.getState().getEntityColor('', 'ruler');
      expect(color).toBeNull();
    });
  });

  describe('calculateEntityOutline', () => {
    beforeEach(() => {
      act(() => {
        useMapStore.getState().setProvincesGeoJSON(sampleProvincesGeoJSON as GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon>);
        useMapStore.getState().setAreaData(1000, sampleAreaDataForOutline);
        useMapStore.getState().setMetadata(sampleMetadata);
      });
    });

    /**
     * Requirement 8.1: WHEN a province is selected, THE MapView SHALL calculate
     * the entity outline for that province's ruler/culture/religion
     */
    it('should calculate entity outline for matching ruler', () => {
      act(() => {
        useMapStore.getState().calculateEntityOutline('ruler1', 'ruler');
      });

      const state = useMapStore.getState();
      expect(state.entityOutline).not.toBeNull();
      expect(state.entityOutline?.type).toBe('Feature');
      expect(state.entityOutline?.geometry.type).toMatch(/Polygon|MultiPolygon/);
    });

    /**
     * Requirement 8.4: THE MapView SHALL color the entity outline using the metadata color
     */
    it('should set entity outline color from metadata', () => {
      act(() => {
        useMapStore.getState().calculateEntityOutline('ruler1', 'ruler');
      });

      const state = useMapStore.getState();
      expect(state.entityOutlineColor).toBe('rgba(255, 0, 0, 1)');
    });

    it('should calculate entity outline for culture dimension', () => {
      act(() => {
        useMapStore.getState().calculateEntityOutline('culture1', 'culture');
      });

      const state = useMapStore.getState();
      expect(state.entityOutline).not.toBeNull();
      expect(state.entityOutlineColor).toBe('rgba(0, 0, 255, 1)');
    });

    it('should calculate entity outline for religion dimension', () => {
      act(() => {
        useMapStore.getState().calculateEntityOutline('religion1', 'religion');
      });

      const state = useMapStore.getState();
      expect(state.entityOutline).not.toBeNull();
      expect(state.entityOutlineColor).toBe('rgba(255, 0, 255, 1)');
    });

    it('should set entityOutline to null for non-matching value', () => {
      act(() => {
        useMapStore.getState().calculateEntityOutline('nonexistent', 'ruler');
      });

      const state = useMapStore.getState();
      expect(state.entityOutline).toBeNull();
      expect(state.entityOutlineColor).toBeNull();
    });

    it('should set entityOutline to null for invalid dimension', () => {
      act(() => {
        // @ts-expect-error Testing invalid input
        useMapStore.getState().calculateEntityOutline('ruler1', 'invalid');
      });

      const state = useMapStore.getState();
      expect(state.entityOutline).toBeNull();
    });

    it('should set entityOutline to null for population dimension', () => {
      act(() => {
        useMapStore.getState().calculateEntityOutline('1000', 'population');
      });

      const state = useMapStore.getState();
      expect(state.entityOutline).toBeNull();
    });

    it('should set entityOutline to null when provinces GeoJSON is missing', () => {
      act(() => {
        useMapStore.setState({ provincesGeoJSON: null });
      });

      act(() => {
        useMapStore.getState().calculateEntityOutline('ruler1', 'ruler');
      });

      const state = useMapStore.getState();
      expect(state.entityOutline).toBeNull();
    });

    it('should set entityOutline to null when area data is missing', () => {
      act(() => {
        useMapStore.setState({ currentAreaData: null });
      });

      act(() => {
        useMapStore.getState().calculateEntityOutline('ruler1', 'ruler');
      });

      const state = useMapStore.getState();
      expect(state.entityOutline).toBeNull();
    });

    it('should set entityOutline to null for empty value', () => {
      act(() => {
        useMapStore.getState().calculateEntityOutline('', 'ruler');
      });

      const state = useMapStore.getState();
      expect(state.entityOutline).toBeNull();
    });
  });

  describe('clearEntityOutline', () => {
    it('should clear entity outline and color', () => {
      // First set an entity outline
      act(() => {
        useMapStore.getState().setProvincesGeoJSON(sampleProvincesGeoJSON as GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon>);
        useMapStore.getState().setAreaData(1000, sampleAreaDataForOutline);
        useMapStore.getState().setMetadata(sampleMetadata);
        useMapStore.getState().calculateEntityOutline('ruler1', 'ruler');
      });

      expect(useMapStore.getState().entityOutline).not.toBeNull();

      // Clear it
      act(() => {
        useMapStore.getState().clearEntityOutline();
      });

      const state = useMapStore.getState();
      expect(state.entityOutline).toBeNull();
      expect(state.entityOutlineColor).toBeNull();
    });
  });

  describe('fitToEntityOutline', () => {
    beforeEach(() => {
      act(() => {
        useMapStore.getState().setProvincesGeoJSON(sampleProvincesGeoJSON as GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon>);
        useMapStore.getState().setAreaData(1000, sampleAreaDataForOutline);
        useMapStore.getState().setMetadata(sampleMetadata);
        useMapStore.getState().calculateEntityOutline('ruler1', 'ruler');
      });
    });

    /**
     * Requirement 8.3: THE MapView SHALL fit the viewport to the entity outline bounding box
     */
    it('should initiate flyTo when entity outline exists', () => {
      act(() => {
        useMapStore.getState().fitToEntityOutline();
      });

      const state = useMapStore.getState();
      expect(state.isFlying).toBe(true);
      expect(state.flyToTarget).not.toBeNull();
    });

    /**
     * Requirement 8.6: THE MapView SHALL constrain the zoom level between 4.5 and (current zoom - 1)
     */
    it('should constrain zoom to minimum 4.5', () => {
      // Set a low current zoom
      act(() => {
        useMapStore.getState().setViewport({ zoom: 3 });
      });

      act(() => {
        useMapStore.getState().fitToEntityOutline();
      });

      const state = useMapStore.getState();
      expect(state.flyToTarget?.zoom).toBeGreaterThanOrEqual(4.5);
    });

    it('should not initiate flyTo when no entity outline', () => {
      act(() => {
        useMapStore.getState().clearEntityOutline();
      });

      act(() => {
        useMapStore.getState().fitToEntityOutline();
      });

      const state = useMapStore.getState();
      expect(state.isFlying).toBe(false);
      expect(state.flyToTarget).toBeNull();
    });

    it('should accept custom padding', () => {
      act(() => {
        useMapStore.getState().fitToEntityOutline(100);
      });

      const state = useMapStore.getState();
      expect(state.isFlying).toBe(true);
    });
  });
});
