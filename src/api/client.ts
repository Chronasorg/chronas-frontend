/**
 * API Client Module
 *
 * Provides a configured Axios instance for communicating with the chronas-api backend.
 * The site only reads public map data, so requests carry no Authorization header
 * (login was removed in 2026-11). A response interceptor retries busy reads.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import axios from 'axios';
import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { env } from '../config/env';

/**
 * Default timeout for API requests (30 seconds)
 */
const DEFAULT_TIMEOUT = 30000;

/**
 * Retries for idempotent reads. The API runs on a Lambda Web Function, which
 * answers 429 when its environments are busy and does not queue requests; the
 * AWS docs ask clients to retry idempotent requests with exponential backoff
 * and jitter (web-functions-scaling.html), and to retry a 503 the same way.
 * A platform 429 may come without CORS headers, which the browser reports as
 * a network error without a response, so those are retried too. Cancelled
 * requests and timeouts are not; writes never are.
 */
const RETRY_METHODS = ['get', 'head'];
const RETRY_STATUSES = [429, 503];
export const MAX_RETRIES = 2;
const BACKOFF_BASE_MS = 300;
const MAX_RETRY_AFTER_MS = 5000;

type RetryableConfig = InternalAxiosRequestConfig & { retryCount?: number };

/** Whether a failed request should be sent again. */
export function isRetryable(error: AxiosError): boolean {
  const config = error.config as RetryableConfig | undefined;
  if (!config || axios.isCancel(error)) return false;
  if (!RETRY_METHODS.includes((config.method ?? 'get').toLowerCase())) return false;
  if ((config.retryCount ?? 0) >= MAX_RETRIES) return false;
  if (error.response) return RETRY_STATUSES.includes(error.response.status);
  // No response: network or CORS failure. A timeout has already waited 30 s.
  return !['ECONNABORTED', 'ETIMEDOUT', 'ERR_CANCELED'].includes(error.code ?? '');
}

/**
 * Wait before retry number `attempt` (0-based): Retry-After when the response
 * exposes it (capped at 5 s), otherwise full jitter, a random 0–300 ms × 2^attempt.
 */
export function retryDelayMs(
  error: AxiosError,
  attempt: number,
  random: () => number = Math.random
): number {
  const header: unknown = error.response?.headers['retry-after'];
  const seconds = typeof header === 'string' && header.trim() !== '' ? Number(header) : NaN;
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1000, MAX_RETRY_AFTER_MS);
  return Math.floor(random() * BACKOFF_BASE_MS * 2 ** attempt);
}

/**
 * API Client configuration interface
 */
export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
}

/**
 * API Client interface with typed methods
 */
export interface ApiClient {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
}

/**
 * Default configuration for the API client
 */
const defaultConfig: ApiClientConfig = {
  baseURL: env.apiBaseUrl,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Creates and configures the Axios instance with interceptors
 */
function createApiClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: defaultConfig.baseURL,
    timeout: defaultConfig.timeout,
    headers: defaultConfig.headers,
  });

  // Response interceptor for error handling
  instance.interceptors.response.use(
    (response: AxiosResponse): AxiosResponse => {
      // Return successful responses as-is
      return response;
    },
    async (error: AxiosError): Promise<AxiosResponse> => {
      // Retry idempotent reads that hit a busy or briefly unavailable API
      if (isRetryable(error)) {
        const config = error.config as RetryableConfig;
        const attempt = config.retryCount ?? 0;
        config.retryCount = attempt + 1;
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs(error, attempt)));
        return instance.request(config);
      }

      // Handle 403 Forbidden errors
      if (error.response?.status === 403) {
        console.error('Access forbidden - insufficient permissions');
      }

      // Handle server errors (5xx)
      if (error.response?.status && error.response.status >= 500) {
        console.error('Server error occurred:', error.response.status);
      }

      // Handle network errors
      if (!error.response) {
        console.error('Network error - unable to reach server');
      }

      return Promise.reject(error);
    }
  );

  return instance;
}

/**
 * The configured Axios instance
 */
const axiosInstance = createApiClient();

/**
 * API client with typed methods that return response data directly
 *
 * Usage:
 * ```typescript
 * // GET request
 * const user = await apiClient.get<User>('/users/me');
 *
 * // POST request
 * const newItem = await apiClient.post<Item>('/items', { name: 'New Item' });
 * ```
 */
export const apiClient: ApiClient = {
  /**
   * Performs a GET request
   * @param url - The endpoint URL (relative to base URL)
   * @param config - Optional Axios request configuration
   * @returns Promise resolving to the response data
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.get<T>(url, config);
    return response.data;
  },

  /**
   * Performs a POST request
   * @param url - The endpoint URL (relative to base URL)
   * @param data - Optional request body data
   * @param config - Optional Axios request configuration
   * @returns Promise resolving to the response data
   */
  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.post<T>(url, data, config);
    return response.data;
  },

  /**
   * Performs a PUT request
   * @param url - The endpoint URL (relative to base URL)
   * @param data - Optional request body data
   * @param config - Optional Axios request configuration
   * @returns Promise resolving to the response data
   */
  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.put<T>(url, data, config);
    return response.data;
  },

  /**
   * Performs a DELETE request
   * @param url - The endpoint URL (relative to base URL)
   * @param config - Optional Axios request configuration
   * @returns Promise resolving to the response data
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.delete<T>(url, config);
    return response.data;
  },

  /**
   * Performs a PATCH request
   * @param url - The endpoint URL (relative to base URL)
   * @param data - Optional request body data
   * @param config - Optional Axios request configuration
   * @returns Promise resolving to the response data
   */
  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.patch<T>(url, data, config);
    return response.data;
  },
};

/**
 * Export the raw Axios instance for advanced use cases
 * (e.g., custom interceptors, cancellation tokens)
 */
export { axiosInstance };

/**
 * Export the default config for testing purposes
 */
export { defaultConfig };

// Default export for convenience
export default apiClient;
