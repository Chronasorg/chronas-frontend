/**
 * API Endpoints Module
 *
 * Provides centralized endpoint constants for all chronas-api routes.
 *
 * Requirements: 5.5
 */

// ============================================================================
// Authentication Endpoints
// ============================================================================

export const AUTH = {
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  LOGIN_TWITTER: '/auth/login/twitter',
  LOGIN_FACEBOOK: '/auth/login/facebook',
  LOGIN_GOOGLE: '/auth/login/google',
  LOGIN_GITHUB: '/auth/login/github',
} as const;

// ============================================================================
// User Endpoints
// ============================================================================

export const USERS = {
  CREATE: '/users',
  GET: (userId: string) => `/users/${userId}`,
  UPDATE: (userId: string) => `/users/${userId}`,
  DELETE: (userId: string) => `/users/${userId}`,
  SUSTAINERS: '/users/sustainers',
  HIGHSCORE: '/users/highscore',
} as const;

// ============================================================================
// Area Endpoints
// ============================================================================

export const AREAS = {
  LIST: '/areas',
  CREATE: '/areas',
  GET: (areaId: string) => `/areas/${areaId}`,
  UPDATE: (areaId: string) => `/areas/${areaId}`,
  DELETE: (areaId: string) => `/areas/${areaId}`,
  /**
   * Get area data for a specific year.
   * Returns province data dictionary keyed by province ID.
   * Requirements: 3.2
   */
  GET_BY_YEAR: (year: number) => `/areas/${String(year)}`,
} as const;

// ============================================================================
// Marker Endpoints
// ============================================================================

export const MARKERS = {
  LIST: '/markers',
  CREATE: '/markers',
  GET: (markerId: string) => `/markers/${markerId}`,
  UPDATE: (markerId: string) => `/markers/${markerId}`,
  DELETE: (markerId: string) => `/markers/${markerId}`,
} as const;

// ============================================================================
// Metadata Endpoints
// ============================================================================

export const METADATA = {
  LIST: '/metadata',
  CREATE: '/metadata',
  GET: (metadataId: string) => `/metadata/${metadataId}`,
  UPDATE: (metadataId: string) => `/metadata/${metadataId}`,
  DELETE: (metadataId: string) => `/metadata/${metadataId}`,
} as const;

// ============================================================================
// Health & Version Endpoints
// ============================================================================

export const HEALTH = {
  CHECK: '/health',
} as const;

export const VERSION = {
  GET: '/version',
} as const;

// ============================================================================
// All Endpoints Export
// ============================================================================

export const ENDPOINTS = {
  AUTH,
  USERS,
  AREAS,
  MARKERS,
  METADATA,
  HEALTH,
  VERSION,
} as const;

export default ENDPOINTS;
