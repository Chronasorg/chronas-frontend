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
  /**
   * Get markers for a specific year.
   * Requirements: 9.1
   */
  GET_BY_YEAR: (year: number) => `/markers?year=${String(year)}`,
  /**
   * Get markers for a specific year with limit.
   * Requirements: 4.2, 4.3
   */
  GET_BY_YEAR_WITH_LIMIT: (year: number, limit: number) =>
    `/markers?year=${String(year)}&limit=${String(limit)}`,
  /**
   * Get markers for a specific year and type.
   * Requirements: 9.1
   */
  GET_BY_YEAR_AND_TYPE: (year: number, type: string) =>
    `/markers?year=${String(year)}&type=${type}`,
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
  /**
   * Get metadata list.
   * Requirements: 9.1
   */
  LIST_V1: '/metadata',
  /**
   * Get metadata filtered by type.
   * Requirements: 9.1
   */
  GET_BY_TYPE: (type: string) => `/metadata?type=${type}`,
  /**
   * Get combined metadata including provinces GeoJSON and entity colors.
   * This is the initialization endpoint that returns all required metadata.
   * Requirements: 2.1, 2.2
   */
  GET_INIT: '/metadata?type=g&f=provinces,ruler,culture,religion,capital,province,religionGeneral',
} as const;

// ============================================================================
// Epic Items Endpoints
// ============================================================================

export const EPICS = {
  /**
   * Get epic items by subtype.
   * Subtypes include: 'ew' (wars), 'ei' (discoveries/empires), 'ps' (persons/primary sources)
   * Requirements: 6.1
   */
  GET_BY_SUBTYPE: (subtype: string) => `/metadata?type=e&end=3000&subtype=${subtype}`,
  /**
   * Get all epic items (wars, discoveries, persons).
   * Requirements: 6.1
   */
  GET_ALL: '/metadata?type=e&end=3000&subtype=ew,ei,ps',
  /**
   * Get linked content for an epic item.
   * Returns map features with coordinates for battles, events, etc.
   * Used to fly the map to show epic-related locations.
   */
  GET_LINKED: (epicId: string) => `/metadata/links/getLinked?source=1:${encodeURIComponent(epicId)}`,
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
  EPICS,
  HEALTH,
  VERSION,
} as const;

export default ENDPOINTS;
