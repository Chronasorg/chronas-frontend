/**
 * Utility exports
 *
 * Central export point for all utility functions.
 */

export { formatScore } from './formatScore';

// Year utilities for timeline
export {
  clampYear,
  isValidYear,
  formatYearForDisplay,
  dateToYear,
  yearToDate,
  MIN_YEAR,
  MAX_YEAR,
  DEFAULT_YEAR,
} from './yearUtils';

// Map utilities for URL parameters and viewport
export {
  formatPositionToURL,
  parsePositionFromURL,
  updateQueryStringParameter,
  getQueryStringParameter,
  updatePositionInURL,
  getPositionFromURL,
  updateYearInURL,
  getYearFromURL,
  viewportsApproximatelyEqual,
  safeAreaDataAccess,
  getProvinceRuler,
  getProvinceCulture,
  getProvinceReligion,
  getProvinceCapital,
  getProvincePopulation,
  isValidProvinceData,
  PROVINCE_DATA_INDEX,
} from './mapUtils';
