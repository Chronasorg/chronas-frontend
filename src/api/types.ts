/**
 * API Types Module
 *
 * Provides TypeScript type definitions for API responses and data models
 * used when communicating with the chronas-api backend.
 *
 * Requirements: 5.5
 */

// ============================================================================
// Generic API Response Types
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

/**
 * API error response
 */
export interface ApiError {
  status: number;
  message: string;
  code?: string;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================================================
// User Types
// ============================================================================

/**
 * User data model
 */
export interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  score: number;
  subscription: string;
  privilege: number;
}

/**
 * User name structure
 */
export interface UserName {
  first?: string;
  last?: string;
}

/**
 * Extended user profile
 */
export interface UserProfile extends User {
  name?: UserName;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * User list item (for highscore, sustainers lists)
 */
export interface UserListItem {
  id: string;
  username: string;
  avatar?: string;
  score: number;
  subscription?: string;
}

// ============================================================================
// Authentication Types
// ============================================================================

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Signup request payload
 */
export interface SignupRequest {
  email: string;
  password: string;
  username: string;
}

/**
 * Authentication response (login/signup)
 */
export interface AuthResponse {
  token: string;
  user: User;
}

// ============================================================================
// Marker Types
// ============================================================================

/**
 * Map marker data
 */
export interface Marker {
  _id: string;
  name: string;
  type: string;
  year: number;
  coo: [number, number];
  wiki?: string;
  data?: MarkerData;
}

/**
 * Additional marker data
 */
export interface MarkerData {
  description?: string;
  image?: string;
  [key: string]: unknown;
}

// ============================================================================
// Metadata Types
// ============================================================================

/**
 * Metadata entry
 */
export interface Metadata {
  _id: string;
  type: string;
  data: MetadataData;
  subtype?: string;
  wiki?: string;
  score?: number;
}

/**
 * Metadata data properties
 */
export interface MetadataData {
  name?: string;
  description?: string;
  color?: string;
  [key: string]: unknown;
}

// ============================================================================
// Area Types
// ============================================================================

/**
 * Geographic area data
 */
export interface Area {
  _id: string;
  year: number;
  data: AreaDataLegacy;
}

/**
 * Area data properties (legacy format)
 */
export interface AreaDataLegacy {
  ruler?: string;
  religion?: string;
  culture?: string;
  capital?: string;
  population?: number;
}

/**
 * Province data tuple for map rendering.
 * Index 0: ruler ID
 * Index 1: culture ID
 * Index 2: religion ID
 * Index 3: capital ID (optional)
 * Index 4: population value
 *
 * Requirements: 3.3
 */
export type ProvinceData = [string, string, string, string | null, number];

/**
 * Area data dictionary keyed by province ID.
 * Used for map rendering with province boundaries.
 *
 * Requirements: 3.3
 */
export type MapAreaData = Record<string, ProvinceData>;

// ============================================================================
// Health Check Types
// ============================================================================

/**
 * Health check response
 */
export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version?: string;
}
