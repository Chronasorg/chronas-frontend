/**
 * API Endpoints Module
 *
 * Endpoint constants for the public chronas-api reads this site uses. Writes
 * are admin-only on the API and login was removed from the site (2026-11).
 *
 * Requirements: 5.5
 */

// ============================================================================
// Area Endpoints
// ============================================================================

export const AREAS = {
  LIST: '/areas',
  GET: (areaId: string) => `/areas/${areaId}`,
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
  GET: (markerId: string) => `/markers/${markerId}`,
  /**
   * Get markers for a specific year.
   * Requirements: 9.1
   */
  GET_BY_YEAR: (year: number) => `/markers?year=${String(year)}`,
  /**
   * Get markers for a specific year with limit.
   * Requirements: 4.2, 4.3
   */
  /**
   * Every city (type `c`) with its founding year, end year and name history.
   * One fixed URL, so the edge caches it for all visitors; the map filters it
   * by year itself.
   */
  ALL_CITIES: '/markers?types=c&year=-5000&end=2100&limit=10000',
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
  GET: (metadataId: string) => `/metadata/${metadataId}`,
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
  /**
   * Get localized entity names.
   * The API returns translated names as plain strings (not arrays).
   */
  GET_INIT_LOCALIZED: (locale: string) =>
    `/metadata?type=g&locale=${locale}&f=ruler_${locale},culture_${locale},religion_${locale},religionGeneral_${locale}`,
  /**
   * Get province timeline data (historical rulers, cultures, religions, capitals over time).
   * Returns aggregated province data with type=ap.
   * Requirements: US-3.4
   */
  GET_PROVINCE_TIMELINE: (provinceId: string) => `/metadata/ap_${provinceId.toLowerCase()}?type=ap`,
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
  AREAS,
  MARKERS,
  METADATA,
  EPICS,
  HEALTH,
  VERSION,
} as const;

export default ENDPOINTS;
