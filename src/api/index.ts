/**
 * API Module Exports
 *
 * Central export point for all API-related functionality.
 */

export { apiClient, axiosInstance, TOKEN_STORAGE_KEY } from './client';
export type { ApiClient, ApiClientConfig } from './client';

export { ENDPOINTS, AUTH, USERS, AREAS, MARKERS, METADATA, HEALTH, VERSION } from './endpoints';

export type {
  ApiResponse,
  ApiError,
  PaginatedResponse,
  User,
  UserName,
  UserProfile,
  UserListItem,
  LoginRequest,
  SignupRequest,
  AuthResponse,
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
