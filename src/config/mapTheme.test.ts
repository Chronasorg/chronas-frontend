/**
 * Map Theme Configuration Unit Tests
 *
 * Tests for theme configurations and font mappings.
 */

import { describe, it, expect } from 'vitest';
import {
  themes,
  getThemeConfig,
  getThemeForeColor,
  getThemeBackColor,
  getThemeHighlightColor,
  languageToFont,
  DEFAULT_FONT,
  getFontForLocale,
  getIconAtlasUrl,
  getClusterIconAtlasUrl,
  THEME_NAMES,
  isValidThemeName,
} from './mapTheme';

describe('mapTheme', () => {
  describe('themes object', () => {
    it('should have light theme configuration', () => {
      expect(themes.light).toBeDefined();
      expect(themes.light.foreColors).toHaveLength(3);
      expect(themes.light.backColors).toHaveLength(3);
      expect(themes.light.borderColors).toHaveLength(1);
      expect(themes.light.highlightColors).toHaveLength(1);
      expect(themes.light.gradientColors).toHaveLength(1);
      expect(themes.light.className).toBe('lightTheme');
    });

    it('should have dark theme configuration', () => {
      expect(themes.dark).toBeDefined();
      expect(themes.dark.foreColors).toHaveLength(3);
      expect(themes.dark.backColors).toHaveLength(3);
      expect(themes.dark.className).toBe('darkTheme');
    });

    it('should have luther theme configuration', () => {
      expect(themes.luther).toBeDefined();
      expect(themes.luther.foreColors).toHaveLength(3);
      expect(themes.luther.backColors).toHaveLength(3);
      expect(themes.luther.className).toBe('lutherTheme');
    });

    it('should have correct light theme colors', () => {
      expect(themes.light.foreColors[0]).toBe('#6a6a6a');
      expect(themes.light.backColors[0]).toBe('#ffffff');
      expect(themes.light.highlightColors[0]).toBe('rgb(173, 135, 27)');
    });

    it('should have correct dark theme colors', () => {
      expect(themes.dark.foreColors[0]).toBe('#F2F2F2');
      expect(themes.dark.backColors[0]).toBe('#333');
    });

    it('should have correct luther theme colors', () => {
      expect(themes.luther.foreColors[0]).toBe('#fff3d3');
      expect(themes.luther.backColors[0]).toBe('#011c31');
    });
  });

  describe('getThemeConfig', () => {
    it('should return light theme config', () => {
      const config = getThemeConfig('light');
      expect(config).toBe(themes.light);
    });

    it('should return dark theme config', () => {
      const config = getThemeConfig('dark');
      expect(config).toBe(themes.dark);
    });

    it('should return luther theme config', () => {
      const config = getThemeConfig('luther');
      expect(config).toBe(themes.luther);
    });
  });

  describe('getThemeForeColor', () => {
    it('should return primary foreground color for light theme', () => {
      expect(getThemeForeColor('light')).toBe('#6a6a6a');
    });

    it('should return primary foreground color for dark theme', () => {
      expect(getThemeForeColor('dark')).toBe('#F2F2F2');
    });

    it('should return primary foreground color for luther theme', () => {
      expect(getThemeForeColor('luther')).toBe('#fff3d3');
    });
  });

  describe('getThemeBackColor', () => {
    it('should return primary background color for light theme', () => {
      expect(getThemeBackColor('light')).toBe('#ffffff');
    });

    it('should return primary background color for dark theme', () => {
      expect(getThemeBackColor('dark')).toBe('#333');
    });

    it('should return primary background color for luther theme', () => {
      expect(getThemeBackColor('luther')).toBe('#011c31');
    });
  });

  describe('getThemeHighlightColor', () => {
    it('should return highlight color for light theme', () => {
      expect(getThemeHighlightColor('light')).toBe('rgb(173, 135, 27)');
    });

    it('should return highlight color for dark theme', () => {
      expect(getThemeHighlightColor('dark')).toBe('rgba(173, 135, 27)');
    });

    it('should return highlight color for luther theme', () => {
      expect(getThemeHighlightColor('luther')).toBe('rgba(69,28,46,200)');
    });
  });

  describe('languageToFont', () => {
    it('should map Western languages to Cinzel Regular', () => {
      expect(languageToFont['en']).toBe('Cinzel Regular');
      expect(languageToFont['de']).toBe('Cinzel Regular');
      expect(languageToFont['fr']).toBe('Cinzel Regular');
      expect(languageToFont['es']).toBe('Cinzel Regular');
    });

    it('should map Chinese to Noto Sans SC', () => {
      expect(languageToFont['zh']).toBe('Noto Sans SC');
    });

    it('should map Arabic to Cairo', () => {
      expect(languageToFont['ar']).toBe('Cairo');
    });

    it('should map Russian to Noto Sans', () => {
      expect(languageToFont['ru']).toBe('Noto Sans');
    });
  });

  describe('getFontForLocale', () => {
    it('should return Cinzel Regular for English', () => {
      expect(getFontForLocale('en')).toBe('Cinzel Regular');
    });

    it('should return Cinzel Regular for English with region', () => {
      expect(getFontForLocale('en-US')).toBe('Cinzel Regular');
      expect(getFontForLocale('en-GB')).toBe('Cinzel Regular');
    });

    it('should return Noto Sans SC for Chinese', () => {
      expect(getFontForLocale('zh')).toBe('Noto Sans SC');
      expect(getFontForLocale('zh-CN')).toBe('Noto Sans SC');
    });

    it('should return Cairo for Arabic', () => {
      expect(getFontForLocale('ar')).toBe('Cairo');
    });

    it('should return default font for unknown locale', () => {
      expect(getFontForLocale('xx')).toBe(DEFAULT_FONT);
      expect(getFontForLocale('unknown')).toBe(DEFAULT_FONT);
    });

    it('should handle uppercase locale codes', () => {
      expect(getFontForLocale('EN')).toBe('Cinzel Regular');
      expect(getFontForLocale('EN-US')).toBe('Cinzel Regular');
    });
  });

  describe('getIconAtlasUrl', () => {
    it('should return themed atlas URL', () => {
      expect(getIconAtlasUrl('themed')).toBe('/images/themed-atlas.png');
    });

    it('should return abstract atlas URL', () => {
      expect(getIconAtlasUrl('abstract')).toBe('/images/abstract-atlas.png');
    });

    it('should return painted themed atlas URL', () => {
      expect(getIconAtlasUrl('themed', true)).toBe('/images/themed-painted-atlas.png');
    });

    it('should return painted abstract atlas URL', () => {
      expect(getIconAtlasUrl('abstract', true)).toBe('/images/abstract-painted-atlas.png');
    });
  });

  describe('getClusterIconAtlasUrl', () => {
    it('should return themed cluster atlas URL', () => {
      expect(getClusterIconAtlasUrl('themed')).toBe('/images/themed-cluster-atlas.png');
    });

    it('should return abstract cluster atlas URL', () => {
      expect(getClusterIconAtlasUrl('abstract')).toBe('/images/abstract-cluster-atlas.png');
    });

    it('should return painted themed cluster atlas URL', () => {
      expect(getClusterIconAtlasUrl('themed', true)).toBe('/images/themed-painted-cluster-atlas.png');
    });
  });

  describe('THEME_NAMES', () => {
    it('should contain all three themes', () => {
      expect(THEME_NAMES).toContain('light');
      expect(THEME_NAMES).toContain('dark');
      expect(THEME_NAMES).toContain('luther');
      expect(THEME_NAMES).toHaveLength(3);
    });
  });

  describe('isValidThemeName', () => {
    it('should return true for valid theme names', () => {
      expect(isValidThemeName('light')).toBe(true);
      expect(isValidThemeName('dark')).toBe(true);
      expect(isValidThemeName('luther')).toBe(true);
    });

    it('should return false for invalid theme names', () => {
      expect(isValidThemeName('invalid')).toBe(false);
      expect(isValidThemeName('')).toBe(false);
      expect(isValidThemeName('LIGHT')).toBe(false);
    });
  });
});
