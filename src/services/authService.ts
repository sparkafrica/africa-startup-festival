/**
 * Authentication Service
 *
 * Service layer for authentication-related API calls.
 * This wraps the API client with domain-specific methods.
 *
 * Benefits:
 * - Centralizes auth logic
 * - Easy to test and mock
 * - Clean interface for AuthContext and screens
 * - Type-safe method signatures
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";
import { ApiResponse, ApiClientError, TokenResponse } from "./api";
import { ENV } from "../config/env";

const PROFILE_DEBUG_KEY = "@spark:profile_debug";

async function saveProfileDebug(payload: Record<string, unknown>) {
  try {
    await AsyncStorage.setItem(
      PROFILE_DEBUG_KEY,
      JSON.stringify({ ...payload, timestamp: new Date().toISOString() })
    );
  } catch {
    // ignore
  }
}

export async function getProfileDebug(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PROFILE_DEBUG_KEY);
  } catch {
    return null;
  }
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Request OTP Request
 * Matches backend schema: OTPRequestRequest
 */
export interface RequestOTPRequest {
  email: string;
  event_id?: number; // Optional event ID for email template
}

/**
 * Verify OTP Request
 * Matches backend schema: OTPVerificationRequest
 */
export interface VerifyOTPRequest {
  email: string;
  otp: string; // 6-digit OTP code
}

/**
 * Token Response Structure
 * The YAML says "No response body" but description says it returns a token.
 */
export interface AuthTokenResponse {
  token: string;
  expires_in?: number;
}

/**
 * Company Response
 * Matches backend schema: Company
 * Note: This is a placeholder structure based on YAML schema
 * TODO: Verify actual Company structure from backend when available
 */
export interface Company {
  id: number;
  name: string;
  contact_person?: string;
  country?: string;
  email?: string;
  phone?: string;
  company_sector?: string;
  company_description?: string;
  logo?: string | null;
  group_photo?: string | null;
  metadata?: any;
  company_type?: string;
  admin_user?: string | null; // User ID of the company admin
  event_id?: number; // Event ID associated with the company
  // Add other fields as needed based on Company schema
}

/**
 * User Profile Response
 * Matches backend schema: CustomUserDetails
 */
export interface UserProfile {
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile_pic?: string | null;
  bio?: string | null;
  address?: string;
  country?: string;
  phone_number?: string;
  job_title?: string;
  metadata?: any; // User metadata (interests, linkedIn, etc.)
  company?: Company | null; // Company field from backend (nullable)
  // Add other fields as needed based on CustomUserDetails schema
}

/** Normalize API response to UserProfile. Handles both wrapped ({ status, data }) and unwrapped (user object) formats. */
function toUserProfile(response: any): UserProfile {
  if (response?.user_id != null || response?.email != null) {
    return response as UserProfile;
  }
  if (response?.status === "success" && response?.data != null) {
    return response.data as UserProfile;
  }
  throw new ApiClientError({
    status: "error",
    message: response?.message || "Invalid profile response",
    response_code: response?.response_code ?? 500,
    data: {},
  });
}

// ============================================================================
// AUTHENTICATION SERVICE
// ============================================================================

