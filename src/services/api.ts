/**
 * API Client - Production-Ready HTTP Client
 *
 * Features:
 * - Automatic token management
 * - 401 → clear session and log out (backend does not support refresh)
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
import * as Sentry from "@sentry/react-native";
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
  TOKEN_EXPIRY: "@spark:token_expiry",
} as const;

// ============================================================================
// API CLIENT CLASS
// ============================================================================

class ApiClient {
  private client: AxiosInstance;
  private onSessionExpired: (() => void) | null = null;

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

        // Breadcrumb for Sentry (no request/response bodies or tokens)
        Sentry.addBreadcrumb({
          category: "api",
          message: `${config.method?.toUpperCase() ?? "GET"} ${config.url ?? ""}`,
          level: "info",
        });

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response Interceptor - Handle errors and token refresh
    this.client.interceptors.response.use(
      (response) => {
        // Response logged only in development if needed for debugging
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // Handle 401 Unauthorized – backend does not support refresh; clear session and log out
        // Exception: /auth/user/ profile endpoints – don't log out on 401 so save flow can show
        // "Profile saved but photo could not be updated" instead of forcing full re-login
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const url = originalRequest?.url ?? '';
          const isProfileEndpoint = url.includes('/auth/user/');
          await this.clearTokens();
          if (!isProfileEndpoint) {
            this.onSessionExpired?.();
          }
          const handledError = this.handleError(error);
          Sentry.addBreadcrumb({
            category: "api",
            message: `API Error: ${url}`,
            data: { status: 401, message: handledError.message },
            level: "error",
          });
          return Promise.reject(handledError);
        }

        // Handle other errors
        const handledError = this.handleError(error);
        Sentry.addBreadcrumb({
          category: "api",
          message: `API Error: ${originalRequest?.url ?? "unknown"}`,
          data: {
            status: error.response?.status,
            message: handledError.message,
          },
          level: "error",
        });
        return Promise.reject(handledError);
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
   * Register a callback when session expires (e.g. 401 from backend).
   * AuthContext should set this to clear user state and redirect to login.
   */
  setOnSessionExpired(callback: (() => void) | null): void {
    this.onSessionExpired = callback;
  }

  /**
   * Clear all stored tokens
   */
  async clearTokens(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TOKEN,
      STORAGE_KEYS.TOKEN_EXPIRY,
    ]);
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
    // No response from server (timeout, network failure, connection refused, etc.)
    if (!error.response) {
      const code = error.code;
      const axiosMessage = error.message;
      let message: string;

      if (code === "ECONNABORTED" || code === "ETIMEDOUT") {
        message =
          "The request took too long, Check your connection and try again.";
      } else if (code === "ERR_NETWORK") {
        message =
          "Network error. Please check your internet connection.";
      } else {
        message =
          "Request failed. Please check your internet connection and try again.";
      }

      return new ApiClientError({
        status: "error",
        message,
        response_code: 0,
        data: { _code: code, _axiosMessage: axiosMessage },
      });
    }

    // Server responded with error
    const status = error.response.status;
    const data = error.response.data as any;

    // Backend returns errors in standard format
    // If it's already in the correct format, extract non_field_errors first
    if (data?.status === "error") {
      let errorMessage: string = typeof data?.message === "string" ? data.message : "";
      
      // Extract non_field_errors FIRST before using generic message
      // Backend may nest under message: data.message.non_field_errors
      const nonFieldErrors = 
        (data as any)?.non_field_errors || 
        (data as any)?.message?.non_field_errors ||
        (data as any)?.data?.non_field_errors || 
        (data as any)?.data?.data?.non_field_errors;
      
      if (nonFieldErrors) {
        if (Array.isArray(nonFieldErrors) && nonFieldErrors.length > 0) {
          const first = nonFieldErrors[0];
          errorMessage = typeof first === "string" ? first : JSON.stringify(first);
        } else if (typeof nonFieldErrors === "string") {
          errorMessage = nonFieldErrors;
        }
      }

      // Create error with extracted message
      return new ApiClientError({
        status: "error",
        message: errorMessage,
        response_code: status,
        data: data.data || data,
      });
    }

    // Extract error message from various possible formats
    let errorMessage: string = "An error occurred";
    let errorDetails: any = {};
    
    // Check for non_field_errors FIRST (they take priority over generic messages)
    // Check at different nesting levels (include data.message.non_field_errors)
    const nonFieldErrors = 
      (data as any)?.non_field_errors || 
      (data as any)?.message?.non_field_errors ||
      (data as any)?.data?.non_field_errors || 
      (data as any)?.data?.data?.non_field_errors;
    
    if (nonFieldErrors && Array.isArray(nonFieldErrors) && nonFieldErrors.length > 0) {
      const first = nonFieldErrors[0];
      errorMessage = typeof first === "string" ? first : JSON.stringify(first);
    } else if (nonFieldErrors && typeof nonFieldErrors === "string") {
      errorMessage = nonFieldErrors;
    } else if (data?.message && typeof data.message === "string") {
      errorMessage = data.message;
    } else if (data?.error) {
      errorMessage = typeof data.error === "string" ? data.error : JSON.stringify(data.error);
    } else if (data?.detail) {
      errorMessage = data.detail;
    } else if (typeof data === "string") {
      // Handle Django debug page HTML - extract just the error message
      const htmlString = data;
      // Check if it's a 404 "Page not found" error
      const notFoundMatch = htmlString.match(/<title>([^<]*not found[^<]*)<\/title>/i);
      if (notFoundMatch && status === 404) {
        errorMessage = `Endpoint not found (404). The requested endpoint may not be deployed yet.`;
      } else {
        // Try to extract Exception Type and Exception Value from Django debug page
        const exceptionTypeMatch = htmlString.match(/Exception Type:\s*([^\n<]+)/);
        const exceptionValueMatch = htmlString.match(/Exception Value:\s*([^\n<]+)/);
        if (exceptionTypeMatch && exceptionValueMatch) {
          errorMessage = `${exceptionTypeMatch[1].trim()}: ${exceptionValueMatch[1].trim()}`;
        } else {
          // If it's HTML but we can't parse it, use a generic message
          errorMessage = "Server error occurred";
        }
      }
    } else if (error.message) {
      errorMessage = error.message;
    } else if (status >= 500) {
      // Fallback for 5xx errors
      errorMessage = `Server error (${status}). The server is temporarily unavailable. Please try again later.`;
    }

    // Include error data for debugging (but avoid huge HTML strings)
    // Preserve the full structure to allow nested non_field_errors extraction
    if (data && typeof data === "object") {
      errorDetails = data;
      // Also check if we have nested non_field_errors that weren't extracted yet
      if (!errorMessage.includes("already have") && !errorMessage.includes("pending")) {
        const nestedNonFieldErrors = 
          (data as any)?.non_field_errors || 
          (data as any)?.message?.non_field_errors ||
          (data as any)?.data?.non_field_errors || 
          (data as any)?.data?.data?.non_field_errors;
        if (nestedNonFieldErrors && Array.isArray(nestedNonFieldErrors) && nestedNonFieldErrors.length > 0) {
          // Only override if we don't have a meaningful message yet
          if (errorMessage === "An error occurred" || errorMessage === data?.message) {
            const first = nestedNonFieldErrors[0];
            errorMessage = typeof first === "string" ? first : JSON.stringify(first);
          }
        }
      }
    } else if (typeof data === "string") {
      if (data.length > 1000) {
        // For large strings, just store a summary
        errorDetails = { 
          _truncated: true,
          length: data.length,
          preview: data.substring(0, 200) + "..."
        };
      } else {
        errorDetails = { message: data };
      }
    }

    // Fallback: construct error from HTTP response
    const errorData: ApiError = {
      status: "error",
      message: errorMessage,
      response_code: status,
      data: errorDetails,
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

        // Don't retry on no-response (ERR_NETWORK, timeouts, etc.)
        // Immediate retries rarely help; often backend/proxy or client config issue.
        if (error instanceof ApiClientError && error.responseCode === 0) {
          throw error;
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
   * 
   * Note: DELETE requests may return 204 No Content with no response body.
   * In such cases, response.data will be empty/undefined.
   */
  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.requestWithRetry(async () => {
      const response = await this.client.delete<ApiResponse<T>>(url, config);
      // For 204 No Content, response.data may be empty/undefined
      // Return a minimal success response structure
      if (response.status === 204 || !response.data) {
        return {
          status: "success",
          message: "Deleted successfully",
          response_code: 204,
          data: undefined as any,
        } as ApiResponse<T>;
      }
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
