/**
 * Environment Configuration Module
 *
 * This module provides type-safe access to environment variables with runtime validation.
 * It validates required environment variables at application startup and provides
 * typed exports for use throughout the application.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

/**
 * Environment configuration interface
 * Defines the shape of the validated environment configuration
 */
export interface EnvironmentConfig {
  /** Base URL for the chronas-api backend */
  apiBaseUrl: string;
  /** Current environment (development, staging, or production) */
  environment: 'development' | 'staging' | 'production';
  /** Whether developer tools should be enabled */
  enableDevTools: boolean;
  /** Optional Mapbox token for map functionality */
  mapboxToken?: string | undefined;
}

/**
 * List of required environment variables
 * These must be present for the application to start
 */
const REQUIRED_ENV_VARS = ['VITE_API_BASE_URL', 'VITE_ENVIRONMENT'] as const;

/**
 * Valid environment values
 */
const VALID_ENVIRONMENTS = ['development', 'staging', 'production'] as const;

/**
 * Error class for environment validation failures
 */
export class EnvValidationError extends Error {
  constructor(
    message: string,
    public readonly missingVars?: string[],
    public readonly invalidVars?: Record<string, string>
  ) {
    super(message);
    this.name = 'EnvValidationError';
  }
}

/**
 * Validates that all required environment variables are present
 * @throws {EnvValidationError} If required variables are missing
 */
function validateRequiredVars(): void {
  const missing: string[] = [];

  for (const varName of REQUIRED_ENV_VARS) {
    // Use type assertion to handle runtime validation - TypeScript types may not match runtime reality
    const value = import.meta.env[varName] as string | undefined;
    if (!value || value === '') {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new EnvValidationError(
      `Missing required environment variables: ${missing.join(', ')}`,
      missing
    );
  }
}

/**
 * Validates that the environment value is one of the allowed values
 * @throws {EnvValidationError} If environment value is invalid
 */
function validateEnvironmentValue(
  value: string
): asserts value is EnvironmentConfig['environment'] {
  if (!VALID_ENVIRONMENTS.includes(value as EnvironmentConfig['environment'])) {
    throw new EnvValidationError(
      `Invalid VITE_ENVIRONMENT value: "${value}". Must be one of: ${VALID_ENVIRONMENTS.join(', ')}`,
      undefined,
      { VITE_ENVIRONMENT: value }
    );
  }
}

/**
 * Parses a string value to boolean
 * @param value - The string value to parse
 * @returns true if value is 'true' (case-insensitive), false otherwise
 */
function parseBoolean(value: string | undefined): boolean {
  return value?.toLowerCase() === 'true';
}

/**
 * Validates and parses environment configuration
 * @param config - Partial configuration to validate
 * @returns Validated and complete environment configuration
 * @throws {EnvValidationError} If validation fails
 */
export function validateEnvConfig(
  config: Partial<EnvironmentConfig>
): EnvironmentConfig {
  // Validate required fields
  if (!config.apiBaseUrl) {
    throw new EnvValidationError('apiBaseUrl is required', ['VITE_API_BASE_URL']);
  }

  if (!config.environment) {
    throw new EnvValidationError('environment is required', ['VITE_ENVIRONMENT']);
  }

  // Validate environment value
  validateEnvironmentValue(config.environment);

  return {
    apiBaseUrl: config.apiBaseUrl,
    environment: config.environment,
    enableDevTools: config.enableDevTools ?? false,
    mapboxToken: config.mapboxToken,
  };
}

/**
 * Creates the environment configuration from Vite environment variables
 * This function validates all required variables and returns a typed configuration object
 * @returns Validated environment configuration
 * @throws {EnvValidationError} If validation fails
 */
function createEnvConfig(): EnvironmentConfig {
  // Validate required variables are present
  validateRequiredVars();

  // Get raw values from Vite environment
  // Use nullish coalescing for optional values
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
  const rawConfig: Partial<EnvironmentConfig> = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
    environment: import.meta.env.VITE_ENVIRONMENT,
    enableDevTools: parseBoolean(import.meta.env.VITE_ENABLE_DEV_TOOLS),
    mapboxToken: mapboxToken ?? undefined,
  };

  // Validate and return the configuration
  return validateEnvConfig(rawConfig);
}

/**
 * The validated environment configuration
 * This is created once at module load time and cached for subsequent access
 */
export const env: EnvironmentConfig = createEnvConfig();

/**
 * Helper function to check if we're in development mode
 */
export function isDevelopment(): boolean {
  return env.environment === 'development';
}

/**
 * Helper function to check if we're in staging mode
 */
export function isStaging(): boolean {
  return env.environment === 'staging';
}

/**
 * Helper function to check if we're in production mode
 */
export function isProduction(): boolean {
  return env.environment === 'production';
}

/**
 * Helper function to check if dev tools should be enabled
 */
export function shouldEnableDevTools(): boolean {
  return env.enableDevTools;
}

// Export default for convenience
export default env;