export const authService = {
  /**
   * Request OTP (One-Time Password) for login
   *
   * @param email - User's email address
   * @param eventId - Optional event ID for email template
   * @returns Promise that resolves when OTP is sent
   *
   * Backend Endpoint: POST /auth/email/
   */
  async requestOTP(
    email: string,
    eventId?: number
  ): Promise<{ message: string }> {
    const requestData: RequestOTPRequest = { email };
    if (eventId) {
      requestData.event_id = eventId;
    }

    const response = await api.post<RequestOTPRequest>(
      "/auth/email/",
      requestData
    );

    // Backend response format: { status: "success", message: "...", response_code: 200, data: {} }
    if (response.status === "success") {
      return {
        message: response.message || "OTP sent successfully",
      };
    }

    // If status is not success, throw error
    throw new ApiClientError({
      status: "error",
      message: response.message || "Failed to send OTP",
      response_code: response.response_code,
      data: {},
    });
  },

  /**
   * Verify OTP and get authentication token
   *
   * Service layer handles token storage automatically.
   * The token is stored in the API client for use in subsequent requests.
   *
   * @param email - User's email address
   * @param otp - 6-digit OTP code (use "000000" for test accounts)
   * @returns Promise that resolves when token is verified and stored
   *
   * Backend Endpoint: POST /auth/token/
   *
   * YAML: description says "Verify the OTP and return database-stored authentication token".
   * Response schema in YAML says "No response body" but the backend does return a token (in response.data).
   * There is no /auth/refresh in the spec — backend uses a single token; we store refresh_token only if sent.
   */
  async verifyOTP(email: string, otp: string): Promise<void> {
    const requestData: VerifyOTPRequest = { email, otp };

    const response = await api.post<VerifyOTPRequest>(
      "/auth/token/",
      requestData
    );

    if (response.status === "success") {
      // TODO: Verify the actual response structure
      // The YAML documentation says "No response body" but description says token is returned
      // Common patterns:
      // 1. Token in response.data.token
      // 2. Token in response.data
      // 3. Token in response.headers (unlikely for this API)

      const data = response.data as any;

      const token = data?.token || data?.accessToken || data?.authToken || data;
      const expiresIn =
        typeof data?.expires_in === "number"
          ? data.expires_in
          : typeof data?.expiresIn === "number"
          ? data.expiresIn
          : 3600;

      if (!token || typeof token !== "string") {
        throw new ApiClientError({
          status: "error",
          message: "Invalid token in response",
          response_code: 500,
          data: {},
        });
      }

      await api.setTokens({
        accessToken: token,
        expiresIn,
      });

      return;
    }

    // If status is not success, throw error
    throw new ApiClientError({
      status: "error",
      message: response.message || "OTP verification failed",
      response_code: response.response_code,
      data: {},
    });
  },

  /**
   * Logout the authenticated user
   *
   * Service layer handles token clearing after backend logout.
   * Note: AuthContext will also call api.clearTokens() to ensure cleanup,
   * but we handle it here for complete service layer encapsulation.
   *
   * @returns Promise that resolves when logout is complete
   *
   * Backend Endpoint: POST /auth/logout/
   */
  async logout(): Promise<void> {
    const response = await api.post("/auth/logout/");

    if (response.status === "success") {
      // Clear tokens from API client (service layer handles token storage)
      await api.clearTokens();
      return;
    }

    // Even if logout fails on backend, clear local tokens anyway
    await api.clearTokens();
    throw new ApiClientError({
      status: "error",
      message: response.message || "Logout failed",
      response_code: response.response_code,
      data: {},
    });
  },

  /**
   * Get authenticated user's profile
   *
   * @returns Promise that resolves with user profile data
   *
   * Backend Endpoint: GET /auth/user/
   */
  async getCurrentUser(): Promise<UserProfile> {
    const url = `${ENV.BASE_URL}/auth/user/`;
    const token = await api.getToken();
    const hasToken = !!token;

    try {
      const response = await api.get<any>("/auth/user/");
      await saveProfileDebug({
        endpoint: "GET /auth/user/",
        url,
        hasToken,
        outcome: "success",
        responsePreview: JSON.stringify(response).slice(0, 600),
      });
      return toUserProfile(response);
    } catch (e: any) {
      await saveProfileDebug({
        endpoint: "GET /auth/user/",
        url,
        hasToken,
        outcome: "error",
        statusCode: e?.responseCode ?? e?.response_code,
        message: e?.message,
        dataPreview: JSON.stringify(e?.data ?? {}).slice(0, 400),
      });
      if (e instanceof ApiClientError) throw e;
      throw new ApiClientError({
        status: "error",
        message: e?.message || "Failed to get user profile",
        response_code: e?.response_code ?? e?.responseCode ?? 500,
        data: e?.data ?? {},
      });
    }
  },

  /**
   * Update authenticated user's profile
   *
   * @param profileData - Partial user profile data to update
   * @returns Promise that resolves with updated user profile
   *
   * Backend Endpoint: PUT /auth/user/
   */
  async updateProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
    const url = `${ENV.BASE_URL}/auth/user/`;
    const token = await api.getToken();
    const hasToken = !!token;

    try {
      const response = await api.put<any>("/auth/user/", profileData);
      await saveProfileDebug({
        endpoint: "PUT /auth/user/",
        url,
        hasToken,
        outcome: "success",
        responsePreview: JSON.stringify(response).slice(0, 600),
      });
      return toUserProfile(response);
    } catch (e: any) {
      await saveProfileDebug({
        endpoint: "PUT /auth/user/",
        url,
        hasToken,
        outcome: "error",
        statusCode: e?.responseCode ?? e?.response_code,
        message: e?.message,
        dataPreview: JSON.stringify(e?.data ?? {}).slice(0, 400),
      });
      if (e instanceof ApiClientError) throw e;
      throw new ApiClientError({
        status: "error",
        message: e?.message || "Failed to update profile",
        response_code: e?.response_code ?? e?.responseCode ?? 500,
        data: e?.data ?? {},
      });
    }
  },

  /**
   * Upload profile picture
   *
   * @param imageUri - Local URI of the selected image
   * @returns Promise that resolves with updated user profile
   *
   * Backend Endpoint: PATCH /auth/user/
   * Content-Type: multipart/form-data (automatically set by axios for FormData)
   */
  async uploadProfilePicture(imageUri: string): Promise<UserProfile> {
    // Create FormData for multipart/form-data upload
    const formData = new FormData();
    
    // Extract filename from URI (fallback to 'photo.jpg' if not available)
    const filename = imageUri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    // Append the image file
    // React Native FormData format: { uri, name, type }
    formData.append('profile_pic', {
      uri: imageUri,
      name: filename,
      type: type,
    } as any);

    // Use PATCH endpoint with FormData
    // Axios automatically detects FormData and sets Content-Type to multipart/form-data with boundary
    // Use longer timeout for uploads (60s) to avoid ECONNABORTED on slow connections or larger images
    try {
      const response = await api.patch<any>("/auth/user/", formData, {
        timeout: 60_000,
      });
      return toUserProfile(response);
    } catch (e: any) {
      if (e instanceof ApiClientError) throw e;
      throw new ApiClientError({
        status: "error",
        message: e?.message || "Failed to upload profile picture",
        response_code: e?.response_code ?? e?.responseCode ?? 500,
        data: e?.data ?? {},
      });
    }
  },

  /**
   * Remove profile picture
   *
   * @returns Promise that resolves with updated user profile
   *
   * Backend Endpoint: PATCH /auth/user/
   */
  async removeProfilePicture(): Promise<UserProfile> {
    try {
      const response = await api.patch<any>("/auth/user/", {
        profile_pic: null,
      });
      return toUserProfile(response);
    } catch (e: any) {
      if (e instanceof ApiClientError) throw e;
      throw new ApiClientError({
        status: "error",
        message: e?.message || "Failed to remove profile picture",
        response_code: e?.response_code ?? e?.responseCode ?? 500,
        data: e?.data ?? {},
      });
    }
  },
};
