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
  AREA_LABEL_CONFIG,
  getAreaLabelFonts,
  LOCAL_FONT_NAMES,
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

  describe('AREA_LABEL_CONFIG', () => {
    describe('lineLayout', () => {
      it('should use line-center symbol placement', () => {
        expect(AREA_LABEL_CONFIG.lineLayout.symbolPlacement).toBe('line-center');
      });

      it('should use uppercase text transform', () => {
        expect(AREA_LABEL_CONFIG.lineLayout.textTransform).toBe('uppercase');
      });

      it('should not allow text overlap', () => {
        expect(AREA_LABEL_CONFIG.lineLayout.textAllowOverlap).toBe(false);
      });

      it('should have letter spacing for cartographic feel', () => {
        expect(AREA_LABEL_CONFIG.lineLayout.textLetterSpacing).toBeGreaterThan(0);
        expect(AREA_LABEL_CONFIG.lineLayout.textLetterSpacing).toBe(0.18);
      });

      it('should limit text bending angle', () => {
        expect(AREA_LABEL_CONFIG.lineLayout.textMaxAngle).toBeLessThanOrEqual(45);
        expect(AREA_LABEL_CONFIG.lineLayout.textMaxAngle).toBe(25);
      });

      it('should have collision padding', () => {
        expect(AREA_LABEL_CONFIG.lineLayout.textPadding).toBeGreaterThan(0);
      });

      it('should have a zoom-interpolated textSize expression with 4 zoom stops', () => {
        const expr = AREA_LABEL_CONFIG.lineLayout.textSize;
        expect(Array.isArray(expr)).toBe(true);
        expect(expr[0]).toBe('interpolate');
        // 4 zoom stops: zoom values at indices 3, 5, 7, 9
        expect(expr[3]).toBe(2);
        expect(expr[5]).toBe(4);
        expect(expr[7]).toBe(7);
        expect(expr[9]).toBe(9);
      });
    });

    describe('linePaint', () => {
      it('should use warm dark brown text color instead of harsh black', () => {
        expect(AREA_LABEL_CONFIG.linePaint.textColor).toBe('#1a1206');
      });

      it('should have a strong halo width for readability over colorful polygons', () => {
        expect(AREA_LABEL_CONFIG.linePaint.textHaloWidth).toBe(3);
      });

      it('should have sharp halo for maximum contrast', () => {
        expect(AREA_LABEL_CONFIG.linePaint.textHaloBlur).toBe(0);
      });

      it('should use a warm parchment halo color', () => {
        expect(AREA_LABEL_CONFIG.linePaint.textHaloColor).toMatch(/^rgba\(/);
      });
    });

    describe('pointLayout', () => {
      it('should have letter spacing for atlas-style text', () => {
        expect(AREA_LABEL_CONFIG.pointLayout.textLetterSpacing).toBe(0.2);
      });

      it('should not allow text overlap', () => {
        expect(AREA_LABEL_CONFIG.pointLayout.textAllowOverlap).toBe(false);
      });

      it('should set text as optional for collision handling', () => {
        expect(AREA_LABEL_CONFIG.pointLayout.textOptional).toBe(true);
      });

      it('should have a zoom-interpolated textSize expression', () => {
        const expr = AREA_LABEL_CONFIG.pointLayout.textSize;
        expect(Array.isArray(expr)).toBe(true);
        expect(expr[0]).toBe('interpolate');
      });
    });

    describe('pointPaint', () => {
      it('should match line paint colors for visual consistency', () => {
        expect(AREA_LABEL_CONFIG.pointPaint.textColor).toBe(
          AREA_LABEL_CONFIG.linePaint.textColor
        );
        expect(AREA_LABEL_CONFIG.pointPaint.textHaloColor).toBe(
          AREA_LABEL_CONFIG.linePaint.textHaloColor
        );
      });

      it('should match line paint halo width', () => {
        expect(AREA_LABEL_CONFIG.pointPaint.textHaloWidth).toBe(
          AREA_LABEL_CONFIG.linePaint.textHaloWidth
        );
      });
    });

    describe('opacity transitions', () => {
      it('should have line text opacity fade-in expression', () => {
        const expr = AREA_LABEL_CONFIG.lineTextOpacity;
        expect(Array.isArray(expr)).toBe(true);
        expect(expr[0]).toBe('interpolate');
        // Should start at 0 opacity and reach 1
        expect(expr[4]).toBe(0);
        expect(expr[6]).toBe(1);
      });

      it('should have point text opacity fade-in expression', () => {
        const expr = AREA_LABEL_CONFIG.pointTextOpacity;
        expect(Array.isArray(expr)).toBe(true);
        expect(expr[0]).toBe('interpolate');
      });
    });

    describe('bezierOptions', () => {
      it('should have sharpness and resolution settings', () => {
        expect(AREA_LABEL_CONFIG.bezierOptions.sharpness).toBe(1);
        expect(AREA_LABEL_CONFIG.bezierOptions.resolution).toBe(10000);
      });
    });

    describe('fallbackFonts', () => {
      it('should have Arial Unicode MS Regular as fallback', () => {
        expect(AREA_LABEL_CONFIG.fallbackFonts).toContain('Arial Unicode MS Regular');
      });
    });
  });

  describe('getAreaLabelFonts', () => {
    it('should return Cinzel Regular as primary for English', () => {
      const fonts = getAreaLabelFonts('en');
      expect(fonts[0]).toBe('Cinzel Regular');
      expect(fonts[1]).toBe('Arial Unicode MS Regular');
    });

    it('should return Noto Sans SC as primary for Chinese', () => {
      const fonts = getAreaLabelFonts('zh');
      expect(fonts[0]).toBe('Noto Sans SC');
    });

    it('should return Cairo as primary for Arabic', () => {
      const fonts = getAreaLabelFonts('ar');
      expect(fonts[0]).toBe('Cairo');
    });

    it('should always return a 2-element tuple', () => {
      const fonts = getAreaLabelFonts('en');
      expect(fonts).toHaveLength(2);
    });
  });

  describe('LOCAL_FONT_NAMES', () => {
    it('should include Cinzel Regular', () => {
      expect(LOCAL_FONT_NAMES.has('Cinzel Regular')).toBe(true);
    });

    it('should include Cairo', () => {
      expect(LOCAL_FONT_NAMES.has('Cairo')).toBe(true);
    });

    it('should include Noto Sans SC', () => {
      expect(LOCAL_FONT_NAMES.has('Noto Sans SC')).toBe(true);
    });

    it('should not include fonts served by Mapbox CDN', () => {
      expect(LOCAL_FONT_NAMES.has('Arial Unicode MS Regular')).toBe(false);
    });
  });
});
