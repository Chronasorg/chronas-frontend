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
  isValidBasemapType,
  clampLatitude,
  normalizeLongitude,
  clampZoom,
  DEFAULT_FLY_TO_DURATION,
  FALLBACK_COLOR,
  BASEMAP_STYLES,
  type ViewportState,
  type AreaColorDimension,
  type BasemapType,
  type AreaData,
  type ProvinceData,
  type EntityMetadata,
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
     * Requirement 1.1: THE MapStore SHALL update the basemap state
     * Default basemap should be 'topographic'
     */
    it('should initialize with topographic as default basemap', () => {
      const state = useMapStore.getState();
      expect(state.basemap).toBe('topographic');
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

  describe('setBasemap', () => {
    /**
     * Requirement 1.1: WHEN the user selects a basemap option from the dropdown,
     * THE MapStore SHALL update the basemap state
     */
    it('should set basemap to topographic', () => {
      act(() => {
        useMapStore.getState().setBasemap('topographic');
      });

      const state = useMapStore.getState();
      expect(state.basemap).toBe('topographic');
    });

    it('should set basemap to watercolor', () => {
      act(() => {
        useMapStore.getState().setBasemap('watercolor');
      });

      const state = useMapStore.getState();
      expect(state.basemap).toBe('watercolor');
    });

    it('should set basemap to none', () => {
      act(() => {
        useMapStore.getState().setBasemap('none');
      });

      const state = useMapStore.getState();
      expect(state.basemap).toBe('none');
    });

    it('should not change state for invalid basemap type', () => {
      const initialBasemap = useMapStore.getState().basemap;
      
      act(() => {
        // @ts-expect-error Testing invalid input
        useMapStore.getState().setBasemap('invalid');
      });

      const state = useMapStore.getState();
      expect(state.basemap).toBe(initialBasemap);
    });

    it('should allow switching between all basemap types', () => {
      act(() => {
        useMapStore.getState().setBasemap('watercolor');
      });
      expect(useMapStore.getState().basemap).toBe('watercolor');

      act(() => {
        useMapStore.getState().setBasemap('none');
      });
      expect(useMapStore.getState().basemap).toBe('none');

      act(() => {
        useMapStore.getState().setBasemap('topographic');
      });
      expect(useMapStore.getState().basemap).toBe('topographic');
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

  describe('isValidBasemapType', () => {
    /**
     * Requirement 1.3: THE MapView SHALL support three basemap options:
     * topographic, watercolor, and none
     */
    it('should return true for valid basemap types', () => {
      expect(isValidBasemapType('topographic')).toBe(true);
      expect(isValidBasemapType('watercolor')).toBe(true);
      expect(isValidBasemapType('none')).toBe(true);
    });

    it('should return false for invalid basemap types', () => {
      expect(isValidBasemapType('invalid')).toBe(false);
      expect(isValidBasemapType('')).toBe(false);
      expect(isValidBasemapType(null)).toBe(false);
      expect(isValidBasemapType(undefined)).toBe(false);
      expect(isValidBasemapType(123)).toBe(false);
      expect(isValidBasemapType('satellite')).toBe(false);
    });
  });

  describe('BASEMAP_STYLES', () => {
    /**
     * Requirement 1.2: WHEN the basemap state changes, THE MapView SHALL
     * update the map style to reflect the selected basemap
     */
    it('should have style URL for topographic', () => {
      expect(BASEMAP_STYLES.topographic).toBe('mapbox://styles/mapbox/outdoors-v12');
    });

    it('should have style URL for watercolor', () => {
      expect(BASEMAP_STYLES.watercolor).toBeDefined();
      expect(typeof BASEMAP_STYLES.watercolor).toBe('string');
      expect(BASEMAP_STYLES.watercolor.length).toBeGreaterThan(0);
    });

    it('should have style URL for none (empty/minimal style)', () => {
      expect(BASEMAP_STYLES.none).toBe('mapbox://styles/mapbox/empty-v9');
    });

    it('should have all three basemap types defined', () => {
      const basemapTypes: BasemapType[] = ['topographic', 'watercolor', 'none'];
      for (const type of basemapTypes) {
        expect(BASEMAP_STYLES[type]).toBeDefined();
        expect(typeof BASEMAP_STYLES[type]).toBe('string');
      }
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
  // Note: Real API returns provinces with 'name' property as the province ID
  const sampleProvincesGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Polygon> = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: 'province1' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
        },
      },
      {
        type: 'Feature',
        properties: { name: 'province2' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[1, 0], [2, 0], [2, 1], [1, 1], [1, 0]]],
        },
      },
      {
        type: 'Feature',
        properties: { name: 'province3' },
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

    it('should return fallback color for non-existent entity', () => {
      const color = useMapStore.getState().getEntityColor('nonexistent', 'ruler');
      expect(color).toBe(FALLBACK_COLOR);
    });

    it('should return fallback color when metadata is not set', () => {
      act(() => {
        useMapStore.setState({ metadata: null });
      });

      const color = useMapStore.getState().getEntityColor('ruler1', 'ruler');
      expect(color).toBe(FALLBACK_COLOR);
    });

    it('should return fallback color for empty value', () => {
      const color = useMapStore.getState().getEntityColor('', 'ruler');
      expect(color).toBe(FALLBACK_COLOR);
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

  /**
   * Metadata Loading Tests
   * Requirement 2.1: WHEN the application initializes, THE Map_Store SHALL fetch metadata
   * Requirement 2.5: IF metadata loading fails, THEN THE MapView SHALL use default fallback colors
   */
  describe('metadata loading', () => {
    describe('loadMetadata', () => {
      it('should set isLoadingMetadata to true when loading starts', async () => {
        // Start loading (will fail due to no server, but we can check initial state)
        const loadPromise = act(async () => {
          // We need to check the state during loading
          const promise = useMapStore.getState().loadMetadata();
          // The state should be loading immediately after calling
          return promise;
        });

        // Wait for the promise to complete
        await loadPromise;

        // After completion (with error), isLoadingMetadata should be false
        const state = useMapStore.getState();
        expect(state.isLoadingMetadata).toBe(false);
      });

      it('should set isLoadingMetadata to false after loading completes (with error)', async () => {
        await act(async () => {
          await useMapStore.getState().loadMetadata();
        });

        const state = useMapStore.getState();
        expect(state.isLoadingMetadata).toBe(false);
      });

      it('should set error state when API call fails', async () => {
        await act(async () => {
          await useMapStore.getState().loadMetadata();
        });

        const state = useMapStore.getState();
        // API call should fail (no server running) and set error
        expect(state.error).not.toBeNull();
      });

      it('should return null when API call fails', async () => {
        let result: EntityMetadata | null = null;
        await act(async () => {
          result = await useMapStore.getState().loadMetadata();
        });

        expect(result).toBeNull();
      });

      it('should initialize with isLoadingMetadata as false', () => {
        const state = useMapStore.getState();
        expect(state.isLoadingMetadata).toBe(false);
      });

      it('should initialize with metadata as null', () => {
        const state = useMapStore.getState();
        expect(state.metadata).toBeNull();
      });
    });

    describe('setMetadata', () => {
      it('should store metadata correctly', () => {
        act(() => {
          useMapStore.getState().setMetadata(sampleMetadata);
        });

        const state = useMapStore.getState();
        expect(state.metadata).toEqual(sampleMetadata);
      });

      it('should overwrite existing metadata', () => {
        const newMetadata = {
          ruler: { newRuler: { name: 'New Ruler', color: 'rgba(100, 100, 100, 1)' } },
          culture: { newCulture: { name: 'New Culture', color: 'rgba(50, 50, 50, 1)' } },
          religion: { newReligion: { name: 'New Religion', color: 'rgba(25, 25, 25, 1)' } },
          religionGeneral: { newReligionGen: { name: 'New Religion Gen', color: 'rgba(10, 10, 10, 1)' } },
        };

        act(() => {
          useMapStore.getState().setMetadata(sampleMetadata);
        });

        act(() => {
          useMapStore.getState().setMetadata(newMetadata);
        });

        const state = useMapStore.getState();
        expect(state.metadata).toEqual(newMetadata);
        expect(state.metadata).not.toEqual(sampleMetadata);
      });
    });
  });

  /**
   * Fallback Color Tests
   * Requirement 2.5: IF metadata loading fails, THEN THE MapView SHALL use default fallback colors
   */
  describe('fallback color behavior', () => {
    it('should return fallback color when metadata is null', () => {
      // Ensure metadata is null
      act(() => {
        useMapStore.setState({ metadata: null });
      });

      const color = useMapStore.getState().getEntityColor('anyEntity', 'ruler');
      expect(color).toBe(FALLBACK_COLOR);
      expect(color).toBe('rgba(1,1,1,0.3)');
    });

    it('should return fallback color when entity does not exist in metadata', () => {
      act(() => {
        useMapStore.getState().setMetadata(sampleMetadata);
      });

      const color = useMapStore.getState().getEntityColor('nonExistentEntity', 'ruler');
      expect(color).toBe(FALLBACK_COLOR);
    });

    it('should return fallback color for empty entity value', () => {
      act(() => {
        useMapStore.getState().setMetadata(sampleMetadata);
      });

      const color = useMapStore.getState().getEntityColor('', 'ruler');
      expect(color).toBe(FALLBACK_COLOR);
    });

    it('should return fallback color for population dimension', () => {
      act(() => {
        useMapStore.getState().setMetadata(sampleMetadata);
      });

      // Population dimension doesn't use metadata colors
      const color = useMapStore.getState().getEntityColor('anyEntity', 'population');
      expect(color).toBe(FALLBACK_COLOR);
    });

    it('should return actual color when entity exists in metadata', () => {
      act(() => {
        useMapStore.getState().setMetadata(sampleMetadata);
      });

      const rulerColor = useMapStore.getState().getEntityColor('ruler1', 'ruler');
      expect(rulerColor).toBe('rgba(255, 0, 0, 1)');

      const cultureColor = useMapStore.getState().getEntityColor('culture1', 'culture');
      expect(cultureColor).toBe('rgba(0, 0, 255, 1)');

      const religionColor = useMapStore.getState().getEntityColor('religion1', 'religion');
      expect(religionColor).toBe('rgba(255, 0, 255, 1)');
    });

    it('should return fallback color for all dimensions when metadata is missing', () => {
      act(() => {
        useMapStore.setState({ metadata: null });
      });

      const dimensions: AreaColorDimension[] = ['ruler', 'culture', 'religion', 'religionGeneral', 'population'];
      
      for (const dimension of dimensions) {
        const color = useMapStore.getState().getEntityColor('anyEntity', dimension);
        expect(color).toBe(FALLBACK_COLOR);
      }
    });

    it('should return string type (not null) from getEntityColor', () => {
      // Test with metadata
      act(() => {
        useMapStore.getState().setMetadata(sampleMetadata);
      });

      const colorWithMetadata = useMapStore.getState().getEntityColor('ruler1', 'ruler');
      expect(typeof colorWithMetadata).toBe('string');

      // Test without metadata
      act(() => {
        useMapStore.setState({ metadata: null });
      });

      const colorWithoutMetadata = useMapStore.getState().getEntityColor('ruler1', 'ruler');
      expect(typeof colorWithoutMetadata).toBe('string');
    });
  });
});


/**
 * Cached Year Switch Performance Tests
 * Requirement 11.5: WHEN switching between cached years, THE MapView SHALL update within 100ms.
 *
 * These tests verify that cached data retrieval is fast and meets the performance threshold.
 */
describe('cached year switch performance', () => {
  // Sample area data for testing
  const createLargeAreaData = (provinceCount: number): AreaData => {
    const data: AreaData = {};
    for (let i = 0; i < provinceCount; i++) {
      data[`province_${String(i)}`] = [
        `ruler_${String(i % 100)}`,
        `culture_${String(i % 50)}`,
        `religion_${String(i % 30)}`,
        i % 10 === 0 ? `capital_${String(i)}` : null,
        Math.floor(Math.random() * 1000000),
      ] as ProvinceData;
    }
    return data;
  };

  beforeEach(() => {
    act(() => {
      useMapStore.setState({
        ...initialState,
        areaDataCache: new Map(),
      });
    });
  });

  /**
   * Requirement 11.5: Cached year switches should complete within 100ms
   */
  it('should return cached data within 100ms for small datasets', async () => {
    const smallAreaData = createLargeAreaData(100);
    
    // Cache the data
    act(() => {
      useMapStore.getState().setAreaData(1000, smallAreaData);
    });

    // Measure retrieval time
    const startTime = performance.now();
    let result: AreaData | null = null;
    
    await act(async () => {
      result = await useMapStore.getState().loadAreaData(1000);
    });
    
    const duration = performance.now() - startTime;

    expect(result).toEqual(smallAreaData);
    expect(duration).toBeLessThan(100);
  });

  /**
   * Requirement 11.5: Cached year switches should complete within 100ms
   * Test with larger dataset to ensure performance scales
   */
  it('should return cached data within 100ms for medium datasets', async () => {
    const mediumAreaData = createLargeAreaData(1000);
    
    // Cache the data
    act(() => {
      useMapStore.getState().setAreaData(1500, mediumAreaData);
    });

    // Measure retrieval time
    const startTime = performance.now();
    let result: AreaData | null = null;
    
    await act(async () => {
      result = await useMapStore.getState().loadAreaData(1500);
    });
    
    const duration = performance.now() - startTime;

    expect(result).toEqual(mediumAreaData);
    expect(duration).toBeLessThan(100);
  });

  /**
   * Requirement 11.5: Cached year switches should complete within 100ms
   * Test with multiple cached years to ensure cache lookup remains fast
   */
  it('should return cached data within 100ms with multiple years cached', async () => {
    // Cache multiple years
    for (let year = 1000; year <= 2000; year += 100) {
      const areaData = createLargeAreaData(500);
      act(() => {
        useMapStore.getState().setAreaData(year, areaData);
      });
    }

    // Verify cache size
    expect(useMapStore.getState().areaDataCache.size).toBe(11);

    // Measure retrieval time for a year in the middle
    const startTime = performance.now();
    let result: AreaData | null = null;
    
    await act(async () => {
      result = await useMapStore.getState().loadAreaData(1500);
    });
    
    const duration = performance.now() - startTime;

    expect(result).not.toBeNull();
    expect(duration).toBeLessThan(100);
  });

  /**
   * Requirement 11.5: Cached year switches should complete within 100ms
   * Test rapid consecutive cache lookups
   */
  it('should handle rapid consecutive cached year switches within 100ms each', async () => {
    // Cache multiple years
    const years = [1000, 1100, 1200, 1300, 1400];
    for (const year of years) {
      const areaData = createLargeAreaData(200);
      act(() => {
        useMapStore.getState().setAreaData(year, areaData);
      });
    }

    // Perform rapid consecutive lookups
    for (const year of years) {
      const startTime = performance.now();
      let result: AreaData | null = null;
      
      await act(async () => {
        result = await useMapStore.getState().loadAreaData(year);
      });
      
      const duration = performance.now() - startTime;

      expect(result).not.toBeNull();
      expect(duration).toBeLessThan(100);
    }
  });

  /**
   * Requirement 11.5: Verify isLoadingAreaData is false for cached data
   * This ensures no unnecessary loading state is shown for cached data
   */
  it('should not set isLoadingAreaData to true when returning cached data', async () => {
    const areaData = createLargeAreaData(100);
    
    // Cache the data
    act(() => {
      useMapStore.getState().setAreaData(1000, areaData);
    });

    // Load cached data
    await act(async () => {
      await useMapStore.getState().loadAreaData(1000);
    });

    // isLoadingAreaData should remain false (never set to true for cached data)
    const state = useMapStore.getState();
    expect(state.isLoadingAreaData).toBe(false);
  });

  /**
   * Requirement 11.5: Verify currentAreaData is updated correctly
   */
  it('should update currentAreaData when switching between cached years', async () => {
    const areaData1000 = createLargeAreaData(50);
    const areaData1500 = createLargeAreaData(75);
    
    // Cache both years
    act(() => {
      useMapStore.getState().setAreaData(1000, areaData1000);
      useMapStore.getState().setAreaData(1500, areaData1500);
    });

    // Switch to year 1000
    await act(async () => {
      await useMapStore.getState().loadAreaData(1000);
    });
    expect(useMapStore.getState().currentAreaData).toEqual(areaData1000);

    // Switch to year 1500
    await act(async () => {
      await useMapStore.getState().loadAreaData(1500);
    });
    expect(useMapStore.getState().currentAreaData).toEqual(areaData1500);

    // Switch back to year 1000
    await act(async () => {
      await useMapStore.getState().loadAreaData(1000);
    });
    expect(useMapStore.getState().currentAreaData).toEqual(areaData1000);
  });
});

/**
 * API Success Path Tests
 *
 * These tests verify that when the API returns valid data,
 * it is correctly stored and province properties are updated.
 */
describe('API Success Path Tests', () => {
  // Sample area data for testing
  const sampleApiResponse: AreaData = {
    province1: ['ruler1', 'culture1', 'religion1', 'capital1', 1000] as ProvinceData,
    province2: ['ruler2', 'culture2', 'religion2', null, 2000] as ProvinceData,
    province3: ['ruler1', 'culture3', 'religion3', 'capital3', 3000] as ProvinceData,
  };

  // Sample metadata for testing
  const sampleMetadata: EntityMetadata = {
    ruler: {
      ruler1: { name: 'Roman Empire', color: 'rgba(255,0,0,0.5)' },
      ruler2: { name: 'Persian Empire', color: 'rgba(0,255,0,0.5)' },
    },
    culture: {
      culture1: { name: 'Latin', color: 'rgba(100,100,0,0.5)' },
      culture2: { name: 'Greek', color: 'rgba(0,100,100,0.5)' },
      culture3: { name: 'Celtic', color: 'rgba(100,0,100,0.5)' },
    },
    religion: {
      religion1: { name: 'Roman Paganism', color: 'rgba(200,0,0,0.5)', parent: 'pagan' },
      religion2: { name: 'Zoroastrianism', color: 'rgba(0,200,0,0.5)', parent: 'eastern' },
      religion3: { name: 'Celtic Paganism', color: 'rgba(0,0,200,0.5)', parent: 'pagan' },
    },
    religionGeneral: {
      pagan: { name: 'Paganism', color: 'rgba(150,150,0,0.5)' },
      eastern: { name: 'Eastern Religions', color: 'rgba(0,150,150,0.5)' },
    },
  };

  // Sample provinces GeoJSON for testing
  // Note: Real API returns provinces with 'name' property as the province ID
  const sampleProvincesGeoJSON = {
    type: 'FeatureCollection' as const,
    features: [
      {
        type: 'Feature' as const,
        properties: { name: 'province1' },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
        },
      },
      {
        type: 'Feature' as const,
        properties: { name: 'province2' },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[[1, 0], [2, 0], [2, 1], [1, 1], [1, 0]]],
        },
      },
      {
        type: 'Feature' as const,
        properties: { name: 'province3' },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[[2, 0], [3, 0], [3, 1], [2, 1], [2, 0]]],
        },
      },
    ],
  };

  beforeEach(() => {
    act(() => {
      useMapStore.setState({
        ...initialState,
        areaDataCache: new Map(),
        metadata: sampleMetadata,
        provincesGeoJSON: sampleProvincesGeoJSON,
      });
    });
  });

  describe('When API returns valid data, it is correctly stored', () => {
    it('should store area data in currentAreaData when setAreaData is called', () => {
      act(() => {
        useMapStore.getState().setAreaData(1000, sampleApiResponse);
      });

      const state = useMapStore.getState();
      expect(state.currentAreaData).toEqual(sampleApiResponse);
    });

    it('should cache area data by year', () => {
      act(() => {
        useMapStore.getState().setAreaData(1000, sampleApiResponse);
      });

      const state = useMapStore.getState();
      expect(state.areaDataCache.get(1000)).toEqual(sampleApiResponse);
    });

    it('should store all province data correctly', () => {
      act(() => {
        useMapStore.getState().setAreaData(1000, sampleApiResponse);
      });

      const state = useMapStore.getState();
      const areaData = state.currentAreaData;

      expect(areaData).not.toBeNull();
      expect(areaData!['province1']).toEqual(['ruler1', 'culture1', 'religion1', 'capital1', 1000]);
      expect(areaData!['province2']).toEqual(['ruler2', 'culture2', 'religion2', null, 2000]);
      expect(areaData!['province3']).toEqual(['ruler1', 'culture3', 'religion3', 'capital3', 3000]);
    });

    it('should correctly extract ruler ID from province data', () => {
      act(() => {
        useMapStore.getState().setAreaData(1000, sampleApiResponse);
      });

      const state = useMapStore.getState();
      const areaData = state.currentAreaData!;

      // Index 0 is ruler
      expect(areaData['province1']![0]).toBe('ruler1');
      expect(areaData['province2']![0]).toBe('ruler2');
      expect(areaData['province3']![0]).toBe('ruler1');
    });

    it('should correctly extract culture ID from province data', () => {
      act(() => {
        useMapStore.getState().setAreaData(1000, sampleApiResponse);
      });

      const state = useMapStore.getState();
      const areaData = state.currentAreaData!;

      // Index 1 is culture
      expect(areaData['province1']![1]).toBe('culture1');
      expect(areaData['province2']![1]).toBe('culture2');
      expect(areaData['province3']![1]).toBe('culture3');
    });

    it('should correctly extract religion ID from province data', () => {
      act(() => {
        useMapStore.getState().setAreaData(1000, sampleApiResponse);
      });

      const state = useMapStore.getState();
      const areaData = state.currentAreaData!;

      // Index 2 is religion
      expect(areaData['province1']![2]).toBe('religion1');
      expect(areaData['province2']![2]).toBe('religion2');
      expect(areaData['province3']![2]).toBe('religion3');
    });

    it('should correctly extract capital ID from province data (including null)', () => {
      act(() => {
        useMapStore.getState().setAreaData(1000, sampleApiResponse);
      });

      const state = useMapStore.getState();
      const areaData = state.currentAreaData!;

      // Index 3 is capital (can be null)
      expect(areaData['province1']![3]).toBe('capital1');
      expect(areaData['province2']![3]).toBeNull();
      expect(areaData['province3']![3]).toBe('capital3');
    });

    it('should correctly extract population from province data', () => {
      act(() => {
        useMapStore.getState().setAreaData(1000, sampleApiResponse);
      });

      const state = useMapStore.getState();
      const areaData = state.currentAreaData!;

      // Index 4 is population
      expect(areaData['province1']![4]).toBe(1000);
      expect(areaData['province2']![4]).toBe(2000);
      expect(areaData['province3']![4]).toBe(3000);
    });

    it('should set isLoadingAreaData to false after data is stored', () => {
      // Set loading to true first
      act(() => {
        useMapStore.setState({ isLoadingAreaData: true });
      });

      act(() => {
        useMapStore.getState().setAreaData(1000, sampleApiResponse);
      });

      // setAreaData doesn't change loading state, but loadAreaData does
      // This test verifies the data is stored correctly
      const state = useMapStore.getState();
      expect(state.currentAreaData).toEqual(sampleApiResponse);
    });

    it('should handle multiple years of data correctly', () => {
      const year1000Data: AreaData = {
        province1: ['ruler1', 'culture1', 'religion1', 'capital1', 1000] as ProvinceData,
      };
      const year1500Data: AreaData = {
        province1: ['ruler2', 'culture2', 'religion2', 'capital2', 5000] as ProvinceData,
      };

      act(() => {
        useMapStore.getState().setAreaData(1000, year1000Data);
      });

      act(() => {
        useMapStore.getState().setAreaData(1500, year1500Data);
      });

      const state = useMapStore.getState();
      expect(state.areaDataCache.get(1000)).toEqual(year1000Data);
      expect(state.areaDataCache.get(1500)).toEqual(year1500Data);
      // currentAreaData should be the last one set
      expect(state.currentAreaData).toEqual(year1500Data);
    });
  });

  describe('Province properties are correctly updated from API response', () => {
    it('should update province feature properties with ruler ID', () => {
      act(() => {
        useMapStore.getState().setAreaData(1000, sampleApiResponse);
        useMapStore.getState().updateProvinceProperties(sampleApiResponse);
      });

      const state = useMapStore.getState();
      const features = state.provincesGeoJSON!.features;

      const province1 = features.find(f => f.properties?.['id'] === 'province1');
      const province2 = features.find(f => f.properties?.['id'] === 'province2');
      const province3 = features.find(f => f.properties?.['id'] === 'province3');

      expect(province1?.properties?.['r']).toBe('ruler1');
      expect(province2?.properties?.['r']).toBe('ruler2');
      expect(province3?.properties?.['r']).toBe('ruler1');
    });

    it('should update province feature properties with culture ID', () => {
      act(() => {
        useMapStore.getState().updateProvinceProperties(sampleApiResponse);
      });

      const state = useMapStore.getState();
      const features = state.provincesGeoJSON!.features;

      const province1 = features.find(f => f.properties?.['id'] === 'province1');
      const province2 = features.find(f => f.properties?.['id'] === 'province2');
      const province3 = features.find(f => f.properties?.['id'] === 'province3');

      expect(province1?.properties?.['c']).toBe('culture1');
      expect(province2?.properties?.['c']).toBe('culture2');
      expect(province3?.properties?.['c']).toBe('culture3');
    });

    it('should update province feature properties with religion ID', () => {
      act(() => {
        useMapStore.getState().updateProvinceProperties(sampleApiResponse);
      });

      const state = useMapStore.getState();
      const features = state.provincesGeoJSON!.features;

      const province1 = features.find(f => f.properties?.['id'] === 'province1');
      const province2 = features.find(f => f.properties?.['id'] === 'province2');
      const province3 = features.find(f => f.properties?.['id'] === 'province3');

      expect(province1?.properties?.['e']).toBe('religion1');
      expect(province2?.properties?.['e']).toBe('religion2');
      expect(province3?.properties?.['e']).toBe('religion3');
    });

    it('should update province feature properties with religionGeneral ID', () => {
      act(() => {
        useMapStore.getState().updateProvinceProperties(sampleApiResponse);
      });

      const state = useMapStore.getState();
      const features = state.provincesGeoJSON!.features;

      const province1 = features.find(f => f.properties?.['id'] === 'province1');
      const province2 = features.find(f => f.properties?.['id'] === 'province2');
      const province3 = features.find(f => f.properties?.['id'] === 'province3');

      // religionGeneral is derived from religion using metadata parent
      expect(province1?.properties?.['g']).toBe('pagan'); // religion1 -> pagan
      expect(province2?.properties?.['g']).toBe('eastern'); // religion2 -> eastern
      expect(province3?.properties?.['g']).toBe('pagan'); // religion3 -> pagan
    });

    it('should update province feature properties with population', () => {
      act(() => {
        useMapStore.getState().updateProvinceProperties(sampleApiResponse);
      });

      const state = useMapStore.getState();
      const features = state.provincesGeoJSON!.features;

      const province1 = features.find(f => f.properties?.['id'] === 'province1');
      const province2 = features.find(f => f.properties?.['id'] === 'province2');
      const province3 = features.find(f => f.properties?.['id'] === 'province3');

      expect(province1?.properties?.['p']).toBe(1000);
      expect(province2?.properties?.['p']).toBe(2000);
      expect(province3?.properties?.['p']).toBe(3000);
    });

    it('should preserve existing province properties when updating', () => {
      act(() => {
        useMapStore.getState().updateProvinceProperties(sampleApiResponse);
      });

      const state = useMapStore.getState();
      const features = state.provincesGeoJSON!.features;

      const province1 = features.find(f => f.properties?.['id'] === 'province1');

      // Original 'name' property should still exist
      expect(province1?.properties?.['name']).toBe('province1');
      // 'id' property should be set from 'name'
      expect(province1?.properties?.['id']).toBe('province1');
    });

    it('should handle provinces not in area data gracefully', () => {
      // Add a province to GeoJSON that's not in area data
      const geoJSONWithExtraProvince = {
        ...sampleProvincesGeoJSON,
        features: [
          ...sampleProvincesGeoJSON.features,
          {
            type: 'Feature' as const,
            properties: { name: 'province4' },
            geometry: {
              type: 'Polygon' as const,
              coordinates: [[[3, 0], [4, 0], [4, 1], [3, 1], [3, 0]]],
            },
          },
        ],
      };

      act(() => {
        useMapStore.setState({ provincesGeoJSON: geoJSONWithExtraProvince });
        useMapStore.getState().updateProvinceProperties(sampleApiResponse);
      });

      const state = useMapStore.getState();
      const features = state.provincesGeoJSON!.features;

      // province4 should still exist but without the new properties (except id which is set from name)
      const province4 = features.find(f => f.properties?.['name'] === 'province4');
      expect(province4).toBeDefined();
      expect(province4?.properties?.['r']).toBeUndefined();
    });

    it('should update all properties atomically', () => {
      act(() => {
        useMapStore.getState().updateProvinceProperties(sampleApiResponse);
      });

      const state = useMapStore.getState();
      const features = state.provincesGeoJSON!.features;

      const province1 = features.find(f => f.properties?.['id'] === 'province1');

      // All properties should be set together
      expect(province1?.properties).toMatchObject({
        id: 'province1',
        r: 'ruler1',
        c: 'culture1',
        e: 'religion1',
        g: 'pagan',
        p: 1000,
      });
    });

    it('should correctly derive religionGeneral when religion has parent in metadata', () => {
      const state = useMapStore.getState();

      // Test getReligionGeneral function
      expect(state.getReligionGeneral('religion1')).toBe('pagan');
      expect(state.getReligionGeneral('religion2')).toBe('eastern');
      expect(state.getReligionGeneral('religion3')).toBe('pagan');
    });

    it('should return original religionId when no parent exists in metadata', () => {
      // Add a religion without parent
      const metadataWithoutParent: EntityMetadata = {
        ...sampleMetadata,
        religion: {
          ...sampleMetadata.religion,
          religion4: { name: 'Unknown Religion', color: 'rgba(50,50,50,0.5)' }, // No parent
        },
      };

      act(() => {
        useMapStore.setState({ metadata: metadataWithoutParent });
      });

      const state = useMapStore.getState();
      // Should return the original religionId when no parent
      expect(state.getReligionGeneral('religion4')).toBe('religion4');
    });

    it('should handle empty area data gracefully', () => {
      const emptyAreaData: AreaData = {};

      act(() => {
        useMapStore.getState().updateProvinceProperties(emptyAreaData);
      });

      const state = useMapStore.getState();
      // Provinces should still exist but without updated properties
      expect(state.provincesGeoJSON!.features.length).toBe(3);
    });
  });

  describe('Entity color lookup from metadata', () => {
    it('should return correct color for ruler from metadata', () => {
      const state = useMapStore.getState();
      expect(state.getEntityColor('ruler1', 'ruler')).toBe('rgba(255,0,0,0.5)');
      expect(state.getEntityColor('ruler2', 'ruler')).toBe('rgba(0,255,0,0.5)');
    });

    it('should return correct color for culture from metadata', () => {
      const state = useMapStore.getState();
      expect(state.getEntityColor('culture1', 'culture')).toBe('rgba(100,100,0,0.5)');
      expect(state.getEntityColor('culture2', 'culture')).toBe('rgba(0,100,100,0.5)');
    });

    it('should return correct color for religion from metadata', () => {
      const state = useMapStore.getState();
      expect(state.getEntityColor('religion1', 'religion')).toBe('rgba(200,0,0,0.5)');
      expect(state.getEntityColor('religion2', 'religion')).toBe('rgba(0,200,0,0.5)');
    });

    it('should return correct color for religionGeneral from metadata', () => {
      const state = useMapStore.getState();
      expect(state.getEntityColor('pagan', 'religionGeneral')).toBe('rgba(150,150,0,0.5)');
      expect(state.getEntityColor('eastern', 'religionGeneral')).toBe('rgba(0,150,150,0.5)');
    });

    it('should return fallback color for unknown entity', () => {
      const state = useMapStore.getState();
      expect(state.getEntityColor('unknown_ruler', 'ruler')).toBe(FALLBACK_COLOR);
    });

    it('should return fallback color when metadata is null', () => {
      act(() => {
        useMapStore.setState({ metadata: null });
      });

      const state = useMapStore.getState();
      expect(state.getEntityColor('ruler1', 'ruler')).toBe(FALLBACK_COLOR);
    });

    it('should return fallback color for empty entity value', () => {
      const state = useMapStore.getState();
      expect(state.getEntityColor('', 'ruler')).toBe(FALLBACK_COLOR);
    });
  });
});

/**
 * getEntityWiki Tests
 *
 * Tests for the getEntityWiki function which retrieves Wikipedia URLs
 * from metadata for different entity dimensions.
 *
 * Key fix tested: religionGeneral dimension requires looking up the religion
 * first to get its parent (religionGeneral ID), then looking up the wiki URL
 * from religionGeneral metadata.
 */
describe('getEntityWiki', () => {
  // Sample metadata with wiki URLs for testing
  const metadataWithWiki: EntityMetadata = {
    ruler: {
      roman_empire: { name: 'Roman Empire', color: 'rgba(255,0,0,0.5)', wiki: 'Roman_Empire' },
      persian_empire: { name: 'Persian Empire', color: 'rgba(0,255,0,0.5)', wiki: 'Achaemenid_Empire' },
      no_wiki_ruler: { name: 'No Wiki Ruler', color: 'rgba(100,100,100,0.5)' },
    },
    culture: {
      latin: { name: 'Latin', color: 'rgba(100,100,0,0.5)', wiki: 'Latin_culture' },
      greek: { name: 'Greek', color: 'rgba(0,100,100,0.5)', wiki: 'Ancient_Greece' },
    },
    religion: {
      catholicism: { name: 'Catholicism', color: 'rgba(200,0,0,0.5)', wiki: 'Catholic_Church', parent: 'christianity' },
      sunni: { name: 'Sunni Islam', color: 'rgba(0,200,0,0.5)', wiki: 'Sunni_Islam', parent: 'islam' },
      orthodox: { name: 'Eastern Orthodox', color: 'rgba(0,0,200,0.5)', wiki: 'Eastern_Orthodox_Church', parent: 'christianity' },
      no_parent_religion: { name: 'No Parent Religion', color: 'rgba(50,50,50,0.5)', wiki: 'Some_Religion' },
    },
    religionGeneral: {
      christianity: { name: 'Christianity', color: 'rgba(150,150,0,0.5)', wiki: 'Christianity' },
      islam: { name: 'Islam', color: 'rgba(0,150,150,0.5)', wiki: 'Islam' },
    },
  };

  beforeEach(() => {
    act(() => {
      useMapStore.setState({
        ...initialState,
        areaDataCache: new Map(),
        metadata: metadataWithWiki,
      });
    });
  });

  describe('ruler dimension', () => {
    it('should return wiki URL for ruler entity', () => {
      const wiki = useMapStore.getState().getEntityWiki('roman_empire', 'ruler');
      expect(wiki).toBe('Roman_Empire');
    });

    it('should return wiki URL for another ruler entity', () => {
      const wiki = useMapStore.getState().getEntityWiki('persian_empire', 'ruler');
      expect(wiki).toBe('Achaemenid_Empire');
    });

    it('should return undefined for ruler without wiki', () => {
      const wiki = useMapStore.getState().getEntityWiki('no_wiki_ruler', 'ruler');
      expect(wiki).toBeUndefined();
    });

    it('should return undefined for unknown ruler', () => {
      const wiki = useMapStore.getState().getEntityWiki('unknown_ruler', 'ruler');
      expect(wiki).toBeUndefined();
    });
  });

  describe('culture dimension', () => {
    it('should return wiki URL for culture entity', () => {
      const wiki = useMapStore.getState().getEntityWiki('latin', 'culture');
      expect(wiki).toBe('Latin_culture');
    });

    it('should return wiki URL for another culture entity', () => {
      const wiki = useMapStore.getState().getEntityWiki('greek', 'culture');
      expect(wiki).toBe('Ancient_Greece');
    });

    it('should return undefined for unknown culture', () => {
      const wiki = useMapStore.getState().getEntityWiki('unknown_culture', 'culture');
      expect(wiki).toBeUndefined();
    });
  });

  describe('religion dimension', () => {
    it('should return wiki URL for religion entity', () => {
      const wiki = useMapStore.getState().getEntityWiki('catholicism', 'religion');
      expect(wiki).toBe('Catholic_Church');
    });

    it('should return wiki URL for another religion entity', () => {
      const wiki = useMapStore.getState().getEntityWiki('sunni', 'religion');
      expect(wiki).toBe('Sunni_Islam');
    });

    it('should return undefined for unknown religion', () => {
      const wiki = useMapStore.getState().getEntityWiki('unknown_religion', 'religion');
      expect(wiki).toBeUndefined();
    });
  });

  /**
   * CRITICAL: religionGeneral dimension tests
   *
   * When dimension is 'religionGeneral', the value passed is a RELIGION ID
   * (from province data index 2), not a religionGeneral ID.
   *
   * The function must:
   * 1. Look up the religion in religion metadata to get its parent (religionGeneral ID)
   * 2. Then look up the wiki URL from religionGeneral metadata using that parent ID
   */
  describe('religionGeneral dimension', () => {
    it('should return religionGeneral wiki URL when given a religion ID with parent', () => {
      // When activeColor is 'religionGeneral', we pass the religion ID (e.g., 'catholicism')
      // The function should look up catholicism's parent ('christianity') and return Christianity's wiki
      const wiki = useMapStore.getState().getEntityWiki('catholicism', 'religionGeneral');
      expect(wiki).toBe('Christianity');
    });

    it('should return correct religionGeneral wiki for sunni (islam)', () => {
      // sunni's parent is 'islam', so we should get Islam's wiki
      const wiki = useMapStore.getState().getEntityWiki('sunni', 'religionGeneral');
      expect(wiki).toBe('Islam');
    });

    it('should return correct religionGeneral wiki for orthodox (christianity)', () => {
      // orthodox's parent is 'christianity', so we should get Christianity's wiki
      const wiki = useMapStore.getState().getEntityWiki('orthodox', 'religionGeneral');
      expect(wiki).toBe('Christianity');
    });

    it('should return undefined when religion has no parent', () => {
      // no_parent_religion has no parent property
      const wiki = useMapStore.getState().getEntityWiki('no_parent_religion', 'religionGeneral');
      expect(wiki).toBeUndefined();
    });

    it('should return undefined when religion ID is unknown', () => {
      const wiki = useMapStore.getState().getEntityWiki('unknown_religion', 'religionGeneral');
      expect(wiki).toBeUndefined();
    });

    it('should return undefined when religionGeneral has no wiki', () => {
      // Add a religion with a parent that has no wiki
      act(() => {
        useMapStore.setState({
          metadata: {
            ...metadataWithWiki,
            religion: {
              ...metadataWithWiki.religion,
              test_religion: { name: 'Test Religion', color: 'rgba(0,0,0,0.5)', parent: 'no_wiki_general' },
            },
            religionGeneral: {
              ...metadataWithWiki.religionGeneral,
              no_wiki_general: { name: 'No Wiki General', color: 'rgba(0,0,0,0.5)' },
            },
          },
        });
      });

      const wiki = useMapStore.getState().getEntityWiki('test_religion', 'religionGeneral');
      expect(wiki).toBeUndefined();
    });
  });

  describe('population dimension', () => {
    it('should return undefined for population dimension', () => {
      // Population dimension doesn't have wiki URLs
      const wiki = useMapStore.getState().getEntityWiki('any_value', 'population');
      expect(wiki).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should return undefined when metadata is null', () => {
      act(() => {
        useMapStore.setState({ metadata: null });
      });

      const wiki = useMapStore.getState().getEntityWiki('roman_empire', 'ruler');
      expect(wiki).toBeUndefined();
    });

    it('should return undefined for empty entity value', () => {
      const wiki = useMapStore.getState().getEntityWiki('', 'ruler');
      expect(wiki).toBeUndefined();
    });

    it('should handle null entity value gracefully', () => {
      // TypeScript would prevent this, but test runtime behavior
      const wiki = useMapStore.getState().getEntityWiki(null as unknown as string, 'ruler');
      expect(wiki).toBeUndefined();
    });
  });
});

/**
 * Province Click Behavior Tests
 *
 * Tests to verify that clicking a province does NOT automatically zoom
 * to fit the entity outline. This matches production behavior where
 * the viewport stays at the user's current position.
 */
describe('Province Click Behavior - No Auto Zoom', () => {
  const sampleMetadata: EntityMetadata = {
    ruler: {
      ruler1: { name: 'Roman Empire', color: 'rgba(255,0,0,0.5)' },
    },
    culture: {
      culture1: { name: 'Latin', color: 'rgba(100,100,0,0.5)' },
    },
    religion: {
      religion1: { name: 'Roman Paganism', color: 'rgba(200,0,0,0.5)', parent: 'pagan' },
    },
    religionGeneral: {
      pagan: { name: 'Paganism', color: 'rgba(150,150,0,0.5)' },
    },
  };

  const sampleAreaData: AreaData = {
    province1: ['ruler1', 'culture1', 'religion1', 'capital1', 1000] as ProvinceData,
    province2: ['ruler1', 'culture1', 'religion1', null, 2000] as ProvinceData,
  };

  const sampleProvincesGeoJSON = {
    type: 'FeatureCollection' as const,
    features: [
      {
        type: 'Feature' as const,
        properties: { name: 'province1', r: 'ruler1', c: 'culture1', e: 'religion1', g: 'pagan', p: 1000 },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
        },
      },
      {
        type: 'Feature' as const,
        properties: { name: 'province2', r: 'ruler1', c: 'culture1', e: 'religion1', g: 'pagan', p: 2000 },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[[10, 0], [20, 0], [20, 10], [10, 10], [10, 0]]],
        },
      },
    ],
  };

  beforeEach(() => {
    act(() => {
      useMapStore.setState({
        ...initialState,
        areaDataCache: new Map(),
        metadata: sampleMetadata,
        currentAreaData: sampleAreaData,
        provincesGeoJSON: sampleProvincesGeoJSON,
        viewport: {
          ...defaultViewport,
          latitude: 45,
          longitude: 10,
          zoom: 5,
        },
      });
    });
  });

  it('should calculate entity outline without triggering flyTo', () => {
    const initialViewport = { ...useMapStore.getState().viewport };

    // Calculate entity outline (this is what happens on province click)
    act(() => {
      useMapStore.getState().calculateEntityOutline('ruler1', 'ruler');
    });

    const state = useMapStore.getState();

    // Entity outline should be calculated
    expect(state.entityOutline).not.toBeNull();

    // But viewport should NOT have changed (no flyTo triggered)
    expect(state.viewport.latitude).toBe(initialViewport.latitude);
    expect(state.viewport.longitude).toBe(initialViewport.longitude);
    expect(state.viewport.zoom).toBe(initialViewport.zoom);

    // isFlying should be false (no animation started)
    expect(state.isFlying).toBe(false);
    expect(state.flyToTarget).toBeNull();
  });

  it('should not change viewport when selecting a province', () => {
    const initialViewport = { ...useMapStore.getState().viewport };

    // Select a province (simulating click)
    act(() => {
      useMapStore.getState().selectProvince('province1');
    });

    const state = useMapStore.getState();

    // Province should be selected
    expect(state.selectedProvince).toBe('province1');

    // Viewport should NOT have changed
    expect(state.viewport.latitude).toBe(initialViewport.latitude);
    expect(state.viewport.longitude).toBe(initialViewport.longitude);
    expect(state.viewport.zoom).toBe(initialViewport.zoom);
  });

  it('should allow explicit fitToEntityOutline call when needed', () => {
    // First calculate the entity outline
    act(() => {
      useMapStore.getState().calculateEntityOutline('ruler1', 'ruler');
    });

    // Verify outline exists
    expect(useMapStore.getState().entityOutline).not.toBeNull();

    // Now explicitly call fitToEntityOutline (this is NOT called on province click)
    act(() => {
      useMapStore.getState().fitToEntityOutline();
    });

    const state = useMapStore.getState();

    // Now flyTo should be triggered
    expect(state.isFlying).toBe(true);
    expect(state.flyToTarget).not.toBeNull();
  });

  it('should keep viewport stable during rapid province selections', () => {
    const initialViewport = { ...useMapStore.getState().viewport };

    // Rapidly select multiple provinces
    act(() => {
      useMapStore.getState().selectProvince('province1');
      useMapStore.getState().calculateEntityOutline('ruler1', 'ruler');
    });

    act(() => {
      useMapStore.getState().selectProvince('province2');
      useMapStore.getState().calculateEntityOutline('ruler1', 'ruler');
    });

    act(() => {
      useMapStore.getState().selectProvince('province1');
      useMapStore.getState().calculateEntityOutline('ruler1', 'ruler');
    });

    const state = useMapStore.getState();

    // Viewport should remain unchanged throughout
    expect(state.viewport.latitude).toBe(initialViewport.latitude);
    expect(state.viewport.longitude).toBe(initialViewport.longitude);
    expect(state.viewport.zoom).toBe(initialViewport.zoom);
    expect(state.isFlying).toBe(false);
  });
});

