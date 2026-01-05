/**
 * API Usage Examples
 *
 * This file demonstrates how to use the API client.
 * These are examples - DO NOT import this file in production code.
 */

import { api } from "./api";
import {
  RequestVerificationCodeRequest,
  VerifyCodeRequest,
  RequestMeetingRequest,
} from "./api.types";
import { handleApiError, createFormData } from "./api.helpers";

// ============================================================================
// EXAMPLE 1: Authentication Flow
// ============================================================================

export async function exampleRequestVerificationCode(email: string) {
  try {
    const response = await api.post<RequestVerificationCodeRequest>(
      "/auth/request-verification-code",
      { email }
    );

    if (response.success) {
      console.log("Verification code sent!");
      return response.data;
    }
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function exampleVerifyCode(email: string, code: string) {
  try {
    const response = await api.post<VerifyCodeRequest>("/auth/verify-code", {
      email,
      code,
    });

    if (response.success && response.data) {
      // Store tokens
      await api.setTokens(response.data.tokens);

      // Return user data
      return response.data.user;
    }
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 2: Get User Profile
// ============================================================================

export async function exampleGetUserProfile() {
  try {
    const response = await api.get("/user/profile");

    if (response.success && response.data) {
      return response.data;
    }
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 3: Request Meeting
// ============================================================================

export async function exampleRequestMeeting(
  meetingData: RequestMeetingRequest
) {
  try {
    const response = await api.post<RequestMeetingRequest>(
      "/meetings",
      meetingData
    );

    if (response.success) {
      console.log("Meeting requested successfully!");
      return response.data;
    }
  } catch (error) {
    handleApiError(error, {
      VALIDATION_ERROR: "Please check your meeting details and try again.",
      NOT_FOUND: "The participant could not be found.",
    });
    throw error;
  }
}

// ============================================================================
// EXAMPLE 4: Upload Avatar
// ============================================================================

export async function exampleUploadAvatar(imageUri: string) {
  try {
    const formData = createFormData(imageUri, "file", {
      type: "avatar",
    });

    const response = await api.upload(
      "/user/profile/avatar",
      formData,
      (progress) => {
        console.log(`Upload progress: ${progress.toFixed(0)}%`);
      }
    );

    if (response.success && response.data) {
      return response.data.avatarUrl;
    }
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 5: Get Meetings with Pagination
// ============================================================================

export async function exampleGetMeetings(
  type: "requests" | "scheduled" | "cancelled",
  page: number = 1,
  limit: number = 20
) {
  try {
    const response = await api.get("/meetings", {
      params: {
        type,
        page,
        limit,
      },
    });

    if (response.success && response.data) {
      return response.data;
    }
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 6: Logout
// ============================================================================

export async function exampleLogout() {
  try {
    await api.post("/auth/logout");
    await api.clearTokens();
    console.log("Logged out successfully");
  } catch (error) {
    // Even if logout fails, clear tokens locally
    await api.clearTokens();
    handleApiError(error);
  }
}
