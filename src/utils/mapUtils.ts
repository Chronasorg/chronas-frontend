/**
 * Map Utilities
 *
 * URL parameter helpers and map-related utility functions.
 *
 * Requirements: 2.4, 2.5, 3.6
 */

import type { ViewportState } from '../stores/mapStore';

/**
 * Precision for coordinate formatting (6 decimal places = ~0.1m accuracy)
 */
const COORDINATE_PRECISION = 6;

/**
 * Precision for zoom formatting (2 decimal places)
 */
const ZOOM_PRECISION = 2;

/**
 * Default viewport values for fallback
 */
const DEFAULT_LATITUDE = 37;
const DEFAULT_LONGITUDE = 37;
const DEFAULT_ZOOM = 2.5;

/**
 * Formats viewport state to a URL position string.
 * Format: "lat,lng,zoom" (e.g., "37.123456,45.654321,5.50")
 *
 * Requirement 2.4: THE MapStore SHALL format viewport state to URL position string
 *
 * @param viewport - The viewport state to format
 * @returns URL-safe position string
 */
export function formatPositionToURL(viewport: Partial<ViewportState>): string {
  const lat = viewport.latitude ?? DEFAULT_LATITUDE;
  const lng = viewport.longitude ?? DEFAULT_LONGITUDE;
  const zoom = viewport.zoom ?? DEFAULT_ZOOM;

  // Validate inputs are finite numbers
  const safeLat = Number.isFinite(lat) ? lat : DEFAULT_LATITUDE;
  const safeLng = Number.isFinite(lng) ? lng : DEFAULT_LONGITUDE;
  const safeZoom = Number.isFinite(zoom) ? zoom : DEFAULT_ZOOM;

  // Format with appropriate precision
  const latStr = safeLat.toFixed(COORDINATE_PRECISION);
  const lngStr = safeLng.toFixed(COORDINATE_PRECISION);
  const zoomStr = safeZoom.toFixed(ZOOM_PRECISION);

  return `${latStr},${lngStr},${zoomStr}`;
}

/**
 * Parses a URL position string to viewport state.
 * Expected format: "lat,lng,zoom" (e.g., "37.123456,45.654321,5.50")
 *
 * Requirement 2.5: THE MapStore SHALL parse URL position string to viewport state
 *
 * @param urlParam - The URL position string to parse
 * @returns Partial viewport state with parsed values, or empty object if invalid
 */
export function parsePositionFromURL(urlParam: string | null | undefined): Partial<ViewportState> {
  if (!urlParam || typeof urlParam !== 'string') {
    return {};
  }

  const trimmed = urlParam.trim();
  if (!trimmed) {
    return {};
  }

  const parts = trimmed.split(',');
  if (parts.length < 3) {
    return {};
  }

  const latPart = parts[0];
  const lngPart = parts[1];
  const zoomPart = parts[2];

  if (latPart === undefined || lngPart === undefined || zoomPart === undefined) {
    return {};
  }

  const latitude = parseFloat(latPart);
  const longitude = parseFloat(lngPart);
  const zoom = parseFloat(zoomPart);

  // Validate parsed values
  const result: Partial<ViewportState> = {};

  if (Number.isFinite(latitude) && latitude >= -90 && latitude <= 90) {
    result.latitude = latitude;
  }

  if (Number.isFinite(longitude) && longitude >= -180 && longitude <= 180) {
    result.longitude = longitude;
  }

  if (Number.isFinite(zoom) && zoom >= 0 && zoom <= 22) {
    result.zoom = zoom;
  }

  return result;
}

/**
 * Updates a query string parameter in the current URL without page reload.
 * Uses the History API to update the URL.
 *
 * Requirement 3.6: THE MapStore SHALL update URL query parameters
 *
 * @param key - The query parameter key
 * @param value - The value to set (null to remove the parameter)
 */
export function updateQueryStringParameter(key: string, value: string | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);

  if (value === null) {
    url.searchParams.delete(key);
  } else {
    url.searchParams.set(key, value);
  }

  // Update URL without reload using History API
  window.history.replaceState({}, '', url.toString());
}

/**
 * Gets a query string parameter from the current URL.
 *
 * @param key - The query parameter key
 * @returns The parameter value or null if not found
 */
export function getQueryStringParameter(key: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const url = new URL(window.location.href);
  return url.searchParams.get(key);
}