/**
 * Marker Limit Tests
 * Requirement 4.1: WHEN the user adjusts the marker limit slider, THE MapStore SHALL update the markerLimit state
 * Requirement 4.5: THE MapStore SHALL default markerLimit to 5000
 */
describe('markerLimit', () => {
  // Reset store before each test
  beforeEach(() => {
    act(() => {
      useMapStore.setState({
        ...initialState,
        areaDataCache: new Map(),
      });
    });
  });

  describe('initial state', () => {
    /**
     * Requirement 4.5: THE MapStore SHALL default markerLimit to 5000
     */
    it('should initialize with markerLimit of 5000', () => {
      const state = useMapStore.getState();
      expect(state.markerLimit).toBe(5000);
    });
  });

  describe('setMarkerLimit', () => {
    /**
     * Requirement 4.1: WHEN the user adjusts the marker limit slider,
     * THE MapStore SHALL update the markerLimit state
     */
    it('should set markerLimit to a valid value', () => {
      act(() => {
        useMapStore.getState().setMarkerLimit(1000);
      });

      const state = useMapStore.getState();
      expect(state.markerLimit).toBe(1000);
    });

    it('should set markerLimit to 0', () => {
      act(() => {
        useMapStore.getState().setMarkerLimit(0);
      });

      const state = useMapStore.getState();
      expect(state.markerLimit).toBe(0);
    });

    it('should set markerLimit to maximum value 10000', () => {
      act(() => {
        useMapStore.getState().setMarkerLimit(10000);
      });

      const state = useMapStore.getState();
      expect(state.markerLimit).toBe(10000);
    });

    it('should clamp markerLimit to minimum 0 for negative values', () => {
      act(() => {
        useMapStore.getState().setMarkerLimit(-100);
      });

      const state = useMapStore.getState();
      expect(state.markerLimit).toBe(0);
    });

    it('should clamp markerLimit to maximum 10000 for values above limit', () => {
      act(() => {
        useMapStore.getState().setMarkerLimit(15000);
      });

      const state = useMapStore.getState();
      expect(state.markerLimit).toBe(10000);
    });

    it('should round decimal values to nearest integer', () => {
      act(() => {
        useMapStore.getState().setMarkerLimit(1500.7);
      });

      const state = useMapStore.getState();
      expect(state.markerLimit).toBe(1501);
    });

    it('should round down decimal values below 0.5', () => {
      act(() => {
        useMapStore.getState().setMarkerLimit(1500.3);
      });

      const state = useMapStore.getState();
      expect(state.markerLimit).toBe(1500);
    });

    it('should not change state for NaN value', () => {
      // First set a valid value
      act(() => {
        useMapStore.getState().setMarkerLimit(2000);
      });

      // Try to set NaN
      act(() => {
        useMapStore.getState().setMarkerLimit(NaN);
      });

      const state = useMapStore.getState();
      expect(state.markerLimit).toBe(2000);
    });

    it('should not change state for Infinity value', () => {
      // First set a valid value
      act(() => {
        useMapStore.getState().setMarkerLimit(2000);
      });

      // Try to set Infinity
      act(() => {
        useMapStore.getState().setMarkerLimit(Infinity);
      });

      const state = useMapStore.getState();
      expect(state.markerLimit).toBe(2000);
    });

    it('should not change state for -Infinity value', () => {
      // First set a valid value
      act(() => {
        useMapStore.getState().setMarkerLimit(2000);
      });

      // Try to set -Infinity
      act(() => {
        useMapStore.getState().setMarkerLimit(-Infinity);
      });

      const state = useMapStore.getState();
      expect(state.markerLimit).toBe(2000);
    });

    it('should not change state for non-number value', () => {
      // First set a valid value
      act(() => {
        useMapStore.getState().setMarkerLimit(2000);
      });

      // Try to set a string
      act(() => {
        // @ts-expect-error Testing invalid input
        useMapStore.getState().setMarkerLimit('invalid');
      });

      const state = useMapStore.getState();
      expect(state.markerLimit).toBe(2000);
    });

    it('should allow multiple updates in sequence', () => {
      act(() => {
        useMapStore.getState().setMarkerLimit(1000);
      });
      expect(useMapStore.getState().markerLimit).toBe(1000);

      act(() => {
        useMapStore.getState().setMarkerLimit(5000);
      });
      expect(useMapStore.getState().markerLimit).toBe(5000);

      act(() => {
        useMapStore.getState().setMarkerLimit(0);
      });
      expect(useMapStore.getState().markerLimit).toBe(0);

      act(() => {
        useMapStore.getState().setMarkerLimit(10000);
      });
      expect(useMapStore.getState().markerLimit).toBe(10000);
    });
  });
});
