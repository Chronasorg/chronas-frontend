/**
 * API Client Module
 *
 * Provides a configured Axios instance for communicating with the chronas-api backend.
 * Includes request interceptors for JWT token injection and response interceptors
 * for handling authentication errors.
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
import { useAuthStore } from '../stores/authStore';

// localStorage key for token (matches authStore)
const TOKEN_STORAGE_KEY = 'chs_token';

/**
 * Default timeout for API requests (30 seconds)
 */
const DEFAULT_TIMEOUT = 30000;

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

  // Request interceptor for JWT token injection
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
      // Get token from localStorage
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);

      if (token) {
        // Attach Authorization header with Bearer token
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error: AxiosError): Promise<never> => {
      // Handle request errors
      console.error('API request error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  instance.interceptors.response.use(
    (response: AxiosResponse): AxiosResponse => {
      // Return successful responses as-is
      return response;
    },
    (error: AxiosError): Promise<never> => {
      // Handle 401 Unauthorized errors
      if (error.response?.status === 401) {
        // Clear auth state using Zustand store
        useAuthStore.getState().clearUser();

        // Redirect to login page using hash routing
        window.location.hash = '#/login';
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
export { defaultConfig, TOKEN_STORAGE_KEY };

// Default export for convenience
export default apiClient;
