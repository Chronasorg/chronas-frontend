/**
 * Map Theme Configuration
 *
 * Theme configurations for the map component including colors,
 * fonts, and styling constants.
 *
 * Requirements: 6.3, 6.4, 6.5
 */

import type { Theme } from '../stores/uiStore';

/**
 * Theme configuration interface for map styling.
 * Requirement 6.3: THE MapView SHALL use theme-specific colors
 */
export interface ThemeConfig {
  /** Foreground colors [primary, secondary, tertiary] */
  foreColors: [string, string, string];
  /** Background colors [primary, secondary, tertiary] */
  backColors: [string, string, string];
  /** Border colors */
  borderColors: [string];
  /** Highlight colors for selections and hover */
  highlightColors: [string];
  /** Gradient colors for backgrounds */
  gradientColors: [string];
  /** CSS class name for the theme */
  className: string;
}

/**
 * Theme configurations for light, dark, and luther themes.
 * Requirement 6.4: THE MapView SHALL support light, dark, and luther themes
 * Requirement 6.5: THE MapView SHALL use exact color values for each theme
 */
export const themes: Record<Theme, ThemeConfig> = {
  light: {
    foreColors: ['#6a6a6a', '#494949', '#383B32'],
    backColors: ['#ffffff', '#F2F2F2', '#cbcbcb'],
    borderColors: ['rgba(200,200,200,100)'],
    highlightColors: ['rgb(173, 135, 27)'],
    gradientColors: ['linear-gradient(180deg,#fff 0,#F2F2F2)'],
    className: 'lightTheme',
  },
  dark: {
    foreColors: ['#F2F2F2', '#e2e2e2', '#cbcbcb'],
    backColors: ['#333', '#171717', '#000'],
    borderColors: ['rgba(200,200,200,100)'],
    highlightColors: ['rgba(173, 135, 27)'],
    gradientColors: ['linear-gradient(180deg,#333 0,#000)'],
    className: 'darkTheme',
  },
  luther: {
    foreColors: ['#fff3d3', '#e9caab', '#e9caab'],
    backColors: ['#011c31', '#451c2e', '#451c2e'],
    borderColors: ['rgba(200,200,200,100)'],
    highlightColors: ['rgba(69,28,46,200)'],
    gradientColors: ['linear-gradient(180deg,#011c31 0,#451c2e)'],
    className: 'lutherTheme',
  },
};

/**
 * Gets the theme configuration for a given theme.
 *
 * @param theme - The theme name
 * @returns The theme configuration
 */
export function getThemeConfig(theme: Theme): ThemeConfig {
  return themes[theme];
}

/**
 * Gets the primary foreground color for a theme.
 *
 * @param theme - The theme name
 * @returns The primary foreground color
 */
export function getThemeForeColor(theme: Theme): string {
  return themes[theme].foreColors[0];
}

/**
 * Gets the primary background color for a theme.
 *
 * @param theme - The theme name
 * @returns The primary background color
 */
export function getThemeBackColor(theme: Theme): string {
  return themes[theme].backColors[0];
}

/**
 * Gets the highlight color for a theme.
 *
 * @param theme - The theme name
 * @returns The highlight color
 */
export function getThemeHighlightColor(theme: Theme): string {
  return themes[theme].highlightColors[0];
}

/**
 * Language to font mapping for area labels.
 * Requirement 6.5: THE MapView SHALL use appropriate fonts for different locales
 *
 * Western locales use Cinzel Regular (serif font for historical feel)
 * Asian and other locales use Noto Sans variants for proper character support
 */