/**
 * Updates the position query parameter with the current viewport.
 *
 * @param viewport - The viewport state to encode in the URL
 */
export function updatePositionInURL(viewport: Partial<ViewportState>): void {
  const positionString = formatPositionToURL(viewport);
  updateQueryStringParameter('pos', positionString);
}

/**
 * Gets the viewport state from the URL position parameter.
 *
 * @returns Partial viewport state from URL, or empty object if not present
 */
export function getPositionFromURL(): Partial<ViewportState> {
  const posParam = getQueryStringParameter('pos');
  return parsePositionFromURL(posParam);
}

/**
 * Updates the year query parameter in the URL.
 *
 * Requirement 3.6: THE MapStore SHALL update URL year parameter
 *
 * @param year - The year to set in the URL
 */
export function updateYearInURL(year: number): void {
  if (!Number.isFinite(year)) {
    return;
  }
  updateQueryStringParameter('year', String(Math.round(year)));
}

/**
 * Gets the year from the URL query parameter.
 *
 * @returns The year from URL, or null if not present or invalid
 */
export function getYearFromURL(): number | null {
  const yearParam = getQueryStringParameter('year');
  if (!yearParam) {
    return null;
  }

  const year = parseInt(yearParam, 10);
  if (!Number.isFinite(year)) {
    return null;
  }

  return year;
}

/**
 * Checks if two viewport states are approximately equal within tolerance.
 * Useful for comparing viewports after URL round-trip.
 *
 * @param a - First viewport state
 * @param b - Second viewport state
 * @param tolerance - Maximum allowed difference (default: 0.000001)
 * @returns true if viewports are approximately equal
 */
export function viewportsApproximatelyEqual(
  a: Partial<ViewportState>,
  b: Partial<ViewportState>,
  tolerance = 0.000001
): boolean {
  const compareField = (
    fieldA: number | undefined,
    fieldB: number | undefined,
    tol: number
  ): boolean => {
    if (fieldA === undefined && fieldB === undefined) return true;
    if (fieldA === undefined || fieldB === undefined) return false;
    return Math.abs(fieldA - fieldB) <= tol;
  };

  return (
    compareField(a.latitude, b.latitude, tolerance) &&
    compareField(a.longitude, b.longitude, tolerance) &&
    compareField(a.zoom, b.zoom, 0.01) // Zoom has less precision
  );
}

/**
 * Data type names for logging purposes
 */
const DATA_TYPE_NAMES = ['ruler', 'culture', 'religion', 'capital', 'population'] as const;

/**
 * Province data index constants for type safety
 */
export const PROVINCE_DATA_INDEX = {
  RULER: 0,
  CULTURE: 1,
  RELIGION: 2,
  CAPITAL: 3,
  POPULATION: 4,
} as const;

/**
 * Area data type imported from mapStore
 */
import type { AreaData, ProvinceData } from '../stores/mapStore';

/**
 * Safely accesses province data with validation and logging.
 * Returns null for missing or malformed data without throwing an exception.
 *
 * Requirement 13.5: THE MapStore SHALL validate province data structure
 * Requirement 13.6: THE MapStore SHALL return null for missing or malformed data
 *
 * @param areaData - The area data dictionary (may be null)
 * @param provinceId - The province ID to look up
 * @param index - The data index (0=ruler, 1=culture, 2=religion, 3=capital, 4=population)
 * @param logWarnings - Whether to log warnings for missing data (default: true)
 * @returns The data value at the specified index, or null if not available
 */
