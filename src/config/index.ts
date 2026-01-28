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