export const languageToFont: Record<string, string> = {
  // Western languages - Cinzel Regular
  en: 'Cinzel Regular',
  de: 'Cinzel Regular',
  fr: 'Cinzel Regular',
  es: 'Cinzel Regular',
  it: 'Cinzel Regular',
  pt: 'Cinzel Regular',
  nl: 'Cinzel Regular',
  pl: 'Cinzel Regular',
  sv: 'Cinzel Regular',
  el: 'Cinzel Regular',

  // Asian languages - Noto Sans variants
  zh: 'Noto Sans SC',
  ja: 'Noto Sans',
  ko: 'Noto Sans',
  vi: 'Noto Sans',
  hi: 'Noto Sans',

  // Arabic - Cairo font
  ar: 'Cairo',

  // Russian and Cyrillic - Noto Sans
  ru: 'Noto Sans',
};

/**
 * Default font for locales not in the mapping
 */
export const DEFAULT_FONT = 'Noto Sans';

/**
 * Gets the appropriate font for a locale.
 *
 * @param locale - The locale code (e.g., 'en', 'zh', 'ar')
 * @returns The font family name to use
 */
export function getFontForLocale(locale: string): string {
  // Extract the language code from locale (e.g., 'en-US' -> 'en')
  const parts = locale.split('-');
  const languageCode = (parts[0] ?? '').toLowerCase();
  return languageToFont[languageCode] ?? DEFAULT_FONT;
}

/**
 * Area label styling configuration.
 * Styled to match the classical atlas / historical cartography aesthetic of old Chronas,
 * while preserving the higher label density of the new version.
 *
 * The `d` property on each label feature is `lineDistance / name.length^0.2` (in km).
 * Text size uses a nested zoom × d interpolation with 4 zoom stops for smooth scaling:
 *   - zoom 2 (far):  only major empires (high d) are legible
 *   - zoom 4 (mid):  secondary labels become readable
 *   - zoom 7 (close): dense local labels fill in
 *   - zoom 9 (max):  full detail
 */
export const AREA_LABEL_CONFIG = {
  /** Mapbox layout properties for the bezier-curve line labels */
  lineLayout: {
    symbolPlacement: 'line-center' as const,
    textTransform: 'uppercase' as const,
    textAllowOverlap: false,
    /** Letter spacing for a spread-out atlas / cartographic feel */
    textLetterSpacing: 0.18,
    /** Max angle change per character along bezier — keeps text from bending too sharply */
    textMaxAngle: 25,
    /** Padding for collision detection — prevents overlapping nearby labels */
    textPadding: 14,
    /**
     * Nested interpolation: zoom → (d → fontSize).
     * 4 zoom stops give a gradual reveal from far to close zoom.
     * At each zoom level, 3 d-stops define a clear hierarchy:
     *   low d (small entities) → small text
     *   mid d (medium entities) → medium text
     *   high d (major empires) → large text
     */
    textSize: [
      'interpolate',
      ['linear'],
      ['zoom'],
      2,
      ['interpolate', ['linear'], ['get', 'd'], 600, 8, 1800, 16, 4000, 46],
      4,
      ['interpolate', ['linear'], ['get', 'd'], 600, 16, 1800, 36, 4000, 100],
      7,
      ['interpolate', ['linear'], ['get', 'd'], 600, 40, 1800, 80, 4000, 240],
      9,
      ['interpolate', ['linear'], ['get', 'd'], 600, 90, 1800, 150, 4000, 440],
    ],
  },
  /**
   * Mapbox paint properties for the bezier-curve line labels.
   * Warm charcoal text with a subtle parchment halo for the editorial atlas look.
   */
  linePaint: {
    /** Dark warm brown — maximum readability over saturated polygon fills */
    textColor: '#1a1206',
    /** Wide halo to cut through colorful backgrounds; vector basemap needs more than old Chronas */
    textHaloWidth: 3,
    /** Sharp halo edge for best contrast on busy backgrounds */
    textHaloBlur: 0,
    /** Opaque warm parchment halo */
    textHaloColor: 'rgba(255, 252, 235, 0.97)',
  },
  /** Mapbox layout properties for the point fallback labels */
  pointLayout: {
    textTransform: 'uppercase' as const,
    textAnchor: 'center' as const,
    textAllowOverlap: false,
    textIgnorePlacement: false,
    textOptional: true,
    textLetterSpacing: 0.2,
    textMaxWidth: 12,
    textPadding: 10,
    textSize: [
      'interpolate',
      ['linear'],
      ['zoom'],
      1, ['*', ['get', 'fontSize'], 0.18],
      3, ['*', ['get', 'fontSize'], 0.35],
      5, ['*', ['get', 'fontSize'], 0.6],
      7, ['*', ['get', 'fontSize'], 0.9],
    ],
  },
  /** Mapbox paint properties for the point fallback labels */
  pointPaint: {
    textColor: '#1a1206',
    textHaloColor: 'rgba(255, 252, 235, 0.97)',
    textHaloWidth: 3,
    textHaloBlur: 0,
  },
  /**
   * Zoom-dependent text opacity for smooth label fade-in.
   * Prevents abrupt popping when labels appear at zoom thresholds.
   */
  lineTextOpacity: [
    'interpolate',
    ['linear'],
    ['zoom'],
    1.5, 0,
    2.2, 1,
  ],
  /** Zoom-dependent opacity for point fallback labels */
  pointTextOpacity: [
    'interpolate',
    ['linear'],
    ['zoom'],
    1.5, 0,
    2.5, 1,
  ],
  /** Fallback font stack when locale-specific font is unavailable */
  fallbackFonts: ['Arial Unicode MS Regular'] as string[],
  /** bezierSpline options matching old Chronas turf.bezier behaviour */
  bezierOptions: {
    sharpness: 1,
    resolution: 10000,
  },
};