export function safeAreaDataAccess(
  areaData: AreaData | null | undefined,
  provinceId: string,
  index: number,
  logWarnings = true
): string | number | null {
  const dataType = DATA_TYPE_NAMES[index] ?? `index_${String(index)}`;

  // Check if areaData exists
  if (!areaData) {
    if (logWarnings) {
      console.warn(`MISSING DATA: No area data when accessing ${dataType} for ${provinceId}`);
    }
    return null;
  }

  // Check if provinceId is valid
  if (!provinceId || typeof provinceId !== 'string') {
    if (logWarnings) {
      console.warn(`INVALID PROVINCE ID: ${provinceId} when accessing ${dataType}`);
    }
    return null;
  }

  // Check if province exists in data
  const provinceData = areaData[provinceId];
  if (!provinceData) {
    if (logWarnings) {
      console.warn(`MISSING PROVINCE: ${provinceId} not found when accessing ${dataType}`);
    }
    return null;
  }

  // Check if data is an array
  if (!Array.isArray(provinceData)) {
    if (logWarnings) {
      console.warn(`INVALID STRUCTURE: ${provinceId} data is not an array`);
    }
    return null;
  }

  // Check if index is valid
  if (index < 0 || !Number.isInteger(index)) {
    if (logWarnings) {
      console.warn(`INVALID INDEX: ${String(index)} when accessing data for ${provinceId}`);
    }
    return null;
  }

  // Check if data has enough elements
  if (provinceData.length <= index) {
    if (logWarnings) {
      console.warn(
        `INCOMPLETE DATA: ${provinceId} missing ${dataType} (length: ${String(provinceData.length)})`
      );
    }
    return null;
  }

  // Get the value
  const value = provinceData[index];

  // Handle null/undefined values
  if (value === null || value === undefined) {
    return null;
  }

  return value;
}

/**
 * Gets the ruler ID for a province.
 *
 * @param areaData - The area data dictionary
 * @param provinceId - The province ID
 * @param logWarnings - Whether to log warnings
 * @returns The ruler ID or null
 */
export function getProvinceRuler(
  areaData: AreaData | null | undefined,
  provinceId: string,
  logWarnings = true
): string | null {
  const value = safeAreaDataAccess(areaData, provinceId, PROVINCE_DATA_INDEX.RULER, logWarnings);
  return typeof value === 'string' ? value : null;
}

/**
 * Gets the culture ID for a province.
 *
 * @param areaData - The area data dictionary
 * @param provinceId - The province ID
 * @param logWarnings - Whether to log warnings
 * @returns The culture ID or null
 */
export function getProvinceCulture(
  areaData: AreaData | null | undefined,
  provinceId: string,
  logWarnings = true
): string | null {
  const value = safeAreaDataAccess(areaData, provinceId, PROVINCE_DATA_INDEX.CULTURE, logWarnings);
  return typeof value === 'string' ? value : null;
}

/**
 * Gets the religion ID for a province.
 *
 * @param areaData - The area data dictionary
 * @param provinceId - The province ID
 * @param logWarnings - Whether to log warnings
 * @returns The religion ID or null
 */
export function getProvinceReligion(
  areaData: AreaData | null | undefined,
  provinceId: string,
  logWarnings = true
): string | null {
  const value = safeAreaDataAccess(areaData, provinceId, PROVINCE_DATA_INDEX.RELIGION, logWarnings);
  return typeof value === 'string' ? value : null;
}

/**
 * Gets the capital ID for a province.
 *
 * @param areaData - The area data dictionary
 * @param provinceId - The province ID
 * @param logWarnings - Whether to log warnings
 * @returns The capital ID or null
 */
export function getProvinceCapital(
  areaData: AreaData | null | undefined,
  provinceId: string,
  logWarnings = true
): string | null {
  const value = safeAreaDataAccess(areaData, provinceId, PROVINCE_DATA_INDEX.CAPITAL, logWarnings);
  return typeof value === 'string' ? value : null;
}

/**
 * Gets the population value for a province.
 *
 * @param areaData - The area data dictionary
 * @param provinceId - The province ID
 * @param logWarnings - Whether to log warnings
 * @returns The population value or null
 */
export function getProvincePopulation(
  areaData: AreaData | null | undefined,
  provinceId: string,
  logWarnings = true
): number | null {
  const value = safeAreaDataAccess(
    areaData,
    provinceId,
    PROVINCE_DATA_INDEX.POPULATION,
    logWarnings
  );
  return typeof value === 'number' ? value : null;
}

/**
 * Validates that province data has the expected structure.
 *
 * @param data - The data to validate
 * @returns true if the data is a valid ProvinceData array
 */
export function isValidProvinceData(data: unknown): data is ProvinceData {
  if (!Array.isArray(data)) {
    return false;
  }

  if (data.length < 5) {
    return false;
  }

  // Check types: [string, string, string, string | null, number]
  if (typeof data[0] !== 'string') return false;
  if (typeof data[1] !== 'string') return false;
  if (typeof data[2] !== 'string') return false;
  if (data[3] !== null && typeof data[3] !== 'string') return false;
  if (typeof data[4] !== 'number') return false;

  return true;
}
