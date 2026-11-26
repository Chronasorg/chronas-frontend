/**
 * API Module Exports
 *
 * Central export point for all API-related functionality.
 */

export { apiClient, axiosInstance } from './client';
export type { ApiClient, ApiClientConfig } from './client';

export { ENDPOINTS, AREAS, MARKERS, METADATA, HEALTH, VERSION } from './endpoints';

export type {
  ApiResponse,
  ApiError,
  PaginatedResponse,
  Marker,
  MarkerData,
  Metadata,
  MetadataData,
  Area,
  AreaDataLegacy,
  ProvinceData,
  MapAreaData,
  HealthResponse,
} from './types';