/**
 * Builds the Mapbox text-font array for area labels based on locale.
 *
 * @param locale - The locale code (e.g. 'en', 'zh', 'ar')
 * @returns A [primaryFont, fallbackFont] tuple for Mapbox GL
 */
export function getAreaLabelFonts(locale: string): [string, string] {
  const primary = getFontForLocale(locale);
  const fallback = AREA_LABEL_CONFIG.fallbackFonts[0] ?? 'Arial Unicode MS Regular';
  return [primary, fallback];
}

/**
 * Fonts served locally as PBF glyphs in public/fonts/.
 * Mapbox GL styles resolve font requests via their glyphs endpoint.
 * Hosted styles (mapbox://...) don't include these fonts, so we intercept
 * requests via `transformRequest` and redirect to local files.
 */
export const LOCAL_FONT_NAMES = new Set([
  'Cinzel Regular',
  'Cairo',
  'Noto Sans SC',
]);

/**
 * Marker theme types
 */
export type MarkerTheme = 'themed' | 'abstract';

/**
 * Gets the icon atlas URL for a marker theme.
 *
 * @param markerTheme - The marker theme ('themed' or 'abstract')
 * @param isPainted - Whether to use the painted variant
 * @returns The URL to the icon atlas image
 */
export function getIconAtlasUrl(markerTheme: MarkerTheme, isPainted = false): string {
  const paintedSuffix = isPainted ? '-painted' : '';
  return `/images/${markerTheme}${paintedSuffix}-atlas.png`;
}

/**
 * Gets the cluster icon atlas URL for a marker theme.
 *
 * @param markerTheme - The marker theme ('themed' or 'abstract')
 * @param isPainted - Whether to use the painted variant
 * @returns The URL to the cluster icon atlas image
 */
export function getClusterIconAtlasUrl(markerTheme: MarkerTheme, isPainted = false): string {
  const paintedSuffix = isPainted ? '-painted' : '';
  return `/images/${markerTheme}${paintedSuffix}-cluster-atlas.png`;
}

/**
 * All supported theme names
 */
export const THEME_NAMES: Theme[] = ['light', 'dark', 'luther'];

/**
 * Validates if a string is a valid theme name.
 *
 * @param theme - The string to validate
 * @returns true if the string is a valid theme name
 */
export function isValidThemeName(theme: string): theme is Theme {
  return THEME_NAMES.includes(theme as Theme);
}
