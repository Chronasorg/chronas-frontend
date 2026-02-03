/**
 * Configuration Module Exports
 *
 * This module re-exports all configuration-related types and utilities
 * for convenient access throughout the application.
 */

export {
  env,
  validateEnvConfig,
  isDevelopment,
  isStaging,
  isProduction,
  shouldEnableDevTools,
  EnvValidationError,
  type EnvironmentConfig,
} from './env';

export { env as default } from './env';

// Map theme configuration
export {
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
  type ThemeConfig,
  type MarkerTheme,
} from './mapTheme';
