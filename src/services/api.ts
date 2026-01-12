/**
 * API Client - Production-Ready HTTP Client
 *
 * Features:
 * - Automatic token management
 * - Token refresh on expiry
 * - Request/response interceptors
 * - Error handling with retry logic
 * - Type-safe API methods
 * - Network error handling
 */

import axios, {
  AxiosInstance,
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENV } from "../config/env";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Standard API Response Wrapper
 *
 * Matches the backend's response format:
 * {
 *   "status": "success" | "error" | "warning" | "info",
 *   "message": string,
 *   "response_code": number,
 *   "data": T | {},
 *   "pagination"?: PaginationMeta (for list responses)
 * }
 */
export interface ApiResponse<T = any> {
  status: "success" | "error" | "warning" | "info";
  message: string;
  response_code: number;
  data: T | {};
  pagination?: PaginationMeta;
}

/**
 * API Error Structure
 *
 * Errors follow the same response format, with status: "error"
 * and response_code indicating the HTTP status
 */
export interface ApiError {
  status: "error";
  message: string;
  response_code: number;
  data: {};
}

/**
 * Pagination Metadata
 *
 * Matches backend format:
 * {
 *   "count": number,
 *   "next": string | null,
 *   "previous": string | null
 * }
 */
export interface PaginationMeta {
  count: number;
  next: string | null;
  previous: string | null;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

/**
 * Token Response
 */
export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

/**
 * Custom Error Class for API Errors
 *
 * Wraps API error responses for easier handling in the app
 */
export class ApiClientError extends Error {
  statusCode: number;
  responseCode: number;
  data?: any;

