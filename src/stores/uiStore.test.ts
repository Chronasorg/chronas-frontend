/**
 * UI Store Tests
 *
 * Unit tests for the UI preferences store with localStorage persistence.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUIStore, UI_STORAGE_KEY, isValidTheme, isValidLocale, defaultState, type Theme } from './uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
    
    // Reset the store to default state
    useUIStore.setState({
      ...defaultState,
    });
  });

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useUIStore.getState();
      
      expect(state.theme).toBe('light');
      expect(state.locale).toBe('en');
      expect(state.sidebarOpen).toBe(true);
      expect(state.isFullscreen).toBe(false);
    });
  });

  describe('setTheme', () => {
    it('should set theme to light', () => {
      const { setTheme } = useUIStore.getState();
      
      setTheme('light');
      
      expect(useUIStore.getState().theme).toBe('light');
    });

    it('should set theme to dark', () => {
      const { setTheme } = useUIStore.getState();
      
      setTheme('dark');
      
      expect(useUIStore.getState().theme).toBe('dark');
    });

    it('should set theme to luther', () => {
      const { setTheme } = useUIStore.getState();
      
      setTheme('luther');
      
      expect(useUIStore.getState().theme).toBe('luther');
    });

    it('should ignore invalid theme values', () => {
      const { setTheme } = useUIStore.getState();
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      
      // Set a valid theme first
      setTheme('dark');
      expect(useUIStore.getState().theme).toBe('dark');
      
      // Try to set an invalid theme
      setTheme('invalid' as Theme);
      
      // Theme should remain unchanged
      expect(useUIStore.getState().theme).toBe('dark');
      expect(consoleSpy).toHaveBeenCalledWith('Invalid theme value: invalid, ignoring');
      
      consoleSpy.mockRestore();
    });
  });

  describe('setLocale', () => {
    it('should set locale to a valid value', () => {
      const { setLocale } = useUIStore.getState();
      
      setLocale('de');
      
      expect(useUIStore.getState().locale).toBe('de');
    });

    it('should set locale to various language codes', () => {
      const { setLocale } = useUIStore.getState();
      const locales = ['en', 'de', 'fr', 'es', 'ru', 'zh', 'ar'];
      
      for (const locale of locales) {
        setLocale(locale);
        expect(useUIStore.getState().locale).toBe(locale);
      }
    });

    it('should ignore empty locale values', () => {
      const { setLocale } = useUIStore.getState();
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      
      // Set a valid locale first
      setLocale('de');
      expect(useUIStore.getState().locale).toBe('de');
      
      // Try to set an empty locale
      setLocale('');
      
      // Locale should remain unchanged
      expect(useUIStore.getState().locale).toBe('de');
      expect(consoleSpy).toHaveBeenCalledWith('Invalid locale value: , ignoring');
      
      consoleSpy.mockRestore();
    });
  });

  describe('toggleSidebar', () => {
    it('should toggle sidebar from open to closed', () => {
      const { toggleSidebar } = useUIStore.getState();
      
      // Default is open
      expect(useUIStore.getState().sidebarOpen).toBe(true);
      
      toggleSidebar();
      
      expect(useUIStore.getState().sidebarOpen).toBe(false);
    });

    it('should toggle sidebar from closed to open', () => {
      const { toggleSidebar, setSidebarOpen } = useUIStore.getState();
      
      // Set to closed first
      setSidebarOpen(false);
      expect(useUIStore.getState().sidebarOpen).toBe(false);
      
      toggleSidebar();
      
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });

    it('should toggle multiple times correctly', () => {
      const { toggleSidebar } = useUIStore.getState();
      
      expect(useUIStore.getState().sidebarOpen).toBe(true);
      
      toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(false);
      
      toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(true);
      
      toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(false);
    });
  });

  describe('setSidebarOpen', () => {
    it('should set sidebar to open', () => {
      const { setSidebarOpen } = useUIStore.getState();
      
      setSidebarOpen(false);
      expect(useUIStore.getState().sidebarOpen).toBe(false);
      
      setSidebarOpen(true);
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });

    it('should set sidebar to closed', () => {
      const { setSidebarOpen } = useUIStore.getState();
      
      setSidebarOpen(false);
      
      expect(useUIStore.getState().sidebarOpen).toBe(false);
    });
  });

  describe('setFullscreen', () => {
    it('should set fullscreen to true', () => {
      const { setFullscreen } = useUIStore.getState();
      
      setFullscreen(true);
      
      expect(useUIStore.getState().isFullscreen).toBe(true);
    });

    it('should set fullscreen to false', () => {
      const { setFullscreen } = useUIStore.getState();
      
      setFullscreen(true);
      expect(useUIStore.getState().isFullscreen).toBe(true);
      
      setFullscreen(false);
      expect(useUIStore.getState().isFullscreen).toBe(false);
    });
  });

  describe('resetToDefaults', () => {
    it('should reset all values to defaults', () => {
      const { setTheme, setLocale, setSidebarOpen, setFullscreen, resetToDefaults } = useUIStore.getState();
      
      // Change all values
      setTheme('dark');
      setLocale('de');
      setSidebarOpen(false);
      setFullscreen(true);
      
      // Verify changes
      let state = useUIStore.getState();
      expect(state.theme).toBe('dark');
      expect(state.locale).toBe('de');
      expect(state.sidebarOpen).toBe(false);
      expect(state.isFullscreen).toBe(true);
      
      // Reset to defaults
      resetToDefaults();
      
      // Verify defaults
      state = useUIStore.getState();
      expect(state.theme).toBe('light');
      expect(state.locale).toBe('en');
      expect(state.sidebarOpen).toBe(true);
      expect(state.isFullscreen).toBe(false);
    });
  });

  describe('localStorage persistence', () => {
    it('should have persist middleware configured', () => {
      // Verify the store has persist API
      const store = useUIStore;
      expect(store.persist).toBeDefined();
      expect(store.persist.getOptions).toBeDefined();
    });

    it('should use the correct storage key', () => {
      const options = useUIStore.persist.getOptions();
      expect(options.name).toBe(UI_STORAGE_KEY);
    });

    it('should only persist state properties, not actions', () => {
      const options = useUIStore.persist.getOptions();
      const partialize = options.partialize;
      
      if (partialize) {
        const state = useUIStore.getState();
        const persisted = partialize(state);
        
        // Should include state properties
        expect(persisted).toHaveProperty('theme');
        expect(persisted).toHaveProperty('locale');
        expect(persisted).toHaveProperty('sidebarOpen');
        expect(persisted).toHaveProperty('isFullscreen');
        
        // Should not include action functions
        expect(persisted).not.toHaveProperty('setTheme');
        expect(persisted).not.toHaveProperty('setLocale');
        expect(persisted).not.toHaveProperty('toggleSidebar');
        expect(persisted).not.toHaveProperty('setFullscreen');
      }
    });
  });

  describe('validation helpers', () => {
    describe('isValidTheme', () => {
      it('should return true for valid themes', () => {
        expect(isValidTheme('light')).toBe(true);
        expect(isValidTheme('dark')).toBe(true);
        expect(isValidTheme('luther')).toBe(true);
      });

      it('should return false for invalid themes', () => {
        expect(isValidTheme('invalid')).toBe(false);
        expect(isValidTheme('')).toBe(false);
        expect(isValidTheme(null)).toBe(false);
        expect(isValidTheme(undefined)).toBe(false);
        expect(isValidTheme(123)).toBe(false);
        expect(isValidTheme({})).toBe(false);
      });
    });

    describe('isValidLocale', () => {
      it('should return true for valid locales', () => {
        expect(isValidLocale('en')).toBe(true);
        expect(isValidLocale('de')).toBe(true);
        expect(isValidLocale('fr-FR')).toBe(true);
        expect(isValidLocale('zh-Hans')).toBe(true);
      });

      it('should return false for invalid locales', () => {
        expect(isValidLocale('')).toBe(false);
        expect(isValidLocale(null)).toBe(false);
        expect(isValidLocale(undefined)).toBe(false);
        expect(isValidLocale(123)).toBe(false);
        expect(isValidLocale({})).toBe(false);
      });
    });
  });

  describe('UI_STORAGE_KEY', () => {
    it('should be the expected value', () => {
      expect(UI_STORAGE_KEY).toBe('chs_ui_preferences');
    });
  });
});