  constructor(error: ApiError) {
    super(error.message);
    this.name = "ApiClientError";
    this.statusCode = error.response_code;
    this.responseCode = error.response_code;
    this.data = error.data;
  }
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  TOKEN: "@spark:token",
  REFRESH_TOKEN: "@spark:refresh_token",
  TOKEN_EXPIRY: "@spark:token_expiry",
} as const;

// ============================================================================
// API CLIENT CLASS
// ============================================================================

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    // Create axios instance with base configuration
    this.client = axios.create({
      baseURL: ENV.BASE_URL,
      timeout: ENV.TIMEOUT,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    // Setup interceptors
    this.setupInterceptors();
  }

  // ==========================================================================
  // INTERCEPTORS SETUP
  // ==========================================================================

  private setupInterceptors() {
    // Request Interceptor - Add auth token to requests
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // Get token from storage
        const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);

        // Add Authorization header if token exists
        // Backend uses "Token" prefix instead of "Bearer"
        if (token && config.headers) {
          config.headers.Authorization = `Token ${token}`;
        }

        // If FormData is being sent, let axios automatically set Content-Type
        // Axios will set multipart/form-data with boundary automatically
        if (config.data instanceof FormData && config.headers) {
          // Remove Content-Type to let axios set it automatically with boundary
          delete config.headers['Content-Type'];
        }

        // Log request in development
        if (__DEV__) {
          console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response Interceptor - Handle errors and token refresh
    this.client.interceptors.response.use(
      (response) => {
        // Log response in development
        if (__DEV__) {
          console.log(`📥 ${response.status} ${response.config.url}`);
        }
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // Handle 401 Unauthorized - Token expired or invalid
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // If already refreshing, queue this request
          if (this.isRefreshing) {
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Token ${token}`;
                }
                resolve(this.client(originalRequest));
              });
            });
          }

          // Start token refresh
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshAccessToken();

            // Update all queued requests
            this.refreshSubscribers.forEach((callback) => callback(newToken));
            this.refreshSubscribers = [];

            // Retry original request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Token ${newToken}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed - clear tokens and redirect to login
            await this.clearTokens();
            this.refreshSubscribers = [];

            // You can emit an event here to trigger logout in your app
            // For now, we'll just reject the error
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle other errors
        return Promise.reject(this.handleError(error));
      }
    );
  }

  // ==========================================================================
  // TOKEN MANAGEMENT
  // ==========================================================================

  /**
   * Store authentication tokens
   */
  async setTokens(tokens: TokenResponse): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, tokens.accessToken);

    if (tokens.refreshToken) {
      await AsyncStorage.setItem(
        STORAGE_KEYS.REFRESH_TOKEN,
        tokens.refreshToken
      );
    }

    // Store token expiry time
    if (tokens.expiresIn) {
      const expiryTime = Date.now() + tokens.expiresIn * 1000;
      await AsyncStorage.setItem(
        STORAGE_KEYS.TOKEN_EXPIRY,
        expiryTime.toString()
      );
    }
  }

  /**
   * Get stored access token
   */
  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  /**
   * Clear all stored tokens
   */
  async clearTokens(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.TOKEN_EXPIRY,
    ]);
  }

  /**
   * Check if token is expired
   */
  async isTokenExpired(): Promise<boolean> {
    const expiryTime = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    if (!expiryTime) return true;

    const expiry = parseInt(expiryTime, 10);
    const now = Date.now();

    // Consider token expired if less than 5 minutes remaining
    return now >= expiry - 5 * 60 * 1000;
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<string> {
    const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    if (!refreshToken) {
      throw new ApiClientError({
        status: "error",
        message: "No refresh token available",
        response_code: 401,
        data: {},
      });
    }

    try {
      const response = await axios.post<ApiResponse<TokenResponse>>(
        `${ENV.BASE_URL}/auth/refresh`,
        { refreshToken },
        {
          // Don't use the client instance here to avoid infinite loop
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Backend returns: { status: "success", data: { token: "..." }, ... }
      if (response.data.status === "success" && response.data.data) {
        // TODO: Verify the actual token response structure from backend
        // This is a placeholder - update based on actual /auth/token/ response
        const tokenData = response.data.data as any;
        const accessToken =
          tokenData.token || tokenData.accessToken || tokenData;

        if (!accessToken || typeof accessToken !== "string") {
          throw new ApiClientError({
            status: "error",
            message: "Invalid token in response",
            response_code: 500,
            data: {},
          });
        }

        // Update stored token
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, accessToken);

        // TODO: Update expiry time if backend provides it
        // For now, tokens might not expire (backend-dependent)
        const expiresIn = tokenData.expiresIn || 3600; // Default 1 hour
        if (expiresIn) {
          const expiryTime = Date.now() + expiresIn * 1000;
          await AsyncStorage.setItem(
            STORAGE_KEYS.TOKEN_EXPIRY,
            expiryTime.toString()
          );
        }

        return accessToken;
      }

      throw new ApiClientError({
        status: "error",
        message: "Token refresh failed",
        response_code: response.data.response_code || 500,
        data: {},
      });
    } catch (error) {
      // If refresh fails, clear all tokens
      await this.clearTokens();
      throw error;
    }
  }

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  /**
   * Handle and transform API errors
   *
   * Backend returns errors in the same format as success responses:
   * { status: "error", message: "...", response_code: 404, data: {} }
   */
  private handleError(error: AxiosError): ApiClientError {
    // Network error (no response from server)
    if (!error.response) {
      return new ApiClientError({
        status: "error",
        message: "Network error. Please check your internet connection.",
        response_code: 0,
        data: {},
      });
    }

    // Server responded with error
    const status = error.response.status;
    const data = error.response.data as any;

    // Backend returns errors in standard format
    // If it's already in the correct format, use it
    if (data?.status === "error") {
      return new ApiClientError(data as ApiError);
    }

    // Fallback: construct error from HTTP response
    const errorData: ApiError = {
      status: "error",
      message: data?.message || error.message || "An error occurred",
      response_code: status,
      data: data?.data || {},
    };

    return new ApiClientError(errorData);
  }

  // ==========================================================================
  // REQUEST METHODS WITH RETRY LOGIC
  // ==========================================================================

  /**
   * Execute request with retry logic
   */
  private async requestWithRetry<T>(
    requestFn: () => Promise<T>,
    maxRetries = 3
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;

        // Don't retry on 4xx errors (client errors)
        if (error instanceof ApiClientError && error.responseCode) {
          if (error.responseCode >= 400 && error.responseCode < 500) {
            throw error;
          }
        }

        // Don't retry on last attempt
        if (attempt === maxRetries - 1) {
          break;
        }

        // Exponential backoff: wait 2^attempt seconds
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  // ==========================================================================
  // PUBLIC API METHODS
  // ==========================================================================

  /**
   * GET request
   */
  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.requestWithRetry(async () => {
      const response = await this.client.get<ApiResponse<T>>(url, config);
      return response.data;
    });
  }

  /**
   * POST request
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.requestWithRetry(async () => {
      const response = await this.client.post<ApiResponse<T>>(
        url,
        data,
        config
      );
      return response.data;
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.requestWithRetry(async () => {
      const response = await this.client.put<ApiResponse<T>>(url, data, config);
      return response.data;
    });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.requestWithRetry(async () => {
      const response = await this.client.patch<ApiResponse<T>>(
        url,
        data,
        config
      );
      return response.data;
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.requestWithRetry(async () => {
      const response = await this.client.delete<ApiResponse<T>>(url, config);
      return response.data;
    });
  }

  /**
   * Upload file (multipart/form-data)
   */
  async upload<T = any>(
    url: string,
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    return this.requestWithRetry(async () => {
      const response = await this.client.post<ApiResponse<T>>(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            onProgress(progress);
          }
        },
      });
      return response.data;
    });
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const api = new ApiClient();

// Export types for use in other files
// export type { ApiResponse, ApiError, PaginatedResponse, TokenResponse };
